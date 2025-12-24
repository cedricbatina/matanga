// server/api/obituaries/index.post.js
import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { transaction } from "../../utils/db.js";
import { logInfo, logError } from "../../utils/logger.js";
import {
  buildObituaryBaseSlug,
  ensureUniqueSlugForObituary,
} from "../../utils/ensureUniqueSlugForObituary.js";
import {
  findPlanByCode,
  getDefaultIndividualFreePlan,
} from "~/utils/pricingPlans.js";

const MIN_TITLE_LENGTH = 8;
const MIN_BODY_LENGTH = 30;

// Tant que tu es en DRAFT, publish_at/published_at/expires_at restent vides.
const publishDirect = false;

// Event types autorisés (doivent matcher tes plans + tes enums métier)
const DEFAULT_EVENT_TYPE = "wake";

// Providers connus (ton enum est tronqué dans la capture, donc on fait robuste)
const ALLOWED_MEDIA_PROVIDERS = new Set([
  "upload",
  "youtube",
  "vimeo",
  "facebook",
  "tiktok",
  "instagram",
]);

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function sanitizeString(v) {
  return typeof v === "string" ? v.trim() : null;
}
function asNullableInt(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeEvents(
  input,
  fallbackCity,
  fallbackRegion,
  fallbackCountry,
  fallbackCountryCode
) {
  const arr = Array.isArray(input) ? input : [];
  const normalized = arr
    .filter(Boolean)
    .map((ev, idx) => {
      const startsAt = ev.startsAt || ev.starts_at || null;
      if (!startsAt) return null;

      const eventTypeRaw = String(
        ev.eventType || ev.event_type || DEFAULT_EVENT_TYPE
      ).toLowerCase();

      return {
        eventType: eventTypeRaw,
        title: sanitizeString(ev.title) || "Event",
        description: sanitizeString(ev.description),
        startsAt,
        endsAt: ev.endsAt || ev.ends_at || null,
        timezone: sanitizeString(ev.timezone),
        venueName: sanitizeString(ev.venueName || ev.venue_name),
        venueAddress: sanitizeString(ev.venueAddress || ev.venue_address),
        city: sanitizeString(ev.city) || fallbackCity || null,
        region: sanitizeString(ev.region) || fallbackRegion || null,
        country: sanitizeString(ev.country) || fallbackCountry || null,
        countryCode:
          sanitizeString(ev.countryCode || ev.country_code) ||
          fallbackCountryCode ||
          null,
        isMainEvent:
          ev.isMainEvent === true || ev.is_main_event === true || idx === 0,
      };
    })
    .filter(Boolean);

  // Force un seul main event
  let mainSeen = false;
  for (const ev of normalized) {
    if (ev.isMainEvent) {
      if (mainSeen) ev.isMainEvent = false;
      else mainSeen = true;
    }
  }
  if (!mainSeen && normalized.length > 0) normalized[0].isMainEvent = true;

  return normalized;
}

function normalizeMedia(input) {
  const arr = Array.isArray(input) ? input : [];
  const normalized = arr
    .filter(Boolean)
    .map((m, idx) => {
      const mediaType = String(m.mediaType || m.media_type || "").toLowerCase();
      if (mediaType !== "image" && mediaType !== "video") return null;

      const url = sanitizeString(m.url);
      if (!url) return null;

      let provider = String(m.provider || "upload").toLowerCase();
      if (!ALLOWED_MEDIA_PROVIDERS.has(provider)) provider = "upload";

      const eventId = asNullableInt(m.eventId || m.event_id);
      const durationSeconds = asNullableInt(
        m.durationSeconds || m.duration_seconds
      );

      const isMain = m.isMain === true || m.is_main === true ? 1 : 0;

      const sortOrder = Number.isFinite(Number(m.sortOrder))
        ? Number(m.sortOrder)
        : Number.isFinite(Number(m.sort_order))
        ? Number(m.sort_order)
        : idx;

      return {
        eventId,
        mediaType, // enum('image','video')
        provider, // enum(...)
        url,
        thumbnailUrl: sanitizeString(m.thumbnailUrl || m.thumbnail_url),
        title: sanitizeString(m.title),
        description: sanitizeString(m.description),
        durationSeconds,
        isMain,
        sortOrder,
      };
    })
    .filter(Boolean);

  // Force un seul main media sur l’obituary
  let mainSeen = false;
  for (const m of normalized) {
    if (m.isMain) {
      if (mainSeen) m.isMain = 0;
      else mainSeen = true;
    }
  }
  if (!mainSeen && normalized.length > 0) normalized[0].isMain = 1;

  return normalized;
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const body = await readBody(event);

  const {
    deceasedFullName,
    deceasedGivenNames,
    deceasedFamilyNames,
    identityStatus,
    deceasedGender,
    dateOfBirth,
    dateOfDeath,
    ageDisplay,
    religion,
    denomination,

    coverImageUrl,

    title,
    content,
    mainLanguage,

    city,
    region,
    country,
    countryCode,
    isRuralArea,

    familyContactName,
    familyContactPhone,
    familyContactWhatsapp,
    familyContactEmail,

    planCode,

    events,
    contacts,
    media,
  } = body || {};

  logInfo("Create obituary attempt", {
    userId: session.userId,
    email: session.email,
    requestId,
  });

  // ---------------- VALIDATION DE BASE ----------------

  const fieldErrors = {};

  if (!isNonEmptyString(deceasedFullName)) {
    fieldErrors.deceasedFullName = "Full name of the deceased is required.";
  }
  if (!isNonEmptyString(title) || title.trim().length < MIN_TITLE_LENGTH) {
    fieldErrors.title = `Title is too short (min ${MIN_TITLE_LENGTH} characters).`;
  }
  if (!isNonEmptyString(content) || content.trim().length < MIN_BODY_LENGTH) {
    fieldErrors.content = `Announcement text is too short (min ${MIN_BODY_LENGTH} characters).`;
  }

  const allowedIdentityStatus = ["known", "partial", "unknown"];
  const identityStatusValue = identityStatus || "known";
  if (!allowedIdentityStatus.includes(identityStatusValue)) {
    fieldErrors.identityStatus = "Invalid identity status.";
  }

  const allowedGender = ["male", "female"];
  if (deceasedGender && !allowedGender.includes(deceasedGender)) {
    fieldErrors.deceasedGender = "Invalid gender.";
  }

  const allowedReligion = ["christian", "muslim", "other"];
  if (religion && !allowedReligion.includes(religion)) {
    fieldErrors.religion = "Invalid religion.";
  }

  const allowedLanguages = ["fr", "en", "pt", "es"];
  const languageValue = mainLanguage || "fr";
  if (!allowedLanguages.includes(languageValue)) {
    fieldErrors.mainLanguage = "Invalid language.";
  }

  if (events != null && !Array.isArray(events)) {
    fieldErrors.events = "Events must be an array.";
  }
  if (contacts != null && !Array.isArray(contacts)) {
    fieldErrors.contacts = "Contacts must be an array.";
  }
  if (media != null && !Array.isArray(media)) {
    fieldErrors.media = "Media must be an array.";
  }

  // ---------------- PLAN ----------------

  const accountType = session.accountType || "individual";
  let selectedPlan = null;

  // Pro: on exige un plan oneoff tant que subscriptions pas implémentées
  if (accountType === "pro" && !planCode) {
    fieldErrors.planCode = "Plan is required for pro accounts.";
  }

  if (planCode) {
    selectedPlan = findPlanByCode(planCode);
    if (!selectedPlan) {
      fieldErrors.planCode = "Unknown plan code.";
    } else {
      if (
        selectedPlan.accountType &&
        selectedPlan.accountType !== accountType
      ) {
        fieldErrors.planCode =
          "This plan is not available for your account type.";
      }
      if (
        selectedPlan.billingType === "subscription" ||
        selectedPlan.scope === "account"
      ) {
        fieldErrors.planCode =
          "Subscription plans cannot be selected per announcement.";
      }
      if (selectedPlan.scope !== "obituary") {
        fieldErrors.planCode =
          "This plan cannot be used to create an obituary.";
      }
    }
  } else if (accountType === "individual") {
    selectedPlan = getDefaultIndividualFreePlan();
  }

  if (!selectedPlan) {
    fieldErrors.planCode = fieldErrors.planCode || "Plan is required.";
  }

  // Source de vérité plan -> DB
  const isFreeValue = selectedPlan ? !!selectedPlan.isFree : true;
  const pricingTierValue = selectedPlan
    ? selectedPlan.pricingTier || selectedPlan.code
    : null;
  const currencyValue = selectedPlan ? selectedPlan.currency || null : null;
  const publishDurationDaysValue = selectedPlan
    ? selectedPlan.publishDurationDays
    : null;

  // ---------------- NORMALISATION (events / contacts / media) ----------------

  const cityClean = sanitizeString(city);
  const regionClean = sanitizeString(region);
  const countryClean = sanitizeString(country);
  const countryCodeClean = sanitizeString(countryCode);

  const normalizedEvents = normalizeEvents(
    events,
    cityClean,
    regionClean,
    countryClean,
    countryCodeClean
  );

  if (normalizedEvents.length === 0) {
    fieldErrors.events = "At least one event with a start date is required.";
  }

  const normalizedMedia = normalizeMedia(media);

  // Compat : si coverImageUrl est fourni mais media vide => on crée un media cover implicite
  const coverUrlFallback = sanitizeString(coverImageUrl);
  if (coverUrlFallback && normalizedMedia.length === 0) {
    normalizedMedia.push({
      eventId: null,
      mediaType: "image",
      provider: "upload",
      url: coverUrlFallback,
      thumbnailUrl: null,
      title: null,
      description: null,
      durationSeconds: null,
      isMain: 1,
      sortOrder: 0,
    });
  }

  // Caps plan: events/contacts/media
  if (selectedPlan && selectedPlan.features) {
    const f = selectedPlan.features;

    if (
      typeof f.maxEvents === "number" &&
      normalizedEvents.length > f.maxEvents
    ) {
      fieldErrors.events = `This plan allows up to ${f.maxEvents} event(s).`;
    }

    if (Array.isArray(f.allowedEventTypes)) {
      const invalid = normalizedEvents.find(
        (ev) => ev.eventType && !f.allowedEventTypes.includes(ev.eventType)
      );
      if (invalid) {
        fieldErrors.events =
          "One or more events use an event_type not allowed for this plan.";
      }
    }

    if (
      Array.isArray(contacts) &&
      typeof f.maxContacts === "number" &&
      contacts.length > f.maxContacts
    ) {
      fieldErrors.contacts = `This plan allows up to ${f.maxContacts} contact(s).`;
    }

    const photoCount = normalizedMedia.filter(
      (m) => m.mediaType === "image"
    ).length;
    const videoCount = normalizedMedia.filter(
      (m) => m.mediaType === "video"
    ).length;

    if (typeof f.maxPhotos === "number" && photoCount > f.maxPhotos) {
      fieldErrors.media = `This plan allows up to ${f.maxPhotos} photo(s).`;
    }
    if (typeof f.maxVideos === "number" && videoCount > f.maxVideos) {
      fieldErrors.media = `This plan allows up to ${f.maxVideos} video(s).`;
    }
  }

  // En draft, on n’exige pas amountPaid/paymentProvider/paymentReference
  if (!isFreeValue && !currencyValue) {
    fieldErrors.currency = "Currency is required for paid announcements.";
  }
  if (
    publishDurationDaysValue != null &&
    Number(publishDurationDaysValue) <= 0
  ) {
    fieldErrors.publishDurationDays = "Publish duration must be positive.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid obituary data.",
      data: { fieldErrors },
    });
  }

  // ---------------- PREPARATION DONNEES ----------------

  const deceasedFullNameClean = sanitizeString(deceasedFullName);
  const deceasedGivenNamesClean = sanitizeString(deceasedGivenNames);
  const deceasedFamilyNamesClean = sanitizeString(deceasedFamilyNames);

  const titleClean = sanitizeString(title);
  const bodyClean = sanitizeString(content);

  const familyContactNameClean = sanitizeString(familyContactName);
  const familyContactPhoneClean = sanitizeString(familyContactPhone);
  const familyContactWhatsappClean = sanitizeString(familyContactWhatsapp);
  const familyContactEmailClean = sanitizeString(familyContactEmail);

  const denominationClean = sanitizeString(denomination);
  const ageDisplayClean = sanitizeString(ageDisplay);

  const isRuralVal =
    typeof isRuralArea === "boolean" ? (isRuralArea ? 1 : 0) : 0;

  // Age_at_death
  let ageAtDeathValue = null;
  if (dateOfBirth && dateOfDeath) {
    try {
      const dob = new Date(dateOfBirth);
      const dod = new Date(dateOfDeath);
      if (!Number.isNaN(dob.getTime()) && !Number.isNaN(dod.getTime())) {
        let age = dod.getFullYear() - dob.getFullYear();
        const m = dod.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && dod.getDate() < dob.getDate())) age--;
        if (age >= 0 && age <= 130) ageAtDeathValue = age;
      }
    } catch {
      // ignore
    }
  }

  const now = new Date();
  const publishAtValue = publishDirect ? now : null;
  let expiresAtValue = null;

  if (
    publishDirect &&
    publishDurationDaysValue != null &&
    Number(publishDurationDaysValue) > 0
  ) {
    const d = new Date(publishAtValue || now);
    d.setDate(d.getDate() + Number(publishDurationDaysValue));
    expiresAtValue = d;
  }

  const statusValue = publishDirect ? "published" : "draft";
  const visibilityValue = publishDirect ? "public" : "private";

  const formatDateTime = (d) =>
    d ? d.toISOString().slice(0, 19).replace("T", " ") : null;

  // cover_image_url = media principal image, sinon coverImageUrl, sinon null
  const mainCoverUrl =
    normalizedMedia.find((m) => m.isMain && m.mediaType === "image")?.url ||
    coverUrlFallback ||
    null;

  // Slug
  const baseSlug = buildObituaryBaseSlug({
    deceasedFullName: deceasedFullNameClean,
    city: cityClean,
    dateOfDeath,
  });

  const slug = await ensureUniqueSlugForObituary(baseSlug, { requestId });

  // ---------------- TRANSACTION DB ----------------

  try {
    const result = await transaction(
      async (tx) => {
        // 1) obituaries
        const insertSql = `
        INSERT INTO obituaries (
          user_id, account_type,
          deceased_full_name, deceased_given_names, deceased_family_names,
          identity_status, deceased_gender, date_of_birth, date_of_death,
          age_at_death, age_display,
          religion, denomination,
          title, body, main_language,
          slug, visibility, status,
          verification_status, moderation_status,
          publish_at, published_at, expires_at,
          announcement_type, related_obituary_id,
          city, region, country, country_code, is_rural_area,
          family_contact_name, family_contact_phone, family_contact_whatsapp, family_contact_email,
          is_free, pricing_tier, currency, amount_paid,
          publish_duration_days, payment_provider, payment_reference, cover_image_url,
          view_count, created_at, updated_at
        )
        VALUES (
          ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          0, NOW(), NOW()
        )
      `;

        const insertParams = [
          session.userId,
          accountType,

          deceasedFullNameClean,
          deceasedGivenNamesClean,
          deceasedFamilyNamesClean,

          identityStatusValue,
          deceasedGender || null,
          dateOfBirth || null,
          dateOfDeath || null,

          ageAtDeathValue,
          ageDisplayClean,

          religion || null,
          denominationClean,

          titleClean,
          bodyClean,
          languageValue,

          slug,
          visibilityValue,
          statusValue,

          "not_required",
          "clean",

          formatDateTime(publishAtValue),
          publishDirect ? formatDateTime(now) : null,
          formatDateTime(expiresAtValue),

          "death",
          null,

          cityClean,
          regionClean,
          countryClean,
          countryCodeClean,
          isRuralVal,

          familyContactNameClean,
          familyContactPhoneClean,
          familyContactWhatsappClean,
          familyContactEmailClean,

          isFreeValue ? 1 : 0,
          pricingTierValue,

          isFreeValue ? null : currencyValue,
          null, // amount_paid (draft)

          publishDurationDaysValue != null
            ? Number(publishDurationDaysValue)
            : null,
          null, // payment_provider (draft)
          null, // payment_reference (draft)

          mainCoverUrl,
        ];

        const obituaryRes = await tx.query(insertSql, insertParams);
        const obituaryId = obituaryRes.insertId;

        // 2) obituary_events
        if (normalizedEvents.length > 0) {
          const insertEventSql = `
          INSERT INTO obituary_events (
            obituary_id, event_type, title, description,
            starts_at, ends_at, timezone,
            venue_name, venue_address,
            city, region, country, country_code,
            is_main_event, created_at, updated_at
          )
          VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, NOW(), NOW()
          )
        `;

          for (const ev of normalizedEvents) {
            await tx.query(insertEventSql, [
              obituaryId,
              ev.eventType,
              ev.title,
              ev.description,
              ev.startsAt,
              ev.endsAt,
              ev.timezone,
              ev.venueName,
              ev.venueAddress,
              ev.city,
              ev.region,
              ev.country,
              ev.countryCode,
              ev.isMainEvent ? 1 : 0,
            ]);
          }
        }

        // 3) obituary_contacts
        if (Array.isArray(contacts) && contacts.length > 0) {
          const insertContactSql = `
          INSERT INTO obituary_contacts (
            obituary_id, label, name, phone, whatsapp_number, email,
            is_public, is_primary, created_at, updated_at
          )
          VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, NOW(), NOW()
          )
        `;

          for (const c of contacts) {
            if (!c) continue;

            const label = sanitizeString(c.label);
            const name = sanitizeString(c.name);
            const phone = sanitizeString(c.phone);
            const whatsapp = sanitizeString(
              c.whatsappNumber || c.whatsapp_number
            );
            const email = sanitizeString(c.email);
            const isPublic = c.isPublic === false ? 0 : 1;
            const isPrimary = c.isPrimary ? 1 : 0;

            // si complètement vide, on skip
            if (!label && !name && !phone && !whatsapp && !email) continue;

            await tx.query(insertContactSql, [
              obituaryId,
              label,
              name,
              phone,
              whatsapp,
              email,
              isPublic,
              isPrimary,
            ]);
          }
        }

        // 4) obituary_media (TES noms de colonnes ✅)
        if (normalizedMedia.length > 0) {
          const insertMediaSql = `
          INSERT INTO obituary_media (
            obituary_id, event_id,
            media_type, provider, url,
            thumbnail_url, title, description,
            duration_seconds, is_main, sort_order,
            created_at, updated_at
          )
          VALUES (
            ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            NOW(), NOW()
          )
        `;

          for (const m of normalizedMedia) {
            await tx.query(insertMediaSql, [
              obituaryId,
              m.eventId, // peut être null
              m.mediaType,
              m.provider,
              m.url,
              m.thumbnailUrl,
              m.title,
              m.description,
              m.durationSeconds,
              m.isMain ? 1 : 0,
              Number.isFinite(m.sortOrder) ? m.sortOrder : 0,
            ]);
          }
        }

        return { obituaryId, slug };
      },
      { requestId }
    );

    logInfo("Obituary created successfully", {
      obituaryId: result.obituaryId,
      slug: result.slug,
      userId: session.userId,
      requestId,
    });

    return {
      ok: true,
      obituaryId: result.obituaryId,
      slug: result.slug,
      message: "Obituary created successfully.",
    };
  } catch (err) {
    logError("Create obituary failed", {
      error: err.message,
      stack: err.stack,
      userId: session.userId,
      requestId,
    });

    if (err.statusCode) throw err;

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while creating obituary.",
    });
  }
});
