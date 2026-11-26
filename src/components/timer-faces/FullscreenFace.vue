<script setup lang="ts">
import type { TimerFaceProps } from '@/types/theme';

defineProps<TimerFaceProps>();
</script>

<template>
  <div class="face">
    <span class="phase-label" aria-live="polite">{{ phaseLabel }}</span>
    <span v-if="!isFinished" class="time-left">{{ seconds }}</span>
    <svg
      v-else
      class="face__done"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span v-if="title" class="exercise-name-current">{{ title }}</span>
    <div class="phase-progress" aria-hidden="true">
      <div class="phase-progress__fill" :style="{ width: `${progress * 100}%` }"></div>
    </div>
  </div>
</template>

<style scoped>
.face {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.phase-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: 0.14em;
}

.time-left {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(9rem, 52vw, 14.5rem);
  line-height: 0.84;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.face__done {
  width: 10rem;
  height: 10rem;
}

.exercise-name-current {
  margin-top: 6px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 3rem;
  line-height: 1;
  text-transform: var(--display-case, none);
  overflow-wrap: anywhere;
}

.phase-progress {
  margin-top: 22px;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--screen-track);
}

.phase-progress__fill {
  height: 100%;
  border-radius: 5px;
  background: var(--screen-fg);
}
</style>
