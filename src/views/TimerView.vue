<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import StepStrip from '@/components/StepStrip.vue';
import { useTheme } from '@/composables/useTheme';
import { useTimer } from '@/composables/useTimer';
import type { StepKind, TimerStep } from '@/types/timer';
import type { Workout } from '@/types/workout';
import { decodeWorkout, encodeWorkout } from '@/utils/encoding';
import { formatDuration } from '@/utils/time';
import { createEmptyWorkout } from '@/utils/workout';

const route = useRoute();
const router = useRouter();
const { theme } = useTheme();

const decoded = decodeWorkout(route.query.data);
const workout = ref<Workout>(decoded ?? createEmptyWorkout());
const loadError: 'invalid' | 'empty' | null =
  decoded === null ? 'invalid' : decoded.exercises.length === 0 ? 'empty' : null;

const {
  timeline,
  stepIndex,
  secondsLeft,
  currentStep,
  currentSet,
  currentExerciseIndex,
  upcomingStep,
  isRunning,
  isFinished,
  canSkipBack,
  canSkipForward,
  remainingMsAt,
  totalRemainingMsAt,
  start,
  pause,
  reset,
  skipForward,
  skipBack,
} = useTimer(workout);

const backToConfigurator = () => {
  if (decoded === null) {
    router.push('/configurator');
    return;
  }
  router.push({ path: '/configurator', query: { data: encodeWorkout(workout.value) } });
};

const now = ref(performance.now());
let animationFrame: number | null = null;

const animate = () => {
  now.value = performance.now();
  animationFrame = requestAnimationFrame(animate);
};

const stopAnimation = () => {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
};

watch(isRunning, (running) => {
  stopAnimation();
  now.value = performance.now();
  if (running) {
    animate();
  }
});

onUnmounted(stopAnimation);

const progress = computed(() => {
  if (isFinished.value) {
    return 1;
  }
  const maxTime = currentStep.value?.duration ?? 0;
  return maxTime > 0 ? remainingMsAt(now.value) / 1000 / maxTime : 0;
});

const totalTimeLeft = computed(() => formatDuration(totalRemainingMsAt(now.value) / 1000));

const phase = computed<StepKind | 'done'>(() =>
  isFinished.value ? 'done' : (currentStep.value?.kind ?? 'work'),
);

const PHASE_LABELS: Record<StepKind | 'done', string> = {
  work: 'ĆWICZENIE',
  rest: 'ODPOCZYNEK',
  setBreak: 'PRZERWA MIĘDZY SERIAMI',
  done: 'TRENING ZAKOŃCZONY',
};

const exerciseName = (index: number | null) => {
  if (index === null) {
    return '';
  }
  return workout.value.exercises[index]?.name.trim() || `Ćwiczenie ${index + 1}`;
};

const stepLabel = (step: TimerStep) => {
  if (step.kind === 'work') {
    return exerciseName(step.exerciseIndex);
  }
  return step.kind === 'rest' ? 'Odpoczynek' : 'Przerwa między seriami';
};

const faceTitle = computed(() => {
  if (isFinished.value) {
    return 'Świetna robota!';
  }
  return phase.value === 'work' ? exerciseName(currentExerciseIndex.value) : '';
});

const segments = computed(() =>
  timeline.value.map((_, index) => {
    if (isFinished.value || index < stepIndex.value) {
      return 1;
    }
    return index === stepIndex.value ? 1 - progress.value : 0;
  }),
);

const toggleLabel = computed(() => {
  if (isFinished.value) {
    return 'Od nowa';
  }
  return isRunning.value ? 'Pauza' : 'Start';
});

const toggle = () => {
  if (isFinished.value) {
    reset();
  } else if (isRunning.value) {
    pause();
  } else {
    start();
  }
};
</script>

