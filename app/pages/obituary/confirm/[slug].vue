<!-- pages/obituary/confirm/[slug].vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation récapitulatif d'annonce"
      :show-back-home="true"
      :show-back-list="true"
      back-list-to="/obituaries"
      :show-create="false"
    />

    <section class="section">
      <!-- Header -->
      <header class="section-header">
        <h1 class="section-title">
          {{ t('obituaryReview.title') }}
        </h1>

        <p class="section-subtitle">
          {{ t('obituaryReview.subtitle') }}
        </p>

        <!-- Info plan -->
        <div
          v-if="planLabel || planPrice"
          class="review-plan-banner"
        >
          <div class="review-plan-banner__top">
            <span class="review-plan-banner__plan">
              {{ planLabel || t('obituaryReview.side.planUnknown') }}
            </span>
            <span class="review-plan-banner__price">
              {{ planPrice }}
            </span>
          </div>
          <p class="review-plan-banner__meta">
            {{ t('obituaryReview.planMeta', { days: effectivePublishDays }) }}
          </p>
        </div>
      </header>

      <!-- Loading / error states -->
      <div v-if="pending" class="review-loading">
        <div class="review-skeleton" />
        <div class="review-skeleton" />
      </div>

      <div
        v-else-if="error"
        class="review-error"
        role="alert"
        aria-live="polite"
      >
        <p class="review-error__text">
          {{ t('obituaryReview.error') }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="refresh"
        >
          {{ t('obituaryReview.retry') }}
        </button>
      </div>

      <!-- Formulaire de confirmation -->
      <form
        v-else-if="obituary"
        class="review-layout"
        @submit.prevent="onConfirm"
      >
        <!-- Colonne principale : contenu de l’annonce -->
        <section
          class="card review-main"
          aria-label="Récapitulatif de l'annonce"
        >
          <div class="card-body review-main__body">
            <!-- Bloc défunt -->
            <section class="review-section">
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.deceased.title') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.deceased.subtitle') }}
              </p>

              <dl class="review-dl">
                <!-- Nom -->
                <div class="review-dl__row">
                  <dt>
                    {{ t('createObituary.fields.deceasedFullName.label') }}
                  </dt>
                  <dd>{{ obituary.deceased?.fullName }}</dd>
                </div>

                <!-- Genre -->
                <div
                  v-if="obituary.deceased?.gender"
                  class="review-dl__row"
                >
                  <dt>{{ t('createObituary.fields.gender.label') }}</dt>
                  <dd>{{ formatGender(obituary.deceased.gender) }}</dd>
                </div>

                <!-- Niveau d’identification -->
                <div
                  v-if="obituary.deceased?.identityStatus"
                  class="review-dl__row"
                >
                  <dt>
                    {{ t('createObituary.fields.identityStatus.label') }}
                  </dt>
                  <dd>
                    {{ formatIdentityStatus(obituary.deceased.identityStatus) }}
                  </dd>
                </div>

                <!-- Dates naissance / décès -->
              <!-- Dates naissance / décès -->
<div
  v-if="
    obituary.deceased?.dateOfBirth ||
    obituary.deceased?.dateOfDeath
  "
  class="review-dl__row"
>
  <dt>{{ t('obituaryReview.fields.dates') }}</dt>
  <dd>
    <span v-if="obituary.deceased?.dateOfBirth">
      {{
        t('obituaryReview.fields.dateOfBirth', {
          date: formatDate(obituary.deceased.dateOfBirth),
        })
      }}
    </span>
    <span
      v-if="
        obituary.deceased?.dateOfBirth &&
        obituary.deceased?.dateOfDeath
      "
    >
      ·
    </span>
    <span v-if="obituary.deceased?.dateOfDeath">
      {{
        t('obituaryReview.fields.dateOfDeath', {
          date: formatDate(obituary.deceased.dateOfDeath),
        })
      }}
    </span>
  </dd>
