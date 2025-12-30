<!-- pages/obituary/edit/[slug].vue -->
<template>
  <main class="app-main fade-in">
 <PageNavBar
  :aria-label="t('editObituary.aria.nav')"
  :show-back-home="true"
  :show-back-list="true"
  back-list-to="/obituaries"
  :show-create="false"
  :actions="navActions"
/>


    <section class="section">
      <!-- Header -->
      <header class="section-header">
        <h1 class="section-title">{{ t('editObituary.title') }}</h1>
        <p class="section-subtitle">{{ t('editObituary.subtitle') }}</p>
      </header>
<!-- Bandeau plan (comme create/confirm) -->
<div v-if="activePlan" class="selected-plan-banner" style="margin-top: 1rem;">
  <div class="selected-plan-banner__main">
    <span class="selected-plan-banner__label">
      {{ activePlan.label || activePlan.code || 'Plan' }}
    </span>
    <span class="selected-plan-banner__price">
      {{ formatPlanPrice(activePlan) }}
    </span>
  </div>

  <p class="selected-plan-banner__helper" style="margin-top:.35rem;">
    {{ t('editObituary.planBanner.helper', {
      photos: limits.maxPhotos,
      videos: limits.maxVideos,
      contacts: limits.maxContacts,
      events: limits.maxEvents
    }) }}
  </p>

  <!-- Optionnel: CTA upgrade si free -->
  <div v-if="activePlan.isFree" class="form-row" style="margin-top:.75rem;">
    <NuxtLink to="/plans" class="btn btn-primary btn-sm">
      {{ t('editObituary.planBanner.upgradeCta') }}
    </NuxtLink>
  </div>
</div>
<div class="form-row" style="margin-top:.75rem;">
  <NuxtLink :to="publicObituaryUrl" class="btn btn-ghost btn-sm">
    {{ t('editObituary.actions.viewPublic') }}
  </NuxtLink>
</div>



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
        <h2 class="form-section__title">{{ t('editObituary.sections.documents.title') }}</h2>
          <p class="form-section__subtitle">
  {{ t('editObituary.sections.documents.subtitle_before') }}
  <strong>{{ t('editObituary.sections.documents.subtitle_strong') }}</strong>
  {{ t('editObituary.sections.documents.subtitle_after') }}
</p>

<!-- État des documents -->
<div class="doc-status-grid" style="margin: .75rem 0 1rem;">
  <div v-for="tdef in DOC_TYPES" :key="tdef.code" class="doc-status-card">
    <div class="doc-status-card__top">
      <span class="badge badge-soft">{{ t(tdef.i18nLabel) }}</span>

      <span
        v-if="docsByType[tdef.code]?.status"
        class="badge"
        :class="docStatusClass(docsByType[tdef.code].status)"
      >
        {{ t(`editObituary.documents.status.${docsByType[tdef.code].status}`) }}
      </span>
      <span v-else class="badge badge-soft">
        {{ t('editObituary.documents.status.missing') }}
      </span>
    </div>

    <p v-if="docsByType[tdef.code]?.adminNote" class="text-xs" style="margin:.35rem 0 0;">
      <span class="text-soft">{{ t('editObituary.documents.adminNoteLabel') }}</span>
      {{ docsByType[tdef.code].adminNote }}
    </p>

    <div class="inline-row" style="margin-top:.6rem; gap:.5rem; flex-wrap:wrap;">
      <a
        v-if="docsByType[tdef.code]?.fileUrl"
        class="btn btn-ghost btn-xs"
        :href="docsByType[tdef.code].fileUrl"
        target="_blank"
        rel="noopener"
      >
        {{ t('common.open') }}
      </a>

      <button
        v-if="docsByType[tdef.code]?.id"
        type="button"
        class="btn btn-ghost btn-xs"
        @click="onDeleteDocument(docsByType[tdef.code])"
      >
        {{ t('common.delete') }}
      </button>
    </div>
  </div>
</div>
<details v-if="documents.length" class="doc-history" style="margin-top:.75rem;">
  <summary class="btn btn-ghost btn-sm">
    Historique des documents ({{ documents.length }})
  </summary>

  <ul class="doc-list" style="margin-top:.75rem;">
    <li v-for="d in documents" :key="d.id" class="doc-item">
      <div>
        <p class="doc-title">
          <span class="badge badge-soft">
            {{ t(`editObituary.documents.type.labels.${d.type}`) }}
          </span>
          <span class="badge" :class="docStatusClass(d.status)">
            {{ t(`editObituary.documents.status.${d.status}`) }}
          </span>
        </p>

        <ClientOnly>
          <p class="text-xs text-soft" style="margin:0;">
            {{ d.createdAt ? new Date(d.createdAt).toLocaleString() : '' }}
          </p>
        </ClientOnly>

        <p v-if="d.adminNote" class="text-xs" style="margin:.25rem 0 0;">
          <span class="text-soft">{{ t('editObituary.documents.adminNoteLabel') }}</span>
          {{ d.adminNote }}
        </p>
      </div>

      <div class="inline-row" style="gap:.5rem;">
        <a class="btn btn-ghost btn-xs" :href="d.fileUrl" target="_blank" rel="noopener">
          {{ t('common.open') }}
        </a>
        <button type="button" class="btn btn-ghost btn-xs" @click="onDeleteDocument(d)">
          {{ t('common.delete') }}
        </button>
      </div>
    </li>
  </ul>
</details>

