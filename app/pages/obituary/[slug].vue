<!-- pages/obituary/[slug].vue -->
<template>
  <main class="app-main fade-in">
    <!-- Fil d’Ariane / retour -->
<PageNavBar
  aria-label="Fil d’Ariane"
  :show-back-home="true"
  :show-back-list="true"
  back-list-to="/obituaries"
  :show-create="true"
  create-to="/obituary/create"
/>



    <!-- ÉTAT CHARGEMENT / ERREUR / 404 -->
    <section class="section" v-if="obituaries.loading">
      <div class="card card-muted">
        <p class="text-sm">
          {{ t('home.list.loading') }}
        </p>
      </div>
    </section>

    <section class="section" v-else-if="obituaries.error && !obituary">
      <div class="card card-muted">
        <p class="text-sm text-danger">
          {{ t('obituary.notFound') }}
        </p>
      </div>
    </section>

    <section class="section" v-else-if="!obituary">
      <div class="card card-muted">
        <p class="text-sm">
          {{ t('obituary.notFound') }}
        </p>
      </div>
    </section>

    <!-- CONTENU PRINCIPAL -->
    <section
      v-else
      class="section section--obituary"
      aria-labelledby="obituary-title"
    >
      <!-- HERO / EN-TÊTE -->
      <header class="card card-elevated obituary-hero">
       <div
    class="obituary-hero__media"
    v-if="heroImageUrl"
  >
    <img
      :src="heroImageUrl"
      class="obituary-hero__image"
      :alt="obituary.deceased?.fullName"
      loading="lazy"
    />
  </div>

        <div class="obituary-hero__content">
          <p class="obituary-hero__kicker">
            {{ announcementTypeLabel }}
          </p>

          <h1
            id="obituary-title"
            class="obituary-hero__title"
          >
            {{ obituary.deceased?.fullName || obituary.content?.title }}
          </h1>

          <p class="obituary-hero__meta text-sm text-soft">
            <span v-if="obituary.deceased?.dateOfDeath">
              {{
                t('obituary.summary.deathDate', {
                  date: formatDate(obituary.deceased.dateOfDeath),
                })
              }}
            </span>

            <span v-if="obituary.deceased?.ageDisplay">
              •
              {{
                t('obituary.summary.age', {
                  age: obituary.deceased.ageDisplay,
                })
              }}
            </span>

            <span v-if="locationLabel">
              • {{ locationLabel }}
            </span>
          </p>

          <div class="obituary-hero__badges">
            <span
              v-if="obituary.monetization?.isFree"
              class="badge badge-success"
            >
              {{ t('obituary.summary.freePlan') }}
            </span>
            <span
              v-else
              class="badge badge-neutral"
            >
              {{
                t('obituary.summary.paidPlan', {
                  tier: obituary.monetization?.pricingTier || 'pro',
                })
              }}
            </span>

            <span
              v-if="obituary.stats?.viewCount != null"
              class="badge badge-soft"
            >
              {{
                t('obituary.summary.views', {
                  count: obituary.stats.viewCount,
                })
              }}
            </span>
          </div>
          <div
  v-if="shareUrls"
  class="obituary-hero__share"
