<!-- pages/admin/obituary/[slug].vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Espace modération"
      :show-back-home="true"
      :show-back-list="true"
      back-list-to="/admin/obituaries"
      :show-create="false"
      :actions="navActions"
    />

    <!-- Loading / error -->
    <section class="section" v-if="pending">
      <div class="card card-muted">
        <p class="text-sm">Chargement…</p>
      </div>
    </section>

    <section class="section" v-else-if="error || !obituary">
      <div class="card card-muted">
        <p class="text-sm text-danger">
          {{ errorStatus === 403 ? "Accès refusé (admin/modérateur requis)." : "Annonce introuvable." }}
        </p>
      </div>
    </section>

    <!-- CONTENU -->
    <section v-else class="section section--obituary" aria-labelledby="obituary-title">
      <!-- HERO / EN-TÊTE -->
      <header class="card card-elevated obituary-hero">
        <div class="obituary-hero__media" v-if="heroImageUrl">
          <img
            :src="heroImageUrl"
            class="obituary-hero__image"
            :alt="obituary.deceased?.fullName || obituary.content?.title || ''"
            loading="lazy"
          />
        </div>

        <div class="obituary-hero__content">
          <p class="obituary-hero__kicker">
            {{ announcementTypeLabel }}
          </p>

          <h1 id="obituary-title" class="obituary-hero__title">
            {{ obituary.deceased?.fullName || obituary.content?.title || "—" }}
          </h1>

          <p class="obituary-hero__meta text-sm text-soft">
            <span v-if="obituary.deceased?.dateOfDeath">
              Décès : {{ formatDate(obituary.deceased.dateOfDeath) }}
            </span>
            <span v-if="obituary.deceased?.ageDisplay"> • Âge : {{ obituary.deceased.ageDisplay }}</span>
            <span v-if="locationLabel"> • {{ locationLabel }}</span>
          </p>

          <div class="obituary-hero__badges">
            <span class="badge badge-soft">
              Statut: {{ obituary.status || "—" }}
            </span>

            <span class="badge" :class="verificationBadgeClass(obituary.verificationStatus)">
              Vérif: {{ obituary.verificationStatus || "—" }}
            </span>

            <span v-if="obituary.monetization?.pricingTier" class="badge badge-neutral">
              Plan: {{ obituary.monetization.pricingTier }}
            </span>
          </div>

          <div class="obituary-hero__actions">
            <NuxtLink
              v-if="obituary.slug"
              class="btn btn-ghost btn-sm"
              :to="`/obituary/${obituary.slug}`"
              target="_blank"
            >
              Voir public
            </NuxtLink>

            <NuxtLink
              v-if="obituary.slug"
              class="btn btn-ghost btn-sm"
              :to="`/obituary/confirm/${obituary.slug}`"
              target="_blank"
            >
              Voir récap famille
            </NuxtLink>

            <NuxtLink
              v-if="obituary.slug"
              class="btn btn-ghost btn-sm"
              :to="`/obituary/edit/${obituary.slug}`"
              target="_blank"
            >
              Ouvrir en édition
            </NuxtLink>
          </div>

          <!-- Actions globales verification (optionnel mais utile) -->
          <div class="inline-row" style="gap:.5rem; flex-wrap:wrap; margin-top:.6rem;">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="savingVerification"
              @click="setOverallVerification('verify')"
            >
              Valider (global)
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              :disabled="savingVerification"
              @click="setOverallVerification('reject')"
            >
              Refuser (global)
            </button>
          </div>

          <p v-if="verificationMessage" class="text-xs" :class="verificationMessageTone === 'danger' ? 'text-danger' : 'text-soft'" style="margin-top:.35rem;">
            {{ verificationMessage }}
          </p>
        </div>
      </header>

      <!-- LAYOUT -->
      <div class="obituary-layout">
        <!-- MAIN -->
        <div class="obituary-layout__main">
          <!-- Texte -->
          <section class="card" aria-labelledby="obituary-about-title">
            <header class="card-header">
              <h2 id="obituary-about-title" class="card-title">À propos</h2>
            </header>

            <div class="card-body">
              <p v-if="!mainBody" class="text-sm text-soft">Aucun texte.</p>
              <div v-else class="obituary-body text-md">
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

          <!-- Timeline -->
          <section class="card" aria-labelledby="obituary-timeline-title">
            <header class="card-header">
              <h2 id="obituary-timeline-title" class="card-title">Cérémonies</h2>
            </header>

            <div class="card-body">
              <p v-if="!events.length" class="text-sm text-soft">Aucun événement.</p>

              <ol v-else class="timeline">
                <li v-for="e in events" :key="e.id || e.startsAt" class="timeline__item">
                  <div class="timeline__bullet" aria-hidden="true"></div>
                  <div class="timeline__content">
                    <p class="timeline__date text-xs text-soft">
                      <time :datetime="formatDateISO(e.startsAt)">
                        {{ formatDate(e.startsAt) }}
                      </time>
                      <span v-if="e.startsAt"> · {{ formatHourMinute(e.startsAt) }}</span>
                    </p>

                    <h3 class="timeline__title">
                      <span class="timeline__type">{{ e.eventType || "other" }}</span>
                      <span v-if="e.title"> – {{ e.title }}</span>
                    </h3>

                    <p class="timeline__location text-xs text-soft">
                      <span v-if="e.venueName">Lieu : {{ e.venueName }}</span>
                      <span v-if="e.city || e.country"> · {{ [e.city, e.country].filter(Boolean).join(", ") }}</span>
                    </p>

                    <p v-if="e.venueAddress" class="timeline__address text-xs text-soft">
                      Adresse : {{ e.venueAddress }}
                    </p>

                    <p v-if="e.streamUrl" class="timeline__stream text-xs">
                      <a class="link" :href="e.streamUrl" target="_blank" rel="noopener">Lien streaming</a>
                    </p>

                    <p v-if="e.notes" class="timeline__notes text-xs">
                      <span class="text-soft">Note : </span>{{ e.notes }}
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          <!-- Médias -->
          <section class="card" aria-labelledby="obituary-media-title">
            <header class="card-header">
              <h2 id="obituary-media-title" class="card-title">Médias</h2>
            </header>

            <div class="card-body">
              <p v-if="!media.length" class="text-sm text-soft">Aucun média.</p>

              <div v-else class="media-grid">
                <article v-for="m in media" :key="m.id || m.url" class="media-card">
                  <div v-if="mediaThumbnail(m)" class="media-card__thumb">
                    <img :src="mediaThumbnail(m)" :alt="m.title || m.description || ''" loading="lazy" />
                  </div>

                  <div class="media-card__body">
                    <h3 class="media-card__title text-sm">
                      {{ m.title || "Fichier" }}
                    </h3>
                    <p v-if="m.description" class="media-card__desc text-xs text-soft">
                      {{ m.description }}
                    </p>

                    <a v-if="m.url" class="btn btn-ghost btn-xs media-card__link" :href="m.url" target="_blank" rel="noopener">
                      Ouvrir
                    </a>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <!-- ✅ MODÉRATION DOCS -->
          <section class="card" aria-label="Modération documents">
            <header class="card-header">
              <h2 class="card-title">Modération (documents)</h2>
              <p class="text-xs text-soft" style="margin:0;">
                Les fichiers sont servis via tes endpoints sécurisés (ACL owner/admin/modo).
              </p>
            </header>

            <div class="card-body">
              <p v-if="docsPending" class="text-sm text-soft">Chargement documents…</p>
              <p v-else-if="docsError" class="text-sm text-danger">Erreur documents.</p>

              <template v-else>
                <p v-if="!documents.length" class="text-sm text-soft">Aucun document.</p>

                <ul v-else class="doc-list">
                  <li v-for="d in documents" :key="d.id" class="doc-item">
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      @click="selectDoc(d)"
                    >
                      {{ docTypeLabel(d.type) }}
                      ·
                      <span class="badge" :class="docStatusClass(d.status)">
                        {{ docStatusLabel(d.status) }}
                      </span>
                    </button>

                    <a class="btn btn-ghost btn-sm" :href="d.fileUrl" target="_blank" rel="noopener">
                      Ouvrir
                    </a>
                  </li>
                </ul>

                <div v-if="selectedDoc" style="margin-top: .9rem;">
                  <div class="card card-muted" style="padding:.6rem;">
                    <p class="text-xs text-soft" style="margin:0 0 .35rem;">
                      Aperçu : <strong>{{ docTypeLabel(selectedDoc.type) }}</strong>
                      ·
                      <span class="badge" :class="docStatusClass(selectedDoc.status)">
                        {{ docStatusLabel(selectedDoc.status) }}
                      </span>
                      <span v-if="selectedDocContentType"> · {{ selectedDocContentType }}</span>
                    </p>

                    <!-- Preview -->
                    <iframe
                      v-if="isPdfSelected"
                      :src="selectedDoc.fileUrl"
                      style="width:100%; height:360px; border:0; border-radius:.5rem;"
                    />
                    <img
                      v-else-if="isImageSelected"
                      :src="selectedDoc.fileUrl"
                      alt=""
                      style="width:100%; max-height:420px; object-fit:contain; border-radius:.5rem; display:block;"
                    />
                    <iframe
                      v-else
                      :src="selectedDoc.fileUrl"
                      style="width:100%; height:360px; border:0; border-radius:.5rem;"
                    />
                  </div>

                  <div style="margin-top:.6rem;">
                    <label class="form-label">Note admin (optionnel)</label>
                    <textarea v-model.trim="adminNote" class="form-control form-control--textarea" rows="3" />
                  </div>

                  <div class="inline-row" style="gap:.5rem; flex-wrap:wrap; margin-top:.6rem;">
                    <button class="btn btn-primary btn-sm" type="button" :disabled="savingDoc" @click="setDocStatus('accepted')">
                      Valider
                    </button>
                    <button class="btn btn-danger btn-sm" type="button" :disabled="savingDoc" @click="setDocStatus('rejected')">
                      Refuser
                    </button>
                    <button class="btn btn-ghost btn-sm" type="button" :disabled="savingDoc" @click="setDocStatus('under_review')">
                      En revue
                    </button>
                    <a class="btn btn-ghost btn-sm" :href="selectedDoc.fileUrl" target="_blank" rel="noopener">
                      Ouvrir (onglet)
                    </a>
                  </div>

                  <p v-if="docInlineMessage" class="text-xs" :class="docInlineTone === 'danger' ? 'text-danger' : 'text-soft'" style="margin-top:.35rem;">
                    {{ docInlineMessage }}
                  </p>
                </div>
              </template>
            </div>
          </section>
        </div>

        <!-- ASIDE -->
        <aside class="obituary-layout__aside" aria-label="Résumé">
          <section class="card card-muted">
            <header class="card-header">
              <h2 class="card-title">Résumé</h2>
            </header>

            <div class="card-body">
              <dl class="definition-list">
                <div class="definition-list__row" v-if="obituary.createdAt">
                  <dt>Créé</dt>
                  <dd>{{ formatDateTime(obituary.createdAt) }}</dd>
                </div>
                <div class="definition-list__row" v-if="obituary.publishedAt">
                  <dt>Publié</dt>
                  <dd>{{ formatDateTime(obituary.publishedAt) }}</dd>
                </div>
                <div class="definition-list__row" v-if="obituary.user?.email">
                  <dt>Famille</dt>
                  <dd><strong>{{ obituary.user.email }}</strong></dd>
                </div>
              </dl>
            </div>
          </section>

          <!-- Contacts -->
          <section class="card" aria-labelledby="obituary-contacts-title">
            <header class="card-header">
              <h2 id="obituary-contacts-title" class="card-title">Contacts</h2>
            </header>

            <div class="card-body">
              <p v-if="!contacts.length" class="text-sm text-soft">Aucun contact.</p>

              <ul v-else class="contact-list">
                <li v-for="c in contacts" :key="c.id || c.email || c.phone" class="contact-card">
                  <p class="contact-card__label text-xs text-soft">{{ c.label }}</p>
                  <p class="contact-card__name text-sm">{{ c.name }}</p>

                  <dl class="contact-card__details">
                    <div v-if="c.phone" class="contact-card__detail">
                      <dt>Tél</dt>
                      <dd><a class="link" :href="`tel:${c.phone}`">{{ c.phone }}</a></dd>
                    </div>
                    <div v-if="c.whatsappNumber" class="contact-card__detail">
                      <dt>WhatsApp</dt>
                      <dd>
                        <a class="link" :href="`https://wa.me/${normalizePhone(c.whatsappNumber)}`" target="_blank" rel="noopener">
                          {{ c.whatsappNumber }}
                        </a>
                      </dd>
                    </div>
                    <div v-if="c.email" class="contact-card__detail">
                      <dt>Email</dt>
                      <dd><a class="link" :href="`mailto:${c.email}`">{{ c.email }}</a></dd>
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
definePageMeta({ middleware: ["auth"] });

