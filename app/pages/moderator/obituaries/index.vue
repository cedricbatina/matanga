<!-- pages/moderator/obituaries/index.vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation modération"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('adminObituaries.titleModerator', 'Modération des annonces') }}
        </h1>
        <p class="section-subtitle">
          {{ t('adminObituaries.subtitleModerator', 'Validez ou refusez les annonces payées avec leurs documents.') }}
        </p>
      </header>

         <!-- Barre de filtres / recherche -->
      <div class="adminobits-toolbar">
        <!-- Filtres statut vérification -->
        <nav
          class="adminobits-filters"
          aria-label="Filtrer les annonces par état de vérification"
        >
          <button
            v-for="option in verificationOptions"
            :key="option.value"
            type="button"
            class="adminobits-filter-chip"
            :class="{
              'adminobits-filter-chip--active':
                option.value === verificationFilter
            }"
            :aria-pressed="option.value === verificationFilter"
            @click="onVerificationChange(option.value)"
          >
            <span class="adminobits-filter-label">
              {{ t(option.labelKey) }}
            </span>
          </button>
        </nav>

        <!-- Recherche + tri -->
        <div class="adminobits-controls">
          <!-- Recherche -->
          <label class="adminobits-search">
            <span class="sr-only">
              {{ t('adminObituaries.searchLabel') }}
            </span>
            <span class="adminobits-search__icon" aria-hidden="true">
              <i class="fa-regular fa-magnifying-glass" />
            </span>
            <input
              v-model="search"
              type="search"
              class="adminobits-search__input"
              :placeholder="t('adminObituaries.searchPlaceholder')"
            >
          </label>

          <!-- Tri -->
          <label class="adminobits-sort">
            <span class="adminobits-sort__label">
              {{ t('adminObituaries.sortLabel') }}
            </span>
            <div class="adminobits-sort__control">
              <select
                v-model="sort"
                class="adminobits-sort__select"
              >
                <option value="recent">
                  {{ t('adminObituaries.sort.recent') }}
                </option>
                <option value="oldest">
                  {{ t('adminObituaries.sort.oldest') }}
                </option>
                <option value="popular">
                  {{ t('adminObituaries.sort.popular') }}
                </option>
              </select>
              <span class="adminobits-sort__icon" aria-hidden="true">
                <i class="fa-regular fa-arrow-up-wide-short" />
              </span>
            </div>
          </label>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="adminobits-loading">
        <div class="adminobits-skeleton" />
        <div class="adminobits-skeleton" />
      </div>

      <!-- Erreur (inclut 403 si pas admin) -->
      <div
        v-else-if="error"
        class="adminobits-error"
        role="alert"
      >
        <p class="adminobits-error__text">
          <span v-if="errorStatus === 403">
            {{ t('adminObituaries.errorForbidden') }}
          </span>
          <span v-else>
            {{ t('adminObituaries.error') }}
          </span>
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('adminObituaries.retry') }}
        </button>
      </div>

      <!-- Liste vide -->
      <div
        v-else-if="!items.length"
        class="adminobits-empty"
      >
        <p class="adminobits-empty__text">
          {{ t('adminObituaries.empty') }}
        </p>
      </div>

      <!-- Liste d'annonces -->
      <div
        v-else
        class="adminobits-list"
      >
        <article
          v-for="item in items"
          :key="item.id"
          class="card adminobits-card"
        >
          <div class="card-body adminobits-card__body">
            <header class="adminobits-card__header">
              <h2 class="adminobits-card__title">
                {{ item.content?.title || '—' }}
              </h2>

              <div class="adminobits-pill-row">
                <!-- Statut fonctionnel -->
                <span class="adminobits-pill">
                  {{ formatStatus(item.status) }}
                </span>

                <!-- Vérification -->
                <span
                  class="adminobits-pill adminobits-pill--verification"
                >
                  {{ formatVerification(item.verificationStatus) }}
                </span>

                <!-- Paiement -->
                <span
                  v-if="hasPaid(item)"
                  class="adminobits-pill adminobits-pill--paid"
                >
                  {{ formatPayment(item) }}
                </span>
              </div>
            </header>

            <!-- Infos défunt / lieu -->
            <p
              class="adminobits-meta"
            >
              <span v-if="item.deceased?.fullName">
                {{ item.deceased.fullName }}
              </span>
              <span
                v-if="item.deceased?.fullName && (item.location?.city || item.location?.country)"
              >
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

            <!-- Infos famille -->
            <p class="adminobits-meta-small">
              {{ t('adminObituaries.familyLabel') }}
              <strong>{{ item.user?.email }}</strong>
              <span v-if="item.user?.city || item.user?.country">
                ·
                {{
                  [
                    item.user?.city,
                    item.user?.country,
                  ]
                    .filter(Boolean)
                    .join(', ')
                }}
              </span>
            </p>

            <!-- Dates -->
            <p class="adminobits-meta-small">
              {{ t('adminObituaries.createdAt', { date: formatDateTime(item.createdAt) }) }}
              <span v-if="item.publishedAt">
                ·
                {{ t('adminObituaries.publishedAt', { date: formatDateTime(item.publishedAt) }) }}
              </span>
            </p>

            <!-- Plan -->
            <p
              v-if="item.monetization?.pricingTier"
              class="adminobits-plan"
            >
              {{ t('adminObituaries.plan') }}
              <strong> {{ formatPlan(item.monetization.pricingTier) }}</strong>
              <span v-if="item.monetization?.isFree">
                · {{ t('adminObituaries.planFree') }}
              </span>
            </p>

            <!-- Extrait -->
            <p
              v-if="item.content?.excerpt"
              class="adminobits-excerpt"
            >
              {{ item.content.excerpt }}
            </p>

            <!-- Actions -->
            <div class="adminobits-actions">
              <!-- Voir annonce publique -->
              <NuxtLink
                :to="`/obituary/${item.slug}`"
                class="btn btn-ghost btn-sm"
                target="_blank"
              >
                {{ t('adminObituaries.actions.viewPublic') }}
              </NuxtLink>

              <!-- Voir récap côté famille -->
              <NuxtLink
                :to="`/obituary/confirm/${item.slug}`"
                class="btn btn-ghost btn-sm"
                target="_blank"
              >
                {{ t('adminObituaries.actions.viewConfirm') }}
              </NuxtLink>

              <!-- (Étapes suivantes : boutons Vérifier / Rejeter qui appellent une API admin) -->
            </div>
          </div>
        </article>

        <!-- Pagination avec ton composant -->
        <div
          v-if="pagination && pagination.totalPages > 1"
          class="adminobits-pagination"
        >
          <Pagination
            :current-page="page"
            :total-pages="pagination.totalPages"
            :total-items="pagination.total"
            :page-size="pagination.pageSize"
            :aria-label="t('adminObituaries.pagination.aria')"
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
  middleware: ['auth'], // + protection côté API pour roles admin/modo
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
import { useNuxtApp } from '#imports';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { formattedDateTimeWithSeconds } = useDateUtils();
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;

