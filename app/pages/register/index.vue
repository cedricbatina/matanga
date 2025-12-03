<template>
  <div class="page-centered">
    <div class="container-narrow">
      <div class="card card-elevated fade-in">
        <!-- Header -->
        <div class="card-header">
          <h1>{{ t('auth.register.title') }}</h1>
          <p class="text-muted text-sm">
            {{ t('auth.register.subtitle') }}
          </p>
        </div>

        <!-- Switch type de compte -->
        <div class="mb-4">
          <p class="text-xs text-soft mb-2">
            {{ t('auth.register.account_type.label') }}
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :class="form.accountType === 'individual' ? 'btn-accent' : ''"
              @click="setAccountType('individual')"
            >
              {{ t('auth.register.account_type.individual') }}
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :class="form.accountType === 'pro' ? 'btn-accent' : ''"
              @click="setAccountType('pro')"
            >
              {{ t('auth.register.account_type.pro') }}
            </button>
          </div>
        </div>

        <!-- Message global succès -->
        <div v-if="successMessage" class="mb-3">
          <div class="chip chip-accent">
            {{ successMessage }}
          </div>

          <!-- Renvoi email de confirmation -->
          <div class="mt-2 flex flex-col gap-1">
            <p class="text-xs text-soft">
              {{ t('auth.register.resend.help') }}
            </p>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              @click="resendVerificationEmail"
              :disabled="resendLoading"
            >
              <span v-if="resendLoading">
                {{ t('auth.register.resend.actions.loading') }}
              </span>
              <span v-else>
                {{ t('auth.register.resend.actions.cta') }}
              </span>
            </button>

            <p v-if="resendMessage" class="text-xs text-success">
              {{ resendMessage }}
            </p>
            <p v-if="resendError" class="text-xs text-danger">
              {{ resendError }}
            </p>
          </div>
        </div>

        <!-- Message global erreur -->
        <div v-if="globalError" class="mb-3">
          <div class="chip badge-danger">
            {{ globalError }}
          </div>
        </div>

        <!-- Formulaire -->
        <form class="form" @submit.prevent="onSubmit">
          <!-- Email -->
          <div class="form-field">
            <label class="form-label form-label-required" for="email">
              {{ t('auth.register.fields.email') }}
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="form-control"
              :class="{ 'form-error-input': fieldErrors.email }"
              :placeholder="t('auth.register.placeholders.email')"
            />
            <p v-if="fieldErrors.email" class="form-error">
              {{ fieldErrors.email }}
            </p>
          </div>

          <!-- Mot de passe / confirmation -->
          <div class="form-row form-row-inline">
            <div class="form-field">
              <label class="form-label form-label-required" for="password">
                {{ t('auth.register.fields.password') }}
              </label>
              <div class="flex items-center gap-2">
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  class="form-control"
                  :class="{ 'form-error-input': fieldErrors.password }"
                  :placeholder="t('auth.register.placeholders.password')"
                />
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="showPassword = !showPassword"
                >
                  <span v-if="showPassword">
                    {{ t('auth.register.actions.hide_password') }}
                  </span>
                  <span v-else>
                    {{ t('auth.register.actions.show_password') }}
                  </span>
                </button>
              </div>
              <p v-if="fieldErrors.password" class="form-error">
                {{ fieldErrors.password }}
              </p>
            </div>

            <div class="form-field">
              <label class="form-label form-label-required" for="confirmPassword">
                {{ t('auth.register.fields.confirm_password') }}
              </label>
              <div class="flex items-center gap-2">
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  class="form-control"
                  :class="{ 'form-error-input': fieldErrors.confirmPassword }"
                  :placeholder="t('auth.register.placeholders.confirm_password')"
                />
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <span v-if="showConfirmPassword">
                    {{ t('auth.register.actions.hide_password') }}
                  </span>
                  <span v-else>
                    {{ t('auth.register.actions.show_password') }}
                  </span>
                </button>
              </div>
              <p v-if="fieldErrors.confirmPassword" class="form-error">
                {{ fieldErrors.confirmPassword }}
              </p>
            </div>
          </div>

          <!-- Infos identité (selon type) -->
          <div v-if="form.accountType === 'individual'" class="form-row form-row-inline">
            <div class="form-field">
              <label class="form-label form-label-required" for="firstName">
                {{ t('auth.register.fields.first_name') }}
              </label>
              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                class="form-control"
                :class="{ 'form-error-input': fieldErrors.firstName }"
                :placeholder="t('auth.register.placeholders.first_name')"
              />
              <p v-if="fieldErrors.firstName" class="form-error">
                {{ fieldErrors.firstName }}
              </p>
            </div>

            <div class="form-field">
              <label class="form-label form-label-required" for="lastName">
                {{ t('auth.register.fields.last_name') }}
              </label>
              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                class="form-control"
                :class="{ 'form-error-input': fieldErrors.lastName }"
                :placeholder="t('auth.register.placeholders.last_name')"
              />
              <p v-if="fieldErrors.lastName" class="form-error">
                {{ fieldErrors.lastName }}
              </p>
            </div>
          </div>

          <div v-else class="form-row">
            <div class="form-field">
              <label class="form-label form-label-required" for="organizationName">
                {{ t('auth.register.fields.organization_name') }}
              </label>
              <input
                id="organizationName"
                v-model="form.organizationName"
                type="text"
                class="form-control"
                :class="{ 'form-error-input': fieldErrors.organizationName }"
                :placeholder="t('auth.register.placeholders.organization_name')"
              />
              <p v-if="fieldErrors.organizationName" class="form-error">
                {{ fieldErrors.organizationName }}
              </p>
            </div>

            <div class="form-field">
              <label class="form-label form-label-required" for="organizationType">
                {{ t('auth.register.fields.organization_type') }}
              </label>
              <select
                id="organizationType"
                v-model="form.organizationType"
                class="form-control"
                :class="{ 'form-error-input': fieldErrors.organizationType }"
              >
                <option value="funeral_home">
                  {{ t('auth.register.organization_types.funeral_home') }}
                </option>
                <option value="church">
                  {{ t('auth.register.organization_types.church') }}
                </option>
                <option value="mosque">
                  {{ t('auth.register.organization_types.mosque') }}
                </option>
                <option value="association">
                  {{ t('auth.register.organization_types.association') }}
                </option>
                <option value="other">
                  {{ t('auth.register.organization_types.other') }}
                </option>
              </select>
              <p v-if="fieldErrors.organizationType" class="form-error">
                {{ fieldErrors.organizationType }}
              </p>
            </div>
          </div>

          <!-- Ville / Pays -->
          <div class="form-row form-row-inline">
            <div class="form-field">
              <label class="form-label form-label-required" for="city">
                {{ t('auth.register.fields.city') }}
              </label>
              <input
                id="city"
                v-model="form.city"
                type="text"
                class="form-control"
                :class="{ 'form-error-input': fieldErrors.city }"
                :placeholder="t('auth.register.placeholders.city')"
              />
              <p v-if="fieldErrors.city" class="form-error">
                {{ fieldErrors.city }}
              </p>
            </div>

            <div class="form-field">
              <label class="form-label" for="country">
                {{ t('auth.register.fields.country') }}
              </label>
              <input
                id="country"
                v-model="form.country"
                type="text"
                class="form-control"
                :placeholder="t('auth.register.placeholders.country')"
              />
            </div>
          </div>

          <!-- Téléphone -->
          <div class="form-field">
            <label class="form-label" for="phone">
              {{ t('auth.register.fields.phone') }}
            </label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="form-control"
              :placeholder="t('auth.register.placeholders.phone')"
            />
            <p class="form-hint text-xs">
              {{ t('auth.register.hints.phone') }}
            </p>
          </div>

          <!-- Adresse pro / site web -->
          <div v-if="form.accountType === 'pro'" class="form-row">
            <div class="form-field">
              <label class="form-label" for="address">
                {{ t('auth.register.fields.address') }}
              </label>
              <input
                id="address"
                v-model="form.address"
                type="text"
                class="form-control"
                :placeholder="t('auth.register.placeholders.address')"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="websiteUrl">
                {{ t('auth.register.fields.website_url') }}
              </label>
              <input
                id="websiteUrl"
                v-model="form.websiteUrl"
                type="url"
                class="form-control"
                :placeholder="t('auth.register.placeholders.website_url')"
              />
            </div>
          </div>

          <!-- Langue préférée -->
          <div class="form-field">
            <label class="form-label" for="preferredLocale">
              {{ t('auth.register.fields.preferred_locale') }}
            </label>
            <select
              id="preferredLocale"
              v-model="form.preferredLocale"
              class="form-control"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="es">Español</option>
            </select>
          </div>

          <!-- Conditions & note -->
          <p class="text-xs text-soft">
            {{ t('auth.register.hints.terms') }}
          </p>

          <!-- Actions -->
          <div class="mt-4 flex justify-between items-center">
            <NuxtLink to="/login" class="text-xs text-muted">
              {{ t('auth.register.actions.already_have_account') }}
              <span class="underline">
                {{ t('auth.register.actions.login_link') }}
              </span>
            </NuxtLink>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="submitting"
            >
              <span v-if="submitting">
                {{ t('auth.register.actions.submitting') }}
              </span>
              <span v-else>
                {{ t('auth.register.actions.submit') }}
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
const { isAuthenticated } = useAuth({ fetchUser: true });
const { t } = useI18n();

