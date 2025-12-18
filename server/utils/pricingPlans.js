// utils/pricingPlans.js
// Central registry for all pricing plans (particulier + pro).
// !! Single source of truth for codes, durations, prices and main features !!
// Other parts of the app (API / UI) should rely on these objects or on
// findPlanByCode / ALL_PLANS_BY_CODE rather than redefining plans locally.

/**
 * Common notes:
 * - accountType: "individual" | "pro"
 * - scope: "obituary" (par annonce) | "memorial" | "account"
 * - billingType: "oneoff" | "subscription"
 * - publishDurationDays: durée de mise en avant de l’annonce
 *   (pour les plans « à vie », on utilise 3650j ≈ 10 ans et on affiche
 *   un texte marketing du type « à vie (10 ans renouvelables gratuitement) »).
 * - basePriceCents / priceCents: prix TTC en centimes d’euro.
 */

// ---------------------------------------------------------------------------
// Plans particuliers (par annonce)
// ---------------------------------------------------------------------------

export const INDIVIDUAL_PLANS = {
  // Gratuit – annonce simple 14 jours
  FREE_7: {
    code: "indiv_free_7",
    labelKey: "plans.codes.indiv_free_7",
    label: "Annonce découverte – 14 jours",
    description:
      "Annonce simple, visible 14 jours avec un événement principal et quelques photos.",
    accountType: "individual",
    scope: "obituary",
    billingType: "oneoff",

    isFree: true,
    isPublic: true,
    pricingTier: "indiv_free_7",
    currency: null,
    basePriceCents: 0,
    priceCents: 0,
    publishDurationDays: 14,

    features: {
      maxEvents: 1,
      maxPhotos: 3,
      maxVideos: 0,
      maxContacts: 1,
      maxTextChars: 400,
      allowedEventTypes: ["wake", "funeral", "burial", "memorial"],
      hasCondolenceWall: false,
      allowCondolences: false,
      allowCandles: false,
      allowFlowers: false,
      highlightedListing: false,
      analyticsLevel: "basic",
      supportLevel: "standard",
      primaryVisibilityDays: 14,
      secondaryVisibilityDays: 0,
    },

    // Tous les plans, même gratuits, exigent les docs
    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 10,
  },

  // Essentiel – 30 jours (entrée de gamme payante)
  BASIC_21: {
    code: "indiv_basic_21",
    labelKey: "plans.codes.indiv_basic_21",
    label: "Formule Essentiel – 30 jours",
    description:
      "Pour annoncer dignement les obsèques, avec plusieurs événements et plus de photos.",
    accountType: "individual",
    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "indiv_basic_21",
    currency: "EUR",
    basePriceCents: 1450, // 14,50 €
    priceCents: 1450,
    publishDurationDays: 30,

    features: {
      maxEvents: 3,
      maxPhotos: 6,
      maxVideos: 0,
      maxContacts: 3,
      maxTextChars: 500,
      allowedEventTypes: ["wake", "funeral", "burial", "memorial"],
      hasCondolenceWall: false,
      allowCondolences: false,
      allowCandles: false,
      allowFlowers: false,
      highlightedListing: false,
      analyticsLevel: "basic",
      supportLevel: "standard",
      primaryVisibilityDays: 30,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 20,
  },

  // Confort – 45 jours
  ESSENTIEL_30: {
    code: "indiv_essentiel_30",
    labelKey: "plans.codes.indiv_essentiel_30",
    label: "Formule Confort – 45 jours",
    description:
      "Annonce plus complète, visible plus longtemps, avec plusieurs événements et davantage de médias.",
    accountType: "individual",
    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "indiv_essentiel_30",
    currency: "EUR",
    basePriceCents: 2500, // 25 €
    priceCents: 2500,
    publishDurationDays: 45,

    features: {
      maxEvents: 6,
      maxPhotos: 10,
      maxVideos: 1,
      maxContacts: 5,
      maxTextChars: 600,
      allowedEventTypes: ["wake", "funeral", "burial", "memorial"],
      hasCondolenceWall: true,
      allowCondolences: true,
      allowCandles: true,
      allowFlowers: true,
      highlightedListing: true,
      analyticsLevel: "enhanced",
      supportLevel: "priority",
      primaryVisibilityDays: 45,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 30,
  },

  // Prestige – 90 jours
  PRESTIGE_60: {
    code: "indiv_prestige_60",
    labelKey: "plans.codes.indiv_prestige_60",
    label: "Formule Prestige – 90 jours",
    description:
      "Visibilité longue durée, jusqu’à 10 événements, 15 photos, vidéos et mur de condoléances.",
    accountType: "individual",
    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "indiv_prestige_60",
    currency: "EUR",
    basePriceCents: 3500, // 35 €
    priceCents: 3500,
    publishDurationDays: 90,

    features: {
      maxEvents: 10,
      maxPhotos: 15, // limite globale souhaitée
      maxVideos: 2,
      maxContacts: 8,
      maxTextChars: 600,
      allowedEventTypes: ["wake", "funeral", "burial", "memorial"],
      hasCondolenceWall: true,
      allowCondolences: true,
      allowCandles: true,
      allowFlowers: true,
      highlightedListing: true,
      analyticsLevel: "enhanced",
      supportLevel: "priority",
      primaryVisibilityDays: 90,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 40,
  },
};

// ---------------------------------------------------------------------------
// Plans particuliers – mémoriels (longue durée)
// ---------------------------------------------------------------------------

export const INDIVIDUAL_MEMORIAL_PLANS = {
  // Mémorial 6 mois
  MEMORIAL_6M: {
    code: "indiv_memorial_6m",
    labelKey: "plans.codes.indiv_memorial_6m",
    label: "Mémorial 6 mois",
    description: "Page hommage avec mur de condoléances, visible 6 mois.",
    accountType: "individual",
    scope: "memorial",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "indiv_memorial_6m",
    currency: "EUR",
    basePriceCents: 2900, // 29 €
    priceCents: 2900,
    publishDurationDays: 180,

    features: {
      maxEvents: 6,
      maxPhotos: 15,
      maxVideos: 2,
      maxContacts: 5,
      maxTextChars: 600,
      allowedEventTypes: ["memorial"],
      hasCondolenceWall: true,
      allowCondolences: true,
      allowCandles: true,
      allowFlowers: true,
      highlightedListing: true,
      analyticsLevel: "enhanced",
      supportLevel: "priority",
      primaryVisibilityDays: 180,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 110,
  },

  // Mémorial 1 an
  MEMORIAL_1Y: {
    code: "indiv_memorial_1y",
    labelKey: "plans.codes.indiv_memorial_1y",
    label: "Mémorial 1 an",
    description:
      "Page hommage en ligne avec mur de condoléances, visible pendant 1 an.",
    accountType: "individual",
    scope: "memorial",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "indiv_memorial_1y",
    currency: "EUR",
    basePriceCents: 4900, // 49 €
    priceCents: 4900,
    publishDurationDays: 365,

    features: {
      maxEvents: 10,
      maxPhotos: 15,
      maxVideos: 3,
      maxContacts: 8,
      maxTextChars: 600,
      allowedEventTypes: ["memorial"],
      hasCondolenceWall: true,
      allowCondolences: true,
      allowCandles: true,
      allowFlowers: true,
      highlightedListing: true,
      analyticsLevel: "enhanced",
      supportLevel: "priority",
      primaryVisibilityDays: 365,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 120,
  },

  // Mémorial “à vie” (techniquement 10 ans renouvelables)
  MEMORIAL_LIFETIME: {
    code: "indiv_memorial_lifetime",
    labelKey: "plans.codes.indiv_memorial_lifetime",
    label: "Mémorial à vie (10 ans renouvelables)",
    description:
      "Page hommage longue durée, avec mur de condoléances, photos et vidéos, renouvelable gratuitement au-delà de 10 ans.",
    accountType: "individual",
    scope: "memorial",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "indiv_memorial_lifetime",
    currency: "EUR",
    basePriceCents: 9900, // 99 €
    priceCents: 9900,
    publishDurationDays: 3650, // ≈ 10 ans

    features: {
      maxEvents: 10,
      maxPhotos: 15,
      maxVideos: 3,
      maxContacts: 10,
      maxTextChars: 600,
      allowedEventTypes: ["memorial"],
      hasCondolenceWall: true,
      allowCondolences: true,
      allowCandles: true,
      allowFlowers: true,
      highlightedListing: true,
      analyticsLevel: "advanced",
      supportLevel: "priority",
      primaryVisibilityDays: 3650,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 130,
  },
};

// ---------------------------------------------------------------------------
// Plans Pro (par annonce)
// ---------------------------------------------------------------------------

export const PRO_PLANS = {
  // Annonce pro 30 jours
  BASIC_30: {
    code: "pro_basic_30",
    labelKey: "plans.codes.pro_basic_30",
    label: "Annonce pro – 30 jours",
    description:
      "Pour une maison funéraire, une paroisse ou une association : 1 annonce pro, 30 jours de visibilité.",
    accountType: "pro",
    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "pro_basic_30",
    currency: "EUR",
    basePriceCents: 1500, // 15 €
    priceCents: 1500,
    publishDurationDays: 30,

    features: {
      maxEvents: 10,
      maxPhotos: 15,
      maxVideos: 2,
      maxContacts: 5,
      maxTextChars: 600,
      allowedEventTypes: ["wake", "funeral", "burial", "memorial"],
      hasCondolenceWall: false,
      includeOrganisationLogo: true,
      highlightedListing: true,
      analyticsLevel: "basic",
      supportLevel: "standard",
      canReuseTemplate: true,
      primaryVisibilityDays: 30,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 210,
  },

  // Pack pro Essentiel 90 jours
  ESSENTIEL_90: {
    code: "pro_essentiel_90",
    labelKey: "plans.codes.pro_essentiel_90",
    label: "Pack pro Essentiel – 90 jours",
    description:
      "Pour suivre tout le programme des obsèques sur 3 mois, avec plusieurs événements et logo de la structure.",
    accountType: "pro",
    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "pro_essentiel_90",
    currency: "EUR",
    basePriceCents: 2900, // 29 €
    priceCents: 2900,
    publishDurationDays: 90,

    features: {
      maxEvents: 10,
      maxPhotos: 15,
      maxVideos: 3,
      maxContacts: 8,
      maxTextChars: 600,
      allowedEventTypes: ["wake", "funeral", "burial", "memorial"],
      hasCondolenceWall: true,
      includeOrganisationLogo: true,
      highlightedListing: true,
      analyticsLevel: "enhanced",
      supportLevel: "priority",
      canReuseTemplate: true,
      primaryVisibilityDays: 90,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 220,
  },

  // Pack pro Prestige 365 jours
  PRESTIGE_365: {
    code: "pro_prestige_365",
    labelKey: "plans.codes.pro_prestige_365",
    label: "Pack pro Prestige – 365 jours",
    description:
      "Pour un accompagnement sur toute l’année (commémorations, messes, veillées), avec statistiques de visites.",
    accountType: "pro",
    scope: "obituary",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "pro_prestige_365",
    currency: "EUR",
    basePriceCents: 5900, // 59 €
    priceCents: 5900,
    publishDurationDays: 365,

    features: {
      maxEvents: 10,
      maxPhotos: 15,
      maxVideos: 3,
      maxContacts: 10,
      maxTextChars: 600,
      allowedEventTypes: ["wake", "funeral", "burial", "memorial"],
      hasCondolenceWall: true,
      includeOrganisationLogo: true,
      highlightedListing: true,
      analyticsLevel: "advanced",
      supportLevel: "priority",
      canReuseTemplate: true,
      primaryVisibilityDays: 365,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 230,
  },

  // Mémorial pro long terme
  MEMORIAL_LIFETIME: {
    code: "pro_memorial_lifetime",
    labelKey: "plans.codes.pro_memorial_lifetime",
    label: "Mémorial pro – 10 ans renouvelables",
    description:
      "Page hommage pro de longue durée (10 ans renouvelables), idéale pour les grandes figures ou les familles accompagnées sur le long terme.",
    accountType: "pro",
    scope: "memorial",
    billingType: "oneoff",

    isFree: false,
    isPublic: true,
    pricingTier: "pro_memorial_lifetime",
    currency: "EUR",
    basePriceCents: 12000, // 120 €
    priceCents: 12000,
    publishDurationDays: 3650,

    features: {
      maxEvents: 10,
      maxPhotos: 15,
      maxVideos: 3,
      maxContacts: 10,
      maxTextChars: 600,
      allowedEventTypes: ["memorial"],
      hasCondolenceWall: true,
      includeOrganisationLogo: true,
      highlightedListing: true,
      analyticsLevel: "advanced",
      supportLevel: "priority",
      canReuseTemplate: true,
      primaryVisibilityDays: 3650,
      secondaryVisibilityDays: 0,
    },

    requireIdDocument: true,
    requireDeathCertificate: true,
    deathCertificateDeadlineDays: 7,

    sortOrder: 240,
  },
};

// ---------------------------------------------------------------------------
// Plans Pro – abonnements (maison funéraire, diocèse…)
// ---------------------------------------------------------------------------

export const PRO_SUBSCRIPTION_PLANS = {
  START: {
    code: "pro_sub_start",
    labelKey: "plans.codes.pro_sub_start",
    label: "Abonnement Start",
    description:
      "Pour une petite structure qui publie quelques annonces chaque mois.",
    accountType: "pro",
    scope: "account",
    billingType: "subscription",
    billingPeriod: "month",

    isFree: false,
    isPublic: false,
    pricingTier: "pro_sub_start",
    currency: "EUR",
    priceCents: 3900, // 39 €/mois

    maxAnnouncementsPerPeriod: 5,

    features: {
      maxActiveObituaries: 10,
      includeOrganisationLogo: true,
      analyticsLevel: "enhanced",
      supportLevel: "priority",
      canReuseTemplate: true,
      canInviteTeam: false,
    },

    sortOrder: 310,
  },

  STANDARD: {
    code: "pro_sub_standard",
    labelKey: "plans.codes.pro_sub_standard",
    label: "Abonnement Standard",
    description:
      "Pour une maison funéraire ou une paroisse qui publie régulièrement des annonces.",
    accountType: "pro",
    scope: "account",
    billingType: "subscription",
    billingPeriod: "month",

    isFree: false,
    isPublic: false,
    pricingTier: "pro_sub_standard",
    currency: "EUR",
    priceCents: 7900, // 79 €/mois

    maxAnnouncementsPerPeriod: 15,

    features: {
      maxActiveObituaries: 40,
      includeOrganisationLogo: true,
      analyticsLevel: "advanced",
      supportLevel: "priority",
      canReuseTemplate: true,
      canInviteTeam: true,
    },

    sortOrder: 320,
  },

  NETWORK: {
    code: "pro_sub_network",
    labelKey: "plans.codes.pro_sub_network",
    label: "Abonnement Réseau",
    description:
      "Pour un réseau de maisons funéraires ou un diocèse qui souhaite centraliser les annonces.",
    accountType: "pro",
    scope: "account",
    billingType: "subscription",
    billingPeriod: "month",

    isFree: false,
    isPublic: false,
    pricingTier: "pro_sub_network",
    currency: "EUR",
    priceCents: 14900, // 149 €/mois

    maxAnnouncementsPerPeriod: 50,

    features: {
      maxActiveObituaries: 150,
      includeOrganisationLogo: true,
      analyticsLevel: "advanced",
      supportLevel: "priority",
      canReuseTemplate: true,
      canInviteTeam: true,
      hasDedicatedAccountManager: true,
    },

    sortOrder: 330,
  },
};

// ---------------------------------------------------------------------------
// Registry par code
// ---------------------------------------------------------------------------

const ALL_PLANS_BY_CODE = {};

/**
 * Enregistre un plan dans le registre global sous :
 * - plan.code
 * - plan.pricingTier (si différent)
 */
function registerPlan(plan) {
  if (!plan || !plan.code) return;

  const clone = { ...plan };
  ALL_PLANS_BY_CODE[plan.code] = clone;

  if (plan.pricingTier && plan.pricingTier !== plan.code) {
    ALL_PLANS_BY_CODE[plan.pricingTier] = clone;
  }
}

Object.values(INDIVIDUAL_PLANS).forEach(registerPlan);
Object.values(INDIVIDUAL_MEMORIAL_PLANS).forEach(registerPlan);
Object.values(PRO_PLANS).forEach(registerPlan);
Object.values(PRO_SUBSCRIPTION_PLANS).forEach(registerPlan);

export { ALL_PLANS_BY_CODE };

/**
 * Retrouve un plan à partir d’un code ou d’un pricingTier.
 * Retourne null si inconnu.
 */
export function findPlanByCode(planCode) {
  if (!planCode) return null;
  return ALL_PLANS_BY_CODE[planCode] || null;
}

/**
 * Plan gratuit par défaut pour les particuliers.
 */
export function getDefaultIndividualFreePlan() {
  return INDIVIDUAL_PLANS.FREE_7;
}
