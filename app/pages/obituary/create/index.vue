<!-- pages/obituaries/create/index.vue -->
<template>
  <main class="app-main fade-in">
    <!-- Barre de nav réutilisable -->
    <PageNavBar
      aria-label="Navigation création d'annonce"
      :show-back-home="true"
      :show-back-list="true"
      back-list-to="/obituaries"
      :show-create="false"
    />

    <section class="section">
      <div class="section-header">
        <h1 class="section-title">
          {{ t('createObituary.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('createObituary.subtitle') }}
        </p>
      </div>

      <form class="card form" @submit.prevent="onSubmit">
        <div class="card-body form-body">
          <!-- Bloc 1 : Infos défunt -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.deceased.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ t('createObituary.sections.deceased.subtitle') }}
            </p>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="fullName">
                  {{ t('createObituary.fields.deceasedFullName.label') }}
                </label>
                <input
                  id="fullName"
                  v-model.trim="form.deceasedFullName"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.deceasedFullName.placeholder')"
                  :aria-invalid="errors.deceasedFullName ? 'true' : 'false'"
                />
                <p v-if="errors.deceasedFullName" class="form-error">
                  {{ errors.deceasedFullName }}
                </p>
              </div>
            </div>

            <div class="form-row form-row-inline">
              <div class="form-field">
                <label class="form-label" for="dateOfDeath">
                  {{ t('createObituary.fields.dateOfDeath.label') }}
                </label>
                <input
                  id="dateOfDeath"
                  v-model="form.dateOfDeath"
                  class="form-control"
                  type="date"
                />
                <p class="form-hint">
                  {{ t('createObituary.fields.dateOfDeath.hint') }}
                </p>
              </div>

              <div class="form-field">
                <label class="form-label" for="ageDisplay">
                  {{ t('createObituary.fields.ageDisplay.label') }}
                </label>
                <input
                  id="ageDisplay"
                  v-model.trim="form.ageDisplay"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.ageDisplay.placeholder')"
                />
                <p class="form-hint">
                  {{ t('createObituary.fields.ageDisplay.hint') }}
                </p>
              </div>
            </div>

            <div class="form-row form-row-inline">
              <div class="form-field">
                <label class="form-label" for="city">
                  {{ t('createObituary.fields.city.label') }}
                </label>
                <input
                  id="city"
                  v-model.trim="form.city"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.city.placeholder')"
                />
              </div>

              <div class="form-field">
                <label class="form-label" for="region">
                  {{ t('createObituary.fields.region.label') }}
                </label>
                <input
                  id="region"
                  v-model.trim="form.region"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.region.placeholder')"
                />
              </div>
            </div>

            <div class="form-row form-row-inline">
              <div class="form-field">
                <label class="form-label" for="country">
                  {{ t('createObituary.fields.country.label') }}
                </label>
                <input
                  id="country"
                  v-model.trim="form.country"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.country.placeholder')"
                />
              </div>

              <div class="form-field">
                <label class="form-label" for="countryCode">
                  {{ t('createObituary.fields.countryCode.label') }}
                </label>
                <input
                  id="countryCode"
                  v-model.trim="form.countryCode"
                  class="form-control"
                  type="text"
                  maxlength="2"
                  :placeholder="t('createObituary.fields.countryCode.placeholder')"
                />
                <p class="form-hint">
                  {{ t('createObituary.fields.countryCode.hint') }}
                </p>
              </div>
            </div>
          </section>

          <!-- Bloc 2 : Texte de l'annonce -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.content.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ t('createObituary.sections.content.subtitle') }}
            </p>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="title">
                  {{ t('createObituary.fields.title.label') }}
                </label>
                <input
                  id="title"
                  v-model.trim="form.title"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.title.placeholder')"
                  :aria-invalid="errors.title ? 'true' : 'false'"
                />
                <p v-if="errors.title" class="form-error">
                  {{ errors.title }}
                </p>
                <p class="form-hint">
                  {{ t('createObituary.fields.title.hint') }}
                </p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="body">
                  {{ t('createObituary.fields.body.label') }}
                </label>
                <textarea
                  id="body"
                  v-model.trim="form.body"
                  class="form-control"
                  rows="8"
                  :placeholder="t('createObituary.fields.body.placeholder')"
                  :aria-invalid="errors.body ? 'true' : 'false'"
                ></textarea>
                <p v-if="errors.body" class="form-error">
                  {{ errors.body }}
                </p>
                <p class="form-hint">
                  {{ t('createObituary.fields.body.hint') }}
                </p>
              </div>
            </div>
          </section>

          <!-- Bloc 3 : Événement principal (obligatoire pour l'API) -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.mainEvent.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ t('createObituary.sections.mainEvent.subtitle') }}
            </p>

            <div class="form-row form-row-inline">
              <div class="form-field">
                <label class="form-label" for="eventType">
                  {{ t('createObituary.fields.eventType.label') }}
                </label>
                <select
                  id="eventType"
                  v-model="form.event.eventType"
                  class="form-control"
                >
                  <option value="funeral">
                    {{ t('home.eventTypes.funeral') }}
                  </option>
                  <option value="wake">
                    {{ t('home.eventTypes.wake') }}
                  </option>
                  <option value="burial">
                    {{ t('home.eventTypes.burial') }}
                  </option>
                  <option value="memorial">
                    {{ t('home.eventTypes.memorial') }}
                  </option>
                </select>
              </div>

              <div class="form-field">
                <label class="form-label" for="eventStartsAt">
                  {{ t('createObituary.fields.eventStartsAt.label') }}
                </label>
                <input
                  id="eventStartsAt"
                  v-model="form.event.startsAt"
                  class="form-control"
                  type="datetime-local"
                  :aria-invalid="errors.eventStartsAt ? 'true' : 'false'"
                />
                <p v-if="errors.eventStartsAt" class="form-error">
                  {{ errors.eventStartsAt }}
                </p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="eventVenueName">
                  {{ t('createObituary.fields.eventVenueName.label') }}
                </label>
                <input
                  id="eventVenueName"
                  v-model.trim="form.event.venueName"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.eventVenueName.placeholder')"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="eventVenueAddress">
                  {{ t('createObituary.fields.eventVenueAddress.label') }}
                </label>
                <input
                  id="eventVenueAddress"
                  v-model.trim="form.event.venueAddress"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.eventVenueAddress.placeholder')"
                />
              </div>
            </div>
          </section>

          <!-- Bloc 4 : Photo & publication (gratuit) -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.publish.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ t('createObituary.sections.publish.subtitleFree', { days: FREE_PLAN_DURATION_DAYS }) }}
            </p>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="coverImageUrl">
                  {{ t('createObituary.fields.coverImageUrl.label') }}
                </label>
                <input
                  id="coverImageUrl"
                  v-model.trim="form.coverImageUrl"
                  class="form-control"
                  type="url"
                  :placeholder="t('createObituary.fields.coverImageUrl.placeholder')"
                />
                <p class="form-hint">
                  {{ t('createObituary.fields.coverImageUrl.hint') }}
                </p>
              </div>
            </div>

            <div class="form-row">
              <p class="text-xs text-soft">
                {{ t('createObituary.sections.publish.legal') }}
              </p>
            </div>
          </section>
        </div>

        <div class="card-footer card-footer--actions">
          <NuxtLink
            to="/obituaries"
            class="btn btn-ghost btn-sm"
            type="button"
          >
            {{ t('createObituary.actions.cancel') }}
          </NuxtLink>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">
              {{ t('createObituary.actions.submitting') }}
            </span>
            <span v-else>
              {{ t('createObituary.actions.submit') }}
            </span>
          </button>
        </div>

        <div
          v-if="submitError"
          class="card-footer card-footer--error"
        >
          <p class="form-error">
            {{ submitError }}
          </p>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import { useRouter, useSeoMeta } from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';

