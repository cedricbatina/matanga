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
        <h1 class="section-title">{{ t('editObituary.title') }}</h1>
        <p class="section-subtitle">{{ t('editObituary.subtitle') }}</p>
      </header>

      <!-- Loading / error -->
      <div v-if="pending" class="edit-loading">
        <div class="edit-skeleton" />
        <div class="edit-skeleton" />
      </div>

      <div v-else-if="error" class="edit-error" role="alert" aria-live="polite">
        <p class="edit-error__text">{{ resolveErrorMessage(error) }}</p>
        <button type="button" class="btn btn-ghost btn-sm" @click="refresh">
          {{ t('editObituary.actions.retry') }}
        </button>
      </div>

      <!-- Formulaire d'édition -->
      <form v-else class="card edit-card" @submit.prevent="onSubmit">
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
                <p v-if="errors.deceasedFullName" class="form-error">
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
                <input id="dob" v-model="form.dateOfBirth" class="form-control" type="date" />
              </div>

              <div class="form-field">
                <label class="form-label" for="dod">
                  {{ t('createObituary.fields.dateOfDeath.label') }}
                </label>
                <input id="dod" v-model="form.dateOfDeath" class="form-control" type="date" />
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
                <select id="gender" v-model="form.gender" class="form-control">
                  <option value="">{{ t('common.selectPlaceholder') }}</option>
                  <option value="male">{{ t('createObituary.fields.gender.options.male') }}</option>
                  <option value="female">{{ t('createObituary.fields.gender.options.female') }}</option>
                </select>
              </div>

              <div class="form-field">
                <label class="form-label" for="identityStatus">
                  {{ t('createObituary.fields.identityStatus.label') }}
                </label>
                <select id="identityStatus" v-model="form.identityStatus" class="form-control">
                  <option value="known">{{ t('createObituary.fields.identityStatus.options.known') }}</option>
                  <option value="partial">{{ t('createObituary.fields.identityStatus.options.partial') }}</option>
                  <option value="unknown">{{ t('createObituary.fields.identityStatus.options.unknown') }}</option>
                </select>
              </div>

              <div class="form-field">
                <label class="form-label" for="religion">
                  {{ t('createObituary.fields.religion.label') }}
                </label>
                <select id="religion" v-model="form.religion" class="form-control">
                  <option value="">{{ t('createObituary.fields.religion.options.none') }}</option>
                  <option value="christian">{{ t('createObituary.fields.religion.options.christian') }}</option>
                  <option value="muslim">{{ t('createObituary.fields.religion.options.muslim') }}</option>
                  <option value="other">{{ t('createObituary.fields.religion.options.other') }}</option>
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
                <input v-model="form.isRuralArea" type="checkbox" />
                <span>{{ t('createObituary.fields.isRuralArea.label') }}</span>
              </label>
            </div>
          </section>

       

          <!-- Documents (privés) -->
          <section class="form-section">
            <h2 class="form-section__title">Documents de vérification (privés)</h2>
            <p class="form-section__subtitle">
              Ces documents (CNI, certificat de décès) sont réservés aux propriétaires / admins.
              Ils ne sont <strong>pas</strong> affichés sur la page publique.
            </p>

            <div class="form-grid-2-col">
              <div class="form-field">
                <label class="form-label">Type de document</label>
                <select v-model="docType" class="form-control">
                  <option value="id_card">CNI / pièce d’identité</option>
                  <option value="death_certificate">Certificat de décès</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div class="form-field">
                <label class="form-label">Uploader un document (S3)</label>
                <input type="file" class="form-control" @change="onPickDocumentFile" />
                <p class="form-section__subtitle" v-if="uploadingDoc">Upload en cours…</p>
              </div>
            </div>

            <div v-if="docsPending" class="text-sm text-soft">Chargement des documents…</div>
            <div v-else-if="docsError" class="text-sm text-danger">
              Impossible de charger les documents.
              <button type="button" class="btn btn-ghost btn-xs" @click="refreshDocs">Réessayer</button>
            </div>

            <div v-else>
              <p v-if="!documents.length" class="text-sm text-soft">Aucun document uploadé.</p>

              <ul v-else class="doc-list">
                <li v-for="d in documents" :key="d.id" class="doc-item">
                  <div>
                    <p class="doc-title">
                      <span class="badge badge-soft">{{ d.type }}</span>
                      <span class="badge" :class="docStatusClass(d.status)">{{ d.status }}</span>
                    </p>
                    <p class="text-xs text-soft" style="margin:0;">
                      {{ d.createdAt ? new Date(d.createdAt).toLocaleString() : '' }}
                    </p>
                    <p v-if="d.adminNote" class="text-xs" style="margin:.25rem 0 0;">
                      <span class="text-soft">Note admin :</span> {{ d.adminNote }}
                    </p>
                  </div>

                  <a class="btn btn-ghost btn-xs" :href="d.fileUrl" target="_blank" rel="noopener">
                    Ouvrir
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <!-- Bloc texte annonce -->
          <section class="form-section">
            <h2 class="form-section__title">{{ t('createObituary.sections.content.title') }}</h2>
            <p class="form-section__subtitle">{{ t('createObituary.sections.content.subtitle') }}</p>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="title">{{ t('createObituary.fields.title.label') }}</label>
                <input
                  id="title"
                  v-model.trim="form.title"
                  class="form-control"
                  type="text"
                  :placeholder="t('createObituary.fields.title.placeholder')"
                  :aria-invalid="errors.title ? 'true' : 'false'"
                />
                <p v-if="errors.title" class="form-error">{{ errors.title }}</p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="body">{{ t('createObituary.fields.body.label') }}</label>
                <textarea
                  id="body"
                  v-model.trim="form.body"
                  class="form-control form-control--textarea"
                  rows="6"
                  :placeholder="t('createObituary.fields.body.placeholder')"
                  :aria-invalid="errors.body ? 'true' : 'false'"
                />
                <p v-if="errors.body" class="form-error">{{ errors.body }}</p>
              </div>
            </div>

            <!-- Cover image URL -->
            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="coverImageUrl">Image de couverture (URL)</label>
                <input
                  id="coverImageUrl"
                  v-model.trim="form.coverImageUrl"
                  class="form-control"
                  type="url"
                  placeholder="https://…"
                />
                <p class="form-section__subtitle" style="margin-top: 0.25rem;">
                  Optionnel. Utilisée comme image principale sur la page publique.
                  Tu peux aussi cliquer “Définir comme couverture” sur un souvenir.
                </p>

                <div v-if="form.coverImageUrl" style="margin-top: 0.5rem;">
                  <p class="form-section__subtitle" style="margin-bottom: 0.25rem;">Aperçu :</p>
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
            <h2 class="form-section__title">{{ t('createObituary.sections.mainEvent.title') }}</h2>
            <p class="form-section__subtitle">{{ t('createObituary.sections.mainEvent.subtitle') }}</p>

            <div class="form-grid-2-col">
              <div class="form-field">
                <label class="form-label" for="eventType">{{ t('createObituary.fields.eventType.label') }}</label>
                <select id="eventType" v-model="form.event.eventType" class="form-control">
                  <option value="funeral">{{ t('home.eventTypes.funeral') }}</option>
                  <option value="wake">{{ t('home.eventTypes.wake') }}</option>
                  <option value="burial">{{ t('home.eventTypes.burial') }}</option>
                  <option value="memorial">{{ t('home.eventTypes.memorial') }}</option>
                </select>
              </div>

              <div class="form-field">
                <label class="form-label" for="eventStartsAt">{{ t('createObituary.fields.eventStartsAt.label') }}</label>
                <input
                  id="eventStartsAt"
                  v-model="form.event.startsAt"
                  class="form-control"
                  type="datetime-local"
                  :aria-invalid="errors.eventStartsAt ? 'true' : 'false'"
                />
                <p v-if="errors.eventStartsAt" class="form-error">{{ errors.eventStartsAt }}</p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="venueName">{{ t('createObituary.fields.eventVenueName.label') }}</label>
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
                <label class="form-label" for="venueAddress">{{ t('createObituary.fields.eventVenueAddress.label') }}</label>
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

          <!-- Autres cérémonies -->
          <section class="form-section">
            <h2 class="form-section__title">Autres cérémonies associées (optionnel)</h2>
            <p class="form-section__subtitle">Ajoutez veillée, inhumation, messe, etc.</p>

            <div v-for="(extra, idx) in extraEvents" :key="idx" class="form-subsection__block">
              <div class="form-grid-2-col">
                <div class="form-field">
                  <label class="form-label">Type d’événement</label>
                  <select v-model="extra.eventType" class="form-control">
                    <option value="funeral">{{ t('home.eventTypes.funeral') }}</option>
                    <option value="wake">{{ t('home.eventTypes.wake') }}</option>
                    <option value="burial">{{ t('home.eventTypes.burial') }}</option>
                    <option value="memorial">{{ t('home.eventTypes.memorial') }}</option>
                  </select>
                </div>

                <div class="form-field">
                  <label class="form-label">Date et heure</label>
                  <input v-model="extra.startsAt" type="datetime-local" class="form-control" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Lieu / salle</label>
                  <input v-model.trim="extra.venueName" type="text" class="form-control" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Adresse</label>
                  <input v-model.trim="extra.venueAddress" type="text" class="form-control" />
                </div>
              </div>

              <div class="form-row">
                <button type="button" class="btn btn-ghost btn-xs" @click="removeExtraEvent(idx)">
                  Supprimer cet événement
                </button>
              </div>
            </div>

            <div class="form-row">
              <button type="button" class="btn btn-outline btn-sm" @click="addExtraEvent">
                Ajouter un autre événement
              </button>
            </div>
          </section>

          <!-- Bloc contacts -->
          <section class="form-section">
            <h2 class="form-section__title">{{ t('createObituary.sections.familyContact.title') }}</h2>
            <p class="form-section__subtitle">{{ t('createObituary.sections.familyContact.subtitle') }}</p>

            <div
              v-for="(contact, idx) in form.contacts"
              :key="idx"
              class="form-subsection__block form-subsection__block--contact"
            >
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">
                    {{ t('createObituary.fields.familyContactName.label') }}
                    <span class="badge badge-soft">
                      <span v-if="idx === 0">Contact principal</span>
                      <span v-else>Contact {{ idx + 1 }}</span>
                    </span>
                  </label>
                  <input
                    v-model.trim="contact.name"
                    class="form-control"
                    type="text"
                    :placeholder="t('createObituary.fields.familyContactName.placeholder')"
                  />
                </div>
              </div>

              <div class="form-grid-2-col">
                <div class="form-field">
                  <label class="form-label">{{ t('createObituary.fields.familyContactPhone.label') }}</label>
                  <input
                    v-model.trim="contact.phone"
                    class="form-control"
                    type="tel"
                    :placeholder="t('createObituary.fields.familyContactPhone.placeholder')"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label">{{ t('createObituary.fields.familyContactWhatsapp.label') }}</label>
                  <input
                    v-model.trim="contact.whatsapp"
                    class="form-control"
                    type="tel"
                    :placeholder="t('createObituary.fields.familyContactWhatsapp.placeholder')"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">{{ t('createObituary.fields.familyContactEmail.label') }}</label>
                  <input
                    v-model.trim="contact.email"
                    class="form-control"
                    type="email"
                    :placeholder="t('createObituary.fields.familyContactEmail.placeholder')"
                  />
                </div>
              </div>

              <div v-if="form.contacts.length > 1" class="form-row">
                <button type="button" class="btn btn-ghost btn-xs" @click="removeContact(idx)">
                  Supprimer ce contact
                </button>
              </div>
            </div>

            <div class="form-row">
              <button type="button" class="btn btn-outline btn-sm" @click="addContact">
                Ajouter un autre contact
              </button>
            </div>
          </section>
             <!-- Aperçu cover -->
          <section v-if="coverImageUrl" class="review-section">
            <h2 class="review-section__title">
              {{ t('obituaryReview.sections.coverImage.title', 'Image de couverture') }}
            </h2>
            <p class="review-section__subtitle">
              {{ t('obituaryReview.sections.coverImage.subtitle', 'Cette image sera affichée en haut de la page publique.') }}
            </p>
            <img :src="coverImageUrl" alt="Image de couverture" class="review-cover-image" />
          </section>
  
          <!-- Souvenirs (public) -->
          <section class="form-section">
            <h2 class="form-section__title">Souvenirs (photos / vidéos)</h2>
            <p class="form-section__subtitle">
              Les souvenirs sont <strong>publics</strong> et visibles sur la page de l’annonce.
              Le fichier est uploadé sur S3 (Infomaniak) et on ne stocke ici que l’URL.
            </p>

            <div class="form-grid-2-col">
              <div class="form-field">
                <label class="form-label">Ajouter des fichiers (S3)</label>
                <input
                  type="file"
                  class="form-control"
                 accept="image/*"

                  multiple
                  @change="onPickMediaFiles"
                />
                <p class="form-section__subtitle" v-if="uploadingMedia">Upload en cours…</p>
              </div>

              <div class="form-field">
                <label class="form-label">Ajouter un lien (YouTube/Vimeo/etc.)</label>
                <div class="inline-row">
                  <input
                    v-model.trim="externalMediaUrl"
                    class="form-control"
                    type="url"
                    placeholder="https://…"
                  />
                  <button type="button" class="btn btn-outline btn-sm" @click="addExternalMedia">
                    Ajouter
                  </button>
                </div>
                <p class="form-section__subtitle">
                  Astuce : pour YouTube/Vimeo, colle le lien. Le provider sera “other” pour l’instant.
                </p>
              </div>
            </div>

            <p v-if="!mediaItems.length" class="text-sm text-soft">
              Aucun souvenir pour le moment.
            </p>

            <div v-else class="media-grid">
              <article v-for="(m, idx) in mediaItems" :key="m.url + ':' + idx" class="media-card">
                <div class="media-card__thumb" v-if="m.mediaType === 'image'">
                  <img :src="m.thumbnailUrl || m.url" alt="" loading="lazy" />
                </div>

                 <div class="media-card__thumb" v-else>
  <a :href="m.url" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
    Ouvrir la vidéo ({{ m.provider }})
  </a>
