import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router';
import TimerView from '@/views/TimerView.vue';
import { decodeWorkout, encodeWorkout } from '@/utils/encoding';
import type { Workout } from '@/types/workout';
import {
  advance,
  exercise,
  installTestEnvironment,
  uninstallTestEnvironment,
  workoutOf,
} from '@/__tests__/helpers';

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
  const fill = wrapper.get('.phase-progress__fill').element as HTMLElement;
  return Number.parseFloat(fill.style.width) / 100;
};

const nextCard = () => wrapper.get('.next-card').text();

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

  it('hides the title badge when the workout has no title', async () => {
    await mountWorkout(workoutOf({ title: '  ', exercises: [exercise('a', 10, 0)] }));

    expect(wrapper.find('.timer-header .badge').exists()).toBe(false);
  });

  it('numbers unnamed exercises in the schedule', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('Pompki', 10, 0), exercise('', 10, 0)] }));

    expect(wrapper.findAll('.item-name').map((n) => n.text())).toEqual(['Pompki', 'Ćwiczenie 2']);
  });

  it('announces phase changes to screen readers but hides the decorative progress', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 10, 0)] }));

    expect(wrapper.get('.phase-label').attributes('aria-live')).toBe('polite');
    expect(wrapper.get('.phase-progress').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('.step-strip').attributes('aria-hidden')).toBe('true');
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
    expect(text('.time-left')).toBe('30');
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
    expect(wrapper.find('.time-left').exists()).toBe(false);
    expect(wrapper.find('.face__done').exists()).toBe(true);
    expect(text('.exercise-name-current')).toBe('Świetna robota!');
    expect(wrapper.find('.next-card').exists()).toBe(false);
    expect(button.text()).toBe('Od nowa');
    expect(wrapper.findAll('.playlist-item.active')).toHaveLength(0);

    await button.trigger('click');

    expect(button.text()).toBe('Start');
    expect(text('.time-left')).toBe('2');
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

describe('TimerView – next exercise, time left and skipping', () => {
  const skipBackButton = () => wrapper.get('[aria-label="Poprzedni krok"]');
  const skipForwardButton = () => wrapper.get('[aria-label="Następny krok"]');

  it('shows the next exercise during a rest and during the set break', async () => {
    await mountWorkout(
      workoutOf({
        sets: 2,
        restBetweenSets: 5,
        exercises: [exercise('Pompki', 2, 3), exercise('Przysiady', 2, 0)],
      }),
    );
    await wrapper.get('.timer-controls .btn-primary').trigger('click');
    expect(text('.exercise-name-current')).toBe('Pompki');
    expect(nextCard()).toContain('Odpoczynek');
    expect(nextCard()).toContain('3 s');

    await advanceAndRender(2000);
    expect(text('.phase-label')).toBe('ODPOCZYNEK');
    expect(wrapper.find('.exercise-name-current').exists()).toBe(false);
    expect(nextCard()).toContain('Przysiady');

    await advanceAndRender(5000);
    expect(text('.phase-label')).toBe('PRZERWA MIĘDZY SERIAMI');
    expect(nextCard()).toContain('Pompki');
    expect(nextCard()).toContain('2 s');
  });

  it('uses a numbered name for exercises without a name', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('', 2, 3), exercise('  ', 2, 0)] }));
    expect(text('.exercise-name-current')).toBe('Ćwiczenie 1');

    await skipForwardButton().trigger('click');
    expect(nextCard()).toContain('Ćwiczenie 2');
  });

  it('shows the time left for the whole workout and counts it down', async () => {
    await mountWorkout(workoutOf({ sets: 2, exercises: [exercise('a', 40, 20)] }));
    expect(text('.total-left')).toBe('Pozostało 1:40');

    await wrapper.get('.timer-controls .btn-primary').trigger('click');
    await advanceAndRender(10_000);
    expect(text('.total-left')).toBe('Pozostało 1:30');
  });

  it('hides the time left on the finish screen', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 2, 0)] }));
    await wrapper.get('.timer-controls .btn-primary').trigger('click');

    await advanceAndRender(2000);

    expect(wrapper.find('.total-left').exists()).toBe(false);
  });

  it('skips forward and back with the buttons', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 30, 10), exercise('b', 20, 0)] }));
    expect(skipBackButton().attributes('disabled')).toBeDefined();

    await skipForwardButton().trigger('click');
    expect(text('.phase-label')).toBe('ODPOCZYNEK');
    expect(text('.time-left')).toBe('10');
    expect(text('.total-left')).toBe('Pozostało 0:30');
    expect(ringFill()).toBeCloseTo(1);

    await skipBackButton().trigger('click');
    expect(text('.phase-label')).toBe('ĆWICZENIE');
    expect(text('.time-left')).toBe('30');
  });

  it('can skip to the end, and back from the finish screen', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 30, 0)] }));

    await skipForwardButton().trigger('click');
    expect(text('.phase-label')).toBe('TRENING ZAKOŃCZONY');
    expect(skipForwardButton().attributes('disabled')).toBeDefined();

    await skipBackButton().trigger('click');
    expect(text('.phase-label')).toBe('ĆWICZENIE');
    expect(text('.time-left')).toBe('30');
  });

  it('labels the icon buttons for screen readers', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 30, 0)] }));

    expect(wrapper.findAll('.timer-controls button')).toHaveLength(3);
    expect(skipBackButton().attributes('title')).toBe('Poprzedni krok');
    expect(skipForwardButton().attributes('title')).toBe('Następny krok');
    expect(wrapper.get('.timer-controls .btn-primary').text()).toBe('Start');
  });

  it('starts over from the reset button in the header', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 30, 10), exercise('b', 20, 0)] }));
    await skipForwardButton().trigger('click');
    await skipForwardButton().trigger('click');
    expect(text('.exercise-name-current')).toBe('b');

    await wrapper.get('.timer-header [aria-label="Zacznij od początku"]').trigger('click');

    expect(text('.exercise-name-current')).toBe('a');
    expect(text('.time-left')).toBe('30');
  });
});