const submitting = ref(false);
const successMessage = ref('');
const globalError = ref('');
const fieldErrors = reactive({});

// voir / cacher mot de passe
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// renvoi email de vérification
const resendLoading = ref(false);
const resendMessage = ref('');
const resendError = ref('');

const form = reactive({
  accountType: 'individual', // 'individual' | 'pro'
  email: '',
  password: '',
  confirmPassword: '',
  city: '',
  country: '',
  preferredLocale: 'fr',
  // individuels
  firstName: '',
  lastName: '',
  // pros
  organizationName: '',
  organizationType: 'funeral_home',
  address: '',
  phone: '',
  websiteUrl: ''
});

function resetErrors() {
  globalError.value = '';
  successMessage.value = '';
  resendMessage.value = '';
  resendError.value = '';
  Object.keys(fieldErrors).forEach((k) => {
    fieldErrors[k] = '';
  });
}

function validateForm() {
  resetErrors();
  let hasError = false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!form.email || !emailRegex.test(form.email)) {
    fieldErrors.email = t('auth.register.errors.email_invalid');
    hasError = true;
  }

  if (!form.password || form.password.length < 8) {
    fieldErrors.password = t('auth.register.errors.password_short');
    hasError = true;
  }

  if (!form.confirmPassword || form.confirmPassword !== form.password) {
    fieldErrors.confirmPassword = t('auth.register.errors.confirm_mismatch');
    hasError = true;
  }

  if (!form.city) {
    fieldErrors.city = t('auth.register.errors.city_required');
    hasError = true;
  }

  if (form.accountType === 'individual') {
    if (!form.firstName) {
      fieldErrors.firstName = t('auth.register.errors.first_name_required');
      hasError = true;
    }
    if (!form.lastName) {
      fieldErrors.lastName = t('auth.register.errors.last_name_required');
      hasError = true;
    }
  } else if (form.accountType === 'pro') {
    if (!form.organizationName) {
      fieldErrors.organizationName = t('auth.register.errors.org_name_required');
      hasError = true;
    }
    const allowedOrgTypes = ['funeral_home', 'church', 'mosque', 'association', 'other'];
    if (!form.organizationType || !allowedOrgTypes.includes(form.organizationType)) {
      fieldErrors.organizationType = t('auth.register.errors.org_type_invalid');
      hasError = true;
    }
  }

  return !hasError;
}