<template>
  <div v-if="!loadError" class="timer" :data-phase="phase">
    <div class="timer__inner">
      <header class="timer-header">
        <div class="timer-topbar">
          <button
            type="button"
            class="icon-button timer-chip btn-back"
            aria-label="Wróć do konfiguratora"
            @click="backToConfigurator"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <span v-if="workout.title.trim()" class="badge timer-title">{{ workout.title }}</span>
          <button
            type="button"
            class="icon-button timer-chip"
            aria-label="Zacznij od początku"
            title="Zacznij od początku"
            @click="reset"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"></path>
              <polyline points="3 3.5 3.5 8.5 8.5 8"></polyline>
            </svg>
          </button>
        </div>
        <StepStrip v-if="theme.showStepStrip" :segments="segments" class="timer-strip" />
        <div class="timer-meta">
          <h2>Seria {{ currentSet }} / {{ workout.sets }}</h2>
          <p v-if="!isFinished" class="total-left">Pozostało {{ totalTimeLeft }}</p>
        </div>
      </header>

      <!-- Główny okrągły licznik -->
      <div class="timer-face">
        <component
          :is="theme.timerFace"
          :phase-label="PHASE_LABELS[phase]"
          :seconds="secondsLeft"
          :title="faceTitle"
          :progress="progress"
          :is-finished="isFinished"
        />
      </div>

      <div v-if="!isFinished && upcomingStep" class="next-card">
        <div class="next-card__text">
          <span class="next-card__label">Następne</span>
          <span class="next-card__name">{{ stepLabel(upcomingStep) }}</span>
        </div>
        <span class="next-card__duration">{{ upcomingStep.duration }} s</span>
      </div>

      <!-- Przyciski sterujące -->
      <div class="timer-controls">
        <button
          type="button"
          class="timer-skip"
          :disabled="!canSkipBack"
          aria-label="Poprzedni krok"
          title="Poprzedni krok"
          @click="skipBack"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17 6.5v11a1 1 0 0 1-1.6.8L8 12.8a1 1 0 0 1 0-1.6l7.4-5.5a1 1 0 0 1 1.6.8z"
            ></path>
            <rect x="5" y="5.5" width="2.5" height="13" rx="1.25"></rect>
          </svg>
        </button>
        <button type="button" class="btn-primary timer-play" @click="toggle">
          <svg
            v-if="isFinished"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"></path>
            <polyline points="3 3.5 3.5 8.5 8.5 8"></polyline>
          </svg>
          <svg v-else-if="isRunning" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1.5"></rect>
            <rect x="14" y="5" width="4" height="14" rx="1.5"></rect>
          </svg>
          <svg v-else aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M8 5.5v13a1 1 0 0 0 1.5.87l10.5-6.5a1 1 0 0 0 0-1.74L9.5 4.63A1 1 0 0 0 8 5.5z"
            ></path>
          </svg>
          <span class="sr-only">{{ toggleLabel }}</span>
        </button>
        <button
          type="button"
          class="timer-skip"
          :disabled="!canSkipForward"
          aria-label="Następny krok"
          title="Następny krok"
          @click="skipForward"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M7 6.5v11a1 1 0 0 0 1.6.8l7.4-5.5a1 1 0 0 0 0-1.6L8.6 5.7A1 1 0 0 0 7 6.5z"
            ></path>
            <rect x="16.5" y="5.5" width="2.5" height="13" rx="1.25"></rect>
          </svg>
        </button>
      </div>

      <!-- Lista wszystkich ćwiczeń i odpoczynków -->
      <section class="playlist-card">
        <h3>Harmonogram treningu</h3>
        <ol class="exercises-list">
          <li
            v-for="(ex, index) in workout.exercises"
            :key="index"
            class="playlist-item"
            :class="{ active: !isFinished && index === currentExerciseIndex }"
          >
            <span class="item-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="item-name">{{ exerciseName(index) }}</span>
            <span class="item-durations">{{ ex.workoutDuration }} s / {{ ex.restDuration }} s</span>
          </li>
        </ol>
      </section>
    </div>
  </div>

  <div v-else class="load-error" role="alert">
    <h2 class="display">Nie udało się wczytać treningu</h2>
    <p>
      {{
        loadError === 'empty'
          ? 'Ten trening nie zawiera żadnych ćwiczeń.'
          : 'Link jest uszkodzony, niekompletny albo nie zawiera treningu.'
      }}
    </p>
    <button class="btn-primary" @click="backToConfigurator">Przejdź do konfiguratora</button>
  </div>
</template>

<style scoped>
.timer {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--screen-bg);
  color: var(--screen-fg);
  transition:
    background-color 0.35s ease,
    color 0.35s ease;
}

.timer__inner {
  max-width: 520px;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 16px 20px 32px;
  display: flex;
  flex-direction: column;
}

.timer-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.timer-chip {
  background: var(--screen-chip);
  color: var(--screen-fg);
}

.timer-chip:hover {
  color: var(--screen-fg);
}

.timer-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--screen-fg);
  letter-spacing: 0.08em;
}

.timer-strip {
  margin-top: 18px;
}

.timer-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--screen-dim);
}

.timer-meta h2,
.total-left {
  margin: 0;
  font: inherit;
}

.timer-face {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 360px;
  padding: 24px 0;
}

.next-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--radius-button);
  background: var(--screen-chip);
}

.next-card__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.next-card__label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--screen-dim);
}

.next-card__name {
  font-size: 1.1rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.next-card__duration {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.75rem;
  font-variant-numeric: tabular-nums;
}

/* Sterowanie */
.timer-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  margin-top: 26px;
}

.timer-skip {
  width: 64px;
  height: 64px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--screen-chip);
  color: var(--screen-fg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.timer-skip svg {
  width: 26px;
  height: 26px;
}

.timer-skip:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.timer-skip:focus-visible,
.timer-play:focus-visible,
.timer-chip:focus-visible {
  outline: 3px solid var(--screen-fg);
  outline-offset: 3px;
}

.timer-play {
  width: 96px;
  height: 96px;
  min-height: 0;
  padding: 0;
  border-radius: 999px;
  background: var(--screen-play-bg);
  color: var(--screen-play-fg);
}

.timer-play:hover:not(:disabled) {
  color: var(--screen-play-fg);
}

.timer-play svg {
  width: 38px;
  height: 38px;
}

/* Harmonogram / Lista */
.playlist-card {
  margin-top: 40px;
}

.playlist-card h3 {
  margin: 0 0 10px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--screen-dim);
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-control);
  background: var(--screen-chip);
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

/* Podświetlenie aktywnego ćwiczenia */
.playlist-item.active {
  border-color: var(--screen-fg);
}

.item-number {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
}

.item-name {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-durations {
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  color: var(--screen-dim);
}

.load-error {
  max-width: 520px;
  margin: 0 auto;
  padding: 18vh 20px 40px;
  text-align: center;
}

.load-error h2 {
  margin: 0 0 12px;
  font-size: 2rem;
}

.load-error p {
  margin: 0 0 28px;
  color: var(--color-text-dim);
}
</style>
