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

        <!-- État de chargement / erreur des plans -->
        <div v-if="plansPending" class="plans-loading-inline">
          <span class="plans-loading-inline__dot" />
          <span class="plans-loading-inline__dot" />
          <span class="plans-loading-inline__dot" />
        </div>

        <div
          v-else-if="plansError"
          class="plans-error-inline"
        >
          <p class="plans-error-inline__text">
            {{ t('plans.error') }}
          </p>
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            @click="refreshPlans"
          >
            {{ t('plans.retry') }}
          </button>
        </div>

        <!-- Bandeau plan sélectionné : nom + prix -->
        <div
          v-if="currentPlan"
          class="selected-plan-banner"
        >
          <div class="selected-plan-banner__main">
            <span class="selected-plan-banner__label">
              {{ currentPlanLabel }}
            </span>
            <span class="selected-plan-banner__price">
              {{ formatPlanPrice(currentPlan) }}
            </span>
          </div>
          <p class="selected-plan-banner__helper">
            {{ selectedPlanText }}
          </p>
        </div>
      </div>

      <form
        class="card form"
        @submit.prevent="onSubmit"
      >
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
              <NuxtLink
                to="/plans"
                class="btn btn-ghost btn-sm"
              >
                {{ t('createObituary.sections.publish.changePlanCta') }}
              </NuxtLink>
            </div>

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

            <!-- Identité : genre + statut -->
            <div class="form-row form-row-inline">
              <div class="form-field">
                <span class="form-label">
                  {{ t('createObituary.fields.gender.label') }}
                </span>
                <div class="form-radio-group">
                  <label class="form-radio">
                    <input
                      v-model="form.gender"
                      type="radio"
                      value="male"
                    />
                    <span>{{ t('createObituary.fields.gender.options.male') }}</span>
                  </label>
                  <label class="form-radio">
                    <input
                      v-model="form.gender"
                      type="radio"
                      value="female"
                    />
                    <span>{{ t('createObituary.fields.gender.options.female') }}</span>
                  </label>
                </div>
                <p class="form-hint">
                  {{ t('createObituary.fields.gender.hint') }}
                </p>
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
                <p class="form-hint">
                  {{ t('createObituary.fields.identityStatus.hint') }}
                </p>
              </div>
            </div>

            <!-- Dates & âge -->
            <div class="form-row form-row-inline">
              <div class="form-field">
                <label class="form-label" for="dateOfBirth">
                  {{ t('createObituary.fields.dateOfBirth.label') }}
                </label>
                <input
                  id="dateOfBirth"
                  v-model="form.dateOfBirth"
                  class="form-control"
                  type="date"
                />
                <p class="form-hint">
                  {{ t('createObituary.fields.dateOfBirth.hint') }}
                </p>
              </div>

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
            </div>

            <div class="form-row form-row-inline">
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
                <p class="form-hint">
                  {{ t('createObituary.fields.religion.hint') }}
                </p>
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
                <p class="form-hint">
                  {{ t('createObituary.fields.denomination.hint') }}
                </p>
              </div>
            </div>

            <!-- Localisation -->
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

            <div class="form-row">
              <label class="form-checkbox">
                <input
                  v-model="form.isRuralArea"
                  type="checkbox"
                />
                <span>{{ t('createObituary.fields.isRuralArea.label') }}</span>
              </label>
              <p class="form-hint">
                {{ t('createObituary.fields.isRuralArea.hint') }}
              </p>
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
                <p
                  v-if="errors.title"
                  class="form-error"
                >
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
                />
                <p
                  v-if="errors.body"
                  class="form-error"
                >
                  {{ errors.body }}
                </p>
                <p class="form-hint">
                  {{ t('createObituary.fields.body.hint') }}
                </p>
              </div>
            </div>
          </section>

          <!-- Bloc 3 : Événement principal + événements supplémentaires -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.mainEvent.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ t('createObituary.sections.mainEvent.subtitle') }}
            </p>

            <!-- Hint sur nombre total d’événements autorisés -->
            <p
              v-if="currentPlanFeatures.maxEvents"
              class="form-section__plan-hint"
            >
              Vous pouvez saisir jusqu’à {{ currentPlanFeatures.maxEvents }} événement(s)
              pour cette annonce (cérémonie principale + éventuels rendez-vous associés).
            </p>

            <!-- Événement principal (obligatoire) -->
            <div class="form-subsection">
              <h3 class="form-subsection__title">
                Événement principal
              </h3>

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
                  <p
                    v-if="errors.eventStartsAt"
                    class="form-error"
                  >
                    {{ errors.eventStartsAt }}
                  </p>
                  <p class="form-hint">
                    {{ t('createObituary.fields.eventStartsAt.hint') }}
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
            </div>

            <!-- Événements supplémentaires (optionnels) -->
            <div
              v-if="canAddExtraEventsSection"
              class="form-subsection form-subsection--extra-events"
            >
              <h3 class="form-subsection__title">
                Autres cérémonies associées (optionnel)
              </h3>
              <p class="form-hint">
                Vous pouvez ajouter jusqu’à
                {{ maxExtraEvents }}
                événement(s) en plus de l’événement principal
                (messe de 7ᵉ jour, veillée, inhumation, etc.).
              </p>

              <div
                v-for="(extra, idx) in extraEvents"
                :key="idx"
                class="form-subsection__block"
              >
                <div class="form-row form-row-inline">
                  <div class="form-field">
                    <label class="form-label">
                      Type d’événement
                    </label>
                    <select
                      v-model="extra.eventType"
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
                    <label class="form-label">
                      Date et heure
                    </label>
                    <input
                      v-model="extra.startsAt"
                      type="datetime-local"
                      class="form-control"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <label class="form-label">
                      Lieu / salle
                    </label>
                    <input
                      v-model.trim="extra.venueName"
                      type="text"
                      class="form-control"
                      placeholder="Église, funérarium, salle..."
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <label class="form-label">
                      Adresse
                    </label>
                    <input
                      v-model.trim="extra.venueAddress"
                      type="text"
                      class="form-control"
                      placeholder="Adresse complète (optionnel)"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    @click="removeExtraEvent(idx)"
                  >
                    Supprimer cet événement
                  </button>
                </div>
              </div>

              <div
                v-if="canAddExtraEvent"
                class="form-row"
              >
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="addExtraEvent"
                >
                  Ajouter un autre événement
                </button>
              </div>
            </div>
          </section>

          <!-- Bloc 4 : Contacts famille / organisation (multiples) -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.familyContact.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ t('createObituary.sections.familyContact.subtitle') }}
            </p>

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

              <div class="form-row form-row-inline">
                <div class="form-field">
                  <label class="form-label">
                    {{ t('createObituary.fields.familyContactPhone.label') }}
                  </label>
                  <input
                    v-model.trim="contact.phone"
                    class="form-control"
                    type="tel"
                    :placeholder="t('createObituary.fields.familyContactPhone.placeholder')"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label">
                    {{ t('createObituary.fields.familyContactWhatsapp.label') }}
                  </label>
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
                  <label class="form-label">
                    {{ t('createObituary.fields.familyContactEmail.label') }}
                  </label>
                  <input
                    v-model.trim="contact.email"
                    class="form-control"
                    type="email"
                    :placeholder="t('createObituary.fields.familyContactEmail.placeholder')"
                  />
                </div>
              </div>

              <div
                v-if="form.contacts.length > 1"
                class="form-row"
              >
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  @click="removeContact(idx)"
                >
                  Supprimer ce contact
                </button>
              </div>
            </div>

            <div
              v-if="canAddContact"
              class="form-row"
            >
              <button
                type="button"
                class="btn btn-outline btn-sm"
                @click="addContact"
              >
                Ajouter un autre contact
              </button>
              <p class="form-hint">
                Vous pouvez ajouter jusqu’à
                {{ maxContacts }}
                contact(s) pour cette annonce.
              </p>
            </div>
          </section>

          <!-- Bloc 5 : Photo & publication -->
          <section class="form-section">
            <h2 class="form-section__title">
              {{ t('createObituary.sections.publish.title') }}
            </h2>
            <p class="form-section__subtitle">
              {{ selectedPlanText }}
            </p>

            <!-- Hints dynamiques sur médias & contacts -->
            <p
              v-if="currentPlanFeatures.maxPhotos || currentPlanFeatures.maxVideos"
              class="form-section__plan-hint"
            >
              {{
                t('plans.features.media.value', {
                  photos: currentPlanFeatures.maxPhotos,
                  videos: currentPlanFeatures.maxVideos
                })
              }}
            </p>
            <p
              v-if="currentPlanFeatures.maxContacts"
              class="form-section__plan-hint"
            >
              {{
                t('plans.features.contacts.value', {
                  count: currentPlanFeatures.maxContacts
                })
              }}
            </p>

            <!-- Photo principale (URL) -->
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

            <!-- Photo principale (fichier upload) -->
            <div class="form-row">
              <div class="form-field">
                <label class="form-label" for="coverImageFile">
                  Photo principale (fichier)
                </label>
                <input
                  id="coverImageFile"
                  class="form-control"
                  type="file"
                  accept="image/*"
                  @change="onCoverFileChange"
                />
                <p class="form-hint">
                  Vous pouvez choisir un fichier si vous n’avez pas encore de lien URL.
                  La photo sera téléversée puis utilisée comme illustration principale.
                </p>
                <p
                  v-if="isUploadingCover"
                  class="form-hint"
                >
                  Téléversement en cours…
                </p>
                <p
                  v-if="coverUploadError"
                  class="form-error"
                >
                  {{ coverUploadError }}
                </p>
              </div>
            </div>

            <!-- Autres photos (galerie) -->
            <div
              v-if="canAddPhotoSection"
              class="form-subsection form-subsection--media"
            >
              <h3 class="form-subsection__title">
                Autres photos (optionnel)
              </h3>
              <p class="form-hint">
                Vous pouvez ajouter jusqu’à
                {{ maxExtraPhotos }}
                photo(s) en plus de la photo principale.
              </p>

              <div
                v-for="(photo, idx) in extraPhotos"
                :key="idx"
                class="form-subsection__block"
              >
                <div class="form-row">
                  <div class="form-field">
                    <label class="form-label">
                      URL de la photo {{ idx + 1 }}
                    </label>
                    <input
                      v-model.trim="photo.url"
                      type="url"
                      class="form-control"
                      placeholder="https://…"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <label class="form-label">
                      Titre / légende (optionnel)
                    </label>
                    <input
                      v-model.trim="photo.title"
                      type="text"
                      class="form-control"
                      placeholder="Ex. La famille réunie, Portrait…"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    @click="removePhoto(idx)"
                  >
                    Supprimer cette photo
                  </button>
                </div>
              </div>

              <div
                v-if="canAddPhoto"
                class="form-row"
              >
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="addPhoto"
                >
                  Ajouter une autre photo
                </button>
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
            :disabled="isSubmitting || !currentPlan"
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
definePageMeta({
  middleware: ['auth'],
});