</div>



                <div class="media-card__body">
                  <p class="text-xs text-soft" style="margin:0 0 .35rem;">
                    {{ m.provider }} · {{ m.mediaType }}
                  </p>
                   <p class="text-xs" style="margin:0 0 .5rem;">
  <a :href="m.url" target="_blank" rel="noopener">
    Ouvrir le fichier
  </a>
</p>

                  <div class="inline-row" style="gap:.5rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-ghost btn-xs" @click="setAsCover(m)">
                      Définir comme couverture
                    </button>
                    <button type="button" class="btn btn-ghost btn-xs" @click="toggleMain(m)">
                      {{ m.isMain ? 'Retirer (principal)' : 'Marquer (principal)' }}
                    </button>
                    <button type="button" class="btn btn-ghost btn-xs" @click="removeMedia(idx)">
                      Supprimer
                    </button>
                  </div>

                  <div class="form-row" style="margin-top:.6rem;">
                    <label class="form-label">Titre (optionnel)</label>
                    <input v-model.trim="m.title" class="form-control" type="text" placeholder="Ex: Photo souvenir" />
                  </div>

                  <div class="form-row">
                    <label class="form-label">Description (optionnel)</label>
                    <textarea v-model.trim="m.description" class="form-control form-control--textarea" rows="2" placeholder="…" />
                  </div>
                </div>
              </article>
            </div>

            <p v-if="mediaDirty" class="text-xs text-soft" style="margin-top:.75rem;">
              Modifications médias en attente : n’oubliez pas de cliquer “Enregistrer”.
            </p>
          </section>
        </div>

        <!-- Footer actions -->
        <div class="card-footer edit-footer">
          <button type="button" class="btn btn-ghost" @click="goBackToConfirm">
            {{ t('editObituary.actions.cancel') }}
          </button>

          <button type="button" class="btn btn-ghost" @click="onDeleteFromEdit">
            {{ t('editObituary.actions.delete') }}
          </button>

          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting">{{ t('editObituary.actions.saving') }}</span>
            <span v-else>{{ t('editObituary.actions.save') }}</span>
          </button>
        </div>

        <div v-if="submitError" class="card-footer card-footer--error">
          <p class="form-error">{{ submitError }}</p>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
