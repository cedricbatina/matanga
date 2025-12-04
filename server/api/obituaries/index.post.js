// server/api/obituaries/index.post.js
import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { transaction } from "../../utils/db.js";
import { logInfo, logError } from "../../utils/logger.js";
import {
  buildObituaryBaseSlug,
  ensureUniqueSlugForObituary,
} from "../../utils/ensureUniqueSlugForObituary.js";

const MIN_TITLE_LENGTH = 8;
const MIN_BODY_LENGTH = 30;

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function sanitizeString(v) {
  return typeof v === "string" ? v.trim() : null;
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const body = await readBody(event);

  // Champs attendus
  const {
    deceasedFullName,
    deceasedGivenNames,
    deceasedFamilyNames,
    identityStatus, // 'known' | 'partial' | 'unknown'
    deceasedGender, // 'male' | 'female' | null
    dateOfBirth,
    dateOfDeath,
    ageDisplay,
    religion, // 'christian' | 'muslim' | 'other'
    denomination,

    // photo principale
    coverImageUrl,

    title,
    content, // texte de l'annonce (body)
    mainLanguage, // 'fr', 'en', 'pt', 'es'...

    city,
    region,
    country,
    countryCode,
    isRuralArea,

    // contact principal (optionnel)
    familyContactName,
    familyContactPhone,
    familyContactWhatsapp,
    familyContactEmail,

    // monétisation
    isFree,
    pricingTier,
    currency,
    amountPaid,
    publishDurationDays,
    paymentProvider,
    paymentReference,

    // événements associés (table obituary_events) – optionnels
    events,

    // contacts détaillés (table obituary_contacts) – optionnels
    contacts,
  } = body || {};

  logInfo("Create obituary attempt", {
    userId: session.userId,
    email: session.email,
    requestId,
  });

  // ---------- VALIDATION DE BASE ----------

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

  // events optionnels, mais si fournis doivent être un tableau
  if (events != null && !Array.isArray(events)) {
    fieldErrors.events = "Events must be an array.";
  }

  // monétisation basique
  const isFreeValue = typeof isFree === "boolean" ? isFree : true;

  if (!isFreeValue) {
    if (!currency) {
      fieldErrors.currency = "Currency is required for paid announcements.";
    }
    if (amountPaid == null || Number(amountPaid) <= 0) {
      fieldErrors.amountPaid =
        "Amount paid must be greater than 0 for paid announcements.";
    }
  }

  if (publishDurationDays != null && Number(publishDurationDays) <= 0) {
    fieldErrors.publishDurationDays = "Publish duration must be positive.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid obituary data.",
      data: { fieldErrors },
    });
  }

  // ---------- PRÉPARATION DES DONNÉES ----------

  const deceasedFullNameClean = sanitizeString(deceasedFullName);
  const deceasedGivenNamesClean = sanitizeString(deceasedGivenNames);
  const deceasedFamilyNamesClean = sanitizeString(deceasedFamilyNames);
  const titleClean = sanitizeString(title);
  const bodyClean = sanitizeString(content);

  const cityClean = sanitizeString(city);
  const regionClean = sanitizeString(region);
  const countryClean = sanitizeString(country);
  const countryCodeClean = sanitizeString(countryCode);

  const familyContactNameClean = sanitizeString(familyContactName);
  const familyContactPhoneClean = sanitizeString(familyContactPhone);
  const familyContactWhatsappClean = sanitizeString(familyContactWhatsapp);
  const familyContactEmailClean = sanitizeString(familyContactEmail);

  const denominationClean = sanitizeString(denomination);
  const ageDisplayClean = sanitizeString(ageDisplay);
  const coverImageUrlClean = sanitizeString(coverImageUrl);

  // Calcul de age_at_death si dateOfBirth & dateOfDeath fournis
  let ageAtDeathValue = null;
  if (dateOfBirth && dateOfDeath) {
    try {
      const dob = new Date(dateOfBirth);
      const dod = new Date(dateOfDeath);
      if (!Number.isNaN(dob.getTime()) && !Number.isNaN(dod.getTime())) {
        let age = dod.getFullYear() - dob.getFullYear();
        const m = dod.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && dod.getDate() < dob.getDate())) {
          age--;
        }
        if (age >= 0 && age <= 130) {
          ageAtDeathValue = age;
        }
      }
    } catch {
      // on ignore si dates invalides
    }
  }

  // publish_at / published_at / expires_at
  const now = new Date();
  const publishDirect = true; // pour l’instant : publication directe

  const publishAtValue = publishDirect ? now : null;
  let expiresAtValue = null;

  if (publishDurationDays != null && Number(publishDurationDays) > 0) {
    const d = new Date(publishAtValue || now);
    d.setDate(d.getDate() + Number(publishDurationDays));
    expiresAtValue = d;
  }

  const statusValue = publishDirect ? "published" : "draft";

  const formatDateTime = (d) =>
    d ? d.toISOString().slice(0, 19).replace("T", " ") : null;

  // ---------- GÉNÉRATION DU SLUG ----------

  const baseSlug = buildObituaryBaseSlug({
    deceasedFullName: deceasedFullNameClean,
    city: cityClean,
    dateOfDeath,
  });

  const slug = await ensureUniqueSlugForObituary(baseSlug, {
    requestId,
  });

  // ---------- TRANSACTION : obituary + events + contacts ----------

  try {
    const result = await transaction(
      async (tx) => {
        // 1. INSERT dans obituaries
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
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            0, NOW(), NOW()
          )
        `;

        const isRuralVal = isRuralArea ? 1 : 0;

        const insertParams = [
          session.userId,
          session.accountType || "individual",

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
          "public",
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
          pricingTier || (isFreeValue ? "free_basic" : "paid"),
          isFreeValue ? null : currency,
          isFreeValue ? null : Number(amountPaid),

          publishDurationDays != null ? Number(publishDurationDays) : null,
          isFreeValue ? null : paymentProvider || null,
          isFreeValue ? null : paymentReference || null,
          coverImageUrlClean,
        ];

        const obituaryRes = await tx.query(insertSql, insertParams);
        const obituaryId = obituaryRes.insertId;

        // 2. INSERT des events (optionnels)
        if (Array.isArray(events) && events.length > 0) {
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

          for (let index = 0; index < events.length; index++) {
            const ev = events[index];
            if (!ev) continue;

            const evType = ev.eventType || ev.event_type || "wake";
            const evTitle = sanitizeString(ev.title) || "Event";
            const evDescription = sanitizeString(ev.description);
            const evStartsAt = ev.startsAt || ev.starts_at;
            const evEndsAt = ev.endsAt || ev.ends_at || null;
            const evTimezone = sanitizeString(ev.timezone) || null;
            const evVenueName = sanitizeString(ev.venueName || ev.venue_name);
            const evVenueAddress = sanitizeString(
              ev.venueAddress || ev.venue_address
            );
            const evCity = sanitizeString(ev.city || cityClean);
            const evRegion = sanitizeString(ev.region || regionClean);
            const evCountry = sanitizeString(ev.country || countryClean);
            const evCountryCode = sanitizeString(
              ev.countryCode || ev.country_code || countryCodeClean
            );
            const isMain =
              ev.isMainEvent || ev.is_main_event || index === 0 ? 1 : 0;

            // on ignore les événements sans date
            if (!evStartsAt) continue;

            await tx.query(insertEventSql, [
              obituaryId,
              evType,
              evTitle,
              evDescription,
              evStartsAt,
              evEndsAt,
              evTimezone,
              evVenueName,
              evVenueAddress,
              evCity,
              evRegion,
              evCountry,
              evCountryCode,
              isMain,
            ]);
          }
        }

        // 3. INSERT des contacts détaillés (optionnels)
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
            const whatsapp = sanitizeString(c.whatsappNumber);
            const email = sanitizeString(c.email);
            const isPublic = c.isPublic === false ? 0 : 1;
            const isPrimary = c.isPrimary ? 1 : 0;

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

    if (err.statusCode) {
      throw err;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while creating obituary.",
    });
  }
});