>
  <!-- Bouton principal (Web Share / copie lien) -->
  <button
    type="button"
    class="btn btn-primary btn-sm"
    @click="onShare"
  >
    {{ t('share.obituary.shareButton') }}
  </button>

  <!-- Boutons réseaux -->
  <a
    v-if="shareUrls.whatsapp"
    :href="shareUrls.whatsapp"
    target="_blank"
    rel="noopener"
    class="btn btn-ghost btn-sm"
  >
    {{ t('share.channels.whatsapp') }}
  </a>

  <a
    v-if="shareUrls.facebook"
    :href="shareUrls.facebook"
    target="_blank"
    rel="noopener"
    class="btn btn-ghost btn-sm"
  >
    {{ t('share.channels.facebook') }}
  </a>

  <a
    v-if="shareUrls.x"
    :href="shareUrls.x"
    target="_blank"
    rel="noopener"
    class="btn btn-ghost btn-sm"
  >
    {{ t('share.channels.x') }}
  </a>

  <a
    v-if="shareUrls.linkedin"
    :href="shareUrls.linkedin"
    target="_blank"
    rel="noopener"
    class="btn btn-ghost btn-sm"
  >
    {{ t('share.channels.linkedin') }}
  </a>

  <a
    v-if="shareUrls.telegram"
    :href="shareUrls.telegram"
    target="_blank"
    rel="noopener"
    class="btn btn-ghost btn-sm"
  >
    {{ t('share.channels.telegram') }}
  </a>

  <a
    v-if="shareUrls.email"
    :href="shareUrls.email"
    class="btn btn-ghost btn-sm"
  >
    {{ t('share.channels.email') }}
  </a>
</div>

          <p
            v-if="obituary.publishedAt"
            class="obituary-hero__published text-xs text-soft"
          >
            {{
              t('obituary.summary.publishedAt', {
                date: formattedDate(obituary.publishedAt),
              })
            }}
          </p>
        </div>
      </header>

      <!-- LAYOUT 2 COLONNES (MOBILE-FIRST) -->
      <div class="obituary-layout">
        <!-- COLONNE PRINCIPALE : texte + timeline + médias -->
        <div class="obituary-layout__main">
          <!-- À propos / Texte -->
          <section
            class="card"
            aria-labelledby="obituary-about-title"
          >
            <header class="card-header">
              <h2
                id="obituary-about-title"
                class="card-title"
              >
                {{ t('obituary.sections.about.title') }}
              </h2>
            </header>

            <div class="card-body">
              <p v-if="!mainBody" class="text-sm text-soft">
                {{ t('obituary.sections.about.noBody') }}
              </p>

              <div
                v-else
                class="obituary-body text-md"
              >
                <p
                  v-for="(para, index) in mainBodyParagraphs"
                  :key="index"
                  class="obituary-body__paragraph"
                >
                  {{ para }}
                </p>
              </div>
            </div>
          </section>

          <!-- Timeline des événements -->
          <section
            class="card"
            aria-labelledby="obituary-timeline-title"
          >
            <header class="card-header">
              <h2
                id="obituary-timeline-title"
                class="card-title"
              >
                {{ t('obituary.sections.timeline.title') }}
              </h2>
            </header>

            <div class="card-body">
              <p
                v-if="!events.length"
                class="text-sm text-soft"
              >
                {{ t('obituary.sections.timeline.empty') }}
              </p>

              <ol
                v-else
                class="timeline"
              >
                <li
                  v-for="event in events"
                  :key="event.id"
                  class="timeline__item"
                >
                  <div class="timeline__bullet" aria-hidden="true"></div>
                  <div class="timeline__content">
                    <p class="timeline__date text-xs text-soft">
                      <time
                        :datetime="formatDateISO(event.startsAt)"
                      >
                        {{ formatDate(event.startsAt) }}
                      </time>
                      <span v-if="event.startsAt">
                        ·
                        {{
                          t('obituary.event.at', {
                            time: formattedHourMinute(event.startsAt),
                          })
                        }}
                      </span>
                    </p>

                    <h3 class="timeline__title">
                      <span class="timeline__type">
                        {{
                          t(
                            'home.eventTypes.' +
                              (event.eventType || 'other')
                          )
                        }}
                      </span>
                      <span v-if="event.title">
                        – {{ event.title }}
                      </span>
                    </h3>

                    <p class="timeline__location text-xs text-soft">
                      <span v-if="event.venueName">
                        {{ t('obituary.event.venue') }} :
                        {{ event.venueName }}
                      </span>
                      <span v-if="event.city || event.country">
                        ·
                        {{ [event.city, event.country].filter(Boolean).join(', ') }}
                      </span>
                      <span v-if="event.isOnline">
                        · {{ t('obituary.event.online') }}
                      </span>
                    </p>

                   <p
  v-if="event.venueAddress"
  class="timeline__address text-xs text-soft"
