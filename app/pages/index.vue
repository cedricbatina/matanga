<template>
  <main class="app-main fade-in">
    <!-- HERO / INTRO -->
    <section class="section">
      <div class="section-header">
        <h1 class="section-title">
          {{ t('home.hero.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('home.hero.subtitle') }}
        </p>
      </div>

      <div class="grid grid-2-cols">
        <!-- Bloc texte + CTA -->
        <article class="card card-elevated">
          <div class="card-body">
            <p class="text-md mb-4">
              {{ t('home.hero.body') }}
            </p>

            <div class="flex flex-row items-center gap-3 mt-4">
              <NuxtLink
                to="/obituary/create"
                class="btn btn-primary btn-lg"
              >
                {{ t('home.hero.primaryCta') }}
              </NuxtLink>

              <NuxtLink
                to="/obituaries"
                class="btn btn-secondary btn-lg"
              >
                {{ t('home.hero.secondaryCta') }}
              </NuxtLink>
            </div>

            <p class="text-xs text-soft mt-3">
              {{ t('home.hero.helperText') }}
            </p>
          </div>
        </article>

        <!-- Bloc "Comment ça marche ?" -->
        <article class="card card-muted">
          <header class="card-header">
            <h2 class="card-title">
              {{ t('home.howItWorks.title') }}
            </h2>
            <p class="card-subtitle">
              {{ t('home.howItWorks.subtitle') }}
            </p>
          </header>

          <div class="card-body">
            <ol class="text-sm" style="padding-left: 18px;">
              <li class="mb-2">
                {{ t('home.howItWorks.step1') }}
              </li>
              <li class="mb-2">
                {{ t('home.howItWorks.step2') }}
              </li>
              <li class="mb-2">
                {{ t('home.howItWorks.step3') }}
              </li>
            </ol>
          </div>
        </article>
      </div>
    </section>

    <!-- LISTE DES ANNONCES RÉCENTES (avec miniatures) -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">
          {{ t('home.list.title') }}
        </h2>
        <p class="section-subtitle">
          {{ t('home.list.subtitle') }}
        </p>
      </div>

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

      <!-- Liste -->
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
                <h3 class="card-title">
                  {{ item.content.title || item.deceased.fullName }}
                </h3>

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

                <!-- Badges monétisation / stats -->
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

    <!-- FILTRES / RECHERCHE (zone de tri sous la liste) -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">
          {{ t('home.search.title') }}
        </h2>
        <p class="section-subtitle">
          {{ t('home.search.subtitle') }}
        </p>
      </div>

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
  </main>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useSeoMeta } from '#imports';
import { useI18n } from 'vue-i18n';
import { useObituariesStore } from '~/stores/obituaries';
import { useDateUtils } from '~/composables/useDateUtils';
import Pagination from '~/components/Pagination.vue';

const { t, locale } = useI18n();
const obituaries = useObituariesStore();
const { formatDate, formattedDate, timeAgo } = useDateUtils();

// SEO localisé
const seoTitle = computed(() => t('home.meta.title'));
const seoDescription = computed(() => t('home.meta.description'));

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
});

// Filtres locaux (UI)
const localFilters = reactive({
  countryCode: obituaries.filters.countryCode || '',
  city: obituaries.filters.city || '',
  q: obituaries.filters.q || '',
  sort: obituaries.filters.sort || 'recent',
});

const obituaryPath = (item) => `/obituary/${item.slug}`;

// Miniature : on anticipe un champ future "thumbnailUrl" ou similaire.
// Fallback sur une image de placeholder (à adapter dans ton projet).
const thumbnailUrlFor = (item) => {
  // 1) ce que renvoie l'API aujourd'hui
  if (item.coverImageUrl) {
    return item.coverImageUrl;
  }

  // 2) si plus tard tu ajoutes d'autres champs côté API
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.media?.thumbnailUrl) return item.media.thumbnailUrl;
  if (item.media?.coverUrl) return item.media.coverUrl;

  // 3) éventuellement un placeholder local (à créer dans /public)
  // si tu n'as pas encore de fichier à cette URL, mets plutôt "null"
  // pour ne pas avoir d'image cassée.
  return null;
  // return '/images/placeholders/obituary-card.svg';
};

// Appliquer les filtres locaux → store
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

// Langue & premier chargement
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
  padding: 0; /* on gère les padding à l’intérieur */
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
</style>
