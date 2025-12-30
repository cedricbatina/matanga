<!-- pages/plans/index.vue -->
<template>
  <main class="app-main fade-in">
    <!-- Barre de nav générique Matanga -->
    <PageNavBar
      aria-label="Navigation choix de plan"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="false"
    />

    <section class="section">
      <!-- Header -->
      <header class="section-header plans-header">
        <div class="plans-header__text">
          <h1 class="section-title">
            {{ t('plans.title') }}
          </h1>
          <p class="section-subtitle">
            {{ t('plans.subtitle') }}
          </p>
          <p class="plans-header__hint">
            {{ t('plans.helper') }}
          </p>
        </div>

        <!-- Switch Particulier / Pro -->
        <div class="plans-toggle" role="tablist" aria-label="Type de client">
          <button
            type="button"
            class="plans-toggle__btn"
            :class="{ 'plans-toggle__btn--active': selectedAudience === 'individual' }"
            role="tab"
            :aria-selected="selectedAudience === 'individual'"
            @click="selectedAudience = 'individual'"
          >
            <i class="fas fa-user" aria-hidden="true"></i>
            <span>{{ t('plans.audience.individual') }}</span>
          </button>
          <button
            type="button"
            class="plans-toggle__btn"
            :class="{ 'plans-toggle__btn--active': selectedAudience === 'pro' }"
            role="tab"
            :aria-selected="selectedAudience === 'pro'"
            @click="selectedAudience = 'pro'"
          >
            <i class="fas fa-briefcase" aria-hidden="true"></i>
            <span>{{ t('plans.audience.pro') }}</span>
            <span class="plans-toggle__badge">
              {{ t('plans.audience.proSoon') }}
            </span>
          </button>
        </div>
      </header>

      <!-- État chargement / erreur -->
      <div v-if="pending" class="plans-loading">
        <div class="plans-skeleton" v-for="n in 3" :key="n">
          <div class="plans-skeleton__header"></div>
          <div class="plans-skeleton__line plans-skeleton__line--wide"></div>
          <div class="plans-skeleton__line"></div>
          <div class="plans-skeleton__line"></div>
        </div>
      </div>

      <div v-else-if="error" class="plans-error">
        <p class="plans-error__text">
          {{ t('plans.error') }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('plans.retry') }}
        </button>
      </div>

      <!-- CONTENU -->
      <div v-else class="plans-sections">
        <!-- 🎯 Familles / particuliers -->
        <template v-if="selectedAudience === 'individual'">
          <!-- Annonces -->
          <section class="plans-section">
            <header class="plans-section__header">
              <h2 class="plans-section__title">
                {{ t('plans.sections.individualObituary') }}
              </h2>
              <p class="plans-section__hint">
                {{ t('plans.sections.individualObituaryHint') }}
              </p>
            </header>

            <div class="plans-grid">
              <article
                v-for="plan in individualObituaryPlans"
                :key="plan.code"
                class="card plan-card"
               :class="{
  'plan-card--highlight': plan.isRecommended,
  'plan-card--free': plan.isFree
}"

              >
                <div class="card-body plan-card__body">
                  <header class="plan-card__header">
                    <div class="plan-card__titles">
                      <p
                        v-if="plan.isFree"
                        class="plan-card__eyebrow"
                      >
                        {{ t('plans.badges.free') }}
                      </p>
                     <p
  v-else-if="plan.isRecommended"
  class="plan-card__note plan-card__note--accent"
>
  {{ t('plans.notes.essentiel') }}