</div>


                <!-- Âge affiché -->
                <div
                  v-if="obituary.deceased?.ageDisplay"
                  class="review-dl__row"
                >
                  <dt>
                    {{ t('createObituary.fields.ageDisplay.label') }}
                  </dt>
                  <dd>{{ obituary.deceased.ageDisplay }}</dd>
                </div>

                <!-- Religion -->
                <div
                  v-if="
                    obituary.deceased?.religion ||
                    obituary.deceased?.denomination
                  "
                  class="review-dl__row"
                >
                  <dt>{{ t('createObituary.fields.religion.label') }}</dt>
                  <dd>
                    <span v-if="obituary.deceased?.religion">
                      {{ formatReligion(obituary.deceased.religion) }}
                    </span>
                    <span
                      v-if="
                        obituary.deceased?.religion &&
                        obituary.deceased?.denomination
                      "
                    >
                      ·
                    </span>
                    <span v-if="obituary.deceased?.denomination">
                      {{ obituary.deceased.denomination }}
                    </span>
                  </dd>
                </div>

                <!-- Localisation -->
                <div
                  v-if="
                    obituary.location?.city ||
                    obituary.location?.region ||
                    obituary.location?.country
                  "
                  class="review-dl__row"
                >
                  <dt>{{ t('obituaryReview.fields.location') }}</dt>
                  <dd>
                    {{
                      [
                        obituary.location?.city,
                        obituary.location?.region,
                        obituary.location?.country,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    }}
                  </dd>
                </div>

                <!-- Code pays -->
                <div
                  v-if="obituary.location?.countryCode"
                  class="review-dl__row"
                >
                  <dt>{{ t('obituaryReview.fields.countryCode') }}</dt>
                  <dd>{{ obituary.location.countryCode }}</dd>
                </div>

                <!-- Zone rurale / village -->
                <div
                  v-if="
                    obituary.location &&
                    obituary.location.isRuralArea !== undefined
                  "
                  class="review-dl__row"
                >
                  <dt>
                    {{ t('createObituary.fields.isRuralArea.label') }}
                  </dt>
                  <dd>
                    {{
                      obituary.location.isRuralArea
                        ? t('obituaryReview.fields.ruralYes')
                        : t('obituaryReview.fields.ruralNo')
                    }}
                  </dd>
                </div>
              </dl>
            </section>

            <!-- Bloc texte annonce -->
            <section class="review-section">
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.content.title') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.content.subtitle') }}
              </p>

              <h3 class="review-content__title">
                {{ obituary.content?.title }}
              </h3>

              <p class="review-content__body">
                {{ obituary.content?.body }}
              </p>
            </section>

            <!-- Bloc événements -->
            <section class="review-section">
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.events.title') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.events.subtitle') }}
              </p>

              <ul
                v-if="events.length"
                class="review-events"
                aria-label="Liste des événements associés à cette annonce"
              >
                <li
                  v-for="event in events"
                  :key="event.id || event.startsAt || event.venueName"
                  class="review-events__item"
                >
                  <div class="review-events__header">
                    <span class="review-events__type">
                      {{ formatEventType(event.eventType) }}
                    </span>
                    <span
                      v-if="event.isMainEvent"
                      class="review-events__badge"
                    >
                      {{ t('obituaryReview.events.main') }}
                    </span>
                  </div>

                  <p class="review-events__datetime">
                    <span v-if="event.startsAt">
                      {{ formatDateTime(event.startsAt) }}
                    </span>
                    <span v-else>
                      {{ t('obituaryReview.events.datePending') }}
                    </span>
                  </p>

                  <p
                    v-if="event.venueName || event.venueAddress"
                    class="review-events__place"
                  >
                    <strong v-if="event.venueName">
                      {{ event.venueName }}
                    </strong>
                    <br v-if="event.venueName && event.venueAddress" />
                    <span v-if="event.venueAddress">
                      {{ event.venueAddress }}
                    </span>
                  </p>
                </li>
              </ul>

              <p
                v-else
                class="review-empty"
              >
                {{ t('obituaryReview.events.none') }}
              </p>
            </section>

            <!-- Bloc contacts -->
            <section class="review-section">
              <h2 class="review-section__title">
                {{ t('obituaryReview.sections.contacts.title') }}
              </h2>
              <p class="review-section__subtitle">
                {{ t('obituaryReview.sections.contacts.subtitle') }}
              </p>

              <ul
                v-if="contacts.length"
                class="review-contacts"
                aria-label="Contacts famille ou organisation"
              >
                <li
                  v-for="contact in contacts"
                  :key="
                    contact.id ||
                    contact.email ||
                    contact.phone ||
                    contact.name
                  "
                  class="review-contacts__item"
                >
                  <p class="review-contacts__name">
                    <strong>{{ contact.name || contact.label }}</strong>
                    <span v-if="contact.isPrimary">
                      · {{ t('obituaryReview.contacts.primary') }}
                    </span>
                  </p>

                  <ul class="review-contacts__channels">
                    <li v-if="contact.phone">
                      <span>{{ contact.phone }}</span>
                    </li>
                    <li v-if="contact.whatsappNumber">
                      <span>{{ contact.whatsappNumber }}</span>
                    </li>
                    <li v-if="contact.email">
                      <span>{{ contact.email }}</span>
                    </li>
                  </ul>
                </li>
              </ul>

              <p
                v-else
                class="review-empty"
              >
                {{ t('obituaryReview.contacts.none') }}
              </p>
            </section>
          </div>
        </section>
           <!-- Bloc documents justificatifs -->
<section
  class="card review-section review-docs-section"
  aria-label="Documents justificatifs"
