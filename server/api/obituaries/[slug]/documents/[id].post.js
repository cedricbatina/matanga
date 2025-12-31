// server/api/admin/obituaries/[slug]/documents/[id].post.js
import { defineEventHandler, createError, readBody } from "h3";
import { requireAuth } from "../../../../utils/authSession.js";
import { query } from "../../../../utils/db.js";

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

const ALLOWED_STATUSES = new Set([
  "uploaded",
  "under_review",
  "accepted",
  "rejected",
]);

export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug;
  const idParam = event.context.params?.id;

  if (!slugParam) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing obituary slug.",
    });
  }
  if (!idParam) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing document id.",
    });
  }

  const docId = Number(idParam);
  if (!Number.isFinite(docId) || docId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid document id.",
    });
  }

  const session = await requireAuth(event);
  if (!isAdminOrModerator(session)) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden." });
  }

  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const body = (await readBody(event)) || {};
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const adminNoteRaw =
    typeof body.adminNote === "string" ? body.adminNote.trim() : "";
  const adminNote = adminNoteRaw.length ? adminNoteRaw : null;

  if (!ALLOWED_STATUSES.has(status)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid status. Allowed: uploaded, under_review, accepted, rejected.",
    });
  }

  // 1) trouver obituary_id par slug
  const rowsObit = await query(
    `SELECT id FROM obituaries WHERE slug = ? LIMIT 1`,
    [slugParam],
    { requestId }
  );
  if (!rowsObit?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Obituary not found.",
    });
  }

  const obituaryId = Number(rowsObit[0].id);

  // 2) vérifier que le doc appartient à cette annonce
  const rowsDoc = await query(
    `SELECT id FROM obituary_documents WHERE id = ? AND obituary_id = ? LIMIT 1`,
    [docId, obituaryId],
    { requestId }
  );
  if (!rowsDoc?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found.",
    });
  }

  // 3) update
  await query(
    `
    UPDATE obituary_documents
    SET
      status = ?,
      admin_note = ?,
      updated_at = NOW()
    WHERE id = ? AND obituary_id = ?
    LIMIT 1
    `,
    [status, adminNote, docId, obituaryId],
    { requestId }
  );

  // 4) renvoyer le doc (optionnel mais pratique)
  const out = await query(
    `
    SELECT
      id, type,
      status,
      admin_note AS adminNote,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM obituary_documents
    WHERE id = ? AND obituary_id = ?
    LIMIT 1
    `,
    [docId, obituaryId],
    { requestId }
  );

  return { ok: true, document: out?.[0] || null };
});
