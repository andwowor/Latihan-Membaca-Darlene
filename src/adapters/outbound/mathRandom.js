/**
 * ADAPTER (outbound) — RandomPort memakai Math.random bawaan.
 * @returns {import('../../ports/RandomPort.js').RandomPort}
 */
export function createMathRandom() {
  return { next: () => Math.random() };
}

/**
 * RandomPort deterministik dari sebuah benih; dipakai test.
 * @param {() => number} generator
 */
export function createSeededRandomPort(generator) {
  return { next: generator };
}
