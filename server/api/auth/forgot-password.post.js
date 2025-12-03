// server/api/auth/forgot-password.post.js
import { defineEventHandler, readBody, createError } from "h3";
import crypto from "crypto";
import bcrypt from "bcrypt"; // pas forcément utile ici, mais souvent nécessaire ailleurs
import { query, transaction } from "../../utils/db.js";
import { logError, logInfo } from "../../utils/logger.js";
import { sendPasswordResetEmail } from "../../utils/email.js";

const RESET_TOKEN_TTL_HOURS = 1;

function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  let { email } = body || {};
  const requestId = crypto.randomBytes(8).toString("hex");

  email = typeof email === "string" ? email.trim().toLowerCase() : "";

  logInfo("Auth forgot-password attempt", {
    email,
    requestId,
  });

  if (!validateEmail(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email invalide",
    });
  }

  try {
    // On cherche l'utilisateur, sans dire au client s'il existe ou pas
    const users = await query(
      `
      SELECT id, email, account_type
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
      { requestId }
    );

    if (users.length === 0) {
      // On répond quand même OK pour ne pas permettre l'énumération
      return {
        ok: true,
        message:
          "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
      };
    }

    const user = users[0];

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000
    );
    const resetToken = crypto.randomBytes(32).toString("hex");

    // On peut éventuellement invalider d'anciens tokens avant d'en créer un nouveau
    await transaction(
      async (tx) => {
        // Optionnel : marquer les anciens tokens comme utilisés/expirés
        await tx.query(
          `
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = ? AND used_at IS NULL AND expires_at < NOW()
        `,
          [user.id]
        );

        // Créer le nouveau token
        await tx.query(
          `
        INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, NOW())
        `,
          [
            user.id,
            resetToken,
            expiresAt.toISOString().slice(0, 19).replace("T", " "),
          ]
        );
      },
      { userId: user.id, requestId }
    );

    // Envoi email
    await sendPasswordResetEmail({
      toEmail: user.email,
      toName: null, // on peut plus tard chercher first_name/last_name si besoin
      token: resetToken,
    });

    logInfo("Auth forgot-password email sent", {
      userId: user.id,
      email: user.email,
      requestId,
    });

    return {
      ok: true,
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    };
  } catch (err) {
    if (err.statusCode) throw err;

    logError("Auth forgot-password failed", {
      error: err.message,
      stack: err.stack,
      email,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors de la demande de réinitialisation",
    });
  }
});