<!-- Message inline -->
<div v-if="docInlineMessage" class="text-sm"
     :class="docInlineTone === 'success' ? 'text-success' : (docInlineTone === 'danger' ? 'text-danger' : 'text-soft')"
     style="margin: .25rem 0 .75rem;">
  {{ docInlineMessage }}
</div>

           <!-- <div class="form-grid-2-col">
              <div class="form-field">
                <label class="form-label">{{ t('editObituary.documents.type.label') }}</label>
                <select v-model="docType" class="form-control">
                <option value="id_card">{{ t('editObituary.documents.type.options.id_card') }}</option>
                  <option value="death_certificate">{{ t('editObituary.documents.type.options.death_certificate') }}</option>
                  <option value="other">{{ t('editObituary.documents.type.options.other') }}</option>
                </select>
              </div>

              <div class="form-field">
               <label class="form-label">{{ t('editObituary.documents.upload.label') }}</label>
                <input type="file" class="form-control" @change="onPickDocumentFile" />
                 <p class="form-section__subtitle" v-if="uploadingDoc">{{ t('editObituary.documents.upload.uploading') }}</p>
              </div>
            </div>
            
            <div
  v-if="docInlineMessage"
  class="doc-inline-message"
  :class="{
    'doc-inline-message--success': docInlineTone === 'success',
    'doc-inline-message--danger': docInlineTone === 'danger'
  }"
>
  {{ docInlineMessage }}
</div>


<div v-if="docsPending" class="text-sm text-soft">
  {{ t('editObituary.documents.list.loading') }}
</div>
<div v-else-if="docsError" class="text-sm text-danger">
  {{ t('editObituary.documents.list.error') }}
  <button type="button" class="btn btn-ghost btn-xs" @click="refreshDocs">Réessayer</button>
</div>-->


<!-- ✅ ICI : message UX upload -->


<div v-if="docsPending" class="text-sm text-soft">
  {{ t('editObituary.documents.list.loading') }}
</div>

<div v-else-if="docsError" class="text-sm text-danger">
  {{ t('editObituary.documents.list.error') }}
  <button type="button" class="btn btn-ghost btn-xs" @click="refreshDocs">
    {{ t('common.retry') }}
  </button>
</div>

            <div v-else>
              <p v-if="!documents.length" class="text-sm text-soft">{{ t('editObituary.documents.list.empty') }}</p>

              <ul v-else class="doc-list">
                <li v-for="d in documents" :key="d.id" class="doc-item">
                  <div>
                    <p class="doc-title">
                     <span class="badge badge-soft">
  {{ t(`editObituary.documents.type.labels.${d.type}`) }}
</span>

<span class="badge" :class="docStatusClass(d.status)">
  {{ t(`editObituary.documents.status.${d.status}`) }}
</span>

                    </p>
                    <ClientOnly>
  <p class="text-xs text-soft" style="margin:0;">
    {{ d.createdAt ? new Date(d.createdAt).toLocaleString() : '' }}
  </p>
</ClientOnly>

                    <p v-if="d.adminNote" class="text-xs" style="margin:.25rem 0 0;">
                     <span class="text-soft">{{ t('editObituary.documents.adminNoteLabel') }}</span> {{ d.adminNote }}
                    </p>
                  </div>

                  <a class="btn btn-ghost btn-xs" :href="d.fileUrl" target="_blank" rel="noopener">
                    {{ t('common.open') }}
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
                <label class="form-label" for="coverImageUrl">{{ t('editObituary.coverImage.label') }}</label>
<input
  id="coverImageUrl"
  v-model.trim="form.coverImageUrl"
  class="form-control"
  type="text"
  inputmode="url"
  :placeholder="t('editObituary.coverImage.placeholder')"
/>

                <p class="form-section__subtitle" style="margin-top: 0.25rem;">
                {{ t('editObituary.coverImage.help') }}
                </p>

                <div v-if="form.coverImageUrl" style="margin-top: 0.5rem;">
                 <p class="form-section__subtitle" style="margin-bottom: 0.25rem;">{{ t('editObituary.coverImage.previewLabel') }}</p>
                  <img
                    :src="form.coverImageUrl"
                   :alt="t('editObituary.coverImage.previewAlt')"
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
            <h2 class="form-section__title">{{ t('editObituary.sections.extraEvents.title') }}</h2>
           <p class="form-section__subtitle">{{ t('editObituary.sections.extraEvents.subtitle') }}</p>
<h2 class="form-section__title">
  {{ t('editObituary.sections.extraEvents.title') }}
  <span class="badge badge-soft" style="margin-left:.5rem;">
    {{ usedEventsCount }}/{{ limits.maxEvents }}
  </span>
</h2>

            <div v-for="(extra, idx) in extraEvents" :key="idx" class="form-subsection__block">
              <div class="form-grid-2-col">
                <div class="form-field">
                  <label class="form-label">{{ t('editObituary.extraEvents.fields.type') }}</label>
                  <select v-model="extra.eventType" class="form-control">
                    <option value="funeral">{{ t('home.eventTypes.funeral') }}</option>
                    <option value="wake">{{ t('home.eventTypes.wake') }}</option>
                    <option value="burial">{{ t('home.eventTypes.burial') }}</option>
                    <option value="memorial">{{ t('home.eventTypes.memorial') }}</option>
                  </select>
                </div>

                <div class="form-field">
                  <label class="form-label">{{ t('editObituary.extraEvents.fields.datetime') }}</label>
                  <input v-model="extra.startsAt" type="datetime-local" class="form-control" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">{{ t('editObituary.extraEvents.fields.venueName') }}</label>
                  <input v-model.trim="extra.venueName" type="text" class="form-control" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">{{ t('editObituary.extraEvents.fields.venueAddress') }}</label>
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
               <button type="button" class="btn btn-outline btn-sm" @click="addExtraEvent" :disabled="!canAddExtraEvent">             Ajouter un autre événement
              </button>
               <p v-if="!canAddExtraEvent" class="text-xs text-soft" style="margin:.35rem 0 0;">
    {{ t('editObituary.limits.eventsReached', { max: limits.maxEvents }) }}
  </p></div>
          </section>

          <!-- Bloc contacts -->
          <section class="form-section">
            <h2 class="form-section__title">{{ t('createObituary.sections.familyContact.title') }}</h2>
            <p class="form-section__subtitle">{{ t('createObituary.sections.familyContact.subtitle') }}</p>
