<!--D:\works\lectures\Matanga\matanga\app\pages\payments\[paymentId].vue-->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation paiement"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('checkoutPayment.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('checkoutPayment.subtitle') }}
        </p>
      </header>

      <!-- Loading / error -->
      <div v-if="pending" class="checkout-loading">
        <div class="checkout-skeleton" />
        <div class="checkout-skeleton" />
      </div>

      <div
        v-else-if="error"
        class="checkout-error"
        role="alert"
        aria-live="polite"
      >
        <p class="checkout-error__text">
          {{ errorMessage }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('checkoutPayment.actions.retry') }}
        </button>
      </div>

      <div
        v-else-if="payment && obituary"
        class="checkout-layout"
      >
        <!-- Colonne principale : récap annonce -->
        <section
          class="card checkout-main"
          aria-label="Récapitulatif commande"
        >
          <div class="card-body checkout-main__body">
            <!-- Annonce -->
            <section class="checkout-section">
              <h2 class="checkout-section__title">
                {{ t('checkoutPayment.sections.obituary.title') }}
              </h2>
              <p class="checkout-section__subtitle">
                {{ t('checkoutPayment.sections.obituary.subtitle') }}
              </p>

              <dl class="checkout-dl">
                <div class="checkout-dl__row">
                  <dt>{{ t('checkoutPayment.fields.deceasedName') }}</dt>
                  <dd>{{ obituary.deceasedFullName || '—' }}</dd>
                </div>
                <div class="checkout-dl__row">
                  <dt>{{ t('checkoutPayment.fields.obituaryTitle') }}</dt>
                  <dd>{{ obituary.title || '—' }}</dd>
                </div>
                <div class="checkout-dl__row">
                  <dt>{{ t('checkoutPayment.fields.obituaryStatus') }}</dt>
                  <dd>{{ humanObituaryStatus }}</dd>
                </div>
              </dl>
            </section>

            <!-- Plan -->
            <section class="checkout-section">
              <h2 class="checkout-section__title">
                {{ t('checkoutPayment.sections.plan.title') }}
              </h2>

              <dl class="checkout-dl">
                <div class="checkout-dl__row">
                  <dt>{{ t('checkoutPayment.fields.planType') }}</dt>
                  <dd>
                    <span v-if="planLabel">
                      {{ planLabel }}
                    </span>
                    <span v-else>
                      {{ plan?.code || t('checkoutPayment.fields.planTypeFallback') }}
                    </span>
                  </dd>
                </div>

                <div
                  v-if="plan && plan.publishDurationDays"
                  class="checkout-dl__row"
                >
                  <dt>{{ t('checkoutPayment.fields.publishDuration') }}</dt>
                  <dd>
                    {{
                      t('checkoutPayment.publishDurationDays', {
                        days: plan.publishDurationDays,
                      })
                    }}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </section>

        <!-- Colonne droite : encadré paiement -->
        <aside
          class="card checkout-side"
          aria-label="Paiement sécurisé"
        >
          <div class="card-body checkout-side__body">
            <p class="checkout-side__status">
              {{ t('checkoutPayment.side.status') }}
            </p>

            <h2 class="checkout-side__title">
              {{ t('checkoutPayment.side.title') }}
            </h2>

            <p class="checkout-side__amount">
              {{ formattedAmount }}
            </p>

            <p class="checkout-side__method">
              {{ t('checkoutPayment.side.methodPrefix') }}
              <strong>{{ humanPaymentMethod }}</strong>
            </p>

            <p class="checkout-side__hint">
              {{ t('checkoutPayment.side.hint') }}
            </p>

            <div class="checkout-side__actions">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="goBackToConfirm"
              >
                {{ t('checkoutPayment.actions.backToReview') }}
              </button>

              <button
                type="button"
                class="btn btn-primary"
                :disabled="isProcessing"
                @click="onProceed"
              >
                <span v-if="isProcessing">
                  {{ t('checkoutPayment.actions.processing') }}
                </span>
                <span v-else>
                  {{ t('checkoutPayment.actions.proceed') }}
                </span>
              </button>
            </div>

            <p class="checkout-side__legal">
              {{ t('checkoutPayment.side.legal') }}
            </p>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  middleware: ["auth"],
});

