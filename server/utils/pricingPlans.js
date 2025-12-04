// server/utils/pricingPlans.js

/**
 * Catalogue minimal des plans pour particuliers.
 *
 * NB :
 * - On commence avec 3 plans INDIVIDUELS.
 * - Les PRO viendront ensuite dans PRO_PLANS.
 */

export const INDIVIDUAL_PLANS = {
  // Plan gratuit : 7 jours (creation)
  FREE_7: {
    code: "indiv_free_7",
    label: "Annonce gratuite 7 jours",
    description:
      "Annonce simple, 1 événement, 1 contact, 1 photo, sans diffusion en ligne.",
    accountType: "individual",

    // Monétisation
    isFree: true,
    pricingTier: "indiv_free_7",
    currency: null,
    basePriceCents: 0,

    // Durée de publication initiale
    publishDurationDays: 7,

    // Caps fonctionnels
    features: {
      maxEvents: 1,
      allowedEventTypes: ["wake", "funeral", "burial", "other"],
      maxOnlineEvents: 0,

      maxPhotos: 1, // 1 seule photo de couverture pour l’instant
      maxVideos: 0,
      maxExternalVideoLinks: 0,

      maxContacts: 1,

      allowMemorialPage: false,
      allowCandles: false,
      allowFlowers: false,
      allowComments: false,

      primaryVisibilityDays: 7,
      secondaryVisibilityDays: 0,
    },
  },

  // Plan simple 20 jours
  SIMPLE_20: {
    code: "indiv_simple_20",
    label: "Annonce simple 20 jours",
    description:
      "Annonce simple, 1 événement, 1 contact et 1 photo, visible 20 jours.",
    accountType: "individual",

    isFree: false,
    pricingTier: "indiv_simple_20",
    currency: "EUR",
    // Prix cible : 15 € → 1500 cents
    basePriceCents: 1500,

    publishDurationDays: 20,

    features: {
      maxEvents: 1,
      allowedEventTypes: ["wake", "funeral", "burial", "other"],
      maxOnlineEvents: 0,

      maxPhotos: 1,
      maxVideos: 0,
      maxExternalVideoLinks: 0,

      maxContacts: 1,

      allowMemorialPage: false,
      allowCandles: false,
      allowFlowers: false,
      allowComments: false,

      primaryVisibilityDays: 20,
      secondaryVisibilityDays: 0,
    },
  },

  // Pack Essentiel : 30 jours + 15 jours en communiqué
  ESSENTIEL_30: {
    code: "indiv_essentiel_30",
    label: "Pack Essentiel 30 jours + rappel",
    description:
      "Annonce plus complète pendant 30 jours puis 15 jours en communiqué discret, avec plusieurs événements et médias.",
    accountType: "individual",

    isFree: false,
    pricingTier: "indiv_essentiel_30",
    currency: "EUR",
    // Prix cible direct : 18 € → 1800 cents
    basePriceCents: 1800,

    publishDurationDays: 30,

    features: {
      maxEvents: 3,
      allowedEventTypes: [
        "wake",
        "funeral",
        "burial",
        "cremation",
        "other",
        "memorial",
      ],
      maxOnlineEvents: 1,

      maxPhotos: 5,
      maxVideos: 1,
      maxExternalVideoLinks: 1,

      maxContacts: 2,

      allowMemorialPage: false, // les packs mémoriaux viendront plus tard
      allowCandles: false,
      allowFlowers: false,
      allowComments: false,

      primaryVisibilityDays: 30,
      secondaryVisibilityDays: 15,
    },
  },
};

// Esquisse pour plus tard : plans PRO
export const PRO_PLANS = {
  // Exemple placeholder, non utilisé pour l’instant
  PRO_ESSENTIEL: {
    code: "pro_essentiel_30",
    label: "Pro Essentiel 30 jours",
    description:
      "Pour les opérateurs funéraires. Plusieurs annonces par mois, avec visibilité renforcée.",
    accountType: "pro",
    isFree: false,
    pricingTier: "pro_essentiel_30",
    currency: "EUR",
    basePriceCents: 0, // à définir
    publishDurationDays: 30,
    features: {
      maxEvents: 5,
      maxPhotos: 10,
      maxVideos: 3,
      maxExternalVideoLinks: 3,
      maxContacts: 3,
      maxOnlineEvents: 3,
      allowMemorialPage: true,
      allowCandles: true,
      allowFlowers: true,
      allowComments: true,
      primaryVisibilityDays: 30,
      secondaryVisibilityDays: 30,
    },
  },
};

const ALL_PLANS_BY_CODE = {
  ...Object.values(INDIVIDUAL_PLANS).reduce((acc, plan) => {
    acc[plan.code] = plan;
    return acc;
  }, {}),
  ...Object.values(PRO_PLANS).reduce((acc, plan) => {
    acc[plan.code] = plan;
    return acc;
  }, {}),
};

export function findPlanByCode(planCode) {
  if (!planCode || typeof planCode !== "string") return null;
  return ALL_PLANS_BY_CODE[planCode] || null;
}

export function getDefaultIndividualFreePlan() {
  return INDIVIDUAL_PLANS.FREE_7;
}