<h2 class="form-section__title">
  {{ t('createObituary.sections.familyContact.title') }}
  <span class="badge badge-soft" style="margin-left:.5rem;">
    {{ usedContactsCount }}/{{ limits.maxContacts }}
  </span>
</h2>

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
                      <span v-if="idx === 0">{{ t('editObituary.contacts.labels.primary') }}</span>
                   <span v-else>{{ t('editObituary.contacts.labels.secondary', { n: idx + 1 }) }}</span>
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
              {{ t('editObituary.contacts.actions.remove') }}
                </button>
              </div>
            </div>

            <div class="form-row">
             <button type="button" class="btn btn-outline btn-sm" @click="addContact" :disabled="!canAddContact">
                 {{ t('editObituary.contacts.actions.add') }}
              </button>
              <p v-if="!canAddContact" class="text-xs text-soft" style="margin:.35rem 0 0;">
   {{ t('editObituary.limits.contactsReached', { max: limits.maxContacts }) }}
  </p></div>
          </section>
             <!-- Aperçu cover -->
      <!--    <section v-if="coverImageUrl" class="review-section">
            <h2 class="review-section__title">
              {{ t('editObituary.coverPreview.title') }}
            </h2>
            <p class="review-section__subtitle">
              {{ t('editObituary.coverPreview.subtitle') }}
            </p>
            <img :src="coverImageUrl" :alt="t('editObituary.coverPreview.alt')" class="review-cover-image" />
          </section>-->
  
          <!-- Souvenirs (public) -->
          <section class="form-section">
        <h2 class="form-section__title">{{ t('editObituary.sections.media.title') }}</h2>
         <p class="form-section__subtitle">
  {{ t('editObituary.sections.media.subtitle_before') }}
  <strong>{{ t('editObituary.sections.media.subtitle_strong') }}</strong>
  {{ t('editObituary.sections.media.subtitle_after') }}
</p>


            <div class="form-grid-2-col">
              <div class="form-field">
                 <label class="form-label">{{ t('editObituary.media.addFiles.label') }}</label>
                <input
                  type="file"
                  class="form-control"
                 accept="image/*"

                  multiple
                  @change="onPickMediaFiles"
                   :disabled="uploadingMedia || !canUploadMorePhotos"
                  

                />
                <p class="text-xs text-soft" style="margin:.35rem 0 0;">
  {{ t('editObituary.limits.photosCounter', { used: photosCount, max: limits.maxPhotos }) }}
</p>
                 <p class="form-section__subtitle" v-if="uploadingMedia">{{ t('editObituary.media.addFiles.uploading') }}</p>
              </div>

              <div class="form-field">
                <label class="form-label">Ajouter un lien (YouTube/Vimeo/etc.)</label>
                <div class="inline-row">
                  <input
                    v-model.trim="externalMediaUrl"
                    class="form-control"
                    type="text"
                   :placeholder="t('editObituary.media.addLink.placeholder')"
                  />
                  <button type="button" class="btn btn-outline btn-sm" @click="addExternalMedia" :disabled="!canAddMoreVideos">
                {{ t('editObituary.media.addLink.actions.add') }}
                  </button>
                </div>
                <p class="text-xs text-soft" style="margin:.35rem 0 0;">
  {{ t('editObituary.limits.videosCounter', { used: videosCount, max: limits.maxVideos }) }}
</p>
                <p class="form-section__subtitle">
                  {{ t('editObituary.media.addLink.tip') }}
                </p>
              </div>
            </div>

            <p v-if="!mediaItems.length" class="text-sm text-soft">
              {{ t('editObituary.media.list.empty') }}
            </p>

            <div v-else class="media-grid">
              <article v-for="(m, idx) in mediaItems" :key="m.url + ':' + idx" class="media-card">
                <div class="media-card__thumb" v-if="m.mediaType === 'image'">
                  <img :src="m.thumbnailUrl || m.url" alt="" loading="lazy" />
                </div>
                 <div class="media-card__thumb" v-else>
  <a :href="m.url" target="_blank" rel="noopener" class="media-thumb-link">
    <img
      v-if="m.thumbnailUrl"
      :src="m.thumbnailUrl"
      alt=""
      loading="lazy"
    />
    <span v-else class="btn btn-outline btn-sm">
    {{ t('editObituary.media.actions.openVideo', { provider: m.provider }) }}
    </span>
  </a>
</div>




                <div class="media-card__body">
                  <p class="text-xs text-soft" style="margin:0 0 .35rem;">
                    {{ m.provider }} · {{ m.mediaType }}
                  </p>
                   <p class="text-xs" style="margin:0 0 .5rem;">
  <a :href="m.url" target="_blank" rel="noopener">
  {{ t('editObituary.media.actions.openFile') }}
  </a>
