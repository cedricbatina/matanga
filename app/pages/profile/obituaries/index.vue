<!-- pages/profile/obituaries/index.vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation espace utilisateur"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="true"
      create-to="/obituary/create"
    />

    <section class="section">
      <!-- Header -->
      <header class="section-header">
        <h1 class="section-title">
          {{ t('myObituaries.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('myObituaries.subtitle') }}
        </p>
      </header>

      <!-- Barre de filtres / recherche -->
      <div class="myobits-toolbar">
        <!-- Filtres statut sous forme de badges -->
        <nav
          class="myobits-filters"
          aria-label="Filtrer les annonces par statut"
        >
          <button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            class="myobits-filter-chip"
            :class="{ 'myobits-filter-chip--active': option.value === statusFilter }"
            :aria-pressed="option.value === statusFilter"
            @click="onStatusChange(option.value)"
          >
            <span class="myobits-filter-dot" aria-hidden="true" />
            <span class="myobits-filter-label">
              {{ t(option.labelKey) }}
            </span>
          </button>
        </nav>

        <!-- Recherche + tri -->
        <div class="myobits-controls">
          <!-- Recherche -->
          <label class="myobits-search">
            <span class="sr-only">
              {{ t('myObituaries.searchLabel') }}
            </span>
            <span class="myobits-search__icon" aria-hidden="true">
              <i class="fa-regular fa-magnifying-glass" />
            </span>
            <input
              v-model="search"
              type="search"
              class="myobits-search__input"
              :placeholder="t('myObituaries.searchPlaceholder')"
            >
          </label>

          <!-- Tri -->
          <label class="myobits-sort">
            <span class="myobits-sort__label">
              {{ t('myObituaries.sortLabel') }}
            </span>
            <div class="myobits-sort__control">
              <select
                v-model="sort"
                class="myobits-sort__select"
              >
                <option value="recent">
                  {{ t('myObituaries.sort.recent') }}
                </option>
                <option value="oldest">
                  {{ t('myObituaries.sort.oldest') }}
                </option>
                <option value="popular">
                  {{ t('myObituaries.sort.popular') }}
                </option>
              </select>
              <span class="myobits-sort__icon" aria-hidden="true">
                <i class="fa-regular fa-arrow-up-wide-short" />
              </span>
            </div>
          </label>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="myobits-loading">
        <div class="myobits-skeleton" />
        <div class="myobits-skeleton" />
      </div>

      <!-- Erreur -->
      <div
        v-else-if="error"
        class="myobits-error"
        role="alert"
      >
        <p class="myobits-error__text">
          {{ t('myObituaries.error') }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('myObituaries.retry') }}
        </button>
      </div>

      <!-- Liste vide -->
      <div
        v-else-if="!items.length"
        class="myobits-empty"
      >
        <p class="myobits-empty__text">
          {{ t('myObituaries.empty', { status: t(currentStatusLabelKey) }) }}
        </p>
        <NuxtLink
          to="/obituary/create"
          class="btn btn-primary btn-sm myobits-empty__cta"
        >
          {{ t('myObituaries.createFirst') }}
        </NuxtLink>
      </div>

      <!-- Liste d'annonces -->
      <div
        v-else
        class="myobits-list"
      >
        <article
          v-for="item in items"
          :key="item.id"
          class="card myobits-card"
        >
          <div class="card-body myobits-card__body">
            <header class="myobits-card__header">
              <h2 class="myobits-card__title">
                {{ item.content?.title || '—' }}
              </h2>

              <div class="myobits-pill-row">
                <!-- Statut principal -->
                <span class="myobits-pill">
                  {{ formatStatus(item.status, item) }}
                </span>

                <!-- Vérification -->
                <span
                  v-if="item.verificationStatus && item.status !== 'draft'"
                  class="myobits-pill myobits-pill--soft"
                >
                  {{ formatVerification(item.verificationStatus) }}
                </span>

                <!-- Paiement -->
                <span
                  v-if="hasPaid(item)"
                  class="myobits-pill myobits-pill--paid"
                >
                  {{ formatPayment(item) }}
                </span>
              </div>
            </header>

            <p
              v-if="item.deceased?.fullName || item.location?.city || item.location?.country"
              class="myobits-meta"
            >
              <span v-if="item.deceased?.fullName">
                {{ item.deceased.fullName }}
              </span>
              <span v-if="item.deceased?.fullName && (item.location?.city || item.location?.country)">
                ·
              </span>
              <span v-if="item.location?.city || item.location?.country">
                {{
                  [
                    item.location?.city,
                    item.location?.country,
                  ]
                    .filter(Boolean)
                    .join(', ')
                }}
              </span>
            </p>

            <p class="myobits-meta-small">
              {{ t('myObituaries.createdAt', { date: formatDateTime(item.createdAt) }) }}
              <span v-if="item.publishedAt">
                · {{ t('myObituaries.publishedAt', { date: formatDateTime(item.publishedAt) }) }}
              </span>
            </p>

            <p
              v-if="item.monetization?.pricingTier"
              class="myobits-plan"
            >
              {{ t('myObituaries.plan') }}
              <strong> {{ formatPlan(item.monetization.pricingTier) }}</strong>
              <span v-if="item.monetization?.isFree">
                · {{ t('myObituaries.planFree') }}
              </span>
            </p>

            <p
              v-if="item.content?.excerpt"
              class="myobits-excerpt"
            >
              {{ item.content.excerpt }}
            </p>

            <div class="myobits-actions">
              <!-- CTA principal : dépend du statut -->
              <NuxtLink
                v-if="item.status === 'draft'"
                :to="`/obituary/confirm/${item.slug}`"
                class="btn btn-primary btn-sm"
              >
                <span v-if="hasPaid(item)">
                  {{ t('myObituaries.actions.viewAfterPayment') }}
                </span>
                <span v-else>
                  {{ t('myObituaries.actions.continueDraft') }}
                </span>
              </NuxtLink>

              <NuxtLink
                v-else
                :to="`/obituary/${item.slug}`"
                class="btn btn-primary btn-sm"
              >
                {{ t('myObituaries.actions.viewPublic') }}
              </NuxtLink>

              <!-- Modifier -->
              <NuxtLink
                :to="`/obituary/edit/${item.slug}`"
                class="btn btn-ghost btn-sm"
              >
                {{ t('myObituaries.actions.edit') }}
              </NuxtLink>

              <!-- Retour à la confirmation (ex: reproposer un paiement / republier) -->
              <NuxtLink
                v-if="item.status === 'draft' || item.status === 'rejected'"
                :to="`/obituary/confirm/${item.slug}`"
                class="btn btn-ghost btn-sm"
              >
                {{ t('myObituaries.actions.review') }}
              </NuxtLink>
            </div>
          </div>
        </article>

        <!-- Pagination avec ton composant -->
        <div
          v-if="pagination && pagination.totalPages > 1"
          class="myobits-pagination"
        >
          <Pagination
            :current-page="page"
            :total-pages="pagination.totalPages"
            :total-items="pagination.total"
            :page-size="pagination.pageSize"
            :aria-label="t('pagination.ariaLabel')"
            :label-prev="t('pagination.prev')"
            :label-next="t('pagination.next')"
            @pageChange="changePage"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
});