definePageMeta({ middleware: ['auth'] });

import { reactive, ref, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter, useSeoMeta, useFetch, useNuxtApp } from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';
import { useDateUtils } from '~/composables/useDateUtils';
import { useConfirmStore } from '~/stores/confirmStore';

const { toDateInput, toDateTimeLocalInput, normalizeDateTimeLocal } = useDateUtils();

const hydrating = ref(true);
const eventsDirty = ref(false);
const contactsDirty = ref(false);
const mediaDirty = ref(false);

const uploadingMedia = ref(false);
const uploadingDoc = ref(false);

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { $useToast } = useNuxtApp();
const toast = $useToast ? $useToast() : null;
const confirmStore = useConfirmStore();

const slug = computed(() => route.params.slug);
const extraEvents = ref([]);

const externalMediaUrl = ref('');
const docType = ref('id_card');

// Chargement annonce
const { data, pending, error, refresh } = await useFetch(() => `/api/obituaries/${slug.value}`, {
  key: () => `obituary-edit-${slug.value}`,
});
const uploadingCover = ref(false);
function pickMediaFromUploadResponse(res) {
  if (!res) return null;
  if (res.media && typeof res.media === "object") return res.media;
  if (res.item && typeof res.item === "object") return res.item;
  // cas: API renvoie direct { url: "...", ... }
  if (typeof res.url === "string") return res;
  if (typeof res.fileUrl === "string") return { url: res.fileUrl };
  if (typeof res.location === "string") return { url: res.location }; // classique AWS SDK
  return null;
}