</p>

                  <div class="inline-row" style="gap:.5rem; flex-wrap:wrap;">
                    <button  v-if="m.mediaType === 'image'" type="button" class="btn btn-ghost btn-xs" @click="setAsCover(m)">
                    {{ t('editObituary.media.actions.setCover') }}
                    </button>
                    <button v-if="m.mediaType === 'image'" type="button" class="btn btn-ghost btn-xs" @click="toggleMain(m)">
                        {{ m.isMain ? t('editObituary.media.actions.unmarkMain') : t('editObituary.media.actions.markMain') }}
                    </button>
                    <button type="button" class="btn btn-ghost btn-xs" @click="removeMedia(idx)">
                     {{ t('editObituary.media.actions.remove') }}
                    </button>
                    <button
  v-if="m.mediaType === 'image'"
  type="button"
  class="btn btn-ghost btn-xs"
  @click="setAsCover(m)"
>
   {{ t('editObituary.media.actions.setCover') }}
</button>

<button
  v-if="m.mediaType === 'image'"
  type="button"
  class="btn btn-ghost btn-xs"
  @click="toggleMain(m)"
>
  {{ m.isMain ? t('editObituary.media.actions.unmarkMain') : t('editObituary.media.actions.markMain') }}
</button>

                  </div>

                  <div class="form-row" style="margin-top:.6rem;">
                      <label class="form-label">{{ t('editObituary.media.fields.title.label') }}</label>
                   <input v-model.trim="m.title" class="form-control" type="text" :placeholder="t('editObituary.media.fields.title.placeholder')" />
                  </div>

                  <div class="form-row">
                    <label class="form-label">{{ t('editObituary.media.fields.description.label') }}</label>
                   <textarea v-model.trim="m.description" class="form-control form-control--textarea" rows="2" :placeholder="t('editObituary.media.fields.description.placeholder')" />
                  </div>
                </div>
              </article>
            </div>

            <p v-if="mediaDirty" class="text-xs text-soft" style="margin-top:.75rem;">
              {{ t('editObituary.media.list.pendingSave') }}
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
definePageMeta({ middleware: ["auth"]});


import { reactive, ref, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter, useSeoMeta, useFetch, useNuxtApp, useRequestHeaders } from '#imports';
import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';
import { useDateUtils } from '~/composables/useDateUtils';
import { useConfirmStore } from '~/stores/confirmStore';


const reqHeaders = process.server ? useRequestHeaders(['cookie']) : undefined
const publicObituaryUrl = computed(() => `/obituary/${slug.value}`);

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
    proSubscriptions: [],
  }),
});

const allPlans = computed(() => {
  const d = plansData.value || {};
  return [
    ...(d.individualObituary || []),
    ...(d.individualMemorial || []),
    ...(d.proObituary || []),
    ...(d.proSubscriptions || []),
  ];
});

// Chargement annonce
const { data: obituaryData, pending, error, refresh } = await useFetch(
  () => `/api/obituaries/${slug.value}`,
  { key: () => `obituary-edit-${slug.value}`, headers: reqHeaders }
);

const obituaryPayload = computed(() => obituaryData.value || null);


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
const formatPriceCents = (cents) => {
  const euros = (Number(cents || 0) / 100).toFixed(2);
  return t('plans.price.paid', { amount: euros });
};

const formatPlanPrice = (plan) => {
  if (!plan) return '—';
  if (plan.isFree) return t('plans.price.free');

  if (plan.billingType === 'subscription') {
    const price = formatPriceCents(plan.priceCents ?? plan.basePriceCents ?? 0);
    const per = plan.billingPeriod === 'year' ? ' / an' : ' / mois';
    return `${price}${per}`;
  }

  const cents =
    (typeof plan.basePriceCents === 'number' && plan.basePriceCents > 0)
      ? plan.basePriceCents
      : (typeof plan.priceCents === 'number' && plan.priceCents > 0)
        ? plan.priceCents
        : 0;

  return formatPriceCents(cents);
};
const DOC_TYPES = [
  { code: "id_card", i18nLabel: "editObituary.documents.type.labels.id_card" },
  { code: "death_certificate", i18nLabel: "editObituary.documents.type.labels.death_certificate" },
  { code: "other", i18nLabel: "editObituary.documents.type.labels.other" },
];

const docsByType = computed(() => {
  const map = {};
  for (const d of (documents.value || [])) {
    if (!map[d.type]) map[d.type] = d; // 1 doc par type (contrainte DB)
  }
  return map;
});

const currentDocForSelectedType = computed(() => {
  return docsByType.value?.[docType.value] || null;
});

// message UI inline (en + des toasts)
const docInlineMessage = ref("");
const docInlineTone = ref("info"); // "info" | "success" | "danger"

