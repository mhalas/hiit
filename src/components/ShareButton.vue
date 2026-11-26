<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { useShare } from '@/composables/useShare';

const props = defineProps<{
  title: string;
  getUrl: () => string | Promise<string>;
  disabled?: boolean;
}>();

const { status, sharedUrl, share, dismiss } = useShare();
const busy = ref(false);
const fallbackId = useId();

const message = computed(() => (status.value === 'copied' ? 'Link skopiowany do schowka' : ''));

const onClick = async () => {
  if (busy.value) {
    return;
  }
  busy.value = true;
  try {
    await share({ title: props.title, url: await props.getUrl() });
  } finally {
    busy.value = false;
  }
};

const selectAll = (event: FocusEvent) => (event.target as HTMLInputElement).select();
</script>

<template>
  <button type="button" class="share-button" :disabled="disabled || busy" @click="onClick">
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 15V3"></path>
      <polyline points="7 8 12 3 17 8"></polyline>
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
    </svg>
    Udostępnij
  </button>
  <p class="share-message" aria-live="polite">{{ message }}</p>
  <div v-if="status === 'failed'" class="share-fallback">
    <label :for="fallbackId" class="field-label"
      >Nie udało się skopiować — skopiuj link ręcznie</label
    >
    <div class="share-fallback__row">
      <input
        :id="fallbackId"
        class="text-input"
        type="text"
        readonly
        :value="sharedUrl"
        @focus="selectAll"
      />
      <button type="button" class="icon-button" aria-label="Zamknij" @click="dismiss">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
        >
          <line x1="6" y1="6" x2="18" y2="18"></line>
          <line x1="18" y1="6" x2="6" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.share-button {
  margin-left: auto;
  min-height: 44px;
  padding: 0 16px 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.share-button svg {
  width: 18px;
  height: 18px;
}

.share-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.share-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.share-message {
  flex-basis: 100%;
  order: 10;
  margin: 0;
  text-align: right;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-accent);
}

.share-message:empty {
  display: none;
}

.share-fallback {
  flex-basis: 100%;
  order: 11;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.share-fallback__row {
  display: flex;
  gap: 8px;
}

.share-fallback .text-input {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
}
</style>
