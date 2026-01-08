// app/middleware/auth.js
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/login" || to.path === "/register") return;

  const auth = useAuthStore();

  if (!auth.initialized) {
    // ✅ auto-import Nuxt, pas d'import manuel
    const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;
    await auth.ensureAuthLoaded({ headers });
  }

  if (!auth.user) {
    const redirectTo = encodeURIComponent(to.fullPath || "/");
    return navigateTo(`/login?redirect=${redirectTo}&reason=auth_required`);
  }
});