</p>


                      <h2 class="plan-card__title">
                        {{ plan.label }}
                      </h2>
                      <p class="plan-card__subtitle">
                        {{ plan.description }}
                      </p>
                    </div>

                    <div class="plan-card__price">
                      <!-- Plans payants -->
                      <template v-if="!plan.isFree">
                        <span class="plan-card__price-main">
                          {{ formatPrice(plan.basePriceCents) }}
                        </span>
                        <span class="plan-card__price-helper">
                          {{ t('plans.price.onetime') }}
                        </span>
                      </template>
                    </div>
                  </header>

                  <!-- Caractéristiques -->
                  <ul class="plan-card__features" aria-label="Caractéristiques du plan">
                    <li
                      v-if="plan.publishDurationDays"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-clock plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.features.duration.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.features.duration.value', { days: plan.publishDurationDays }) }}
                        </span>
                      </span>
                    </li>

                    <li
                      v-if="plan.features?.primaryVisibilityDays && plan.features?.secondaryVisibilityDays"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-bullhorn plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.features.visibility.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.features.visibility.value', {
                            primary: plan.features.primaryVisibilityDays,
                            secondary: plan.features.secondaryVisibilityDays
                          }) }}
                        </span>
                      </span>
                    </li>

                    <li
                      v-if="plan.features?.maxEvents"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-calendar-alt plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.features.events.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.features.events.value', { count: plan.features.maxEvents }) }}
                        </span>
                      </span>
                    </li>

                    <li
                      v-if="plan.features?.maxPhotos || plan.features?.maxVideos"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-image plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.features.media.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.features.media.value', {
                            photos: plan.features.maxPhotos || 0,
                            videos: plan.features.maxVideos || 0
                          }) }}
                        </span>
                      </span>
                    </li>

                    <li
                      v-if="plan.features?.maxContacts"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-user-friends plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.features.contacts.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.features.contacts.value', {
                            count: plan.features.maxContacts
                          }) }}
                        </span>
                      </span>
                    </li>

                    <li
                      v-if="plan.features?.maxOnlineEvents"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-video plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.features.online.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.features.online.value', {
                            count: plan.features.maxOnlineEvents
                          }) }}
                        </span>
                      </span>
                    </li>
                  </ul>

                  <!-- Notes -->
                  <p
                    v-if="plan.code === 'indiv_free_7' || plan.code === 'indiv_free_14'"
                    class="plan-card__note"
                  >
                    {{ t('plans.notes.free') }}
                  </p>
                <p
  v-else-if="plan.isRecommended"
  class="plan-card__eyebrow plan-card__eyebrow--accent"
>
  {{ t('plans.badges.recommended') }}
</p>

                </div>

                <footer class="card-footer plan-card__footer">
                  <NuxtLink
                    :class="planCtaClasses(plan)"
                    :to="{ path: '/obituary/create', query: { plan: plan.code } }"
                  >
                    {{ t(planCtaLabelKey(plan)) }}
                  </NuxtLink>

                  <p class="plan-card__legal">
                    {{ t('plans.legal.reminder') }}
                  </p>
                </footer>
              </article>
            </div>
          </section>

          <!-- Mémoriaux familles -->
          <section
            v-if="individualMemorialPlans.length"
            class="plans-section"
          >
            <header class="plans-section__header">
              <h2 class="plans-section__title">
                {{ t('plans.sections.individualMemorial') }}
              </h2>
            <p class="plans-section__hint">
              {{ t('plans.sections.individualMemorialHint') }}
            </p>
            </header>

            <div class="plans-grid">
              <article
                v-for="plan in individualMemorialPlans"
                :key="plan.code"
                class="card plan-card plan-card--memorial"
              >
                <div class="card-body plan-card__body">
                  <header class="plan-card__header">
                    <div class="plan-card__titles">
                      <h2 class="plan-card__title">
                        {{ plan.label }}
                      </h2>
                      <p class="plan-card__subtitle">
                        {{ plan.description }}
                      </p>
                    </div>

                    <div class="plan-card__price">
                      <span class="plan-card__price-main">
                        {{ formatPrice(plan.basePriceCents) }}
                      </span>
                      <span class="plan-card__price-helper">
                        {{ t('plans.price.onetime') }}
                      </span>
                    </div>
                  </header>

                  <ul class="plan-card__features" aria-label="Caractéristiques du mémorial">
                    <li
                      v-if="plan.publishDurationDays"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-clock plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.features.duration.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.features.duration.value', { days: plan.publishDurationDays }) }}
                        </span>
                      </span>
                    </li>

                    <li
                      v-if="plan.features?.maxPhotos || plan.features?.maxVideos"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-image plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.features.media.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.features.media.value', {
                            photos: plan.features.maxPhotos || 0,
                            videos: plan.features.maxVideos || 0
                          }) }}
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>

                <!-- 🔁 Mémoriaux familles : bouton normal comme les autres -->
                <footer class="card-footer plan-card__footer">
                  <NuxtLink
                    :class="planCtaClasses(plan)"
                    :to="{ path: '/obituary/create', query: { plan: plan.code } }"
                  >
                    {{ t(planCtaLabelKey(plan)) }}
                  </NuxtLink>
                  <p class="plan-card__legal">
                    {{ t('plans.legal.reminder') }}
                  </p>
                </footer>
              </article>
            </div>
          </section>
        </template>

        <!-- 🎯 Professionnels -->
        <template v-else>
          <header class="plans-pro-header">
            <h2 class="plans-pro-header__title">
              {{ t('plans.pro.title') }}
            </h2>
            <p class="plans-pro-header__subtitle">
              {{ t('plans.pro.subtitle') }}
            </p>
          </header>

          <!-- Annonces pro à l’unité / packs -->
          <section class="plans-section">
            <header class="plans-section__header">
              <h3 class="plans-section__title">
                {{ t('plans.sections.proObituary') }}
              </h3>
              <p class="plans-section__hint">
                {{ t('plans.sections.proObituaryHint') }}
              </p>
            </header>

            <div class="plans-grid">
   <article
  v-for="plan in proObituaryPlans"
  :key="plan.code"
  class="card plan-card plan-card--pro"