import { reactive, ref, computed, watch } from 'vue';
import { useRouter, useRoute, useSeoMeta, useFetch } from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';

// Config minimale de fallback
const DEFAULT_PLAN_FEATURES = {
  maxEvents: 1,
  maxPhotos: 1,
  maxVideos: 0,
  maxContacts: 1,
  maxOnlineEvents: 0,
};

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

// 🔹 Chargement des plans depuis l'API
const {
  data: plansData,
  pending: plansPending,
  error: plansError,
  refresh: refreshPlans,
} = await useFetch('/api/plans', {
  default: () => ({
    individualObituary: [],
    individualMemorial: [],
    proObituary: [],
    proMemorial: [],
  }),
});

// 🔹 Helper : tous les plans
const allPlans = computed(() => {
  const d = plansData.value || {};
  return [
    ...(d.individualObituary || []),
    ...(d.individualMemorial || []),
    ...(d.proObituary || []),
    ...(d.proMemorial || []),
  ];
});

// 🔹 Code de plan issu de la query (si présent)
const selectedPlanCodeFromQuery = computed(() => {
  const code = route.query.plan;
  if (typeof code === 'string' && code.trim().length > 0) {
    return code.trim();
  }
  return null;
});

// 🔹 Plan courant : on cherche d'abord par code, sinon fallback sur le gratuit famille
const currentPlan = computed(() => {
  const plans = allPlans.value;
  const code = selectedPlanCodeFromQuery.value;

  if (code && plans.length) {
    const found = plans.find((p) => p.code === code);
    if (found) return found;
  }

  const d = plansData.value || {};
  const indivObituary = d.individualObituary || [];

  const free = indivObituary.find((p) => p.isFree);
  if (free) return free;

  if (indivObituary.length) return indivObituary[0];

  return plans[0] || null;
});

