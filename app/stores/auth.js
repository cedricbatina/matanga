// stores/auth.js
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null, // { id, email, accountType, roles, city, country, locale } ou null
    loading: false,
    error: null,
    initialized: false, // pour éviter de fetch plusieurs fois /me
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    roles: (state) => state.user?.roles || [],
    isAdmin: (state) => state.user?.roles?.includes("admin") || false,
    isPro: (state) => state.user?.accountType === "pro",
  },

  actions: {
    setUser(user) {
      this.user = user;
    },

    clear() {
      this.user = null;
      this.error = null;
      this.loading = false;
      this.initialized = false;
    },

    async fetchMe() {
      this.loading = true;
      this.error = null;

      try {
        const res = await $fetch("/api/auth/me", {
          method: "GET",
        });

        if (res?.ok) {
          this.user = res.user
            ? {
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
              }
            : null;
        } else {
          this.user = null;
        }
      } catch (err) {
        this.error =
          err?.data?.statusMessage ||
          err.message ||
          "Erreur lors de la récupération du profil";
        this.user = null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },

    async ensureAuthLoaded() {
      if (this.initialized) return;
      return this.fetchMe();
    },
    async login({ email, password }) {
      this.loading = true;
      this.error = null;

      try {
        const res = await $fetch("/api/auth/login", {
          method: "POST",
          body: { email, password },
        });

        if (!res?.ok) {
          throw new Error(res?.message || "Erreur de connexion");
        }

        // Les cookies sont en place, on recharge le profil complet
        this.initialized = false;
        await this.fetchMe();
      } catch (err) {
        this.error =
          err?.data?.statusMessage ||
          err.message ||
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
        await $fetch("/api/auth/logout", {
          method: "POST",
        });
      } catch (err) {
        // Même si l'API répond en erreur, on nettoie le client
        this.error = err?.data?.statusMessage || err.message || null;
      } finally {
        this.user = null;
        this.loading = false;
        this.initialized = true; // on considère qu'on sait qu'il n'y a plus de user
      }
    },
  },
});
