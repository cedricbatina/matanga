// server/api/auth/resend-verification.post.js
import { defineEventHandler, readBody, createError } from "h3";
import crypto from "crypto";
import { query, transaction } from "../../utils/db.js";
import { logError, logInfo } from "../../utils/logger.js";
import { sendEmailVerification } from "../../utils/email.js";

const EMAIL_TOKEN_TTL_HOURS = 24;

function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  let { email } = body || {};
  const requestId = crypto.randomBytes(8).toString("hex");

  email = typeof email === "string" ? email.trim().toLowerCase() : "";

  logInfo("Auth resend-verification attempt", {
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
    // 1. Chercher l'utilisateur
    const users = await query(
      `
      SELECT id, status, account_type
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
      { requestId }
    );

    if (users.length === 0) {
      // Réponse neutre : on ne dit pas si le compte existe ou non
      return {
        ok: true,
        message:
          "Si un compte existe avec cet email et n'est pas encore vérifié, un nouvel email de confirmation a été envoyé.",
      };
    }

    const user = users[0];

    if (user.status === "active") {
      return {
        ok: true,
        message: "Ce compte est déjà activé. Vous pouvez vous connecter.",
      };
    }

    if (user.status === "suspended") {
      throw createError({
        statusCode: 403,
        statusMessage: "Compte suspendu. Contactez le support.",
      });
    }

    // 2. Chercher un token de vérification encore valide
    const now = new Date();
    const tokens = await query(
      `
      SELECT id, token, expires_at, used_at
      FROM email_verification_tokens
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [user.id],
      { requestId }
    );

    let emailToken;
    let expiresAt;

    const latest = tokens[0];

    if (
      latest &&
      !latest.used_at &&
      new Date(latest.expires_at).getTime() > now.getTime()
    ) {
      // On peut réutiliser le dernier token valide
      emailToken = latest.token;
      expiresAt = new Date(latest.expires_at);
      logInfo("Auth resend-verification using existing token", {
        userId: user.id,
        tokenId: latest.id,
        requestId,
      });
    } else {
      // 3. Créer un nouveau token
      emailToken = crypto.randomBytes(32).toString("hex");
      expiresAt = new Date(
        now.getTime() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000
      );

      await transaction(
        async (tx) => {
          await tx.query(
            `
            INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, NOW())
            `,
            [
              user.id,
              emailToken,
              expiresAt.toISOString().slice(0, 19).replace("T", " "),
            ]
          );
        },
        { requestId, userId: user.id }
      );

      logInfo("Auth resend-verification created new token", {
        userId: user.id,
        requestId,
      });
    }

    // 4. Envoyer l'email
    await sendEmailVerification({
      toEmail: email,
      // Ici on n'a pas le nom, donc on envoie sans toName
      toName: null,
      token: emailToken,
    });

    return {
      ok: true,
      message:
        "Un nouvel email de vérification a été envoyé. Pensez à vérifier aussi vos spams.",
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }

    logError("Auth resend-verification failed", {
      error: err.message,
      stack: err.stack,
      email,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors du renvoi de l'email de vérification",
    });
  }
});
