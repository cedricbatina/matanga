<!-- pages/obituary/confirm/[slug].vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation récapitulatif d'annonce"
      :show-back-home="true"
      :show-back-list="true"
      back-list-to="/obituaries"
      :show-create="false"
    />

    <section class="section">
      <!-- Header -->
      <header class="section-header">
        <h1 class="section-title">
          {{ t('obituaryReview.title') }}
        </h1>

        <p class="section-subtitle">
          {{ t('obituaryReview.subtitle') }}
        </p>

        <!-- Info plan -->
        <div
          v-if="planLabel || planPrice"
          class="review-plan-banner"
        >
          <div class="review-plan-banner__top">
            <span class="review-plan-banner__plan">
              {{ planLabel || t('obituaryReview.side.planUnknown') }}
            </span>
            <span class="review-plan-banner__price">
              {{ planPrice }}
            </span>
          </div>
          <p class="review-plan-banner__meta">
            {{ t('obituaryReview.planMeta', { days: effectivePublishDays }) }}
          </p>
        </div>
      </header>

      <!-- Loading / error states -->
      <div v-if="pending" class="review-loading">
        <div class="review-skeleton" />
        <div class="review-skeleton" />
      </div>

      <div
        v-else-if="error"
        class="review-error"
        role="alert"
        aria-live="polite"
      >
        <p class="review-error__text">
          {{ t('obituaryReview.error') }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('obituaryReview.retry') }}
        </button>
      </div>

      <!-- Formulaire de confirmation -->
      <form
        v-else-if="obituary"
        class="review-layout"
        @submit.prevent="onConfirm"
      >
        <!-- Colonne principale : contenu de l’annonce -->
        <section
          class="card review-main"
          aria-label="Récapitulatif de l'annonce"
        >
          <div class="card-body review-main__body">
            <!-- Bloc défunt -->
            <section class="review-section">
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.deceased.title') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.deceased.subtitle') }}
              </p>

              <dl class="review-dl">
                <!-- Nom -->
                <div class="review-dl__row">
                  <dt>
                    {{ t('createObituary.fields.deceasedFullName.label') }}
                  </dt>
                  <dd>{{ obituary.deceased?.fullName }}</dd>
                </div>

                <!-- Genre -->
                <div
                  v-if="obituary.deceased?.gender"
                  class="review-dl__row"
                >
                  <dt>{{ t('createObituary.fields.gender.label') }}</dt>
                  <dd>{{ formatGender(obituary.deceased.gender) }}</dd>
                </div>

                <!-- Niveau d’identification -->
                <div
                  v-if="obituary.deceased?.identityStatus"
                  class="review-dl__row"
                >
                  <dt>
                    {{ t('createObituary.fields.identityStatus.label') }}
                  </dt>
                  <dd>
                    {{ formatIdentityStatus(obituary.deceased.identityStatus) }}
                  </dd>
                </div>

                <!-- Dates naissance / décès -->
              <!-- Dates naissance / décès -->
<div
  v-if="
    obituary.deceased?.dateOfBirth ||
    obituary.deceased?.dateOfDeath
  "
  class="review-dl__row"
>
  <dt>{{ t('obituaryReview.fields.dates') }}</dt>
  <dd>
    <span v-if="obituary.deceased?.dateOfBirth">
      {{
        t('obituaryReview.fields.dateOfBirth', {
          date: formatDate(obituary.deceased.dateOfBirth),
        })
      }}
    </span>
    <span
      v-if="
        obituary.deceased?.dateOfBirth &&
        obituary.deceased?.dateOfDeath
      "
    >
      ·
    </span>
    <span v-if="obituary.deceased?.dateOfDeath">
      {{
        t('obituaryReview.fields.dateOfDeath', {
          date: formatDate(obituary.deceased.dateOfDeath),
        })
      }}
    </span>
  </dd>
