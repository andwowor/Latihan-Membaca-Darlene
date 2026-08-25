/**
 * ADAPTER (outbound) — SpeechPort kosong untuk lingkungan tanpa Web Speech API
 * (mis. test di Node, atau browser lama). Substitutability: bentuknya sama
 * persis dengan adapter sungguhan, hanya tidak berbunyi.
 */

/** @returns {import('../../ports/SpeechPort.js').SpeechPort} */
export function createNullSpeechAdapter() {
  return {
    speak: async () => {},
    spellOut: async () => {},
    stop: () => {},
    voicesFor: () => [],
    isAvailable: () => false,
    unlock: () => {},
  };
}

/** @returns {import('../../ports/SoundPort.js').SoundPort} */
export function createNullSoundAdapter() {
  return {
    play: () => {},
    unlock: () => {},
  };
}
