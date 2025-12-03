// server/api/auth/register.post.js
import { defineEventHandler, readBody, createError } from "h3";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { query, transaction } from "../../utils/db.js";
import { logError, logInfo } from "../../utils/logger.js";
import { sendEmailVerification } from "../../utils/email.js";

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_TOKEN_TTL_HOURS = 24;

function validateEmail(email) {
  if (!email) return false;
  // regex simple, on ne cherche pas la perfection
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  let {
    email,
    password,
    accountType, // 'individual' ou 'pro'
    city,
    country,
    preferredLocale,
    // champs individuels
    firstName,
    lastName,
    // champs pros
    organizationName,
    organizationType, // 'funeral_home', 'church', 'mosque', 'association', 'other'
    address,
    phone,
    websiteUrl,
  } = body || {};

  const requestId = crypto.randomBytes(8).toString("hex");

  // Normalisation basique
  email = typeof email === "string" ? email.trim().toLowerCase() : "";
  city = typeof city === "string" ? city.trim() : "";
  country = typeof country === "string" ? country.trim() : null;
  preferredLocale = preferredLocale || "fr";
  firstName = firstName?.trim();
  lastName = lastName?.trim();
  organizationName = organizationName?.trim();
  organizationType = organizationType?.trim();
  address = address?.trim();
  phone = phone?.trim();
  websiteUrl = websiteUrl?.trim();

  // Logs d'entrée
  logInfo("Auth register attempt", {
    email,
    accountType,
    city,
    requestId,
  });

  // Validation de base
  if (!validateEmail(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email invalide",
    });
  }

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Mot de passe trop court (min ${PASSWORD_MIN_LENGTH} caractères)`,
    });
  }

  if (!city) {
    throw createError({
      statusCode: 400,
      statusMessage: "La ville est obligatoire",
    });
  }

  if (!accountType || !["individual", "pro"].includes(accountType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Type de compte invalide (individual ou pro)",
    });
  }

  // Validation spécifique selon type
  if (accountType === "individual") {
    if (!firstName || !lastName) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Nom et prénom sont obligatoires pour un compte particulier",
      });
    }
  } else if (accountType === "pro") {
    const allowedOrgTypes = [
      "funeral_home",
      "church",
      "mosque",
      "association",
      "other",
    ];
    if (!organizationName || !organizationType) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Nom et type de structure sont obligatoires pour un compte pro",
      });
    }
    if (!allowedOrgTypes.includes(organizationType)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Type de structure invalide",
      });
    }
  }

  try {
    // Vérifier si l'email existe déjà
    const existing = await query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
      { requestId }
    );

    if (existing.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "Un compte existe déjà avec cet email",
      });
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000
    );
    const emailToken = crypto.randomBytes(32).toString("hex");

    // Transaction: créer user + profil + user_role + token vérif
    const result = await transaction(
      async (tx) => {
        // 1. Créer le user
        const insertUserSql = `
        INSERT INTO users (email, password_hash, account_type, status, city, country, preferred_locale, created_at, updated_at)
        VALUES (?, ?, ?, 'pending_email_verification', ?, ?, ?, NOW(), NOW())
      `;
        const userInsertRes = await tx.query(insertUserSql, [
          email,
          passwordHash,
          accountType,
          city,
          country || null,
          preferredLocale || "fr",
        ]);

        const userId = userInsertRes.insertId;

        // 2. Créer le profil spécifique
        if (accountType === "individual") {
          const insertProfileSql = `
          INSERT INTO user_individual_profiles (user_id, first_name, last_name, phone)
          VALUES (?, ?, ?, ?)
        `;
          await tx.query(insertProfileSql, [
            userId,
            firstName,
            lastName,
            phone || null,
          ]);
        } else {
          const insertProProfileSql = `
          INSERT INTO user_pro_profiles (
            user_id, organization_name, organization_type,
            address, city, country, phone, website_url, verification_status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;
          await tx.query(insertProProfileSql, [
            userId,
            organizationName,
            organizationType,
            address || null,
            city,
            country || null,
            phone || null,
            websiteUrl || null,
          ]);
        }

        // 3. Rôle par défaut
        const roleName =
          accountType === "individual" ? "user_individual" : "user_pro";
        const roleRows = await tx.query(
          "SELECT id FROM roles WHERE name = ? LIMIT 1",
          [roleName]
        );

        if (roleRows.length === 0) {
          throw new Error(
            `Role ${roleName} introuvable. Pense à insérer les rôles dans la table roles.`
          );
        }

        const roleId = roleRows[0].id;

        await tx.query(
          "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
          [userId, roleId]
        );

        // 4. Token de vérification email
        const insertTokenSql = `
        INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, NOW())
      `;
        await tx.query(insertTokenSql, [
          userId,
          emailToken,
          expiresAt.toISOString().slice(0, 19).replace("T", " "),
        ]);

        return { userId };
      },
      { requestId }
    );

    // Envoi de l'email de vérification
    await sendEmailVerification({
      toEmail: email,
      toName:
        accountType === "individual"
          ? `${firstName || ""} ${lastName || ""}`.trim() || null
          : organizationName || null,
      token: emailToken,
    });

    logInfo("Auth register success, verification email sent", {
      userId: result.userId,
      email,
      accountType,
      requestId,
    });

    return {
      ok: true,
      message: "Compte créé. Vérifiez votre email pour activer votre compte.",
    };
  } catch (err) {
    if (err.statusCode) {
      // Erreur "contrôlée" via createError
      throw err;
    }

    logError("Auth register failed", {
      error: err.message,
      stack: err.stack,
      email,
      accountType,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne lors de l'inscription",
    });
  }
});
