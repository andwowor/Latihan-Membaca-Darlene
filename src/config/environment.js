/**
 * Konfigurasi lingkungan. Tidak ada rahasia di sini — aplikasi ini
 * sepenuhnya berjalan di perangkat dan tidak memanggil API berbayar.
 * Kredensial deploy hanya hidup sebagai GitHub Secrets (lihat .env.example).
 */

export const APP_NAME = 'Baca Yuk, Darlene!';

/** Dinaikkan setiap rilis; dipakai service worker untuk menyegarkan cache. */
export const APP_VERSION = '1.3.0';

/** Pengaturan cadangan bila profil belum sempat dimuat. */
export const FALLBACK_SETTINGS = Object.freeze({
  sound: true,
  speech: true,
  speechRate: 0.85,
  indonesianVoiceId: '',
  englishVoiceId: '',
});

/** Deteksi kemampuan perangkat, dipakai memilih adapter. */
export function detectCapabilities(globalScope = globalThis) {
  return {
    hasLocalStorage: (() => {
      try {
        const probe = '__probe__';
        globalScope.localStorage.setItem(probe, '1');
        globalScope.localStorage.removeItem(probe);
        return true;
      } catch {
        return false;
      }
    })(),
    hasSpeechSynthesis: 'speechSynthesis' in globalScope,
    hasWebAudio: Boolean(globalScope.AudioContext || globalScope.webkitAudioContext),
    hasServiceWorker: 'serviceWorker' in (globalScope.navigator || {}),
  };
}
