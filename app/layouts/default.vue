<!-- layouts/default.vue -->
<template>
  <div class="app-shell">
    <!-- Skip link pour les lecteurs d'écran / clavier -->
    <a href="#main-content" class="skip-link">
      Passer au contenu principal
    </a>

    <header class="app-header" role="banner">
      <div class="app-header-inner">
        <NuxtLink to="/" class="app-logo" aria-label="Retour à la page d’accueil Matanga">
          <span class="app-logo-name">Matanga</span>
          <span class="app-logo-tagline">Annonces & veillées</span>
        </NuxtLink>

        <nav class="app-nav-actions" aria-label="Navigation principale">
          <!-- Toggle thème accessible -->
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="toggleTheme"
            :aria-pressed="theme === 'dark'"
            :aria-label="theme === 'dark'
              ? 'Activer le thème clair'
              : 'Activer le thème sombre'"
          >
            <span v-if="theme === 'dark'">Thème clair</span>
            <span v-else>Thème sombre</span>
          </button>

          <!-- Plus tard : login / profil -->
          <!--
          <NuxtLink to="/login" class="btn btn-secondary btn-sm">
            Se connecter
          </NuxtLink>
          -->
        </nav>
      </div>
    </header>

    <main id="main-content" class="app-main" role="main">
      <slot />
    </main>
  </div>
</template>

<script setup>
const { theme, toggleTheme } = useTheme();
</script>
