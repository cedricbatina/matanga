// server/api/my/notifications/[id].patch.js
import { defineEventHandler, createError, readBody } from "h3";
import { requireAuth } from "../../../utils/authSession.js";
import { query } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const idParam = event.context.params?.id;
  const notificationId = Number(idParam);

  if (!notificationId || !Number.isFinite(notificationId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid notification id.",
    });
  }

  const body = (await readBody(event)) || {};
  const action = body.action;

  if (!action || !["mark_read", "archive"].includes(action)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid action. Expected 'mark_read' or 'archive'.",
    });
  }

  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  logInfo("Update notification", {
    requestId,
    userId: session.userId,
    notificationId,
    action,
  });

  try {
    let sql;
    if (action === "mark_read") {
      sql = `
        UPDATE notifications
        SET status = 'read',
            read_at = COALESCE(read_at, NOW())
        WHERE notification_id = ?
          AND recipient_id = ?
      `;
    } else {
      // archive
      sql = `
        UPDATE notifications
        SET status = 'archived',
            read_at = COALESCE(read_at, NOW())
        WHERE notification_id = ?
          AND recipient_id = ?
      `;
    }

    const result = await query(sql, [notificationId, session.userId], {
      requestId,
    });

    if (result.affectedRows === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Notification not found.",
      });
    }

    return {
      ok: true,
      action,
      notificationId,
    };
  } catch (err) {
    logError("Update notification failed", {
      requestId,
      userId: session.userId,
      notificationId,
      action,
      error: err.message,
      stack: err.stack,
    });

    if (err.statusCode) throw err;

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while updating notification.",
    });
  }
});
