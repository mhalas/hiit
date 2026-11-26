<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import type { Exercise } from '@/types/exercise';
import type { Workout } from '@/types/workout';
import { useRoute, useRouter } from 'vue-router';
import NumberStepper from '@/components/NumberStepper.vue';
import { decodeWorkout, encodeWorkout } from '@/utils/encoding';
import { countPl } from '@/utils/plural';
import { formatDuration } from '@/utils/time';
import { buildTimeline } from '@/utils/timeline';
import {
  createEmptyWorkout,
  isWorkoutValid,
  normalizeWorkout,
  sanitizeWorkout,
  toValidInt,
} from '@/utils/workout';

const route = useRoute();
const router = useRouter();

const rawData = route.query.data;
const decoded = decodeWorkout(rawData);
const loadError = ref(rawData !== undefined && decoded === null);
const workout = ref<Workout>(decoded ?? createEmptyWorkout());

const canStart = computed(() => isWorkoutValid(workout.value));

const preview = computed(() =>
  buildTimeline(normalizeWorkout(workout.value) ?? createEmptyWorkout()),
);
const totalText = computed(() =>
  formatDuration(preview.value.reduce((total, step) => total + step.duration, 0)),
);
const setsText = computed(() =>
  countPl(toValidInt(workout.value.sets, 'sets'), 'seria', 'serie', 'serii'),
);
const stepsText = computed(() =>
  countPl(preview.value.length, 'interwał', 'interwały', 'interwałów'),
);
const exerciseCountText = computed(() =>
  countPl(workout.value.exercises.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń'),
);

const uid = useId();
const rowKeys = new WeakMap<Exercise, number>();
let nextRowKey = 0;
const rowKey = (exercise: Exercise) => {
  let key = rowKeys.get(exercise);
  if (key === undefined) {
    key = nextRowKey++;
    rowKeys.set(exercise, key);
  }
  return key;
};
const fieldId = (exercise: Exercise, field: string) =>
  `${uid}-exercise-${rowKey(exercise)}-${field}`;
const exerciseLabel = (exercise: Exercise, index: number) =>
  exercise.name.trim() || `ćwiczenie ${index + 1}`;

const URL_SYNC_DELAY_MS = 300;
let urlSyncTimer: ReturnType<typeof setTimeout> | null = null;

const cancelUrlSync = () => {
  if (urlSyncTimer !== null) {
    clearTimeout(urlSyncTimer);
    urlSyncTimer = null;
  }
};

const syncUrl = () => {
  cancelUrlSync();
  return router.replace({ query: { data: encodeWorkout(workout.value) } });
};

watch(
  workout,
  () => {
    cancelUrlSync();
    urlSyncTimer = setTimeout(syncUrl, URL_SYNC_DELAY_MS);
  },
  { deep: true },
);

onBeforeUnmount(cancelUrlSync);

const onFieldChange = () => {
  sanitizeWorkout(workout.value);
  void syncUrl();
};

const startWorkout = async () => {
  sanitizeWorkout(workout.value);
  if (!canStart.value) {
    return;
  }
  await syncUrl();
  await router.push({ path: '/timer', query: { data: encodeWorkout(workout.value) } });
};

const addExercise = () => {
  workout.value.exercises.push({
    name: '',
    workoutDuration: 30,
    restDuration: 10,
  });
};

const removeExercise = (index: number) => {
  workout.value.exercises.splice(index, 1);
};
</script>

<template>
  <div class="config">
    <!-- Nagłówek sekcji -->
    <header class="config-header">
      <RouterLink to="/" class="icon-button" aria-label="Wróć na stronę główną">
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
      </RouterLink>
      <h1 class="config-header__title display">Skonfiguruj trening</h1>
    </header>

    <p v-if="loadError" class="alert" role="alert">
      Nie udało się wczytać treningu z linku – jest uszkodzony lub niekompletny. Możesz stworzyć
      trening od nowa.
    </p>

    <!-- Karta główna formularza -->
    <div class="config-form" @change="onFieldChange">
      <!-- Nazwa treningu -->
      <div class="field">
        <label :for="`${uid}-title`" class="field-label">Nazwa treningu</label>
        <input
          :id="`${uid}-title`"
          v-model="workout.title"
          class="text-input title-input"
          type="text"
          placeholder="np. Poranne HIIT"
        />
      </div>

      <div class="summary" aria-live="polite">
        <span class="chip">{{ setsText }}</span>
        <span class="chip">{{ stepsText }}</span>
        <span class="chip chip--accent">{{ totalText }} łącznie</span>
      </div>

      <!-- Ustawienia obwodów (SETS) -->
      <section class="card settings">
        <div class="setting">
          <div class="setting__text">
            <label :for="`${uid}-sets`" class="setting__name">Liczba serii</label>
            <span class="setting__hint">Ile razy powtórzyć obwód</span>
          </div>
          <NumberStepper
            :id="`${uid}-sets`"
            v-model="workout.sets"
            field="sets"
            decrease-label="Mniej serii"
            increase-label="Więcej serii"
          />
        </div>
        <div class="setting">
          <div class="setting__text">
            <label :for="`${uid}-rest-between-sets`" class="setting__name">
              Przerwa między seriami
            </label>
            <span class="setting__hint">Po każdym obwodzie, w sekundach</span>
          </div>
          <NumberStepper
            :id="`${uid}-rest-between-sets`"
            v-model="workout.restBetweenSets"
            field="restBetweenSets"
            :step="5"
            unit="s"
            decrease-label="Krótsza przerwa między seriami"
            increase-label="Dłuższa przerwa między seriami"
          />
        </div>
      </section>

      <!-- Lista ćwiczeń -->
      <section class="exercises">
        <div class="section-title">
          <h2 class="section-title__heading display">Ćwiczenia</h2>
          <span class="section-title__count">{{ exerciseCountText }}</span>
        </div>

        <div v-if="workout.exercises.length === 0" class="empty-state">
          Brak ćwiczeń. Dodaj pierwsze, aby zacząć.
        </div>

        <div v-for="(ex, index) in workout.exercises" :key="rowKey(ex)" class="card exercise-row">
          <div class="exercise-row__head">
            <span class="exercise-number display">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="field exercise-row__name">
              <label :for="fieldId(ex, 'name')" class="field-label">Nazwa</label>
              <input
                :id="fieldId(ex, 'name')"
                v-model="ex.name"
                class="text-input"
                type="text"
                placeholder="np. Pompki / Burpees"
              />
            </div>
            <button
              type="button"
              class="btn-icon-danger"
              :aria-label="`Usuń ćwiczenie ${index + 1}`"
              title="Usuń ćwiczenie"
              @click="removeExercise(index)"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 7h16"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"></path>
                <path d="M9 7V4h6v3"></path>
              </svg>
            </button>
          </div>
          <div class="exercise-row__times">
            <div class="field">
              <label :for="fieldId(ex, 'work')" class="field-label">
                <span class="dot dot--work" aria-hidden="true"></span>Praca (s)
              </label>
              <NumberStepper
                :id="fieldId(ex, 'work')"
                v-model="ex.workoutDuration"
                field="workoutDuration"
                :step="5"
                :decrease-label="`Skróć pracę – ${exerciseLabel(ex, index)}`"
                :increase-label="`Wydłuż pracę – ${exerciseLabel(ex, index)}`"
              />
            </div>
            <div class="field">
              <label :for="fieldId(ex, 'rest')" class="field-label">
                <span class="dot dot--rest" aria-hidden="true"></span>Odpoczynek (s)
              </label>
              <NumberStepper
                :id="fieldId(ex, 'rest')"
                v-model="ex.restDuration"
                field="restDuration"
                :step="5"
                :decrease-label="`Skróć odpoczynek – ${exerciseLabel(ex, index)}`"
                :increase-label="`Wydłuż odpoczynek – ${exerciseLabel(ex, index)}`"
              />
            </div>
          </div>
        </div>

        <button type="button" class="btn-add" @click="addExercise">
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
          Dodaj ćwiczenie
        </button>
      </section>
    </div>

    <!-- Akcja główna -->
    <div class="actions">
      <button class="btn-primary btn-start" :disabled="!canStart" @click="startWorkout">
        <span class="btn-start__label">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M8 5.5v13a1 1 0 0 0 1.5.87l10.5-6.5a1 1 0 0 0 0-1.74L9.5 4.63A1 1 0 0 0 8 5.5z"
            ></path>
          </svg>
          Rozpocznij trening
        </span>
        <span class="btn-start__time display">{{ totalText }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.config {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px;
}

.config-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0 4px;
}

.config-header__title {
  margin: 0;
  font-size: 1.75rem;
}

.alert {
  margin: 16px 0 0;
  padding: 14px 16px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-danger);
  background: var(--color-danger-soft);
  color: var(--color-text);
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
}