>
  <div class="card-body review-docs__body">
    <h2 class="review-section__title">
      {{ t('obituaryReview.sections.documents.title') }}
    </h2>
    <p class="review-section__subtitle">
      {{ t('obituaryReview.sections.documents.subtitle') }}
    </p>

    <!-- État de chargement / erreur des docs -->
    <div v-if="docsPending" class="review-docs__loading">
      <div class="review-docs__skeleton" />
      <div class="review-docs__skeleton" />
    </div>

    <div
      v-else-if="docsError"
      class="review-docs__error"
      role="alert"
    >
      <p class="review-docs__error-text">
        {{ t('obituaryReview.documents.loadError') }}
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-xs"
        @click="refreshDocs"
      >
        {{ t('obituaryReview.documents.reload') }}
      </button>
    </div>

    <!-- Contenu principal -->
    <div v-else class="review-docs">
      <!-- Pièce d’identité -->
      <div class="review-docs__item">
        <div class="review-docs__item-head">
          <div>
            <h3 class="review-docs__item-title">
              {{ t('obituaryReview.documents.idCardTitle') }}
            </h3>
            <p class="review-docs__item-text">
              {{ t('obituaryReview.documents.idCardHelp') }}
            </p>
          </div>

          <span
            v-if="hasIdCardDoc"
            class="review-docs__badge review-docs__badge--ok"
          >
            {{ t('obituaryReview.documents.alreadyUploaded') }}
          </span>
          <span
            v-else
            class="review-docs__badge review-docs__badge--pending"
          >
            {{ t('obituaryReview.documents.missing') }}
          </span>
        </div>

        <div class="review-docs__item-body">
          <!-- Doc déjà présent : lien pour le consulter -->
          <div
            v-if="hasIdCardDoc && idCardDoc && idCardDoc.fileUrl"
            class="review-docs__file-row"
          >
            <i class="fa-regular fa-file" aria-hidden="true"></i>
            <a
              :href="idCardDoc.fileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="review-docs__file-link"
            >
              {{ t('obituaryReview.documents.openFile') }}
            </a>
          </div>

          <!-- Upload -->
          <div v-if="!hasIdCardDoc" class="review-docs__upload">
            <label class="review-docs__upload-label">
              <i class="fa-regular fa-upload" aria-hidden="true"></i>
              <span>
                {{ t('obituaryReview.documents.chooseFile') }}
              </span>
              <input
                type="file"
                class="review-docs__upload-input"
                accept="image/*,application/pdf"
                @change="onSelectIdCard"
              />
            </label>

            <div class="review-docs__upload-footer">
              <span
                v-if="selectedIdCardName"
                class="review-docs__filename"
              >
                {{ selectedIdCardName }}
              </span>
              <span
                v-else
                class="review-docs__filename review-docs__filename--placeholder"
              >
                {{ t('obituaryReview.documents.noFileSelected') }}
              </span>

              <button
                type="button"
                class="btn btn-primary btn-xs"
                :disabled="docsUploading || !selectedIdCardFile"
                @click="onUploadIdCard"
              >
                <span
                  v-if="
                    docsUploading &&
                    currentUploadType === 'id_card'
                  "
                >
                  {{ t('obituaryReview.documents.uploading') }}
                </span>
                <span v-else>
                  {{ t('obituaryReview.documents.uploadIdCard') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Certificat de décès -->
      <div class="review-docs__item">
        <div class="review-docs__item-head">
          <div>
            <h3 class="review-docs__item-title">
              {{ t('obituaryReview.documents.deathCertTitle') }}
            </h3>
            <p class="review-docs__item-text">
              {{ t('obituaryReview.documents.deathCertHelp') }}
            </p>
          </div>

          <span
            v-if="hasDeathCertDoc"
            class="review-docs__badge review-docs__badge--ok"
          >
            {{ t('obituaryReview.documents.alreadyUploaded') }}
          </span>
          <span
            v-else
            class="review-docs__badge review-docs__badge--pending"
          >
            {{ t('obituaryReview.documents.missing') }}
          </span>
        </div>

        <div class="review-docs__item-body">
          <!-- Doc déjà présent : lien pour le consulter -->
          <div
            v-if="hasDeathCertDoc && deathCertDoc && deathCertDoc.fileUrl"
            class="review-docs__file-row"
          >
            <i class="fa-regular fa-file" aria-hidden="true"></i>
            <a
              :href="deathCertDoc.fileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="review-docs__file-link"
            >
              {{ t('obituaryReview.documents.openFile') }}
            </a>
          </div>

          <!-- Upload -->
          <div v-if="!hasDeathCertDoc" class="review-docs__upload">
            <label class="review-docs__upload-label">
              <i class="fa-regular fa-upload" aria-hidden="true"></i>
              <span>
                {{ t('obituaryReview.documents.chooseFile') }}
              </span>
              <input
                type="file"
                class="review-docs__upload-input"
                accept="image/*,application/pdf"
                @change="onSelectDeathCert"
              />
            </label>

            <div class="review-docs__upload-footer">
              <span
                v-if="selectedDeathCertName"
                class="review-docs__filename"
              >
                {{ selectedDeathCertName }}
              </span>
              <span
                v-else
                class="review-docs__filename review-docs__filename--placeholder"
              >
                {{ t('obituaryReview.documents.noFileSelected') }}
              </span>

              <button
                type="button"
                class="btn btn-primary btn-xs"
                :disabled="docsUploading || !selectedDeathCertFile"
                @click="onUploadDeathCert"
              >
                <span
                  v-if="
                    docsUploading &&
                    currentUploadType === 'death_certificate'
                  "
                >
                  {{ t('obituaryReview.documents.uploading') }}
                </span>
                <span v-else>
                  {{ t('obituaryReview.documents.uploadDeathCert') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Avertissement global -->
    <p
      v-if="!hasAllRequiredDocs && !isFreePlan"
      class="review-docs__warning"
    >
      {{ t('obituaryReview.documents.missingWarning') }}
    </p>
  </div>
</section>


        <!-- Colonne droite : encadré actions / paiement -->
        <aside
          class="card review-side"
          aria-label="Validation et publication"
        >
          <div class="card-body review-side__body">
            <p class="review-side__status">
              {{
                isFreePlan
                  ? t('obituaryReview.side.statusFree')
                  : t('obituaryReview.side.statusPayment')
              }}
            </p>

            <h2 class="review-side__title">
              {{ t('obituaryReview.side.title') }}
            </h2>
            <p class="review-side__subtitle">
              {{ t('obituaryReview.side.subtitle') }}
            </p>

            <ul class="review-side__summary">
              <li>
                <span class="review-side__label">
                  {{ t('obituaryReview.side.plan') }}
                </span>
                <span class="review-side__value">
                  {{ planLabel || t('obituaryReview.side.planUnknown') }}
                </span>
              </li>
              <li>
                <span class="review-side__label">
                  {{ t('obituaryReview.side.duration') }}
                </span>
                <span class="review-side__value">
                  {{ t('obituaryReview.planMeta', { days: effectivePublishDays }) }}
                </span>
              </li>
              <li>
                <span class="review-side__label">
                  {{ t('obituaryReview.side.price') }}
                </span>
                <span class="review-side__value">
                  {{ planPrice }}
                </span>
              </li>
            </ul>

            <p class="review-side__legal">
              {{ t('obituaryReview.side.legal') }}
            </p>
<div class="review-side__actions">
  <!-- Modifier -->
  <button
    type="button"
    class="btn btn-ghost btn-sm"
    @click="onEdit"
    :disabled="isPublishing || isPaying"
  >
    {{ t('obituaryReview.actions.edit') }}
  </button>

  <!-- Publier (gratuit) -->
  <button
    v-if="isFreePlan"
    type="submit"
    class="btn btn-primary"
    :disabled="isPublishing || isPaying"
  >
    <span v-if="isPublishing">
      {{ t('obituaryReview.actions.publishing') }}
    </span>
    <span v-else>
      {{ t('obituaryReview.actions.publishFree') }}
    </span>
  </button>

  <!-- Plan payant, pas encore payé → bouton de paiement -->
  <button
    v-else-if="!isAlreadyPaid"
    type="button"
    class="btn btn-primary"
    @click="onPay"
    :disabled="isPublishing || isPaying || !hasAllRequiredDocs"
  >
    <span v-if="isPaying">
      {{ t('obituaryReview.actions.redirectingToPayment') }}
    </span>
    <span v-else>
      {{ t('obituaryReview.actions.confirmAndPay') }}
    </span>
  </button>

  <!-- Plan payant, déjà payé → pas de nouveau paiement -->
  <p
    v-else
    class="review-side__info"
  >
    {{ t('obituaryReview.side.alreadyPaid') }}
  </p>

  <!-- Archive / suppression -->
  <button
    type="button"
    class="btn btn-ghost btn-sm"
    @click="onSoftDeleteClick"
    :disabled="isPublishing || isPaying"
  >
    🗂 {{ t('obituaryReview.actions.archive') }}
  </button>

  <button
    type="button"
    class="btn btn-danger btn-sm"
    @click="onHardDeleteClick"
    :disabled="isPublishing || isPaying"
  >
    🗑 {{ t('obituaryReview.actions.hardDelete') }}
  </button>
</div>


<p
  v-if="!hasAllRequiredDocs && !isFreePlan"
  class="review-side__hint"
>
  {{ t('obituaryReview.documents.sideHint') }}
</p>


          </div>
        </aside>
      </form>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
});

import { computed, ref } from 'vue';
import {
  useRoute,
  useRouter,
  useSeoMeta,
  useFetch,
  useNuxtApp,
} from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';
import { useConfirmStore } from '~/stores/confirmStore';
import { useDateUtils } from '~/composables/useDateUtils';
import { useObituaryDocuments } from '~/composables/useObituaryDocuments';

// ...



const { formatDate, formattedDateTimeWithSeconds } = useDateUtils();

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

// Toastification (plugin : provide("useToast", ...))
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;
const isPublishing = ref(false);
const isPaying = ref(false);
// Store de confirmation (LkConfirmModal)
const confirmStore = useConfirmStore();

const slug = computed(() => route.params.slug);

// 🔹 Mini PLAN_META côté client pour le prix / libellé
const PLAN_META = {
  indiv_free_7: {
    code: 'indiv_free_7',
    labelKey: 'plans.codes.indiv_free_7',
    isFree: true,
    currency: null,
    basePriceCents: 0,
    publishDurationDays: 7,
  },
  indiv_basic_21: {
    code: 'indiv_basic_21',
    labelKey: 'plans.codes.indiv_basic_21',
    isFree: false,
    currency: 'EUR',
    basePriceCents: 1800,
    publishDurationDays: 21,
  },
  indiv_essentiel_30: {
    code: 'indiv_essentiel_30',
    labelKey: 'plans.codes.indiv_essentiel_30',
    isFree: false,
    currency: 'EUR',
    basePriceCents: 2500,
    publishDurationDays: 30,
  },
  indiv_prestige_60: {
    code: 'indiv_prestige_60',
    labelKey: 'plans.codes.indiv_prestige_60',
    isFree: false,
    currency: 'EUR',
    basePriceCents: 4900,
    publishDurationDays: 60,
  },
};

// 📡 Récupération de la payload par slug
const {
  data,
  pending,
  error,
  refresh,
} = await useFetch(() => `/api/obituaries/${slug.value}`, {
  key: () => `obituary-confirm-${slug.value}`,
});

// Normalisation de la réponse
const payload = computed(() => data.value || null);
const obituary = computed(() => payload.value?.obituary || null);
const events = computed(() => payload.value?.events || []);
const contacts = computed(() => payload.value?.contacts || []);
// 📎 Documents justificatifs
//const documents = ref([]); // liste depuis l'API (plus tard)
const docsUploading = ref(false);
const currentUploadType = ref(null);
const selectedIdCardFile = ref(null);
const selectedDeathCertFile = ref(null);


const {
  documents,
  hasDocuments,
  pending: docsPending,
  error: docsError,
  refresh: refreshDocs,
} = await useObituaryDocuments(slug);

const hasIdCardDoc = computed(() =>
  documents.value.some((d) => d.type === 'id_card'),
);

const hasDeathCertDoc = computed(() =>
  documents.value.some((d) => d.type === 'death_certificate'),
);

// On garde un computed pour savoir si les 2 sont là (utile pour la suite & admin)
const hasAllDocs = computed(() => {
  return hasIdCardDoc.value && hasDeathCertDoc.value;
});

const onSelectIdCard = (event) => {
  const files = event.target?.files;
  selectedIdCardFile.value = files && files[0] ? files[0] : null;
};

const onSelectDeathCert = (event) => {
  const files = event.target?.files;
  selectedDeathCertFile.value = files && files[0] ? files[0] : null;
};
// Premier document de chaque type (pour lien "voir le fichier", etc.)
const idCardDoc = computed(() =>
  documents.value.find((d) => d.type === 'id_card') || null,
);

const deathCertDoc = computed(() =>
  documents.value.find((d) => d.type === 'death_certificate') || null,
);

// Nom du fichier sélectionné côté client
const selectedIdCardName = computed(() =>
  selectedIdCardFile.value ? selectedIdCardFile.value.name : ''
);

const selectedDeathCertName = computed(() =>
  selectedDeathCertFile.value ? selectedDeathCertFile.value.name : ''
);

const uploadDocument = async (type, file) => {
  if (!file || !obituary.value) return;
  if (docsUploading.value) return;

  docsUploading.value = true;
  currentUploadType.value = type;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    await $fetch(`/api/obituaries/${slug.value}/documents`, {
      method: 'POST',
      body: formData,
    });

    // 🔁 On recharge la liste depuis l’API
    await refreshDocs();

    if (toast) {
      toast.success(t('obituaryReview.documents.uploadSuccess'));
    }
  } catch (err) {
    console.error('Upload document error', err);
    const msg =
      err?.data?.statusMessage ||
      err?.data?.message ||
      t('obituaryReview.documents.uploadError');
    if (toast) {
      toast.error(msg);
    }
  } finally {
    docsUploading.value = false;
    currentUploadType.value = null;
  }
};

const isAlreadyPaid = computed(() => {
  const o = obituary.value;
  if (!o || !o.monetization) return false;

  const amount =
    typeof o.monetization.amountPaid === 'number'
      ? o.monetization.amountPaid
      : typeof o.monetization.amount_paid === 'number'
        ? o.monetization.amount_paid
        : 0;

  return amount > 0;
});


const onUploadIdCard = async () => {
  if (!selectedIdCardFile.value) {
    if (toast) {
      toast.info(t('obituaryReview.documents.selectFileFirst'));
    }
    return;
  }
  await uploadDocument('id_card', selectedIdCardFile.value);
};

const onUploadDeathCert = async () => {
  if (!selectedDeathCertFile.value) {
    if (toast) {
      toast.info(t('obituaryReview.documents.selectFileFirst'));
    }
    return;
  }
  await uploadDocument('death_certificate', selectedDeathCertFile.value);
};

// SEO dynamique
useSeoMeta({
  title: () => {
    const base = t('obituaryReview.meta.title');
    const name = obituary.value?.deceased?.fullName;
    return name ? `${base} – ${name}` : base;
  },
  description: () => {
    const body =
      obituary.value?.content?.body ||
      obituary.value?.content?.bodyText ||
      '';
    if (body) {
      return body.slice(0, 160);
    }
    return t('obituaryReview.meta.description') || '';
  },
  ogTitle: () => t('obituaryReview.meta.title'),
  ogDescription: () => {
    const body =
      obituary.value?.content?.body ||
      obituary.value?.content?.bodyText ||
      '';
    if (body) {
      return body.slice(0, 160);
    }
    return t('obituaryReview.meta.description') || '';
  },
});

// 🔹 Plan / monétisation
const planCodeFromData = computed(() => {
  const o = obituary.value;
  // On préfère le pricingTier de monetization
  const tier = o?.monetization?.pricingTier;
  if (tier && PLAN_META[tier]) {
    return tier;
  }

  // Fallback : paramètre plan dans l'URL
  const fromQuery = route.query.plan;
  if (typeof fromQuery === 'string' && PLAN_META[fromQuery]) {
    return fromQuery;
  }

  return null;
});

const currentPlanMeta = computed(() => {
  const code = planCodeFromData.value;
  if (!code) return null;
  return PLAN_META[code] || null;
});

const isFreePlan = computed(() => {
  if (currentPlanMeta.value) {
    return !!currentPlanMeta.value.isFree;
  }
  const m = obituary.value?.monetization;
  if (!m) return false;
  if (typeof m.isFree === 'boolean') return m.isFree;
  return false;
});
const effectivePublishDays = computed(() => {
  const o = obituary.value;
  const meta = currentPlanMeta.value;

  // 1) D'abord : ce que le backend a enregistré
  const apiDays =
    (typeof o?.publishDurationDays === 'number' && o.publishDurationDays > 0
      ? o.publishDurationDays
      : null) ??
    (typeof o?.publish_duration_days === 'number' &&
    o.publish_duration_days > 0
      ? o.publish_duration_days
      : null);

  if (typeof apiDays === 'number' && apiDays > 0) {
    return apiDays;
  }

  // 2) Ensuite : ce que dit le plan théorique côté front
  const metaDays =
    typeof meta?.publishDurationDays === 'number'
      ? meta.publishDurationDays
      : null;

  if (typeof metaDays === 'number' && metaDays > 0) {
    return metaDays;
  }

  // 3) Dernier fallback : gratuit → plan gratuit (7 j) ; sinon 0
  if (isFreePlan.value) {
    return PLAN_META.indiv_free_7.publishDurationDays;
  }

  return 0;
});

const planLabel = computed(() => {
  if (currentPlanMeta.value) {
    return t(currentPlanMeta.value.labelKey);
  }

  // Si on sait au moins que c'est gratuit, on affiche le label du plan gratuit
  if (isFreePlan.value) {
    return t(PLAN_META.indiv_free_7.labelKey);
  }

  const code = planCodeFromData.value;
  if (code) {
    return code;
  }

  return null;
});

const planPrice = computed(() => {
  const meta = currentPlanMeta.value;
  const o = obituary.value;

  // 1) Si on connaît le plan côté front
  if (meta) {
    if (meta.isFree) {
      return t('plans.price.free');
    }
    const cents =
      typeof meta.basePriceCents === 'number' ? meta.basePriceCents : 0;
    if (cents > 0) {
      const euros = (cents / 100).toFixed(2);
      return t('plans.price.paid', { amount: euros });
    }
  }

  // 2) Sinon on regarde ce que l'API a renvoyé comme montant
  const rawAmount =
    typeof o?.amountPaid === 'number'
      ? o.amountPaid
      : typeof o?.amount_paid === 'number'
        ? o.amount_paid
        : null;

  if (rawAmount && rawAmount > 0) {
    const euros = rawAmount.toFixed(2);
    return t('plans.price.paid', { amount: euros });
  }

  // 3) Si on sait que le plan est gratuit, même sans meta connu
  if (isFreePlan.value) {
    return t('plans.price.free');
  }

  // 4) Dernier fallback : montant inconnu
  return '—';
});

// 🌍 Formatters
const formatEventType = (type) => {
  if (!type) return '';
  switch (type) {
    case 'funeral':
      return t('home.eventTypes.funeral');
    case 'wake':
      return t('home.eventTypes.wake');
    case 'burial':
      return t('home.eventTypes.burial');
    case 'memorial':
      return t('home.eventTypes.memorial');
    default:
      return type;
  }
};

const formatDateTime = (value) => {
  if (!value) return '';
  return formattedDateTimeWithSeconds(value);
};


const formatGender = (value) => {
  if (!value) return '';
  if (value === 'male') {
    return t('createObituary.fields.gender.options.male');
  }
  if (value === 'female') {
    return t('createObituary.fields.gender.options.female');
  }
  return value;
};

const formatIdentityStatus = (value) => {
  switch (value) {
    case 'known':
      return t('createObituary.fields.identityStatus.options.known');
    case 'partial':
      return t('createObituary.fields.identityStatus.options.partial');
    case 'unknown':
      return t('createObituary.fields.identityStatus.options.unknown');
    default:
      return value;
  }
};

const formatReligion = (value) => {
  if (!value) {
    return t('createObituary.fields.religion.options.none');
  }
  if (value === 'christian') {
    return t('createObituary.fields.religion.options.christian');
  }
  if (value === 'muslim') {
    return t('createObituary.fields.religion.options.muslim');
  }
  if (value === 'other') {
    return t('createObituary.fields.religion.options.other');
  }
  return value;
};

// Actions
const onEdit = () => {
  router.push({
    path: `/obituary/edit/${slug.value}`,
  });
};

/**
 * Publier une annonce gratuite :
 * - appelle POST /api/obituaries/:slug/publish
 * - met à jour statut/visibilité côté DB
 * - redirige vers la page publique de l’annonce
 */
const onConfirm = async () => {
  if (!isFreePlan.value) {
    // sécurité : on ne publie ici que les plans gratuits
    return;
  }
  if (isPublishing.value) return;

  isPublishing.value = true;

  try {
    await $fetch(`/api/obituaries/${slug.value}/publish`, {
      method: 'POST',
    });

    if (toast) {
      toast.success(t('toasts.obituary.published'));
    }

    const targetSlug = obituary.value?.slug || slug.value;
    await router.push(`/obituary/${targetSlug}`);
  } catch (err) {
    console.error('Publish free obituary error', err);

    const message =
      err?.data?.message ||
      err?.statusMessage ||
      t('toasts.obituary.publishError');

    if (toast) {
      toast.error(message);
    }
  } finally {
    isPublishing.value = false;
  }
};

/**
 * Créer une transaction de paiement :
 * - appelle POST /api/payments/checkout
 * - reçoit paymentId
 * - redirige vers /checkout/[paymentId]
 * 
 * On reste très sobre sur les infos retournées pour éviter
 * d’exposer des données sensibles (pas d’IDs externes Stripe/PayPal ici).
 */
/*const onPay = async () => {
  if (!obituary.value) return;

  try {
    const res = await $fetch("/api/payments/checkout", {
      method: "POST",
      body: {
        obituarySlug: slug.value,
        paymentMethod: "card",
      },
    });

    if (toast) {
      toast.success(t("toasts.payment.redirecting"));
    }

    if (res && res.paymentId) {
      await router.push(`/checkout/${res.paymentId}`);
    } else if (toast) {
      toast.error(t("toasts.payment.missingId"));
    }
  } catch (err) {
    console.error("Checkout error", err);

    const backendMsg =
      err?.data?.statusMessage ||
      err?.data?.message ||
      err?.message ||
      "";

    if (toast) {
      toast.error(
        backendMsg || t("toasts.payment.checkoutError")
      );
    }
  }
};*/

const onPay = () => {
  if (!slug.value) return;

  const target = {
    path: `/checkout/obituary/${slug.value}`,
  };

  // optionnel : si tu veux passer le plan
  if (planCodeFromData.value) {
    target.query = { plan: planCodeFromData.value };
  }

  router.push(target);
};

// 🔻 Soft delete (archive / rendre privé)
const softDelete = async () => {
  try {
    await $fetch(`/api/obituaries/${slug.value}`, {
      method: 'DELETE',
    });

    if (toast) {
      toast.success('Annonce archivée (retirée de la liste publique).');
    }
    await router.push('/obituaries');
  } catch (err) {
    console.error('Soft delete error', err);
    if (toast) {
      toast.error('Impossible d’archiver cette annonce pour le moment.');
    }
  }
};

// 🔻 Hard delete (supprimer définitivement)
const hardDelete = async () => {
  try {
    await $fetch(`/api/obituaries/${slug.value}/hard`, {
      method: 'DELETE',
    });

    if (toast) {
      toast.success('Annonce supprimée définitivement.');
    }
    await router.push('/obituaries');
  } catch (err) {
    console.error('Hard delete error', err);
    if (toast) {
      toast.error('Impossible de supprimer définitivement cette annonce.');
    }
  }
};

// Ouverture des modals de confirmation

const onSoftDeleteClick = async () => {
  if (!confirmStore) {
    return;
  }

  const confirmed = await confirmStore.ask({
    title: t('obituaryReview.delete.softTitle') || 'Retirer cette annonce du site ?',
    message:
      t('obituaryReview.delete.softMessage') ||
      'L’annonce ne sera plus visible publiquement, mais vous pourrez encore la retrouver dans votre compte.',
    confirmLabel: t('common.actions.archive') || 'Retirer',
    cancelLabel: t('common.actions.cancel') || 'Annuler',
  });

  if (confirmed) {
    await softDelete();
  }
};

const onHardDeleteClick = async () => {
  if (!confirmStore) {
    return;
  }

  const confirmed = await confirmStore.ask({
    title:
      t('obituaryReview.delete.hardTitle') ||
      'Supprimer définitivement cette annonce ?',
    message:
      t('obituaryReview.delete.hardMessage') ||
      'Cette action est irréversible. Toutes les informations associées à cette annonce seront supprimées.',
    confirmLabel: t('common.actions.delete') || 'Supprimer',
    cancelLabel: t('common.actions.cancel') || 'Annuler',
  });

  if (confirmed) {
    await hardDelete();
  }
};
const createdAt = computed(() => {
  const o = obituary.value;
  if (!o) return null;
  return o.createdAt || o.created_at || null;
});

const isCertOverdue = computed(() => {
  if (!createdAt.value) return false;
  if (hasDeathCertDoc.value) return false;

  const created = new Date(createdAt.value);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 7;
});

</script>


<style scoped>
.review-plan-banner {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.9rem;
  background: var(--color-accent-soft, rgba(56, 189, 248, 0.08));
  border: 1px solid rgba(56, 189, 248, 0.6);
}

.review-plan-banner__top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.review-plan-banner__plan {
  font-weight: 600;
  font-size: 0.98rem;
}

.review-plan-banner__price {
  font-size: 0.9rem;
  opacity: 0.9;
}

.review-plan-banner__meta {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

/* Layout */
.review-layout {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 900px) {
  .review-layout {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
    align-items: flex-start;
  }
}

.review-main__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Sections */
.review-section {
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--space-3);
}
.review-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.review-section__title {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  font-weight: 600;
}

.review-section__subtitle {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

/* Definition list */
.review-dl {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}
.review-dl__row {
  display: grid;
  gap: 0.15rem;
}
.review-dl__row dt {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}
.review-dl__row dd {
  margin: 0;
  font-size: 0.93rem;
}

/* Content */
.review-content__title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
.review-content__body {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Events */
.review-events {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.review-events__item {
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-subtle);
}

.review-events__header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.3rem;
}

.review-events__type {
  font-size: 0.85rem;
  font-weight: 500;
}

.review-events__badge {
  font-size: 0.75rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--color-accent-soft);
}

/* Events body */
.review-events__datetime {
  margin: 0;
  font-size: 0.9rem;
}

.review-events__place {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: var(--color-text-soft);
}

/* Contacts */
.review-contacts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.review-contacts__item {
  padding: 0.65rem 0.8rem;
  border-radius: 0.75rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-subtle);
}

