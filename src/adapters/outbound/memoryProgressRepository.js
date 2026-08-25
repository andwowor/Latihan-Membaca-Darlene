/**
 * ADAPTER (outbound) — ProgressRepository di memori.
 * Dipakai test dan sebagai cadangan bila penyimpanan perangkat tidak tersedia.
 */

/**
 * @param {object|null} [seed] profil awal
 * @returns {import('../../ports/ProgressRepository.js').ProgressRepository}
 */
export function createMemoryProgressRepository(seed = null) {
  let stored = seed ? JSON.parse(JSON.stringify(seed)) : null;
  return {
    load: () => (stored ? JSON.parse(JSON.stringify(stored)) : null),
    save: (profile) => { stored = JSON.parse(JSON.stringify(profile)); },
    clear: () => { stored = null; },
  };
}
