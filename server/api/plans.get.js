// server/api/plans.get.js
import { defineEventHandler } from "h3";
import { INDIVIDUAL_PLANS, PRO_PLANS } from "../utils/pricingPlans.js";

export default defineEventHandler(() => {
  return {
    ok: true,
    individual: Object.values(INDIVIDUAL_PLANS),
    pro: Object.values(PRO_PLANS),
  };
});
