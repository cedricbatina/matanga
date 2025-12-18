<!-- pages/obituary/edit/[slug].vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation édition d'annonce"
      :show-back-home="true"
      :show-back-list="true"
      back-list-to="/obituaries"
      :show-create="false"
    />

    <section class="section">
      <!-- Header -->
      <header class="section-header">
        <h1 class="section-title">
          {{ t('editObituary.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('editObituary.subtitle') }}
        </p>
      </header>

      <!-- Loading / error -->
      <div
        v-if="pending"
        class="edit-loading"
      >
        <div class="edit-skeleton" />
        <div class="edit-skeleton" />
      </div>

      <div
        v-else-if="error"
        class="edit-error"
        role="alert"
        aria-live="polite"
      >
        <p class="edit-error__text">
          {{ resolveErrorMessage(error) }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('editObituary.actions.retry') }}
        </button>
      </div>

      <!-- Formulaire d'édition -->
      <form
        v-else
        class="card edit-card"
        @submit.prevent="onSubmit"
      >
        <div class="card-body edit-body">
          <!-- Bloc défunt -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.deceased.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ t('createObituary.sections.deceased.subtitle') }}
            </p>

            <!-- Nom complet -->
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
                <p
                  v-if="errors.deceasedFullName"
                  class="form-error"
                >
                  {{ errors.deceasedFullName }}
                </p>
              </div>
            </div>

            <!-- Dates naissance / décès + âge -->
            <div class="form-grid-3-col">
              <div class="form-field">
                <label class="form-label" for="dob">
                  {{ t('createObituary.fields.dateOfBirth.label') }}
                </label>
                <input
                  id="dob"
                  v-model="form.dateOfBirth"
                  class="form-control"
                  type="date"
                />
              </div>

              <div class="form-field">
                <label class="form-label" for="dod">
                  {{ t('createObituary.fields.dateOfDeath.label') }}
                </label>
                <input
                  id="dod"
                  v-model="form.dateOfDeath"
                  class="form-control"
                  type="date"
                />
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
              </div>
            </div>

            <!-- Genre / identité / religion -->
            <div class="form-grid-3-col">
              <div class="form-field">
                <label class="form-label" for="gender">
                  {{ t('createObituary.fields.gender.label') }}
                </label>
                <select
                  id="gender"
                  v-model="form.gender"
                  class="form-control"
                >
                  <option value="">
                    {{ t('common.selectPlaceholder') }}
                  </option>
                  <option value="male">
                    {{ t('createObituary.fields.gender.options.male') }}
                  </option>
                  <option value="female">
                    {{ t('createObituary.fields.gender.options.female') }}
                  </option>
                </select>
              </div>

              <div class="form-field">
                <label class="form-label" for="identityStatus">
                  {{ t('createObituary.fields.identityStatus.label') }}
                </label>
                <select
                  id="identityStatus"
                  v-model="form.identityStatus"
                  class="form-control"
                >
                  <option value="known">
                    {{ t('createObituary.fields.identityStatus.options.known') }}
                  </option>
                  <option value="partial">
                    {{ t('createObituary.fields.identityStatus.options.partial') }}
                  </option>
                  <option value="unknown">
                    {{ t('createObituary.fields.identityStatus.options.unknown') }}
                  </option>
                </select>
              </div>

              <div class="form-field">
                <label class="form-label" for="religion">
                  {{ t('createObituary.fields.religion.label') }}
                </label>
                <select
                  id="religion"
                  v-model="form.religion"
                  class="form-control"
                >
                  <option value="">
                    {{ t('createObituary.fields.religion.options.none') }}
                  </option>
                  <option value="christian">
                    {{ t('createObituary.fields.religion.options.christian') }}
                  </option>
                  <option value="muslim">
                    {{ t('createObituary.fields.religion.options.muslim') }}
                  </option>
                  <option value="other">
                    {{ t('createObituary.fields.religion.options.other') }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="denomination">
                  {{ t('createObituary.fields.denomination.label') }}
                </label>
                <input
                  id="denomination"
                  v-model.trim="form.denomination"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.denomination.placeholder')"
                />
              </div>
            </div>

            <!-- Localisation -->
            <div class="form-grid-4-col">
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
                  :placeholder="t('createObituary.fields.countryCode.placeholder')"
                />
              </div>
            </div>

            <div class="form-row">
              <label class="form-checkbox">
                <input
                  v-model="form.isRuralArea"
                  type="checkbox"
                />
                <span>
                  {{ t('createObituary.fields.isRuralArea.label') }}
                </span>
              </label>
            </div>
          </section>
            <!-- Bloc image de couverture -->
            <section
              v-if="coverImageUrl"
              class="review-section"
            >
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.coverImage.title', 'Image de couverture') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.coverImage.subtitle', 'Cette image sera affichée en haut de la page publique.') }}
              </p>

              <img
                :src="coverImageUrl"
                alt="Image de couverture"
                class="review-cover-image"
              />
            </section>

          <!-- Bloc texte annonce -->
                <!-- Bloc texte annonce -->
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
                <p
                  v-if="errors.title"
                  class="form-error"
                >
                  {{ errors.title }}
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
                  class="form-control form-control--textarea"
                  rows="6"
                  :placeholder="t('createObituary.fields.body.placeholder')"
                  :aria-invalid="errors.body ? 'true' : 'false'"
                />
                <p
                  v-if="errors.body"
                  class="form-error"
                >
                  {{ errors.body }}
                </p>
              </div>
            </div>

            <!-- 👇 Nouveau bloc image de couverture -->
            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="coverImageUrl">
                  Image de couverture (URL)
                </label>
                <input
                  id="coverImageUrl"
                  v-model.trim="form.coverImageUrl"
                  class="form-control"
                  type="url"
                  placeholder="https://…"
                />
                <p class="form-section__subtitle" style="margin-top: 0.25rem;">
                  Optionnel. Utilisée comme image principale sur la page publique.
                </p>

                <div
                  v-if="form.coverImageUrl"
                  style="margin-top: 0.5rem;"
                >
                  <p class="form-section__subtitle" style="margin-bottom: 0.25rem;">
                    Aperçu :
                  </p>
                  <img
                    :src="form.coverImageUrl"
                    alt="Aperçu de l'image de couverture"
                    style="max-width: 280px; max-height: 180px; border-radius: 0.5rem; display: block;"
                  />
                </div>
              </div>
            </div>
          </section>


          <!-- Bloc événement principal -->
          <section class="form-section">
  <h2 class="form-section__title">
    {{ t('createObituary.sections.mainEvent.title') }}
  </h2>
  <p class="form-section__subtitle">
    {{ t('createObituary.sections.mainEvent.subtitle') }}
  </p>

  <div class="form-grid-2-col">
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
      <p
        v-if="errors.eventStartsAt"
        class="form-error"
      >
        {{ errors.eventStartsAt }}
      </p>
    </div>
  </div>

  <div class="form-row">
    <div class="form-field">
      <label class="form-label" for="venueName">
        {{ t('createObituary.fields.eventVenueName.label') }}
      </label>
      <input
        id="venueName"
        v-model.trim="form.event.venueName"
        class="form-control"
        type="text"
        :placeholder="t('createObituary.fields.eventVenueName.placeholder')"
      />
    </div>
  </div>

  <div class="form-row">
    <div class="form-field">
      <label class="form-label" for="venueAddress">
        {{ t('createObituary.fields.eventVenueAddress.label') }}
      </label>
      <input
        id="venueAddress"
        v-model.trim="form.event.venueAddress"
        class="form-control"
        type="text"
        :placeholder="t('createObituary.fields.eventVenueAddress.placeholder')"
      />
    </div>
  </div>
