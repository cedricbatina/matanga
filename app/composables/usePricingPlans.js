//app/composables/usePricingPlans
import { findPlanByCode, getAllPlans } from "~/utils/pricingPlans";

export function usePricingPlans() {
  return { findPlanByCode, getAllPlans };
}
