<template>
  <div class="page-obituary">
    <section class="section">
      <div class="container-narrow">
        <div v-if="pending" class="card card-elevated">
          <div class="card-body">
            <p class="text-muted text-sm">Chargement de l’annonce…</p>
          </div>
        </div>

        <div v-else-if="error" class="card card-elevated">
          <div class="card-body">
            <h1>Annonce introuvable</h1>
            <p class="text-muted text-sm">
              Cette annonce n’existe pas ou n’est plus disponible.
            </p>
            <NuxtLink to="/" class="btn btn-secondary btn-sm mt-3">
              Retour à l’accueil
            </NuxtLink>
          </div>
        </div>

        <div
          v-else-if="obituary"
          class="card card-elevated fade-in"
          aria-labelledby="obituary-title"
        >
          <div class="card-header">
            <p class="text-xs text-soft mb-1">
              Annonce nécrologique · {{ formatAnnouncementType(obituary.announcementType) }}
            </p>
            <h1 id="obituary-title">
              {{ obituary.content.title || obituary.deceased.fullName }}
            </h1>

            <p class="text-muted text-sm mt-1">
              {{ obituary.deceased.fullName }}
              <span
                v-if="
                  obituary.deceased.dateOfBirth ||
                  obituary.deceased.dateOfDeath
                "
              >
                ·
                <span v-if="obituary.deceased.dateOfBirth">
                  {{ formatDate(obituary.deceased.dateOfBirth) }}
                </span>
                <span
                  v-if="
                    obituary.deceased.dateOfBirth &&
                    obituary.deceased.dateOfDeath
                  "
                >
                  –
                </span>
                <span v-if="obituary.deceased.dateOfDeath">
                  {{ formatDate(obituary.deceased.dateOfDeath) }}
                </span>
              </span>
              <span
                v-if="
                  obituary.deceased.ageDisplay ||
                  obituary.deceased.ageAtDeath
                "
              >
                ·
                <span v-if="obituary.deceased.ageDisplay">
                  {{ obituary.deceased.ageDisplay }}
                </span>
                <span v-else>
                  {{ obituary.deceased.ageAtDeath }} ans
                </span>
              </span>
            </p>

            <p class="text-xs text-soft mt-1">
              <span v-if="obituary.location.city">
                {{ obituary.location.city }}
                <span v-if="obituary.location.country">, </span>
              </span>
              <span v-if="obituary.location.country">
                {{ obituary.location.country }}
              </span>
              <span v-if="obituary.location.isRuralArea">
                · Zone rurale / village
              </span>
            </p>

            <p
              v-if="obituary.deceased.religion"
              class="text-xs text-soft mt-1"
            >
              <span v-if="obituary.deceased.religion === 'christian'">
                Contexte chrétien
              </span>
              <span v-else-if="obituary.deceased.religion === 'muslim'">
                Contexte musulman
              </span>
              <span v-else>Contexte religieux : autre</span>
              <span v-if="obituary.deceased.denomination">
                · {{ obituary.deceased.denomination }}
              </span>
            </p>
          </div>

          <div class="card-body">
            <!-- Texte de l'annonce -->
            <section class="mb-4" aria-label="Texte de l’annonce">
              <p class="text-base" style="white-space: pre-line;">
                {{ obituary.content.body }}
              </p>
            </section>

            <!-- Événements (veillées, obsèques, etc.) -->
            <section
              v-if="events.length"
              class="mb-4"
              aria-label="Événements liés à l’annonce"
            >
              <h2 class="section-title text-lg mb-2">
                Veillées, obsèques & hommages
              </h2>
              <div class="timeline">
                <article
                  v-for="event in events"
                  :key="event.id"
                  class="timeline-item"
                >
                  <div
                    class="timeline-badge"
                    :class="{ 'timeline-badge-main': event.isMainEvent }"
                  ></div>
                  <div class="timeline-content">
                    <p class="text-xs text-soft mb-1">
                      {{ formatEventType(event.eventType) }}
                      <span v-if="event.isMainEvent">
                        · Événement principal
                      </span>
                    </p>
                    <h3 class="card-title text-base mb-1">
                      {{ event.title }}
                    </h3>
                    <p class="text-sm text-muted mb-1">
                      {{ formattedDate(event.startsAt) }}
                      <span v-if="event.city || event.country">
                        ·
                        <span v-if="event.venueName">
                          {{ event.venueName }},
                        </span>
                        <span v-if="event.city">{{ event.city }}</span>
                        <span v-if="event.city && event.country">, </span>
                        <span v-if="event.country">{{ event.country }}</span>
                      </span>
                    </p>
                    <p
                      v-if="event.venueAddress"
                      class="text-xs text-soft mb-1"
                    >
                      {{ event.venueAddress }}
                    </p>
                    <p v-if="event.description" class="text-sm">
                      {{ event.description }}
                    </p>
                  </div>
                </article>
              </div>
            </section>

            <!-- Contacts famille -->
            <section
              v-if="familyContacts.length"
              class="mb-3"
              aria-label="Contacts de la famille ou coordination"
            >
              <h2 class="section-title text-lg mb-2">
                Contacts famille & coordination
              </h2>
              <div class="grid">
                <div
                  v-for="contact in familyContacts"
                  :key="contact.id"
                  class="card"
                >
                  <div class="card-body">
                    <p class="text-xs text-soft mb-1">
                      {{ contact.label || 'Contact' }}
                      <span v-if="contact.isPrimary"> · Principal</span>
                    </p>
                    <p class="text-sm mb-1">
                      <strong v-if="contact.name">
                        {{ contact.name }}
                      </strong>
                    </p>
                    <p v-if="contact.phone" class="text-xs text-muted">
                      Tel : {{ contact.phone }}
                    </p>
                    <p
                      v-if="contact.whatsappNumber"
                      class="text-xs text-muted"
                    >
                      WhatsApp : {{ contact.whatsappNumber }}
                    </p>
                    <p v-if="contact.email" class="text-xs text-muted">
                      Email : {{ contact.email }}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Meta -->
            <section
              class="mt-4 text-xs text-soft"
              aria-label="Informations techniques"
            >
              <p>
                Publié le
                <span v-if="obituary.publishedAt">
                  {{ formattedDate(obituary.publishedAt) }}
                </span>
                <span v-else>
                  {{ formattedDate(obituary.createdAt) }}
                </span>
                <span v-if="obituary.stats.viewCount !== null">
                  · {{ obituary.stats.viewCount }} visite<span
                    v-if="obituary.stats.viewCount > 1"
                    >s</span
                  >
                </span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const route = useRoute();