>
  {{ t('obituary.event.address') }} : {{ event.venueAddress }}
</p>


                    <p
                      v-if="event.streamUrl"
                      class="timeline__stream text-xs"
                    >
                      <a
                        class="link"
                        :href="event.streamUrl"
                        target="_blank"
                        rel="noopener"
                      >
                        {{ t('obituary.event.stream') }}
                      </a>
                    </p>

                    <p
                      v-if="event.notes"
                      class="timeline__notes text-xs"
                    >
                      <span class="text-soft">
                        {{ t('obituary.event.notes') }} :
                      </span>
                      <span>
                        {{ event.notes }}
                      </span>
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          <!-- Médias -->
          <section
            class="card"
            aria-labelledby="obituary-media-title"
          >
            <header class="card-header">
              <h2
                id="obituary-media-title"
                class="card-title"
              >
                {{ t('obituary.sections.media.title') }}
              </h2>
            </header>

            <div class="card-body">
              <p
                v-if="!media.length"
                class="text-sm text-soft"
              >
                {{ t('obituary.sections.media.empty') }}
              </p>

              <div
                v-else
                class="media-grid"
              >
                <article
                  v-for="m in media"
                  :key="m.id"
                  class="media-card"
                >
                  <div
                    v-if="mediaThumbnail(m)"
                    class="media-card__thumb"
                  >
                    <img
                      :src="mediaThumbnail(m)"
                      :alt="m.title || m.description"
                      loading="lazy"
                    />
                  </div>

                  <div class="media-card__body">
                    <h3 class="media-card__title text-sm">
                      {{ m.title || t('obituary.sections.media.open') }}
                    </h3>
                    <p
                      v-if="m.description"
                      class="media-card__desc text-xs text-soft"
                    >
                      {{ m.description }}
                    </p>

                    <a
                      v-if="m.url"
                      class="btn btn-ghost btn-xs media-card__link"
                      :href="m.url"
                      target="_blank"
                      rel="noopener"
                    >
                      {{ t('obituary.sections.media.open') }}
                    </a>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>

        <!-- COLONNE ASIDE : résumé + contacts -->
        <aside
          class="obituary-layout__aside"
          aria-label="Informations pratiques"
        >
          <!-- Résumé structuré -->
          <section class="card card-muted">
            <header class="card-header">
              <h2 class="card-title">
                {{ t('obituary.summary.title') }}
              </h2>
            </header>

            <div class="card-body">
              <dl class="definition-list">
                <div class="definition-list__row" v-if="obituary.deceased?.dateOfDeath">
                  <dt>{{ t('obituary.summary.deathDateLabel') }}</dt>
                  <dd>
                    {{ formatDate(obituary.deceased.dateOfDeath) }}
                  </dd>
                </div>

                <div class="definition-list__row" v-if="obituary.deceased?.ageDisplay">
                  <dt>{{ t('obituary.summary.ageLabel') }}</dt>
                  <dd>{{ obituary.deceased.ageDisplay }}</dd>
                </div>

                <div class="definition-list__row" v-if="locationLabel">
                  <dt>{{ t('obituary.summary.location') }}</dt>
                  <dd>{{ locationLabel }}</dd>
                </div>

                <div class="definition-list__row" v-if="announcementTypeLabel">
                  <dt>{{ t('obituary.summary.announcementType') }}</dt>
                  <dd>{{ announcementTypeLabel }}</dd>
                </div>

                <div class="definition-list__row" v-if="obituary.monetization">
                  <dt>{{ t('obituary.summary.plan') }}</dt>
                  <dd>
                    <span v-if="obituary.monetization.isFree">
                      {{ t('obituary.summary.freePlan') }}
                    </span>
                    <span v-else>
                      {{
                        t('obituary.summary.paidPlan', {
                          tier: obituary.monetization.pricingTier || 'pro',
                        })
                      }}
                    </span>
                  </dd>
                </div>

                <div class="definition-list__row" v-if="obituary.stats?.viewCount != null">
                  <dt>{{ t('obituary.summary.viewsLabel') }}</dt>
                  <dd>
                    {{
                      t('obituary.summary.views', {
                        count: obituary.stats.viewCount,
                      })
                    }}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <!-- Contacts -->
          <section
            class="card"
            aria-labelledby="obituary-contacts-title"
          >
            <header class="card-header">
              <h2
                id="obituary-contacts-title"
                class="card-title"
              >
                {{ t('obituary.sections.contacts.title') }}
              </h2>
            </header>

            <div class="card-body">
              <p
                v-if="!contacts.length"
                class="text-sm text-soft"
              >
                {{ t('obituary.sections.contacts.empty') }}
              </p>

              <ul
                v-else
                class="contact-list"
              >
                <li
                  v-for="c in contacts"
                  :key="c.id"
                  class="contact-card"
                >
                  <p class="contact-card__label text-xs text-soft">
                    {{ c.label }}
                  </p>
                  <p class="contact-card__name text-sm">
                    {{ c.name }}
                  </p>

                  <p
                    v-if="c.region || c.city || c.country"
                    class="contact-card__region text-xs text-soft"
                  >
                    {{
                      [c.region, c.city, c.country].filter(Boolean).join(' · ')
                    }}
                  </p>

                  <dl class="contact-card__details">
                    <div v-if="c.phone" class="contact-card__detail">
                      <dt>{{ t('obituary.sections.contacts.phone') }}</dt>
                      <dd>
                        <a :href="`tel:${c.phone}`" class="link">
                          {{ c.phone }}
                        </a>
                      </dd>
                    </div>
                     <div v-if="c.whatsappNumber" class="contact-card__detail">
  <dt>{{ t('obituary.sections.contacts.whatsapp') }}</dt>
  <dd>
    <a
      class="link"
      :href="`https://wa.me/${normalizePhoneForWhatsApp(c.whatsappNumber)}`"
      target="_blank"
      rel="noopener"
    >
      {{ c.whatsappNumber }}
    </a>
  </dd>