// état pour désactiver les boutons pendant l'appel API
const processingId = ref(null);
const processingAction = ref(null);

// Filtres "état de vérification"
const verificationOptions = [
  { value: 'all', labelKey: 'adminObituaries.filters.all' },
  { value: 'pending', labelKey: 'adminObituaries.filters.pending' },
  { value: 'verified', labelKey: 'adminObituaries.filters.verified' },
  { value: 'rejected', labelKey: 'adminObituaries.filters.rejected' },
];

const initialVerification =
  typeof route.query.verification === 'string'
    ? route.query.verification
    : 'pending';

const verificationFilter = ref(
  verificationOptions.some((o) => o.value === initialVerification)
    ? initialVerification
    : 'pending',
);

// Pagination
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

// Appel API admin
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
    params.set('onlyPaid', 'true');

    if (verificationFilter.value !== 'all') {
      params.set('verification', verificationFilter.value);
    }

    if (search.value && search.value.trim().length > 1) {
      params.set('q', search.value.trim());
    }

    if (sort.value && sort.value !== 'recent') {
      params.set('sort', sort.value);
    }

    return `/api/admin/obituaries?${params.toString()}`;
  },
  {
    key: () =>
      `admin-obits-${verificationFilter.value}-${page.value}-${sort.value}-${
        search.value || ''
      }`,
  },
);

