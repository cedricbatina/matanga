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
          {{ t('checkoutStripeCancel.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('checkoutStripeCancel.subtitle') }}
        </p>
      </header>

      <div class="card cancel-card">
        <div class="card-body cancel-card__body">
          <p class="cancel-pill">
            ⚠️ {{ t('checkoutStripeCancel.badge') }}
          </p>

          <p class="cancel-text">
            {{ t('checkoutStripeCancel.text') }}
          </p>

          <div class="cancel-actions">
            <NuxtLink
              v-if="obituarySlug"
              :to="`/checkout/obituary/${obituarySlug}`"
              class="btn btn-primary btn-sm"
            >
              {{ t('checkoutStripeCancel.retry') }}
            </NuxtLink>

            <NuxtLink
              to="/obituaries"
              class="btn btn-ghost btn-sm"
            >
              {{ t('checkoutStripeCancel.backToList') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useSeoMeta } from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';

definePageMeta({
  middleware: ['auth'], // ou pas, comme tu préfères
});

const route = useRoute();
const { t } = useI18n();

const obituarySlug = computed(() => {
  const p = route.query.obituary;
  return typeof p === 'string' && p.length ? p : null;
});

useSeoMeta({
  title: () => t('checkoutStripeCancel.meta.title'),
  description: () => t('checkoutStripeCancel.meta.description'),
});
</script>

<style scoped>
.cancel-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cancel-pill {
  align-self: flex-start;
  margin: 0;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  background: rgba(248, 113, 113, 0.12);
  color: #b91c1c;
}

.cancel-text {
  margin: 0.2rem 0 0.6rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.cancel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