import { computed, ref } from "vue";
import {
  useRoute,
  useRouter,
  useSeoMeta,
  useFetch,
  useNuxtApp,
} from "#imports";
import { useI18n } from "vue-i18n";
import PageNavBar from "~/components/PageNavBar.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;

const paymentId = computed(() => route.params.paymentId);

// 📡 Récupération de la transaction
const {
  data,
  pending,
  error,
  refresh,
} = await useFetch(() => `/api/payments/${paymentId.value}`, {
  key: () => `payment-${paymentId.value}`,
});

const payload = computed(() => data.value || null);
const payment = computed(() => payload.value?.payment || null);
const obituary = computed(() => payload.value?.obituary || null);
const plan = computed(() => payload.value?.plan || null);

// SEO
useSeoMeta({
  title: () => {
    const base = t("checkoutPayment.meta.title");
    const name = obituary.value?.deceasedFullName;
    return name ? `${base} – ${name}` : base;
  },
  description: () => t("checkoutPayment.meta.description"),
});

// Helpers
const errorMessage = computed(() => {
  if (!error.value) return "";
  return (
    error.value?.data?.statusMessage ||
    error.value?.data?.message ||
    error.value?.message ||
    t("checkoutPayment.errors.generic")
  );
});

const formattedAmount = computed(() => {
  if (!payment.value) return "—";
  const amount = Number(payment.value.amount || 0);
  const currency = payment.value.currency || "EUR";

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
});

const humanPaymentMethod = computed(() => {
  const method = payment.value?.method || "card";
  const key = `checkoutPayment.methods.${method}`;
  // si la clé n’existe pas, on renvoie la valeur brute
  const translated = t(key, method);
  return translated || method;
});

const humanObituaryStatus = computed(() => {
  const status = obituary.value?.status || "draft";
  const key = `checkoutPayment.obituaryStatus.${status}`;
  const translated = t(key, status);
  return translated || status;
});

const planLabel = computed(() => {
  if (plan.value?.labelKey) {
    return t(plan.value.labelKey);
  }
  return null;
});

// Actions
const isProcessing = ref(false);

const goBackToConfirm = () => {
  if (!obituary.value?.slug) {
    router.push("/obituaries");
    return;
  }
  router.push(`/obituary/confirm/${obituary.value.slug}`);
};

const onProceed = () => {
  if (!payment.value) return;
  if (isProcessing.value) return;

  isProcessing.value = true;

  try {
    // TODO: branchement réel Stripe / PayPal / virement / mobile money
    console.info("TODO: démarrer le flux réel de paiement pour", {
      paymentId: payment.value.paymentId,
      provider: payment.value.provider,
      method: payment.value.method,
      amount: payment.value.amount,
      currency: payment.value.currency,
    });

    if (toast) {
      toast.info(t("toasts.payment.flowTodo"));
    }
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
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

.checkout-main__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.checkout-section {
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--space-3);
}
.checkout-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.checkout-section__title {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  font-weight: 600;
}

.checkout-section__subtitle {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

/* DL */
.checkout-dl {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.checkout-dl__row {
  display: grid;
  gap: 0.15rem;
}

.checkout-dl__row dt {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}

.checkout-dl__row dd {
  margin: 0;
  font-size: 0.93rem;
}

/* Side card */
.checkout-side__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.checkout-side__status {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}

.checkout-side__title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
}

.checkout-side__amount {
  margin: 0.15rem 0 0.4rem;
  font-size: 1.4rem;
  font-weight: 700;
}

.checkout-side__method {
  margin: 0;
  font-size: 0.9rem;
}

.checkout-side__hint {
  margin: 0.4rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

.checkout-side__actions {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

@media (min-width: 600px) {
  .checkout-side__actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.checkout-side__legal {
  margin: 0.4rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}

/* Loading / error */
.checkout-loading {
  display: grid;
  gap: 0.9rem;
}

.checkout-skeleton {
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

.checkout-error {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.checkout-error__text {
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
