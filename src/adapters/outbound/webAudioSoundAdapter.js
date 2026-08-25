/**
 * ADAPTER (outbound) — SoundPort memakai Web Audio API.
 * Efek suara disintesis langsung sehingga aplikasi tidak perlu berkas audio
 * dan tetap ringan saat dipakai offline.
 */

/** Not nada tiap efek: [frekuensi Hz, jeda mulai detik, panjang detik, bentuk, keras]. */
const EFFECT_NOTES = {
  tap: [[660, 0, 0.08, 'triangle', 0.10]],
  correct: [[660, 0, 0.14, 'sine', 0.18], [880, 0.10, 0.16, 'sine', 0.18], [1320, 0.20, 0.22, 'sine', 0.18]],
  wrong: [[220, 0, 0.20, 'sawtooth', 0.10], [160, 0.12, 0.26, 'sawtooth', 0.09]],
  star: [[880, 0, 0.10, 'sine', 0.18], [1175, 0.08, 0.10, 'sine', 0.18], [1568, 0.16, 0.20, 'sine', 0.18]],
  levelup: [[523, 0, 0.30, 'triangle', 0.16], [659, 0.10, 0.30, 'triangle', 0.16], [784, 0.20, 0.30, 'triangle', 0.16], [1047, 0.30, 0.34, 'triangle', 0.16]],
  finish: [[523, 0, 0.34, 'sine', 0.15], [659, 0.09, 0.34, 'sine', 0.15], [784, 0.18, 0.34, 'sine', 0.15], [1047, 0.27, 0.34, 'sine', 0.15], [1319, 0.36, 0.40, 'sine', 0.15]],
  badge: [[784, 0, 0.35, 'triangle', 0.16], [988, 0.12, 0.35, 'triangle', 0.16], [1319, 0.24, 0.38, 'triangle', 0.16]],
};

/**
 * @param {{getSettings: () => object}} dependencies
 * @returns {import('../../ports/SoundPort.js').SoundPort}
 */
export function createWebAudioSoundAdapter({ getSettings }) {
  let context = null;

  function ensureContext() {
    if (context) return context;
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      context = new AudioContextClass();
    } catch {
      context = null;
    }
    return context;
  }

  function playNote(audio, [frequency, startAt, duration, waveform, volume]) {
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    const startTime = audio.currentTime + startAt;
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(envelope).connect(audio.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  }

  return {
    play(effect) {
      if (!getSettings().sound) return;
      const audio = ensureContext();
      const notes = EFFECT_NOTES[effect];
      if (!audio || !notes) return;
      if (audio.state === 'suspended') audio.resume();
      try {
        notes.forEach((note) => playNote(audio, note));
      } catch {
        /* perangkat menolak memutar suara: bukan kesalahan fatal */
      }
    },

    /** Wajib dipanggil dari sentuhan pertama pengguna (syarat iOS Safari). */
    unlock() {
      const audio = ensureContext();
      if (!audio) return;
      if (audio.state === 'suspended') audio.resume();
      try {
        const oscillator = audio.createOscillator();
        const envelope = audio.createGain();
        envelope.gain.value = 0.0001;
        oscillator.connect(envelope).connect(audio.destination);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.02);
      } catch {
        /* abaikan */
      }
    },
  };
}