function normalizeMediaItem(m, idx = 0) {
  const url = m?.url || m?.fileUrl || m?.location || "";
  return {
    id: m?.id ?? null,
    url,
    thumbnailUrl: m?.thumbnailUrl ?? m?.thumbnail_url ?? null,
    mediaType: m?.mediaType ?? m?.media_type ?? "image", // ✅ default image
    provider: m?.provider ?? "upload",
    title: m?.title ?? "",
    description: m?.description ?? "",
    durationSeconds: m?.durationSeconds ?? m?.duration_seconds ?? null,
    isMain: !!(m?.isMain ?? m?.is_main),
    sortOrder: Number.isFinite(Number(m?.sortOrder ?? m?.sort_order)) ? Number(m?.sortOrder ?? m?.sort_order) : idx,
    eventId: m?.eventId ?? m?.event_id ?? null,
  };
}

const onPickCoverFile = async (e) => {
  const file = e.target?.files?.[0];
  if (!file) return;

  // sécurité : image uniquement
  if (!String(file.type || "").startsWith("image/")) {
    const msg = "Seules les images sont autorisées pour la couverture.";
    if (toast?.error) toast.error(msg);
    if (e?.target) e.target.value = "";
    return;
  }

  uploadingCover.value = true;
  try {
    const fd = new FormData();
    fd.append("file", file);

    // on réutilise le endpoint media (upload S3) qui renvoie une URL
    const res = await $fetch(`/api/obituaries/${slug.value}/media`, {
      method: "POST",
      body: fd,
    });

    const url = res?.media?.url;
   const uploaded = pickMediaFromUploadResponse(res);
const item = uploaded ? normalizeMediaItem(uploaded, mediaItems.value.length) : null;

if (item?.url) {
  form.coverImageUrl = item.url;

  const exists = mediaItems.value.some((m) => m?.url === item.url);
  if (!exists) mediaItems.value.push(item);
}

  } catch (err) {
    const msg = err?.data?.message || err?.message || "Upload cover failed";
    if (toast?.error) toast.error(msg);
    else console.error(msg, err);
  } finally {
    uploadingCover.value = false;
    if (e?.target) e.target.value = "";
  }
};

