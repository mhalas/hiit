import FullscreenFace from '@/components/timer-faces/FullscreenFace.vue';
import type { ThemeDefinition } from '@/types/theme';
import './pulse.css';

const pulse: ThemeDefinition = {
  id: 'pulse',
  name: 'Puls',
  description: 'Ciemny i odważny, z pełnoekranowymi kolorami faz.',
  swatches: ['#0b0b0c', '#ff6a1a', '#1d4ed8'],
  timerFace: FullscreenFace,
  showStepStrip: true,
};

export const themes: readonly ThemeDefinition[] = [pulse];

export const defaultTheme: ThemeDefinition = pulse;

export const findTheme = (id: unknown): ThemeDefinition | undefined =>
  themes.find((theme) => theme.id === id);