import { computed, ref } from "vue";
import { useRoute, useFetch, useRequestHeaders } from "#imports";
import PageNavBar from "~/components/PageNavBar.vue";

// --- route
const route = useRoute();
const slug = computed(() => route.params.slug);

// SSR cookies (important pour ACL docs en SSR)
const reqHeaders = process.server ? useRequestHeaders(["cookie"]) : undefined;

// --- Fetch obituary (admin endpoint conseillé)
const {
  data: dataObit,
  pending,
  error,
  refresh,
} = await useFetch(
  () => `/api/admin/obituaries/slug/${encodeURIComponent(String(slug.value || ""))}`,
  {
    key: () => `admin-obituary-${slug.value}`,
    headers: reqHeaders,
  }
);

const errorStatus = computed(() => error.value?.statusCode || error.value?.status || null);

// Normalisation obituary payload
function safeJson(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return null; }
}

const normalized = computed(() => {
  const val = dataObit.value || null;
  if (!val) return { obituary: null, events: [], contacts: [], media: [] };

  if ("obituary" in val || "events" in val || "contacts" in val || "media" in val) {
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

const obituary = computed(() => {
  const o = normalized.value.obituary;
  if (!o) return null;

  // si certains champs DB arrivent en JSON string
  return {
    ...o,
    deceased: safeJson(o.deceased) || o.deceased || null,
    location: safeJson(o.location) || o.location || null,
    content: safeJson(o.content) || o.content || null,
  };
});

const events = computed(() => {
  const list = normalized.value.events || [];
  return [...list].sort((a, b) => {
    const da = new Date(a.startsAt || a.starts_at || 0).getTime();
    const db = new Date(b.startsAt || b.starts_at || 0).getTime();
    return da - db;
  }).map((e, idx) => ({
    id: e.id ?? idx,
    eventType: e.eventType || e.event_type || "other",
    title: e.title || null,
    startsAt: e.startsAt || e.starts_at || null,
    venueName: e.venueName || e.venue_name || null,
    venueAddress: e.venueAddress || e.venue_address || null,
    city: e.city || null,
    country: e.country || null,
    streamUrl: e.streamUrl || e.stream_url || null,
    notes: e.notes || null,
  }));
});

const contacts = computed(() => normalized.value.contacts || []);
const media = computed(() => normalized.value.media || []);

// --- UI helpers (dates)
function pad2(n) { return String(n).padStart(2, "0"); }
function formatDateISO(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}
function formatHourMinute(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

// --- Labels
const locationLabel = computed(() => {
  const o = obituary.value;
  if (!o) return "";
  const loc = o.location || {};
  return [loc.city, loc.region, loc.country].filter(Boolean).join(" · ");
});

const announcementTypeLabel = computed(() => {
  const o = obituary.value;
  const type = o?.announcementType || o?.announcement_type;
  return type ? String(type) : "Annonce";
});

// --- Hero image resolution (cover > main image > first image)
const heroImageUrl = computed(() => {
  const o = obituary.value;
  if (!o) return null;

  if (o.coverImageUrl || o.cover_image_url) return o.coverImageUrl || o.cover_image_url;

  const list = media.value || [];
  const isImage = (m) => (m.mediaType || m.media_type) === "image";

  const main = list.find((m) => (m.isMain || m.is_main) && isImage(m));
  if (main?.thumbnailUrl || main?.thumbnail_url) return main.thumbnailUrl || main.thumbnail_url;
  if (main?.url) return main.url;

  const first = list.find(isImage);
  if (first?.thumbnailUrl || first?.thumbnail_url) return first.thumbnailUrl || first.thumbnail_url;
  if (first?.url) return first.url;

  return null;
});

const mediaThumbnail = (m) => m?.thumbnailUrl || m?.thumbnail_url || m?.url || null;

// --- Body
const mainBody = computed(() => {
  const o = obituary.value;
  if (!o) return "";
  return o.content?.body || o.content?.bodyText || o.body || o.content || "";
});
const mainBodyParagraphs = computed(() =>
  mainBody.value
    ? String(mainBody.value).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : []
);

// --- Navbar actions
const navActions = computed(() => [
  { key: "refresh", label: "Rafraîchir", kind: "ghost", onClick: () => refresh?.() },
]);

// --- Docs fetch (tes endpoints EXISTANTS)
const {
  data: docsData,
  pending: docsPending,
  error: docsError,
  refresh: refreshDocs,
} = await useFetch(
  () => `/api/obituaries/${encodeURIComponent(String(slug.value || ""))}/documents`,
  {
    key: () => `admin-docs-${slug.value}`,
    headers: reqHeaders,
  }
);

const documents = computed(() => docsData.value?.documents || []);

// --- Doc moderation UI state
const selectedDoc = ref(null);
const selectedDocContentType = ref("");
const adminNote = ref("");
const savingDoc = ref(false);
const docInlineMessage = ref("");
const docInlineTone = ref("info"); // info | danger

const isPdfSelected = computed(() => /application\/pdf/i.test(selectedDocContentType.value || ""));
const isImageSelected = computed(() => /^image\//i.test(selectedDocContentType.value || ""));

async function sniffContentType(url) {
  try {
    const res = await fetch(url, { method: "HEAD", credentials: "include" });
    if (!res.ok) return "";
    return res.headers.get("content-type") || "";
  } catch {
    return "";
  }
}

async function selectDoc(d) {
  selectedDoc.value = d;
  adminNote.value = d?.adminNote || "";
  docInlineMessage.value = "";
  docInlineTone.value = "info";

  const ct = await sniffContentType(d.fileUrl);
  selectedDocContentType.value = ct || "";
}

function docStatusClass(status) {
  if (status === "accepted") return "badge-success";
  if (status === "rejected") return "badge-warning";
  if (status === "under_review") return "badge-neutral";
  return "badge-soft";
}

function docStatusLabel(status) {
  if (status === "accepted") return "accepted";
  if (status === "rejected") return "rejected";
  if (status === "under_review") return "under_review";
  return status || "missing";
}

function docTypeLabel(type) {
  if (type === "id_card") return "Pièce d’identité";
  if (type === "death_certificate") return "Certificat de décès";
  if (type === "other") return "Autre";
  return type || "Document";
}

// --- POST doc moderation (à créer côté API)
async function setDocStatus(status) {
  if (!selectedDoc.value?.id) return;
  if (savingDoc.value) return;

  savingDoc.value = true;
  docInlineMessage.value = "";

  try {
    await $fetch(`/api/admin/obituaries/${encodeURIComponent(String(slug.value || ""))}/documents/${selectedDoc.value.id}`, {
      method: "POST",
      body: {
        status,
        adminNote: adminNote.value ? String(adminNote.value).trim() : null,
      },
    });

    docInlineTone.value = "info";
    docInlineMessage.value = "Document mis à jour.";

    await refreshDocs();
    // refresh selectedDoc from latest list
    const updated = (documents.value || []).find((x) => x.id === selectedDoc.value.id);
    if (updated) selectedDoc.value = updated;
  } catch (err) {
    docInlineTone.value = "danger";
    docInlineMessage.value = err?.data?.message || err?.message || "Erreur lors de la mise à jour du document.";
  } finally {
    savingDoc.value = false;
  }
}

// --- Overall verification (réutilise ton endpoint existant de la liste admin)
const savingVerification = ref(false);
const verificationMessage = ref("");
const verificationMessageTone = ref("info"); // info | danger

function verificationBadgeClass(vs) {
  if (vs === "verified") return "badge-success";
  if (vs === "rejected") return "badge-warning";
  if (vs === "pending") return "badge-neutral";
  return "badge-soft";
}

async function setOverallVerification(action) {
  if (!obituary.value?.id) return;
  if (savingVerification.value) return;

  savingVerification.value = true;
  verificationMessage.value = "";

  try {
    let note = null;
    if (action === "reject") {
      note = window.prompt("Raison du refus (optionnel) :", "") || null;
    }

    await $fetch(`/api/admin/obituaries/${obituary.value.id}/verification`, {
      method: "POST",
      body: { action, note },
    });

    verificationMessageTone.value = "info";
    verificationMessage.value = action === "verify" ? "Annonce validée." : "Annonce refusée.";

    await refresh?.();
  } catch (err) {
    verificationMessageTone.value = "danger";
    verificationMessage.value = err?.data?.message || err?.message || "Erreur action vérification.";
  } finally {
    savingVerification.value = false;
  }
}

function normalizePhone(v) {
  return String(v || "").replace(/[^0-9]/g, "");
}
</script>

<style scoped>
/* === Styles copiés / cohérents avec la page publique === */
.link { color: var(--color-accent-strong); text-decoration: none; }
.link:hover { text-decoration: underline; }

/* HERO */
.obituary-hero { display: grid; grid-template-columns: 1fr; gap: var(--space-4); overflow: hidden; }
.obituary-hero__media { border-radius: var(--radius-lg); overflow: hidden; max-height: 260px; }
.obituary-hero__image { width: 100%; height: 100%; object-fit: cover; display: block; }
.obituary-hero__content { display: flex; flex-direction: column; gap: var(--space-2); }
.obituary-hero__kicker { font-size: .85rem; text-transform: uppercase; letter-spacing: .08em; color: var(--color-text-soft); margin: 0; }
.obituary-hero__title { margin: 0; font-size: 1.5rem; }
.obituary-hero__meta { margin: 0; }
.obituary-hero__badges { display: flex; flex-wrap: wrap; gap: .35rem; }
.obituary-hero__actions { margin-top: var(--space-3); display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }

/* Layout */
.obituary-layout { margin-top: var(--space-4); display: grid; grid-template-columns: 1fr; gap: var(--space-4); }
.obituary-layout__main { display: flex; flex-direction: column; gap: var(--space-4); }
.obituary-layout__aside { display: flex; flex-direction: column; gap: var(--space-4); }

/* Texte */
.obituary-body__paragraph { margin: 0 0 var(--space-3); line-height: 1.6; }

/* Timeline */
.timeline { list-style: none; margin: 0; padding: 0; position: relative; }
.timeline__item { display: grid; grid-template-columns: auto 1fr; gap: var(--space-3); padding-bottom: var(--space-4); position: relative; }
.timeline__item::before { content:""; position:absolute; left:7px; top:0; width:2px; height:100%; background: var(--color-border-subtle); }
.timeline__item:last-child::before { height: 14px; }
.timeline__bullet { width: 14px; height: 14px; border-radius: 999px; border:2px solid var(--color-accent); background: var(--color-surface); margin-top: 2px; z-index:1; }
.timeline__content { padding-left: 2px; }
.timeline__date, .timeline__title, .timeline__location, .timeline__address, .timeline__stream, .timeline__notes { margin: 0 0 2px; }
.timeline__title { font-size: .95rem; }
.timeline__type { font-weight: 600; }

/* Media */
.media-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-3); }
.media-card { border-radius: var(--radius-md); border: 1px solid var(--color-border-subtle); overflow: hidden; display: grid; grid-template-columns: 1.1fr 2fr; }
.media-card__thumb { background: var(--color-surface-muted); max-height: 120px; }
.media-card__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.media-card__body { padding: var(--space-3); display:flex; flex-direction: column; gap: 4px; }
.media-card__title, .media-card__desc { margin: 0; }
.media-card__link { margin-top: auto; }

/* Contacts */
.contact-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap: var(--space-3); }
.contact-card { border-radius: var(--radius-md); border:1px solid var(--color-border-subtle); padding: var(--space-3); }
.contact-card__label { margin:0 0 2px; }
.contact-card__name { margin:0 0 2px; font-weight: 600; }
.contact-card__details { display:grid; grid-template-columns: 1fr; gap: 2px; margin:0; }
.contact-card__detail { display:flex; gap: 6px; font-size: .85rem; }
.contact-card__detail dt { font-weight: 500; }
.contact-card__detail dd { margin: 0; }

/* Definition list */
.definition-list { margin:0; padding:0; display:grid; grid-template-columns: 1fr; gap: 6px; }
.definition-list__row { display:grid; grid-template-columns: minmax(0,.8fr) minmax(0,1.2fr); gap: 6px; font-size: .9rem; }
.definition-list__row dt { margin:0; color: var(--color-text-soft); }
.definition-list__row dd { margin:0; }

/* Docs list */
.doc-list { list-style:none; margin:0; padding:0; display:flex; flex-direction: column; gap: .5rem; }
.doc-item { display:flex; gap: .5rem; align-items:center; flex-wrap: wrap; }

/* RWD */
@media (min-width: 768px) {
  .obituary-hero { grid-template-columns: minmax(0,1.2fr) minmax(0,1.8fr); align-items: stretch; }
  .obituary-layout { grid-template-columns: minmax(0,2.1fr) minmax(0,1.3fr); }
  .media-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
</style>
