// server/api/obituaries/[slug].get.js
import { defineEventHandler, createError } from "h3";
import { query } from "../../utils/db.js";
import { getAuthSession } from "../../utils/authSession.js";
import { logInfo, logError, logDebug } from "../../utils/logger.js";

function mapObituaryRow(row) {
  if (!row) return null;

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

    announcementType: row.announcement_type,
    relatedObituaryId: row.related_obituary_id,

    deceased: {
      fullName: row.deceased_full_name,
      givenNames: row.deceased_given_names,
      familyNames: row.deceased_family_names,
      identityStatus: row.identity_status,
      gender: row.deceased_gender,
      dateOfBirth: row.date_of_birth,
      dateOfDeath: row.date_of_death,
      ageAtDeath: row.age_at_death,
      ageDisplay: row.age_display,
      religion: row.religion,
      denomination: row.denomination,
    },

    content: {
      title: row.title,
      body: row.body,
      mainLanguage: row.main_language,
    },

    location: {
      city: row.city,
      region: row.region,
      country: row.country,
      countryCode: row.country_code,
      isRuralArea: !!row.is_rural_area,
    },

    familyContact: {
      name: row.family_contact_name,
      phone: row.family_contact_phone,
      whatsapp: row.family_contact_whatsapp,
      email: row.family_contact_email,
    },

    monetization: {
      isFree: !!row.is_free,
      pricingTier: row.pricing_tier,
      currency: row.currency,
      amountPaid: row.amount_paid,
      publishDurationDays: row.publish_duration_days,
      paymentProvider: row.payment_provider,
      paymentReference: row.payment_reference,
    },

    stats: {
      viewCount: row.view_count,
      lastViewAt: row.last_view_at,
    },

    owner: {
      userId: row.user_id,
      accountType: row.account_type,
    },
  };
}

function canViewPrivateOrUnpublished(obituary, session) {
  if (!session) return false;
  if (session.userId === obituary.owner.userId) return true;

  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug;
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Slug is required.",
    });
  }

  // Session facultative (public route)
  const session = await getAuthSession(event);

  logInfo("Get obituary by slug", {
    slug,
    userId: session?.userId || null,
    requestId,
  });

  try {
    // 1. Récupérer l’obituary
    const rows = await query(
      `
      SELECT *
      FROM obituaries
      WHERE slug = ?
      LIMIT 1
    `,
      [slug],
      { requestId }
    );

    if (rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Obituary not found.",
      });
    }

    const obituaryRow = rows[0];
    const obituary = mapObituaryRow(obituaryRow);

    // 2. Règles d’accès
    const isOwnerOrAdmin = canViewPrivateOrUnpublished(obituary, session);

    const isPublished = obituary.status === "published";
    const isRemoved = obituary.moderationStatus === "removed";
    const isPrivate = obituary.visibility === "private";

    if (isRemoved && !isOwnerOrAdmin) {
      // On masque les contenus supprimés aux publics
      throw createError({
        statusCode: 404,
        statusMessage: "Obituary not found.",
      });
    }

    if (!isPublished || isPrivate) {
      if (!isOwnerOrAdmin) {
        // On ne révèle même pas que ça existe
        throw createError({
          statusCode: 404,
          statusMessage: "Obituary not found.",
        });
      }
    }

    // 3. Charger les events
    const eventsRows = await query(
      `
      SELECT
        id,
        event_type,
        title,
        description,
        starts_at,
        ends_at,
        timezone,
        venue_name,
        venue_address,
        city,
        region,
        country,
        country_code,
        is_main_event,
        created_at,
        updated_at
      FROM obituary_events
      WHERE obituary_id = ?
      ORDER BY
        starts_at ASC,
        id ASC
    `,
      [obituary.id],
      { requestId }
    );

    const events = eventsRows.map((ev) => ({
      id: ev.id,
      eventType: ev.event_type,
      title: ev.title,
      description: ev.description,
      startsAt: ev.starts_at,
      endsAt: ev.ends_at,
      timezone: ev.timezone,
      venueName: ev.venue_name,
      venueAddress: ev.venue_address,
      city: ev.city,
      region: ev.region,
      country: ev.country,
      countryCode: ev.country_code,
      isMainEvent: !!ev.is_main_event,
      createdAt: ev.created_at,
      updatedAt: ev.updated_at,
    }));

    // 4. Charger les contacts publics
    const contactsRows = await query(
      `
      SELECT
        id,
        label,
        name,
        phone,
        whatsapp_number,
        email,
        is_public,
        is_primary,
        created_at,
        updated_at
      FROM obituary_contacts
      WHERE obituary_id = ?
        AND is_public = 1
      ORDER BY
        is_primary DESC,
        id ASC
    `,
      [obituary.id],
      { requestId }
    );

    const contacts = contactsRows.map((c) => ({
      id: c.id,
      label: c.label,
      name: c.name,
      phone: c.phone,
      whatsappNumber: c.whatsapp_number,
      email: c.email,
      isPublic: !!c.is_public,
      isPrimary: !!c.is_primary,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    // 5. Mettre à jour les vues (optionnel, mais utile)
    // On ne compte que les vues d’annonces publiées et non supprimées
    if (isPublished && !isRemoved) {
      try {
        await query(
          `
          UPDATE obituaries
          SET
            view_count = view_count + 1,
            last_view_at = NOW()
          WHERE id = ?
        `,
          [obituary.id],
          { requestId }
        );
        logDebug("Obituary view_count incremented", {
          obituaryId: obituary.id,
          requestId,
        });
      } catch (updateErr) {
        // On log mais on ne casse pas la réponse
        logError("Failed to increment obituary view_count", {
          error: updateErr.message,
          obituaryId: obituary.id,
          requestId,
        });
      }
    }

    return {
      ok: true,
      obituary,
      events,
      contacts,
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }

    logError("Get obituary by slug failed", {
      error: err.message,
      slug,
      requestId,
    });

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while fetching obituary.",
    });
  }
});
