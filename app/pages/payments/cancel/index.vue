<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Retour paiement annulé"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('payments.cancel.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('payments.cancel.subtitle') }}
        </p>
      </header>

      <section class="card payments-card">
        <div class="card-body payments-card__body">
          <div class="payments-status payments-status--error">
            <div class="payments-status__icon">⚠️</div>
            <div class="payments-status__content">
              <h2 class="payments-status__title">
                {{ t('payments.cancel.infoTitle', { provider: providerLabel }) }}
              </h2>
              <p class="payments-status__text">
                {{ t('payments.cancel.infoText') }}
              </p>

              <p class="payments-status__hint">
                {{ t('payments.cancel.hint') }}
              </p>
            </div>
          </div>

          <div class="payments-actions">
            <button
              type="button"
              class="btn btn-primary"
              @click="backToCheckout"
            >
              {{ t('payments.cancel.backToCheckout') }}
            </button>

            <button
              type="button"
              class="btn btn-ghost"
              @click="goToObituaries"
            >
              {{ t('payments.cancel.goToObituaries') }}
            </button>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
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
  const raw = (route.query.provider || '').toString().toLowerCase();
  if (raw === 'stripe' || raw === 'paypal' || raw === 'bank_transfer') {
    return raw;
  }
  return 'unknown';
});

const providerLabel = computed(() => {
  if (provider.value === 'stripe') {
    return t('payments.providers.stripe');
  }
  if (provider.value === 'paypal') {
    return t('payments.providers.paypal');
  }
  if (provider.value === 'bank_transfer') {
    return t('payments.providers.bankTransfer');
  }
  return t('payments.providers.generic');
});

const goToObituaries = () => {
  router.push('/obituaries');
};

const backToCheckout = () => {
  const slug = route.query.slug;
  if (slug) {
    router.push(`/checkout/obituary/${slug}`);
  } else {
    router.push('/obituaries');
  }
};

useSeoMeta({
  title: () => t('payments.cancel.meta.title'),
  description: () => t('payments.cancel.meta.description'),
});
</script>

<style scoped>
.payments-card {
  margin-top: var(--space-3);
}

.payments-card__body {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.payments-status {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
}

.payments-status__icon {
  font-size: 1.6rem;
}

.payments-status__title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 600;
}

.payments-status__text {
  margin: 0 0 0.4rem;
  font-size: 0.95rem;
}

.payments-status__hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

.payments-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