</div>



                    <div v-if="c.email" class="contact-card__detail">
                      <dt>{{ t('obituary.sections.contacts.email') }}</dt>
                      <dd>
                        <a
                          class="link"
                          :href="`mailto:${c.email}`"
                        >
                          {{ c.email }}
                        </a>
                      </dd>
                    </div>
                  </dl>
                </li>
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useSeoMeta } from '#imports';
import { useI18n } from 'vue-i18n';
import { useObituariesStore } from '~/stores/obituaries';
import { useDateUtils } from '~/composables/useDateUtils';
import { useShareObituary } from '~/composables/useShareObituary';
import PageNavBar from '~/components/PageNavBar.vue';

const { t } = useI18n();
const route = useRoute();
const obituaries = useObituariesStore();
const {
  formatDate,
  formattedDate,
  formatDateISO,
  timeAgo,
  formattedHourMinute,
} = useDateUtils();

// --- Chargement des données ---
const slug = computed(() => route.params.slug);

// on charge l’annonce si besoin
if (!obituaries.currentObituary || obituaries.currentObituary?.slug !== slug.value) {
  await obituaries.fetchOne(slug.value);
}

// --- Normalisation de la forme de la réponse ---
// on accepte soit { obituary, events, contacts, media } soit un objet obituary avec .events etc.
const raw = computed(() => obituaries.currentObituary || null);

const normalized = computed(() => {
  const val = raw.value;
  if (!val) {
    return {
      obituary: null,
      events: [],
      contacts: [],
      media: [],
    };
  }

  if ('obituary' in val || 'events' in val || 'contacts' in val || 'media' in val) {
    return {
      obituary: val.obituary || null,
      events: val.events || [],
      contacts: val.contacts || [],
      media: val.media || [],
    };
  }

  return {
    obituary: val,
    events: val.events || [],
    contacts: val.contacts || [],
    media: val.media || [],
  };
});