>

  <div class="card-body plan-card__body">
    <header class="plan-card__header">
      <div class="plan-card__titles">
        <p class="plan-card__eyebrow plan-card__eyebrow--accent">
          {{ t('plans.pro.badgeSoon') }}
        </p>
        <h2 class="plan-card__title">
          {{ plan.label }}
        </h2>
        <p class="plan-card__subtitle">
          {{ plan.description }}
        </p>
      </div>

      <div class="plan-card__price">
        <span class="plan-card__price-main">
          {{ formatPrice(plan.basePriceCents) }}
        </span>
        <span class="plan-card__price-helper">
          {{ t('plans.price.onetime') }}
        </span>
      </div>
    </header>

    <ul class="plan-card__features" aria-label="Caractéristiques du plan pro">
      <li
        v-if="plan.publishDurationDays"
        class="plan-card__feature"
      >
        <i class="fas fa-clock plan-card__feature-icon" aria-hidden="true"></i>
        <span>
          <strong>{{ t('plans.features.duration.label') }}</strong>
          <span class="plan-card__feature-text">
            {{ t('plans.features.duration.value', { days: plan.publishDurationDays }) }}
          </span>
        </span>
      </li>

      <li
        v-if="plan.features?.maxEvents"
        class="plan-card__feature"
      >
        <i class="fas fa-calendar-alt plan-card__feature-icon" aria-hidden="true"></i>
        <span>
          <strong>{{ t('plans.features.events.label') }}</strong>
          <span class="plan-card__feature-text">
            {{ t('plans.features.events.value', { count: plan.features.maxEvents }) }}
          </span>
        </span>
      </li>

      <li
        v-if="plan.features?.maxActiveObituaries"
        class="plan-card__feature"
      >
        <i class="fas fa-layer-group plan-card__feature-icon" aria-hidden="true"></i>
        <span>
          <strong>{{ t('plans.pro.features.maxActive.label') }}</strong>
          <span class="plan-card__feature-text">
            {{ t('plans.pro.features.maxActive.value', { count: plan.features.maxActiveObituaries }) }}
          </span>
        </span>
      </li>

      <li
        v-if="plan.features?.maxUsers"
        class="plan-card__feature"
      >
        <i class="fas fa-user-friends plan-card__feature-icon" aria-hidden="true"></i>
        <span>
          <strong>{{ t('plans.pro.features.team.label') }}</strong>
          <span class="plan-card__feature-text">
            {{ t('plans.pro.features.team.value', { count: plan.features.maxUsers }) }}
          </span>
        </span>
      </li>

      <li
        v-if="plan.features?.includeSponsoredSlots"
        class="plan-card__feature"
      >
        <i class="fas fa-bullhorn plan-card__feature-icon" aria-hidden="true"></i>
        <span>
          <strong>{{ t('plans.pro.features.sponsored.label') }}</strong>
          <span class="plan-card__feature-text">
            {{ t('plans.pro.features.sponsored.value') }}
          </span>
        </span>
      </li>
    </ul>
  </div>

  <!-- ✅ même footer que les cartes pro du haut : plus de "sur demande" -->
  <footer class="card-footer plan-card__footer">
    <NuxtLink
      class="btn btn-primary btn-sm plan-card__cta"
      :to="{ path: '/obituary/create', query: { plan: plan.code, audience: 'pro' } }"
    >
      {{ t('plans.cta.startPaid') }}
    </NuxtLink>

    <p class="plan-card__legal">
      {{ t('plans.legal.reminder') }}
    </p>
  </footer>
