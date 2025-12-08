// server/api/plans/index.get.js
import { defineEventHandler } from 'h3';
import { requireAuth } from '../../utils/authSession.js';
import { INDIVIDUAL_PLANS, PRO_PLANS } from '../../utils/pricingPlans.js';

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const accountType = session.accountType || 'individual';

  // On renvoie toujours les plans famille (indiv),
  // et on n’expose les plans pro que si le compte est "pro"
  const individual = Object.values(INDIVIDUAL_PLANS).map((p) => ({
    code: p.code,
    label: p.label,
    description: p.description,
    accountType: p.accountType,
    isFree: p.isFree,
    pricingTier: p.pricingTier,
    currency: p.currency,
    basePriceCents: p.basePriceCents,
    publishDurationDays: p.publishDurationDays,
    features: p.features || {},
  }));

  const pro =
    accountType === 'pro'
      ? Object.values(PRO_PLANS).map((p) => ({
          code: p.code,
          label: p.label,
          description: p.description,
          accountType: p.accountType,
          isFree: p.isFree,
          pricingTier: p.pricingTier,
          currency: p.currency,
          basePriceCents: p.basePriceCents,
          publishDurationDays: p.publishDurationDays,
          features: p.features || {},
        }))
      : [];

  return {
    individual,
    pro,
  };
});