// 🔹 Scope mémorial ou pas (pour ajuster le type d'événement par défaut)
const isMemorialPlan = computed(() => {
  const p = currentPlan.value;
  if (!p) return false;
  if (p.scope === 'memorial') return true;
  return typeof p.code === 'string' && p.code.includes('memorial');
});

// 🔹 Features dérivées du plan (ou fallback)
const currentPlanFeatures = computed(() => {
  const p = currentPlan.value;
  if (p && p.features) {
    return {
      maxEvents: p.features.maxEvents ?? 1,
      maxPhotos: p.features.maxPhotos ?? 1,
      maxVideos: p.features.maxVideos ?? 0,
      maxContacts: p.features.maxContacts ?? 1,
      maxOnlineEvents: p.features.maxOnlineEvents ?? 0,
      primaryVisibilityDays:
        p.features.primaryVisibilityDays ??
        p.publishDurationDays ??
        0,
      secondaryVisibilityDays: p.features.secondaryVisibilityDays ?? 0,
    };
  }
  return DEFAULT_PLAN_FEATURES;
});

const currentPlanLabel = computed(() => {
  const p = currentPlan.value;
  return (p && p.label) || 'Plan Madizi';
});

const selectedPlanText = computed(() => {
  const p = currentPlan.value;
  if (!p) return '';
  return t('createObituary.sections.publish.selectedPlan', {
    plan: currentPlanLabel.value,
    days: p.publishDurationDays || 0,
  });
});

