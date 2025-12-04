<template>
  <nav
    class="app-pagination"
    :aria-label="ariaLabelComputed"
  >
    <div class="app-pagination__inner">
      <!-- Résumé -->
      <p
        v-if="showSummary && totalItems > 0"
        class="app-pagination__summary"
        aria-live="polite"
      >
        {{
          totalItems > 1
            ? t('pagination.summaryMany', {
                start: startItem,
                end: endItem,
                total: totalItems,
              })
            : t('pagination.summaryOne', {
                start: startItem,
                end: endItem,
                total: totalItems,
              })
        }}
      </p>

      <ul class="app-pagination__list">
        <!-- Bouton Précédent -->
        <li class="app-pagination__item">
          <button
            type="button"
            class="app-pagination__btn app-pagination__btn--nav"
            :class="{ 'app-pagination__btn--disabled': isFirstPage }"
            :disabled="isFirstPage"
            @click="goToPage(currentPage - 1)"
            :aria-label="labelPrevComputed"
          >
            <span class="app-pagination__icon">
              <i class="fas fa-chevron-left" aria-hidden="true"></i>
            </span>
            <span class="app-pagination__text">
              {{ labelPrevComputed }}
            </span>
          </button>
        </li>

        <!-- Pages -->
        <li
          v-for="page in visiblePages"
          :key="page.key"
          class="app-pagination__item app-pagination__item--page"
        >
          <button
            v-if="page.type === 'page'"
            type="button"
            class="app-pagination__btn app-pagination__btn--page"
            :class="{
              'app-pagination__btn--active': page.number === currentPage
            }"
            @click="goToPage(page.number)"
            :aria-current="page.number === currentPage ? 'page' : undefined"
          >
            {{ page.number }}
          </button>
          <span
            v-else
            class="app-pagination__ellipsis"
            aria-hidden="true"
          >
            …
          </span>
        </li>

        <!-- Bouton Suivant -->
        <li class="app-pagination__item">
          <button
            type="button"
            class="app-pagination__btn app-pagination__btn--nav"
            :class="{ 'app-pagination__btn--disabled': isLastPage }"
            :disabled="isLastPage"
            @click="goToPage(currentPage + 1)"
            :aria-label="labelNextComputed"
          >
            <span class="app-pagination__text">
              {{ labelNextComputed }}
            </span>
            <span class="app-pagination__icon">
              <i class="fas fa-chevron-right" aria-hidden="true"></i>
            </span>
          </button>
        </li>

        <!-- Aller à la page -->
        <li
          v-if="showGoto && totalPages > 1"
          class="app-pagination__item app-pagination__item--goto"
        >
          <div class="app-pagination__goto">
            <label class="app-pagination__goto-label">
              <span class="app-pagination__goto-label-text">
                {{ t('pagination.gotoLabel') }}
              </span>
              <input
                v-model="inputPage"
                type="number"
                class="app-pagination__goto-input"
                inputmode="numeric"
                pattern="[0-9]*"
                min="1"
                :max="totalPages"
                :aria-label="t('pagination.gotoAria', { totalPages })"
                @keydown.enter.prevent="applyInputPage"
                @blur="applyInputPage"
              />
              <span class="app-pagination__goto-total">
                {{ t('pagination.gotoTotal', { totalPages }) }}
              </span>
            </label>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  pageSize: {
    type: Number,
    default: 0,
  },
  showSummary: {
    type: Boolean,
    default: true,
  },
  showGoto: {
    type: Boolean,
    default: true,
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  labelPrev: {
    type: String,
    default: '',
  },
  labelNext: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['pageChange']);
const { t } = useI18n();

// Input local pour "aller à la page"
const inputPage = ref(props.currentPage);

// garde input synchronisé avec la page actuelle
watch(
  () => props.currentPage,
  (val) => {
    inputPage.value = val;
  }
);

// États de base
const isFirstPage = computed(() => props.currentPage <= 1);
const isLastPage = computed(
  () => props.currentPage >= props.totalPages || props.totalPages <= 1
);

// Résumé X–Y sur Z
const startItem = computed(() => {
  if (!props.totalItems || !props.pageSize) return 1;
  return (props.currentPage - 1) * props.pageSize + 1;
});

