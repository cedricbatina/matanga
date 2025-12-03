<!-- pages/forgot-password/index.vue -->
<template>
  <div class="page-centered">
    <div class="container-narrow">
      <div class="card card-elevated fade-in">
        <div class="card-header">
          <h1>Mot de passe oublié</h1>
          <p class="text-muted text-sm">
            Indiquez votre adresse email. Si un compte Matanga existe avec cet email,
            vous recevrez un lien pour définir un nouveau mot de passe.
          </p>
        </div>

        <div v-if="successMessage" class="mb-3" role="status">
          <div class="chip chip-accent">
            {{ successMessage }}
          </div>
        </div>

        <div v-if="globalError" class="mb-3" role="alert">
          <div class="chip badge-danger">
            {{ globalError }}
          </div>
        </div>

        <form class="form" @submit.prevent="onSubmit" novalidate>
          <div class="form-field">
            <label class="form-label form-label-required" for="email">
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="form-control"
              :class="{ 'form-error-input': fieldErrors.email }"
              placeholder="vous@example.com"
              :aria-invalid="!!fieldErrors.email"
              :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
            />
            <p
              v-if="fieldErrors.email"
              id="email-error"
              class="form-error"
            >
              {{ fieldErrors.email }}
            </p>
          </div>

          <p class="text-xs text-soft">
            Pour des raisons de confidentialité, Matanga ne confirme jamais si un compte existe ou non
            pour une adresse donnée.
          </p>

          <div class="mt-4 flex justify-between items-center">
            <NuxtLink to="/login" class="text-xs text-muted">
              Revenir à la connexion
            </NuxtLink>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="submitting"
            >
              <span v-if="submitting">Envoi en cours...</span>
              <span v-else>Envoyer le lien</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const router = useRouter();
const { isAuthenticated } = useAuth({ fetchUser: false });

const submitting = ref(false);
const successMessage = ref('');
const globalError = ref('');
const fieldErrors = reactive({
  email: '',
});

const form = reactive({
  email: '',
});

onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/');
  }
});

watch(isAuthenticated, (val) => {
  if (val) router.push('/');
});

function resetErrors() {
  globalError.value = '';
  fieldErrors.email = '';
}

function validateForm() {
  resetErrors();
  let hasError = false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!form.email || !emailRegex.test(form.email)) {
    fieldErrors.email = 'Email invalide.';
    hasError = true;
  }

  return !hasError;
}

async function onSubmit() {
  if (submitting.value) return;

  if (!validateForm()) {
    globalError.value = 'Merci de corriger le champ indiqué.';
    return;
  }

  submitting.value = true;
  globalError.value = '';
  successMessage.value = '';

  try {
    const res = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: {
        email: form.email,
      },
    });

    // Quel que soit le résultat, l’API répond ok:true et message neutre
    successMessage.value =
      res?.message ||
      'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.';
  } catch (err) {
    globalError.value =
      err?.data?.statusMessage ||
      err.message ||
      'Erreur lors de la demande de réinitialisation.';
  } finally {
    submitting.value = false;
  }
}
</script>