// 🔹 Événements supplémentaires (au-delà du principal)
const extraEvents = ref([]);

const maxExtraEvents = computed(() => {
  const max = currentPlanFeatures.value.maxEvents || 1;
  return Math.max(0, max - 1);
});

const canAddExtraEventsSection = computed(
  () => maxExtraEvents.value > 0,
);

const canAddExtraEvent = computed(
  () => extraEvents.value.length < maxExtraEvents.value,
);

const makeEmptyExtraEvent = () => ({
  eventType: isMemorialPlan.value ? 'memorial' : 'funeral',
  startsAt: '',
  venueName: '',
  venueAddress: '',
});

const addExtraEvent = () => {
  if (!canAddExtraEvent.value) return;
  extraEvents.value.push(makeEmptyExtraEvent());
};

const removeExtraEvent = (index) => {
  extraEvents.value.splice(index, 1);
};

// 🔹 Médias supplémentaires (photos de galerie)
const extraPhotos = ref([]);

const maxPhotos = computed(() => {
  const value = currentPlanFeatures.value.maxPhotos;
  return typeof value === 'number' && value > 0 ? value : 0;
});

const maxExtraPhotos = computed(() => {
  if (maxPhotos.value <= 1) return 0;
  return maxPhotos.value - 1;
});

const canAddPhotoSection = computed(
  () => maxExtraPhotos.value > 0,
);

const canAddPhoto = computed(
  () => extraPhotos.value.length < maxExtraPhotos.value,
);

const addPhoto = () => {
  if (!canAddPhoto.value) return;
  extraPhotos.value.push({
    url: '',
    title: '',
    description: '',
  });
};

const removePhoto = (index) => {
  extraPhotos.value.splice(index, 1);
};

// 🔹 Formulaire principal
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
  coverImageUrl: '',

  event: {
    eventType: '',
    startsAt: '',
    venueName: '',
    venueAddress: '',
  },

  // Plusieurs contacts (en fonction du plan)
  contacts: [
    {
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
    },
  ],
});

const errors = reactive({
  deceasedFullName: '',
  title: '',
  body: '',
  eventStartsAt: '',
});

const isSubmitting = ref(false);
const submitError = ref('');

// Upload cover
const coverUploadError = ref('');
const isUploadingCover = ref(false);

// SEO
const seoTitle = computed(() => t('createObituary.meta.title'));
const seoDescription = computed(
  () => t('createObituary.meta.description') || '',
);

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
});

