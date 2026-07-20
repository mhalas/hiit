<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkoutParser } from '../composables/useWorkoutParser';
import type { Workout } from '../types/workout';
import { useTimer } from '@/composables/useTimer';

const route = useRoute();
const router = useRouter();
const { decodeWorkout } = useWorkoutParser();

const workout = ref<Workout>({
    title: '',
    sets: 1,
    exercises: [],
    restBetweenSets: 0,
} as Workout);

const { secondsLeft, currentSet, currentPhase, isRunning, currentExerciseIndex, start, pause, reset } = useTimer(workout);

const backToConfigurator = () => {
  router.push({path: '/configurator', query: { data: route.query.data as string }});
};

const currentExercise = computed(() => {
    if (!workout.value) return null;
    return workout.value.exercises[currentExerciseIndex.value];
});

const progressPercentage = computed(() => {
    const ex = currentExercise.value;
    if (!ex) {
        return 0;
    }

    if (currentPhase.value === 'rest' && currentExerciseIndex.value === -1) {
        const maxTime = workout.value.restBetweenSets || 1;
        return secondsLeft.value / maxTime;
    }

    const maxTime = currentPhase.value === 'work' ? ex.workoutDuration : ex.restDuration;
    if (maxTime === 0) return 0;
    return secondsLeft.value / maxTime;
});

const currentPhaseText = computed(() => {
    if (currentPhase.value === 'rest') {
        if (currentExerciseIndex.value === -1) {
            return 'PRZERWA MIĘDZY SERIAMI';
        }

        return 'ODPOCZYNEK';
    }

    return 'ĆWICZENIE';
});

const toggle = () => {
    if (isRunning.value) {
        pause();
    } else {
        start();
    }
};

const circumference = 2 * Math.PI * 120;
const dashOffset = computed(() => {
    return circumference - progressPercentage.value * circumference;
});

onMounted(() => {
    const data = route.query.data as string;
    if (data) {
        const decoded = decodeWorkout(data);
        if (decoded) {
            workout.value = decoded;
            if (decoded.exercises.length > 0) {
                secondsLeft.value = decoded.exercises[0]?.workoutDuration || 0;
            }
        }
    }
});
</script>

<template>
    <div class="timer-container" v-if="workout">
        <div class="top-nav">
            <button class="btn-back" @click="backToConfigurator">
                ← Wróć do konfiguratora
            </button>
        </div>
        <header class="timer-header">
            <span class="badge">{{ workout.title }}</span>
            <h2>Seria {{ currentSet }} / {{ workout.sets }}</h2>
        </header>

        <!-- Główny okrągły licznik -->
        <div class="circle-timer" :class="currentPhase">
            <svg class="progress-ring" width="260" height="260" viewBox="0 0 260 260">
                <circle class="progress-ring__circle" stroke-width="10" stroke="currentColor" fill="transparent" r="120"
                    cx="130" cy="130" :stroke-dasharray="circumference" :style="{ strokeDashoffset: dashOffset }" />
            </svg>
            <div class="timer-content">
                <span class="phase-label">{{ currentPhaseText }}</span>
                <span class="time-left">{{ secondsLeft }}s</span>
                <span class="exercise-name-current">{{ currentExercise?.name }}</span>
            </div>
        </div>

        <!-- Przyciski sterujące -->
        <div class="timer-controls">
            <button class="btn-primary" @click="toggle">
                {{ isRunning ? 'Pauza' : 'Start' }}
            </button>
            <button class="btn-secondary" @click="reset">Reset</button>
        </div>

        <!-- Lista wszystkich ćwiczeń i odpoczynków -->
        <div class="playlist-card">
            <h3>Harmonogram treningu</h3>
            <div class="exercises-list">
                <div v-for="(ex, index) in workout.exercises" :key="index" class="playlist-item"
                    :class="{ active: index === currentExerciseIndex }">
                    <div class="item-info">
                        <span class="item-number">{{ index + 1 }}</span>
                        <span class="item-name">{{ ex.name }}</span>
                    </div>
                    <div class="item-durations">
                        <span class="badge-work">Praca: {{ ex.workoutDuration }}s</span>
                        <span class="badge-rest">Odpoczynek: {{ ex.restDuration }}s</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="timer-container loading">
        <p>Ładowanie treningu...</p>
    </div>
</template>

<style scoped>
.timer-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
    color: var(--text, #e0e0e0);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.timer-header {
    text-align: center;
    margin-bottom: 2rem;
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
    margin-bottom: 0.5rem;
}

.timer-header h2 {
    font-size: 1.5rem;
    margin: 0;
    color: #fff;
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
    transition: stroke-dashoffset 1s linear;
}

/* Kolory faz */
.circle-timer.work {
    color: #ff6d00;
    /* Pomarańczowy */
}

.circle-timer.rest {
    color: #10b981;
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
    color: #ff6d00;
}

.circle-timer.rest .phase-label {
    color: #10b981;
}

.time-left {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: #fff;
}

.exercise-name-current {
    font-size: 0.9rem;
    color: var(--text-dim, #a0a0a0);
    margin-top: 0.4rem;
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Sterowanie */
.timer-controls {
    display: flex;
    gap: 1rem;
    width: 100%;
    max-width: 350px;
    margin-bottom: 2.5rem;
}

.timer-controls button {
    flex: 1;
    padding: 0.85rem;
    font-size: 1rem;
    border-radius: 50px;
    font-weight: 600;
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
}

/* Harmonogram / Lista */
.playlist-card {
    width: 100%;
    background: var(--card, #1e1e1e);
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.04);
}

.playlist-card h3 {
    font-size: 1.1rem;
    margin-top: 0;
    margin-bottom: 1rem;
    color: #fff;
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
    transition: all 0.2s;
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
    color: var(--text-dim, #a0a0a0);
    font-weight: bold;
}

.playlist-item.active .item-number {
    color: var(--accent, #ff6d00);
}

.item-name {
    font-weight: 500;
    color: #e0e0e0;
}

.playlist-item.active .item-name {
    color: #fff;
    font-weight: 600;
}

.item-durations {
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
}

.badge-work {
    background: rgba(255, 109, 0, 0.15);
    color: #ff6d00;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
}

.badge-rest {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
}

.loading {
    text-align: center;
    padding-top: 20vh;
    color: var(--text-dim, #a0a0a0);
}
</style>