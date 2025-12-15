<template>
  <div class="app-shell">
    <!-- Skip link pour les lecteurs d'écran / clavier -->
    <a href="#main-content" class="skip-link">
      {{ $t('layout.skipLink') }}
    </a>

    <!-- HEADER -->
    <header class="app-header" role="banner">
      <div class="app-header-inner">
        <NuxtLink
          to="/"
          class="app-logo"
          :aria-label="$t('layout.logoAria')"
        >
          <!-- Logo image -->
          <img
            src="/images/logo-madizi.png"
            :alt="$t('layout.logoAlt')"
            class="app-logo-mark"
          />

          <!-- Texte logo -->
          <span class="app-logo-text">
            <span class="app-logo-name">
              {{ $t('layout.logoName') }}
            </span>
            <span class="app-logo-tagline">
              {{ $t('layout.logoTagline') }}
            </span>
          </span>
        </NuxtLink>

        <nav
          class="app-nav-actions"
          :aria-label="$t('layout.navMain')"
        >
          <!-- Toggle thème accessible -->
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="toggleTheme"
            :aria-pressed="theme === 'dark'"
            :aria-label="
              theme === 'dark'
                ? $t('layout.themeToggleToLight')
                : $t('layout.themeToggleToDark')
            "
          >
            <i
              v-if="theme === 'dark'"
              class="fa-regular fa-sun theme-toggle-icon"
              aria-hidden="true"
            ></i>
            <i
              v-else
              class="fa-regular fa-moon theme-toggle-icon"
              aria-hidden="true"
            ></i>

            <span class="theme-toggle-label">
              <span v-if="theme === 'dark'">
                {{ $t('layout.themeLabelLight') }}
              </span>
              <span v-else>
                {{ $t('layout.themeLabelDark') }}
              </span>
            </span>
          </button>

          <!-- Plus tard : login / profil dans la nav principale si tu veux -->
          <!--
          <NuxtLink to="/login" class="btn btn-secondary btn-sm">
            {{ $t('auth.login') }}
          </NuxtLink>
          -->
        </nav>
      </div>
    </header>

    <!-- BANDEAU UTILISATEUR SOUS LA NAV -->
    <section class="app-header-user" aria-label="État du compte">
      <div class="app-header-user-inner">
        <UserInlineCard
          :user="user"
          :is-authenticated="isAuthenticated"
          @go-dashboard="onGoToProfile"
            @go-obituaries="onGoToObituaries"
             @go-admin-obituaries="onGoToAdminObituaries"
  @go-moderator-obituaries="onGoToModeratorObituaries"
          @logout="onLogout"
          @login="onLogin"
          @register="onRegister"
        />
      </div>
    </section>

    <!-- CONTENU PRINCIPAL -->
    <main id="main-content" class="app-main" role="main">
      <slot />
    </main>

    <LkConfirmModal />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from '#imports';
import { useI18n } from 'vue-i18n';
import { useTheme } from '~/composables/useTheme';
import { useAuthStore } from '~/stores/auth';
import UserInlineCard from '~/components/UserInlineCard.vue';
import LkConfirmModal from '~/components/LkConfirmModal.vue';

const { theme, toggleTheme } = useTheme();
const authStore = useAuthStore();
const router = useRouter();

// initialise i18n dans le layout (utile pour le composant enfant)
useI18n();

const user = computed(() => authStore.user);
const isAuthenticated = computed(() => authStore.isAuthenticated);

onMounted(() => {
  authStore.ensureAuthLoaded();
});

const onGoToProfile = () => {
  router.push('/profile'); // adapte si ton espace client a un autre chemin
};

const onLogout = async () => {
  try {
    await authStore.logout();
  } finally {
    router.push('/');
  }
};

const onLogin = () => {
  router.push('/login');
};

const onGoToObituaries = () => {
  router.push('/profile/obituaries')
}
const onRegister = () => {
  router.push('/register');
};
const onGoToAdminObituaries = () => {
  router.push('/admin/obituaries');
};

const onGoToModeratorObituaries = () => {
  router.push('/moderator/obituaries');
};
</script>

<style scoped>
/* Bandeau utilisateur sous le header principal */
.app-header-user {
  border-bottom: 1px solid var(--color-border-subtle, #e5e7eb);
  background: var(--color-surface-muted, #f9fafb);
}

.app-header-user-inner {
  max-width: var(--max-width-page, 1120px);
  margin: 0 auto;
  padding: 0.3rem var(--space-4, 1.25rem) 0.4rem;
}

.theme-toggle-icon {
  font-size: 0.95rem;
  margin-right: 0.35rem;
}

.theme-toggle-label {
  display: inline-flex;
  align-items: center;
}

/* Optionnel : sur mobile, on peut afficher seulement l'icône */
@media (max-width: 480px) {
  .theme-toggle-label {
    display: none;
  }
}

/* Logo Madizi */
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}

.app-logo-mark {
  height: 32px;
  width: auto;
  display: block;
}

.app-logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.app-logo-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.app-logo-tagline {
  font-size: 0.8rem;
  opacity: 0.85;
}
.btn[aria-pressed="true"] .theme-toggle-icon {
  transform: rotate(180deg);
  transition: transform 0.2s ease;
}

</style>
