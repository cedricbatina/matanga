// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/i18n"],
  css: ["~/assets/css/main.css"],
  i18n: {
    locales: [
      { code: "fr", iso: "fr-FR", file: "fr.json", name: "Français" },
      { code: "en", iso: "en-US", file: "en.json", name: "English" },
      { code: "pt", iso: "pt-PT", file: "pt.json", name: "Português" },
      { code: "es", iso: "es-ES", file: "es.json", name: "Español" },
    ],
    defaultLocale: "fr",
    strategy: "prefix_except_default",
    lazy: true,
    langDir: "locales",

    // ⚠️ ICI, on met un CHEMIN, pas un objet
    vueI18n: "./i18n.config.js",
  },
});
