<template>
  <div class="user-inline-card" aria-live="polite">
    <div class="user-inline-main">
      <!-- Statut -->
      <span class="status-dot" :title="onlineLabel">
        <span
          class="status-indicator"
          :class="{ 'status-indicator--online': isAuthenticated }"
        />
      </span>

      <!-- Texte principal -->
      <div class="user-inline-text">
        <p class="user-inline-primary">
          <!-- 1) Nom complet / org -->
          <span v-if="isAuthenticated && displayName">
            {{ displayName }}
          </span>
          <!-- 2) fallback email -->
          <span v-else-if="isAuthenticated && user?.email">
            {{ user.email }}
          </span>
          <!-- 3) invité -->
          <span v-else>
            {{ t('userInline.guestLabel') }}
          </span>
        </p>

        <p v-if="isAuthenticated" class="user-inline-secondary">
          {{ primaryRoleLabel }}
        </p>
        <p v-else class="user-inline-secondary">
          {{ t('userInline.guestHelper') }}
        </p>
      </div>

      <!-- Actions compactes -->
      <div class="user-inline-actions">
        <!-- Authentifié : dashboard + logout -->
        <template v-if="isAuthenticated">
          <button
            type="button"
            class="btn btn-ghost btn-sm user-inline-btn"
            @click="$emit('go-dashboard')"
          >
            <i class="fa-regular fa-user" aria-hidden="true"></i>
            <span>{{ t('userInline.dashboard') }}</span>
          </button>

          <button
            type="button"
            class="btn btn-ghost btn-sm user-inline-btn"
            @click="$emit('logout')"
          >
            <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
            <span>{{ t('userInline.logout') }}</span>
          </button>
        </template>

        <!-- Invité : login + register -->
        <template v-else>
          <button
            type="button"
            class="btn btn-ghost btn-sm user-inline-btn"
            @click="$emit('login')"
          >
            <i class="fa-regular fa-right-to-bracket" aria-hidden="true"></i>
            <span>{{ t('userInline.login') }}</span>
          </button>

          <button
            type="button"
            class="btn btn-primary btn-sm user-inline-btn"
            @click="$emit('register')"
          >
            <i class="fa-regular fa-id-card" aria-hidden="true"></i>
            <span>{{ t('userInline.register') }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Ligne méta / date -->
    <div class="user-inline-meta">
      <span class="user-inline-date">
        <i class="fa-regular fa-calendar" aria-hidden="true"></i>
        {{ t('userInline.todayLabel', { date: formattedNow }) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateUtils } from '~/composables/useDateUtils';

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['go-dashboard', 'logout', 'login', 'register']);

const { t } = useI18n();
const { formattedDateTimeWithSeconds } = useDateUtils();

const now = ref(new Date());
let timer = null;

if (process.client) {
  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date();
    }, 1000);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });
}

const formattedNow = computed(() => formattedDateTimeWithSeconds(now.value));

const onlineLabel = computed(() =>
  props.isAuthenticated
    ? t('userInline.status.online')
    : t('userInline.status.offline')
);

// Utilise les champs enrichis par /api/auth/me
const displayName = computed(() => {
  const u = props.user;
  if (!u) return null;

  if (u.displayName) return u.displayName;

  if (u.accountType === 'individual') {
    const first = u.firstName || '';
    const last = u.lastName || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
  }

  if (u.accountType === 'pro' && u.organizationName) {
    return u.organizationName;
  }

  return u.email || null;
});

const primaryRoleLabel = computed(() => {
  const u = props.user;
  if (!u) return t('userInline.role.generic');

  if (u.accountType === 'individual') {
    return t('userInline.role.individual');
  }
  if (u.accountType === 'pro') {
    return t('userInline.role.pro');
  }

  const firstRole = Array.isArray(u.roles) ? u.roles[0] : null;
  if (firstRole) return firstRole;

  return t('userInline.role.generic');
});
</script>

<style scoped>
.user-inline-card {
  font-size: 0.95rem;
  background: var(--color-surface-muted);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border-subtle);
  padding: 0.4rem 0.75rem;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--color-text-main);
}

.user-inline-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.9rem;
}

.status-indicator {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: #9ca3af;
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.4);
}

.status-indicator--online {
  background: #22c55e;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.5);
}

.user-inline-text {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  flex: 1;
  min-width: 0;
}

.user-inline-primary {
  margin: 0;
  font-weight: 600;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-inline-secondary {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.user-inline-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.user-inline-btn {
  padding-inline: 0.5rem;
  font-size: 0.8rem;
}

.user-inline-btn i {
  font-size: 0.9em;
}

.user-inline-meta {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.1rem;
}

.user-inline-date {
  font-size: 0.78rem;
  color: var(--color-text-soft);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.user-inline-date i {
  font-size: 0.9em;
}

@media (max-width: 520px) {
  .user-inline-card {
    border-radius: 0.6rem;
    padding: 0.4rem 0.6rem;
  }

  .user-inline-main {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .user-inline-actions {
    margin-left: auto;
  }
}
</style>