import { computed, ref, watch } from 'vue';
import {
  useRoute,
  useRouter,
  useSeoMeta,
  useFetch,
} from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';
import Pagination from '~/components/Pagination.vue';
import { useDateUtils } from '~/composables/useDateUtils';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { formattedDateTimeWithSeconds } = useDateUtils();

// Filtres statut
const statusOptions = [
  { value: 'all', labelKey: 'myObituaries.filters.all' },
  { value: 'draft', labelKey: 'myObituaries.filters.draft' },
  { value: 'pending_review', labelKey: 'myObituaries.filters.pending' },
  { value: 'published', labelKey: 'myObituaries.filters.published' },
  { value: 'archived', labelKey: 'myObituaries.filters.archived' },
  { value: 'rejected', labelKey: 'myObituaries.filters.rejected' },
  { value: 'expired', labelKey: 'myObituaries.filters.expired' },
];

const initialStatus =
  typeof route.query.status === 'string' ? route.query.status : 'all';

const statusFilter = ref(
  statusOptions.some((o) => o.value === initialStatus)
    ? initialStatus
    : 'all',
);

const initialPage =
  route.query.page && Number(route.query.page) > 0
    ? Number(route.query.page)
    : 1;

const page = ref(initialPage);

// recherche & tri
const search = ref(typeof route.query.q === 'string' ? route.query.q : '');
const sort = ref(
  typeof route.query.sort === 'string' ? route.query.sort : 'recent',
);

