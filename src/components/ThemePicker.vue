<script setup lang="ts">
import type { ThemeDefinition, ThemeId } from '@/types/theme';

defineProps<{
  themes: readonly ThemeDefinition[];
  modelValue: ThemeId;
}>();

const emit = defineEmits<{ 'update:modelValue': [id: ThemeId] }>();
</script>

<template>
  <fieldset class="theme-picker">
    <legend class="theme-picker__legend">Wygląd</legend>
    <label
      v-for="theme in themes"
      :key="theme.id"
      class="theme-option"
      :class="{ 'theme-option--selected': theme.id === modelValue }"
      :title="theme.description"
    >
      <input
        class="sr-only"
        type="radio"
        name="theme"
        :value="theme.id"
        :checked="theme.id === modelValue"
        @change="emit('update:modelValue', theme.id)"
      />
      <span class="theme-option__swatches" aria-hidden="true">
        <span
          v-for="color in theme.swatches"
          :key="color"
          class="theme-option__swatch"
          :style="{ background: color }"
        ></span>
      </span>
      <span>{{ theme.name }}</span>
    </label>
  </fieldset>
</template>

<style scoped>
.theme-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.theme-picker__legend {
  float: left;
  margin-right: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.theme-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px 0 8px;
  border-radius: 999px;
  border: 2px solid var(--color-border);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.theme-option--selected {
  border-color: var(--color-accent);
}

.theme-option:focus-within {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.theme-option__swatches {
  display: inline-flex;
}

.theme-option__swatch {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid var(--color-bg);
}

.theme-option__swatch + .theme-option__swatch {
  margin-left: -6px;
}
</style>
