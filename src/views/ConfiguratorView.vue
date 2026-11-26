<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import type { Exercise } from '@/types/exercise';
import type { Workout } from '@/types/workout';
import { useRoute, useRouter } from 'vue-router';
import { decodeWorkout, encodeWorkout } from '@/utils/encoding';
import { createEmptyWorkout, isValidInt, isWorkoutValid, sanitizeWorkout } from '@/utils/workout';

const route = useRoute();
const router = useRouter();

const rawData = route.query.data;
const decoded = decodeWorkout(rawData);
const loadError = ref(rawData !== undefined && decoded === null);
const workout = ref<Workout>(decoded ?? createEmptyWorkout());

const canStart = computed(() => isWorkoutValid(workout.value));

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
  <div class="config-container">
    <!-- Nagłówek sekcji -->
    <header class="config-header">
      <span class="badge">Kreator Treningu</span>
      <h1>Skonfiguruj obwód</h1>
      <p class="subtitle">Wprowadź nazwę, ustaw serie i czas trwania poszczególnych ćwiczeń.</p>
    </header>

    <p v-if="loadError" class="alert" role="alert">
      Nie udało się wczytać treningu z linku – jest uszkodzony lub niekompletny. Możesz stworzyć
      trening od nowa.
    </p>

    <!-- Karta główna formularza -->
    <div class="card main-card" @change="onFieldChange">
      <!-- Nazwa treningu -->
      <div class="input-group">
        <label :for="`${uid}-title`">Nazwa treningu</label>
        <input
          :id="`${uid}-title`"
          v-model="workout.title"
          type="text"
          placeholder="np. Poranne HIIT Spalanie"
        />
      </div>

      <div class="divider"></div>

      <!-- Ustawienia obwodów (SETS) -->
      <div class="global-settings-grid">
        <div class="input-group">
          <label :for="`${uid}-sets`">Liczba obwodów (Serie)</label>
          <input
            :id="`${uid}-sets`"
            v-model.number="workout.sets"
            type="number"
            min="1"
            step="1"
            :class="{ invalid: !isValidInt(workout.sets, 'sets') }"
          />
        </div>

        <div class="input-group">
          <label :for="`${uid}-rest-between-sets`">Przerwa między obwodami (s)</label>
          <input
            :id="`${uid}-rest-between-sets`"
            v-model.number="workout.restBetweenSets"
            type="number"
            min="0"
            step="1"
            :class="{ invalid: !isValidInt(workout.restBetweenSets, 'restBetweenSets') }"
          />
        </div>
      </div>

      <div class="divider"></div>

      <!-- Lista ćwiczeń -->
      <div class="exercises-section">
        <div class="section-title">
          <h2>Lista ćwiczeń</h2>
          <button class="btn-text" @click="addExercise">+ Dodaj ćwiczenie</button>
        </div>

        <div v-if="workout.exercises.length === 0" class="empty-state">
          Brak ćwiczeń. Kliknij przycisk powyżej, aby dodać pierwsze zadanie.
        </div>

        <div v-for="(ex, index) in workout.exercises" :key="rowKey(ex)" class="exercise-row">
          <div class="exercise-number">{{ index + 1 }}</div>

          <div class="input-group flex-grow">
            <label :for="fieldId(ex, 'name')">Nazwa</label>
            <input
              :id="fieldId(ex, 'name')"
              v-model="ex.name"
              type="text"
              placeholder="np. Pompki / Burpees"
            />
          </div>

          <div class="input-group small">
            <label :for="fieldId(ex, 'work')">Praca (s)</label>
            <input
              :id="fieldId(ex, 'work')"
              v-model.number="ex.workoutDuration"
              type="number"
              min="1"
              step="1"
              :class="{ invalid: !isValidInt(ex.workoutDuration, 'workoutDuration') }"
            />
          </div>

          <div class="input-group small">
            <label :for="fieldId(ex, 'rest')">Odpoczynek (s)</label>
            <input
              :id="fieldId(ex, 'rest')"
              v-model.number="ex.restDuration"
              type="number"
              min="0"
              step="1"
              :class="{ invalid: !isValidInt(ex.restDuration, 'restDuration') }"
            />
          </div>

          <button
            class="btn-icon-danger"
            :aria-label="`Usuń ćwiczenie ${index + 1}`"
            title="Usuń ćwiczenie"
            @click="removeExercise(index)"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Akcja główna -->
      <div class="actions">
        <button class="btn-primary full-width" @click="startWorkout" :disabled="!canStart">
          Rozpocznij Trening
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  color: var(--text);
}

.config-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.config-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 1.1rem;
  margin: 0;
}

.main-card {
  padding: 2.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  padding: 0.85rem 1rem;
  border-radius: 12px;
  color: var(--heading);
  font: inherit;
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
}

input.invalid {
  border-color: var(--danger);
}

.alert {
  margin: 0 0 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 75, 75, 0.4);
  background: rgba(255, 75, 75, 0.1);
  color: #ffb4b4;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title h2 {
  font-size: 1.25rem;
  margin: 0;
  color: var(--heading);
}

.btn-text {
  background: transparent;
  color: var(--accent);
  font-weight: 600;
  padding: 0.5rem 0;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-text:hover {
  opacity: 0.8;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.08);
}

.exercise-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.15);
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.exercise-number {
  font-weight: bold;
  color: var(--text-dim);
  padding-bottom: 0.8rem;
  min-width: 1.5rem;
  text-align: center;
}

.flex-grow {
  flex: 2;
}

.small {
  flex: 1;
  max-width: 100px;
}

.btn-icon-danger {
  background: transparent;
  color: var(--text-dim);
  border: none;
  font-size: 1rem;
  padding: 0.85rem;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.btn-icon-danger:hover,
.btn-icon-danger:focus-visible {
  background: var(--danger-soft);
  color: var(--danger);
}

.actions {
  margin-top: 1rem;
}

.full-width {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
}
</style>
