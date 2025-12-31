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
          prefetch
        >
          <IconChevronLeft class="link-back__icon" />
          <span class="link-back__label">{{ t(backHomeLabelKey) }}</span>
        </NuxtLink>

        <!-- Retour à la liste -->
        <NuxtLink
          v-if="showBackList && backListTo"
          :to="backListTo"
          class="link-back link-back--secondary"
          prefetch
        >
          <IconChevronLeft class="link-back__icon" />
          <span class="link-back__label">{{ t(backListLabelKey) }}</span>
        </NuxtLink>

        <!-- Zone extensible à gauche si besoin -->
        <slot name="left" />
      </div>
<div class="page-nav__right" v-if="hasRightSide">
  <!-- Actions (slot + props) -->
  <div
    v-if="hasActions"
    class="page-nav__actions"
    role="group"
    :aria-label="t(actionsAriaLabelKey)"
  >
    <!-- ✅ slot actions (prioritaire / complément) -->
    <slot name="actions" />

    <!-- actions via props -->
    <component
      v-for="(a, idx) in actions"
      :key="a.key || `${a.to || a.href}-${idx}`"
      :is="a.href ? 'a' : NuxtLink"
      :to="a.href ? undefined : a.to"
      :href="a.href || undefined"
      :target="a.target || (a.href ? '_blank' : undefined)"
      :rel="a.rel || (a.href ? 'noopener noreferrer' : undefined)"
      :class="actionClass(a)"
      :aria-label="a.ariaLabelKey ? t(a.ariaLabelKey) : undefined"
      :prefetch="a.href ? undefined : true"
    >
      <span class="action__inner">
        <component
          v-if="a.icon"
          :is="a.icon"
          class="action__icon"
          aria-hidden="true"
        />
        <span class="action__label">{{ t(a.labelKey) }}</span>
      </span>
    </component>
  </div>

  <!-- CTA principal (compat) -->
  <NuxtLink
    v-if="showCreate && createTo"
    :to="createTo"
    class="btn btn-secondary btn-sm page-nav__cta"
    prefetch
  >
    {{ t(createLabelKey) }}
  </NuxtLink>

  <!-- Zone extensible à droite (hors actions) -->
  <slot name="right" />
</div>

    </div>
  </nav>
</template>

<script setup>
import { computed, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import IconChevronLeft from "~/components/IconChevronLeft.vue";
const slots = useSlots();

const hasActions = computed(() => {
  return (props.actions && props.actions.length) || !!slots.actions;
});

const hasRightSide = computed(() => {
  return hasActions.value || (props.showCreate && props.createTo) || !!slots.right;
})
const { t } = useI18n();

const props = defineProps({
  ariaLabel: { type: String, default: 'Navigation' },

  showBackHome: { type: Boolean, default: true },
  backHomeTo: { type: String, default: '/' },
  backHomeLabelKey: { type: String, default: 'common.backToHome' },

  showBackList: { type: Boolean, default: false },
  backListTo: { type: String, default: '' },
  backListLabelKey: { type: String, default: 'obituary.backToList' },

  showCreate: { type: Boolean, default: false },
  createTo: { type: String, default: '' },
  createLabelKey: { type: String, default: 'home.hero.primaryCta' },

  /**
   * actions: [{ to, href, labelKey, kind, key, icon, ariaLabelKey, target, rel }]
   * - icon: composant Vue (SVG) ex: IconSparkles
   */
  actions: {
    type: Array,
    default: () => [],
  },

  actionsAriaLabelKey: {
    type: String,
    default: 'common.quickActions',
  },
});
/*
const hasRightSide = computed(() => {
  return (props.actions && props.actions.length) || (props.showCreate && props.createTo);
});*/

// mapping de styles vers tes classes globales (respect design)
function actionClass(a) {
  const base = 'btn btn-sm';
  const kind = a.kind || 'ghost'; // 'primary' | 'secondary' | 'ghost' | 'link'
  if (kind === 'primary') return `${base} btn-primary`;
  if (kind === 'secondary') return `${base} btn-secondary`;
  if (kind === 'link') return `link-action`;
  return `${base} btn-ghost`;
}
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
  align-items: center;
  gap: 0.75rem;
}

.page-nav__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.page-nav__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* liens retour */
.link-back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  font-size: 0.95rem;
  color: var(--color-text-soft);
  text-decoration: none;

  /* zone tactile */
  padding: 0.4rem 0.55rem;
  border-radius: 0.55rem;
}
.link-back:hover {
  color: var(--color-accent-strong);
  text-decoration: underline;
}

.link-back__icon {
  width: 1.1em;
  height: 1.1em;
  flex: 0 0 auto;
}

.link-back--secondary {
  opacity: 0.88;
}
.link-back--secondary:hover {
  opacity: 1;
}

/* ✅ Accessibilité : focus clavier visible */
.link-back:focus-visible,
.link-action:focus-visible,
.page-nav__right :deep(.btn):focus-visible {
  outline: 2px solid var(--color-accent-strong);
  outline-offset: 2px;
}

/* actions type "link" */
.link-action {
  font-size: 0.9rem;
  color: var(--color-text-soft);
  text-decoration: none;
  padding: 0.4rem 0.55rem;
  border-radius: 0.55rem;
}
.link-action:hover {
  color: var(--color-accent-strong);
  text-decoration: underline;
}

/* icônes + label dans actions */
.action__inner {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.action__icon {
  width: 1.05em;
  height: 1.05em;
  flex: 0 0 auto;
}

/* ✅ Mobile-first : sur petit écran, on empile et CTA full width */
@media (max-width: 420px) {
  .page-nav {
    align-items: flex-start;
    flex-direction: column;
  }
  .page-nav__right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .page-nav__cta {
    width: 100%;
  }
}

/* ✅ Option UX: sur très petit écran, on peut masquer les labels des retours,
   tout en gardant l’accessibilité via le texte (non supprimé du DOM). */
@media (max-width: 360px) {
  .link-back__label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
</style>
