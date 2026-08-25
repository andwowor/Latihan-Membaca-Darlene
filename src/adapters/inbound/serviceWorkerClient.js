/**
 * ADAPTER (inbound) — pendaftaran service worker.
 * Membuat aplikasi tetap bisa dibuka tanpa internet setelah kunjungan pertama.
 */

/**
 * @param {{scriptUrl?: string, onUpdateReady?: () => void}} [options]
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker(options = {}) {
  const { scriptUrl = './sw.js', onUpdateReady } = options;
  if (!('serviceWorker' in (globalThis.navigator || {}))) return null;
  try {
    const registration = await globalThis.navigator.serviceWorker.register(scriptUrl);
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        const hasOldVersion = Boolean(globalThis.navigator.serviceWorker.controller);
        if (installing.state === 'installed' && hasOldVersion) onUpdateReady?.();
      });
    });
    return registration;
  } catch (error) {
    console.warn('Service worker gagal didaftarkan; aplikasi tetap jalan online.', error);
    return null;
  }
}
