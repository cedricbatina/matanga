<!-- pages/reset-password/index.vue -->
<template>
  <div class="page-centered">
    <div class="container-narrow">
      <div class="card card-elevated fade-in">
        <div class="card-header">
          <h1>Définir un nouveau mot de passe</h1>
          <p class="text-muted text-sm">
            Choisissez un nouveau mot de passe pour votre compte Matanga.
          </p>
        </div>

        <!-- Message si token manquant -->
        <div v-if="!token && !submitting" class="mb-3" role="alert">
          <div class="chip badge-danger">
            Lien de réinitialisation invalide ou incomplet.
          </div>
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

        <form
          v-if="token"
          class="form"
          @submit.prevent="onSubmit"
          novalidate
        >
          <div class="form-field">
            <label class="form-label form-label-required" for="password">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              class="form-control"
              :class="{ 'form-error-input': fieldErrors.password }"
              placeholder="Minimum 8 caractères"
              :aria-invalid="!!fieldErrors.password"
              :aria-describedby="fieldErrors.password ? 'password-error' : undefined"
            />
            <p
              v-if="fieldErrors.password"
              id="password-error"
              class="form-error"
            >
              {{ fieldErrors.password }}
            </p>
          </div>

          <div class="form-field">
            <label class="form-label form-label-required" for="confirmPassword">
              Confirmation du mot de passe
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              class="form-control"
              :class="{ 'form-error-input': fieldErrors.confirmPassword }"
              placeholder="Répétez votre mot de passe"
              :aria-invalid="!!fieldErrors.confirmPassword"
              :aria-describedby="fieldErrors.confirmPassword ? 'confirm-error' : undefined"
            />
            <p
              v-if="fieldErrors.confirmPassword"
              id="confirm-error"
              class="form-error"
            >
              {{ fieldErrors.confirmPassword }}
            </p>
          </div>

          <p class="text-xs text-soft">
            Pour votre sécurité, ce lien peut expirer après un certain temps.
            Si le lien ne fonctionne plus, vous pouvez refaire une demande depuis
            la page “Mot de passe oublié”.
          </p>

          <div class="mt-4 flex justify-between items-center">
            <NuxtLink to="/login" class="text-xs text-muted">
              Retour à la connexion
            </NuxtLink>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="submitting"
            >
              <span v-if="submitting">Mise à jour...</span>
              <span v-else>Mettre à jour le mot de passe</span>
            </button>
          </div>
        </form>

        <!-- Si pas de token, proposer de refaire une demande -->
        <div v-else class="mt-4">
          <NuxtLink to="/forgot-password" class="btn btn-secondary btn-sm">
            Refaire une demande de réinitialisation
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const { isAuthenticated } = useAuth({ fetchUser: false });

const token = computed(() => {
  const t = route.query.token;
  return typeof t === 'string' && t.length > 0 ? t : null;
});

const submitting = ref(false);
const successMessage = ref('');
const globalError = ref('');
const fieldErrors = reactive({
  password: '',
  confirmPassword: '',
});

const form = reactive({
  password: '',
  confirmPassword: '',
});

onMounted(() => {
  // Si déjà connecté, tu peux choisir de rediriger, ou de laisser le reset possible
  if (isAuthenticated.value) {
    // ici on laisse faire le reset, ce n'est pas dangereux
  }
});

function resetErrors() {
  globalError.value = '';
  fieldErrors.password = '';
  fieldErrors.confirmPassword = '';
}

function validateForm() {
  resetErrors();
  let hasError = false;

  if (!form.password || form.password.length < 8) {
    fieldErrors.password = 'Mot de passe trop court (minimum 8 caractères).';
    hasError = true;
  }

  if (!form.confirmPassword || form.confirmPassword !== form.password) {
    fieldErrors.confirmPassword = 'La confirmation ne correspond pas au mot de passe.';
    hasError = true;
  }

  return !hasError;
}

async function onSubmit() {
  if (submitting.value || !token.value) return;

  if (!validateForm()) {
    globalError.value = 'Merci de corriger les champs indiqués.';
    return;
  }

  submitting.value = true;
  globalError.value = '';
  successMessage.value = '';

  try {
    const res = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        newPassword: form.password,
      },
    });

    if (res?.ok) {
      successMessage.value =
        res.message ||
        'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.';
      // On vide les champs de mot de passe
      form.password = '';
      form.confirmPassword = '';
      // Optionnel : redirection automatique
      // setTimeout(() => router.push('/login'), 4000);
    } else {
      globalError.value =
        res?.message ||
        'Impossible de réinitialiser le mot de passe.';
    }
  } catch (err) {
    globalError.value =
      err?.data?.statusMessage ||
      err.message ||
      'Erreur lors de la réinitialisation du mot de passe.';
  } finally {
    submitting.value = false;
  }
}
</script>
