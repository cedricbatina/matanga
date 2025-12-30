<!-- pages/admin/obituaries/index.vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation espace modération"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="false"
    />

    <section class="section">
      <!-- Header -->
      <header class="section-header">
        <h1 class="section-title">
          {{ t('adminObituaries.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('adminObituaries.subtitle') }}
        </p>
      </header>

      <!-- Barre de filtres / recherche -->
      <div class="adminobits-toolbar">
        <!-- Filtres statut vérification -->
       <!-- ✅ Filtres statut annonce -->
  <nav class="adminobits-filters" aria-label="Filtrer les annonces par statut">
    <button
      v-for="opt in statusOptions"
      :key="opt.value"
      type="button"
      class="adminobits-filter-chip"
      :class="{ 'adminobits-filter-chip--active': opt.value === statusFilter }"
      :aria-pressed="opt.value === statusFilter"
      @click="onStatusChange(opt.value)"
    >
      <span class="adminobits-filter-label">{{ t(opt.labelKey) }}</span>
    </button>
  </nav>

  <!-- ✅ Filtres vérification docs -->
  <nav class="adminobits-filters" aria-label="Filtrer les annonces par état de vérification">
    <button
      v-for="option in verificationOptions"
      :key="option.value"
      type="button"
      class="adminobits-filter-chip"
      :class="{ 'adminobits-filter-chip--active': option.value === verificationFilter }"
      :aria-pressed="option.value === verificationFilter"
      @click="onVerificationChange(option.value)"
    >
      <span class="adminobits-filter-label">{{ t(option.labelKey) }}</span>
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
<!-- Voir documents (preview avant validation) -->
<button
  type="button"
  class="btn btn-ghost btn-sm"
  @click="openDocs(item)"
>
  {{ t('adminObituaries.actions.viewDocs') || 'Voir documents' }}
</button>

              <!-- Valider les documents -->
              <button
                v-if="item.verificationStatus !== 'pending'"
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="processingId === item.id"
                @click="onVerifyClick(item)"
              >
                <span v-if="processingId === item.id && processingAction === 'verify'">
                  {{ t('adminObituaries.actions.verifyLoading') }}
                </span>
                <span v-else>
                  {{ t('adminObituaries.actions.verify') }}
                </span>
              </button>

              <!-- Refuser les documents -->
              <button
                v-if="item.verificationStatus !== 'pending'"
                type="button"
                class="btn btn-danger btn-sm"
                :disabled="processingId === item.id"
                @click="onRejectClick(item)"
              >
                <span v-if="processingId === item.id && processingAction === 'reject'">
                  {{ t('adminObituaries.actions.rejectLoading') }}
                </span>
                <span v-else>
                  {{ t('adminObituaries.actions.reject') }}
                </span>
              </button>
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
      <Teleport to="body">
  <div v-if="docsModalOpen" class="admin-docs-modal__backdrop" @click.self="closeDocs">
    <div class="card admin-docs-modal">
      <div class="card-body">
        <header class="admin-docs-modal__header">
          <div>
            <h3 style="margin:0;">
              {{ t('adminObituaries.docs.title') || 'Documents' }}
            </h3>
            <p class="text-xs text-soft" style="margin:.25rem 0 0;">
              {{ docsTarget?.deceased?.fullName || docsTarget?.content?.title || docsTarget?.slug || '' }}
            </p>
          </div>

          <button type="button" class="btn btn-ghost btn-sm" @click="closeDocs">
            {{ t('common.close') || 'Fermer' }}
          </button>
        </header>

        <div v-if="docsLoading" class="text-sm text-soft" style="margin-top:.75rem;">
          {{ t('common.loading') || 'Chargement…' }}
        </div>

        <div v-else-if="docsErrorMsg" class="text-sm text-danger" style="margin-top:.75rem;">
          {{ docsErrorMsg }}
        </div>

        <div v-else style="margin-top:.75rem;">
          <p v-if="!docsList.length" class="text-sm text-soft">
            {{ t('adminObituaries.docs.empty') || 'Aucun document.' }}
          </p>

          <ul v-else class="admin-docs-list">
            <li v-for="d in docsList" :key="d.id" class="admin-docs-item">
              <div>
                <p style="margin:0; display:flex; gap:.4rem; align-items:center; flex-wrap:wrap;">
                  <span class="badge badge-soft">
                    {{ d.type }}
                  </span>

                  <span class="badge" :class="docStatusClass(d.status)">
                    {{ docStatusLabel(d.status) }}
                  </span>
                </p>

                <p v-if="d.adminNote" class="text-xs" style="margin:.35rem 0 0;">
                  <span class="text-soft">{{ t('adminObituaries.docs.adminNote') || 'Note :' }}</span>
                  {{ d.adminNote }}
                </p>

                <p class="text-xs text-soft" style="margin:.35rem 0 0;">
                  {{ d.createdAt ? formatDateTime(d.createdAt) : '' }}
                </p>
              </div>

              <div class="inline-row" style="gap:.5rem; flex-wrap:wrap;">
                <a
                  class="btn btn-ghost btn-xs"
                  :href="d.fileUrl"
                  target="_blank"
                  rel="noopener"
                >
                  {{ t('common.open') || 'Ouvrir' }}
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="card-footer" style="display:flex; gap:.5rem; justify-content:flex-end; flex-wrap:wrap;">
        <!-- Bonus: tu peux aussi valider/refuser DIRECTEMENT depuis le modal -->
        <button
          v-if="docsTarget?.verificationStatus === 'pending'"
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="processingId === docsTarget?.id"
          @click="onVerifyClick(docsTarget)"
        >
          {{ t('adminObituaries.actions.verify') || 'Valider' }}
        </button>

        <button
          v-if="docsTarget?.verificationStatus === 'pending'"
          type="button"
          class="btn btn-danger btn-sm"
          :disabled="processingId === docsTarget?.id"
          @click="onRejectClick(docsTarget)"
        >
          {{ t('adminObituaries.actions.reject') || 'Refuser' }}
        </button>

        <button type="button" class="btn btn-ghost btn-sm" @click="closeDocs">
          {{ t('common.close') || 'Fermer' }}
        </button>
      </div>
    </div>
  </div>
</Teleport>

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
import { useConfirmStore } from '~/stores/confirmStore'; // 👈 AJOUT

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { formattedDateTimeWithSeconds } = useDateUtils();
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;

const confirmStore = useConfirmStore(); // 👈 AJOUT

const docsModalOpen = ref(false);
const docsLoading = ref(false);
const docsErrorMsg = ref('');
const docsList = ref([]);
const docsTarget = ref(null);

const openDocs = async (item) => {
  if (!item?.slug) return;

  docsTarget.value = item;
  docsModalOpen.value = true;
  docsLoading.value = true;
  docsErrorMsg.value = '';
  docsList.value = [];

  try {
    const res = await $fetch(`/api/obituaries/${item.slug}/documents`);
    docsList.value = Array.isArray(res?.documents) ? res.documents : [];
  } catch (err) {
    docsErrorMsg.value =
      err?.data?.message ||
      err?.message ||
      (t('adminObituaries.docs.loadError') || 'Impossible de charger les documents.');
  } finally {
    docsLoading.value = false;
  }
};

const closeDocs = () => {
  docsModalOpen.value = false;
  docsTarget.value = null;
  docsList.value = [];
  docsErrorMsg.value = '';
  docsLoading.value = false;
};

const docStatusLabel = (status) => {
  switch (status) {
    case 'accepted': return t('editObituary.documents.status.accepted') || 'Accepté';
    case 'rejected': return t('editObituary.documents.status.rejected') || 'Refusé';
    case 'under_review': return t('editObituary.documents.status.under_review') || 'En revue';
    default: return status || '—';
  }
};

const docStatusClass = (status) => {
  if (status === 'accepted') return 'badge-success';
  if (status === 'rejected') return 'badge-warning';
  if (status === 'under_review') return 'badge-neutral';
  return 'badge-soft';
};

// état pour désactiver les boutons pendant l'appel API
const processingId = ref(null);
const processingAction = ref(null);
// Filtres "statut annonce"
const statusOptions = [
  { value: 'all', labelKey: 'adminObituaries.statusFilters.all' },
  { value: 'draft', labelKey: 'adminObituaries.status.draft' },
  { value: 'pending_review', labelKey: 'adminObituaries.status.pending_review' },
  { value: 'published', labelKey: 'adminObituaries.status.published' },
  { value: 'archived', labelKey: 'adminObituaries.status.archived' },
  { value: 'expired', labelKey: 'adminObituaries.status.expired' },
  { value: 'rejected', labelKey: 'adminObituaries.status.rejected' },
];

const initialStatus =
  typeof route.query.status === 'string'
    ? route.query.status
    : 'pending_review';

const statusFilter = ref(
  statusOptions.some((o) => o.value === initialStatus)
    ? initialStatus
    : 'pending_review'
);

const onStatusChange = (value) => {
  if (statusFilter.value === value) return;
  statusFilter.value = value;
  page.value = 1;
};

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
if (statusFilter.value !== 'all') {
  params.set('status', statusFilter.value);
}

if (verificationFilter.value !== 'all') {
  params.set('verification', verificationFilter.value);
}

    if (sort.value && sort.value !== 'recent') {
      params.set('sort', sort.value);
    }

    return `/api/admin/obituaries?${params.toString()}`;
  },
  {
  key: () =>
  `admin-obits-${statusFilter.value}-${verificationFilter.value}-${page.value}-${sort.value}-${search.value || ''}`,

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
  if (!confirmStore) return;

  const title =
    t('adminObituaries.confirm.verifyTitle', {
      title: item.content?.title || item.deceased?.fullName || '',
    }) ||
    t('adminObituaries.confirm.verify', {
      title: item.content?.title || item.deceased?.fullName || '',
    }) ||
    'Valider les documents pour cette annonce ?';

  const message =
    t('adminObituaries.confirm.verifyMessage', {
      title: item.content?.title || item.deceased?.fullName || '',
    }) ||
    t('adminObituaries.confirm.verify', {
      title: item.content?.title || item.deceased?.fullName || '',
    }) ||
    "Cette action marquera les documents comme vérifiés. Vous pourrez toujours modifier la vérification plus tard.";

  const confirmed = await confirmStore.ask({
    title,
    message,
    confirmLabel: t('common.actions.verify') || 'Valider',
    cancelLabel: t('common.actions.cancel') || 'Annuler',
  });

  if (!confirmed) return;

  await callVerificationAction(item.id, 'verify', null);
};


const onRejectClick = async (item) => {
  if (!confirmStore) return;

  const title =
    t('adminObituaries.confirm.rejectTitle', {
      title: item.content?.title || item.deceased?.fullName || '',
    }) ||
    t('adminObituaries.confirm.reject', {
      title: item.content?.title || item.deceased?.fullName || '',
    }) ||
    'Refuser ces documents ?';

  const message =
    t('adminObituaries.confirm.rejectMessage', {
      title: item.content?.title || item.deceased?.fullName || '',
    }) ||
    t('adminObituaries.confirm.reject', {
      title: item.content?.title || item.deceased?.fullName || '',
    }) ||
    "Cette action marquera les documents comme refusés. Vous pourrez ajouter un commentaire pour la famille.";

  const confirmed = await confirmStore.ask({
    title,
    message,
    confirmLabel: t('common.actions.reject') || 'Refuser',
    cancelLabel: t('common.actions.cancel') || 'Annuler',
  });

  if (!confirmed) return;

  // TODO plus tard : remplacer ce prompt par un modal avec textarea
  const note = window.prompt(
    t('adminObituaries.confirm.rejectNotePrompt') ||
      'Vous pouvez indiquer la raison du refus (optionnel) :',
    ''
  );

  await callVerificationAction(item.id, 'reject', note || '');
};


// Sync query string (URL partageable)
watch(
  [statusFilter, verificationFilter, page, search, sort],
  ([newStatus, newVerification, newPage, newSearch, newSort]) => {
    const query = {
      ...route.query,
      status: newStatus,
      verification: newVerification,
      page: String(newPage),
    };

    if (newSearch && newSearch.trim().length > 1) query.q = newSearch.trim();
    else delete query.q;

    if (newSort && newSort !== 'recent') query.sort = newSort;
    else delete query.sort;

    router.replace({ query });
  },
  { immediate: false }
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
.admin-docs-modal__backdrop{
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 9999;
}

.admin-docs-modal{
  width: min(860px, 100%);
  max-height: 85vh;
  overflow: auto;
}

.admin-docs-modal__header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:.75rem;
}

.admin-docs-list{
  list-style:none;
  padding:0;
  margin:0;
  display:grid;
  gap:.6rem;
}

.admin-docs-item{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:.75rem;
  padding:.65rem .75rem;
  border:1px solid var(--color-border-subtle);
  border-radius:.75rem;
  background: var(--color-surface-main);
}

</style>
