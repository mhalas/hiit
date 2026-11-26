export type StepKind = 'work' | 'rest' | 'setBreak';

export type TimerPhase = 'work' | 'rest';

export interface TimerStep {
  kind: StepKind;
  exerciseIndex: number | null;
  set: number;
  duration: number;
}
