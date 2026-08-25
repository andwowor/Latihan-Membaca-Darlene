/**
 * ADAPTER (inbound) — pemasangan aplikasi ke layar utama.
 *
 * Chrome/Edge/Android memberi event `beforeinstallprompt` sehingga tombol
 * "Pasang" bisa memicu dialog resmi. Safari iOS tidak punya event itu:
 * pemasangan dilakukan lewat menu Bagikan → "Tambahkan ke Layar Utama",
 * jadi adapter ini menyediakan petunjuk yang sesuai per peramban.
 */

/** Apakah aplikasi sedang berjalan dalam mode terpasang (standalone)? */
export function isRunningStandalone(globalScope = globalThis) {
  const displayMode = globalScope.matchMedia?.('(display-mode: standalone)')?.matches;
  return Boolean(displayMode || globalScope.navigator?.standalone);
}

/** Tebak peramban untuk memilih petunjuk pemasangan yang tepat. */
export function detectBrowser(userAgent = globalThis.navigator?.userAgent || '') {
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    || (/Macintosh/.test(userAgent) && (globalThis.navigator?.maxTouchPoints || 0) > 1);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(userAgent);
  if (isIOS) return 'ios';
  if (isSafari) return 'safari';
  return 'other';
}

/**
 * @param {{onAvailable?: (available: boolean) => void}} [options]
 */
export function createInstallPrompt(options = {}) {
  let deferredEvent = null;

  globalThis.addEventListener?.('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredEvent = event;
    options.onAvailable?.(true);
  });

  globalThis.addEventListener?.('appinstalled', () => {
    deferredEvent = null;
    options.onAvailable?.(false);
  });

  return {
    /** True bila peramban bisa memunculkan dialog pasang otomatis. */
    canPrompt: () => Boolean(deferredEvent),
    browser: () => detectBrowser(),
    isInstalled: () => isRunningStandalone(),

    /**
     * Munculkan dialog pemasangan.
     * @returns {Promise<boolean>} true bila pengguna menerima
     */
    async prompt() {
      if (!deferredEvent) return false;
      deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      deferredEvent = null;
      return choice?.outcome === 'accepted';
    },
  };
}
