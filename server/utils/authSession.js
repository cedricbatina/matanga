// server/utils/authSession.js
import { getCookie } from "h3";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  accessTokenMaxAge,
  refreshTokenMaxAge,
} from "./jwt.js";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  setAuthCookies,
  clearAuthCookies,
} from "./authCookies.js";
import { query, transaction } from "./db.js";
import { logDebug, logError, logInfo } from "./logger.js";

/**
 * Construit l'objet "session" à partir des infos user DB
 */
async function buildSessionFromUserId(userId, requestId) {
  const rows = await query(
    `
    SELECT 
      u.id,
      u.email,
      u.account_type,
      u.status,
      u.city,
      u.country,
      u.preferred_locale,
      GROUP_CONCAT(r.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.id = ?
    GROUP BY u.id
    LIMIT 1
    `,
    [userId],
    { requestId, userId }
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];

  if (user.status !== "active") {
    // On ne construit pas de session si le compte n'est plus actif
    return null;
  }

  const roles = user.roles ? user.roles.split(",") : [];

  const session = {
    userId: user.id,
    email: user.email,
    accountType: user.account_type,
    roles,
    city: user.city,
    country: user.country,
    locale: user.preferred_locale,
  };

  return session;
}

/**
 * Récupère (et éventuellement rafraîchit) la session à partir des cookies.
 * - Retourne null si non authentifié.
 * - Met event.context.auth = session ou null.
 */
export async function getAuthSession(event) {
  // Si déjà hydraté (par ex dans un middleware précédent), on renvoie tel quel
  if (event.context && event.context.auth !== undefined) {
    return event.context.auth;
  }

  const requestId =
    event.context?.requestId || Math.random().toString(36).slice(2, 10);

  const accessToken = getCookie(event, ACCESS_COOKIE_NAME);
  const refreshToken = getCookie(event, REFRESH_COOKIE_NAME);

  logDebug("AuthSession: reading cookies", {
    requestId,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
  });

  // Helper interne pour setter context et retourner
  const setSession = (session) => {
    if (!event.context) event.context = {};
    event.context.auth = session || null;
    return event.context.auth;
  };

  // Aucun token = pas connecté
  if (!accessToken && !refreshToken) {
    return setSession(null);
  }

  // 1) Essayer de valider l'access token
  if (accessToken) {
    const decoded = verifyAccessToken(accessToken);
    if (decoded && decoded.sub) {
      // On peut se contenter du payload pour éviter une requête DB à chaque requête
      const session = {
        userId: decoded.sub,
        email: decoded.email,
        accountType: decoded.at,
        roles: decoded.roles || [],
        // city / country / locale facultatifs, si tu veux les inclure dans le payload plus tard
      };
      logDebug("AuthSession: access token valid", {
        requestId,
        userId: session.userId,
      });
      return setSession(session);
    }
  }

  // 2) Access invalide ou absent, mais refresh présent -> tenter un refresh silencieux
  if (!refreshToken) {
    // Access invalide ET pas de refresh = non authentifié
    clearAuthCookies(event);
    return setSession(null);
  }

  // Vérifier le refresh JWT
  const refreshDecoded = verifyRefreshToken(refreshToken);
  if (!refreshDecoded || !refreshDecoded.sub) {
    logDebug("AuthSession: invalid refresh token (JWT)", { requestId });
    clearAuthCookies(event);
    return setSession(null);
  }

  const userId = refreshDecoded.sub;

  try {
    // Vérifier en DB que ce refreshToken existe, pas révoqué, pas expiré
    const rows = await query(
      `
      SELECT id, user_id, expires_at, revoked_at
      FROM refresh_tokens
      WHERE token = ?
      LIMIT 1
      `,
      [refreshToken],
      { requestId, userId }
    );

    if (rows.length === 0) {
      logDebug("AuthSession: refresh token not found in DB", {
        requestId,
        userId,
      });
      clearAuthCookies(event);
      return setSession(null);
    }

    const dbToken = rows[0];
    const now = new Date();
    const expiresAt = new Date(dbToken.expires_at);

    if (dbToken.revoked_at || expiresAt.getTime() < now.getTime()) {
      logDebug("AuthSession: refresh token revoked or expired", {
        requestId,
        userId,
      });
      clearAuthCookies(event);
      return setSession(null);
    }

    // Tout est OK, on peut rafraîchir : rotation du refresh token + nouveau access token
    const sessionUser = await buildSessionFromUserId(userId, requestId);
    if (!sessionUser) {
      clearAuthCookies(event);
      return setSession(null);
    }

    const newAccessPayload = {
      sub: sessionUser.userId,
      email: sessionUser.email,
      at: sessionUser.accountType,
      roles: sessionUser.roles,
    };
    const newRefreshPayload = {
      sub: sessionUser.userId,
      roles: sessionUser.roles,
    };

    const newAccessToken = signAccessToken(newAccessPayload);
    const newRefreshToken = signRefreshToken(newRefreshPayload);

    const refreshExpiresAt = new Date(
      now.getTime() + refreshTokenMaxAge * 1000
    );

    // Rotation en DB
    await transaction(
      async (tx) => {
        // Révoquer l'ancien
        await tx.query(
          `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE token = ?
        `,
          [refreshToken]
        );

        // Insérer le nouveau
        await tx.query(
          `
        INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, NOW())
        `,
          [
            sessionUser.userId,
            newRefreshToken,
            refreshExpiresAt.toISOString().slice(0, 19).replace("T", " "),
          ]
        );
      },
      { requestId, userId: sessionUser.userId }
    );

    // Mettre à jour les cookies côté client
    setAuthCookies(
      event,
      newAccessToken,
      newRefreshToken,
      accessTokenMaxAge,
      refreshTokenMaxAge
    );

    logInfo("AuthSession: tokens refreshed", {
      requestId,
      userId: sessionUser.userId,
    });

    return setSession(sessionUser);
  } catch (err) {
    logError("AuthSession: error during refresh", {
      requestId,
      userId,
      error: err.message,
    });
    clearAuthCookies(event);
    return setSession(null);
  }
}

/**
 * Utilitaire pour les routes API protégées.
 * options:
 *  - roles?: array de rôles requis (ex: ['admin'], ['moderator', 'admin'])
 */
export async function requireAuth(event, options = {}) {
  const session = await getAuthSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentification requise",
    });
  }

  if (
    options.roles &&
    Array.isArray(options.roles) &&
    options.roles.length > 0
  ) {
    const hasRole = session.roles?.some((r) => options.roles.includes(r));
    if (!hasRole) {
      throw createError({
        statusCode: 403,
        statusMessage: "Accès refusé",
      });
    }
  }

  return session;
}
