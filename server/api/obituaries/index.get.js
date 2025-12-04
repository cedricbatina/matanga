// server/api/obituaries/index.get.js
import { defineEventHandler, getQuery, createError } from "h3";
import { query } from "../../utils/db.js";
import { getAuthSession } from "../../utils/authSession.js";
import { logInfo, logError, logDebug } from "../../utils/logger.js";

function parseBoolean(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value;
  const v = String(value).toLowerCase().trim();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return null;
}

function sanitizeSearch(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 1 ? trimmed : null;
}

function mapSummaryRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    visibility: row.visibility,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    coverImageUrl: row.cover_image_url || null, // 👈 NOUVEAU
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
      // on n’envoie pas le body complet ici pour alléger le listing
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
    },

    stats: {
      viewCount: row.view_count,
      lastViewAt: row.last_view_at,
    },

    mainEvent: row.main_event_id
      ? {
          id: row.main_event_id,
          eventType: row.main_event_type,
          title: row.main_event_title,
          startsAt: row.main_event_starts_at,
          city: row.main_event_city,
          country: row.main_event_country,
          countryCode: row.main_event_country_code,
        }
      : null,
  };
}

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  // Session optionnelle (plus tard on pourra filtrer différemment pour un admin)
  const session = await getAuthSession(event);

  // ---------- Pagination ----------
  let page = parseInt(queryParams.page ?? "1", 10);
  let pageSize = parseInt(queryParams.pageSize ?? "10", 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(pageSize) || pageSize < 1) pageSize = 10;
  const MAX_PAGE_SIZE = 50;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  const offset = (page - 1) * pageSize;

  // ---------- Filtres ----------
  const countryCode =
    queryParams.country_code || queryParams.countryCode || null;
  const city = queryParams.city || null;
  const language = queryParams.language || queryParams.lang || null;
  const type = queryParams.type || null; // death, anniversary, memorial...
  const isFreeFilter = parseBoolean(queryParams.is_free ?? queryParams.free);
  const sort = queryParams.sort || "recent"; // recent | oldest | popular
  const searchTerm = sanitizeSearch(queryParams.q || queryParams.search);

  logInfo("List obituaries request", {
    page,
    pageSize,
    countryCode,
    city,
    language,
    type,
    isFreeFilter,
    sort,
    searchTerm,
    userId: session?.userId || null,
    requestId,
  });

  // ---------- Construction dynamique du WHERE ----------
  const whereParts = [];
  const params = [];

  // Seulement les annonces publiées, non supprimées, visibles
  whereParts.push("o.status = 'published'");
  whereParts.push("o.moderation_status != 'removed'");
  whereParts.push("o.visibility = 'public'");
  whereParts.push("(o.publish_at IS NULL OR o.publish_at <= NOW())");
  whereParts.push("(o.expires_at IS NULL OR o.expires_at > NOW())");

  if (countryCode) {
    whereParts.push("o.country_code = ?");
    params.push(countryCode.toString().toUpperCase());
  }

  if (city && typeof city === "string" && city.trim().length > 0) {
    whereParts.push("o.city LIKE ?");
    params.push(city.trim() + "%");
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

  if (isFreeFilter !== null) {
    whereParts.push("o.is_free = ?");
    params.push(isFreeFilter ? 1 : 0);
  }

  if (searchTerm) {
    whereParts.push("(o.deceased_full_name LIKE ? OR o.title LIKE ?)");
    const like = `%${searchTerm}%`;
    params.push(like, like);
  }

  const whereSql =
    whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  // ---------- Tri ----------
  let orderSql = "ORDER BY o.published_at DESC";

  switch (sort) {
    case "oldest":
      orderSql = "ORDER BY o.published_at ASC";
      break;
    case "popular":
      orderSql = "ORDER BY o.view_count DESC, o.published_at DESC";
      break;
    case "recent":
    default:
      orderSql = "ORDER BY o.published_at DESC";
      break;
  }

  try {
    // ---------- Total pour pagination ----------
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

    // ---------- Récupération des annonces + main_event en LEFT JOIN ----------
    // On utilise un sous-select pour récupérer l'événement principal par obituary
    const listSql = `
      SELECT
        o.id,
        o.slug,
        o.status,
        o.visibility,
        o.deceased_full_name,
        o.deceased_gender,
        o.date_of_death,
        o.age_at_death,
          o.cover_image_url,      -- 👈 AJOUT ICI
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
        o.view_count,
        o.last_view_at,
        o.published_at,
        o.expires_at,
        o.created_at,
        o.updated_at,

        -- extrait court du body pour le listing
        CASE
          WHEN LENGTH(o.body) <= 240 THEN o.body
          ELSE CONCAT(SUBSTRING(o.body, 1, 240), '…')
        END AS body_excerpt,

        me.id AS main_event_id,
        me.event_type AS main_event_type,
        me.title AS main_event_title,
        me.starts_at AS main_event_starts_at,
        me.city AS main_event_city,
        me.country AS main_event_country,
        me.country_code AS main_event_country_code

      FROM obituaries o

      LEFT JOIN (
        SELECT
          e1.*
        FROM obituary_events e1
        INNER JOIN (
          SELECT
            obituary_id,
            MIN(starts_at) AS first_start
          FROM obituary_events
          GROUP BY obituary_id
        ) e2
          ON e1.obituary_id = e2.obituary_id
         AND e1.starts_at = e2.first_start
      ) me
        ON me.obituary_id = o.id

      ${whereSql}
      ${orderSql}
      LIMIT ?
      OFFSET ?
    `;

    const listParams = [...params, pageSize, offset];

    logDebug("List obituaries SQL", {
      whereSql,
      orderSql,
      params,
      page,
      pageSize,
      requestId,
    });

    const rows = await query(listSql, listParams, { requestId });

    const items = rows.map(mapSummaryRow);

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
    logError("List obituaries failed", {
      error: err.message,
      stack: err.stack,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while listing obituaries.",
    });
  }
});