const obituary = computed(() => normalized.value.obituary);
const events = computed(() => {
  const list = normalized.value.events || [];
  return [...list]
    .sort((a, b) => {
      const da = new Date(a.startsAt || a.starts_at || 0).getTime();
      const db = new Date(b.startsAt || b.starts_at || 0).getTime();
      return da - db;
    })
    .map((e) => ({
      id: e.id,
      eventType: e.eventType || e.event_type || 'other',
      title: e.title,
      description: e.description,
      startsAt: e.startsAt || e.starts_at,
      endsAt: e.endsAt || e.ends_at,
      timezone: e.timezone,
      city: e.city,
      region: e.region,
      country: e.country,
      countryCode: e.countryCode || e.country_code,
      venueName: e.venueName || e.venue_name,
      venueAddress: e.venueAddress || e.venue_address,
      streamUrl: e.streamUrl || e.stream_url,
      isOnline: !!e.isOnline || !!e.is_online || !!e.isOnlineOnly || !!e.is_online_only,
      isMainEvent: !!e.isMainEvent || !!e.is_main_event,
      notes: e.notes,
    }));
});



const contacts = computed(() => normalized.value.contacts || []);
const media = computed(() => normalized.value.media || []);

const heroImageUrl = computed(() => {
  if (obituary.value?.coverImageUrl) return obituary.value.coverImageUrl;
  const main = media.value.find((m) => m.isMain && m.mediaType === 'image');
  if (main?.thumbnailUrl) return main.thumbnailUrl;
  if (main?.url) return main.url;
  const firstImage = media.value.find((m) => m.mediaType === 'image');
  if (firstImage?.thumbnailUrl) return firstImage.thumbnailUrl;
  if (firstImage?.url) return firstImage.url;
  return null;
});


// --- Corps de texte ---
const mainBody = computed(() => {
  if (!obituary.value) return '';
  return (
    obituary.value.content?.body ||
    obituary.value.content?.bodyText ||
    obituary.value.body ||
    ''
  );
});

const mainBodyParagraphs = computed(() =>
  mainBody.value
    ? mainBody.value.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : []
);

// --- Labels, localisation, annonce ---
const locationLabel = computed(() => {
  if (!obituary.value?.location) return '';
  const loc = obituary.value.location;
  return [loc.city, loc.region, loc.country].filter(Boolean).join(' · ');
});

const announcementTypeLabel = computed(() => {
  const type =
    obituary.value?.announcementType || obituary.value?.announcement_type;
  if (!type) return t('obituary.announcementTypes.death');
  return t('obituary.announcementTypes.' + type, t('obituary.announcementTypes.other'));
});

// --- Média thumbnail ---
const mediaThumbnail = (m) => {
  return m.thumbnailUrl || m.thumbnail_url || m.url || null;
};

// --- Contacts helpers ---
const normalizePhoneForWhatsApp = (value) => {
  if (!value) return '';
  return String(value).replace(/[^0-9]/g, '');
};

// --- SEO ---
const seoTitle = computed(() => {
  const name = obituary.value?.deceased?.fullName || obituary.value?.content?.title || '';
  if (!name) return t('home.meta.title');
  return t('obituary.meta.titlePattern', { name });
});

const seoDescription = computed(() => {
  const name = obituary.value?.deceased?.fullName || '';
  const loc = locationLabel.value;
  if (!name) return t('home.meta.description');

  const locationSuffix = loc ? ` – ${loc}` : '';

  return t('obituary.meta.descriptionPattern', {
    name,
    locationSuffix,
  });
});
const { shareObituary, buildShareUrls } = useShareObituary();

const shareUrls = computed(() =>
  obituary.value ? buildShareUrls(obituary.value) : null
);

