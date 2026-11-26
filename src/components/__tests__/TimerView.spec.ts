import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router';
import TimerView from '@/components/TimerView.vue';
import { useWorkoutParser } from '@/composables/useWorkoutParser';
import type { Workout } from '@/types/workout';
import {
  advance,
  exercise,
  installTestEnvironment,
  uninstallTestEnvironment,
  workoutOf,
} from '@/__tests__/helpers';

const { encodeWorkout, decodeWorkout } = useWorkoutParser();
const CIRCUMFERENCE = 2 * Math.PI * 120;

let router: Router;
let wrapper: VueWrapper;

async function mountTimer(data: string | undefined) {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/timer', component: TimerView },
      { path: '/configurator', component: { render: () => null } },
    ],
  });
  await router.push({ path: '/timer', query: data === undefined ? {} : { data } });
  await router.isReady();
  wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
    global: { plugins: [router] },
  });
  return wrapper;
}

const mountWorkout = (workout: Workout) => mountTimer(encodeWorkout(workout));

const ringFill = () => {
  const circle = wrapper.get('.progress-ring__circle').element as SVGCircleElement;
  const offset = Number(circle.style.strokeDashoffset);
  return 1 - offset / CIRCUMFERENCE;
};

const text = (selector: string) => wrapper.get(selector).text();

const advanceAndRender = async (ms: number) => {
  advance(ms);
  await nextTick();
};

beforeEach(installTestEnvironment);
afterEach(() => {
  wrapper?.unmount();
  uninstallTestEnvironment();
});

describe('TimerView – loading', () => {
  it.each([
    ['missing data', undefined],
    ['a broken link', '%%%garbage'],
  ])('shows an error for %s', async (_, data) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await mountTimer(data);

    expect(text('[role="alert"] h2')).toBe('Nie udało się wczytać treningu');
    expect(wrapper.find('.circle-timer').exists()).toBe(false);
  });

  it('explains when the workout has no exercises', async () => {
    await mountWorkout(workoutOf({ exercises: [] }));

    expect(text('[role="alert"] p')).toContain('nie zawiera żadnych ćwiczeń');
  });

  it('sends you to an empty configurator from the error screen', async () => {
    await mountTimer(undefined);

    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/configurator');
    expect(router.currentRoute.value.query.data).toBeUndefined();
  });

  it('shows the first exercise ready to start', async () => {
    await mountWorkout(
      workoutOf({ title: 'Poranny', sets: 3, exercises: [exercise('Pompki', 30, 10)] }),
    );

    expect(text('.badge')).toBe('Poranny');
    expect(text('.timer-header h2')).toBe('Seria 1 / 3');
    expect(text('.time-left')).toBe('30s');
    expect(text('.exercise-name-current')).toBe('Pompki');
    expect(text('.timer-controls .btn-primary')).toBe('Start');
    expect(ringFill()).toBeCloseTo(1);
  });
});

describe('TimerView – progress ring', () => {
  it('drains smoothly and is empty exactly when the phase ends', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 4, 0), exercise('b', 4, 0)] }));
    await wrapper.get('.timer-controls .btn-primary').trigger('click');

    await advanceAndRender(2000);
    expect(ringFill()).toBeCloseTo(0.5, 2);

    await advanceAndRender(1000);
    expect(ringFill()).toBeCloseTo(0.25, 2);

    await advanceAndRender(800);
    expect(ringFill()).toBeCloseTo(0.05, 2);

    await advanceAndRender(200);
    expect(text('.exercise-name-current')).toBe('b');
    expect(ringFill()).toBeCloseTo(1, 2);
  });

  it('is drawn during the break between sets', async () => {
    await mountWorkout(
      workoutOf({ sets: 2, restBetweenSets: 4, exercises: [exercise('a', 2, 0)] }),
    );
    await wrapper.get('.timer-controls .btn-primary').trigger('click');

    await advanceAndRender(2000);
    expect(text('.phase-label')).toBe('PRZERWA MIĘDZY SERIAMI');
    expect(ringFill()).toBeCloseTo(1, 2);

    await advanceAndRender(2000);
    expect(ringFill()).toBeCloseTo(0.5, 2);
  });

  it('does not move while paused', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 10, 0)] }));
    const button = wrapper.get('.timer-controls .btn-primary');
    await button.trigger('click');
    await advanceAndRender(2500);

    await button.trigger('click');
    expect(button.text()).toBe('Start');
    const pausedFill = ringFill();

    await advanceAndRender(3000);
    expect(ringFill()).toBeCloseTo(pausedFill, 5);
    expect(pausedFill).toBeCloseTo(0.75, 2);
  });
});

describe('TimerView – controls and finish', () => {
  it('toggles between Start and Pauza', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 10, 0)] }));
    const button = wrapper.get('.timer-controls .btn-primary');

    await button.trigger('click');
    expect(button.text()).toBe('Pauza');

    await button.trigger('click');
    expect(button.text()).toBe('Start');
  });

  it('shows the finish screen and starts over with "Od nowa"', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 2, 5), exercise('b', 2, 5)] }));
    const button = wrapper.get('.timer-controls .btn-primary');
    await button.trigger('click');

    await advanceAndRender(9000);

    expect(text('.phase-label')).toBe('TRENING ZAKOŃCZONY');
    expect(text('.time-left')).toBe('✓');
    expect(button.text()).toBe('Od nowa');
    expect(wrapper.findAll('.playlist-item.active')).toHaveLength(0);

    await button.trigger('click');

    expect(button.text()).toBe('Start');
    expect(text('.time-left')).toBe('2s');
    expect(text('.phase-label')).toBe('ĆWICZENIE');
  });

  it('highlights the current exercise in the schedule', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 2, 0), exercise('b', 2, 0)] }));
    await wrapper.get('.timer-controls .btn-primary').trigger('click');

    expect(text('.playlist-item.active .item-name')).toBe('a');

    await advanceAndRender(2000);
    expect(text('.playlist-item.active .item-name')).toBe('b');
  });

  it('stops the timer when you go back to the configurator', async () => {
    const workout = workoutOf({ exercises: [exercise('Pompki', 30, 10)] });
    await mountWorkout(workout);
    await wrapper.get('.timer-controls .btn-primary').trigger('click');
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    await wrapper.get('.btn-back').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/configurator');
    expect(decodeWorkout(router.currentRoute.value.query.data)).toEqual(workout);
    expect(vi.getTimerCount()).toBe(0);
  });
});
