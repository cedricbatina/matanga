// server/api/my/notifications/index.get.js
import { defineEventHandler, getQuery, createError } from "h3";
import { requireAuth } from "../../../utils/authSession.js";
import { query } from "../../../utils/db.js";
import { logInfo, logError } from "../../../utils/logger.js";

function parseStatus(raw) {
  if (!raw) return null;
  const allowed = ["unread", "read", "archived"];
  const value = String(raw).trim();
  return allowed.includes(value) ? value : null;
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const q = getQuery(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  let page = parseInt(q.page ?? "1", 10);
  let pageSize = parseInt(q.pageSize ?? "10", 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(pageSize) || pageSize < 1) pageSize = 10;
  const MAX_PAGE_SIZE = 50;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  const offset = (page - 1) * pageSize;
  const statusFilter = parseStatus(q.status);
  const typeFilter = typeof q.type === "string" ? q.type.trim() : null;

  const whereParts = ["n.recipient_id = ?"];
  const params = [session.userId];

  if (statusFilter) {
    whereParts.push("n.status = ?");
    params.push(statusFilter);
  }

  if (typeFilter) {
    whereParts.push("n.type = ?");
    params.push(typeFilter);
  }

  const whereSql = `WHERE ${whereParts.join(" AND ")}`;

  logInfo("List my notifications", {
    userId: session.userId,
    page,
    pageSize,
    statusFilter,
    typeFilter,
    requestId,
  });

  try {
    // total
    const countRows = await query(
      `
      SELECT COUNT(*) AS total
      FROM notifications n
      ${whereSql}
    `,
      params,
      { requestId }
    );

    const total = countRows[0]?.total || 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    if (total === 0) {
      return {
        ok: true,
        items: [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      };
    }

    // liste
    const listSql = `
      SELECT
        n.notification_id     AS id,
        n.type,
        n.channel,
        n.title,
        n.body,
        n.data,
        n.status,
        n.related_obituary_id AS relatedObituaryId,
        n.related_payment_id  AS relatedPaymentId,
        n.created_at          AS createdAt,
        n.read_at             AS readAt
      FROM notifications n
      ${whereSql}
      ORDER BY n.created_at DESC
      LIMIT ?
      OFFSET ?
    `;

    const listParams = [...params, pageSize, offset];
    const rows = await query(listSql, listParams, { requestId });

    const items = rows.map((row) => ({
      id: row.id,
      type: row.type,
      channel: row.channel,
      title: row.title,
      body: row.body,
      data: row.data ? JSON.parse(row.data) : null,
      status: row.status,
      relatedObituaryId: row.relatedObituaryId,
      relatedPaymentId: row.relatedPaymentId,
      createdAt: row.createdAt,
      readAt: row.readAt,
    }));

    return {
      ok: true,
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  } catch (err) {
    logError("List my notifications failed", {
      error: err.message,
      stack: err.stack,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while listing notifications.",
    });
  }
});