const { formatDate, formattedDate } = useDateUtils();

const slug = computed(() => route.params.slug);

const { data, pending, error } = await useAsyncData(
  () => `obituary-${slug.value}`,
  async () => {
    if (!slug.value) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Slug manquant',
      });
    }

    return $fetch('/api/obituaries/' + encodeURIComponent(slug.value));
  }
);

const obituary = computed(() => data.value?.obituary || null);
const events = computed(() => data.value?.events || []);
const familyContacts = computed(() => data.value?.contacts || []);

function formatEventType(type) {
  switch (type) {
    case 'wake':
      return 'Veillée';
    case 'funeral':
      return 'Obsèques';
    case 'burial':
      return 'Inhumation';
    case 'cremation':
      return 'Crémation';
    case 'memorial_service':
      return 'Culte d’hommage';
    default:
      return 'Cérémonie';
  }
}

function formatAnnouncementType(type) {
  switch (type) {
    case 'death':
      return 'Décès';
    case 'anniversary':
      return 'Anniversaire de décès';
    case 'memorial':
      return 'Hommage';
    default:
      return 'Annonce';
  }
}

// SEO dynamique
watchEffect(() => {
  if (!obituary.value) return;

  const title =
    obituary.value.content.title ||
    `Annonce de décès – ${obituary.value.deceased.fullName}`;

  const descParts = [];
  if (obituary.value.deceased.fullName) {
    descParts.push(obituary.value.deceased.fullName);
  }
  if (obituary.value.location.city || obituary.value.location.country) {
    descParts.push(
      [obituary.value.location.city, obituary.value.location.country]
        .filter(Boolean)
        .join(', ')
    );
  }
  if (events.value.length > 0) {
    const mainEv = events.value[0];
    if (mainEv.startsAt) {
      descParts.push(
        `Veillée ou obsèques le ${formattedDate(mainEv.startsAt)}`
      );
    }
  }

  const description = descParts.join(' · ');

  useSeoMeta({
    title: `${title} | Matanga`,
    description:
      description ||
      "Annonce de décès et veillées publiées sur Matanga, plateforme dédiée à l'Afrique, la diaspora et les Caraïbes.",
    ogTitle: title,
    ogDescription: description,
    ogType: 'article',
  });
});
</script>
