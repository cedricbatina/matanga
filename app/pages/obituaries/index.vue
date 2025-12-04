<!-- pages/obituaries/index.vue -->
<template>
  <main class="app-main fade-in">
    <!-- EN-TÊTE -->
<PageNavBar
  aria-label="Navigation principale des annonces"
  :show-back-home="true"
  :show-back-list="false"
  :show-create="true"
  create-to="/obituary/create"
/>


    <section class="section">
      <div class="section-header">
        <h1 class="section-title">
          {{ t('home.list.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('home.list.subtitle') }}
        </p>
      </div>
    </section>

    <!-- FILTRES / RECHERCHE -->
    <section class="section">
      <form class="card form" @submit.prevent="onSubmitFilters">
        <!-- Ligne pays + ville -->
        <div class="form-row form-row-inline">
          <div class="form-field">
            <label class="form-label" for="country">
              {{ t('home.search.country.label') }}
            </label>
            <input
              id="country"
              v-model="localFilters.countryCode"
              class="form-control"
              type="text"
              maxlength="2"
              :placeholder="t('home.search.country.placeholder')"
            />
            <p class="form-hint">
              {{ t('home.search.country.hint') }}
            </p>
          </div>

          <div class="form-field">
            <label class="form-label" for="city">
              {{ t('home.search.city.label') }}
            </label>
            <input
              id="city"
              v-model="localFilters.city"
              class="form-control"
              type="text"
              :placeholder="t('home.search.city.placeholder')"
            />
          </div>
        </div>

        <!-- Ligne q + sort -->
        <div class="form-row form-row-inline">
          <div class="form-field">
            <label class="form-label" for="q">
              {{ t('home.search.q.label') }}
            </label>
            <input
              id="q"
              v-model="localFilters.q"
              class="form-control"
              type="text"
              :placeholder="t('home.search.q.placeholder')"
            />
            <p class="form-hint">
              {{ t('home.search.q.hint') }}
            </p>
          </div>

          <div class="form-field">
            <label class="form-label" for="sort">
              {{ t('home.search.sort.label') }}
            </label>
            <select
              id="sort"
              v-model="localFilters.sort"
              class="form-control"
            >
              <option value="recent">
                {{ t('home.search.sort.options.recent') }}
              </option>
              <option value="oldest">
                {{ t('home.search.sort.options.oldest') }}
              </option>
              <option value="popular">
                {{ t('home.search.sort.options.popular') }}
              </option>
            </select>
          </div>
        </div>

        <div class="card-footer">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="onResetFilters"
          >
            {{ t('home.search.reset') }}
          </button>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="obituaries.loading"
          >
            {{
              obituaries.loading
                ? t('home.search.loading')
                : t('home.search.submit')
            }}
          </button>
        </div>
      </form>
    </section>

    <!-- LISTE DES ANNONCES -->
    <section class="section">
      <!-- Erreur -->
      <div v-if="obituaries.error" class="card card-muted">
        <p class="text-sm text-danger">
          {{ t('home.list.error') }}
        </p>
      </div>

      <!-- Loading -->
      <div v-else-if="obituaries.loading" class="card card-muted">
        <p class="text-sm">
          {{ t('home.list.loading') }}
        </p>
      </div>

      <!-- Résultats -->
      <div v-else>
        <!-- Vide -->
        <div v-if="!obituaries.items.length" class="card card-muted">
          <p class="text-sm">
            {{ t('home.list.empty') }}
          </p>
        </div>

        <!-- Cards -->
        <div v-else class="grid grid-3-cols">
          <article
            v-for="item in obituaries.items"
            :key="item.id"
            class="card obituary-card"
          >
            <!-- Miniature -->
            <div
              v-if="thumbnailUrlFor(item)"
              class="obituary-card__media"
            >
              <img
                class="obituary-card__image"
                :src="thumbnailUrlFor(item)"
                :alt="item.content.title || item.deceased.fullName"
                loading="lazy"
              />
            </div>

            <div class="obituary-card__content">
              <header class="card-header">
                <h2 class="card-title">
                  {{ item.content.title || item.deceased.fullName }}
                </h2>

                <p class="card-subtitle text-xs text-soft">
                  <span v-if="item.deceased.dateOfDeath">
                    {{
                      t('home.list.card.dateOfDeath', {
                        date: formatDate(item.deceased.dateOfDeath),
                      })
                    }}
                  </span>

                  <span v-if="item.deceased.ageDisplay">
                    • {{ item.deceased.ageDisplay }}
                  </span>

                  <span v-if="item.publishedAt">
                    • {{ timeAgo(item.publishedAt) }}
                  </span>
                </p>
              </header>

              <div class="card-body">
                <!-- Extrait -->
                <p class="text-sm mb-2">
                  {{ item.content.excerpt }}
                </p>

                <!-- Localisation -->
                <p class="text-xs text-soft">
                  <span v-if="item.location.city">
                    {{ item.location.city }}
                  </span>
                  <span v-if="item.location.region">
                    • {{ item.location.region }}
                  </span>
                  <span v-if="item.location.country">
                    • {{ item.location.country }}
                  </span>
                </p>

                <!-- Badges -->
                <div class="mt-2">
                  <span
                    v-if="item.monetization.isFree"
                    class="badge badge-success"
                  >
                    {{ t('home.list.card.badgeFree') }}
                  </span>
                  <span
                    v-else
                    class="badge badge-neutral"
                  >
                    {{
                      t('home.list.card.badgePaid', {
                        tier: item.monetization.pricingTier || 'pro',
                      })
                    }}
                  </span>

                  <span
                    v-if="item.stats.viewCount != null"
                    class="badge badge-soft"
                    style="margin-left: 4px;"
                  >
                    {{
                      t('home.list.card.views', {
                        count: item.stats.viewCount,
                      })
                    }}
                  </span>
                </div>

                <!-- Événement principal -->
                <p
                  v-if="item.mainEvent && item.mainEvent.startsAt"
                  class="text-xs text-soft mt-3"
                >
                  {{
                    t('home.list.card.mainEvent', {
                      type: t(
                        'home.eventTypes.' +
                          (item.mainEvent.eventType || 'other')
                      ),
                      date: formattedDate(item.mainEvent.startsAt),
                    })
                  }}
                </p>
              </div>

              <footer class="card-footer">
                <NuxtLink
                  :to="obituaryPath(item)"
                  class="btn btn-secondary btn-sm"
                >
                  {{ t('home.list.card.viewDetails') }}
                </NuxtLink>
              </footer>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="obituaries.pagination.totalPages > 1"
          class="mt-4"
          :current-page="obituaries.pagination.page"
          :total-pages="obituaries.pagination.totalPages"
          :total-items="obituaries.pagination.total"
          :page-size="obituaries.pagination.pageSize"
          :aria-label="t('pagination.ariaLabel')"
          :label-prev="t('pagination.prev')"
          :label-next="t('pagination.next')"
          @pageChange="onPageChange"
        />
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useSeoMeta } from '#imports';
import { useI18n } from 'vue-i18n';
import { useObituariesStore } from '~/stores/obituaries';
import { useDateUtils } from '~/composables/useDateUtils';
import Pagination from '~/components/Pagination.vue';
import PageNavBar from '~/components/PageNavBar.vue';

const { t, locale } = useI18n();
const obituaries = useObituariesStore();
const { formatDate, formattedDate, timeAgo } = useDateUtils();

// SEO
const seoTitle = computed(() => t('home.meta.title'));
const seoDescription = computed(() => t('home.meta.description'));

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
});

