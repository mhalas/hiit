import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils';
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  RouterView,
  type Router,
  type RouterHistory,
} from 'vue-router';
import ConfiguratorView from '@/views/ConfiguratorView.vue';
import { decodeWorkout, encodeWorkout } from '@/utils/encoding';
import type { Workout } from '@/types/workout';

let router: Router;
let history: RouterHistory;
let wrapper: VueWrapper;

async function mountConfigurator(options: { data?: string; webHistory?: boolean } = {}) {
  if (options.webHistory) {
    window.history.replaceState(null, '', '/');
  }
  history = options.webHistory ? createWebHistory() : createMemoryHistory();
  router = createRouter({
    history,
    routes: [
      { path: '/configurator', component: ConfiguratorView },
      { path: '/timer', component: { render: () => null } },
    ],
  });
  await router.push({
    path: '/configurator',
    query: options.data === undefined ? {} : { data: options.data },
  });
  await router.isReady();
  wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
    global: { plugins: [router] },
  });
  return wrapper;
}

const urlWorkout = () => decodeWorkout(router.currentRoute.value.query.data);
const startButton = () => wrapper.get('.actions .btn-primary');
const numberInputs = () => wrapper.findAll('input[type="number"]');

async function type(input: Pick<DOMWrapper<Element>, 'element' | 'trigger'>, value: string) {
  (input.element as HTMLInputElement).value = value;
  await input.trigger('input');
}

async function addExercise(name: string) {
  await wrapper.get('.btn-text').trigger('click');
  const rows = wrapper.findAll('.exercise-row');
  await type(rows[rows.length - 1]!.get('input[type="text"]'), name);
}

const sample: Workout = {
  title: 'Wieczorny obwód',
  sets: 2,
  restBetweenSets: 45,
  exercises: [{ name: 'Przysiady', workoutDuration: 40, restDuration: 15 }],
};

afterEach(() => {
  wrapper?.unmount();
  history?.destroy();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ConfiguratorView – loading', () => {
  it('starts empty without an error when opened from the home page', async () => {
    await mountConfigurator();

    expect(wrapper.find('.alert').exists()).toBe(false);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(startButton().attributes('disabled')).toBeDefined();
  });

  it('fills the form from a shared link', async () => {
    await mountConfigurator({ data: encodeWorkout(sample) });

    expect((wrapper.get('input[type="text"]').element as HTMLInputElement).value).toBe(
      'Wieczorny obwód',
    );
    expect(wrapper.findAll('.exercise-row')).toHaveLength(1);
    expect(startButton().attributes('disabled')).toBeUndefined();
  });

  it('shows a message for a broken link', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await mountConfigurator({ data: '%%%garbage' });

    expect(wrapper.get('.alert').text()).toContain('Nie udało się wczytać treningu z linku');
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });
});

describe('ConfiguratorView – validation', () => {
  it('disables Start and marks the field while a number is empty', async () => {
    await mountConfigurator({ data: encodeWorkout(sample) });
    const sets = numberInputs()[0]!;

    await type(sets, '');

    expect(sets.classes()).toContain('invalid');
    expect(startButton().attributes('disabled')).toBeDefined();
  });

  it('fixes the value when you leave the field', async () => {
    await mountConfigurator({ data: encodeWorkout(sample) });
    const [sets, , work, rest] = numberInputs();

    await type(sets!, '');
    await sets!.trigger('change');
    await type(work!, '2.6');
    await work!.trigger('change');
    await type(rest!, '-4');
    await rest!.trigger('change');

    expect((sets!.element as HTMLInputElement).value).toBe('1');
    expect((work!.element as HTMLInputElement).value).toBe('3');
    expect((rest!.element as HTMLInputElement).value).toBe('0');
    expect(sets!.classes()).not.toContain('invalid');
    expect(startButton().attributes('disabled')).toBeUndefined();
  });

  it('enables Start once there is an exercise and disables it again when it is removed', async () => {
    await mountConfigurator();

    await addExercise('Pompki');
    expect(startButton().attributes('disabled')).toBeUndefined();

    await wrapper.get('.btn-icon-danger').trigger('click');
    expect(startButton().attributes('disabled')).toBeDefined();
  });
});