function normalizeMediaItem(m, idx = 0) {
  const url = m?.url || m?.fileUrl || m?.location || "";
  let mediaType = m?.mediaType ?? m?.media_type ?? "image";
  let provider = m?.provider ?? "upload";

  const looksLikeVideo = /youtu\.be\/|youtube\.com|youtube-nocookie\.com|vimeo\.com/i.test(url);

  // Si URL vidéo mais mediaType stocké "image" → on corrige
  if (mediaType === "image" && looksLikeVideo) mediaType = "video";

  // Si c’est une vidéo (ou une URL vidéo), on force un provider cohérent
  if ((mediaType === "video" || looksLikeVideo) && (!provider || provider === "upload" || provider === "other")) {
    provider = detectProvider(url);
  }

  // Thumbnail (DB -> sinon dérivé pour youtube)
  let thumb = m?.thumbnailUrl ?? m?.thumbnail_url ?? null;
  if (mediaType === "video" && !thumb) {
    thumb = deriveVideoThumbnail({ url, provider }) || null;
  }

  return {
    id: m?.id ?? null,
    url,
    thumbnailUrl: thumb,
    mediaType,
    provider,
    title: m?.title ?? "",
    description: m?.description ?? "",
    durationSeconds: m?.durationSeconds ?? m?.duration_seconds ?? null,
    isMain: !!(m?.isMain ?? m?.is_main),
    sortOrder: Number.isFinite(Number(m?.sortOrder ?? m?.sort_order))
      ? Number(m?.sortOrder ?? m?.sort_order)
      : idx,
    eventId: m?.eventId ?? m?.event_id ?? null,
  };
}


const navActions = computed(() => {
  const list = [];

  // Voir l'annonce (toujours utile ici)
  list.push({
    key: "view",
    to: `/obituary/${slug.value}`,
    labelKey: "editObituary.actions.viewPublic",
    kind: "ghost",
  });

  // Formules (sauf si on est déjà sur /plans)
  if (!route.path.startsWith("/plans")) {
    list.push({
      key: "plans",
      to: "/plans",
      labelKey: "common.plans",
      kind: "ghost",
    });
  }

  return list;
});
const savingMedia = ref(false);

async function persistMediaAndCover({ toastOnSuccess = false } = {}) {
  if (savingMedia.value) return;
  savingMedia.value = true;

  try {
    const fullNameNow = String(form.deceasedFullName || "").trim();
    const regenSlugWanted =
      fullNameNow &&
      originalDeceasedFullName.value &&
      fullNameNow !== originalDeceasedFullName.value;

    const payload = {
      coverImageUrl: form.coverImageUrl || null,
      media: mediaItems.value.map((m, idx) => ({
        url: m.url,
        thumbnailUrl: m.thumbnailUrl || null,
        mediaType: m.mediaType || "image",
        provider: m.provider || "upload",
        title: m.title || null,
        description: m.description || null,
        durationSeconds: m.durationSeconds || null,
        isMain: !!m.isMain,
        sortOrder: idx,
        eventId: m.eventId || null,
      })),
      regenSlug: regenSlugWanted, // ✅ au bon niveau
    };

    const res = await $fetch(`/api/obituaries/${slug.value}`, {
      method: "PUT",
      body: payload,
    });

    // si le slug a changé → update route + update reference
    const newSlug = res?.slug || slug.value;
    if (newSlug !== slug.value) {
      await router.replace({ path: `/obituary/edit/${newSlug}`, query: route.query });
    }

    // si on a régénéré, on update la valeur originale pour éviter regen à chaque save
    if (regenSlugWanted) {
      originalDeceasedFullName.value = fullNameNow;
    }

    mediaDirty.value = false;
    if (toastOnSuccess && toast?.success) toast.success(t("editObituary.media.toasts.saved"));
  } catch (err) {
    const msg = err?.data?.message || err?.message || t("editObituary.media.errors.saveFailed");
    if (toast?.error) toast.error(msg);
    else console.error(msg, err);
  } finally {
    savingMedia.value = false;
  }
}
const usedExtraEventsCount = computed(() =>
  (extraEvents.value || []).filter(ev => ev.startsAt || ev.venueName || ev.venueAddress).length
);

const usedEventsCount = computed(() => 1 + usedExtraEventsCount.value);

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
    const msg = err?.data?.message || err?.message || t("editObituary.coverImage.errors.uploadFailed");
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
} = await useFetch(
  () => `/api/obituaries/${slug.value}/documents`,
  {
    key: () => `obituary-docs-${slug.value}`,
    headers: reqHeaders,
  }
);



const obituary = computed(() => obituaryPayload.value?.obituary || null);
const events = computed(() => obituaryPayload.value?.events || []);
const contacts = computed(() => obituaryPayload.value?.contacts || []);
const documents = computed(() => docsData.value?.documents || []);

// médias UI
const mediaItems = ref([]);

// -----------------------
// Plan & limits (source: pricingPlans.js)
// -----------------------
const monetization = computed(() => {
  return (
    obituaryPayload.value?.monetization ||
    obituary.value?.monetization ||
    null
  );
});

