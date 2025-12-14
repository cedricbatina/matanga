<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation paiement annonce"
      :show-back-home="true"
      :show-back-list="true"
      back-list-to="/obituaries"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('checkoutObituary.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('checkoutObituary.subtitle') }}
        </p>
      </header>

      <div v-if="pending" class="review-loading">
        <div class="review-skeleton" />
        <div class="review-skeleton" />
      </div>

      <div
        v-else-if="error || !obituary"
        class="review-error"
        role="alert"
      >
        <p class="review-error__text">
          {{ t('checkoutObituary.error') }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('checkoutObituary.retry') }}
        </button>
      </div>

      <div v-else class="checkout-layout">
        <!-- Récap annonce / plan -->
        <section class="card checkout-main">
          <div class="card-body checkout-main__body">
            <h2 class="checkout-main__title">
              {{ obituary.content?.title || obituary.title }}
            </h2>
            <p class="checkout-main__meta">
              {{ obituary.deceased?.fullName }}
            </p>

            <p class="checkout-main__plan">
              <span>{{ planLabel }}</span>
              <span>·</span>
              <span>{{ planPrice }}</span>
              <span>·</span>
              <span>
                {{ t('obituaryReview.planMeta', { days: effectivePublishDays }) }}
              </span>
            </p>
          </div>
        </section>

        <!-- Choix du mode de paiement -->
        <aside class="card checkout-side">
          <div class="card-body checkout-side__body">
            <h2 class="checkout-side__title">
              {{ t('checkoutObituary.methods.title') }}
            </h2>
            <p class="checkout-side__subtitle">
              {{ t('checkoutObituary.methods.subtitle') }}
            </p>

            <div class="checkout-methods">
              <button
                type="button"
                class="btn btn-primary btn-block"
                :disabled="loadingProvider === 'stripe'"
                @click="startPayment('stripe')"
              >
                <span v-if="loadingProvider === 'stripe'">
                  {{ t('checkoutObituary.methods.processing') }}
                </span>
                <span v-else>
                  💳 {{ t('checkoutObituary.methods.cardStripe') }}
                </span>
              </button>

              <button
                type="button"
                class="btn btn-ghost btn-block"
                :disabled="loadingProvider === 'paypal'"
                @click="startPayment('paypal')"
              >
                <span v-if="loadingProvider === 'paypal'">
                  {{ t('checkoutObituary.methods.processing') }}
                </span>
                <span v-else>
                  🅿️ {{ t('checkoutObituary.methods.paypal') }}
                </span>
              </button>

              <button
                type="button"
                class="btn btn-ghost btn-block"
                :disabled="loadingProvider === 'bank_transfer'"
                @click="startPayment('bank_transfer')"
              >
                <span v-if="loadingProvider === 'bank_transfer'">
                  {{ t('checkoutObituary.methods.processing') }}
                </span>
                <span v-else>
                  🏦 {{ t('checkoutObituary.methods.bankTransfer') }}
                </span>
              </button>
            </div>

            <!-- Bloc instructions virement -->
            <div
              v-if="bankInstructions"
              class="checkout-bank"
            >
              <h3 class="checkout-bank__title">
                {{ t('checkoutObituary.bank.title') }}
              </h3>
              <p class="checkout-bank__text">
                {{ t('checkoutObituary.bank.intro') }}
              </p>

              <dl class="checkout-bank__dl">
                <div>
                  <dt>IBAN</dt>
                  <dd>{{ bankInstructions.iban }}</dd>
                </div>
                <div v-if="bankInstructions.bic">
                  <dt>BIC</dt>
                  <dd>{{ bankInstructions.bic }}</dd>
                </div>
                <div>
                  <dt>{{ t('checkoutObituary.bank.holder') }}</dt>
                  <dd>{{ bankInstructions.holder }}</dd>
                </div>
                <div>
                  <dt>{{ t('checkoutObituary.bank.reference') }}</dt>
                  <dd>{{ bankInstructions.reference }}</dd>
                </div>
                <div>
                  <dt>{{ t('checkoutObituary.bank.amount') }}</dt>
                  <dd>{{ bankInstructions.amountFormatted }}</dd>
                </div>
              </dl>

              <p class="checkout-bank__note">
                {{ t('checkoutObituary.bank.note') }}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