const result = computed(
  () => data.value || { ok: false, items: [], pagination: null },
);

const items = computed(() => result.value.items || []);
const pagination = computed(() => result.value.pagination || null);

const errorStatus = computed(() => error.value?.statusCode || null);

// SEO
useSeoMeta({
  title: () => t('adminObituaries.meta.title'),
  description: () => t('adminObituaries.meta.description'),
});

// Helpers
const formatDateTime = (value) => {
  if (!value) return '';
  return formattedDateTimeWithSeconds(value);
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
  return t('adminObituaries.payment.paid', {
    amount,
    currency: curr,
  });
};

const formatStatus = (status) => {
  switch (status) {
    case 'draft':
      return t('adminObituaries.status.draft');
    case 'pending_review':
      return t('adminObituaries.status.pending_review');
    case 'published':
      return t('adminObituaries.status.published');
    case 'archived':
      return t('adminObituaries.status.archived');
    case 'rejected':
      return t('adminObituaries.status.rejected');
    case 'expired':
      return t('adminObituaries.status.expired');
    default:
      return status || '';
  }
};

const formatVerification = (vs) => {
  switch (vs) {
    case 'not_required':
      return t('adminObituaries.verification.not_required');
    case 'pending':
      return t('adminObituaries.verification.pending');
    case 'verified':
      return t('adminObituaries.verification.verified');
    case 'rejected':
      return t('adminObituaries.verification.rejected');
    default:
      return vs || '';
  }
};

const formatPlan = (pricingTier) => {
  if (!pricingTier) return t('adminObituaries.planUnknown');
  const key = `plans.codes.${pricingTier}`;
  const translated = t(key);
  return translated === key ? pricingTier : translated;
};

// Actions UI
const onVerificationChange = (value) => {
  if (verificationFilter.value === value) return;
  verificationFilter.value = value;
  page.value = 1;
};

const changePage = (newPage) => {
  if (newPage === page.value || newPage < 1) return;
  page.value = newPage;
};
const callVerificationAction = async (itemId, action, note) => {
  processingId.value = itemId;
  processingAction.value = action;

  try {
    await $fetch(`/api/admin/obituaries/${itemId}/verification`, {
      method: 'POST',
      body: { action, note: note || null },
    });

    if (toast) {
      if (action === 'verify') {
        toast.success(t('adminObituaries.toasts.verifySuccess'));
      } else if (action === 'reject') {
        toast.success(t('adminObituaries.toasts.rejectSuccess'));
      }
    }

    await refresh();
  } catch (err) {
    console.error('Admin verification action error', err);

    if (toast) {
      const msg =
        err?.data?.statusMessage ||
        err?.data?.message ||
        t('adminObituaries.toasts.actionError');
      toast.error(msg);
    }
  } finally {
    processingId.value = null;
    processingAction.value = null;
  }
};

const onVerifyClick = async (item) => {
  const confirmed = window.confirm(
    t('adminObituaries.confirm.verify', {
      title: item.content?.title || item.deceased?.fullName || '',
    })
  );

  if (!confirmed) return;

  await callVerificationAction(item.id, 'verify', null);
};

const onRejectClick = async (item) => {
  const confirmed = window.confirm(
    t('adminObituaries.confirm.reject', {
      title: item.content?.title || item.deceased?.fullName || '',
    })
  );

  if (!confirmed) return;

  const note = window.prompt(
    t('adminObituaries.confirm.rejectNotePrompt'),
    ''
  );

  await callVerificationAction(item.id, 'reject', note || '');
};

