// middleware/auth.js
export default defineNuxtRouteMiddleware(async (to) => {
  // (optionnel mais safe) ne protège pas la page login elle-même
  if (to.path === '/login' || to.path === '/register') {
    return;
  }

  let res;

  try {
    // Appel direct à l'API de session
    res = await $fetch('/api/auth/me', {
      credentials: 'include', // garde tes cookies
    });
  } catch (e) {
    console.error('[auth middleware] /api/auth/me failed', e);
    res = null; // on traitera ça comme "non connecté"
  }

  const isLoggedIn = res?.ok && res?.user;

  if (!isLoggedIn) {
    const redirectTo = encodeURIComponent(to.fullPath || '/');
    return navigateTo(`/login?redirect=${redirectTo}&reason=auth_required`);
  }
});
