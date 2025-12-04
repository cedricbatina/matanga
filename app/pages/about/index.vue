<template>
  <div class="app-home">
    <!-- HERO -->
    <section class="section" aria-labelledby="matanga-hero-title">
      <div class="container-narrow fade-in">
        <div class="card card-elevated">
          <div class="card-header">
            <h1 id="matanga-hero-title">
              Annonces de décès &amp; veillées, simples et réunies au même endroit.
            </h1>
            <p class="text-muted text-sm">
              Matanga vous aide à partager, en quelques minutes, les informations importantes
              autour d’un décès&nbsp;: veillées, obsèques, hommages, contacts. Où que soient la
              famille et les proches.
            </p>
          </div>

          <div class="card-body">
            <div class="grid">
              <div class="flex flex-col gap-3">
                <p>
                  Un lien unique, une page claire&nbsp;: tout le monde retrouve les
                  mêmes informations, sans confusion, sans capture d’écran qui circule partout.
                </p>
                <p class="text-soft text-sm">
                  Pensé pour les familles et les structures qui accompagnent les moments de deuil,
                  dans le respect, la sobriété et la confidentialité.
                </p>

                <div class="flex flex-col gap-2 mt-3" style="align-items:flex-start;">
                  <NuxtLink to="/register" class="btn btn-primary">
                    Créer un compte
                  </NuxtLink>
                  <NuxtLink to="/login" class="btn btn-secondary btn-sm">
                    Déjà inscrit ? Se connecter
                  </NuxtLink>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <div class="chip chip-accent">
                  Annonces de décès, veillées, obsèques, hommages
                </div>
                <div class="chip">
                  Informations centralisées : dates, lieux, contacts
                </div>
                <div class="chip">
                  Partage facile par lien (WhatsApp, SMS, email…)
                </div>
                <div class="chip">
                  Espace sobre, privé, pensé pour les familles
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- POUR QUI ? -->
    <section class="section" aria-labelledby="matanga-audience-title">
      <div class="container">
        <div class="section-header">
          <h2 id="matanga-audience-title" class="section-title">
            À quoi sert Matanga ?
          </h2>
          <p class="section-subtitle">
            Un point de repère unique pour informer les proches simplement.
          </p>
        </div>

        <div class="grid grid-2-cols">
          <!-- Familles / particuliers -->
          <article class="card">
            <header class="card-header">
              <h3 class="card-title">Pour les familles et proches</h3>
            </header>
            <div class="card-body">
              <ul class="text-sm text-soft" style="padding-left: 18px;">
                <li>• Partager une annonce de décès en quelques minutes</li>
                <li>• Indiquer les veillées, obsèques, hommages et messages</li>
                <li>• Donner des informations claires (dates, lieux, contacts)</li>
              </ul>
            </div>
          </article>

          <!-- Pros -->
          <article class="card">
            <header class="card-header">
              <h3 class="card-title">Pour les organisateurs</h3>
              <p class="card-subtitle">
                Pompes funèbres, lieux de culte, associations…
              </p>
            </header>
            <div class="card-body">
              <ul class="text-sm text-soft" style="padding-left: 18px;">
                <li>• Proposer un support d’annonce en ligne à vos familles</li>
                <li>• Mettre en avant les informations pratiques utiles</li>
                <li>• Faciliter la communication avec les proches éloignés</li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- COMMENT ÇA FONCTIONNE -->
    <section class="section" aria-labelledby="matanga-how-title">
      <div class="container-narrow">
        <div class="section-header">
          <h2 id="matanga-how-title" class="section-title">
            Comment ça marche ?
          </h2>
          <p class="section-subtitle">
            Un parcours simple, pour rester concentré sur l’essentiel.
          </p>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title">1. Créez votre compte</h3>
              <p class="text-sm text-soft">
                Compte particulier ou professionnel, avec votre ville et vos coordonnées.
              </p>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <h3 class="card-title">2. Créez l’annonce</h3>
              <p class="text-sm text-soft">
                Nom du défunt, dates, veillées, obsèques, contacts&nbsp;: une page claire,
                complétée en quelques étapes.
              </p>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <h3 class="card-title">3. Partagez le lien</h3>
              <p class="text-sm text-soft">
                Un lien unique à envoyer aux proches. Tout le monde consulte les mêmes informations,
                à jour, sans confusion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="section" aria-labelledby="matanga-cta-title">
      <div class="container-narrow">
        <div class="card card-elevated">
          <div class="card-body">
            <h2 id="matanga-cta-title" class="section-title">
              Commencer avec Matanga
            </h2>
            <p class="section-subtitle">
              Un espace sobre pour annoncer un décès, informer sur les veillées et guider les proches.
            </p>

            <div class="flex flex-col gap-2 mt-4" style="align-items:flex-start;">
              <NuxtLink to="/register" class="btn btn-primary">
                Créer un compte Matanga
              </NuxtLink>
              <p class="text-xs text-soft">
                Vous pourrez ensuite publier vos annonces, gérer leur durée de visibilité
                et partager le lien avec les personnes concernées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const siteUrl = 'https://www.matanga.net';

useSeoMeta({
  title: 'Matanga – Annonces de décès & veillées en ligne',
  ogTitle: 'Matanga – Annonces de décès & veillées en ligne',
  description:
    "Matanga est un service en ligne pour partager les informations autour d'un décès : annonces, veillées, obsèques, hommages et contacts, sur une page claire et facile à partager.",
  ogDescription:
    "Créez des annonces de décès et de veillées, centralisez les informations importantes et partagez un lien unique avec les proches.",
  ogType: 'website',
  ogUrl: siteUrl,
  twitterCard: 'summary_large_image',
});
</script>