// Sync query string (URL partageable)
watch(
  [verificationFilter, page, search, sort],
  ([newVerification, newPage, newSearch, newSort]) => {
    const query = {
      ...route.query,
      verification: newVerification,
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
.adminobits-toolbar {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Filtres vérification */
.adminobits-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.adminobits-filter-chip {
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

.adminobits-filter-chip:hover {
  border-color: var(--color-border-strong, #94a3b8);
}

.adminobits-filter-chip--active {
  background: var(--color-primary-soft, rgba(79, 70, 229, 0.08));
  color: var(--color-primary-text, #3730a3);
  border-color: var(--color-primary-border, #818cf8);
  box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.4);
}

.adminobits-filter-label {
  white-space: nowrap;
}

/* Recherche + tri */
.adminobits-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  justify-content: space-between;
}

/* Recherche */
.adminobits-search {
  position: relative;
  flex: 1 1 220px;
  max-width: 420px;
}

.adminobits-search__icon {
  position: absolute;
  inset-inline-start: 0.6rem;
  inset-block-start: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.adminobits-search__input {
  width: 100%;
  padding: 0.4rem 0.7rem 0.4rem 2rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  font-size: 0.85rem;
  background: var(--color-surface-main);
  color: var(--color-text-main);
}

.adminobits-search__input::placeholder {
  color: var(--color-text-muted, #9ca3af);
}

/* Tri */
.adminobits-sort {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.adminobits-sort__label {
  white-space: nowrap;
}

.adminobits-sort__control {
  position: relative;
}

.adminobits-sort__select {
  padding: 0.25rem 1.8rem 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  font-size: 0.8rem;
  background: var(--color-surface-main);
  color: var(--color-text-main);
  appearance: none;
}

.adminobits-sort__icon {
  position: absolute;
  inset-inline-end: 0.45rem;
  inset-block-start: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

/* Loading / skeleton */
.adminobits-loading {
  margin-top: var(--space-3);
  display: grid;
  gap: 0.8rem;
}

.adminobits-skeleton {
  height: 110px;
  border-radius: 0.9rem;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.16),
    rgba(148, 163, 184, 0.28),
    rgba(148, 163, 184, 0.16)
  );
  background-size: 200% 100%;
  animation: adminobits-shimmer 1.3s infinite;
}

/* Erreur */
.adminobits-error {
  margin-top: var(--space-3);
  padding: 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.08);
}

.adminobits-error__text {
  margin: 0 0 0.4rem;
  font-size: 0.9rem;
}

/* Vide */
.adminobits-empty {
  margin-top: var(--space-4);
  padding: 1.1rem 1rem;
  border-radius: 0.9rem;
  border: 1px dashed var(--color-border-subtle);
  background: var(--color-surface-muted);
  text-align: left;
}

.adminobits-empty__text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

/* Liste / cartes */
.adminobits-list {
  margin-top: var(--space-3);
  display: grid;
  gap: 0.9rem;
}

.adminobits-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.adminobits-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.adminobits-card__title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
}

.adminobits-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.adminobits-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--color-surface-muted);
  color: var(--color-text-soft);
}

.adminobits-pill--verification {
  background: rgba(148, 163, 184, 0.15);
}

.adminobits-pill--paid {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.adminobits-meta {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-main);
}

.adminobits-meta-small {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}

.adminobits-plan {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-soft);
}

.adminobits-plan strong {
  font-weight: 600;
}

.adminobits-excerpt {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: var(--color-text-main);
}

/* Actions */
.adminobits-actions {
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* Pagination */
.adminobits-pagination {
  margin-top: 1rem;
}

/* Skeleton animation */
@keyframes adminobits-shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .adminobits-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .adminobits-sort {
    justify-content: flex-start;
  }
}
</style>


