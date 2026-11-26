import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import NumberStepper from '@/components/NumberStepper.vue';
import type { IntField } from '@/utils/workout';

const mountStepper = (modelValue: unknown, field: IntField = 'restDuration', step = 5) =>
  mount(NumberStepper, {
    props: {
      id: 'stepper',
      modelValue: modelValue as number,
      field,
      step,
      unit: 's',
      decreaseLabel: 'Mniej',
      increaseLabel: 'Więcej',
      'onUpdate:modelValue': () => {},
    },
  });

const emitted = (wrapper: ReturnType<typeof mountStepper>) =>
  (wrapper.emitted('update:modelValue') ?? []).map(([value]) => value);

describe('NumberStepper', () => {
  it('increases and decreases by its step', async () => {
    const wrapper = mountStepper(10);

    await wrapper.get('[aria-label="Więcej"]').trigger('click');
    await wrapper.get('[aria-label="Mniej"]').trigger('click');

    expect(emitted(wrapper)).toEqual([15, 5]);
  });

  it('never goes below the field minimum', async () => {
    const wrapper = mountStepper(3);

    await wrapper.get('[aria-label="Mniej"]').trigger('click');

    expect(emitted(wrapper)).toEqual([0]);
  });

  it('disables the minus button at the minimum', () => {
    expect(mountStepper(0).get('[aria-label="Mniej"]').attributes('disabled')).toBeDefined();
    expect(
      mountStepper(1, 'sets', 1).get('[aria-label="Mniej"]').attributes('disabled'),
    ).toBeDefined();
    expect(
      mountStepper(2, 'sets', 1).get('[aria-label="Mniej"]').attributes('disabled'),
    ).toBeUndefined();
  });

  it('starts from a valid number when the field is empty', async () => {
    const wrapper = mountStepper('', 'sets', 1);

    await wrapper.get('[aria-label="Więcej"]').trigger('click');

    expect(emitted(wrapper)).toEqual([2]);
  });

  it('keeps a real number input that can be typed into', async () => {
    const wrapper = mountStepper(10);
    const input = wrapper.get('input');

    expect(input.attributes('id')).toBe('stepper');
    expect(input.attributes('type')).toBe('number');
    expect(input.attributes('inputmode')).toBe('numeric');

    await input.setValue('25');

    expect(emitted(wrapper)).toContain(25);
  });

  it('marks an invalid value', () => {
    const invalid = mountStepper('');
    const valid = mountStepper(10);

    expect(invalid.get('input').classes()).toContain('invalid');
    expect(invalid.get('.stepper').classes()).toContain('stepper--invalid');
    expect(valid.get('input').classes()).not.toContain('invalid');
  });

  it('shows the unit next to the value', () => {
    expect(mountStepper(10).get('.stepper__unit').text()).toBe('s');
  });
});
