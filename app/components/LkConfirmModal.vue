<!-- components/LkConfirmModal.vue -->
<template>
  <transition name="lk-confirm-fade">
    <div
      v-if="store.open"
      class="lk-confirm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lk-confirm-title"
      aria-describedby="lk-confirm-message"
    >
      <div class="lk-confirm-modal">
        <header class="lk-confirm-header">
          <h2
            id="lk-confirm-title"
            class="lk-confirm-title"
          >
            {{ store.title }}
          </h2>
        </header>

        <p
          id="lk-confirm-message"
          class="lk-confirm-message"
        >
          {{ store.message }}
        </p>

        <div class="lk-confirm-actions">
          <button
            type="button"
            class="lk-confirm-btn lk-confirm-btn--secondary"
            @click="store.cancel"
          >
            {{ store.cancelLabel }}
          </button>
          <button
            type="button"
            class="lk-confirm-btn lk-confirm-btn--danger"
            @click="store.confirm"
          >
            {{ store.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useConfirmStore } from '~/stores/confirmStore';

const store = useConfirmStore();
</script>

<style scoped>
.lk-confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lk-confirm-modal {
  max-width: 420px;
  width: calc(100% - 2.5rem);
  border-radius: 1rem;
  padding: 1.4rem 1.25rem 1.2rem;
  background: var(--surface-elevated, #ffffff);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.35);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.5));
}

.lk-confirm-header {
  margin-bottom: 0.75rem;
}

.lk-confirm-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-default, #111827);
}

.lk-confirm-message {
  margin: 0 0 0.9rem;
  font-size: 0.95rem;
  color: var(--text-muted, #4b5563);
}

.lk-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.lk-confirm-btn {
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.45rem 0.95rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.lk-confirm-btn--secondary {
  background: var(--surface-default, #f9fafb);
  border-color: var(--border-subtle, rgba(148, 163, 184, 0.8));
  color: var(--text-default, #111827);
}

.lk-confirm-btn--danger {
  background: #b91c1c;
  border-color: #991b1b;
  color: #fff;
}

.lk-confirm-btn--secondary:hover,
.lk-confirm-btn--secondary:focus-visible {
  background: rgba(148, 163, 184, 0.2);
}

.lk-confirm-btn--danger:hover,
.lk-confirm-btn--danger:focus-visible {
  background: #991b1b;
}

/* Fade */
.lk-confirm-fade-enter-active,
.lk-confirm-fade-leave-active {
  transition: opacity 0.16s ease;
}
.lk-confirm-fade-enter-from,
.lk-confirm-fade-leave-to {
  opacity: 0;
}
</style>
