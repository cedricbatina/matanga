// server/api/plans/index.get.js
import { defineEventHandler } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import {
  INDIVIDUAL_PLANS,
  INDIVIDUAL_MEMORIAL_PLANS,
  PRO_PLANS,
  PRO_SUBSCRIPTION_PLANS,
} from "../../utils/pricingPlans.js";

/**
 * Normalise un plan "classique" (annonce ou mémorial) pour le front.
 */
function mapBasePlan(plan, defaults = {}) {
  return {
    code: plan.code,
    label: plan.label,
    description: plan.description,
    accountType: plan.accountType || defaults.accountType || null,
    scope: plan.scope || defaults.scope || "obituary",
    isFree: !!plan.isFree,
    pricingTier: plan.pricingTier || null,
    currency: plan.currency || null,
    basePriceCents:
      typeof plan.basePriceCents === "number" ? plan.basePriceCents : 0,
    publishDurationDays:
      typeof plan.publishDurationDays === "number"
        ? plan.publishDurationDays
        : 0,
    features: plan.features || {},
    billingType: plan.billingType || defaults.billingType || "onetime",
    billingPeriod: plan.billingPeriod || defaults.billingPeriod || null,
  };
}

/**
 * Normalise un plan d’abonnement pro (mensuel).
 */
function mapProSubscriptionPlan(plan) {
  return {
    code: plan.code,
    label: plan.label,
    description: plan.description,
    accountType: plan.accountType || "pro",
    scope: plan.scope || "account",
    isFree: !!plan.isFree,
    pricingTier: plan.pricingTier || null,
    currency: plan.currency || null,
    // Prix mensuel en cents
    basePriceCents:
      typeof plan.priceCents === "number"
        ? plan.priceCents
        : typeof plan.basePriceCents === "number"
        ? plan.basePriceCents
        : 0,
    publishDurationDays: 0, // abonnement → géré par période, pas par jours de visibilité
    features: plan.features || {},
    billingType: plan.billingType || "subscription",
    billingPeriod: plan.billingPeriod || "month",
  };
}

export default defineEventHandler(async (event) => {
  // Pour l’instant on exige un user loggé (tu peux relaxer plus tard si tu veux
  // rendre la page publique).
  const session = await requireAuth(event);
  void session; // on ne l’utilise plus ici, mais on garde la protection.

  // Familles / particuliers – annonces
  const individualObituary = Object.values(INDIVIDUAL_PLANS).map((p) =>
    mapBasePlan(p, {
      accountType: "individual",
      scope: "obituary",
      billingType: "onetime",
    })
  );

  // Familles / particuliers – mémoriaux
  const individualMemorial = Object.values(INDIVIDUAL_MEMORIAL_PLANS).map((p) =>
    mapBasePlan(p, {
      accountType: "individual",
      scope: "memorial",
      billingType: "onetime",
    })
  );

  // Professionnels – annonces à l’unité
  const proObituary = Object.values(PRO_PLANS).map((p) =>
    mapBasePlan(p, {
      accountType: "pro",
      scope: "obituary",
      billingType: "onetime",
    })
  );

  // Professionnels – abonnements / mémoriaux longue durée (espace pro)
  const proMemorial = Object.values(PRO_SUBSCRIPTION_PLANS).map((p) =>
    mapProSubscriptionPlan(p)
  );

  return {
    individualObituary,
    individualMemorial,
    proObituary,
    proMemorial,
  };
});