function setAccountType(type) {
  if (form.accountType === type) return;
  form.accountType = type;
  resetErrors();
}

async function onSubmit() {
  if (submitting.value) return;

  if (!validateForm()) {
    globalError.value = t('auth.register.errors.fix_fields');
    return;
  }

  submitting.value = true;
  globalError.value = '';
  successMessage.value = '';
  resendMessage.value = '';
  resendError.value = '';

  try {
    const payload = {
      email: form.email,
      password: form.password,
      accountType: form.accountType,
      city: form.city,
      country: form.country || null,
      preferredLocale: form.preferredLocale || 'fr',
      phone: form.phone || null,
      address: form.accountType === 'pro' ? form.address || null : null,
      websiteUrl: form.accountType === 'pro' ? form.websiteUrl || null : null
    };

    if (form.accountType === 'individual') {
      payload.firstName = form.firstName;
      payload.lastName = form.lastName;
    } else {
      payload.organizationName = form.organizationName;
      payload.organizationType = form.organizationType;
    }

    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body: payload
    });

    if (res?.ok) {
      successMessage.value =
        res.message || t('auth.register.messages.check_email');
      form.password = '';
      form.confirmPassword = '';
    } else {
      globalError.value = res?.message || t('auth.register.errors.generic');
    }
  } catch (err) {
    globalError.value =
      err?.data?.statusMessage ||
      err.message ||
      t('auth.register.errors.generic');
  } finally {
    submitting.value = false;
  }
}

async function resendVerificationEmail() {
  if (!form.email) {
    resendError.value = t('auth.register.resend.errors.email_missing');
    return;
  }

  resendLoading.value = true;
  resendMessage.value = '';
  resendError.value = '';

  try {
    const res = await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: form.email }
    });

    if (res?.ok) {
      resendMessage.value =
        res.message || t('auth.register.resend.messages.sent');
    } else {
      resendError.value =
        res?.message || t('auth.register.resend.errors.generic');
    }
  } catch (err) {
    resendError.value =
      err?.data?.statusMessage ||
      err.message ||
      t('auth.register.resend.errors.generic');
  } finally {
    resendLoading.value = false;
  }
}

onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/');
  }
});

watch(isAuthenticated, (val) => {
  if (val) router.push('/');
});
</script>
