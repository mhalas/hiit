import { vi } from 'vitest';
import { effectScope, ref, type EffectScope } from 'vue';
import type { Workout } from '@/types/workout';
import { useTimer } from '@/composables/useTimer';

export const TICK_MS = 200;

let clock = 0;
let visibility: DocumentVisibilityState = 'visible';
const scopes: EffectScope[] = [];

export const sounds: string[] = [];
export const audio = { contexts: 0, unlocks: 0 };

export const countSounds = (kind: string) => sounds.filter(s => s === kind).length;

class FakeAudioContext {
    state: AudioContextState = 'suspended';
    currentTime = 0;
    destination = {};

    constructor() {
        audio.contexts++;
    }

    resume() {
        this.state = 'running';
        return Promise.resolve();
    }

    createBuffer() {
        return {};
    }

    createBufferSource() {
        return { buffer: null, connect() {}, start() { audio.unlocks++; } };
    }

    createOscillator() {
        const osc = {
            type: 'sine',
            sweep: false,
            frequency: { value: 0, setValueAtTime: () => { osc.sweep = true; } },
            connect() {},
            stop() {},
            start: () => {
                sounds.push(osc.type === 'sine' ? 'beep' : osc.sweep ? 'change' : 'finish');
            },
        };
        return osc;
    }

    createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
}

class FakeWakeLockSentinel extends EventTarget {
    released = false;
    readonly type = 'screen';

    async release() {
        if (this.released) {
            return;
        }
        this.released = true;
        wakeLock.active.delete(this);
        this.dispatchEvent(new Event('release'));
    }
}

export const wakeLock = {
    requests: 0,
    active: new Set<FakeWakeLockSentinel>(),
    async releaseAllByBrowser() {
        for (const lock of [...this.active]) {
            await lock.release();
        }
    },
};

const fakeWakeLockApi = {
    request: async () => {
        wakeLock.requests++;
        const lock = new FakeWakeLockSentinel();
        wakeLock.active.add(lock);
        return lock;
    },
};

export function installTestEnvironment() {
    clock = 0;
    visibility = 'visible';
    sounds.length = 0;
    wakeLock.requests = 0;
    wakeLock.active.clear();

    vi.useFakeTimers({
        toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
    });
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: fakeWakeLockApi });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
}

export function uninstallTestEnvironment() {
    scopes.splice(0).forEach(scope => scope.stop());
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
}

export function advance(ms: number) {
    for (let elapsed = 0; elapsed < ms; elapsed += TICK_MS) {
        const step = Math.min(TICK_MS, ms - elapsed);
        clock += step;
        vi.advanceTimersByTime(step);
    }
}

export function jumpClock(ms: number) {
    clock += ms;
}

export function now() {
    return clock;
}

export function setVisibility(state: DocumentVisibilityState) {
    visibility = state;
    document.dispatchEvent(new Event('visibilitychange'));
}

export async function flushMicrotasks() {
    for (let i = 0; i < 10; i++) {
        await Promise.resolve();
    }
}

export function createTimer(workout: Workout) {
    const scope = effectScope();
    scopes.push(scope);
    const timer = scope.run(() => useTimer(ref(workout)))!;
    return { timer, scope };
}

export const exercise = (name: string, workoutDuration: number, restDuration: number) =>
    ({ name, workoutDuration, restDuration });

export const workoutOf = (partial: Partial<Workout>): Workout => ({
    title: 'Test',
    sets: 1,
    restBetweenSets: 0,
    exercises: [],
    ...partial,
});