</div>


                <!-- Âge affiché -->
                <div
                  v-if="obituary.deceased?.ageDisplay"
                  class="review-dl__row"
                >
                  <dt>
                    {{ t('createObituary.fields.ageDisplay.label') }}
                  </dt>
                  <dd>{{ obituary.deceased.ageDisplay }}</dd>
                </div>

                <!-- Religion -->
                <div
                  v-if="
                    obituary.deceased?.religion ||
                    obituary.deceased?.denomination
                  "
                  class="review-dl__row"
                >
                  <dt>{{ t('createObituary.fields.religion.label') }}</dt>
                  <dd>
                    <span v-if="obituary.deceased?.religion">
                      {{ formatReligion(obituary.deceased.religion) }}
                    </span>
                    <span
                      v-if="
                        obituary.deceased?.religion &&
                        obituary.deceased?.denomination
                      "
                    >
                      ·
                    </span>
                    <span v-if="obituary.deceased?.denomination">
                      {{ obituary.deceased.denomination }}
                    </span>
                  </dd>
                </div>

                <!-- Localisation -->
                <div
                  v-if="
                    obituary.location?.city ||
                    obituary.location?.region ||
                    obituary.location?.country
                  "
                  class="review-dl__row"
                >
                  <dt>{{ t('obituaryReview.fields.location') }}</dt>
                  <dd>
                    {{
                      [
                        obituary.location?.city,
                        obituary.location?.region,
                        obituary.location?.country,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    }}
                  </dd>
                </div>

                <!-- Code pays -->
                <div
                  v-if="obituary.location?.countryCode"
                  class="review-dl__row"
                >
                  <dt>{{ t('obituaryReview.fields.countryCode') }}</dt>
                  <dd>{{ obituary.location.countryCode }}</dd>
                </div>

                <!-- Zone rurale / village -->
                <div
                  v-if="
                    obituary.location &&
                    obituary.location.isRuralArea !== undefined
                  "
                  class="review-dl__row"
                >
                  <dt>
                    {{ t('createObituary.fields.isRuralArea.label') }}
                  </dt>
                  <dd>
                    {{
                      obituary.location.isRuralArea
                        ? t('obituaryReview.fields.ruralYes')
                        : t('obituaryReview.fields.ruralNo')
                    }}
                  </dd>
                </div>
              </dl>
            </section>

            <!-- Bloc texte annonce -->
            <section class="review-section">
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.content.title') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.content.subtitle') }}
              </p>

              <h3 class="review-content__title">
                {{ obituary.content?.title }}
              </h3>

              <p class="review-content__body">
                {{ obituary.content?.body }}
              </p>
            </section>

            <!-- Bloc événements -->
            <section class="review-section">
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.events.title') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.events.subtitle') }}
              </p>

              <ul
                v-if="events.length"
                class="review-events"
                aria-label="Liste des événements associés à cette annonce"
              >
                <li
                  v-for="event in events"
                  :key="event.id || event.startsAt || event.venueName"
                  class="review-events__item"
                >
                  <div class="review-events__header">
                    <span class="review-events__type">
                      {{ formatEventType(event.eventType) }}
                    </span>
                    <span
                      v-if="event.isMainEvent"
                      class="review-events__badge"
                    >
                      {{ t('obituaryReview.events.main') }}
                    </span>
                  </div>

                  <p class="review-events__datetime">
                    <span v-if="event.startsAt">
                      {{ formatDateTime(event.startsAt) }}
                    </span>
                    <span v-else>
                      {{ t('obituaryReview.events.datePending') }}
                    </span>
                  </p>

                  <p
                    v-if="event.venueName || event.venueAddress"
                    class="review-events__place"
                  >
                    <strong v-if="event.venueName">
                      {{ event.venueName }}
                    </strong>
                    <br v-if="event.venueName && event.venueAddress" />
                    <span v-if="event.venueAddress">
                      {{ event.venueAddress }}
                    </span>
                  </p>
                </li>
              </ul>

              <p
                v-else
                class="review-empty"
              >
                {{ t('obituaryReview.events.none') }}
              </p>
            </section>

            <!-- Bloc contacts -->
            <section class="review-section">
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.contacts.title') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.contacts.subtitle') }}
              </p>

              <ul
                v-if="contacts.length"
                class="review-contacts"
                aria-label="Contacts famille ou organisation"
              >
                <li
                  v-for="contact in contacts"
                  :key="
                    contact.id ||
                    contact.email ||
                    contact.phone ||
                    contact.name
                  "
                  class="review-contacts__item"
                >
                  <p class="review-contacts__name">
                    <strong>{{ contact.name || contact.label }}</strong>
                    <span v-if="contact.isPrimary">
                      · {{ t('obituaryReview.contacts.primary') }}
                    </span>
                  </p>

                  <ul class="review-contacts__channels">
                    <li v-if="contact.phone">
                      <span>{{ contact.phone }}</span>
                    </li>
                    <li v-if="contact.whatsappNumber">
                      <span>{{ contact.whatsappNumber }}</span>
                    </li>
                    <li v-if="contact.email">
                      <span>{{ contact.email }}</span>
                    </li>
                  </ul>
                </li>
              </ul>

              <p
                v-else
                class="review-empty"
              >
                {{ t('obituaryReview.contacts.none') }}
              </p>
            </section>
          </div>
        </section>

        <!-- Colonne droite : encadré actions / paiement -->
        <aside
          class="card review-side"
          aria-label="Validation et publication"
        >
          <div class="card-body review-side__body">
            <p class="review-side__status">
              {{
                isFreePlan
                  ? t('obituaryReview.side.statusFree')
                  : t('obituaryReview.side.statusPayment')
              }}
            </p>

            <h2 class="review-side__title">
              {{ t('obituaryReview.side.title') }}
            </h2>
            <p class="review-side__subtitle">
              {{ t('obituaryReview.side.subtitle') }}
            </p>

            <ul class="review-side__summary">
              <li>
                <span class="review-side__label">
                  {{ t('obituaryReview.side.plan') }}
                </span>
                <span class="review-side__value">
                  {{ planLabel || t('obituaryReview.side.planUnknown') }}
                </span>
              </li>
              <li>
                <span class="review-side__label">
                  {{ t('obituaryReview.side.duration') }}
                </span>
                <span class="review-side__value">
                  {{ t('obituaryReview.planMeta', { days: effectivePublishDays }) }}
                </span>
              </li>
              <li>
                <span class="review-side__label">
                  {{ t('obituaryReview.side.price') }}
                </span>
                <span class="review-side__value">
                  {{ planPrice }}
                </span>
              </li>
            </ul>

            <p class="review-side__legal">
              {{ t('obituaryReview.side.legal') }}
            </p>
