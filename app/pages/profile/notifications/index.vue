<!-- pages/profile/notifications/index.vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Notifications de votre compte"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('myNotifications.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('myNotifications.subtitle') }}
        </p>
      </header>

      <!-- Filtres statut -->
      <div class="notif-toolbar">
        <nav
          class="notif-filters"
          aria-label="Filtrer les notifications"
        >
          <button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            class="notif-filter-chip"
            :class="{ 'notif-filter-chip--active': option.value === statusFilter }"
            :aria-pressed="option.value === statusFilter"
            @click="onStatusChange(option.value)"
          >
            {{ t(option.labelKey) }}
          </button>
        </nav>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="notif-loading">
        <div class="notif-skeleton" />
        <div class="notif-skeleton" />
      </div>

      <!-- Erreur -->
      <div
        v-else-if="error"
        class="notif-error"
        role="alert"
      >
        <p class="notif-error__text">
          {{ t('myNotifications.error') }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('myNotifications.retry') }}
        </button>
      </div>

      <!-- Liste vide -->
      <div
        v-else-if="!items.length"
        class="notif-empty"
      >
        <p class="notif-empty__text">
          {{ t('myNotifications.empty', { status: t(currentStatusLabelKey) }) }}
        </p>
      </div>

      <!-- Liste -->
      <div v-else class="notif-list">
        <article
          v-for="n in items"
          :key="n.id"
          class="card notif-card"
          :class="{ 'notif-card--unread': n.status === 'unread' }"
        >
          <div class="card-body notif-card__body">
            <header class="notif-card__header">
              <h2 class="notif-card__title">
                {{ n.title || t('myNotifications.defaultTitle') }}
              </h2>
              <span
                v-if="n.status === 'unread'"
                class="notif-badge"
              >
                {{ t('myNotifications.badgeNew') }}
              </span>
            </header>

            <p
              v-if="n.body"
              class="notif-card__bodytext"
            >
              {{ n.body }}
            </p>

            <p class="notif-card__meta">
              {{ formatDateTime(n.createdAt) }}
            </p>

            <div class="notif-card__actions">
              <!-- Lien vers l’annonce si dispo -->
              <NuxtLink
                v-if="n.data?.slug"
                :to="`/obituary/${n.data.slug}`"
                class="btn btn-ghost btn-xs"
              >
                {{ t('myNotifications.actions.viewObituary') }}
              </NuxtLink>

              <!-- Marquer comme lu -->
              <button
                v-if="n.status === 'unread'"
                type="button"
                class="btn btn-ghost btn-xs"
                :disabled="processingId === n.id"
                @click="onMarkRead(n)"
              >
                {{ t('myNotifications.actions.markRead') }}
              </button>

              <!-- Archiver -->
              <button
                v-if="n.status !== 'archived'"
                type="button"
                class="btn btn-ghost btn-xs"
                :disabled="processingId === n.id"
                @click="onArchive(n)"
              >
                {{ t('myNotifications.actions.archive') }}
              </button>
            </div>
          </div>
        </article>

        <!-- Pagination -->
        <div
          v-if="pagination && pagination.totalPages > 1"
          class="notif-pagination"
        >
          <Pagination
            :current-page="page"
            :total-pages="pagination.totalPages"
            :total-items="pagination.total"
            :page-size="pagination.pageSize"
            :aria-label="t('myNotifications.pagination.aria')"
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
  useFetch,
  useSeoMeta,
  useNuxtApp,
} from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';
import Pagination from '~/components/Pagination.vue';
import { useDateUtils } from '~/composables/useDateUtils';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { formattedDateTimeWithSeconds } = useDateUtils();
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;

const statusOptions = [
  { value: 'unread',   labelKey: 'myNotifications.filters.unread' },
  { value: 'all',      labelKey: 'myNotifications.filters.all' },
  { value: 'archived', labelKey: 'myNotifications.filters.archived' },
];

const initialStatus =
  typeof route.query.status === 'string' ? route.query.status : 'unread';

const statusFilter = ref(
  statusOptions.some((o) => o.value === initialStatus)
    ? initialStatus
    : 'unread',
);

const initialPage =
  route.query.page && Number(route.query.page) > 0
    ? Number(route.query.page)
    : 1;

const page = ref(initialPage);

// Fetch notifications
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

    return `/api/my/notifications?${params.toString()}`;
  },
  {
    key: () =>
      `my-notifs-${statusFilter.value}-${page.value}`,
  },
);

const result = computed(
  () => data.value || { ok: false, items: [], pagination: null },
);

const items = computed(() => result.value.items || []);
const pagination = computed(() => result.value.pagination || null);

const currentStatusLabelKey = computed(() => {
  const found = statusOptions.find((o) => o.value === statusFilter.value);
  return found ? found.labelKey : 'myNotifications.filters.all';
});

const processingId = ref(null);

useSeoMeta({
  title: () => t('myNotifications.meta.title'),
  description: () => t('myNotifications.meta.description'),
});

// Helpers
const formatDateTime = (value) => {
  if (!value) return '';
  return formattedDateTimeWithSeconds(value);
};

// Actions
const onStatusChange = (value) => {
  if (statusFilter.value === value) return;
  statusFilter.value = value;
  page.value = 1;
};

const changePage = (newPage) => {
  if (newPage === page.value || newPage < 1) return;
  page.value = newPage;
};

const updateNotification = async (n, actionKey) => {
  if (!n?.id) return;
  if (processingId.value) return;

  processingId.value = n.id;

  try {
    await $fetch(`/api/my/notifications/${n.id}`, {
      method: 'PATCH',
      body: { action: actionKey },
    });

    await refresh();
  } catch (err) {
    console.error('Update notification error', err);
    if (toast) {
      toast.error(
        err?.data?.statusMessage ||
          err?.data?.message ||
          t('myNotifications.toasts.updateError'),
      );
    }
  } finally {
    processingId.value = null;
  }
};

const onMarkRead = (n) => updateNotification(n, 'mark_read');
const onArchive = (n) => updateNotification(n, 'archive');

// sync URL
watch(
  [statusFilter, page],
  ([newStatus, newPage]) => {
    const query = {
      ...route.query,
      status: newStatus,
      page: String(newPage),
    };

    router.replace({ query });
  },
  { immediate: false },
);
</script>