const FREE_PLAN_DURATION_DAYS = 5;

const { t, locale } = useI18n();
const router = useRouter();

const form = reactive({
  deceasedFullName: '',
  dateOfDeath: '',
  ageDisplay: '',
  city: '',
  region: '',
  country: '',
  countryCode: '',
  title: '',
  body: '',
  coverImageUrl: '',
  event: {
    eventType: 'funeral',
    startsAt: '',
    venueName: '',
    venueAddress: '',
  },
});

const errors = reactive({
  deceasedFullName: '',
  title: '',
  body: '',
  eventStartsAt: '',
});

const isSubmitting = ref(false);
const submitError = ref('');

// SEO
const seoTitle = computed(() => t('createObituary.meta.title'));
const seoDescription = computed(() => t('createObituary.meta.description'));

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
});

// Auto-suggérer le titre à partir du nom si vide
watch(
  () => form.deceasedFullName,
  (name) => {
    if (!name) return;
    if (!form.title || form.title.startsWith('Annonce de décès')) {
      form.title = t('share.obituary.titlePattern', { name });
    }
  }
);

const validate = () => {
  errors.deceasedFullName = '';
  errors.title = '';
  errors.body = '';
  errors.eventStartsAt = '';
  submitError.value = '';

  if (!form.deceasedFullName) {
    errors.deceasedFullName = t('createObituary.errors.deceasedFullNameRequired');
  }
  if (!form.title) {
    errors.title = t('createObituary.errors.titleRequired');
  }
  if (!form.body || form.body.length < 40) {
    errors.body = t('createObituary.errors.bodyTooShort');
  }
  if (!form.event.startsAt) {
    errors.eventStartsAt = t('createObituary.errors.eventStartsAtRequired');
  }

  return !errors.deceasedFullName && !errors.title && !errors.body && !errors.eventStartsAt;
};

