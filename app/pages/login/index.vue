<template>
  <div class="page-centered">
    <div class="container-narrow">
      <div class="card card-elevated fade-in">
        <!-- Header -->
        <div class="card-header">
          <h1>{{ t('auth.login.title') }}</h1>
          <p class="text-muted text-sm">
            {{ t('auth.login.subtitle') }}
          </p>
        </div>

        <!-- Messages globaux -->
        <div v-if="globalMessage" class="mb-3">
          <div class="chip chip-accent">
            {{ globalMessage }}
          </div>
        </div>

        <div v-if="globalError" class="mb-3">
          <div class="chip badge-danger">
            {{ globalError }}
          </div>
        </div>
 
      <!-- Message si la connexion est requise pour une action -->
      <div
        v-if="authReason === 'auth_required'"
        class="login-alert"
        role="status"
        aria-live="polite"
      >
        <p class="login-alert__text">
          {{ t('auth.messages.loginRequiredForObituary') }}
        </p>
      </div>
        <!-- Formulaire de connexion -->
        <form class="form" @submit.prevent="onSubmit">
          <!-- Email -->
          <div class="form-field">
            <label class="form-label form-label-required" for="email">
              {{ t('auth.login.fields.email') }}
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="form-control"
              :class="{ 'form-error-input': fieldErrors.email }"
              :placeholder="t('auth.login.placeholders.email')"
            />
            <p v-if="fieldErrors.email" class="form-error">
              {{ fieldErrors.email }}
            </p>
          </div>

          <!-- Mot de passe -->
          <div class="form-field">
            <label class="form-label form-label-required" for="password">
              {{ t('auth.login.fields.password') }}
            </label>
            <div class="flex items-center gap-2">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="form-control"
                :class="{ 'form-error-input': fieldErrors.password }"
                :placeholder="t('auth.login.placeholders.password')"
              />
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="showPassword = !showPassword"
              >
                <span v-if="showPassword">
                  {{ t('auth.login.actions.hide_password') }}
                </span>
                <span v-else>
                  {{ t('auth.login.actions.show_password') }}
                </span>
              </button>
            </div>
            <p v-if="fieldErrors.password" class="form-error">
              {{ fieldErrors.password }}
            </p>
          </div>

          <div class="flex justify-between items-center mb-2">
            <NuxtLink to="/forgot-password" class="text-xs text-muted">
              {{ t('auth.login.actions.forgot_prefix') }}
              <span class="underline">
                {{ t('auth.login.actions.forgot_link') }}
              </span>
            </NuxtLink>
          </div>

          <!-- Erreur auth store -->
          <p v-if="authError" class="form-error">
            {{ authError }}
          </p>

          <!-- Bloc renvoi email de confirmation -->
          <div class="mt-2 mb-2 flex flex-col gap-1">
            <p class="text-xs text-soft">
              {{ t('auth.login.resend.help') }}
            </p>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              @click="resendVerificationEmail"
              :disabled="resendLoading"
            >
              <span v-if="resendLoading">
                {{ t('auth.login.resend.actions.loading') }}
              </span>
              <span v-else>
                {{ t('auth.login.resend.actions.cta') }}
              </span>
            </button>

            <p v-if="resendMessage" class="text-xs text-success">
              {{ resendMessage }}
            </p>
            <p v-if="resendError" class="text-xs text-danger">
              {{ resendError }}
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex justify-between items-center">
            <NuxtLink to="/register" class="text-xs text-muted">
              {{ t('auth.login.actions.no_account_prefix') }}
              <span class="underline">
                {{ t('auth.login.actions.register_link') }}
              </span>
            </NuxtLink>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="submitting"
            >
              <span v-if="submitting">
                {{ t('auth.login.actions.submitting') }}
              </span>
              <span v-else>
                {{ t('auth.login.actions.submit') }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
// Raison de la redirection (auth_required, etc.)
const authReason = computed(() => route.query.reason || null);
// on ne fetch pas /me automatiquement ici, on laisse le composable tel quel
const { auth, isAuthenticated, error: authErrorRef } = useAuth({ fetchUser: false });

const submitting = ref(false);
const globalMessage = ref('');
const globalError = ref('');
const fieldErrors = reactive({
  email: '',
  password: '',
});

const form = reactive({
  email: '',
  password: '',
});

// show/hide password
const showPassword = ref(false);

// resend email states
const resendLoading = ref(false);
const resendMessage = ref('');
const resendError = ref('');

// Erreur auth du store
const authError = computed(() => authErrorRef.value);

// Si déjà connecté, on redirige
onMounted(() => {
  if (isAuthenticated.value) {
    redirectAfterLogin();
  }

  const m = route.query.message;
  if (m && typeof m === 'string') {
    globalMessage.value = m;
  }
});

watch(isAuthenticated, (val) => {
  if (val) {
    redirectAfterLogin();
  }
});

function resetErrors() {
  globalError.value = '';
  Object.keys(fieldErrors).forEach((k) => {
    fieldErrors[k] = '';
  });
}

function validateForm() {
  resetErrors();
  let hasError = false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!form.email || !emailRegex.test(form.email)) {
    fieldErrors.email = t('auth.login.errors.email_invalid');
    hasError = true;
  }

  if (!form.password) {
    fieldErrors.password = t('auth.login.errors.password_required');
    hasError = true;
  }

  return !hasError;
}

function redirectAfterLogin() {
  const redirect = route.query.redirect;
  if (redirect && typeof redirect === 'string' && redirect.startsWith('/')) {
    router.push(redirect);
  } else {
    router.push('/'); // page d’accueil ou dashboard plus tard
  }
}

async function onSubmit() {
  if (submitting.value) return;

  if (!validateForm()) {
    globalError.value = t('auth.login.errors.fix_fields');
    return;
  }

  submitting.value = true;
  globalError.value = '';
  globalMessage.value = '';
  resendMessage.value = '';
  resendError.value = '';

  try {
    await auth.login({
      email: form.email,
      password: form.password,
    });

    redirectAfterLogin();
  } catch (err) {
    globalError.value =
      err?.data?.statusMessage ||
      err.message ||
      t('auth.login.errors.generic');
  } finally {
    submitting.value = false;
  }
}

async function resendVerificationEmail() {
  if (!form.email) {
    resendError.value = t('auth.login.resend.errors.email_missing');
    return;
  }

  resendLoading.value = true;
  resendMessage.value = '';
  resendError.value = '';

  try {
    const res = await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: form.email },
    });

    if (res?.ok) {
      resendMessage.value =
        res.message || t('auth.login.resend.messages.sent');
    } else {
      resendError.value =
        res?.message || t('auth.login.resend.errors.generic');
    }
  } catch (err) {
    resendError.value =
      err?.data?.statusMessage ||
      err.message ||
      t('auth.login.resend.errors.generic');
  } finally {
    resendLoading.value = false;
  }
}

</script>
<style lang="css" scoped>
.login-alert {
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.6);
  background: rgba(37, 99, 235, 0.08);
}

.login-alert__text {
  margin: 0;
  font-size: 0.9rem;
}
</style>