<script setup>
definePageMeta({
  middleware: ['auth'],
});

import { computed, ref } from 'vue';
import {
  useRoute,
  useRouter,
  useSeoMeta,
  useFetch,
  useNuxtApp,
} from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;

const slug = computed(() => route.params.slug);

// même mini PLAN_META que sur la page de confirm
const PLAN_META = {
  indiv_free_7: {
    code: 'indiv_free_7',
    labelKey: 'plans.codes.indiv_free_7',
    isFree: true,
    currency: null,
    basePriceCents: 0,
    publishDurationDays: 7,
  },
  indiv_basic_21: {
    code: 'indiv_basic_21',
    labelKey: 'plans.codes.indiv_basic_21',
    isFree: false,
    currency: 'EUR',
    basePriceCents: 1800,
    publishDurationDays: 21,
  },
  indiv_essentiel_30: {
    code: 'indiv_essentiel_30',
    labelKey: 'plans.codes.indiv_essentiel_30',
    isFree: false,
    currency: 'EUR',
    basePriceCents: 2500,
    publishDurationDays: 30,
  },
  indiv_prestige_60: {
    code: 'indiv_prestige_60',
    labelKey: 'plans.codes.indiv_prestige_60',
    isFree: false,
    currency: 'EUR',
    basePriceCents: 4900,
    publishDurationDays: 60,
  },
};

// payload obituary
const {
  data,
  pending,
  error,
  refresh,
} = await useFetch(() => `/api/obituaries/${slug.value}`, {
  key: () => `obituary-checkout-${slug.value}`,
});

const payload = computed(() => data.value || null);
const obituary = computed(() => payload.value?.obituary || null);

const planCodeFromData = computed(() => {
  const o = obituary.value;
  const tier = o?.monetization?.pricingTier;
  if (tier && PLAN_META[tier]) {
    return tier;
  }
  const fromQuery = route.query.plan;
  if (typeof fromQuery === 'string' && PLAN_META[fromQuery]) {
    return fromQuery;
  }
  return null;
});

const currentPlanMeta = computed(() => {
  const code = planCodeFromData.value;
  if (!code) return null;
  return PLAN_META[code] || null;
});

const effectivePublishDays = computed(() => {
  const metaDays = currentPlanMeta.value?.publishDurationDays;
  if (typeof metaDays === 'number' && metaDays > 0) {
    return metaDays;
  }
  const o = obituary.value;
  if (!o) return 0;

  const fromCamel =
    typeof o.publishDurationDays === 'number'
      ? o.publishDurationDays
      : null;
  const fromSnake =
    typeof o.publish_duration_days === 'number'
      ? o.publish_duration_days
      : null;

  const rawDays = fromCamel ?? fromSnake;
  if (typeof rawDays === 'number' && rawDays > 0) return rawDays;

  return 0;
});

const planLabel = computed(() => {
  if (currentPlanMeta.value) {
    return t(currentPlanMeta.value.labelKey);
  }
  const code = planCodeFromData.value;
  return code || t('obituaryReview.side.planUnknown');
});

const planPrice = computed(() => {
  const meta = currentPlanMeta.value;
  if (meta) {
    if (meta.isFree) {
      return t('plans.price.free');
    }
    const cents =
      typeof meta.basePriceCents === 'number' ? meta.basePriceCents : 0;
    if (cents > 0) {
      const euros = (cents / 100).toFixed(2);
      return t('plans.price.paid', { amount: euros });
    }
  }
  const o = obituary.value;
  const rawAmount =
    typeof o?.amountPaid === 'number'
      ? o.amountPaid
      : typeof o?.amount_paid === 'number'
        ? o.amount_paid
        : 0;
  if (rawAmount > 0) {
    const euros = rawAmount.toFixed(2);
    return t('plans.price.paid', { amount: euros });
  }
  return '—';
});

