// server/api/obituaries/[slug].put.js
import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { query, transaction } from "../../utils/db.js";
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
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}
function normalizeMedia(list) {
  if (!Array.isArray(list)) return [];

  const allowedTypes = new Set(["image", "video", "link", "other"]);
  const out = [];

  for (const raw of list) {
    if (!raw) continue;

    const mediaType = String(
      raw.mediaType || raw.media_type || "image"
    ).toLowerCase();
    if (!allowedTypes.has(mediaType)) continue;

    const url = sanitizeString(raw.url);
    if (!url) continue; // obligatoire

    out.push({
      eventId: raw.eventId ?? raw.event_id ?? null,
      mediaType,
      provider: sanitizeString(raw.provider) || "direct",
      url,
      thumbnailUrl:
        sanitizeString(raw.thumbnailUrl || raw.thumbnail_url) || null,
      title: sanitizeString(raw.title) || null,
      description: sanitizeString(raw.description) || null,
      durationSeconds: raw.durationSeconds ?? raw.duration_seconds ?? null,
      isMain: !!(raw.isMain || raw.is_main),
      sortOrder: Number(raw.sortOrder ?? raw.sort_order ?? 0) || 0,
    });
  }

  // optionnel : trier par sortOrder
  out.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return out;
}


export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug;
  if (!slugParam) {
    throw createError({ statusCode: 400, statusMessage: "Slug is required." });
  }

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const body = (await readBody(event)) || {};

  logInfo("Update obituary attempt", {
    slug: slugParam,
    userId: session.userId,
    requestId,
  });

  // 1) Load existing obituary
  const rows = await query(
    `
    SELECT *
    FROM obituaries
    WHERE slug = ?
    LIMIT 1
    `,
    [slugParam],
    { requestId }
  );

  if (!rows.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Obituary not found.",
    });
  }

  const existing = rows[0];

  // 2) ACL
  const userIsOwner = existing.user_id === session.userId;
  const userIsAdmin = isAdminOrModerator(session);

  if (!userIsOwner && !userIsAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not allowed to update this obituary.",
    });
  }

  // 3) Extract fields (same keys as create)
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

    title,
    content, // body text
    mainLanguage, // 'fr', 'en', 'pt', 'es'

    city,
    region,
    country,
    countryCode,
    isRuralArea,

    // cover image
    coverImageUrl,

    // primary contact (flat columns)
    familyContactName,
    familyContactPhone,
    familyContactWhatsapp,
    familyContactEmail,

    // monetization (admins only)
    isFree,
    pricingTier,
    currency,
    amountPaid,
    publishDurationDays,
    paymentProvider,
    paymentReference,

    // related rows
    events,
    contacts,
    media,
    // option
    regenSlug,
  } = body;

  // IMPORTANT: do not overwrite events/contacts unless the key is present in payload
  const hasEventsKey = hasOwn(body, "events");
  const hasContactsKey = hasOwn(body, "contacts");
  const hasCoverKey = hasOwn(body, "coverImageUrl");
 const hasMediaKey = hasOwn(body, "media");

  // 4) Validate core fields (fallback to existing if omitted)
  const fieldErrors = {};

  const deceasedFullNameClean = sanitizeString(
    deceasedFullName ?? existing.deceased_full_name
  );
  if (!isNonEmptyString(deceasedFullNameClean)) {
    fieldErrors.deceasedFullName = "Full name of the deceased is required.";
  }

  const titleClean = sanitizeString(title ?? existing.title);
  if (!isNonEmptyString(titleClean) || titleClean.length < MIN_TITLE_LENGTH) {
    fieldErrors.title = `Title is too short (min ${MIN_TITLE_LENGTH} characters).`;
  }

  const bodyClean = sanitizeString(content ?? existing.body);
  if (!isNonEmptyString(bodyClean) || bodyClean.length < MIN_BODY_LENGTH) {
    fieldErrors.content = `Announcement text is too short (min ${MIN_BODY_LENGTH} characters).`;
  }

  const allowedIdentityStatus = ["known", "partial", "unknown"];
  const identityStatusValue =
    identityStatus ?? existing.identity_status ?? "known";
  if (!allowedIdentityStatus.includes(identityStatusValue)) {
    fieldErrors.identityStatus = "Invalid identity status.";
  }

  const allowedGender = ["male", "female"];
  const deceasedGenderValue =
    deceasedGender ?? existing.deceased_gender ?? null;
  if (deceasedGenderValue && !allowedGender.includes(deceasedGenderValue)) {
    fieldErrors.deceasedGender = "Invalid gender.";
  }

  const allowedReligion = ["christian", "muslim", "other"];
  const religionValue = religion ?? existing.religion ?? null;
  if (religionValue && !allowedReligion.includes(religionValue)) {
    fieldErrors.religion = "Invalid religion.";
  }

  const allowedLanguages = ["fr", "en", "pt", "es"];
  const languageValue = mainLanguage ?? existing.main_language ?? "fr";
  if (!allowedLanguages.includes(languageValue)) {
    fieldErrors.mainLanguage = "Invalid language.";
  }

  // Validate events only if user wants to update them
  if (hasEventsKey) {
    if (!Array.isArray(events) || events.length === 0) {
      fieldErrors.events = "At least one event (wake/funeral) is required.";
    } else {
      const hasAtLeastOneStartsAt = events.some(
        (ev) => ev && (ev.startsAt || ev.starts_at)
      );
      if (!hasAtLeastOneStartsAt) {
        fieldErrors.events = "Each event must include a startsAt value.";
      }
    }
  }

  // Monetization: only admin/mod can update, otherwise keep existing values
  let isFreeValue;
  let pricingTierValue;
  let currencyValue;
  let amountPaidValue;
  let publishDurationDaysValue;
  let paymentProviderValue;
  let paymentReferenceValue;

  if (userIsAdmin) {
    isFreeValue = typeof isFree === "boolean" ? isFree : !!existing.is_free;
    pricingTierValue = pricingTier ?? existing.pricing_tier;
    currencyValue = currency ?? existing.currency;
    amountPaidValue =
      amountPaid != null ? Number(amountPaid) : existing.amount_paid;
    publishDurationDaysValue =
      publishDurationDays != null
        ? Number(publishDurationDays)
        : existing.publish_duration_days;
    paymentProviderValue = paymentProvider ?? existing.payment_provider;
    paymentReferenceValue = paymentReference ?? existing.payment_reference;

    if (!isFreeValue) {
      if (!currencyValue) {
        fieldErrors.currency = "Currency is required for paid announcements.";
      }
      if (amountPaidValue == null || Number(amountPaidValue) <= 0) {
        fieldErrors.amountPaid =
          "Amount paid must be greater than 0 for paid announcements.";
      }
    }
    if (
      publishDurationDaysValue != null &&
      Number(publishDurationDaysValue) <= 0
    ) {
      fieldErrors.publishDurationDays = "Publish duration must be positive.";
    }
  } else {
    isFreeValue = !!existing.is_free;
    pricingTierValue = existing.pricing_tier;
    currencyValue = existing.currency;
    amountPaidValue = existing.amount_paid;
    publishDurationDaysValue = existing.publish_duration_days;
    paymentProviderValue = existing.payment_provider;
    paymentReferenceValue = existing.payment_reference;
  }

  if (Object.keys(fieldErrors).length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid obituary data.",
      data: { fieldErrors },
    });
  }

  // 5) Sanitize / fallback other fields
  const deceasedGivenNamesClean = sanitizeString(
    deceasedGivenNames ?? existing.deceased_given_names
  );
  const deceasedFamilyNamesClean = sanitizeString(
    deceasedFamilyNames ?? existing.deceased_family_names
  );

  const cityClean = sanitizeString(city ?? existing.city);
  const regionClean = sanitizeString(region ?? existing.region);
  const countryClean = sanitizeString(country ?? existing.country);
  const countryCodeClean = sanitizeString(countryCode ?? existing.country_code);

  const familyContactNameClean = sanitizeString(
    familyContactName ?? existing.family_contact_name
  );
  const familyContactPhoneClean = sanitizeString(
    familyContactPhone ?? existing.family_contact_phone
  );
  const familyContactWhatsappClean = sanitizeString(
    familyContactWhatsapp ?? existing.family_contact_whatsapp
  );
  const familyContactEmailClean = sanitizeString(
    familyContactEmail ?? existing.family_contact_email
  );

  const denominationClean = sanitizeString(
    denomination ?? existing.denomination
  );
  const ageDisplayClean = sanitizeString(ageDisplay ?? existing.age_display);

  const isRuralVal =
    typeof isRuralArea === "boolean"
      ? isRuralArea
        ? 1
        : 0
      : existing.is_rural_area;

  const dateOfBirthValue = dateOfBirth ?? existing.date_of_birth;
  const dateOfDeathValue = dateOfDeath ?? existing.date_of_death;

  // cover image: only update if key present, otherwise keep existing
  const coverImageUrlClean = hasCoverKey
    ? sanitizeString(coverImageUrl)
    : existing.cover_image_url ?? null;

  // Compute age_at_death if both dates provided
  let ageAtDeathValue = existing.age_at_death;
  if (dateOfBirthValue && dateOfDeathValue) {
    try {
      const dob = new Date(dateOfBirthValue);
      const dod = new Date(dateOfDeathValue);
      if (!Number.isNaN(dob.getTime()) && !Number.isNaN(dod.getTime())) {
        let age = dod.getFullYear() - dob.getFullYear();
        const m = dod.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && dod.getDate() < dob.getDate())) age--;
        if (age >= 0 && age <= 130) ageAtDeathValue = age;
      }
    } catch (_) {
      // ignore
    }
  }

  // 6) Slug: keep, or regenerate if requested
  let finalSlug = existing.slug;
  if (regenSlug === true) {
    const baseSlug = buildObituaryBaseSlug({
      deceasedFullName: deceasedFullNameClean,
      city: cityClean,
      dateOfDeath: dateOfDeathValue,
    });

    finalSlug = await ensureUniqueSlugForObituary(baseSlug, {
      excludeId: existing.id,
      requestId,
    });
  }

  // 7) Transaction: update obituary + optional replace events/contacts
  try {
    const result = await transaction(
      async (tx) => {
        // 7.1 Update obituaries (including cover_image_url)
        const updateSql = `
          UPDATE obituaries
          SET
            deceased_full_name = ?,
            deceased_given_names = ?,
            deceased_family_names = ?,
            identity_status = ?,
            deceased_gender = ?,
            date_of_birth = ?,
            date_of_death = ?,
            age_at_death = ?,
            age_display = ?,
            religion = ?,
            denomination = ?,
            title = ?,
            body = ?,
            main_language = ?,
            slug = ?,
            city = ?,
            region = ?,
            country = ?,
            country_code = ?,
            is_rural_area = ?,
            family_contact_name = ?,
            family_contact_phone = ?,
            family_contact_whatsapp = ?,
            family_contact_email = ?,
            cover_image_url = ?,
            is_free = ?,
            pricing_tier = ?,
            currency = ?,
            amount_paid = ?,
            publish_duration_days = ?,
            payment_provider = ?,
            payment_reference = ?,
            updated_at = NOW()
          WHERE id = ?
        `;

        const updateParams = [
          deceasedFullNameClean,
          deceasedGivenNamesClean,
          deceasedFamilyNamesClean,
          identityStatusValue,
          deceasedGenderValue || null,
          dateOfBirthValue || null,
          dateOfDeathValue || null,
          ageAtDeathValue,
          ageDisplayClean,
          religionValue || null,
          denominationClean,
          titleClean,
          bodyClean,
          languageValue,
          finalSlug,
          cityClean,
          regionClean,
          countryClean,
          countryCodeClean,
          isRuralVal,
          familyContactNameClean,
          familyContactPhoneClean,
          familyContactWhatsappClean,
          familyContactEmailClean,
          coverImageUrlClean,
          isFreeValue ? 1 : 0,
          pricingTierValue,
          isFreeValue ? null : currencyValue,
          isFreeValue ? null : amountPaidValue,
          publishDurationDaysValue,
          isFreeValue ? null : paymentProviderValue,
          isFreeValue ? null : paymentReferenceValue,
          existing.id,
        ];

        await tx.query(updateSql, updateParams);

        // 7.2 Replace events ONLY if provided
        if (hasEventsKey) {
          await tx.query("DELETE FROM obituary_events WHERE obituary_id = ?", [
            existing.id,
          ]);

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

          for (const [index, ev] of (events || []).entries()) {
            if (!ev) continue;

            const evType = sanitizeString(ev.eventType) || "wake";
            const evTitle = sanitizeString(ev.title) || "Event";
            const evDescription = sanitizeString(ev.description);

            const evStartsAt = ev.startsAt || ev.starts_at || null;
            const evEndsAt = ev.endsAt || ev.ends_at || null;

            const evTimezone = sanitizeString(ev.timezone) || null;
            const evVenueName = sanitizeString(ev.venueName);
            const evVenueAddress = sanitizeString(ev.venueAddress);

            const evCity = sanitizeString(ev.city) || cityClean;
            const evRegion = sanitizeString(ev.region) || regionClean;
            const evCountry = sanitizeString(ev.country) || countryClean;
            const evCountryCode =
              sanitizeString(ev.countryCode) || countryCodeClean;

            const isMain = ev.isMainEvent || index === 0 ? 1 : 0;

            // strict: we validated earlier, but keep safety
            if (!evStartsAt) {
              throw createError({
                statusCode: 400,
                statusMessage: "Invalid obituary data.",
                data: {
                  fieldErrors: {
                    events: "Each event must include a startsAt value.",
                  },
                },
              });
            }

            await tx.query(insertEventSql, [
              existing.id,
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

        // 7.3 Replace contacts ONLY if provided
        if (hasContactsKey) {
          await tx.query(
            "DELETE FROM obituary_contacts WHERE obituary_id = ?",
            [existing.id]
          );

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

          if (Array.isArray(contacts) && contacts.length > 0) {
            for (const c of contacts) {
              if (!c) continue;

              const label = sanitizeString(c.label);
              const name = sanitizeString(c.name);
              const phone = sanitizeString(c.phone);
              const whatsapp = sanitizeString(c.whatsappNumber);
              const email = sanitizeString(c.email);

              const isPublic = c.isPublic === false ? 0 : 1;
              const isPrimary = c.isPrimary ? 1 : 0;

              // if totally empty, skip
              if (!label && !name && !phone && !whatsapp && !email) continue;

              await tx.query(insertContactSql, [
                existing.id,
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
        }
  if (hasMediaKey) {
    const normalizedMedia = normalizeMedia(media);

    await tx.query("DELETE FROM obituary_media WHERE obituary_id = ?", [
      existing.id,
    ]);

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
          existing.id,
          m.eventId,
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
  }

        return { obituaryId: existing.id, slug: finalSlug };
      },
      { requestId }
    );

    logInfo("Obituary updated successfully", {
      obituaryId: result.obituaryId,
      slug: result.slug,
      userId: session.userId,
      requestId,
    });

    return {
      ok: true,
      obituaryId: result.obituaryId,
      slug: result.slug,
      message: "Obituary updated successfully.",
    };
  } catch (err) {
    logError("Update obituary failed", {
      error: err?.message,
      stack: err?.stack,
      slug: slugParam,
      userId: session.userId,
      requestId,
    });

    if (err?.statusCode) throw err;

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while updating obituary.",
    });
  }
});
