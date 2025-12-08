// server/utils/pricingPlans.js

/**
 * Catalogue des plans Matanga.
 *
 * On distingue :
 * - INDIVIDUAL_PLANS : plans par annonce pour les familles / particuliers
 * - INDIVIDUAL_MEMORIAL_PLANS : plans de page mémorielle long terme
 * - PRO_PLANS : plans par annonce pour les pros
 * - PRO_SUBSCRIPTION_PLANS : abonnements de compte pour les pros
 *
 * /api/obituaries/index.post.js utilise findPlanByCode(planCode)
 * pour retrouver un plan, quel que soit son type.
 */

/* ---------------------- PARTICULIERS : PAR ANNONCE ---------------------- */

export const INDIVIDUAL_PLANS = {
  // Plan découverte gratuit
  FREE_7: {
    code: "indiv_free_7",
    label: "Annonce découverte 7 jours",
    description:
      "Annonce simple de base, visible 7 jours avec 1 événement et 1 contact.",
    accountType: "individual",

    scope: "obituary", // plan par annonce
    billingType: "oneoff",

    // Monétisation
    isFree: true,
    pricingTier: "indiv_free_7",
    currency: null,
    basePriceCents: 0,

    // Durée de publication
    publishDurationDays: 7,

    // Caps fonctionnels
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

      primaryVisibilityDays: 7,
      secondaryVisibilityDays: 0,
    },
  },

  // Formule Basic 21 jours
  BASIC_21: {
    code: "indiv_basic_21",
    label: "Formule Basic 21 jours",
    description:
      "Annonce simple pendant 21 jours avec 1 événement, 1 contact et 1 photo.",
    accountType: "individual",

    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "indiv_basic_21",
    currency: "EUR",
    // 18 € → 1800 cents
    basePriceCents: 1800,

    publishDurationDays: 21,

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

      primaryVisibilityDays: 21,
      secondaryVisibilityDays: 0,
    },
  },

  // Pack Essentiel : 30 jours + 15 jours en communiqué
  ESSENTIEL_30: {
    code: "indiv_essentiel_30",
    label: "Pack Essentiel 30 jours + rappel",
    description:
      "Annonce enrichie 30 jours puis 15 jours en communiqué discret, avec plusieurs événements et médias.",
    accountType: "individual",

    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "indiv_essentiel_30",
    currency: "EUR",
    // 25 € → 2500 cents
    basePriceCents: 2500,

    publishDurationDays: 30,

    features: {
      maxEvents: 3,
      allowedEventTypes: [
        "wake",
        "funeral",
        "burial",
        "cremation",
        "memorial",
        "other",
      ],
      maxOnlineEvents: 1,

      maxPhotos: 3,
      maxVideos: 1,
      maxExternalVideoLinks: 1,

      maxContacts: 2,

      allowMemorialPage: true, // mini page mémorielle courte durée
      allowCandles: true,
      allowFlowers: false,
      allowComments: true,

      primaryVisibilityDays: 30,
      secondaryVisibilityDays: 15,
    },
  },

  // Pack Prestige – 60 jours + mini mémoriel
  PRESTIGE_60: {
    code: "indiv_prestige_60",
    label: "Pack Prestige 60 jours",
    description:
      "Annonce haut de gamme 60 jours avec plusieurs événements, photos et mini page mémorielle.",
    accountType: "individual",

    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "indiv_prestige_60",
    currency: "EUR",
    // ex : 49 € → 4900 cents
    basePriceCents: 4900,

    publishDurationDays: 60,

    features: {
      maxEvents: 4,
      allowedEventTypes: [
        "wake",
        "funeral",
        "burial",
        "cremation",
        "memorial",
        "other",
      ],
      maxOnlineEvents: 1,

      maxPhotos: 5,
      maxVideos: 2,
      maxExternalVideoLinks: 2,

      maxContacts: 3,

      allowMemorialPage: true,
      allowCandles: true,
      allowFlowers: true,
      allowComments: true,

      primaryVisibilityDays: 60,
      secondaryVisibilityDays: 30,
    },
  },
};

