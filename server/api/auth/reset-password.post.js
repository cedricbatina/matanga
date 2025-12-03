// server/api/auth/reset-password.post.js
import { defineEventHandler, readBody, createError } from "h3";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { query, transaction } from "../../utils/db.js";
import { logError, logInfo } from "../../utils/logger.js";
import { clearAuthCookies } from "../../utils/authCookies.js";

const PASSWORD_MIN_LENGTH = 8;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { token, newPassword } = body || {};
  const requestId = crypto.randomBytes(8).toString("hex");

  logInfo("Auth reset-password attempt", {
    hasToken: !!token,
    requestId,
  });

  if (!token || typeof token !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Token de réinitialisation manquant",
    });
  }

  if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Mot de passe trop court (min ${PASSWORD_MIN_LENGTH} caractères)`,
    });
  }

  try {
    // Récupérer le token et l'utilisateur
    const rows = await query(
      `
      SELECT prt.id,
             prt.user_id,
             prt.expires_at,
             prt.used_at,
             u.status
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      WHERE prt.token = ?
      LIMIT 1
      `,
      [token],
      { requestId }
    );

    if (rows.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Token de réinitialisation invalide",
      });
    }

    const record = rows[0];
    const now = new Date();
    const expiresAt = new Date(record.expires_at);

    if (record.used_at) {
      throw createError({
        statusCode: 400,
        statusMessage: "Ce lien de réinitialisation a déjà été utilisé",
      });
    }

    if (expiresAt.getTime() < now.getTime()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Ce lien de réinitialisation a expiré",
      });
    }

    if (record.status === "suspended") {
      throw createError({
        statusCode: 403,
        statusMessage: "Compte suspendu. Contactez le support.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Transaction: mettre à jour mdp + marquer token utilisé + révoquer refresh tokens
    await transaction(
      async (tx) => {
        // Update mot de passe
        await tx.query(
          `
        UPDATE users
        SET password_hash = ?, updated_at = NOW()
        WHERE id = ?
        `,
          [passwordHash, record.user_id]
        );

        // Marquer le token comme utilisé
        await tx.query(
          `
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE id = ?
        `,
          [record.id]
        );

        // Révoquer tous les refresh tokens existants pour ce user
        await tx.query(
          `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE user_id = ? AND revoked_at IS NULL
        `,
          [record.user_id]
        );
      },
      { userId: record.user_id, requestId }
    );

    // Par sécurité, on nettoie aussi les cookies pour forcer l'utilisateur à se reconnecter
    clearAuthCookies(event);

    logInfo("Auth reset-password success", {
      userId: record.user_id,
      requestId,
    });

    return {
      ok: true,
      message:
        "Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }

    logError("Auth reset-password failed", {
      error: err.message,
      stack: err.stack,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage:
        "Erreur interne lors de la réinitialisation du mot de passe",
    });
  }
});