function cleanPlanCode(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

const activePlanCode = computed(() => {
  const raw =
    monetization.value?.pricingTier ||
    monetization.value?.pricing_tier ||
    monetization.value?.planCode ||
    monetization.value?.plan_code ||
    obituary.value?.pricingTier ||
    obituary.value?.pricing_tier ||
    obituary.value?.planCode ||
    obituary.value?.plan_code ||
    cleanPlanCode(route.query.plan) ||
    null;

  return cleanPlanCode(raw);
});


function planCodeOf(p) {
  return cleanPlanCode(
    p?.code ||
    p?.planCode ||
    p?.plan_code ||
    p?.pricingTier ||
    p?.pricing_tier
  );
}

function planIsFreeOf(p) {
  return !!(p?.isFree ?? p?.is_free);
}

const activePlan = computed(() => {
  const code = activePlanCode.value;
  const plans = allPlans.value || [];

  if (code) {
    const found = plans.find((p) => planCodeOf(p) === code);
    if (found) {
      // 🔧 on normalise au passage pour ton UI
      return {
        ...found,
        code: planCodeOf(found),
        isFree: planIsFreeOf(found),
        label: found.label || found.name || found.title || planCodeOf(found),
        features: found.features || found.limits || {},
      };
    }
  }

  // fallback: gratuit
  const freeIndiv = plans.find((p) => planIsFreeOf(p) && String(planCodeOf(p) || "").startsWith("indiv_"));
  const fb = freeIndiv || plans.find((p) => planIsFreeOf(p)) || plans[0] || null;

  return fb
    ? {
        ...fb,
        code: planCodeOf(fb),
        isFree: planIsFreeOf(fb),
        label: fb.label || fb.name || fb.title || planCodeOf(fb),
        features: fb.features || fb.limits || {},
      }
    : null;
});


function n(v, fallback) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

const planFeatures = computed(() => {
  const f = activePlan.value?.features || {};
  return {
    maxEvents: n(f.maxEvents ?? f.max_events, 1),
    maxPhotos: n(f.maxPhotos ?? f.max_photos, 0),
    maxVideos: n(f.maxVideos ?? f.max_videos, 0),
    maxContacts: n(f.maxContacts ?? f.max_contacts, 1),
    maxTextChars: n(f.maxTextChars ?? f.max_text_chars, null),
  };
});
watch(
  () => [activePlanCode.value, allPlans.value?.length],
  () => {
    console.log("[PLANS CHECK]", {
      activePlanCode: activePlanCode.value,
      plans: (allPlans.value || []).map(p => ({
        code: p.code,
        pricingTier: p.pricingTier,
        planCode: p.planCode,
        isFree: p.isFree,
        is_free: p.is_free,
        label: p.label,
      })),
    });
  },
  { immediate: true }
);

const limits = computed(() => ({
  maxEvents: planFeatures.value.maxEvents,
  maxPhotos: planFeatures.value.maxPhotos,
  maxVideos: planFeatures.value.maxVideos,
  maxContacts: planFeatures.value.maxContacts,
  maxTextChars: planFeatures.value.maxTextChars,
}));


const photosCount = computed(() => (mediaItems.value || []).filter((m) => m?.mediaType === 'image').length);
const videosCount = computed(() => (mediaItems.value || []).filter((m) => m?.mediaType === 'video').length);
const remainingPhotos = computed(() => Math.max(0, limits.value.maxPhotos - photosCount.value));
const remainingVideos = computed(() => Math.max(0, limits.value.maxVideos - videosCount.value));


function contactHasAny(c) {
  if (!c) return false;
  return !!(String(c.name || '').trim() || String(c.phone || '').trim() || String(c.whatsapp || '').trim() || String(c.email || '').trim());
}
const usedContactsCount = computed(() => (form.contacts || []).filter(contactHasAny).length);

const canAddContact = computed(() => (form.contacts?.length || 0) < limits.value.maxContacts);



const canAddExtraEvent = computed(() => (1 + (extraEvents.value?.length || 0)) < limits.value.maxEvents);
const canUploadMorePhotos = computed(() => remainingPhotos.value > 0);
const canAddMoreVideos = computed(() => remainingVideos.value > 0);
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
const addContact = () => {
  if (!canAddContact.value) {
    const msg = t('editObituary.limits.contactsReached', { max: limits.value.maxContacts });
    if (toast?.error) toast.error(msg);
    return;
  }
  form.contacts.push({ name: '', phone: '', whatsapp: '', email: '' });
};
const removeContact = (idx) => { if (form.contacts.length > 1) form.contacts.splice(idx, 1); };

// Events helpers
const addExtraEvent = () => {
  if (!canAddExtraEvent.value) {
    const msg = t('editObituary.limits.eventsReached', { max: limits.value.maxEvents });
    if (toast?.error) toast.error(msg);
    return;
  }
  extraEvents.value.push({ eventType: 'wake', startsAt: '', venueName: '', venueAddress: '' });
};
const removeExtraEvent = (idx) => extraEvents.value.splice(idx, 1);

// Media helpers
const setAsCover = async (m) => {
  if (!m?.url) return;
  if (m.mediaType !== "image") return; // pas de cover sur vidéo

  form.coverImageUrl = m.url;

  // ✅ un seul principal
  mediaItems.value = mediaItems.value.map((x) => ({
    ...x,
    isMain: x.url === m.url,
  }));

  await persistMediaAndCover();
};

const toggleMain = async (m) => {
  if (!m?.url) return;
  if (m.mediaType !== "image") return;

  const next = !m.isMain;
  mediaItems.value = mediaItems.value.map((x) => ({
    ...x,
    isMain: x.url === m.url ? next : false,
  }));

  // option UX: si on met principal, on en fait aussi la cover
  if (next) form.coverImageUrl = m.url;

  await persistMediaAndCover();
};

const removeMedia = async (idx) => {
  const m = mediaItems.value[idx];
  if (!m) return;

  const confirmed = await confirmStore.ask({
     title: t("editObituary.media.confirmDelete.title"),
    message: t("editObituary.media.confirmDelete.message"),
    confirmLabel: t("common.delete"),
    cancelLabel: t("common.cancel"),
  });
  if (!confirmed) return;

  mediaItems.value.splice(idx, 1);

  // si on supprime la cover, on bascule sur la prochaine image dispo
  if (form.coverImageUrl && form.coverImageUrl === m.url) {
    const nextCover = mediaItems.value.find((x) => x.mediaType === "image")?.url || "";
    form.coverImageUrl = nextCover;
  }

  await persistMediaAndCover();
};



const addExternalMedia = () => {
  const url = (externalMediaUrl.value || "").trim();
  if (!url) return;

  if (!/^https?:\/\//i.test(url)) {
     const msg = t("editObituary.media.errors.invalidLink");
    if (toast?.error) toast.error(msg);
    return;
  }
if (!canAddMoreVideos.value) {
    const msg = t('editObituary.limits.videosReached', { max: limits.value.maxVideos });
    if (toast?.error) toast.error(msg);
    return;
  }

  const provider = detectProvider(url);

  mediaItems.value.push({
    url,
    thumbnailUrl: deriveVideoThumbnail({ url, provider }) || null,
    mediaType: "video",
    provider, // youtube/vimeo/other
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
    const msg = t("editObituary.media.errors.videosUploadForbidden");
    if (toast?.error) toast.error(msg);
    else console.warn(msg);
  }
  if (!images.length) {
    if (e?.target) e.target.value = "";
    return;
  }
 // quota photos
  if (!canUploadMorePhotos.value) {
    const msg = t('editObituary.limits.photosReached', { max: limits.value.maxPhotos });
    if (toast?.error) toast.error(msg);
    if (e?.target) e.target.value = "";
    return;
  }

  const allowed = images.slice(0, remainingPhotos.value);
  const ignored = images.length - allowed.length;
  if (ignored > 0 && toast?.error) {
    toast.error(t('editObituary.limits.photosSomeIgnored', { ignored, max: limits.value.maxPhotos }));
  }
  uploadingMedia.value = true;
  try {
    for (const file of allowed) {
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
    const msg = err?.data?.message || err?.message || t("editObituary.media.errors.uploadFailed");
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

  docInlineMessage.value = "";
  docInlineTone.value = "info";

  uploadingDoc.value = true;
  try {
    // ✅ si doc du même type existe déjà -> demander remplacement
    const existing = currentDocForSelectedType.value;

    if (existing?.id) {
      const confirmedReplace = await confirmStore.ask({
        title: t("editObituary.documents.confirmReplace.title"),
        message: t("editObituary.documents.confirmReplace.message", {
          type: t(`editObituary.documents.type.labels.${docType.value}`),
        }),
        confirmLabel: t("editObituary.documents.confirmReplace.confirm"),
        cancelLabel: t("common.cancel"),
        danger: true,
      });

      if (!confirmedReplace) return;

      // on supprime l'ancien avant upload (évite uq_obidoc_unique_type)
      await $fetch(`/api/obituaries/${slug.value}/documents/${existing.id}`, {
        method: "DELETE",
      });

      await refreshDocs();
    }

    const fd = new FormData();
    fd.append("type", docType.value);
    fd.append("file", file);

    await $fetch(`/api/obituaries/${slug.value}/documents`, {
      method: "POST",
      body: fd,
    });

    await refreshDocs();

    docInlineTone.value = "success";
    docInlineMessage.value = t("editObituary.documents.inline.uploadedOk", {
      type: t(`editObituary.documents.type.labels.${docType.value}`),
    });

    if (toast?.success) toast.success(t("editObituary.documents.toasts.uploaded"));
  } catch (err) {
    const msg =
      err?.data?.message ||
      err?.message ||
      t("editObituary.documents.errors.uploadFailed");

    docInlineTone.value = "danger";
    docInlineMessage.value = msg;

    if (toast?.error) toast.error(msg);
    else console.error(msg, err);
  } finally {
    uploadingDoc.value = false;
    if (e?.target) e.target.value = "";
  }
};

const onDeleteDocument = async (d) => {
  if (!d?.id) {
    if (toast?.error) toast.error("Document invalide (id manquant).");
    return;
  }

  const confirmed = await confirmStore.ask({
    title: t("editObituary.documents.confirmDelete.title"),
    message: t("editObituary.documents.confirmDelete.message"),
    confirmLabel: t("common.delete"),
    cancelLabel: t("common.cancel"),
    danger: true,
  });

  if (!confirmed) return;

  try {
    await $fetch(`/api/obituaries/${slug.value}/documents/${d.id}`, {
      method: "DELETE",
    });

    await refreshDocs();

    if (toast?.success) toast.success(t("editObituary.documents.toasts.deleted"));
  } catch (err) {
    const msg =
      err?.data?.message ||
      err?.message ||
      t("editObituary.documents.errors.deleteFailed");
    if (toast?.error) toast.error(msg);
    else console.error("Delete document failed", err);
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
// limites plan : texte
  if (!errors.body && limits.value.maxTextChars && String(form.body || '').length > limits.value.maxTextChars) {
    errors.body = t('editObituary.limits.textTooLong', { max: limits.value.maxTextChars });
  }

  // limites plan : contacts
  if (!submitError.value && usedContactsCount.value > limits.value.maxContacts) {
    submitError.value = t('editObituary.limits.tooManyContacts', { max: limits.value.maxContacts });
  }

  // limites plan : médias
  if (!submitError.value && photosCount.value > limits.value.maxPhotos) {
    submitError.value = t('editObituary.limits.tooManyPhotos', { max: limits.value.maxPhotos });
  }
  if (!submitError.value && videosCount.value > limits.value.maxVideos) {
    submitError.value = t('editObituary.limits.tooManyVideos', { max: limits.value.maxVideos });
  }

  // limites plan : events (main + extras)
  const totalEvents = 1 + (extraEvents.value?.length || 0);
  if (!submitError.value && totalEvents > limits.value.maxEvents) {
    submitError.value = t('editObituary.limits.tooManyEvents', { max: limits.value.maxEvents });
  }
  return !errors.deceasedFullName && !errors.title && !errors.body && !errors.eventStartsAt;
};

function buildConfirmQuery() {
  const q = {};
  const plan =
    cleanPlanCode(route.query.plan) ||
    cleanPlanCode(monetization.value?.planCode || monetization.value?.plan_code) ||
    cleanPlanCode(obituary.value?.planCode || obituary.value?.plan_code) ||
    cleanPlanCode(activePlanCode.value) ||
    null;

  if (plan) q.plan = plan;
  if (route.query.audience === 'pro') q.audience = 'pro';
  return q;
}

const coverImageUrl = computed(() => form.coverImageUrl || obituary.value?.coverImageUrl || obituary.value?.cover_image_url || '');
const originalDeceasedFullName = ref("");

watch(
  obituary,
  (val) => {
    if (!val) return;
    originalDeceasedFullName.value = (val.deceasedFullName || val.deceased_full_name || "").trim();
  },
  { immediate: true }
);
watch(
  () => [activePlanCode.value, activePlan.value?.code, activePlan.value?.features],
  () => {
    console.log("[EDIT PLAN DEBUG]", {
      rawObituary: obituary.value,
      monetization: monetization.value,
      activePlanCode: activePlanCode.value,
      resolvedPlan: activePlan.value?.code,
      features: activePlan.value?.features,
      limits: limits.value,
    });
  },
  { immediate: true }
);

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
        label: idx === 0 ? t('editObituary.contacts.labels.primary') : t('editObituary.contacts.labels.secondary', { n: idx + 1 }),
        name: c.name || null,
        phone: c.phone || null,
        whatsappNumber: c.whatsapp || null,
        email: c.email || null,
        isPublic: true,
        isPrimary: idx === 0,
      };
    })
    .filter(Boolean);
const fullNameNow = String(form.deceasedFullName || "").trim();
const regenSlugWanted =
  fullNameNow &&
  originalDeceasedFullName.value &&
  fullNameNow !== originalDeceasedFullName.value;

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

  regenSlug: regenSlugWanted, // ✅ ici
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
const visible = (list) => (list || []).filter(p => p?.isPublic !== false);

const sortByOrder = (plans) =>
  [...(plans || [])].sort((a, b) => (a?.sortOrder ?? 9999) - (b?.sortOrder ?? 9999));

const individualObituaryPlans = computed(() =>
  sortByOrder(visible(plansData.value?.individualObituary || []))
);

const recommendedIndividualCode = computed(() =>
  individualObituaryPlans.value.find(p => p?.isRecommended)?.code || null
);

const resolveErrorMessage = (err) => {
  const status = err?.statusCode || err?.status;
  if (status === 404) return t('editObituary.errors.notFound');
  if (status === 403) return t('editObituary.errors.forbidden');
  return t('editObituary.errors.generic');
};

const goBackToConfirm = () => {
  router.push({ path: `/obituary/confirm/${slug.value}`, query: buildConfirmQuery() });
};
function detectProvider(url) {
  const u = String(url || "");
  if (/youtu\.be\/|youtube\.com|youtube-nocookie\.com/i.test(u)) return "youtube";
  if (/vimeo\.com/i.test(u)) return "vimeo";
  return "other";
}
/*function detectProvider(url) {
  const u = String(url || "");
  if (/youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\//i.test(u)) return "youtube";
  if (/vimeo\.com/i.test(u)) return "vimeo";
  return "other";
}*/
function parseYouTubeId(rawUrl) {
  try {
    const u = new URL(String(rawUrl || ""));
    const host = u.hostname.replace(/^www\./i, "").replace(/^m\./i, "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      // /embed/ID, /shorts/ID, /live/ID
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null;
    }
  } catch {}
  return null;
}

function youtubeThumbnailFromUrl(url) {
  const id = parseYouTubeId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}

function deriveVideoThumbnail({ url, provider }) {
  if (!url) return null;
  if (provider === "youtube") return youtubeThumbnailFromUrl(url);
  return null; // vimeo/other: via oEmbed plus tard si tu veux
}


const onSubmit = async () => {
  if (isSubmitting.value) return;
  if (!validate()) return;

  isSubmitting.value = true;
  submitError.value = '';

  const payload = buildPayload();

try {
  const res = await $fetch(`/api/obituaries/${slug.value}`, { method: "PUT", body: payload });

  const newSlug = res?.slug || slug.value;

  if (newSlug !== slug.value) {
    // on met à jour l’URL edit (sinon incohérences)
    await router.replace({ path: `/obituary/edit/${newSlug}`, query: route.query });
  }

  if (toast?.success) toast.success(t("editObituary.toasts.updated"));

  await router.push({ path: `/obituary/confirm/${newSlug}`, query: buildConfirmQuery() });
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
/* =========================
   DOCUMENTS CHECKLIST
   ========================= */

.doc-status-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.doc-status-card {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  padding: var(--space-3);
}

.doc-status-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.doc-status-card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-2);
}

/* petit message inline (succès/erreur) */
.doc-inline-message {
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface-muted);
  font-size: 13px;
}

.doc-inline-message--success {
  border-color: color-mix(in srgb, var(--color-success) 30%, var(--color-border-subtle));
  background: var(--color-success-soft);
  color: var(--color-success);
}

.doc-inline-message--danger {
  border-color: color-mix(in srgb, var(--color-danger) 35%, var(--color-border-subtle));
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

</style>



