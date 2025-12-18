<!-- pages/notifications/index.vue -->
<template>
  <main class="app-main fade-in">
    <PageNavBar
      aria-label="Navigation notifications"
      :show-back-home="true"
      :show-back-list="false"
      :show-create="false"
    />

    <section class="section">
      <header class="section-header">
        <h1 class="section-title">
          {{ t('notifications.title') }}
        </h1>
        <p class="section-subtitle">
          {{ t('notifications.subtitle') }}
        </p>
      </header>

      <div class="card">
        <div class="card-body">
          <p class="notifications-empty">
            {{ t('notifications.empty') }}
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'],
});

import { useI18n } from 'vue-i18n';
import PageNavBar from '~/components/PageNavBar.vue';

const { t } = useI18n();
</script>

<style scoped>
.notifications-empty {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}
</style>
