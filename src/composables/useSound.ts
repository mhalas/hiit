let audioCtx: AudioContext | null = null;
let isUnlocked = false;

export function useSound() {
  const getAudioContext = () => {
    if (!audioCtx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    return audioCtx;
  };

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});

      if (!isUnlocked) {
        const source = ctx.createBufferSource();
        source.buffer = ctx.createBuffer(1, 1, 22050);
        source.connect(ctx.destination);
        source.start(0);
        isUnlocked = true;
      }
    } catch (e) {
      console.error('Błąd inicjalizacji dźwięku:', e);
    }
  };

  const playBeep = (frequency = 440, duration = 0.15) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Błąd odtwarzania dźwięku:', e);
    }
  };

  const playChangeSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.error('Błąd odtwarzania dźwięku zmiany:', e);
    }
  };

  const playFinishSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});

      [523.25, 659.25, 783.99].forEach((frequency, i) => {
        const start = ctx.currentTime + i * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = frequency;

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {
      console.error('Błąd odtwarzania dźwięku zakończenia:', e);
    }
  };

  return {
    unlock,
    playBeep,
    playChangeSound,
    playFinishSound,
  };
}