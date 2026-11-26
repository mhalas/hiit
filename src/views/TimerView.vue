<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { decodeWorkout, encodeWorkout } from '@/utils/encoding';
import type { StepKind } from '@/types/timer';
import type { Workout } from '@/types/workout';
import { useTimer } from '@/composables/useTimer';
import { formatDuration } from '@/utils/time';
import { createEmptyWorkout } from '@/utils/workout';

const route = useRoute();
const router = useRouter();

const decoded = decodeWorkout(route.query.data);
const workout = ref<Workout>(decoded ?? createEmptyWorkout());
const loadError: 'invalid' | 'empty' | null =
  decoded === null ? 'invalid' : decoded.exercises.length === 0 ? 'empty' : null;

const {
  secondsLeft,
  currentStep,
  currentSet,
  currentPhase,
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

const remainingSeconds = computed(() => remainingMsAt(now.value) / 1000);

const progress = computed(() => {
  if (isFinished.value) {
    return 1;
  }
  const maxTime = currentStep.value?.duration ?? 0;
  return maxTime > 0 ? remainingSeconds.value / maxTime : 0;
});

const totalTimeLeft = computed(() => formatDuration(totalRemainingMsAt(now.value) / 1000));

const PHASE_LABELS: Record<StepKind, string> = {
  work: 'ĆWICZENIE',
  rest: 'ODPOCZYNEK',
  setBreak: 'PRZERWA MIĘDZY SERIAMI',
};

const currentPhaseText = computed(() => {
  if (isFinished.value) {
    return 'TRENING ZAKOŃCZONY';
  }
  return PHASE_LABELS[currentStep.value?.kind ?? 'work'];
});

const exerciseName = (index: number | null) => {
  if (index === null) {
    return '';
  }
  return workout.value.exercises[index]?.name.trim() || `Ćwiczenie ${index + 1}`;
};

const exerciseLine = computed(() => {
  if (isFinished.value) {
    return 'Świetna robota!';
  }
  if (currentStep.value?.kind !== 'work' && upcomingStep.value) {
    return `Następne: ${exerciseName(upcomingStep.value.exerciseIndex)}`;
  }
  return exerciseName(currentExerciseIndex.value);
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

const RING_RADIUS = 120;
const circumference = 2 * Math.PI * RING_RADIUS;
const dashOffset = computed(() => {
  return circumference - progress.value * circumference;
});
</script>

<template>
  <div class="timer-container" v-if="!loadError">
    <div class="top-nav">
      <button class="btn-back" @click="backToConfigurator">← Wróć do konfiguratora</button>
    </div>
    <header class="timer-header">
      <span v-if="workout.title.trim()" class="badge">{{ workout.title }}</span>
      <h2>Seria {{ currentSet }} / {{ workout.sets }}</h2>
      <p v-if="!isFinished" class="total-left">Pozostało {{ totalTimeLeft }}</p>
    </header>

    <!-- Główny okrągły licznik -->
    <div class="circle-timer" :class="isFinished ? 'finished' : currentPhase">
      <svg class="progress-ring" width="260" height="260" viewBox="0 0 260 260" aria-hidden="true">
        <circle
          class="progress-ring__circle"
          stroke-width="10"
          stroke="currentColor"
          fill="transparent"
          :r="RING_RADIUS"
          cx="130"
          cy="130"
          :stroke-dasharray="circumference"
          :style="{ strokeDashoffset: dashOffset }"
        />
      </svg>
      <div class="timer-content">
        <span class="phase-label" aria-live="polite">{{ currentPhaseText }}</span>
        <span class="time-left">{{ isFinished ? '✓' : `${secondsLeft}s` }}</span>
        <span class="exercise-name-current">{{ exerciseLine }}</span>
      </div>
    </div>

    <!-- Przyciski sterujące -->
    <div class="timer-controls">
      <button
        class="btn-secondary btn-skip"
        :disabled="!canSkipBack"
        aria-label="Poprzedni krok"
        title="Poprzedni krok"
        @click="skipBack"
      >
        &#x23EE;&#xFE0E;
      </button>
      <button class="btn-primary" @click="toggle">
        {{ isFinished ? 'Od nowa' : isRunning ? 'Pauza' : 'Start' }}
      </button>
      <button class="btn-secondary" @click="reset">Reset</button>
      <button
        class="btn-secondary btn-skip"
        :disabled="!canSkipForward"
        aria-label="Następny krok"
        title="Następny krok"
        @click="skipForward"
      >
        &#x23ED;&#xFE0E;
      </button>
    </div>

    <!-- Lista wszystkich ćwiczeń i odpoczynków -->
    <div class="card playlist-card">
      <h3>Harmonogram treningu</h3>
      <div class="exercises-list">
        <div
          v-for="(ex, index) in workout.exercises"
          :key="index"
          class="playlist-item"
          :class="{ active: !isFinished && index === currentExerciseIndex }"
        >
          <div class="item-info">
            <span class="item-number">{{ index + 1 }}</span>
            <span class="item-name">{{ exerciseName(index) }}</span>
          </div>
          <div class="item-durations">
            <span class="badge-work">Praca: {{ ex.workoutDuration }}s</span>
            <span class="badge-rest">Odpoczynek: {{ ex.restDuration }}s</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="timer-container load-error" role="alert">
    <h2>Nie udało się wczytać treningu</h2>
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
.timer-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timer-header {
  text-align: center;
  margin-bottom: 2rem;
}

.timer-header .badge {
  margin-bottom: 0.5rem;
}

.timer-header h2 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--heading);
}

.total-left {
  margin: 0.4rem 0 0;
  font-size: 0.95rem;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}

/* Okrągły licznik */
.circle-timer {
  position: relative;
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.progress-ring {
  transform: rotate(90deg) scaleX(-1);
}

.progress-ring__circle {
  stroke: currentColor;
}

/* Kolory faz */
.circle-timer.work {
  color: var(--accent);
  /* Pomarańczowy */
}

.circle-timer.rest {
  color: var(--rest);
  /* Zielony */
}

.timer-content {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.phase-label {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.circle-timer.work .phase-label {
  color: var(--accent);
}

.circle-timer.rest .phase-label {
  color: var(--rest);
}

.circle-timer.finished,
.circle-timer.finished .phase-label {
  color: var(--accent);
}

.time-left {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--heading);
}

.exercise-name-current {
  font-size: 0.9rem;
  color: var(--text-dim);
  margin-top: 0.4rem;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Sterowanie */
.timer-controls {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  max-width: 420px;
  margin-bottom: 2.5rem;
}

.timer-controls button {
  flex: 1;
  padding: 0.85rem;
  font-size: 1rem;
  border-radius: 50px;
  font-weight: 600;
}

.timer-controls .btn-skip {
  flex: 0 0 3.25rem;
  padding: 0.85rem 0;
}

/* Harmonogram / Lista */
.playlist-card {
  width: 100%;
  padding: 1.5rem;
  box-sizing: border-box;
}

.playlist-card h3 {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--heading);
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.02);
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

/* Podświetlenie aktywnego ćwiczenia */
.playlist-item.active {
  background: rgba(255, 109, 0, 0.1);
  border-color: rgba(255, 109, 0, 0.4);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.item-number {
  font-size: 0.85rem;
  color: var(--text-dim);
  font-weight: bold;
}

.playlist-item.active .item-number {
  color: var(--accent);
}

.item-name {
  font-weight: 500;
  color: var(--text);
}

.playlist-item.active .item-name {
  color: var(--heading);
  font-weight: 600;
}

.item-durations {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.badge-work {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.badge-rest {
  background: var(--rest-soft);
  color: var(--rest);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.load-error {
  text-align: center;
  padding-top: 15vh;
}

.load-error h2 {
  margin: 0 0 0.75rem;
  color: var(--heading);
}

.load-error p {
  margin: 0 0 2rem;
  color: var(--text-dim);
}
</style>