// Appel API
const {
  data,
  pending,
  error,
  refresh,
} = await useFetch(
  () => {
    const params = new URLSearchParams();
    params.set('page', String(page.value));
    params.set('pageSize', '10');

    if (statusFilter.value !== 'all') {
      params.set('status', statusFilter.value);
    }

    if (search.value && search.value.trim().length > 1) {
      params.set('q', search.value.trim());
    }

    if (sort.value && sort.value !== 'recent') {
      params.set('sort', sort.value);
    }

    return `/api/my/obituaries?${params.toString()}`;
  },
  {
    key: () =>
      `my-obits-${statusFilter.value}-${page.value}-${sort.value}-${
        search.value || ''
      }`,
  },
);

const result = computed(
  () => data.value || { ok: false, items: [], pagination: null },
);

const items = computed(() => result.value.items || []);
const pagination = computed(() => result.value.pagination || null);

const currentStatusLabelKey = computed(() => {
  const found = statusOptions.find((o) => o.value === statusFilter.value);
  return found ? found.labelKey : 'myObituaries.filters.all';
});

// SEO
useSeoMeta({
  title: () => t('myObituaries.meta.title'),
  description: () => t('myObituaries.meta.description'),
});

// Helpers
const formatDateTime = (value) => {
  if (!value) return '';
  return formattedDateTimeWithSeconds(value);
};

const formatStatus = (status, item) => {
  // Cas spécial : brouillon mais paiement déjà confirmé
  if (status === 'draft' && hasPaid(item)) {
    return t('myObituaries.status.draftPaid');
  }

  switch (status) {
    case 'draft':
      return t('myObituaries.status.draft');
    case 'pending_review':
      return t('myObituaries.status.pending_review');
    case 'published':
      return t('myObituaries.status.published');
    case 'archived':
      return t('myObituaries.status.archived');
    case 'rejected':
      return t('myObituaries.status.rejected');
    case 'expired':
      return t('myObituaries.status.expired');
    default:
      return status || '';
  }
};

const formatVerification = (vs) => {
  switch (vs) {
    case 'not_required':
      return t('myObituaries.verification.not_required');
    case 'pending':
      return t('myObituaries.verification.pending');
    case 'verified':
      return t('myObituaries.verification.verified');
    case 'rejected':
      return t('myObituaries.verification.rejected');
    default:
      return vs || '';
  }
};

const hasPaid = (item) => {
  return (
    item &&
    item.monetization &&
    typeof item.monetization.amountPaid === 'number' &&
    item.monetization.amountPaid > 0
  );
};

const formatPayment = (item) => {
  if (!hasPaid(item)) return '';
  const amount = item.monetization.amountPaid.toFixed(2).replace('.', ',');
  const curr = item.monetization.currency || 'EUR';
  return t('myObituaries.payment.paid', {
    amount,
    currency: curr,
  });
};

const formatPlan = (pricingTier) => {
  if (!pricingTier) return t('myObituaries.planUnknown');
  const key = `plans.codes.${pricingTier}`;
  const translated = t(key);
  return translated === key ? pricingTier : translated;
};

// Actions UI
const onStatusChange = (value) => {
  if (statusFilter.value === value) return;
  statusFilter.value = value;
  page.value = 1;
};

const changePage = (newPage) => {
  if (newPage === page.value || newPage < 1) return;
  page.value = newPage;
};