/* ---------------------- PARTICULIERS : MÉMORIELS LONG TERME ---------------------- */

export const INDIVIDUAL_MEMORIAL_PLANS = {
  MEMORIAL_6M: {
    code: "indiv_memorial_6m",
    label: "Mémoriel 6 mois",
    description:
      "Page mémorielle dédiée pendant 6 mois avec livre d’or et bougies virtuelles.",
    accountType: "individual",

    scope: "memorial",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "indiv_memorial_6m",
    currency: "EUR",
    // exemple : 59 € → 5900
    basePriceCents: 5900,

    publishDurationDays: 180,

    features: {
      maxEvents: 0,
      maxPhotos: 10,
      maxVideos: 2,
      maxExternalVideoLinks: 2,

      maxContacts: 1,

      allowMemorialPage: true,
      allowCandles: true,
      allowFlowers: true,
      allowComments: true,
    },
  },

  MEMORIAL_1Y: {
    code: "indiv_memorial_1y",
    label: "Mémoriel 1 an",
    description:
      "Page mémorielle complète pendant 1 an avec plus de médias et un livre d’or illimité.",
    accountType: "individual",

    scope: "memorial",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "indiv_memorial_1y",
    currency: "EUR",
    basePriceCents: 9900, // 99 €

    publishDurationDays: 365,

    features: {
      maxEvents: 0,
      maxPhotos: 20,
      maxVideos: 3,
      maxExternalVideoLinks: 3,

      maxContacts: 1,

      allowMemorialPage: true,
      allowCandles: true,
      allowFlowers: true,
      allowComments: true,
    },
  },

  MEMORIAL_10Y: {
    code: "indiv_memorial_10y",
    label: "Mémoriel 10 ans",
    description:
      "Page mémorielle de longue durée pendant 10 ans, renouvelable.",
    accountType: "individual",

    scope: "memorial",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "indiv_memorial_10y",
    currency: "EUR",
    basePriceCents: 39000, // 390 €

    publishDurationDays: 3650,

    features: {
      maxEvents: 0,
      maxPhotos: 40,
      maxVideos: 5,
      maxExternalVideoLinks: 5,

      maxContacts: 2,

      allowMemorialPage: true,
      allowCandles: true,
      allowFlowers: true,
      allowComments: true,
    },
  },
};

/* ---------------------- PROS : PAR ANNONCE ---------------------- */

