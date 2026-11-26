import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ThemePicker from '@/components/ThemePicker.vue';
import FullscreenFace from '@/components/timer-faces/FullscreenFace.vue';
import type { ThemeDefinition, ThemeId } from '@/types/theme';

const makeTheme = (id: string, name: string): ThemeDefinition => ({
  id: id as ThemeId,
  name,
  description: `${name} description`,
  swatches: ['#000000', '#ff0000', '#0000ff'],
  timerFace: FullscreenFace,
  showStepStrip: true,
});

const futureThemes = [makeTheme('pulse', 'Puls'), makeTheme('calm', 'Spokój')];

describe('ThemePicker', () => {
  it('lists every style as a labelled radio button with its swatches', () => {
    const wrapper = mount(ThemePicker, { props: { themes: futureThemes, modelValue: 'pulse' } });

    const options = wrapper.findAll('label.theme-option');
    expect(options.map((option) => option.text())).toEqual(['Puls', 'Spokój']);
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(2);
    expect(wrapper.findAll('.theme-option__swatch')).toHaveLength(6);
    expect(wrapper.get('legend').text()).toBe('Wygląd');
  });

  it('marks the current style', () => {
    const wrapper = mount(ThemePicker, { props: { themes: futureThemes, modelValue: 'pulse' } });
    const radios = wrapper.findAll('input[type="radio"]');

    expect((radios[0]!.element as HTMLInputElement).checked).toBe(true);
    expect((radios[1]!.element as HTMLInputElement).checked).toBe(false);
    expect(wrapper.findAll('.theme-option--selected').map((o) => o.text())).toEqual(['Puls']);
  });

  it('reports the picked style', async () => {
    const wrapper = mount(ThemePicker, { props: { themes: futureThemes, modelValue: 'pulse' } });

    await wrapper.findAll('input[type="radio"]')[1]!.trigger('change');

    expect(wrapper.emitted('update:modelValue')).toEqual([['calm']]);
  });
});
