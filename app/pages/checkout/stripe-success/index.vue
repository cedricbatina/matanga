<!-- pages/checkout/stripe-success/index.vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation retour Stripe"
      :show-back-home="true"
      :show-back-list="true"
      back-list-to="/obituaries"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('checkoutStripeSuccess.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('checkoutStripeSuccess.subtitle') }}
        </p>
      </header>

      <!-- Loading -->
      <div v-if="pending" class="success-loading">
        <div class="success-skeleton" />
        <p class="success-loading-text">
          {{ t('checkoutStripeSuccess.loading') }}
        </p>
      </div>

      <!-- Erreur -->
      <div
        v-else-if="error || !result || !result.ok"
        class="success-error"
        role="alert"
      >
        <h2 class="success-error__title">
          {{ t('checkoutStripeSuccess.errorTitle') }}
        </h2>
        <p class="success-error__text">
          {{ backendMessage || t('checkoutStripeSuccess.errorText') }}
        </p>

        <div class="success-actions">
          <NuxtLink
            to="/obituaries"
            class="btn btn-ghost btn-sm"
          >
            {{ t('checkoutStripeSuccess.backToList') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Succès -->
      <div
        v-else
        class="card success-card"
      >
        <div class="card-body success-card__body">
          <p class="success-pill">
            ✅ {{ t('checkoutStripeSuccess.paidBadge') }}
          </p>

          <h2 class="success-card__title">
            {{ t('checkoutStripeSuccess.successTitle') }}
          </h2>

          <p class="success-card__text">
            {{ t('checkoutStripeSuccess.successText') }}
          </p>

          <dl class="success-dl">
            <div>
              <dt>{{ t('checkoutStripeSuccess.amount') }}</dt>
              <dd>{{ result.amountFormatted }} ({{ result.currency }})</dd>
            </div>
            <div v-if="result.obituary && result.obituary.slug">
              <dt>{{ t('checkoutStripeSuccess.obituary') }}</dt>
              <dd>{{ result.obituary.title }}</dd>
            </div>
            <div v-if="result.paymentId">
              <dt>{{ t('checkoutStripeSuccess.paymentId') }}</dt>
              <dd>#{{ result.paymentId }}</dd>
            </div>
          </dl>

          <div class="success-actions">
            <NuxtLink
              v-if="result.obituary && result.obituary.slug"
              :to="`/obituary/${result.obituary.slug}`"
              class="btn btn-primary btn-sm"
            >
              {{ t('checkoutStripeSuccess.viewObituary') }}
            </NuxtLink>

            <NuxtLink
              to="/obituaries"
              class="btn btn-ghost btn-sm"
            >
              {{ t('checkoutStripeSuccess.backToList') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'], // si tu veux forcer l’auth sur cette page
});

import { computed } from 'vue';
import {
  useRoute,
  useSeoMeta,
  useFetch,
} from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';

const route = useRoute();
const { t } = useI18n();

const sessionId = computed(() => route.query.session_id || route.query.sessionId || null);

// Appel API pour confirmer la session Stripe
const {
  data,
  pending,
  error,
} = await useFetch(() =>
  sessionId.value
    ? `/api/payments/stripe/confirm?session_id=${encodeURIComponent(
        sessionId.value,
      )}`
    : null,
  {
    key: () => `stripe-success-${sessionId.value || 'none'}`,
  },
);

const result = computed(() => data.value || null);

const backendMessage = computed(() => {
  if (!result.value) return '';
  return result.value.message || '';
});

// SEO
useSeoMeta({
  title: () => t('checkoutStripeSuccess.meta.title'),
  description: () => t('checkoutStripeSuccess.meta.description'),
});
</script>

<style scoped>
.success-loading {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.success-skeleton {
  width: 100%;
  max-width: 460px;
  height: 80px;
  border-radius: 1rem;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.18),
    rgba(148, 163, 184, 0.35),
    rgba(148, 163, 184, 0.18)
  );
  background-size: 200% 100%;
  animation: shimmer 1.3s infinite;
}

.success-loading-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.success-error {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.08);
}

.success-error__title {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.success-error__text {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
}

.success-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.success-pill {
  align-self: flex-start;
  margin: 0;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.success-card__title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 600;
}

.success-card__text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.success-dl {
  margin: 0.2rem 0 0.5rem;
  padding: 0;
  display: grid;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.success-dl div {
  display: grid;
  gap: 0.1rem;
}

.success-dl dt {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}

.success-dl dd {
  margin: 0;
}

.success-actions {
  margin-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* shimmer */
@keyframes shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
