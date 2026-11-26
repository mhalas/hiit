import type { Component } from 'vue';

export type ThemeId = 'pulse';

export interface TimerFaceProps {
  phaseLabel: string;
  seconds: number;
  title: string;
  progress: number;
  isFinished: boolean;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  swatches: readonly [string, string, string];
  timerFace: Component;
  showStepStrip: boolean;
}
