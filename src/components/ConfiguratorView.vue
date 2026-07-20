<script setup lang="ts">
import { onMounted, ref, watch, type Ref } from 'vue';
import type { Workout } from '../types/workout';
import { useRoute, useRouter } from 'vue-router';
import { useWorkoutParser } from '@/composables/useWorkoutParser';

const route = useRoute();
const router = useRouter();
const { encodeWorkout, decodeWorkout } = useWorkoutParser();
const workout: Ref<Workout> = ref({
    title: '',
    exercises: [],
    sets: 1,
    restBetweenSets: 0
} as Workout);

onMounted(() => {
    const data = route.query.data as string | undefined;
    if (data) {
        const parsedWorkout = decodeWorkout(data);
        if (parsedWorkout) {
            workout.value = parsedWorkout;
        } else {
            console.error('Nie udało się zdekodować treningu z URL.');
        }
    } else {
        console.error('Brak danych treningu w URL.');
    }
});

watch(workout, (updatedWorkout) => {
    if (updatedWorkout) {
      const encodedData = encodeWorkout(updatedWorkout);
      const url = new URL(window.location.href);
      url.searchParams.set('data', encodedData);
      window.history.replaceState({}, '', url.toString());
    }
  },
  { deep: true }
);

const startWorkout = () => {
  router.push({path: '/timer', query: { data: encodeWorkout(workout.value) }});
};

const addExercise = () => {
  workout.value.exercises.push({
      name: '',
      workoutDuration: 30,
      restDuration: 10
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

    <!-- Karta główna formularza -->
    <div class="card main-card">
      <!-- Nazwa treningu -->
      <div class="input-group">
        <label>Nazwa treningu</label>
        <input 
          v-model="workout.title" 
          type="text" 
          placeholder="np. Poranne HIIT Spalanie" 
        />
      </div>

      <div class="divider"></div>

      <!-- Ustawienia obwodów (SETS) -->
      <div class="global-settings-grid">
        <div class="input-group">
          <label>Liczba obwodów (Serie)</label>
          <input v-model.number="workout.sets" type="number" min="1" />
        </div>

        <div class="input-group">
          <label>Przerwa między obwodami (s)</label>
          <input v-model.number="workout.restBetweenSets" type="number" min="0" />
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

        <div 
          v-for="(ex, index) in workout.exercises" 
          :key="index" 
          class="exercise-row"
        >
          <div class="exercise-number">{{ index + 1 }}</div>
          
          <div class="input-group flex-grow">
            <label>Nazwa</label>
            <input v-model="ex.name" type="text" placeholder="np. Pompki / Burpees" />
          </div>

          <div class="input-group small">
            <label>Praca (s)</label>
            <input v-model.number="ex.workoutDuration" type="number" min="1" />
          </div>

          <div class="input-group small">
            <label>Odpoczynek (s)</label>
            <input v-model.number="ex.restDuration" type="number" min="0" />
          </div>

          <button class="btn-icon-danger" @click="removeExercise(index)" title="Usuń ćwiczenie">
            ✕
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Akcja główna -->
      <div class="actions">
        <button class="btn-primary full-width" @click="startWorkout" :disabled="workout.exercises.length === 0">
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
  color: var(--text, #e0e0e0);
}

.config-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 109, 0, 0.15);
  color: var(--accent, #ff6d00);
  border-radius: 50px;
  margin-bottom: 1rem;
}

.config-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.subtitle {
  color: var(--text-dim, #a0a0a0);
  font-size: 1.1rem;
  margin: 0;
}

.card {
  background: var(--card, #1e1e1e);
  padding: 2.5rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-dim, #a0a0a0);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.85rem 1rem;
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--accent, #ff6d00);
  background: rgba(255, 255, 255, 0.06);
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 2rem 0;
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
  color: #fff;
}

.btn-text {
  background: transparent;
  color: var(--accent, #ff6d00);
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
  color: var(--text-dim, #a0a0a0);
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
  color: var(--text-dim, #a0a0a0);
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
  color: #a0a0a0;
  border: none;
  font-size: 1rem;
  padding: 0.85rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-danger:hover {
  background: rgba(255, 75, 75, 0.15);
  color: #ff4b4b;
}

.actions {
  margin-top: 1rem;
}

.full-width {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  border-radius: 50px;
}

.btn-primary {
  background: var(--accent, #ff6d00);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  filter: brightness(1.15);
  transform: translateY(-2px);
}
</style>