// Sync query string (URL partageable)
watch(
  [statusFilter, page, search, sort],
  ([newStatus, newPage, newSearch, newSort]) => {
    const query = {
      ...route.query,
      status: newStatus,
      page: String(newPage),
    };

    if (newSearch && newSearch.trim().length > 1) {
      query.q = newSearch.trim();
    } else {
      delete query.q;
    }

    if (newSort && newSort !== 'recent') {
      query.sort = newSort;
    } else {
      delete query.sort;
    }

    router.replace({ query });
  },
  { immediate: false },
);
</script>

<style scoped>
.myobits-toolbar {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Filtres statut en badges */
.myobits-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.myobits-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface-muted);
  font-size: 0.78rem;
  cursor: pointer;
  color: var(--color-text-soft);
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.myobits-filter-chip:hover {
  border-color: var(--color-border-strong, #94a3b8);
}

.myobits-filter-chip--active {
  background: var(--color-primary-soft, rgba(79, 70, 229, 0.08));
  color: var(--color-primary-text, #3730a3);
  border-color: var(--color-primary-border, #818cf8);
  box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.4);
}

.myobits-filter-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.6;
}

.myobits-filter-label {
  white-space: nowrap;
}

/* Recherche + tri */
.myobits-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  justify-content: space-between;
}

/* Recherche */
.myobits-search {
  position: relative;
  flex: 1 1 220px;
  max-width: 420px;
}

.myobits-search__icon {
  position: absolute;
  inset-inline-start: 0.6rem;
  inset-block-start: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.myobits-search__input {
  width: 100%;
  padding: 0.4rem 0.7rem 0.4rem 2rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  font-size: 0.85rem;
  background: var(--color-surface-main);
  color: var(--color-text-main);
}

.myobits-search__input::placeholder {
  color: var(--color-text-muted, #9ca3af);
}

/* Tri */
.myobits-sort {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.myobits-sort__label {
  white-space: nowrap;
}

.myobits-sort__control {
  position: relative;
}

.myobits-sort__select {
  padding: 0.25rem 1.8rem 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  font-size: 0.8rem;
  background: var(--color-surface-main);
  color: var(--color-text-main);
  appearance: none;
}

.myobits-sort__icon {
  position: absolute;
  inset-inline-end: 0.45rem;
  inset-block-start: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

/* Loading / skeleton */
.myobits-loading {
  margin-top: var(--space-3);
  display: grid;
  gap: 0.8rem;
}

.myobits-skeleton {
  height: 110px;
  border-radius: 0.9rem;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.16),
    rgba(148, 163, 184, 0.28),
    rgba(148, 163, 184, 0.16)
  );
  background-size: 200% 100%;
  animation: myobits-shimmer 1.3s infinite;
}

/* Erreur */
.myobits-error {
  margin-top: var(--space-3);
  padding: 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.08);
}

.myobits-error__text {
  margin: 0 0 0.4rem;
  font-size: 0.9rem;
}

/* Vide */
.myobits-empty {
  margin-top: var(--space-4);
  padding: 1.1rem 1rem;
  border-radius: 0.9rem;
  border: 1px dashed var(--color-border-subtle);
  background: var(--color-surface-muted);
  text-align: left;
}

.myobits-empty__text {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.myobits-empty__cta {
  font-size: 0.85rem;
}

/* Liste / cartes */
.myobits-list {
  margin-top: var(--space-3);
  display: grid;
  gap: 0.9rem;
}

.myobits-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.myobits-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.myobits-card__title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
}

.myobits-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.myobits-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--color-surface-muted);
  color: var(--color-text-soft);
}

.myobits-pill--soft {
  background: rgba(148, 163, 184, 0.15);
}

.myobits-pill--paid {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.myobits-meta {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-main);
}

.myobits-meta span + span {
  margin-left: 0.25rem;
}

.myobits-meta-small {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}

.myobits-plan {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-soft);
}

.myobits-plan strong {
  font-weight: 600;
}

.myobits-excerpt {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: var(--color-text-main);
}

/* Actions */
.myobits-actions {
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* Pagination wrapper */
.myobits-pagination {
  margin-top: 1rem;
}

/* Skeleton animation */
@keyframes myobits-shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .myobits-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .myobits-sort {
    justify-content: flex-start;
  }
}
</style>
