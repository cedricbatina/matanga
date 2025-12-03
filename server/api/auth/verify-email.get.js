// server/api/auth/verify-email.get.js
import { defineEventHandler, getQuery } from "h3";
import { query, transaction } from "../../utils/db.js";
import { logError, logInfo } from "../../utils/logger.js";

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event) || {};
  const requestId = Math.random().toString(36).slice(2, 10);

  if (!token || typeof token !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Token de vérification manquant",
    });
  }

  logInfo("Verify-email attempt", {
    token,
    requestId,
  });

  try {
    // On récupère le token
    const rows = await query(
      `
        SELECT evt.id, evt.user_id, evt.expires_at, evt.used_at,
               u.status AS user_status
        FROM email_verification_tokens evt
        JOIN users u ON u.id = evt.user_id
        WHERE evt.token = ?
        LIMIT 1
      `,
      [token],
      { requestId }
    );

    if (rows.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Token de vérification invalide",
      });
    }

    const record = rows[0];

    if (record.used_at) {
      throw createError({
        statusCode: 400,
        statusMessage: "Ce lien de vérification a déjà été utilisé",
      });
    }

    const now = new Date();
    const expiresAt = new Date(record.expires_at);

    if (expiresAt.getTime() < now.getTime()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Ce lien de vérification a expiré",
      });
    }

    // Transaction: marquer le token utilisé + activer le compte
    await transaction(
      async (tx) => {
        // Marquer le token comme utilisé
        await tx.query(
          "UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?",
          [record.id]
        );

        // Activer l'utilisateur si pas déjà actif
        if (record.user_status !== "active") {
          await tx.query(
            "UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ?",
            [record.user_id]
          );
        }
      },
      { requestId, userId: record.user_id }
    );

    logInfo("Verify-email success", {
      userId: record.user_id,
      requestId,
    });

    // Ici tu peux choisir :
    // - soit renvoyer du JSON (API pure)
    // - soit rediriger vers une page front /verify-email/success
    // Je te propose une réponse JSON simple pour commencer.

    return {
      ok: true,
      message:
        "Votre email a été vérifié. Vous pouvez maintenant vous connecter.",
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }

    logError("Verify-email failed", {
      error: err.message,
      stack: err.stack,
      token,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors de la vérification de l’email",
    });
  }
});
