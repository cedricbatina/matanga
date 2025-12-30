import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/login" || to.path === "/register") return;

  const auth = useAuthStore();

  // important : en SSR, ensureAuthLoaded doit forward les cookies (voir option store plus bas)
  if (!auth.initialized) {
    await auth.ensureAuthLoaded();
  }

  if (!auth.user) {
    const redirectTo = encodeURIComponent(to.fullPath || "/");
    return navigateTo(`/login?redirect=${redirectTo}&reason=auth_required`);
  }
});

