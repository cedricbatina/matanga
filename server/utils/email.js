// server/utils/email.js
import nodemailer from "nodemailer";
import { logError, logInfo } from "./logger.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logError("SMTP config missing (check SMTP_HOST, SMTP_USER, SMTP_PASS)");
    throw new Error("Email service not configured");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 => SSL, 587 => STARTTLS
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendEmail({ toEmail, toName, subject, htmlContent }) {
  const tx = getTransporter();

  const fromEmail = process.env.EMAIL_FROM || "no-reply@example.com";
  const fromName = process.env.EMAIL_FROM_NAME || "Matanga";

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toName ? `"${toName}" <${toEmail}>` : toEmail,
    subject,
    html: htmlContent,
  };

  try {
    const info = await tx.sendMail(mailOptions);
    logInfo("Email sent via SMTP", {
      to: toEmail,
      messageId: info.messageId,
    });
  } catch (err) {
    logError("Error sending email via SMTP", {
      to: toEmail,
      error: err.message,
    });
    throw err;
  }
}

export async function sendEmailVerification({ toEmail, toName, token }) {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(
    token
  )}`;

  const subject = "Vérifiez votre adresse email – Matanga";
  const htmlContent = `
    <p>Mbote,</p>
    <p>Merci d'avoir créé un compte sur <strong>Matanga</strong>.</p>
    <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
    <p><a href="${verifyUrl}" target="_blank">Vérifier mon adresse email</a></p>
    <p>Ce lien est valable 24 heures.</p>
    <p>Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.</p>
    <p>— L'équipe Matanga</p>
  `;

  return sendEmail({ toEmail, toName, subject, htmlContent });
}

/**
 * Email de reset de mot de passe
 */
export async function sendPasswordResetEmail({ toEmail, toName, token }) {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(
    token
  )}`;

  const subject = "Réinitialisation de votre mot de passe – Matanga";
  const htmlContent = `
    <p>Bonjour,</p>
    <p>Vous avez demandé à réinitialiser le mot de passe de votre compte <strong>Matanga</strong>.</p>
    <p>Pour définir un nouveau mot de passe, cliquez sur ce lien :</p>
    <p><a href="${resetUrl}" target="_blank">Réinitialiser mon mot de passe</a></p>
    <p>Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    <p>— L'équipe Matanga</p>
  `;

  return sendEmail({ toEmail, toName, subject, htmlContent });
}