// SEO
useSeoMeta({
  title: () => {
    const base = t('checkoutObituary.meta.title');
    const name = obituary.value?.deceased?.fullName;
    return name ? `${base} – ${name}` : base;
  },
  description: () =>
    t('checkoutObituary.meta.description') || '',
});

// état UI paiement
const loadingProvider = ref(null);
const bankInstructions = ref(null);

// démarrage paiement
// démarrage paiement
const startPayment = async (provider) => {
  if (!obituary.value) return;
  if (loadingProvider.value) return;

  loadingProvider.value = provider;
  bankInstructions.value = null;

  try {
    const res = await $fetch("/api/payments/checkout", {
      method: "POST",
      body: {
        provider,
        obituarySlug: slug.value,
        obituaryId: obituary.value?.id || null,
        planCode: planCodeFromData.value,
      },
    });

    // ✅ Stripe / PayPal: redirection si URL
    if (res?.redirectUrl) {
      window.location.assign(res.redirectUrl);
      return;
    }

    // ✅ Bank transfer: affichage instructions
    if (provider === "bank_transfer") {
      if (!res?.ok || !res?.bankTransfer) {
        // Affiche le payload pour comprendre au lieu d'un message trompeur
        console.error("Bank transfer payload unexpected:", res);
        throw new Error("Bank transfer response missing bankTransfer");
      }

      bankInstructions.value = {
        iban: res.bankTransfer.iban,
        bic: res.bankTransfer.bic,
        holder: res.bankTransfer.holder,
        reference: res.bankTransfer.reference,
        amountFormatted: res.amountFormatted,
      };

      toast?.success(t("checkoutObituary.bank.toastSuccess"));
      return;
    }

    // ✅ Providers non configurés: toast info
    if (res?.notConfigured) {
      toast?.info(res.message || t("checkoutObituary.methods.notConfigured"));
      return;
    }

    console.error("Unsupported payment response:", res);
    throw new Error("Unsupported payment response");
  } catch (err) {
    console.error("startPayment error", err);

    const backendMsg =
      err?.data?.statusMessage ||
      err?.data?.message ||
      err?.message ||
      "";

    toast?.error(backendMsg || t("checkoutObituary.methods.error"));
  } finally {
    loadingProvider.value = null;
  }
};





</script>
<style scoped>
/* Layout principal */
.checkout-layout {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 900px) {
  .checkout-layout {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
    align-items: flex-start;
  }
}

/* Colonne gauche : recap annonce */
.checkout-main__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkout-main__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.checkout-main__meta {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.checkout-main__plan {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  color: var(--color-text-soft);
}

/* Colonne droite : modes de paiement */
.checkout-side__body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.checkout-side__title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
}

.checkout-side__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.checkout-methods {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.6rem;
}

/* Boutons plein largeur */
.btn-block {
  width: 100%;
  justify-content: center;
}

/* Bloc instructions virement */
.checkout-bank {
  margin-top: 0.9rem;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--color-border-subtle);
}

.checkout-bank__title {
  margin: 0 0 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.checkout-bank__text {
  margin: 0 0 0.5rem;
  font-size: 0.88rem;
  color: var(--color-text-soft);
}

.checkout-bank__dl {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
  font-size: 0.88rem;
}

.checkout-bank__dl div {
  display: grid;
  gap: 0.1rem;
}

.checkout-bank__dl dt {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}

.checkout-bank__dl dd {
  margin: 0;
}

.checkout-bank__note {
  margin: 0.6rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

/* Loading / error (aligné avec la page de confirm) */
.review-loading {
  display: grid;
  gap: 0.9rem;
}

.review-skeleton {
  height: 120px;
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

.review-error {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.review-error__text {
  margin: 0;
  font-size: 0.9rem;
}

@keyframes shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
