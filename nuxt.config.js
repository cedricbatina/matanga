// nuxt.config.js



//const isProd = process.env.NODE_ENV === "production";



const isProd = process.env.NODE_ENV === "production";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  devServer: {
    port: 3004,
    host: "0.0.0.0",
  },

  css: ["~/assets/css/main.css"],
  plugins: [{ src: "~/plugins/toast.client.js" }],

  modules: [
    "@pinia/nuxt",
    "@nuxtjs/i18n",
    // PWA uniquement en production
    ...(isProd ? ["@vite-pwa/nuxt"] : []),
  ],

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
    vueI18n: "./i18n.config.js",
  },

  // Fix HMR / WebSocket
  vite: {
    server: {
      hmr: {
        host: "localhost",
        port: 3004,
      },
    },
  },

  // =======================
  // PWA / VitePWA (prod only)
  // =======================
  pwa: {
    registerType: "autoUpdate",

    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
      globIgnores: ["**/uploads/**"],
      runtimeCaching: [
        // 1) HTML / navigation (pages)
        {
          urlPattern: ({ request }) => request.mode === "navigate",
          handler: "NetworkFirst",
          options: {
            cacheName: "html-pages",
            networkTimeoutSeconds: 5,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24, // 24h
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },

        // 2) Assets statiques (JS, CSS, fonts…)
        {
          urlPattern: ({ request }) =>
            ["style", "script", "worker"].includes(request.destination),
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "static-assets",
            expiration: {
              maxEntries: 80,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },

        // 3) Images
        {
          urlPattern: ({ request }) => request.destination === "image",
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "images",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },

        // 4) API obituaries & plans
        {
          urlPattern: /\/api\/(obituaries|plans)/,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-obituaries-plans",
            networkTimeoutSeconds: 5,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5, // 5 minutes
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],

      // Page de repli quand offline sur navigation
      navigateFallback: "/offline",
    },

    devOptions: {
      enabled: false,
      suppressWarnings: true,
      type: "module",
    },

    client: {
      installPrompt: true,
      periodicSyncForUpdates: true,
    },

    // Manifest web app (Madizi)
    manifest: {
      name: "Madizi — Annonces nécrologiques & veillées",
      short_name: "Madizi",
      description:
        "Madizi — annonces nécrologiques, veillées et programmes d’obsèques en ligne. Tout le programme des obsèques sur une seule page.",
      lang: "fr",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#020617",
      theme_color: "#020617",
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/icons/maskable-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },

    // Meta de base (SEO / PWA)
    meta: {
      theme_color: "#020617",
      mobileApp: true,
      mobileAppIOS: true,
      appleStatusBarStyle: "black-translucent",
      author: "Madizi",
      description:
        "Madizi — annonces nécrologiques, veillées et programmes d’obsèques en ligne. Tout le programme des obsèques sur une seule page.",
    },
  },
  runtimeConfig: {
    public: {
      siteUrl:
        process.env.SITE_URL ||
        process.env.NUXT_PUBLIC_SITE_URL || process.env.BASE_URL || process.env.APP_URL || 
        "https://madizi.com",
    },
  },
});
