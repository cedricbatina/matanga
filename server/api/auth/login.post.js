// server/api/auth/login.post.js
import { defineEventHandler, readBody, createError } from "h3";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { query, transaction } from "../../utils/db.js";
import { logError, logInfo } from "../../utils/logger.js";
import {
  signAccessToken,
  signRefreshToken,
  accessTokenMaxAge,
  refreshTokenMaxAge,
} from "../../utils/jwt.js";
import { setAuthCookies } from "../../utils/authCookies.js";

function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  let { email, password } = body || {};
  const requestId = crypto.randomBytes(8).toString("hex");

  email = typeof email === "string" ? email.trim().toLowerCase() : "";

  logInfo("Auth login attempt", {
    email,
    requestId,
  });

  // Validation basique
  if (!validateEmail(email) || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email ou mot de passe invalide",
    });
  }

  try {
    // Récupérer user + rôles
    const rows = await query(
      `
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.account_type,
        u.status,
        u.city,
        u.country,
        u.preferred_locale,
        GROUP_CONCAT(r.name) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.email = ?
      GROUP BY u.id
      LIMIT 1
      `,
      [email],
      { requestId }
    );

    if (rows.length === 0) {
      // on ne dit pas "email inconnu" pour éviter de leak l'info
      throw createError({
        statusCode: 401,
        statusMessage: "Email ou mot de passe incorrect",
      });
    }

    const user = rows[0];

    // Vérifier le statut
    if (user.status === "pending_email_verification") {
      throw createError({
        statusCode: 403,
        statusMessage: "Compte non vérifié. Veuillez vérifier votre email.",
      });
    }

    if (user.status === "suspended") {
      throw createError({
        statusCode: 403,
        statusMessage: "Compte suspendu. Contactez le support.",
      });
    }

    // Vérifier le mot de passe
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      throw createError({
        statusCode: 401,
        statusMessage: "Email ou mot de passe incorrect",
      });
    }

    const roles = user.roles ? user.roles.split(",") : [];

    // Construire le payload JWT
    const accessPayload = {
      sub: user.id,
      email: user.email,
      at: user.account_type, // individual / pro
      roles,
    };

    const refreshPayload = {
      sub: user.id,
      roles,
    };

    const accessToken = signAccessToken(accessPayload);
    const refreshToken = signRefreshToken(refreshPayload);

    // Calcul expiration refresh en date
    const now = new Date();
    const refreshExpiresAt = new Date(
      now.getTime() + refreshTokenMaxAge * 1000
    );

    // Enregistrer le refresh token en DB (transaction simple)
    await transaction(
      async (tx) => {
        const insertSql = `
        INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, NOW())
      `;
        await tx.query(insertSql, [
          user.id,
          refreshToken,
          refreshExpiresAt.toISOString().slice(0, 19).replace("T", " "),
        ]);
      },
      { userId: user.id, requestId }
    );

    // Poser les cookies HttpOnly
    setAuthCookies(
      event,
      accessToken,
      refreshToken,
      accessTokenMaxAge,
      refreshTokenMaxAge
    );

    logInfo("Auth login success", {
      userId: user.id,
      email: user.email,
      roles,
      requestId,
    });

    // Retourner un user "safe" pour le frontend / store
    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        accountType: user.account_type,
        roles,
        city: user.city,
        country: user.country,
        locale: user.preferred_locale,
      },
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }

    logError("Auth login failed", {
      error: err.message,
      stack: err.stack,
      email,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors de la connexion",
    });
  }
});
