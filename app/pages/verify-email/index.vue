<template>
  <div class="page-centered">
    <div class="container-narrow">
      <div class="card card-elevated fade-in">
        <div class="card-header">
          <h1>{{ t('auth.verify.title') }}</h1>
          <p class="text-muted text-sm">
            {{ t('auth.verify.subtitle') }}
          </p>
        </div>

        <div class="card-body">
          <!-- Loading -->
          <div v-if="loading" class="py-4">
            <p class="text-sm text-soft">
              {{ t('auth.verify.loading') }}
            </p>
          </div>

          <!-- Succès -->
          <div v-else-if="success" class="py-4">
            <p class="text-sm text-success mb-3">
              {{ successMessage || t('auth.verify.messages.success') }}
            </p>

            <div class="flex gap-2">
              <NuxtLink to="/login" class="btn btn-primary btn-sm">
                {{ t('auth.verify.actions.go_login') }}
              </NuxtLink>
              <NuxtLink to="/" class="btn btn-secondary btn-sm">
                {{ t('auth.verify.actions.go_home') }}
              </NuxtLink>
            </div>
          </div>

          <!-- Erreur -->
          <div v-else class="py-4">
            <p class="text-sm text-danger mb-3">
              {{ errorMessage || t('auth.verify.errors.generic') }}
            </p>

            <p class="text-xs text-soft mb-3">
              {{ t('auth.verify.hints.contact') }}
            </p>

            <div class="flex gap-2">
              <NuxtLink to="/login" class="btn btn-secondary btn-sm">
                {{ t('auth.verify.actions.go_login') }}
              </NuxtLink>
              <NuxtLink to="/" class="btn btn-ghost btn-sm">
                {{ t('auth.verify.actions.go_home') }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Info technique optionnelle -->
        <div class="card-footer text-xs text-soft">
          {{ t('auth.verify.footer_info') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();

const loading = ref(true);
const success = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

onMounted(async () => {
  const token = route.query.token;

  if (!token || typeof token !== 'string') {
    loading.value = false;
    success.value = false;
    errorMessage.value = t('auth.verify.errors.missing_token');
    return;
  }

  try {
    // Appel de l'API backend
    const res = await $fetch(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`
    );

    if (res?.ok) {
      success.value = true;
      successMessage.value =
        res.message || t('auth.verify.messages.success');
    } else {
      success.value = false;
      errorMessage.value =
        res?.message || t('auth.verify.errors.invalid_or_expired');
    }
  } catch (err) {
    success.value = false;
    errorMessage.value =
      err?.data?.statusMessage ||
      err.message ||
      t('auth.verify.errors.generic');
  } finally {
    loading.value = false;
  }
});
</script>
