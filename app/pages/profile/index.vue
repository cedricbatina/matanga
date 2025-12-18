<!-- pages/profile/index.vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation espace utilisateur"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('profileHome.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('profileHome.subtitle') }}
        </p>
      </header>

      <div class="profile-home-grid">
        <!-- Carte : Mes annonces -->
        <article class="card profile-home-card">
          <div class="card-body">
            <h2 class="profile-home-card__title">
              {{ t('profileHome.cards.myObituaries.title') }}
            </h2>
            <p class="profile-home-card__text">
              {{ t('profileHome.cards.myObituaries.text') }}
            </p>
            <NuxtLink
              to="/profile/obituaries"
              class="btn btn-primary btn-sm"
            >
              {{ t('profileHome.cards.myObituaries.cta') }}
            </NuxtLink>
          </div>
        </article>

        <!-- Carte : Notifications -->
        <article class="card profile-home-card">
          <div class="card-body">
            <h2 class="profile-home-card__title">
              {{ t('profileHome.cards.notifications.title') }}
            </h2>
            <p class="profile-home-card__text">
              {{ t('profileHome.cards.notifications.text') }}
            </p>
            <NuxtLink
              to="/notifications"
              class="btn btn-ghost btn-sm"
            >
              {{ t('profileHome.cards.notifications.cta') }}
            </NuxtLink>
          </div>
        </article>

        <!-- Carte admin/modérateur, visible seulement si rôle -->
        <article
          v-if="isAdmin || isModerator"
          class="card profile-home-card"
        >
          <div class="card-body">
            <h2 class="profile-home-card__title">
              {{ t('profileHome.cards.moderation.title') }}
            </h2>
            <p class="profile-home-card__text">
              {{ t('profileHome.cards.moderation.text') }}
            </p>

            <div class="profile-home-card__actions">
              <NuxtLink
                v-if="isAdmin"
                to="/admin/obituaries"
                class="btn btn-ghost btn-sm"
              >
                {{ t('profileHome.cards.moderation.adminCta') }}
              </NuxtLink>

              <NuxtLink
                v-if="isModerator"
                to="/moderator/obituaries"
                class="btn btn-ghost btn-sm"
              >
                {{ t('profileHome.cards.moderation.moderatorCta') }}
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
});

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '~/stores/auth';
import PageNavBar from '~/components/PageNavBar.vue';

const { t } = useI18n();
const authStore = useAuthStore();

const user = computed(() => authStore.user || null);
const roles = computed(() =>
  Array.isArray(user.value?.roles) ? user.value.roles : [],
);

const isAdmin = computed(() => roles.value.includes('admin'));
const isModerator = computed(() => roles.value.includes('moderator'));
</script>

<style scoped>
.profile-home-grid {
  margin-top: var(--space-3);
  display: grid;
  gap: 1rem;
}

.profile-home-card__title {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  font-weight: 600;
}

.profile-home-card__text {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.profile-home-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

@media (min-width: 768px) {
  .profile-home-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