const onShare = async () => {
  if (!obituary.value) return;
  const result = await shareObituary(obituary.value);

  // À brancher sur ton système de toast si tu en as un
  // ex.:
  // if (result.ok && result.method === 'clipboard') {
  //   $toast.success(t('share.obituary.clipboardSuccess'));
  // } else if (!result.ok && result.method === 'native') {
  //   $toast.error(t('share.obituary.nativeError'));
  // }
};

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
});
</script>

<style scoped>
.link-back {
  font-size: 0.9rem;
  color: var(--color-text-soft);
  text-decoration: none;
}
.link-back:hover {
  color: var(--color-accent-strong);
  text-decoration: underline;
}

/* HERO */
.obituary-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  overflow: hidden;
}

.obituary-hero__media {
  border-radius: var(--radius-lg);
  overflow: hidden;
  max-height: 260px;
}

.obituary-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.obituary-hero__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.obituary-hero__kicker {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-soft);
  margin: 0;
}

.obituary-hero__title {
  margin: 0;
  font-size: 1.5rem;
}

.obituary-hero__meta {
  margin: 0;
}

.obituary-hero__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.obituary-hero__published {
  margin: 0;
}

/* Layout 2 colonnes */
.obituary-layout {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.obituary-layout__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.obituary-layout__aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Corps de texte */
.obituary-body__paragraph {
  margin: 0 0 var(--space-3);
  line-height: 1.6;
}

/* Timeline */
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}

.timeline__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  position: relative;
}

.timeline__item::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--color-border-subtle);
}

.timeline__item:last-child::before {
  height: 14px;
}

.timeline__bullet {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid var(--color-accent);
  background: var(--color-surface);
  margin-top: 2px;
  z-index: 1;
}

.timeline__content {
  padding-left: 2px;
}

.timeline__date {
  margin: 0 0 2px;
}

.timeline__title {
  margin: 0 0 2px;
  font-size: 0.95rem;
}

.timeline__type {
  font-weight: 600;
}

.timeline__location,
.timeline__address,
.timeline__stream,
.timeline__notes {
  margin: 0 0 2px;
}

/* Médias */
.media-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.media-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.1fr 2fr;
}

.media-card__thumb {
  background: var(--color-surface-muted);
  max-height: 120px;
}

.media-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-card__body {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.media-card__title {
  margin: 0;
}

.media-card__desc {
  margin: 0;
}

.media-card__link {
  margin-top: auto;
}

/* Contacts */
.contact-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.contact-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  padding: var(--space-3);
}

.contact-card__label {
  margin: 0 0 2px;
}

.contact-card__name {
  margin: 0 0 2px;
  font-weight: 600;
}

.contact-card__region {
  margin: 0 0 var(--space-2);
}

.contact-card__details {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
  margin: 0;
}

.contact-card__detail {
  display: flex;
  gap: 6px;
  font-size: 0.85rem;
}

.contact-card__detail dt {
  font-weight: 500;
}

.contact-card__detail dd {
  margin: 0;
}

/* Definition list (résumé) */
.definition-list {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.definition-list__row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 6px;
  font-size: 0.9rem;
}

.definition-list__row dt {
  margin: 0;
  color: var(--color-text-soft);
}

.definition-list__row dd {
  margin: 0;
}

/* LIENS */
.link {
  color: var(--color-accent-strong);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}

/* RWD */
@media (min-width: 768px) {
  .obituary-hero {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.8fr);
    align-items: stretch;
  }

  .obituary-layout {
    grid-template-columns: minmax(0, 2.1fr) minmax(0, 1.3fr);
  }

  .media-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.obituary-hero__share {
  margin-top: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.section-header--nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.section-header__left {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.section-header__right {
  display: flex;
  flex-shrink: 0;
}

.link-back--secondary {
  opacity: 0.85;
}
.link-back--secondary:hover {
  opacity: 1;
}

</style>