// Chargement documents (privés)
const {
  data: docsData,
  pending: docsPending,
  error: docsError,
  refresh: refreshDocs,
} = await useFetch(() => `/api/obituaries/${slug.value}/documents`, {
  key: () => `obituary-docs-${slug.value}`,
});

const obituaryPayload = computed(() => data.value || null);
const obituary = computed(() => obituaryPayload.value?.obituary || null);
const events = computed(() => obituaryPayload.value?.events || []);
const contacts = computed(() => obituaryPayload.value?.contacts || []);
const documents = computed(() => docsData.value?.documents || []);

// médias UI
const mediaItems = ref([]);

// SEO
const seoTitle = computed(() => {
  const base = t('editObituary.meta.title');
  const name = obituary.value?.deceasedFullName || obituary.value?.deceased?.fullName || '';
  return name ? `${base} – ${name}` : base;
});

const seoDescription = computed(() => {
  const o = obituary.value;
  if (!o) return t('editObituary.meta.description') || '';
  let raw = '';
  if (typeof o.content === 'string') raw = o.content;
  else if (o.content && typeof o.content === 'object') {
    if (typeof o.content.body === 'string') raw = o.content.body;
    else if (typeof o.content.bodyText === 'string') raw = o.content.bodyText;
  }
  if (!raw && typeof o.body === 'string') raw = o.body;
  return raw ? raw.slice(0, 160) : (t('editObituary.meta.description') || '');
});

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
});

// Form state
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

  coverImageUrl: '',

  event: { eventType: 'funeral', startsAt: '', venueName: '', venueAddress: '' },

  contacts: [{ name: '', phone: '', whatsapp: '', email: '' }],
});

const errors = reactive({
  deceasedFullName: '',
  title: '',
  body: '',
  eventStartsAt: '',
});

const isSubmitting = ref(false);
const submitError = ref('');

// Hydrate form from API
watch(
  obituary,
  (val) => {
    if (!val) return;

    const d = val.deceased || {};
    form.deceasedFullName = d.fullName || val.deceasedFullName || '';
    form.dateOfBirth = toDateInput(d.dateOfBirth || val.dateOfBirth || '');
    form.dateOfDeath = toDateInput(d.dateOfDeath || val.dateOfDeath || '');
    form.ageDisplay = d.ageDisplay || val.ageDisplay || '';
    form.gender = d.gender || d.deceasedGender || val.deceasedGender || '';
    form.identityStatus = d.identityStatus || val.identityStatus || 'known';
    form.religion = d.religion || val.religion || '';
    form.denomination = d.denomination || val.denomination || '';

    const loc = val.location || {};
    form.city = loc.city || val.city || '';
    form.region = loc.region || val.region || '';
    form.country = loc.country || val.country || '';
    form.countryCode = loc.countryCode || val.countryCode || '';
    form.isRuralArea = loc.isRuralArea ?? val.isRuralArea ?? false;

    const content = val.content || {};
    form.title = content.title || val.title || '';

    let bodyText = '';
    if (typeof content.body === 'string') bodyText = content.body;
    else if (typeof content.bodyText === 'string') bodyText = content.bodyText;
    else if (typeof val.body === 'string') bodyText = val.body;
    form.body = bodyText;

    form.mainLanguage = content.mainLanguage || val.mainLanguage || '';
    form.coverImageUrl = val.coverImageUrl || val.cover_image_url || '';

    const mainEvent = events.value.find((ev) => ev.isMainEvent) || events.value[0] || null;
    if (mainEvent) {
      form.event.eventType = mainEvent.eventType || 'funeral';
      form.event.startsAt = mainEvent.startsAt ? toDateTimeLocalInput(mainEvent.startsAt) : '';
      form.event.venueName = mainEvent.venueName || '';
      form.event.venueAddress = mainEvent.venueAddress || '';
    } else {
      form.event.eventType = 'funeral';
      form.event.startsAt = '';
      form.event.venueName = '';
      form.event.venueAddress = '';
    }

    const others = (events.value || []).filter((ev) => !ev.isMainEvent);
    extraEvents.value = others.map((ev) => ({
      eventType: ev.eventType || 'wake',
      startsAt: ev.startsAt ? toDateTimeLocalInput(ev.startsAt) : '',
      venueName: ev.venueName || '',
      venueAddress: ev.venueAddress || '',
    }));

    const list = (contacts.value || []).map((c) => ({
      name: c.name || '',
      phone: c.phone || '',
      whatsapp: c.whatsappNumber || c.whatsapp_number || '',
      email: c.email || '',
    }));
    form.contacts = list.length ? list : [{ name: '', phone: '', whatsapp: '', email: '' }];

    // Médias (payload.media)
mediaItems.value = (obituaryPayload.value?.media || []).map((m, idx) => normalizeMediaItem(m, idx));


    nextTick(() => {
      hydrating.value = false;
      eventsDirty.value = false;
      contactsDirty.value = false;
      mediaDirty.value = false;
    });
  },
  { immediate: true }
);