// 🔹 Normalisation de datetime-local → "YYYY-MM-DD HH:mm:ss"
const normalizeDateTimeLocal = (value) => {
  if (!value) return null;
  const [date, time] = String(value).split('T');
  if (!date || !time) return value;
  const tPart = time.length === 5 ? `${time}:00` : time;
  return `${date} ${tPart}`;
};

// 🔹 Auto-suggestion du titre à partir du nom
watch(
  () => form.deceasedFullName,
  (name) => {
    if (!name) return;
    if (!form.title || form.title.startsWith('Annonce de décès')) {
      form.title = t('share.obituary.titlePattern', { name });
    }
  },
);

// 🔹 Type d’événement par défaut en fonction du plan (mémorial / classique)
watch(
  isMemorialPlan,
  (isMem) => {
    if (!form.event.eventType) {
      form.event.eventType = isMem ? 'memorial' : 'funeral';
    }
  },
  { immediate: true },
);

// 🔹 Contacts : limites par plan
const maxContacts = computed(() => {
  const value = currentPlanFeatures.value.maxContacts;
  return typeof value === 'number' && value > 0 ? value : 1;
});

const canAddContact = computed(
  () => form.contacts.length < maxContacts.value,
);

const addContact = () => {
  if (!canAddContact.value) return;
  form.contacts.push({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
  });
};

const removeContact = (index) => {
  if (form.contacts.length <= 1) return;
  form.contacts.splice(index, 1);
};

// 🔹 Affichage du prix du plan (même format que sur /plans)
const formatPlanPrice = (plan) => {
  if (!plan || plan.isFree) {
    return t('plans.price.free');
  }
  const cents = plan.basePriceCents || 0;
  const euros = (cents / 100).toFixed(2);
  return t('plans.price.paid', { amount: euros });
};

// 🔹 Upload cover (fichier → /api/uploads/obituary-cover → URL)
const onCoverFileChange = async (event) => {
  coverUploadError.value = '';
  const file = event?.target?.files?.[0];
  if (!file) return;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    coverUploadError.value =
      'Format non supporté (JPEG, PNG, WebP, GIF uniquement).';
    return;
  }

  if (file.size > maxSize) {
    coverUploadError.value =
      'Fichier trop volumineux (max 5 Mo).';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  isUploadingCover.value = true;

  try {
    const res = await $fetch('/api/uploads/obituary-cover', {
      method: 'POST',
      body: formData,
    });

    if (!res || !res.url) {
      throw new Error('Réponse invalide du serveur pour le téléversement.');
    }

    form.coverImageUrl = res.url;
  } catch (err) {
    console.error('Upload cover failed', err);
    coverUploadError.value =
      'Échec de l’envoi de la photo. Veuillez réessayer.';
  } finally {
    isUploadingCover.value = false;
  }
};

// 🔹 Validation minimum cohérente avec l’existant
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

