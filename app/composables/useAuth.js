// composables/useAuth.js
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/auth";

export function useAuth(options = {}) {
  const { fetchUser = true } = options;

  const auth = useAuthStore();
  const { user, isAuthenticated, roles, isAdmin, isPro, loading, error } =
    storeToRefs(auth);

  // Hydratation automatique si demandé
  if (fetchUser) {
    if (process.server) {
      // En SSR, on utilise onServerPrefetch pour attendre /api/auth/me
      onServerPrefetch(async () => {
        if (!auth.initialized) {
          await auth.ensureAuthLoaded();
        }
      });
    } else if (process.client) {
      // Côté client, on s'assure aussi que c'est fait au premier montage
      onMounted(async () => {
        if (!auth.initialized) {
          await auth.ensureAuthLoaded();
        }
      });
    }
  }

  return {
    auth,
    user,
    isAuthenticated,
    roles,
    isAdmin,
    isPro,
    loading,
    error,
  };
}