// Dirty tracking
watch(
  () => [form.event.eventType, form.event.startsAt, form.event.venueName, form.event.venueAddress],
  () => { if (!hydrating.value) eventsDirty.value = true; }
);

watch(
  extraEvents,
  () => { if (!hydrating.value) eventsDirty.value = true; },
  { deep: true }
);

watch(
  () => form.contacts,
  () => { if (!hydrating.value) contactsDirty.value = true; },
  { deep: true }
);

watch(
  mediaItems,
  () => { if (!hydrating.value) mediaDirty.value = true; },
  { deep: true }
);

// Contacts helpers
const addContact = () => form.contacts.push({ name: '', phone: '', whatsapp: '', email: '' });
const removeContact = (idx) => { if (form.contacts.length > 1) form.contacts.splice(idx, 1); };

// Events helpers
const addExtraEvent = () => extraEvents.value.push({ eventType: 'wake', startsAt: '', venueName: '', venueAddress: '' });
const removeExtraEvent = (idx) => extraEvents.value.splice(idx, 1);

// Media helpers
const removeMedia = (idx) => mediaItems.value.splice(idx, 1);

const toggleMain = (m) => {
  if (!m) return;
  const next = !m.isMain;
  mediaItems.value = mediaItems.value.map((x) => ({
    ...x,
    isMain: x.url === m.url ? next : false,
  }));
};


const setAsCover = (m) => {
  if (!m?.url) return;
  form.coverImageUrl = m.url;

  mediaItems.value = mediaItems.value.map((x) => ({
    ...x,
    isMain: x.url === m.url ? true : x.isMain,
  }));
};

