<template>
  <main class="app-main fade-in">
    <section class="section">
      <div class="section-header">
        <h1 class="section-title">Vous êtes hors connexion</h1>
        <p class="section-subtitle">
          Certaines informations récentes ne sont pas disponibles, mais les pages déjà ouvertes sur ce
          téléphone peuvent encore s’afficher.
        </p>
      </div>

      <article class="card">
        <div class="card-body">
          <p class="text-sm">
            Dès que la connexion sera rétablie, Matanga se synchronisera automatiquement pour afficher
            les nouvelles annonces et mises à jour.
          </p>

          <NuxtLink to="/" class="btn btn-primary btn-sm mt-4">
            Revenir à l’accueil
          </NuxtLink>
        </div>
      </article>
    </section>
  </main>
</template>