// 🔹 Construction du payload pour /api/obituaries
const buildPayload = () => {
  const plan = currentPlan.value;
  const isPaid = !!(plan && !plan.isFree);

  const currency =
    isPaid && plan && plan.currency ? plan.currency : null;
  const amountPaid =
    isPaid &&
    plan &&
    typeof plan.basePriceCents === 'number'
      ? plan.basePriceCents / 100
      : null;

  // Événement principal
  const mainEvent = {
    eventType: form.event.eventType || (isMemorialPlan.value ? 'memorial' : 'funeral'),
    title: form.title,
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

  // Événements supplémentaires
  const extraEventsPayload = extraEvents.value
    .map((ev) => ({
      eventType:
        ev.eventType ||
        (isMemorialPlan.value ? 'memorial' : 'other'),
      title: form.title,
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
    .filter((ev) => {
      // au moins une info saisie
      return (
        ev.startsAt ||
        ev.venueName ||
        ev.venueAddress
      );
    });

  // On respecte maxEvents
  const maxEvents = currentPlanFeatures.value.maxEvents || 1;
  const allEvents = [mainEvent, ...extraEventsPayload].slice(
    0,
    maxEvents,
  );

  // Contacts : on garde uniquement ceux qui ont des infos
  const maxContactsAllowed = maxContacts.value;
  const contactsPayloadRaw = form.contacts
    .map((c, index) => {
      const hasAny =
        c.name || c.phone || c.whatsapp || c.email;
      if (!hasAny) return null;

      const isPrimary = index === 0;
      const label = isPrimary
        ? 'Contact principal'
        : `Contact ${index + 1}`;

      return {
        label,
        name: c.name || null,
        phone: c.phone || null,
        whatsappNumber: c.whatsapp || null,
        email: c.email || null,
        isPublic: true,
        isPrimary,
      };
    })
    .filter(Boolean);

  const contactsPayload =
    maxContactsAllowed > 0
      ? contactsPayloadRaw.slice(0, maxContactsAllowed)
      : contactsPayloadRaw;

  const primaryContact = contactsPayload[0] || null;

  // Médias : cover + autres photos
  const media = [];
  const maxPhotosAllowed = maxPhotos.value || 0;

  if (form.coverImageUrl) {
    media.push({
      mediaType: 'image',
      provider: 'upload',
      url: form.coverImageUrl,
      thumbnailUrl: null,
      title: null,
      description: null,
      isMain: true,
      sortOrder: 0,
    });
  }

  extraPhotos.value.forEach((photo, idx) => {
    if (!photo.url) return;
    media.push({
      mediaType: 'image',
      provider: 'upload',
      url: photo.url,
      thumbnailUrl: null,
      title: photo.title || null,
      description: photo.description || null,
      isMain: false,
      sortOrder: idx + 1,
    });
  });

  if (maxPhotosAllowed > 0 && media.length > maxPhotosAllowed) {
    media.splice(maxPhotosAllowed);
  }

  return {
    deceasedFullName: form.deceasedFullName,
    deceasedGivenNames: null,
    deceasedFamilyNames: null,

    identityStatus: form.identityStatus || 'known',
    deceasedGender: form.gender || null,
    dateOfBirth: form.dateOfBirth || null,
    dateOfDeath: form.dateOfDeath || null,
    ageDisplay: form.ageDisplay || null,
    religion: form.religion || null,
    denomination: form.denomination || null,

    coverImageUrl: form.coverImageUrl || null,

    title: form.title,
    content: form.body,
    mainLanguage: locale.value || 'fr',

    city: form.city || null,
    region: form.region || null,
    country: form.country || null,
    countryCode: form.countryCode || null,
    isRuralArea: !!form.isRuralArea,

    // On garde le résumé principal dans la table obituaries
    familyContactName: primaryContact?.name || null,
    familyContactPhone: primaryContact?.phone || null,
    familyContactWhatsapp: primaryContact?.whatsappNumber || null,
    familyContactEmail: primaryContact?.email || null,

    // Aligné sur le plan courant
    isFree: !!(plan && plan.isFree),
    pricingTier: plan ? plan.pricingTier : null,
    currency,
    amountPaid,
    publishDurationDays: plan ? plan.publishDurationDays : null,
    paymentProvider: null,
    paymentReference: null,

    events: allEvents,

    contacts: contactsPayload,

    media,

    // Code du plan pour contrôle côté backend
    planCode: plan ? plan.code : null,
  };
};

const onSubmit = async () => {
  if (isSubmitting.value) return;

  if (!currentPlan.value) {
    submitError.value =
      'Impossible de déterminer la formule choisie. Veuillez revenir à la page des plans.';
    return;
  }

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
      await router.push({
        path: `/obituary/confirm/${slug}`,
        query: { plan: currentPlan.value.code },
      });
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

/* Bandeau plan sélectionné */
.selected-plan-banner {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.9rem;

  /* ✅ Fond plus doux, lisible en mode clair et correct en dark */
  background: var(--color-accent-soft, rgba(56, 189, 248, 0.08));
  border: 1px solid rgba(56, 189, 248, 0.6);
}

.selected-plan-banner__main {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.selected-plan-banner__label {
  font-weight: 600;
  font-size: 0.98rem;
  /* on laisse la couleur de texte par défaut (s’adapte au thème) */
}

.selected-plan-banner__price {
  font-size: 0.9rem;
  opacity: 0.9;
}

.selected-plan-banner__helper {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-soft);
}


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

/* Radios / checkbox */
.form-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.form-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.form-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
}
</style>