function detectProvider(url) {
  const u = String(url || "");
  if (/youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\//i.test(u)) return "youtube";
  if (/vimeo\.com/i.test(u)) return "vimeo";
  return "other";
}

const addExternalMedia = () => {
  const url = (externalMediaUrl.value || "").trim();
  if (!url) return;

  // ✅ accepte http(s) uniquement
  if (!/^https?:\/\//i.test(url)) {
    const msg = "Lien invalide. Colle une URL complète qui commence par http:// ou https://";
    if (toast?.error) toast.error(msg);
    return;
  }

  mediaItems.value.push({
    url,
    thumbnailUrl: null,
    mediaType: "video",
    provider: detectProvider(url), // youtube/vimeo/other
    title: "",
    description: "",
    durationSeconds: null,
    isMain: false,
    sortOrder: mediaItems.value.length,
    eventId: null,
  });

  externalMediaUrl.value = "";
};


// Upload media files to S3 via API endpoint
const onPickMediaFiles = async (e) => {
    const files = Array.from(e.target?.files || []);
  if (!files.length) return;

  // ✅ sécurité : images uniquement
  const images = files.filter((f) => String(f?.type || "").startsWith("image/"));
  const rejected = files.length - images.length;
  if (rejected > 0) {
    const msg = "Vidéos interdites en upload. Ajoute plutôt un lien (YouTube/Vimeo/…).";
    if (toast?.error) toast.error(msg);
    else console.warn(msg);
  }
  if (!images.length) {
    if (e?.target) e.target.value = "";
    return;
  }

  uploadingMedia.value = true;
  try {
    for (const file of images) {
      const fd = new FormData();
      fd.append('file', file);

      // IMPORTANT: ce endpoint doit exister côté serveur (voir plus bas dans le chat si besoin)
      const res = await $fetch(`/api/obituaries/${slug.value}/media`, {
        method: 'POST',
        body: fd,
      });

  const uploaded = pickMediaFromUploadResponse(res);
const item = uploaded ? normalizeMediaItem(uploaded, mediaItems.value.length) : null;

if (item?.url) {
  mediaItems.value.push(item);

  if (!form.coverImageUrl && item.mediaType === "image") {
    form.coverImageUrl = item.url;
  }
}

    }
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Upload media failed';
    if (toast?.error) toast.error(msg);
    else console.error(msg, err);
  } finally {
    uploadingMedia.value = false;
    if (e?.target) e.target.value = '';
  }
};

// Documents upload (privés)
const onPickDocumentFile = async (e) => {
  const file = e.target?.files?.[0];
  if (!file) return;

  uploadingDoc.value = true;
  try {
    const fd = new FormData();
    fd.append('type', docType.value);
    fd.append('file', file);

    await $fetch(`/api/obituaries/${slug.value}/documents`, {
      method: 'POST',
      body: fd,
    });

    await refreshDocs();

    if (toast?.success) toast.success('Document uploadé.');
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Upload document failed';
    if (toast?.error) toast.error(msg);
    else console.error(msg, err);
  } finally {
    uploadingDoc.value = false;
    if (e?.target) e.target.value = '';
  }
};

const docStatusClass = (status) => {
  if (status === 'accepted') return 'badge-success';
  if (status === 'rejected') return 'badge-warning';
  if (status === 'under_review') return 'badge-neutral';
  return 'badge-soft';
};

// Validation minimale
const validate = () => {
  errors.deceasedFullName = '';
  errors.title = '';
  errors.body = '';
  errors.eventStartsAt = '';
  submitError.value = '';

  if (!form.deceasedFullName) errors.deceasedFullName = t('createObituary.errors.deceasedFullNameRequired');
  if (!form.title || form.title.length < 8) errors.title = t('createObituary.errors.titleRequired');
  if (!form.body || form.body.length < 40) errors.body = t('createObituary.errors.bodyTooShort');
  if (!form.event.startsAt) errors.eventStartsAt = t('createObituary.errors.eventStartsAtRequired');

  return !errors.deceasedFullName && !errors.title && !errors.body && !errors.eventStartsAt;
};

function buildConfirmQuery() {
  const q = {};
  const plan =
    (typeof route.query.plan === 'string' && route.query.plan.trim()) ||
    obituary.value?.planCode ||
    null;
  if (plan) q.plan = plan;
  if (route.query.audience === 'pro') q.audience = 'pro';
  return q;
}

// Build payload for PUT /api/obituaries/:slug
const buildPayload = () => {
  const main = {
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
  };

  const extras = extraEvents.value
    .map((ev) => ({
      eventType: ev.eventType || 'wake',
      title: form.title || null,
      description: null,
      startsAt: normalizeDateTimeLocal(ev.startsAt),
      endsAt: null,
      timezone: null,
      venueName: ev.venueName || null,
      venueAddress: ev.venueAddress || null,
      city: form.city || null,
      region: form.region || null,
      country: form.country || null,
      countryCode: form.countryCode || null,
      isMainEvent: false,
    }))
    .filter((ev) => ev.startsAt || ev.venueName || ev.venueAddress);

  const eventsPayload = [main, ...extras];

  const contactsPayload = form.contacts
    .map((c, idx) => {
      const hasAny = c.name || c.phone || c.whatsapp || c.email;
      if (!hasAny) return null;

      return {
        label: idx === 0 ? 'Contact principal' : `Contact ${idx + 1}`,
        name: c.name || null,
        phone: c.phone || null,
        whatsappNumber: c.whatsapp || null,
        email: c.email || null,
        isPublic: true,
        isPrimary: idx === 0,
      };
    })
    .filter(Boolean);

  const payload = {
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

    coverImageUrl: form.coverImageUrl || undefined,

    regenSlug: false,
  };

  // ✅ On n’envoie QUE si modifié (comme tu fais déjà)
  if (eventsDirty.value) payload.events = eventsPayload;
  if (contactsDirty.value) payload.contacts = contactsPayload;

  // ✅ Media: doit matcher ta normalizeMedia() côté PUT (provider enum = upload/youtube/vimeo/...)
  if (mediaDirty.value) {
    payload.media = mediaItems.value.map((m, idx) => ({
      url: m.url,
      thumbnailUrl: m.thumbnailUrl || null,
      mediaType: m.mediaType || 'image',
      provider: m.provider || 'upload',
      title: m.title || null,
      description: m.description || null,
      durationSeconds: m.durationSeconds || null,
      isMain: !!m.isMain,
      sortOrder: idx,
      eventId: m.eventId || null,
    }));
  }

  return payload;
};

const resolveErrorMessage = (err) => {
  const status = err?.statusCode || err?.status;
  if (status === 404) return t('editObituary.errors.notFound');
  if (status === 403) return t('editObituary.errors.forbidden');
  return t('editObituary.errors.generic');
};

const goBackToConfirm = () => {
  router.push({ path: `/obituary/confirm/${slug.value}`, query: buildConfirmQuery() });
};

const onSubmit = async () => {
  if (isSubmitting.value) return;
  if (!validate()) return;

  isSubmitting.value = true;
  submitError.value = '';

  const payload = buildPayload();

  try {
    await $fetch(`/api/obituaries/${slug.value}`, { method: 'PUT', body: payload });

    if (toast?.success) toast.success(t('editObituary.toasts.updated'));

    await router.push({ path: `/obituary/confirm/${slug.value}`, query: buildConfirmQuery() });
  } catch (err) {
    const fieldErrors = err?.data?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      if (fieldErrors.deceasedFullName) errors.deceasedFullName = fieldErrors.deceasedFullName;
      if (fieldErrors.title) errors.title = fieldErrors.title;
      if (fieldErrors.content) errors.body = fieldErrors.content;
      if (fieldErrors.media) submitError.value = fieldErrors.media;
      if (toast?.error && submitError.value) toast.error(submitError.value);
    } else {
      submitError.value = err?.data?.message || err?.message || t('editObituary.errors.generic');
      if (toast?.error) toast.error(submitError.value);
    }
  } finally {
    isSubmitting.value = false;
  }
};

