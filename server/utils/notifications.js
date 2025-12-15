// server/utils/notifications.js
import { query } from "./db.js";
import { logError } from "./logger.js";

/**
 * Crée une notification in-app pour un utilisateur.
 *
 * @param {Object} params
 * @param {number} params.recipientId      - ID de l'utilisateur (obligatoire)
 * @param {string} params.type             - ex: "obituary.archived_no_certificate"
 * @param {string} [params.channel="in_app"]
 * @param {string} [params.title]
 * @param {string} [params.body]
 * @param {Object} [params.data]           - payload JSON libre
 * @param {number|null} [params.relatedObituaryId]
 * @param {number|null} [params.relatedPaymentId]
 * @param {Object} [ctx]                   - ex: { requestId, userId }
 */
export async function createNotification(params, ctx = {}) {
  const {
    recipientId,
    type,
    channel = "in_app",
    title = "",
    body = "",
    data = null,
    relatedObituaryId = null,
    relatedPaymentId = null,
  } = params || {};

  if (!recipientId || !type) {
    return;
  }

  try {
    await query(
      `
      INSERT INTO notifications (
        recipient_id,
        type,
        channel,
        title,
        body,
        data,
        status,
        related_obituary_id,
        related_payment_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'unread', ?, ?, NOW())
    `,
      [
        recipientId,
        type,
        channel,
        title,
        body,
        data ? JSON.stringify(data) : null,
        relatedObituaryId,
        relatedPaymentId,
      ],
      ctx
    );
  } catch (err) {
    logError("createNotification failed", {
      error: err.message,
      stack: err.stack,
      recipientId,
      type,
      ctx,
    });
  }
}
