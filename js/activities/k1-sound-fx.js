/* Tiny synthesized nonverbal sound effects. No audio files required, never blocks the lesson. */
(function () {
  let ctx = null;

  function getContext() {
    if (ctx) return ctx;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    try {
      ctx = new AudioCtor();
    } catch (error) {
      ctx = null;
    }
    return ctx;
  }

  function tone(frequency, startDelay, duration, gainPeak, type) {
    const audioCtx = getContext();
    if (!audioCtx) return;
    try {
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = type || "sine";
      oscillator.frequency.value = frequency;
      const startAt = audioCtx.currentTime + startDelay;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(gainPeak, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      oscillator.connect(gain).connect(audioCtx.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.02);
    } catch (error) {
      // Sound is a nice-to-have; never let it interrupt the lesson.
    }
  }

  const SoundFx = {
    pop() { tone(660, 0, 0.12, 0.12, "triangle"); },
    collect() { tone(740, 0, 0.1, 0.12, "triangle"); tone(988, 0.07, 0.12, 0.1, "triangle"); },
    success() { tone(523, 0, 0.1, 0.12, "sine"); tone(659, 0.09, 0.1, 0.12, "sine"); tone(784, 0.18, 0.16, 0.12, "sine"); },
    levelUp() { tone(392, 0, 0.1, 0.12, "sine"); tone(523, 0.1, 0.1, 0.12, "sine"); tone(659, 0.2, 0.1, 0.12, "sine"); tone(784, 0.3, 0.22, 0.12, "sine"); },
    gentle() { tone(392, 0, 0.14, 0.1, "sine"); },
    transition() { tone(587, 0, 0.1, 0.1, "sine"); tone(784, 0.1, 0.16, 0.1, "sine"); }
  };

  window.SubDay = window.SubDay || {};
  window.SubDay.SoundFx = SoundFx;
}());
