/**
 * ADAPTER (outbound) — implementasi ProgressRepository di atas localStorage.
 * Satu-satunya berkas di proyek ini yang boleh menyebut localStorage.
 */

/** Kunci penyimpanan; menyertakan versi agar aman saat bentuk data berubah. */
export const STORAGE_KEY = 'darlene-membaca-v1';

/**
 * @param {{storage?: Storage, key?: string}} [options]
 * @returns {import('../../ports/ProgressRepository.js').ProgressRepository}
 */
export function createLocalStorageProgressRepository(options = {}) {
  const storage = options.storage || globalThis.localStorage;
  const key = options.key || STORAGE_KEY;

  return {
    load() {
      try {
        const raw = storage?.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        // Mode penyamaran Safari atau data rusak: mulai dari profil baru.
        console.warn('Progres tersimpan tidak terbaca, memulai profil baru.', error);
        return null;
      }
    },

    save(profile) {
      try {
        storage?.setItem(key, JSON.stringify(profile));
      } catch (error) {
        console.warn('Progres gagal disimpan (penyimpanan penuh atau ditolak).', error);
      }
    },

    clear() {
      try {
        storage?.removeItem(key);
      } catch (error) {
        console.warn('Progres gagal dihapus.', error);
      }
    },
  };
}
