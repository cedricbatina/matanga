<template>
  <div class="app-shell">
    <!-- Skip link pour accessibilité -->
    <a href="#main-content" class="skip-link">
      {{ $t('layout.skipLink') }}
    </a>

    <!-- HEADER -->
    <header class="app-header" role="banner">
      <div class="app-header-inner">
        <NuxtLink
          :to="localePath('/')"
          class="app-brand"
          :aria-label="$t('layout.logoAria')"
        >
          <img
            src="/images/logo-madizi.png"
            :alt="$t('layout.logoAlt')"
            class="app-brand__mark"
          />

          <span class="app-brand__text">
            <span class="app-brand__name">{{ $t('layout.logoName') }}</span>
            <span class="app-brand__tagline">{{ $t('layout.logoTagline') }}</span>
          </span>
        </NuxtLink>

        <nav class="app-nav-actions" :aria-label="$t('layout.navMain')">
          <!-- ✅ Language switch (pills) -->
          <div class="lang-switch" aria-label="Language">
            <NuxtLink
              v-for="l in langOptions"
              :key="l.code"
              :to="switchLocalePath(l.code)"
              class="btn btn-sm"
              :class="locale === l.code ? 'btn-secondary' : 'btn-ghost'"
              :aria-current="locale === l.code ? 'page' : undefined"
              prefetch
            >
              {{ l.label }}
            </NuxtLink>
          </div>

          <!-- Theme toggle -->
          <button
            type="button"
            class="btn btn-sm theme-toggle-btn"
            @click="toggleTheme"
            :aria-pressed="theme === 'dark'"
            :aria-label="
              theme === 'dark'
                ? $t('layout.themeToggleToLight')
                : $t('layout.themeToggleToDark')
            "
          >
            <svg
              v-if="theme === 'dark'"
              class="theme-toggle-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4"></circle>
              <path
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              ></path>
            </svg>

            <svg
              v-else
              class="theme-toggle-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3a6.8 6.8 0 1 0 9.8 9.8Z"></path>
            </svg>

            <span class="theme-toggle-label">
              <span v-if="theme === 'dark'">{{ $t('layout.themeLabelLight') }}</span>
              <span v-else>{{ $t('layout.themeLabelDark') }}</span>
            </span>
          </button>
        </nav>
      </div>
    </header>

    <!-- BANDEAU UTILISATEUR -->
    <section class="app-header-user" aria-label="État du compte">
      <div class="app-header-user-inner">
        <UserInlineCard
          :user="user"
          :is-authenticated="isAuthenticated"
          @go-dashboard="onGoToProfile"
          @go-obituaries="onGoToObituaries"
          @go-admin-obituaries="onGoToAdminObituaries"
          @go-moderator-obituaries="onGoToModeratorObituaries"
          @go-notifications="onGoToNotifications"
          @logout="onLogout"
          @login="onLogin"
          @register="onRegister"
        />
      </div>
    </section>

    <main id="main-content" class="app-main" role="main">
      <slot />
    </main>

    <LkConfirmModal />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useI18n } from 'vue-i18n'
import { useTheme } from '~/composables/useTheme'
import { useAuthStore } from '~/stores/auth'
import UserInlineCard from '~/components/UserInlineCard.vue'
import LkConfirmModal from '~/components/LkConfirmModal.vue'

const { theme, toggleTheme } = useTheme()
const authStore = useAuthStore()
const router = useRouter()

// ✅ nuxt-i18n helpers
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale: i18nLocale, locales } = useI18n()

const user = computed(() => authStore.user)
const isAuthenticated = computed(() => authStore.isAuthenticated)

onMounted(() => {
  authStore.ensureAuthLoaded()
})

// locale en string simple pour le template
const locale = computed(() => String(i18nLocale.value || 'fr'))

// options “premium” FR/EN/PT/ES (filtrées si la locale n’existe pas côté config)
const langOptions = computed(() => {
  const available = new Set(
    (Array.isArray(locales.value) ? locales.value : [])
      .map((l) => (typeof l === 'string' ? l : l?.code))
      .filter(Boolean)
  )

  const wanted = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'pt', label: 'PT' },
    { code: 'es', label: 'ES' },
  ]

  // si locales n’est pas renseigné, on affiche quand même “wanted”
  if (available.size === 0) return wanted
  return wanted.filter((l) => available.has(l.code))
})

// ✅ helper navigation interne (toujours locale-aware)
const go = (path) => router.push(localePath(path))

const onGoToProfile = () => go('/profile')
const onGoToObituaries = () => go('/profile/obituaries')
const onGoToAdminObituaries = () => go('/admin/obituaries')
const onGoToModeratorObituaries = () => go('/moderator/obituaries')
const onGoToNotifications = () => go('/notifications')

const onLogin = () => go('/login')
const onRegister = () => go('/register')

const onLogout = async () => {
  try {
    await authStore.logout()
  } finally {
    go('/')
  }
}
</script>




<style scoped>
/* Helpers accessibilité */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Header pro : léger, net, stable */
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--color-border-subtle, rgba(0,0,0,.08));
  background: var(--color-surface, rgba(255,255,255,.82));
  backdrop-filter: blur(10px);
}

.app-header-inner {
  max-width: var(--max-width-page, 1120px);
  margin: 0 auto;
  padding: 0.75rem var(--space-4, 1.25rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}.app-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  min-width: 0;
}

.app-brand__mark {
  height: 34px;
  width: auto;
  display: block;
}

.app-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 0;
}

.app-brand__name {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.06em;
  color: var(--color-text-main);
}

.app-brand__tagline {
  margin-top: 0.15rem;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted); /* ✅ lisible en dark */
}

/* Toggle thème : pill contrasté (au lieu de ghost) */
.theme-toggle-btn {
  background: var(--color-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-soft);
}

.theme-toggle-btn:hover:not(:disabled) {
  background: var(--color-surface-muted);
  transform: translateY(-1px);
}

.theme-toggle-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.theme-toggle-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.theme-toggle-label {
  display: inline-flex;
  align-items: center;
}

/* Sur mobile : garder juste l’icône */
@media (max-width: 480px) {
  .theme-toggle-label {
    display: none;
  }
}



/* Actions */
.app-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  width: 34px;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle, rgba(0,0,0,.10));
  background: transparent;
  cursor: pointer;
}

.icon-btn:hover {
  background: rgba(0,0,0,.04);
}

.icon {
  width: 18px;
  height: 18px;
}

/* Bandeau utilisateur : plus “pro”, moins “grisâtre” */
.app-header-user {
  border-bottom: 1px solid var(--color-border-subtle, rgba(0,0,0,.08));
  background: var(--color-surface-muted, rgba(250,250,250,.85));
}

.app-header-user-inner {
  max-width: var(--max-width-page, 1120px);
  margin: 0 auto;
  padding: 0.35rem var(--space-4, 1.25rem) 0.45rem;
}

/* Mobile : réduire la tagline */
@media (max-width: 560px) {
  .app-brand__tagline {
    display: none;
  }
}

/* Petit polish, sans casser ton design */
.lang-switch {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  margin-right: 0.5rem;
}

</style>