export const PRO_PLANS = {
  PRO_BASIC_30: {
    code: "pro_basic_30",
    label: "Annonce Pro Standard 30 jours",
    description:
      "Annonce professionnelle 30 jours avec logo, coordonnées et plusieurs événements.",
    accountType: "pro",

    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "pro_basic_30",
    currency: "EUR",
    basePriceCents: 3500, // 35 €

    publishDurationDays: 30,

    features: {
      maxEvents: 2,
      allowedEventTypes: [
        "wake",
        "funeral",
        "burial",
        "cremation",
        "memorial",
        "other",
      ],
      maxOnlineEvents: 1,

      maxPhotos: 5,
      maxVideos: 2,
      maxExternalVideoLinks: 2,

      maxContacts: 2,

      allowMemorialPage: false,
      allowCandles: false,
      allowFlowers: false,
      allowComments: false,

      primaryVisibilityDays: 30,
      secondaryVisibilityDays: 0,
      sponsored: false,
    },
  },

  PRO_ESSENTIEL_60: {
    code: "pro_essentiel_60",
    label: "Annonce Pro Essentielle 60 jours",
    description:
      "Annonce professionnelle 60 jours avec plus de médias et mini page mémorielle.",
    accountType: "pro",

    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "pro_essentiel_60",
    currency: "EUR",
    basePriceCents: 5900, // 59 €

    publishDurationDays: 60,

    features: {
      maxEvents: 3,
      allowedEventTypes: [
        "wake",
        "funeral",
        "burial",
        "cremation",
        "memorial",
        "other",
      ],
      maxOnlineEvents: 2,

      maxPhotos: 8,
      maxVideos: 3,
      maxExternalVideoLinks: 3,

      maxContacts: 3,

      allowMemorialPage: true,
      allowCandles: true,
      allowFlowers: false,
      allowComments: true,

      primaryVisibilityDays: 60,
      secondaryVisibilityDays: 30,
      sponsored: false,
    },
  },

  PRO_PREMIUM_90: {
    code: "pro_premium_90",
    label: "Annonce Pro Premium 90 jours",
    description:
      "Annonce professionnelle mise en avant 90 jours avec sponsorisation et page mémorielle.",
    accountType: "pro",

    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    pricingTier: "pro_premium_90",
    currency: "EUR",
    basePriceCents: 9900, // 99 €

    publishDurationDays: 90,

    features: {
      maxEvents: 4,
      allowedEventTypes: [
        "wake",
        "funeral",
        "burial",
        "cremation",
        "memorial",
        "other",
      ],
      maxOnlineEvents: 3,

      maxPhotos: 12,
      maxVideos: 4,
      maxExternalVideoLinks: 4,

      maxContacts: 3,

      allowMemorialPage: true,
      allowCandles: true,
      allowFlowers: true,
      allowComments: true,

      primaryVisibilityDays: 90,
      secondaryVisibilityDays: 60,
      sponsored: true,
    },
  },
};

/* ---------------------- PROS : ABONNEMENTS DE COMPTE ---------------------- */

export const PRO_SUBSCRIPTION_PLANS = {
  PRO_SUB_START: {
    code: "pro_sub_start",
    label: "Abonnement Pro Start",
    description: "Jusqu’à 3 annonces par mois avec visibilité standard.",
    accountType: "pro",

    scope: "account",
    billingType: "subscription",
    billingPeriod: "month",

    isFree: false,
    pricingTier: "pro_sub_start",
    currency: "EUR",
    priceCents: 7900, // 79 €/mois

    maxAnnouncementsPerPeriod: 3,
  },

  PRO_SUB_STUDIO: {
    code: "pro_sub_studio",
    label: "Abonnement Pro Studio",
    description:
      "Jusqu’à 10 annonces par mois avec davantage de visibilité et de médias.",
    accountType: "pro",

    scope: "account",
    billingType: "subscription",
    billingPeriod: "month",

    isFree: false,
    pricingTier: "pro_sub_studio",
    currency: "EUR",
    priceCents: 19900, // 199 €/mois

    maxAnnouncementsPerPeriod: 10,
  },

  PRO_SUB_NETWORK: {
    code: "pro_sub_network",
    label: "Abonnement Pro Réseau",
    description:
      "Jusqu’à 30 annonces par mois avec sponsorisation régulière et visibilité régionale.",
    accountType: "pro",

    scope: "account",
    billingType: "subscription",
    billingPeriod: "month",

    isFree: false,
    pricingTier: "pro_sub_network",
    currency: "EUR",
    priceCents: 39900, // 399 €/mois

    maxAnnouncementsPerPeriod: 30,
  },
};

/* ---------------------- Lookup générique par code ---------------------- */

const ALL_PLANS_BY_CODE = {
  ...Object.values(INDIVIDUAL_PLANS).reduce((acc, plan) => {
    acc[plan.code] = plan;
    return acc;
  }, {}),
  ...Object.values(INDIVIDUAL_MEMORIAL_PLANS).reduce((acc, plan) => {
    acc[plan.code] = plan;
    return acc;
  }, {}),
  ...Object.values(PRO_PLANS).reduce((acc, plan) => {
    acc[plan.code] = plan;
    return acc;
  }, {}),
  ...Object.values(PRO_SUBSCRIPTION_PLANS).reduce((acc, plan) => {
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
