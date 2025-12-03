// server/api/my/obituaries/index.get.js
import { defineEventHandler, getQuery, createError } from "h3";
import { requireAuth } from "../../../utils/authSession";
import { query } from "../../../utils/db.js";
import { logInfo, logError, logDebug } from "../../../utils/logger.js";

function parseStatusFilter(raw) {
  if (!raw) return null;
  const allowed = [
    "draft",
    "pending_review",
    "published",
    "rejected",
    "expired",
    "archived",
  ];

  const parts = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const filtered = parts.filter((s) => allowed.includes(s));
  return filtered.length > 0 ? filtered : null;
}

function sanitizeSearch(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 1 ? trimmed : null;
}

function mapMyObituaryRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    visibility: row.visibility,
    verificationStatus: row.verification_status,
    moderationStatus: row.moderation_status,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    archivedAt: row.archived_at,

    announcementType: row.announcement_type,

    deceased: {
      fullName: row.deceased_full_name,
      gender: row.deceased_gender,
      dateOfDeath: row.date_of_death,
      ageAtDeath: row.age_at_death,
      ageDisplay: row.age_display,
    },

    content: {
      title: row.title,
      mainLanguage: row.main_language,
      excerpt: row.body_excerpt,
    },

    location: {
      city: row.city,
      region: row.region,
      country: row.country,
      countryCode: row.country_code,
      isRuralArea: !!row.is_rural_area,
    },

    monetization: {
      isFree: !!row.is_free,
      pricingTier: row.pricing_tier,
      currency: row.currency,
      amountPaid: row.amount_paid,
    },

    stats: {
      viewCount: row.view_count,
      lastViewAt: row.last_view_at,
    },
  };
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const queryParams = getQuery(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  // Pagination
  let page = parseInt(queryParams.page ?? "1", 10);
  let pageSize = parseInt(queryParams.pageSize ?? "10", 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(pageSize) || pageSize < 1) pageSize = 10;
  const MAX_PAGE_SIZE = 50;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  const offset = (page - 1) * pageSize;

  const statusFilter = parseStatusFilter(queryParams.status);
  const language = queryParams.language || queryParams.lang || null;
  const type = queryParams.type || null;
  const searchTerm = sanitizeSearch(queryParams.q || queryParams.search);
  const sort = queryParams.sort || "recent"; // recent | oldest | popular

  logInfo("List my obituaries", {
    userId: session.userId,
    page,
    pageSize,
    statusFilter,
    language,
    type,
    searchTerm,
    sort,
    requestId,
  });

  // WHERE
  const whereParts = ["o.user_id = ?"];
  const params = [session.userId];

  if (statusFilter) {
    const placeholders = statusFilter.map(() => "?").join(",");
    whereParts.push(`o.status IN (${placeholders})`);
    params.push(...statusFilter);
  }

  if (language && typeof language === "string") {
    const lang = language.toLowerCase();
    const allowed = ["fr", "en", "pt", "es"];
    if (!allowed.includes(lang)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid language filter.",
      });
    }
    whereParts.push("o.main_language = ?");
    params.push(lang);
  }

  if (type && typeof type === "string") {
    const allowedTypes = ["death", "anniversary", "memorial", "other"];
    if (!allowedTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid announcement type filter.",
      });
    }
    whereParts.push("o.announcement_type = ?");
    params.push(type);
  }

  if (searchTerm) {
    whereParts.push("(o.deceased_full_name LIKE ? OR o.title LIKE ?)");
    const like = `%${searchTerm}%`;
    params.push(like, like);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  // Tri
  let orderSql = "ORDER BY o.created_at DESC";

  switch (sort) {
    case "oldest":
      orderSql = "ORDER BY o.created_at ASC";
      break;
    case "popular":
      orderSql = "ORDER BY o.view_count DESC, o.created_at DESC";
      break;
    case "recent":
    default:
      orderSql = "ORDER BY o.created_at DESC";
      break;
  }

  try {
    // Total
    const countRows = await query(
      `
      SELECT COUNT(*) AS total
      FROM obituaries o
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

    // Liste
    const listSql = `
      SELECT
        o.id,
        o.slug,
        o.status,
        o.visibility,
        o.verification_status,
        o.moderation_status,
        o.deceased_full_name,
        o.deceased_gender,
        o.date_of_death,
        o.age_at_death,
        o.age_display,
        o.title,
        o.body,
        o.main_language,
        o.announcement_type,
        o.city,
        o.region,
        o.country,
        o.country_code,
        o.is_rural_area,
        o.is_free,
        o.pricing_tier,
        o.currency,
        o.amount_paid,
        o.view_count,
        o.last_view_at,
        o.published_at,
        o.expires_at,
        o.archived_at,
        o.created_at,
        o.updated_at,
        CASE
          WHEN LENGTH(o.body) <= 240 THEN o.body
          ELSE CONCAT(SUBSTRING(o.body, 1, 240), '…')
        END AS body_excerpt
      FROM obituaries o
      ${whereSql}
      ${orderSql}
      LIMIT ?
      OFFSET ?
    `;

    const listParams = [...params, pageSize, offset];

    logDebug("List my obituaries SQL", {
      whereSql,
      orderSql,
      params,
      page,
      pageSize,
      requestId,
    });

    const rows = await query(listSql, listParams, { requestId });
    const items = rows.map(mapMyObituaryRow);

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
    logError("List my obituaries failed", {
      error: err.message,
      stack: err.stack,
      userId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while listing my obituaries.",
    });
  }
});