</article>

            </div>
          </section>

          <!-- Abonnements / mémoriaux pro -->
          <section
            v-if="proMemorialPlans.length"
            class="plans-section"
          >
            <header class="plans-section__header">
              <h3 class="plans-section__title">
                {{ t('plans.sections.proMemorial') }}
              </h3>
              <p class="plans-section__hint">
                {{ t('plans.sections.proMemorialHint') }}
              </p>
            </header>

            <div class="plans-grid">
              <article
                v-for="plan in proMemorialPlans"
                :key="plan.code"
                class="card plan-card plan-card--pro"
              >
                <div class="card-body plan-card__body">
                  <header class="plan-card__header">
                    <div class="plan-card__titles">
                      <p class="plan-card__eyebrow plan-card__eyebrow--accent">
                        {{ t('plans.pro.badgeSoon') }}
                      </p>
                      <h2 class="plan-card__title">
                        {{ plan.label }}
                      </h2>
                      <p class="plan-card__subtitle">
                        {{ plan.description }}
                      </p>
                    </div>

                    <div class="plan-card__price">
                      <span class="plan-card__price-main">
                        {{ formatPrice(plan.basePriceCents) }}
                      </span>
                      <span class="plan-card__price-helper">
                        {{ t('plans.price.onetime') }}
                      </span>
                    </div>

                  </header>

                  <ul class="plan-card__features" aria-label="Caractéristiques de l’abonnement pro">
                    <li
                      v-if="plan.features?.maxActiveObituaries"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-layer-group plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.pro.features.maxActive.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.pro.features.maxActive.value', {
                            count: plan.features.maxActiveObituaries
                          }) }}
                        </span>
                      </span>
                    </li>

                    <li
                      v-if="plan.features?.maxUsers"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-user-friends plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.pro.features.team.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.pro.features.team.value', {
                            count: plan.features.maxUsers
                          }) }}
                        </span>
                      </span>
                    </li>

                    <li
                      v-if="plan.features?.includeSponsoredSlots"
                      class="plan-card__feature"
                    >
                      <i class="fas fa-bullhorn plan-card__feature-icon" aria-hidden="true"></i>
                      <span>
                        <strong>{{ t('plans.pro.features.sponsored.label') }}</strong>
                        <span class="plan-card__feature-text">
                          {{ t('plans.pro.features.sponsored.value') }}
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>

               <footer class="card-footer plan-card__footer">
  <NuxtLink
    class="btn btn-primary btn-sm plan-card__cta"
    :to="{ path: '/obituary/create', query: { plan: plan.code, audience: 'pro' } }"
  >
    {{ t('plans.cta.startPaid') }}
  </NuxtLink>

  <p class="plan-card__legal">
    {{ t('plans.legal.reminder') }}
  </p>
</footer>

              </article>
            </div>
          </section>
        </template>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFetch, useSeoMeta } from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';

const { t, te } = useI18n();

// SEO
useSeoMeta({
  title: () => t('plans.meta.title'),
  description: () => t('plans.meta.description'),
  ogTitle: () => t('plans.meta.title'),
  ogDescription: () => t('plans.meta.description'),
});

const tr = (key, fallback, params) => {
  if (!te(key)) return fallback;
  return params ? t(key, params) : t(key);
};

// Audience sélectionnée : particulier par défaut
const selectedAudience = ref('individual');

// Chargement des plans depuis l'API
const {
  data,
  pending,
  error,
  refresh,
} = await useFetch('/api/plans', {
  default: () => ({
    individualObituary: [],
    individualMemorial: [],
    proObituary: [],
    proMemorial: [],
  }),
});

// Tri : gratuits d'abord, puis prix croissant
const visible = (list) => (list || []).filter(p => p?.isPublic !== false);

const sortByOrder = (plans) => {
  return [...plans].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
};

const individualObituaryPlans = computed(() =>
  sortByOrder(visible(data.value?.individualObituary || []))
);

const individualMemorialPlans = computed(() =>
  sortByOrder(visible(data.value?.individualMemorial || []))
);

const proObituaryPlans = computed(() =>
  sortByOrder(visible(data.value?.proObituary || []))
);

const proMemorialPlans = computed(() =>
  sortByOrder(visible(data.value?.proMemorial || []))
);


// Plan individuel recommandé (Essentiel 30j)
const recommendedIndividualCode = computed(() => {
  return (individualObituaryPlans.value || []).find(p => p?.isRecommended)?.code || null;
});