describe('ConfiguratorView – accessibility and list', () => {
  it('links every label to its own input', async () => {
    await mountConfigurator({ data: encodeWorkout(sample) });
    await addExercise('Pompki');

    const labels = wrapper.findAll('label');
    const ids = labels.map((label) => label.attributes('for'));

    expect(labels).toHaveLength(3 + 2 * 3);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toBeTruthy();
      expect(wrapper.find(`input[id="${id}"]`).exists()).toBe(true);
    }
  });

  it('names each delete button after its exercise number', async () => {
    await mountConfigurator({ data: encodeWorkout(sample) });
    await addExercise('Pompki');

    const buttons = wrapper.findAll('.btn-icon-danger');

    expect(buttons.map((b) => b.attributes('aria-label'))).toEqual([
      'Usuń ćwiczenie 1',
      'Usuń ćwiczenie 2',
    ]);
  });

  it('keeps the remaining rows intact when one is deleted', async () => {
    await mountConfigurator();
    await addExercise('Pierwsze');
    await addExercise('Drugie');
    const secondRowInput = wrapper.findAll('.exercise-row input[type="text"]')[1]!.element;

    await wrapper.findAll('.btn-icon-danger')[0]!.trigger('click');

    const rows = wrapper.findAll('.exercise-row');
    expect(rows).toHaveLength(1);
    const remainingInput = rows[0]!.get('input[type="text"]').element as HTMLInputElement;
    expect(remainingInput).toBe(secondRowInput);
    expect(remainingInput.value).toBe('Drugie');
  });

  it('does not put row keys or ids into the link', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await mountConfigurator();
    await addExercise('Pompki');

    await wrapper.get('.exercise-row input[type="text"]').trigger('change');
    await flushPromises();

    expect(urlWorkout()?.exercises).toEqual([
      { name: 'Pompki', workoutDuration: 30, restDuration: 10 },
    ]);
  });
});

describe('ConfiguratorView – link in the address bar', () => {
  it('updates the link through the router 300 ms after typing stops', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await mountConfigurator();

    await addExercise('Pompki');
    vi.advanceTimersByTime(299);
    await flushPromises();
    expect(router.currentRoute.value.query.data).toBeUndefined();

    vi.advanceTimersByTime(1);
    await flushPromises();
    expect(urlWorkout()?.exercises[0]?.name).toBe('Pompki');
  });

  it('updates the link immediately when you leave a field', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await mountConfigurator();
    await addExercise('Pompki');

    await wrapper.get('.exercise-row input[type="text"]').trigger('change');
    await flushPromises();

    expect(urlWorkout()?.exercises[0]?.name).toBe('Pompki');
  });

  it('opens the timer with the current workout', async () => {
    await mountConfigurator();
    await addExercise('Pompki');

    await startButton().trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/timer');
    expect(urlWorkout()?.exercises).toEqual([
      { name: 'Pompki', workoutDuration: 30, restDuration: 10 },
    ]);
  });

  it('keeps the latest workout when you press Back in the browser after starting', async () => {
    await mountConfigurator({ webHistory: true });
    await type(wrapper.get('input[type="text"]'), 'Mój trening');
    await addExercise('Pompki');

    await startButton().trigger('click');
    await flushPromises();
    expect(window.location.pathname).toBe('/timer');

    const backDone = new Promise<void>((resolve) => {
      const stop = router.afterEach(() => {
        stop();
        resolve();
      });
    });
    router.back();
    await backDone;
    await flushPromises();

    expect(window.location.pathname).toBe('/configurator');
    expect(decodeWorkout(new URLSearchParams(window.location.search).get('data'))).toMatchObject({
      title: 'Mój trening',
      exercises: [{ name: 'Pompki' }],
    });
    expect((wrapper.get('input[type="text"]').element as HTMLInputElement).value).toBe(
      'Mój trening',
    );
  });
});