<div class="review-side__actions">
  <!-- Modifier : bouton neutre / secondaire -->
  <button
    type="button"
    class="btn btn-ghost btn-sm"
    @click="onEdit"
  >
    {{ t('obituaryReview.actions.edit') }}
  </button>

  <!-- Confirmer : bouton principal (plein) -->
  <button
    v-if="isFreePlan"
    type="submit"
    class="btn btn-primary btn-sm"
  >
    {{ t('obituaryReview.actions.publishFree') }}
  </button>

  <button
    v-else
    type="button"
    class="btn btn-primary btn-sm"
    @click="onPay"
  >
    {{ t('obituaryReview.actions.confirmAndPay') }}
  </button>

  <!-- Retirer du site : bouton ghost mais en « warning » -->
  <button
    type="button"
    class="btn btn-ghost btn-sm btn-ghost-warning"
    @click="onSoftDeleteClick"
  >
    🗂 {{ t('obituaryReview.actions.archive') || 'Retirer du site' }}
  </button>

  <!-- Supprimer définitivement : vrai bouton danger -->
  <button
    type="button"
    class="btn btn-danger btn-sm"
    @click="onHardDeleteClick"
  >
    🗑 {{ t('obituaryReview.actions.hardDelete') || 'Supprimer définitivement' }}
  </button>
</div>


          </div>
        </aside>
      </form>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
});

import { computed } from 'vue';
import {
  useRoute,
  useRouter,
  useSeoMeta,
  useFetch,
  useNuxtApp,
} from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';
import { useConfirmStore } from '~/stores/confirmStore';
import { useDateUtils } from '~/composables/useDateUtils';

const { formatDate, formattedDateTimeWithSeconds } = useDateUtils();

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

// Toastification (plugin : provide("useToast", ...))
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;

// Store de confirmation (LkConfirmModal)
const confirmStore = useConfirmStore();