</section>


          <!-- Bloc contact famille -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.familyContact.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ t('createObituary.sections.familyContact.subtitle') }}
            </p>

            <div class="form-grid-2-col">
              <div class="form-field">
                <label class="form-label" for="contactName">
                  {{ t('createObituary.fields.familyContactName.label') }}
                </label>
                <input
                  id="contactName"
                  v-model.trim="form.familyContact.name"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.familyContactName.placeholder')"
                />
              </div>

              <div class="form-field">
                <label class="form-label" for="contactPhone">
                  {{ t('createObituary.fields.familyContactPhone.label') }}
                </label>
                <input
                  id="contactPhone"
                  v-model.trim="form.familyContact.phone"
                  class="form-control"
                  type="tel"
                  :placeholder="t('createObituary.fields.familyContactPhone.placeholder')"
                />
              </div>
            </div>

            <div class="form-grid-2-col">
              <div class="form-field">
                <label class="form-label" for="contactWhatsapp">
                  {{ t('createObituary.fields.familyContactWhatsapp.label') }}
                </label>
                <input
                  id="contactWhatsapp"
                  v-model.trim="form.familyContact.whatsapp"
                  class="form-control"
                  type="tel"
                  :placeholder="t('createObituary.fields.familyContactWhatsapp.placeholder')"
                />
              </div>

              <div class="form-field">
                <label class="form-label" for="contactEmail">
                  {{ t('createObituary.fields.familyContactEmail.label') }}
                </label>
                <input
                  id="contactEmail"
                  v-model.trim="form.familyContact.email"
                  class="form-control"
                  type="email"
                  :placeholder="t('createObituary.fields.familyContactEmail.placeholder')"
                />
              </div>
            </div>
          </section>
        </div>

        <!-- Footer actions -->
      <div class="card-footer edit-footer">
  <button
    type="button"
    class="btn btn-ghost"
    @click="goBackToConfirm"
  >
    {{ t('editObituary.actions.cancel') }}
  </button>

  <!-- Nouveau bouton supprimer -->
  <button
    type="button"
    class="btn btn-ghost"
    @click="onDeleteFromEdit"
  >
    {{ t('editObituary.actions.delete') }}
  </button>

  <button
    type="submit"
    class="btn btn-primary"
    :disabled="isSubmitting"
  >
    <span v-if="isSubmitting">
      {{ t('editObituary.actions.saving') }}
    </span>
    <span v-else>
      {{ t('editObituary.actions.save') }}
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
definePageMeta({
  middleware: ['auth'],
});