.review-contacts__name {
  margin: 0 0 0.3rem;
  font-size: 0.9rem;
}

.review-contacts__channels {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.2rem;
  font-size: 0.88rem;
}
.review-contacts__channels li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

/* Side card */
.review-side__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.review-side__status {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}

.review-side__title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
}

.review-side__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.review-side__summary {
  list-style: none;
  margin: 0.4rem 0 0.2rem;
  padding: 0;
  display: grid;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.review-side__label {
  display: block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-soft);
}

.review-side__value {
  display: block;
}

.review-side__legal {
  margin: 0.3rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}

.review-side__actions {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

@media (min-width: 600px) {
  .review-side__actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

/* Generic */
.review-empty {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-soft);
}

/* Loading / error */
.review-loading {
  display: grid;
  gap: 0.9rem;
}

.review-skeleton {
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

.review-error {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.review-error__text {
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
/* Boutons danger / warning locaux à cette page */

.btn-danger {
  background: #b91c1c;
  border-color: #991b1b;
  color: #fff;
}

.btn-danger:hover,
.btn-danger:focus-visible {
  background: #991b1b;
  border-color: #7f1d1d;
}

/* Ghost "warning" : texte / bordure ambrés, fond transparent */
.btn-ghost-warning {
  border-color: rgba(245, 158, 11, 0.7);
  color: #b45309;
}

.btn-ghost-warning:hover,
.btn-ghost-warning:focus-visible {
  background: rgba(245, 158, 11, 0.08);
}
/* ============================
   Bloc documents justificatifs
   ============================ */

.review-docs {
  margin-top: 0.75rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 800px) {
  .review-docs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.review-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.review-main {
  /* zone principale */
}

.review-side {
  /* colonne droite */
}

/* Desktop : grille avec zone "docs" en bas sur 2 colonnes */
@media (min-width: 900px) {
  .review-layout {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
    grid-template-areas:
      "main side"
      "docs docs";
    align-items: flex-start;
  }

  .review-main {
    grid-area: main;
  }

  .review-side {
    grid-area: side;
  }

  .review-docs-section {
    grid-area: docs;
  }
}

/* ---- Documents ---- */

.review-docs__body {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.review-docs {
  margin-top: 0.6rem;
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .review-docs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.review-docs__item {
  border-radius: 0.75rem;
  padding: 0.75rem 0.8rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.review-docs__item-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.review-docs__item-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.review-docs__item-text {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.review-docs__badge {
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  white-space: nowrap;
}

.review-docs__badge--ok {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.review-docs__badge--pending {
  background: rgba(248, 250, 252, 0.85);
  color: var(--color-text-soft);
  border: 1px dashed var(--color-border-subtle);
}

.review-docs__item-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.review-docs__file-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--color-text-main);
}

.review-docs__file-link {
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.review-docs__upload {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.review-docs__upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  border: 1px dashed var(--color-border-subtle);
  background: rgba(148, 163, 184, 0.08);
  font-size: 0.8rem;
  cursor: pointer;
}

.review-docs__upload-input {
  display: none;
}

.review-docs__upload-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.review-docs__filename {
  font-size: 0.78rem;
  color: var(--color-text-main);
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.review-docs__filename--placeholder {
  color: var(--color-text-soft);
  font-style: italic;
}

.review-docs__warning {
  margin-top: 0.6rem;
  font-size: 0.82rem;
  color: #b45309;
  background: rgba(251, 191, 36, 0.08);
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
}

/* Loading / error */
.review-docs__loading {
  margin-top: 0.6rem;
  display: grid;
  gap: 0.5rem;
}

.review-docs__skeleton {
  height: 54px;
  border-radius: 0.75rem;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.16),
    rgba(148, 163, 184, 0.3),
    rgba(148, 163, 184, 0.16)
  );
  background-size: 200% 100%;
  animation: review-docs-shimmer 1.2s infinite;
}

.review-docs__error {
  margin-top: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.06);
}

.review-docs__error-text {
  margin: 0 0 0.3rem;
  font-size: 0.86rem;
}

@keyframes review-docs-shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: -200% 0;
  }
}


</style>