// Filtres (UI)
const localFilters = reactive({
  countryCode: obituaries.filters.countryCode || '',
  city: obituaries.filters.city || '',
  q: obituaries.filters.q || '',
  sort: obituaries.filters.sort || 'recent',
});

const obituaryPath = (item) => `/obituary/${item.slug}`;

// Miniature : coverImageUrl puis fallback éventuels.
const thumbnailUrlFor = (item) => {
  if (item.coverImageUrl) return item.coverImageUrl;
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.media?.thumbnailUrl) return item.media.thumbnailUrl;
  if (item.media?.coverUrl) return item.media.coverUrl;
  return null;
};

// Appliquer les filtres au store
const applyFiltersToStore = () => {
  obituaries.setFilters({
    countryCode: localFilters.countryCode,
    city: localFilters.city,
    q: localFilters.q,
    sort: localFilters.sort,
  });
};

const onSubmitFilters = () => {
  applyFiltersToStore();
  obituaries.fetchList();
};

const onResetFilters = () => {
  obituaries.resetFilters();
  localFilters.countryCode = '';
  localFilters.city = '';
  localFilters.q = '';
  localFilters.sort = 'recent';
  obituaries.fetchList();
};

const onPageChange = (page) => {
  obituaries.setPage(page);
  obituaries.fetchList();
};

// Filtre langue + premier chargement
obituaries.setFilters({ language: locale.value });
await obituaries.fetchList();

watch(
  () => locale.value,
  (lang) => {
    obituaries.setFilters({ language: lang });
    obituaries.fetchList();
  }
);
</script>

<style scoped>
.obituary-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.obituary-card__media {
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.obituary-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.obituary-card__content {
  padding: var(--space-4);
}
.link-back {
  font-size: 0.9rem;
  color: var(--color-text-soft);
  text-decoration: none;
}
.link-back:hover {
  color: var(--color-accent-strong);
  text-decoration: underline;
}

.section-header--nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.section-header__left {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.section-header__right {
  display: flex;
  flex-shrink: 0;
}

</style>