.title-input {
  height: 56px;
  font-size: 1.25rem;
  font-weight: 700;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.settings {
  padding: 4px 16px;
}

.setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
}

.setting + .setting {
  border-top: 1px solid var(--color-surface-raised);
}

.setting__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.setting__name {
  font-size: 0.95rem;
  font-weight: 700;
}

.setting__hint {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.setting :deep(.stepper) {
  flex: none;
  width: 156px;
}

.exercises {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.section-title__heading {
  margin: 0;
  font-size: 1.6rem;
}

.section-title__count {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.empty-state {
  padding: 28px 20px;
  border-radius: var(--radius-card);
  border: 2px dashed var(--color-border);
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.exercise-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px 16px;
}

.exercise-row__head {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.exercise-number {
  min-width: 34px;
  font-size: 1.9rem;
  line-height: 48px;
  color: var(--color-accent);
}

.exercise-row__name {
  flex: 1;
}

.exercise-row__name .text-input {
  border-color: transparent;
  background: var(--color-surface-raised);
}

.btn-icon-danger {
  flex: none;
  width: 44px;
  height: 48px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.btn-icon-danger svg {
  width: 20px;
  height: 20px;
}

.btn-icon-danger:hover,
.btn-icon-danger:focus-visible {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.exercise-row__times {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.dot--work {
  background: var(--color-work);
}

.dot--rest {
  background: var(--color-rest);
}

.btn-add {
  min-height: 56px;
  border-radius: var(--radius-button);
  border: 2px dashed var(--color-border-strong);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.btn-add svg {
  width: 18px;
  height: 18px;
}

.btn-add:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.actions {
  position: sticky;
  bottom: 0;
  margin: 24px -20px 0;
  padding: 16px 20px 24px;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.btn-start {
  width: 100%;
  min-height: 64px;
  justify-content: space-between;
  font-size: 1.1rem;
}

.btn-start__label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-start__label svg {
  width: 22px;
  height: 22px;
}

.btn-start__time {
  font-size: 1.6rem;
  font-variant-numeric: tabular-nums;
}
</style>