describe('TimerView – full-screen phases and step strip (Puls)', () => {
  const segmentFills = () =>
    wrapper
      .findAll('.step-strip__fill')
      .map((fill) => Number.parseFloat((fill.element as HTMLElement).style.width) / 100);

  it('marks the screen with the current phase so the style can colour it', async () => {
    await mountWorkout(
      workoutOf({ sets: 2, restBetweenSets: 4, exercises: [exercise('a', 2, 3)] }),
    );
    const timer = () => wrapper.get('.timer').attributes('data-phase');
    expect(timer()).toBe('work');

    await wrapper.get('.timer-controls .btn-primary').trigger('click');
    await advanceAndRender(2000);
    expect(timer()).toBe('rest');

    await advanceAndRender(3000);
    expect(timer()).toBe('setBreak');

    await advanceAndRender(6000);
    expect(timer()).toBe('done');
  });

  it('shows one strip segment per step and fills them as the workout goes on', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 4, 2), exercise('b', 4, 0)] }));
    expect(segmentFills()).toEqual([0, 0, 0]);

    await wrapper.get('.timer-controls .btn-primary').trigger('click');
    await advanceAndRender(2000);
    const [first, second, third] = segmentFills();
    expect(first).toBeCloseTo(0.5, 2);
    expect([second, third]).toEqual([0, 0]);

    await advanceAndRender(4000);
    expect(segmentFills()[0]).toBe(1);
    expect(segmentFills()[1]).toBe(1);
    expect(segmentFills()[2]).toBeCloseTo(0, 2);
  });

  it('fills the whole strip on the finish screen', async () => {
    await mountWorkout(workoutOf({ exercises: [exercise('a', 2, 0), exercise('b', 2, 0)] }));
    await wrapper.get('[aria-label="Następny krok"]').trigger('click');
    await wrapper.get('[aria-label="Następny krok"]').trigger('click');

    expect(segmentFills()).toEqual([1, 1]);
  });
});
