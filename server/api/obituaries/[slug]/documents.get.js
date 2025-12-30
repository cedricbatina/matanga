// server/api/obituaries/[slug]/documents.get.js
import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../utils/authSession.js";
import { query } from "../../../utils/db.js";

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug;
  if (!slugParam)
    throw createError({
      statusCode: 400,
      statusMessage: "Missing obituary slug.",
    });

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const rowsObit = await query(
    `SELECT id, user_id FROM obituaries WHERE slug = ? LIMIT 1`,
    [slugParam],
    { requestId }
  );
  if (!rowsObit?.length)
    throw createError({
      statusCode: 404,
      statusMessage: "Obituary not found.",
    });

  const obit = rowsObit[0];
  if (
    Number(obit.user_id) !== Number(session.userId) &&
    !isAdminOrModerator(session)
  ) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden." });
  }

  const rowsDocs = await query(
    `
    SELECT
      id, type,
      status,
      admin_note AS adminNote,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM obituary_documents
    WHERE obituary_id = ?
    ORDER BY id DESC
    `,
    [obit.id],
    { requestId }
  );

  const documents = (rowsDocs || []).map((d) => ({
    ...d,
    fileUrl: `/api/obituaries/${slugParam}/documents/${d.id}`,
  }));

  return { ok: true, documents };
});