const planCtaLabelKey = (plan) => {
  if (plan.isFree) {
    return 'plans.cta.startFree';
  }
  if (recommendedIndividualCode.value && plan.code === recommendedIndividualCode.value) {
  return 'plans.cta.startRecommended';
}

  return 'plans.cta.startPaid';
};

const planCtaClasses = (plan) => {
  const base = ['btn', 'btn-primary', 'btn-sm', 'plan-card__cta'];
 if (!plan.isFree && plan.code !== recommendedIndividualCode.value) {
  base.push('btn-outline');
}

  return base.join(' ');
};

// format prix en € à partir des cents
const formatPrice = (cents) => {
  if (!cents || cents <= 0) return t('plans.price.free');
  const euros = (cents / 100).toFixed(2);
  return t('plans.price.paid', { amount: euros });
};
</script>


<style scoped>
.plans-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
}

.plans-header__text {
  max-width: 720px;
}

.plans-header__hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.plans-toggle {
  display: inline-flex;
  padding: 0.25rem;
  border-radius: 999px;
  background: var(--color-surface-elevated, #0f172a);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.35);
  gap: 0.25rem;
}

.plans-toggle__btn {
  border: none;
  background: transparent;
  color: #e5e7eb;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease;
}

.plans-toggle__btn i {
  font-size: 0.9rem;
}

.plans-toggle__btn--active {
  background: #ffffff;
  color: #0f172a;
  transform: translateY(-1px);
}

.plans-toggle__badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  color: #bfdbfe;
}

.plans-loading {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.plans-skeleton {
  border-radius: 1rem;
  padding: 1.25rem;
  background: var(--color-surface, #020617);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.5);
}

.plans-skeleton__header,
.plans-skeleton__line {
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.15),
    rgba(148, 163, 184, 0.35),
    rgba(148, 163, 184, 0.15)
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.plans-skeleton__header {
  height: 1.2rem;
  width: 40%;
  margin-bottom: 0.9rem;
}

.plans-skeleton__line {
  height: 0.85rem;
  width: 65%;
  margin-bottom: 0.4rem;
}

.plans-skeleton__line--wide {
  width: 90%;
}

@keyframes shimmer {
  0% { background-position: 0% 0; }
  100% { background-position: -200% 0; }
}

.plans-error {
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.plans-error__text {
  margin: 0;
  font-size: 0.9rem;
}

.plans-sections {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.plans-section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.plans-section__header {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.plans-section__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.plans-section__hint {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.plans-pro-header {
  margin-top: var(--space-2);
  margin-bottom: var(--space-2);
}

.plans-pro-header__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.plans-pro-header__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.plans-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.plan-card {
  position: relative;
  overflow: hidden;
  border-radius: 1.25rem;
  background: var(--color-surface, #020617);
  box-shadow: 0 24px 55px rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.plan-card--highlight {
  border-color: rgba(56, 189, 248, 0.9);
  box-shadow: 0 28px 70px rgba(8, 47, 73, 0.9);
}

.plan-card--free {
  border-style: dashed;
}

.plan-card--pro {
  opacity: 0.95;
}

.plan-card--memorial {
  border-style: solid;
  border-color: rgba(234, 179, 8, 0.7);
}

.plan-card__body {
  padding: 1.4rem 1.4rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.plan-card__titles {
  max-width: 70%;
}

.plan-card__eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9ca3af;
}

.plan-card__eyebrow--accent {
  color: #22d3ee;
}

.plan-card__title {
  margin: 0 0 0.2rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.plan-card__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.plan-card__price {
  text-align: right;
}

.plan-card__price-main {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
}

.plan-card__price-helper {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.plan-card__features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.plan-card__feature {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.9rem;
}

.plan-card__feature-icon {
  margin-top: 0.12rem;
  font-size: 0.9rem;
  color: #38bdf8;
}

.plan-card__feature-text {
  display: block;
  color: var(--color-text-soft);
  font-weight: 400;
}

.plan-card__note {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.plan-card__note--accent {
  color: #38bdf8;
}

.plan-card__footer {
  padding: 0.9rem 1.4rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.plan-card__cta {
  align-self: flex-start;
}

.plan-card__legal {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}

@media (min-width: 768px) {
  .plans-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .plans-grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
}
.plan-card__titles{
  flex: 1;
  min-width: 0;              /* clé anti overflow en flex */
  max-width: none;
  overflow-wrap: anywhere;   /* casse proprement les longs textes */
}

.plan-card__price{
  flex-shrink: 0;            /* évite que le prix “pousse” le titre hors cadre */
  text-align: right;
}

</style>
