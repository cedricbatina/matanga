// server/api/admin/obituaries/index.get.js
import { defineEventHandler, getQuery, createError } from "h3";
import { requireAuth } from "../../../utils/authSession.js";
import { query } from "../../../utils/db.js";
import { logInfo, logError, logDebug } from "../../../utils/logger.js";

function sanitizeSearch(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 1 ? trimmed : null;
}

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

function parseVerificationFilter(raw) {
  if (!raw) return null;
  const allowed = ["not_required", "pending", "verified", "rejected"];

  const parts = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const filtered = parts.filter((s) => allowed.includes(s));
  return filtered.length > 0 ? filtered : null;
}

function mapAdminObituaryRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    verificationStatus: row.verification_status,
    moderationStatus: row.moderation_status,
    visibility: row.visibility,

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
      paymentProvider: row.payment_provider,
      paymentReference: row.payment_reference,
    },

    stats: {
      viewCount: row.view_count,
      lastViewAt: row.last_view_at,
    },

    user: {
      id: row.user_id,
      email: row.user_email,
      accountType: row.user_account_type,
      city: row.user_city,
      country: row.user_country,
    },
  };
}

export default defineEventHandler(async (event) => {
  // ⚠️ réservé admin / modérateur
  const session = await requireAuth(event, {
    roles: ["admin", "moderator"],
  });

  const q = getQuery(event) || {};
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  // Pagination
  let page = parseInt(q.page ?? "1", 10);
  let pageSize = parseInt(q.pageSize ?? "10", 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(pageSize) || pageSize < 1) pageSize = 10;
  const MAX_PAGE_SIZE = 50;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  const offset = (page - 1) * pageSize;

  const statusFilter = parseStatusFilter(q.status);
  const verificationFilter = parseVerificationFilter(q.verification);
  const searchTerm = sanitizeSearch(q.q || q.search);
  const sort = q.sort || "recent"; // recent | oldest | popular

  // Par défaut : on ne montre que les annonces avec paiement
  const onlyPaid = q.onlyPaid === "false" ? false : true;

  logInfo("Admin list obituaries", {
    adminId: session.userId,
    page,
    pageSize,
    statusFilter,
    verificationFilter,
    searchTerm,
    sort,
    onlyPaid,
    requestId,
  });

  const whereParts = ["1=1"];
  const params = [];

  if (onlyPaid) {
    whereParts.push(
      "(o.payment_provider IS NOT NULL OR (o.amount_paid IS NOT NULL AND o.amount_paid > 0))"
    );
  }

  if (statusFilter) {
    const placeholders = statusFilter.map(() => "?").join(",");
    whereParts.push(`o.status IN (${placeholders})`);
    params.push(...statusFilter);
  }

  if (verificationFilter) {
    const placeholders = verificationFilter.map(() => "?").join(",");
    whereParts.push(`o.verification_status IN (${placeholders})`);
    params.push(...verificationFilter);
  }

  if (searchTerm) {
    whereParts.push(
      "(o.deceased_full_name LIKE ? OR o.title LIKE ? OR u.email LIKE ?)"
    );
    const like = `%${searchTerm}%`;
    params.push(like, like, like);
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
    // Count
    const countRows = await query(
      `
      SELECT COUNT(*) AS total
      FROM obituaries o
      JOIN users u ON u.id = o.user_id
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
        o.user_id,
        u.email AS user_email,
        u.account_type AS user_account_type,
        u.city AS user_city,
        u.country AS user_country,

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
        o.payment_provider,
        o.payment_reference,
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
      JOIN users u ON u.id = o.user_id
      ${whereSql}
      ${orderSql}
      LIMIT ?
      OFFSET ?
    `;

    const listParams = [...params, pageSize, offset];

    logDebug("Admin list obituaries SQL", {
      whereSql,
      orderSql,
      params,
      page,
      pageSize,
      requestId,
    });

    const rows = await query(listSql, listParams, { requestId });
    const items = rows.map(mapAdminObituaryRow);

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
    logError("Admin list obituaries failed", {
      error: err.message,
      stack: err.stack,
      adminId: session.userId,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage:
        "Internal error while listing obituaries for admin review.",
    });
  }
});