const buildPayload = () => {
  // On envoie exactement ce que l'API attend (index.post.js)
  return {
    deceasedFullName: form.deceasedFullName,
    deceasedGivenNames: null,
    deceasedFamilyNames: null,
    identityStatus: 'known',
    deceasedGender: null,
    dateOfBirth: null,
    dateOfDeath: form.dateOfDeath || null,
    ageDisplay: form.ageDisplay || null,
    religion: null,
    denomination: null,

    title: form.title,
    content: form.body,
    mainLanguage: locale.value || 'fr',

    city: form.city || null,
    region: form.region || null,
    country: form.country || null,
    countryCode: form.countryCode || null,
    isRuralArea: false,

    familyContactName: null,
    familyContactPhone: null,
    familyContactWhatsapp: null,
    familyContactEmail: null,

    isFree: true,
    pricingTier: 'free_basic',
    currency: null,
    amountPaid: null,
    publishDurationDays: FREE_PLAN_DURATION_DAYS,
    paymentProvider: null,
    paymentReference: null,

    // Un seul événement principal (obligatoire)
    events: [
      {
        eventType: form.event.eventType || 'funeral',
        title: form.title,
        description: null,
        startsAt: form.event.startsAt,
        endsAt: null,
        timezone: null,
        venueName: form.event.venueName || null,
        venueAddress: form.event.venueAddress || null,
        city: form.city || null,
        region: form.region || null,
        country: form.country || null,
        countryCode: form.countryCode || null,
        isMainEvent: true,
      },
    ],

    // Pas de contacts détaillés pour le MVP
    contacts: [],

    // photo principale free plan
    coverImageUrl: form.coverImageUrl || null,
  };
};

const onSubmit = async () => {
  if (isSubmitting.value) return;
  if (!validate()) return;

  isSubmitting.value = true;
  submitError.value = '';

  const payload = buildPayload();

  try {
    const res = await $fetch('/api/obituaries', {
      method: 'POST',
      body: payload,
    });

    const slug = res?.slug;
    if (slug) {
      await router.push(`/obituary/${slug}`);
    } else {
      await router.push('/obituaries');
    }
  } catch (err) {
    console.error('Create obituary failed', err);
    submitError.value =
      t('createObituary.errors.submitFailed') ||
      'Une erreur est survenue lors de la création de l’annonce.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.form-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-section {
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--space-4);
}
.form-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.form-section__title {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
}

.form-section__subtitle {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

/* Errors / footer */
.form-error {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-danger, #dc2626);
}

.card-footer--actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.card-footer--error {
  border-top: 1px solid var(--color-border-subtle);
  background: rgba(220, 38, 38, 0.04);
}
</style>
