// server/api/auth/logout.post.js
import { defineEventHandler, createError, getCookie } from "h3";
import crypto from "crypto";
import { query } from "../../utils/db.js";
import { logError, logInfo } from "../../utils/logger.js";
import { verifyRefreshToken } from "../../utils/jwt.js";
import {
  clearAuthCookies,
  REFRESH_COOKIE_NAME,
} from "../../utils/authCookies.js";

export default defineEventHandler(async (event) => {
  const requestId = crypto.randomBytes(8).toString("hex");

  // Récupérer le refresh token du cookie
  const refreshToken = getCookie(event, REFRESH_COOKIE_NAME);

  // On prépare un peu de meta pour les logs
  let decoded = null;
  if (refreshToken) {
    decoded = verifyRefreshToken(refreshToken);
  }

  const meta = {
    requestId,
    userId: decoded?.sub,
  };

  logInfo("Auth logout attempt", {
    ...meta,
    hasRefreshToken: !!refreshToken,
  });

  try {
    if (refreshToken) {
      // Révoquer le refresh token en DB (si présent)
      await query(
        `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE token = ?
        `,
        [refreshToken],
        meta
      );
    }

    // Dans tous les cas, on nettoie les cookies côté client
    clearAuthCookies(event);

    logInfo("Auth logout success", meta);

    return {
      ok: true,
      message: "Déconnexion effectuée.",
    };
  } catch (err) {
    logError("Auth logout failed", {
      ...meta,
      error: err.message,
      stack: err.stack,
    });

    // Même en cas d’erreur DB, on nettoie les cookies pour ne pas laisser de session côté client
    clearAuthCookies(event);

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors de la déconnexion",
    });
  }
});
