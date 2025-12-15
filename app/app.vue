<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { computed } from 'vue';
import { useHead, useSeoMeta, useRoute, useRuntimeConfig } from '#imports';
import { useTheme } from '~/composables/useTheme';
import { useI18n } from 'vue-i18n';

// Initialise le thème (clair/sombre) le plus tôt possible
const { theme } = useTheme();

// i18n : pour la langue du <html> et, plus tard, les titres SEO localisés
const { locale } = useI18n();

// Route + config pour les URLs canoniques
const route = useRoute();
const runtimeConfig = useRuntimeConfig();

// Pour l'instant, tu es en local : on met un fallback propre
// Quand tu auras le domaine, tu définiras NUXT_PUBLIC_SITE_URL dans nuxt.config / .env
// ex. public: { siteUrl: 'https://www.matanga.net' }
const siteUrl =
  runtimeConfig.public?.siteUrl ||
  'http://localhost:3004';

const siteName = 'Matanga';

// Langue actuelle (html lang, hreflang…)
const currentLang = computed(() => locale.value || 'fr');

// Canonical dynamique : siteUrl + route.fullPath
const canonicalUrl = computed(() => {
  const base = siteUrl.replace(/\/+$/, '');
  const path = route.fullPath || '/';
  return base + path;
});

// Open Graph locale (simplifié pour l’instant)
const ogLocale = computed(() => {
  switch (currentLang.value) {
    case 'fr':
      return 'fr_FR';
    case 'pt':
      return 'pt_PT';
    case 'es':
      return 'es_ES';
    case 'en':
    default:
      return 'en_US';
  }
});

// Tagline & description globales (pro, pas communautaire)
const defaultTagline = 'Annonces nécrologiques & avis de décès en ligne';
const defaultDescription =
  "Service professionnel d’annonces nécrologiques, avis de décès et informations sur les cérémonies, au service des familles, proches et opérateurs funéraires.";

useHead({
  htmlAttrs: {
    lang: currentLang,
  },
  titleTemplate: (titleChunk) =>
    titleChunk
      ? `${titleChunk} | ${siteName}`
      : `${siteName} – ${defaultTagline}`,
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
    {
      name: 'theme-color',
      content: '#fafafa',
      media: '(prefers-color-scheme: light)',
    },
    {
      name: 'theme-color',
      content: '#050608',
      media: '(prefers-color-scheme: dark)',
    },
    // PWA / iOS
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
  ],
  link: [
    // Canonical
    {
      rel: 'canonical',
      href: canonicalUrl,
    },

    // Favicon SVG principal
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg',
    },

    // PNG 32x32 & 16x16 (à mettre dans /public/icons)
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/icons/icon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/icons/icon-16x16.png',
    },

    // Apple touch icon (on peut réutiliser le 192x192 si tu n'as pas un 180x180)
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/icons/icon-192x192.png',
    },

    // Manifest (si tu veux absolument /site.webmanifest)
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },

    // Alternate (i18n)
    {
      rel: 'alternate',
      hreflang: currentLang,
      href: canonicalUrl,
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteName,
        url: siteUrl,
        description: defaultDescription,
        logo: `${siteUrl}/logo-matanga.png`,
        sameAs: [],
      }),
    },
  ],
});


// Meta SEO globales (les pages pourront surcharger avec useSeoMeta local)
useSeoMeta({
  title: `${siteName} – ${defaultTagline}`,
  description: defaultDescription,
  ogTitle: `${siteName} – ${defaultTagline}`,
  ogDescription: defaultDescription,
  ogSiteName: siteName,
  ogType: 'website',
  ogUrl: canonicalUrl,
  ogLocale: ogLocale,
  twitterCard: 'summary_large_image',
});
</script>