const slug = computed(() => route.params.slug);

// 🔹 Mini PLAN_META côté client pour le prix / libellé
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

// 📡 Récupération de la payload par slug
const {
  data,
  pending,
  error,
  refresh,
} = await useFetch(() => `/api/obituaries/${slug.value}`, {
  key: () => `obituary-confirm-${slug.value}`,
});

// Normalisation de la réponse
const payload = computed(() => data.value || null);
const obituary = computed(() => payload.value?.obituary || null);
const events = computed(() => payload.value?.events || []);
const contacts = computed(() => payload.value?.contacts || []);

// SEO dynamique
useSeoMeta({
  title: () => {
    const base = t('obituaryReview.meta.title');
    const name = obituary.value?.deceased?.fullName;
    return name ? `${base} – ${name}` : base;
  },
  description: () => {
    const body =
      obituary.value?.content?.body ||
      obituary.value?.content?.bodyText ||
      '';
    if (body) {
      return body.slice(0, 160);
    }
    return t('obituaryReview.meta.description') || '';
  },
  ogTitle: () => t('obituaryReview.meta.title'),
  ogDescription: () => {
    const body =
      obituary.value?.content?.body ||
      obituary.value?.content?.bodyText ||
      '';
    if (body) {
      return body.slice(0, 160);
    }
    return t('obituaryReview.meta.description') || '';
  },
});