const onDeleteFromEdit = async () => {
  if (!obituary.value) return;

  const confirmed = await confirmStore.ask({
    title: t('obituaryDelete.confirmTitle', {
      name: obituary.value?.deceasedFullName || obituary.value?.deceased?.fullName || '',
    }),
    message: t('obituaryDelete.confirmMessage'),
    confirmLabel: t('obituaryDelete.confirmLabel'),
    cancelLabel: t('obituaryDelete.cancelLabel'),
    danger: true,
  });

  if (!confirmed) return;

  try {
    await $fetch(`/api/obituaries/${slug.value}`, { method: 'DELETE' });
    if (toast?.success) toast.success(t('obituaryDelete.toasts.archived'));
    await router.push('/obituaries');
  } catch (err) {
    const msg = err?.data?.message || err?.message || t('obituaryDelete.toasts.error');
    if (toast?.error) toast.error(msg);
    else console.error('Delete obituary failed', err);
  }
};

const coverImageUrl = computed(() => form.coverImageUrl || obituary.value?.coverImageUrl || obituary.value?.cover_image_url || '');
</script>

<style scoped>
.edit-card { margin-top: var(--space-3); }
.edit-body { display: flex; flex-direction: column; gap: var(--space-4); }

/* Sections */
.form-section { border-bottom: 1px solid var(--color-border-subtle); padding-bottom: var(--space-4); }
.form-section:last-of-type { border-bottom: none; padding-bottom: 0; }
.form-section__title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; }
.form-section__subtitle { margin: 0 0 1rem; font-size: 0.9rem; color: var(--color-text-soft); }

/* Layout helpers */
.form-row { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.75rem; }
.inline-row { display:flex; gap: .75rem; align-items: center; }
.form-grid-2-col, .form-grid-3-col, .form-grid-4-col { display: grid; gap: 0.75rem; margin-bottom: 0.75rem; }
.form-grid-2-col { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.form-grid-3-col { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.form-grid-4-col { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }

/* Champs */
.form-field { display: flex; flex-direction: column; gap: 0.25rem; }
.form-label { font-size: 0.85rem; font-weight: 500; }
.form-control { width: 100%; padding: 0.45rem 0.6rem; border-radius: 0.5rem; border: 1px solid var(--color-border-subtle); background: var(--color-surface-elevated); font-size: 0.92rem; }
.form-control:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 40%, transparent); }
.form-control--textarea { resize: vertical; min-height: 5rem; }

.form-error { margin: 0.15rem 0 0; font-size: 0.8rem; color: var(--color-danger); }
.form-checkbox { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; }

/* Footer */
.edit-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }

/* Loading / error */
.edit-loading { display: grid; gap: 0.9rem; }
.edit-skeleton { height: 120px; border-radius: 1rem; background: linear-gradient(90deg, rgba(148, 163, 184, 0.18), rgba(148, 163, 184, 0.35), rgba(148, 163, 184, 0.18)); background-size: 200% 100%; animation: shimmer 1.3s infinite; }
.edit-error { padding: 1rem; border-radius: 0.75rem; border: 1px solid rgba(239, 68, 68, 0.7); background: rgba(239, 68, 68, 0.08); display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
.edit-error__text { margin: 0; font-size: 0.9rem; }
@keyframes shimmer { 0% { background-position: 0% 0; } 100% { background-position: -200% 0; } }
.card-footer--error { border-top: 1px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.04); }

.review-cover-image { width: 100%; max-height: 260px; object-fit: cover; border-radius: 0.9rem; border: 1px solid var(--color-border-subtle); }

/* Media grid */
.media-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3); }
.media-card { border: 1px solid var(--color-border-subtle); border-radius: 1rem; overflow: hidden; background: var(--color-surface-elevated); }
.media-card__thumb { width: 100%; aspect-ratio: 16 / 10; background: rgba(148, 163, 184, 0.10); display: grid; place-items: center; }
.media-card__thumb img, .media-card__thumb video { width: 100%; height: 100%; object-fit: cover; display:block; }
.media-card__body { padding: var(--space-2); }

/* Docs list */
.doc-list { list-style: none; padding: 0; margin: 0; display: grid; gap: .75rem; }
.doc-item { display:flex; align-items:flex-start; justify-content: space-between; gap: .75rem; padding: .75rem; border: 1px solid var(--color-border-subtle); border-radius: .9rem; background: var(--color-surface); }
.doc-title { margin: 0 0 .25rem; display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }

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