const endItem = computed(() => {
  if (!props.totalItems || !props.pageSize) return props.totalItems;
  const raw = props.currentPage * props.pageSize;
  return raw > props.totalItems ? props.totalItems : raw;
});

// Labels / aria via i18n (fallback si props non fournis)
const ariaLabelComputed = computed(
  () => props.ariaLabel || t('pagination.ariaLabel')
);
const labelPrevComputed = computed(
  () => props.labelPrev || t('pagination.prev')
);
const labelNextComputed = computed(
  () => props.labelNext || t('pagination.next')
);

// Algorithme d'affichage des pages (1 ... 4 5 [6] 7 8 ... 30)
const visiblePages = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push({ type: 'page', number: i, key: `p-${i}` });
    }
    return pages;
  }

  const addPage = (n) =>
    pages.push({ type: 'page', number: n, key: `p-${n}` });
  const addEllipsis = (id) =>
    pages.push({ type: 'ellipsis', key: `e-${id}` });

  addPage(1);

  if (current > 3) {
    addEllipsis('left');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    addPage(i);
  }

  if (current < total - 2) {
    addEllipsis('right');
  }

  addPage(total);

  return pages;
});

// Navigation
function goToPage(page) {
  const target = Number(page);

  if (!Number.isFinite(target)) return;
  if (target < 1 || target > props.totalPages) return;

  if (target !== props.currentPage) {
    emit('pageChange', target);
  }
}

// "Aller à la page" à partir de l'input
function applyInputPage() {
  let page = Number(inputPage.value);

  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }
  if (page > props.totalPages) {
    page = props.totalPages;
  }

  inputPage.value = page;
  goToPage(page);
}
</script>

<style scoped>
.app-pagination {
  width: 100%;
  margin: 1rem 0 1.5rem;
  font-size: 0.95rem;
}

.app-pagination__inner {
  max-width: var(--max-width-page);
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.app-pagination__summary {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

/* Liste principale */
.app-pagination__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.app-pagination__item {
  display: flex;
}

/* Boutons de base */
.app-pagination__btn {
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
  color: var(--color-text-main);
  padding: 0.32rem 0.8rem;
  font-size: 0.9rem;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform 100ms ease;
}

.app-pagination__btn--nav {
  background: var(--color-surface-muted);
}

/* Page */
.app-pagination__btn--page {
  min-width: 2.25rem;
  justify-content: center;
}

.app-pagination__btn--page.app-pagination__btn--active {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-color: var(--color-accent-strong);
  box-shadow: var(--shadow-card);
}

/* Hover / focus */
.app-pagination__btn:hover,
.app-pagination__btn:focus-visible {
  outline: none;
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.app-pagination__btn--nav:hover,
.app-pagination__btn--nav:focus-visible {
  border-color: var(--color-accent);
  color: var(--color-accent-strong);
  background: var(--color-accent-soft);
}

/* Désactivé */
.app-pagination__btn--disabled {
  cursor: default;
  opacity: 0.5;
  box-shadow: none;
  transform: none;
}

/* Ellipses */
.app-pagination__ellipsis {
  padding: 0.32rem 0.3rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

/* Icône / texte */
.app-pagination__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-pagination__text {
  display: inline;
}

/* Aller à la page */
.app-pagination__item--goto {
  margin-left: 0.25rem;
}

.app-pagination__goto {
  display: inline-flex;
  align-items: center;
}

.app-pagination__goto-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--color-text-main);
}

.app-pagination__goto-input {
  width: 3rem;
  padding: 0.18rem 0.35rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-subtle);
  font-size: 0.85rem;
  text-align: center;
  outline: none;
  background-color: var(--color-surface);
  color: var(--color-text-main);
}

.app-pagination__goto-input:focus-visible {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent-soft);
}

.app-pagination__goto-total {
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

/* Responsive */
@media (max-width: 640px) {
  .app-pagination__inner {
    padding-inline: var(--space-3);
  }

  .app-pagination__summary {
    order: 2;
    text-align: center;
  }

  .app-pagination__list {
    justify-content: center;
  }

  .app-pagination__text {
    display: none; /* on garde les icônes pour Prev/Next */
  }

  .app-pagination__btn--nav {
    padding-inline: 0.7rem;
  }

  .app-pagination__goto-label-text {
    display: none; /* juste input + / total */
  }

  .app-pagination__goto-input {
    width: 2.4rem;
  }
}
</style>
