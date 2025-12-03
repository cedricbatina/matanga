// server/api/obituaries/[slug].put.js
import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { query, transaction } from "../../utils/db.js";
import { logInfo, logError, logDebug } from "../../utils/logger.js";
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

function isAdminOrModerator(session) {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.includes("admin") || roles.includes("moderator");
}

export default defineEventHandler(async (event) => {
  const slugParam = event.context.params?.slug;
  if (!slugParam) {
    throw createError({
      statusCode: 400,
      statusMessage: "Slug is required.",
    });
  }

  const session = await requireAuth(event);
  const requestId =
    event.context.requestId || Math.random().toString(36).slice(2, 10);

  const body = await readBody(event);

  logInfo("Update obituary attempt", {
    slug: slugParam,
    userId: session.userId,
    requestId,
  });

  // 1. Récupérer l’obituary existant
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

  if (rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Obituary not found.",
    });
  }

  const existing = rows[0];

  // 2. Vérifier les droits
  const userIsOwner = existing.user_id === session.userId;
  const userIsAdmin = isAdminOrModerator(session);

  if (!userIsOwner && !userIsAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not allowed to update this obituary.",
    });
  }

  // 3. Extraire les champs du body (mêmes que pour la création)
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
    content, // texte de l'annonce (body)
    mainLanguage, // 'fr', 'en', 'pt', 'es'...

    city,
    region,
    country,
    countryCode,
    isRuralArea,

    // contact principal
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

    // événements associés (table obituary_events)
    events,

    // contacts détaillés (table obituary_contacts)
    contacts,

    // option pour régénérer le slug
    regenSlug,
  } = body || {};

  // 4. Validation de base (obligatoire pour les champs clés)
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

  // events : on exige au moins un événement comme pour la création
  if (!Array.isArray(events) || events.length === 0) {
    fieldErrors.events = "At least one event (wake/funeral) is required.";
  }

  // monétisation : on ne permet la modif de certains champs qu’aux admins
  let isFreeValue;
  let pricingTierValue;
  let currencyValue;
  let amountPaidValue;
  let publishDurationDaysValue;
  let paymentProviderValue;
  let paymentReferenceValue;

  if (userIsAdmin) {
    // Admin : peut modifier monétisation
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
    // User normal : on garde les valeurs existantes
    isFreeValue = !!existing.is_free;
    pricingTierValue = existing.pricing_tier;
    currencyValue = existing.currency;
    amountPaidValue = existing.amount_paid;
    publishDurationDaysValue = existing.publish_duration_days;
    paymentProviderValue = existing.payment_provider;
    paymentReferenceValue = existing.payment_reference;
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid obituary data.",
      data: { fieldErrors },
    });
  }

  // 5. Nettoyage / fallback des autres champs
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

  // Calcul possible de age_at_death si dateOfBirth & dateOfDeath fournis
  let ageAtDeathValue = existing.age_at_death;
  if (dateOfBirthValue && dateOfDeathValue) {
    try {
      const dob = new Date(dateOfBirthValue);
      const dod = new Date(dateOfDeathValue);
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
    } catch (_) {
      // ignore
    }
  }

  // 6. Slug : soit on garde, soit on régénère
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

  // 7. Transaction : UPDATE obituary + replacer events & contacts
  try {
    const result = await transaction(
      async (tx) => {
        // 7.1 UPDATE obituaries
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

        // 7.2 Remplacer les events
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

        if (Array.isArray(events)) {
          for (const [index, ev] of events.entries()) {
            if (!ev) continue;

            const evType = ev.eventType || "wake";
            const evTitle = sanitizeString(ev.title) || "Event";
            const evDescription = sanitizeString(ev.description);
            const evStartsAt = ev.startsAt;
            const evEndsAt = ev.endsAt || null;
            const evTimezone = sanitizeString(ev.timezone) || null;
            const evVenueName = sanitizeString(ev.venueName);
            const evVenueAddress = sanitizeString(ev.venueAddress);
            const evCity = sanitizeString(ev.city || cityClean);
            const evRegion = sanitizeString(ev.region || regionClean);
            const evCountry = sanitizeString(ev.country || countryClean);
            const evCountryCode = sanitizeString(
              ev.countryCode || countryCodeClean
            );
            const isMain = ev.isMainEvent || index === 0 ? 1 : 0;

            if (!evStartsAt) {
              // on peut décider de throw si nécessaire
              continue;
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

        // 7.3 Remplacer les contacts
        await tx.query("DELETE FROM obituary_contacts WHERE obituary_id = ?", [
          existing.id,
        ]);

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
      error: err.message,
      stack: err.stack,
      slug: slugParam,
      userId: session.userId,
      requestId,
    });

    if (err.statusCode) {
      throw err;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal error while updating obituary.",
    });
  }
});