import { reactive, ref, computed, watch } from 'vue';
import { useRoute, useRouter, useSeoMeta, useFetch, useNuxtApp } from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';
import { useDateUtils } from '~/composables/useDateUtils';
import { useConfirmStore } from '~/stores/confirmStore'; // 👈 NEW
const {
  toDateInput,
  toDateTimeLocalInput,
  normalizeDateTimeLocal,
} = useDateUtils();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;
const confirmStore = useConfirmStore(); // 👈 NEW


const slug = computed(() => route.params.slug);

// Chargement de l'annonce existante (accès restreint owner / admin / moderator côté API)
const {
  data,
  pending,
  error,
  refresh,
} = await useFetch(() => `/api/obituaries/${slug.value}`, {
  key: () => `obituary-edit-${slug.value}`,
});

// On extrait l'obituary + events/contacts de la réponse { ok, obituary, events, contacts, media }
const obituaryPayload = computed(() => data.value || null);
const obituary = computed(() => obituaryPayload.value?.obituary || null);
const events = computed(() => obituaryPayload.value?.events || []);
const contacts = computed(() => obituaryPayload.value?.contacts || []);

// SEO
// SEO
const seoTitle = computed(() => {
  const base = t('editObituary.meta.title');
  // selon tes données, c'est plutôt deceased.fullName côté public,
  // mais ici on a un champ flat deceasedFullName sur l'obituary
  const name =
    obituary.value?.deceasedFullName ||
    obituary.value?.deceased?.fullName ||
    '';
  return name ? `${base} – ${name}` : base;
});

const seoDescription = computed(() => {
  const o = obituary.value;
  if (!o) {
    return t('editObituary.meta.description') || '';
  }

  let raw = '';

  // 1) content string directe
  if (typeof o.content === 'string') {
    raw = o.content;
  }
  // 2) content objet avec body / bodyText
  else if (o.content && typeof o.content === 'object') {
    if (typeof o.content.body === 'string') raw = o.content.body;
    else if (typeof o.content.bodyText === 'string')
      raw = o.content.bodyText;
  }

  // 3) fallback sur body à plat si jamais
  if (!raw && typeof o.body === 'string') {
    raw = o.body;
  }

  if (!raw) {
    return t('editObituary.meta.description') || '';
  }

  return raw.slice(0, 160);
});

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
});


