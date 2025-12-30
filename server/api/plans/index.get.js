// server/api/plans/index.get.js
import { defineEventHandler } from "h3";
import { getAuthSession } from "../../utils/authSession";
import {
  INDIVIDUAL_PLANS,
  INDIVIDUAL_MEMORIAL_PLANS,
  PRO_PLANS,
  PRO_SUBSCRIPTION_PLANS,
} from "~/utils/pricingPlans.js";

/**
 * Règles métier (source de vérité côté API) :
 * - Particuliers/Familles :
 *   - CNI requise à la création
 *   - Pour publier (après validation admin/modo) : CNI suffit
 *   - Certificat requis sous 7 jours -> sinon on archive (mais pas bloquant publication)
 * - Pro :
 *   - pas de CNI requise
 *   - pas de certificat requis dans ce workflow
 */
function buildDocsPolicy(plan) {
  const accountType = plan?.accountType || null;
  const isIndividual = accountType === "individual";

  if (!isIndividual) {
    return {
      idDocument: {
        requiredForCreate: false,
        requiredForPublish: false,
      },
      deathCertificate: {
        required: false,
        deadlineDays: null,
        requiredForPublish: false,
      },
    };
  }

  return {
    idDocument: {
      requiredForCreate: true,
      requiredForPublish: true, // ✅ publier => CNI suffit
    },
    deathCertificate: {
      required: true, // ✅ exigé au bout de X jours
      deadlineDays: 7,
      requiredForPublish: false, // ✅ pas bloquant pour publier
    },
  };
}

/**
 * Normalise un plan "oneoff" (annonce/mémorial) pour le front.
 */
function mapBasePlan(plan, defaults = {}) {
  const docsPolicy = buildDocsPolicy(plan);

  // prix oneoff : basePriceCents (ou priceCents si tu n'as que ça)
  const basePriceCents =
    typeof plan.basePriceCents === "number"
      ? plan.basePriceCents
      : typeof plan.priceCents === "number"
      ? plan.priceCents
      : 0;

  return {
    code: plan.code,
    label: plan.label,
    labelKey: plan.labelKey || null,
    description: plan.description,

    accountType: plan.accountType || defaults.accountType || null,
    scope: plan.scope || defaults.scope || "obituary",

    isFree: !!plan.isFree,
    pricingTier: plan.pricingTier || null,
    currency: plan.currency || null,
    isPublic: plan.isPublic !== false,
    isRecommended: !!plan.isRecommended,
    sortOrder: Number.isFinite(plan.sortOrder) ? plan.sortOrder : 9999,
    aliases: Array.isArray(plan.aliases) ? plan.aliases : [],

    basePriceCents,
    // (optionnel, utile si un jour tu veux afficher aussi priceCents distinct)
    priceCents:
      typeof plan.priceCents === "number" ? plan.priceCents : basePriceCents,

    publishDurationDays:
      typeof plan.publishDurationDays === "number"
        ? plan.publishDurationDays
        : 0,

    features: plan.features || {},

    billingType: plan.billingType || defaults.billingType || "oneoff",
    billingPeriod: plan.billingPeriod || defaults.billingPeriod || null,

    // ✅ important pour Confirm/Create/Edit
    docsPolicy,
  };
}

/**
 * Normalise un plan d’abonnement pro (mensuel).
 */
function mapProSubscriptionPlan(plan) {
  // pro => docsPolicy none
  const docsPolicy = buildDocsPolicy(plan);

  const priceCents =
    typeof plan.priceCents === "number"
      ? plan.priceCents
      : typeof plan.basePriceCents === "number"
      ? plan.basePriceCents
      : 0;

  return {
    code: plan.code,
    label: plan.label,
    labelKey: plan.labelKey || null,
    description: plan.description,

    accountType: plan.accountType || "pro",
    scope: plan.scope || "account",

    isFree: !!plan.isFree,
    pricingTier: plan.pricingTier || null,
    currency: plan.currency || null,
    isPublic: plan.isPublic !== false,
    isRecommended: !!plan.isRecommended,
    sortOrder: Number.isFinite(plan.sortOrder) ? plan.sortOrder : 9999,
    aliases: Array.isArray(plan.aliases) ? plan.aliases : [],

    // abonnement : prix par période
    basePriceCents: priceCents,
    priceCents,

    // abonnement => pas de durée de visibilité au niveau plan
    publishDurationDays: 0,

    features: plan.features || {},

    billingType: plan.billingType || "subscription",
    billingPeriod: plan.billingPeriod || "month",

    docsPolicy,
  };
}

export default defineEventHandler(async (event) => {
  // Endpoint public : on tente la session, sans bloquer si absent.
  let session = null;
  try {
    session = await getAuthSession(event);
  } catch {
    session = null;
  }
  void session;


const sortByOrder = (a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);

const individualObituary = Object.values(INDIVIDUAL_PLANS)
  .map((p) =>
    mapBasePlan(p, {
      accountType: "individual",
      scope: "obituary",
      billingType: "oneoff",
    })
  )
  .sort(sortByOrder);

const individualMemorial = Object.values(INDIVIDUAL_MEMORIAL_PLANS)
  .map((p) =>
    mapBasePlan(p, {
      accountType: "individual",
      scope: "memorial",
      billingType: "oneoff",
    })
  )
  .sort(sortByOrder);


  // ----- Pro (oneoff) -----
  const proOneOffAll = Object.values(PRO_PLANS).map((p) =>
    mapBasePlan(p, { accountType: "pro", billingType: "oneoff" })
  );

  const proObituary = proOneOffAll.filter((p) => p.scope === "obituary");
  const proMemorialOneOff = proOneOffAll.filter((p) => p.scope === "memorial");

  // ----- Pro (subscriptions) -----
const proSubscriptions = Object.values(PRO_SUBSCRIPTION_PLANS)
  .map(mapProSubscriptionPlan)
  .sort(sortByOrder);

  return {
    ok: true,

    individualObituary,
    individualMemorial,

    proObituary,
    proMemorialOneOff,

    // ✅ nouveau nom clair
    proSubscriptions,

    // ✅ alias temporaire si tu avais déjà du front qui lit proMemorial
    // (tu pourras supprimer plus tard quand tu auras tout migré)
    proMemorial: proSubscriptions,
  };
});
