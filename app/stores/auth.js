// stores/auth.js
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    roles: (state) => state.user?.roles || [],
    isAdmin: (state) => state.user?.roles?.includes("admin") || false,
    isPro: (state) => state.user?.accountType === "pro",
  },

  actions: {
    clear() {
      this.user = null;
      this.error = null;
      this.loading = false;
      this.initialized = false;
    },

    // ✅ headers optionnels (SSR)
    async fetchMe({ headers } = {}) {
      this.loading = true;
      this.error = null;

      try {
        const res = await $fetch("/api/auth/me", {
          method: "GET",
          headers, // <-- cookie forwarded si SSR
        });

        if (res?.ok && res.user) {
          this.user = {
            id: res.user.userId,
            email: res.user.email,
            accountType: res.user.accountType,
            roles: res.user.roles || [],
            city: res.user.city,
            country: res.user.country,
            locale: res.user.locale,
            firstName: res.user.firstName || null,
            lastName: res.user.lastName || null,
            organizationName: res.user.organizationName || null,
            displayName: res.user.displayName || null,
          };
        } else {
          this.user = null;
        }
      } catch (err) {
        this.error =
          err?.data?.statusMessage ||
          err?.message ||
          "Erreur lors de la récupération du profil";
        this.user = null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },

    async ensureAuthLoaded(opts = {}) {
      if (this.initialized) return;
      await this.fetchMe(opts);
    },

    async login({ email, password }) {
      this.loading = true;
      this.error = null;

      try {
        const res = await $fetch("/api/auth/login", {
          method: "POST",
          body: { email, password },
        });

        if (!res?.ok) throw new Error(res?.message || "Erreur de connexion");

        this.initialized = false;
        await this.fetchMe(); // client: cookies ok automatiquement
      } catch (err) {
        this.error =
          err?.data?.statusMessage ||
          err?.message ||
          "Email ou mot de passe incorrect";
        this.user = null;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      this.error = null;

      try {
        await $fetch("/api/auth/logout", { method: "POST" });
      } catch (err) {
        this.error = err?.data?.statusMessage || err?.message || null;
      } finally {
        this.user = null;
        this.loading = false;
        this.initialized = true;
      }
    },
  },
});
