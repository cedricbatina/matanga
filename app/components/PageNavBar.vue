<!-- components/PageNavBar.vue -->
<template>
  <nav class="section" :aria-label="ariaLabel">
    <div class="section-header section-header--compact page-nav">
      <div class="page-nav__left">
        <!-- Retour à l'accueil -->
        <NuxtLink
          v-if="showBackHome"
          :to="backHomeTo"
          class="link-back"
        >
          ← {{ t(backHomeLabelKey) }}
        </NuxtLink>

        <!-- Retour à la liste -->
        <NuxtLink
          v-if="showBackList && backListTo"
          :to="backListTo"
          class="link-back link-back--secondary"
        >
          ← {{ t(backListLabelKey) }}
        </NuxtLink>
      </div>

      <!-- CTA principal (ex : créer une annonce) -->
      <div class="page-nav__right" v-if="showCreate && createTo">
        <NuxtLink
          :to="createTo"
          class="btn btn-secondary btn-sm"
        >
          {{ t(createLabelKey) }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  ariaLabel: {
    type: String,
    default: 'Navigation',
  },

  showBackHome: {
    type: Boolean,
    default: true,
  },
  backHomeTo: {
    type: String,
    default: '/',
  },
  backHomeLabelKey: {
    type: String,
    default: 'common.backToHome',
  },

  showBackList: {
    type: Boolean,
    default: false,
  },
  backListTo: {
    type: String,
    default: '',
  },
  backListLabelKey: {
    type: String,
    default: 'obituary.backToList',
  },

  showCreate: {
    type: Boolean,
    default: false,
  },
  createTo: {
    type: String,
    default: '',
  },
  createLabelKey: {
    type: String,
    default: 'home.hero.primaryCta',
  },
});
</script>

<style scoped>
.page-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.page-nav__left {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.page-nav__right {
  display: flex;
  flex-shrink: 0;
}

/* liens retour */
.link-back {
  font-size: 0.9rem;
  color: var(--color-text-soft);
  text-decoration: none;
}
.link-back:hover {
  color: var(--color-accent-strong);
  text-decoration: underline;
}

.link-back--secondary {
  opacity: 0.85;
}
.link-back--secondary:hover {
  opacity: 1;
}
</style>