// 🔹 Plan / monétisation
const planCodeFromData = computed(() => {
  const o = obituary.value;
  // On préfère le pricingTier de monetization
  const tier = o?.monetization?.pricingTier;
  if (tier && PLAN_META[tier]) {
    return tier;
  }

  // Fallback : paramètre plan dans l'URL
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

const isFreePlan = computed(() => {
  if (currentPlanMeta.value) {
    return !!currentPlanMeta.value.isFree;
  }
  const m = obituary.value?.monetization;
  if (!m) return false;
  if (typeof m.isFree === 'boolean') return m.isFree;
  return false;
});

const effectivePublishDays = computed(() => {
  // 1) Si on connaît le plan côté front
  const metaDays = currentPlanMeta.value?.publishDurationDays;
  if (typeof metaDays === 'number' && metaDays > 0) {
    return metaDays;
  }

  const o = obituary.value;
  if (!o) {
    // 2) Fallback : si on sait au moins que c'est gratuit, on considère free_7
    if (isFreePlan.value) {
      return PLAN_META.indiv_free_7.publishDurationDays;
    }
    return 0;
  }

  // 3) On regarde ce que renvoie l'API (camelCase / snake_case)
  const fromCamel =
    typeof o.publishDurationDays === 'number'
      ? o.publishDurationDays
      : null;
  const fromSnake =
    typeof o.publish_duration_days === 'number'
      ? o.publish_duration_days
      : null;

  const rawDays = fromCamel ?? fromSnake;

  if (typeof rawDays === 'number' && rawDays > 0) {
    // Si on ne connaît pas le plan mais que l'annonce est gratuite,
    // on force quand même la durée du plan gratuit front (7 jours),
    // pour garder une UX cohérente.
    if (!currentPlanMeta.value && isFreePlan.value) {
      return PLAN_META.indiv_free_7.publishDurationDays;
    }
    return rawDays;
  }

  // 4) Dernier fallback : gratuit → 7 jours ; sinon 0
  if (isFreePlan.value) {
    return PLAN_META.indiv_free_7.publishDurationDays;
  }

  return 0;
});

const planLabel = computed(() => {
  if (currentPlanMeta.value) {
    return t(currentPlanMeta.value.labelKey);
  }

  // Si on sait au moins que c'est gratuit, on affiche le label du plan gratuit
  if (isFreePlan.value) {
    return t(PLAN_META.indiv_free_7.labelKey);
  }

  const code = planCodeFromData.value;
  if (code) {
    return code;
  }

  return null;
});

const planPrice = computed(() => {
  const meta = currentPlanMeta.value;
  const o = obituary.value;

  // 1) Si on connaît le plan côté front
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

  // 2) Sinon on regarde ce que l'API a renvoyé comme montant
  const rawAmount =
    typeof o?.amountPaid === 'number'
      ? o.amountPaid
      : typeof o?.amount_paid === 'number'
        ? o.amount_paid
        : null;

  if (rawAmount && rawAmount > 0) {
    const euros = rawAmount.toFixed(2);
    return t('plans.price.paid', { amount: euros });
  }

  // 3) Si on sait que le plan est gratuit, même sans meta connu
  if (isFreePlan.value) {
    return t('plans.price.free');
  }

  // 4) Dernier fallback : montant inconnu
  return '—';
});

// 🌍 Formatters
const formatEventType = (type) => {
  if (!type) return '';
  switch (type) {
    case 'funeral':
      return t('home.eventTypes.funeral');
    case 'wake':
      return t('home.eventTypes.wake');
    case 'burial':
      return t('home.eventTypes.burial');
    case 'memorial':
      return t('home.eventTypes.memorial');
    default:
      return type;
  }
};

const formatDateTime = (value) => {
  if (!value) return '';
  return formattedDateTimeWithSeconds(value);
};


const formatGender = (value) => {
  if (!value) return '';
  if (value === 'male') {
    return t('createObituary.fields.gender.options.male');
  }
  if (value === 'female') {
    return t('createObituary.fields.gender.options.female');
  }
  return value;
};

const formatIdentityStatus = (value) => {
  switch (value) {
    case 'known':
      return t('createObituary.fields.identityStatus.options.known');
    case 'partial':
      return t('createObituary.fields.identityStatus.options.partial');
    case 'unknown':
      return t('createObituary.fields.identityStatus.options.unknown');
    default:
      return value;
  }
};

const formatReligion = (value) => {
  if (!value) {
    return t('createObituary.fields.religion.options.none');
  }
  if (value === 'christian') {
    return t('createObituary.fields.religion.options.christian');
  }
  if (value === 'muslim') {
    return t('createObituary.fields.religion.options.muslim');
  }
  if (value === 'other') {
    return t('createObituary.fields.religion.options.other');
  }
  return value;
};

// Actions
const onEdit = () => {
  router.push({
    path: `/obituary/edit/${slug.value}`,
  });
};

const onPay = () => {
  // On laisse le choix du moyen de paiement sur la page de checkout
  const plan = planCodeFromData.value || undefined;

  router.push({
    path: `/checkout/obituary/${slug.value}`,
    query: plan ? { plan } : {},
  });
};


const onConfirm = async () => {
  // Si ce n’est pas un plan gratuit, on laisse le bouton "Confirmer et payer"
  if (!isFreePlan.value) {
    onPay();
    return;
  }

  try {
    // Appel réel à l’endpoint de publication (plan gratuit)
    await $fetch(`/api/obituaries/${slug.value}/publish`, {
      method: 'POST',
    });

    if (toast) {
      toast.success(t('toasts.obituary.published'));
    }

    // Rediriger vers la page publique de l’annonce
    await router.push(`/obituary/${slug.value}`);
  } catch (err) {
    console.error('Publish free obituary error', err);
    if (toast) {
      toast.error(t('toasts.obituary.publishError'));
    }
  }
};


// 🔻 Soft delete (archive / rendre privé)
const softDelete = async () => {
  try {
    await $fetch(`/api/obituaries/${slug.value}`, {
      method: 'DELETE',
    });

    if (toast) {
      toast.success('Annonce archivée (retirée de la liste publique).');
    }
    await router.push('/obituaries');
  } catch (err) {
    console.error('Soft delete error', err);
    if (toast) {
      toast.error('Impossible d’archiver cette annonce pour le moment.');
    }
  }
};

// 🔻 Hard delete (supprimer définitivement)
const hardDelete = async () => {
  try {
    await $fetch(`/api/obituaries/${slug.value}/hard`, {
      method: 'DELETE',
    });

    if (toast) {
      toast.success('Annonce supprimée définitivement.');
    }
    await router.push('/obituaries');
  } catch (err) {
    console.error('Hard delete error', err);
    if (toast) {
      toast.error('Impossible de supprimer définitivement cette annonce.');
    }
  }
};

// Ouverture des modals de confirmation

const onSoftDeleteClick = async () => {
  if (!confirmStore) {
    return;
  }

  const confirmed = await confirmStore.ask({
    title: t('obituaryReview.delete.softTitle') || 'Retirer cette annonce du site ?',
    message:
      t('obituaryReview.delete.softMessage') ||
      'L’annonce ne sera plus visible publiquement, mais vous pourrez encore la retrouver dans votre compte.',
    confirmLabel: t('common.actions.archive') || 'Retirer',
    cancelLabel: t('common.actions.cancel') || 'Annuler',
  });

  if (confirmed) {
    await softDelete();
  }
};

const onHardDeleteClick = async () => {
  if (!confirmStore) {
    return;
  }

  const confirmed = await confirmStore.ask({
    title:
      t('obituaryReview.delete.hardTitle') ||
      'Supprimer définitivement cette annonce ?',
    message:
      t('obituaryReview.delete.hardMessage') ||
      'Cette action est irréversible. Toutes les informations associées à cette annonce seront supprimées.',
    confirmLabel: t('common.actions.delete') || 'Supprimer',
    cancelLabel: t('common.actions.cancel') || 'Annuler',
  });

  if (confirmed) {
    await hardDelete();
  }
};

</script>


<style scoped>
.review-plan-banner {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.9rem;
  background: var(--color-accent-soft, rgba(56, 189, 248, 0.08));
  border: 1px solid rgba(56, 189, 248, 0.6);
}

.review-plan-banner__top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.review-plan-banner__plan {
  font-weight: 600;
  font-size: 0.98rem;
}

.review-plan-banner__price {
  font-size: 0.9rem;
  opacity: 0.9;
}

.review-plan-banner__meta {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

/* Layout */
.review-layout {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 900px) {
  .review-layout {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
    align-items: flex-start;
  }
}

.review-main__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Sections */
.review-section {
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--space-3);
}
.review-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.review-section__title {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  font-weight: 600;
}

.review-section__subtitle {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

/* Definition list */
.review-dl {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}
.review-dl__row {
  display: grid;
  gap: 0.15rem;
}
.review-dl__row dt {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}
.review-dl__row dd {
  margin: 0;
  font-size: 0.93rem;
}

/* Content */
.review-content__title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
.review-content__body {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Events */
.review-events {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.review-events__item {
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-subtle);
}

.review-events__header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.3rem;
}

.review-events__type {
  font-size: 0.85rem;
  font-weight: 500;
}

.review-events__badge {
  font-size: 0.75rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--color-accent-soft);
}

/* Events body */
.review-events__datetime {
  margin: 0;
  font-size: 0.9rem;
}

.review-events__place {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: var(--color-text-soft);
}

/* Contacts */
.review-contacts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.review-contacts__item {
  padding: 0.65rem 0.8rem;
  border-radius: 0.75rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-subtle);
}

.review-contacts__name {
  margin: 0 0 0.3rem;
  font-size: 0.9rem;
}

.review-contacts__channels {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.2rem;
  font-size: 0.88rem;
}
.review-contacts__channels li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

/* Side card */
.review-side__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.review-side__status {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}

.review-side__title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
}

.review-side__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.review-side__summary {
  list-style: none;
  margin: 0.4rem 0 0.2rem;
  padding: 0;
  display: grid;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.review-side__label {
  display: block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}

.review-side__value {
  display: block;
}

.review-side__legal {
  margin: 0.3rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}

.review-side__actions {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

@media (min-width: 600px) {
  .review-side__actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

/* Generic */
.review-empty {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-soft);
}

/* Loading / error */
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
/* Boutons danger / warning locaux à cette page */

.btn-danger {
  background: #b91c1c;
  border-color: #991b1b;
  color: #fff;
}

.btn-danger:hover,
.btn-danger:focus-visible {
  background: #991b1b;
  border-color: #7f1d1d;
}

/* Ghost "warning" : texte / bordure ambrés, fond transparent */
.btn-ghost-warning {
  border-color: rgba(245, 158, 11, 0.7);
  color: #b45309;
}

.btn-ghost-warning:hover,
.btn-ghost-warning:focus-visible {
  background: rgba(245, 158, 11, 0.08);
}

</style>
