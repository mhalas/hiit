<script setup lang="ts">
import { computed } from 'vue';
import { isValidInt, minFor, stepValue, toValidInt, type IntField } from '@/utils/workout';

const props = withDefaults(
  defineProps<{
    id: string;
    modelValue: number;
    field: IntField;
    step?: number;
    unit?: string;
    decreaseLabel: string;
    increaseLabel: string;
  }>(),
  { step: 1, unit: '' },
);

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const value = computed({
  get: () => props.modelValue,
  set: (next: number) => emit('update:modelValue', next),
});

const isInvalid = computed(() => !isValidInt(props.modelValue, props.field));
const canDecrease = computed(() => toValidInt(props.modelValue, props.field) > minFor(props.field));

const change = (direction: 1 | -1) => {
  emit('update:modelValue', stepValue(props.modelValue, props.field, direction * props.step));
};
</script>

<template>
  <div class="stepper" :class="{ 'stepper--invalid': isInvalid }">
    <button
      type="button"
      class="stepper__button"
      :aria-label="decreaseLabel"
      :disabled="!canDecrease"
      @click="change(-1)"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linecap="round"
      >
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
    <span class="stepper__value">
      <input
        :id="id"
        v-model.number="value"
        class="stepper__input"
        :class="{ invalid: isInvalid }"
        type="number"
        inputmode="numeric"
        :min="minFor(field)"
        step="1"
      />
      <span v-if="unit" class="stepper__unit" aria-hidden="true">{{ unit }}</span>
    </span>
    <button type="button" class="stepper__button" :aria-label="increaseLabel" @click="change(1)">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linecap="round"
      >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  border-radius: var(--radius-control);
  background: var(--color-surface-raised);
  border: 2px solid transparent;
}

.stepper--invalid {
  border-color: var(--color-danger);
}

.stepper__button {
  flex: none;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.stepper__button svg {
  width: 18px;
  height: 18px;
}

.stepper__button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper__button:focus-visible,
.stepper__input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.stepper__value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.6rem;
}

.stepper__input {
  width: 3ch;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: center;
  font-variant-numeric: tabular-nums;
  appearance: textfield;
  -moz-appearance: textfield;
}

.stepper__input::-webkit-outer-spin-button,
.stepper__input::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.stepper__unit {
  font-size: 1.1rem;
  color: var(--color-text-dim);
}
</style>