// --- FORM STATE ---
const form = reactive({
  deceasedFullName: '',
  dateOfBirth: '',
  dateOfDeath: '',
  ageDisplay: '',
  gender: '',
  identityStatus: 'known',
  religion: '',
  denomination: '',
  city: '',
  region: '',
  country: '',
  countryCode: '',
  isRuralArea: false,

  title: '',
  body: '',
  mainLanguage: '',
  // 👇 NEW
  coverImageUrl: '',
  event: {
    eventType: 'funeral',
    startsAt: '',
    venueName: '',
    venueAddress: '',
  },

  familyContact: {
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
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

// Helpers datetime : backend <-> input[type=datetime-local]


watch(
  obituary,
  (val) => {
    if (!val) return;

    // --- Bloc défunt ---
    const d = val.deceased || {};

    form.deceasedFullName =
      d.fullName || val.deceasedFullName || '';

    form.dateOfBirth = toDateInput(
      d.dateOfBirth || val.dateOfBirth || ''
    );
    form.dateOfDeath = toDateInput(
      d.dateOfDeath || val.dateOfDeath || ''
    );

    form.ageDisplay = d.ageDisplay || val.ageDisplay || '';
    form.gender =
      d.gender || d.deceasedGender || val.deceasedGender || '';
    form.identityStatus =
      d.identityStatus || val.identityStatus || 'known';
    form.religion = d.religion || val.religion || '';
    form.denomination = d.denomination || val.denomination || '';

    // --- Localisation ---
    const loc = val.location || {};
    form.city = loc.city || val.city || '';
    form.region = loc.region || val.region || '';
    form.country = loc.country || val.country || '';
    form.countryCode = loc.countryCode || val.countryCode || '';
    form.isRuralArea =
      loc.isRuralArea ?? val.isRuralArea ?? false;

    // --- Contenu / texte ---
    const content = val.content || {};
    form.title = content.title || val.title || '';

    let bodyText = '';
    if (typeof content.body === 'string') {
      bodyText = content.body;
    } else if (typeof content.bodyText === 'string') {
      bodyText = content.bodyText;
    } else if (typeof val.body === 'string') {
      bodyText = val.body;
    }
    form.body = bodyText;

    form.mainLanguage =
      content.mainLanguage || val.mainLanguage || '';

    // --- Image de couverture (si tu l’utilises) ---
    form.coverImageUrl = val.coverImageUrl || '';

    // --- Événement principal ---
    const mainEvent =
      events.value.find((ev) => ev.isMainEvent) ||
      events.value[0] ||
      null;

    if (mainEvent) {
      form.event.eventType = mainEvent.eventType || 'funeral';
      form.event.startsAt = mainEvent.startsAt
        ? toDateTimeLocalInput(mainEvent.startsAt)
        : '';
      form.event.venueName = mainEvent.venueName || '';
      form.event.venueAddress = mainEvent.venueAddress || '';
    } else {
      form.event.eventType = 'funeral';
      form.event.startsAt = '';
      form.event.venueName = '';
      form.event.venueAddress = '';
    }

    // --- Contact principal ---
    const primaryContact =
      contacts.value.find((c) => c.isPrimary) ||
      contacts.value[0] ||
      null;

    if (primaryContact) {
      form.familyContact.name =
        primaryContact.name || primaryContact.label || '';
      form.familyContact.phone = primaryContact.phone || '';
      form.familyContact.whatsapp =
        primaryContact.whatsappNumber || '';
      form.familyContact.email = primaryContact.email || '';
    } else {
      form.familyContact.name = '';
      form.familyContact.phone = '';
      form.familyContact.whatsapp = '';
      form.familyContact.email = '';
    }
  },
  { immediate: true }
);



// Validation minimale (mêmes règles que création pour les champs clés)
const validate = () => {
  errors.deceasedFullName = '';
  errors.title = '';
  errors.body = '';
  errors.eventStartsAt = '';
  submitError.value = '';

  if (!form.deceasedFullName) {
    errors.deceasedFullName = t(
      'createObituary.errors.deceasedFullNameRequired',
    );
  }

  if (!form.title || form.title.length < 8) {
    errors.title = t('createObituary.errors.titleRequired');
  }

  if (!form.body || form.body.length < 40) {
    errors.body = t('createObituary.errors.bodyTooShort');
  }

  if (!form.event.startsAt) {
    errors.eventStartsAt = t(
      'createObituary.errors.eventStartsAtRequired',
    );
  }

  return (
    !errors.deceasedFullName &&
    !errors.title &&
    !errors.body &&
    !errors.eventStartsAt
  );
};

const buildPayload = () => {
  // On ne touche pas à la monétisation / plan ici : on ne renvoie que les champs éditables
  const eventsPayload = [
    {
      eventType: form.event.eventType || 'funeral',
      title: form.title || null,
      description: null,
      startsAt: normalizeDateTimeLocal(form.event.startsAt),
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
  ];

  const hasContact =
    form.familyContact.name ||
    form.familyContact.phone ||
    form.familyContact.whatsapp ||
    form.familyContact.email;

  const contactsPayload = hasContact
    ? [
        {
          label: t('createObituary.defaults.familyContactLabel'),
          name: form.familyContact.name || null,
          phone: form.familyContact.phone || null,
          whatsappNumber: form.familyContact.whatsapp || null,
          email: form.familyContact.email || null,
          isPublic: true,
          isPrimary: true,
        },
      ]
    : [];

   return {
    deceasedFullName: form.deceasedFullName || undefined,
    identityStatus: form.identityStatus || undefined,
    deceasedGender: form.gender || undefined,
    dateOfBirth: form.dateOfBirth || undefined,
    dateOfDeath: form.dateOfDeath || undefined,
    ageDisplay: form.ageDisplay || undefined,
    religion: form.religion || undefined,
    denomination: form.denomination || undefined,

    title: form.title || undefined,
    content: form.body || undefined,
    mainLanguage: form.mainLanguage || undefined,

    city: form.city || undefined,
    region: form.region || undefined,
    country: form.country || undefined,
    countryCode: form.countryCode || undefined,
    isRuralArea: form.isRuralArea,

    // 👇 NEW
    coverImageUrl: form.coverImageUrl || undefined,

    events: eventsPayload,
    contacts: contactsPayload,

    regenSlug: false,
  };
};



const resolveErrorMessage = (err) => {
  const status = err?.statusCode || err?.status;
  if (status === 404) {
    return t('editObituary.errors.notFound');
  }
  if (status === 403) {
    return t('editObituary.errors.forbidden');
  }
  return t('editObituary.errors.generic');
};

const goBackToConfirm = () => {
  router.push(`/obituary/confirm/${slug.value}`);
};

const onSubmit = async () => {
  if (isSubmitting.value) return;
  if (!validate()) return;

  isSubmitting.value = true;
  submitError.value = '';

  const payload = buildPayload();

  try {
    await $fetch(`/api/obituaries/${slug.value}`, {
      method: 'PUT',
      body: payload,
    });

    if (toast?.success) {
      toast.success(t('editObituary.toasts.updated'));
    }

    // Retour vers la page de confirmation
    await router.push(`/obituary/confirm/${slug.value}`);
  } catch (err) {
    const fieldErrors = err?.data?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      if (fieldErrors.deceasedFullName) {
        errors.deceasedFullName = fieldErrors.deceasedFullName;
      }
      if (fieldErrors.title) {
        errors.title = fieldErrors.title;
      }
      if (fieldErrors.content) {
        errors.body = fieldErrors.content;
      }
    } else {
      submitError.value =
        err?.data?.message ||
        err?.message ||
        t('editObituary.errors.generic');

      if (toast?.error) {
        toast.error(submitError.value);
      }
    }
  } finally {
    isSubmitting.value = false;
  }
};
const onDeleteFromEdit = async () => {
  if (!obituary.value) return;

  const confirmed = await confirmStore.ask({
    title: t('obituaryDelete.confirmTitle', {
      name:
        obituary.value?.deceasedFullName ||
        obituary.value?.deceased?.fullName ||
        '',
    }),
    message: t('obituaryDelete.confirmMessage'),
    confirmLabel: t('obituaryDelete.confirmLabel'),
    cancelLabel: t('obituaryDelete.cancelLabel'),
    danger: true,
  });

  if (!confirmed) return;

  try {
    await $fetch(`/api/obituaries/${slug.value}`, {
      method: 'DELETE',
    });

    if (toast?.success) {
      toast.success(t('obituaryDelete.toasts.archived'));
    }

    await router.push('/obituaries');
  } catch (err) {
    const msg =
      err?.data?.message ||
      err?.message ||
      t('obituaryDelete.toasts.error');

    if (toast?.error) {
      toast.error(msg);
    } else {
      console.error('Delete obituary failed', err);
    }
  }
};

</script>

<style scoped>
.edit-card {
  margin-top: var(--space-3);
}

.edit-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Sections */
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

/* Grilles */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.form-grid-2-col,
.form-grid-3-col,
.form-grid-4-col {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.form-grid-2-col {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.form-grid-3-col {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
.form-grid-4-col {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

/* Champs */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface-elevated);
  font-size: 0.92rem;
}
.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.form-control--textarea {
  resize: vertical;
  min-height: 5rem;
}

/* Aides / erreurs */
.form-error {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: var(--color-danger);
}

.form-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
}

/* Footer */
.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Loading / error */
.edit-loading {
  display: grid;
  gap: 0.9rem;
}

.edit-skeleton {
  height: 120px;
  border-radius: 1rem;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.18),
    rgba(148, 163, 184, 0.35),
    rgba(148, 163, 184, 0.18)
  );
  background-size: 200% 100%;
  animation: shimmer 1.3s infinite;
}

.edit-error {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.edit-error__text {
  margin: 0;
  font-size: 0.9rem;
}

@keyframes shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.card-footer--error {
  border-top: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.04);
}
.review-cover-image {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 0.9rem;
  border: 1px solid var(--color-border-subtle);
}

</style>
