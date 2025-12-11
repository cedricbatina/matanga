<!-- pages/payments/return.vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation retour paiement"
      :show-back-home="true"
      :show-back-list="true"
      back-list-to="/obituaries"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('paymentsReturn.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('paymentsReturn.subtitle') }}
        </p>
      </header>

      <section class="card payments-return">
        <div class="card-body payments-return__body">
          <!-- Badge / statut -->
          <p class="payments-return__status">
            {{ t('paymentsReturn.status.waitingModeration') }}
          </p>

          <!-- Texte principal -->
          <p class="payments-return__text">
            {{ t('paymentsReturn.status.explainer', { provider: providerLabel }) }}
          </p>

          <!-- Info annonce -->
          <p
            v-if="slug"
            class="payments-return__slug"
          >
            {{ t('paymentsReturn.status.slugHint', { slug }) }}
          </p>

          <!-- Actions -->
          <div class="payments-return__actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!slug"
              @click="goToObituary"
            >
              {{ t('paymentsReturn.buttons.viewObituary') }}
            </button>

            <button
              type="button"
              class="btn btn-ghost"
              @click="goToList"
            >
              {{ t('paymentsReturn.buttons.backToList') }}
            </button>
          </div>

          <!-- Note moderateurs -->
          <p class="payments-return__note">
            {{ t('paymentsReturn.status.moderationNote') }}
          </p>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  // On peut exiger l'auth ici, car c’est la personne connectée qui paie
  middleware: ['auth'],
});

import { computed } from 'vue';
import { useRoute, useRouter, useSeoMeta } from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const provider = computed(() => {
  const raw = route.query.provider;
  return typeof raw === 'string' ? raw : null;
});

const slug = computed(() => {
  const raw = route.query.slug;
  return typeof raw === 'string' ? raw : null;
});

const providerLabel = computed(() => {
  switch (provider.value) {
    case 'stripe':
      return t('paymentsReturn.providers.stripe');
    case 'paypal':
      return t('paymentsReturn.providers.paypal');
    case 'bank_transfer':
      return t('paymentsReturn.providers.bankTransfer');
    default:
      return t('paymentsReturn.providers.other');
  }
});

// SEO
useSeoMeta({
  title: () => t('paymentsReturn.meta.title'),
  description: () => t('paymentsReturn.meta.description'),
});

// Actions
const goToObituary = () => {
  if (!slug.value) return;

  router.push({
    path: `/obituary/${slug.value}`,
  });
};

const goToList = () => {
  router.push('/obituaries');
};
</script>

<style scoped>
.payments-return__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payments-return__status {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-soft);
}

.payments-return__text {
  margin: 0;
  font-size: 0.95rem;
}

.payments-return__slug {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.payments-return__actions {
  margin-top: 0.8rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.payments-return__note {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
</style>
