/**
 * ADAPTER (inbound) — pendaftaran service worker.
 * Membuat aplikasi tetap bisa dibuka tanpa internet setelah kunjungan pertama.
 */

/**
 * Muat ulang sekali begitu service worker baru mengambil alih halaman.
 *
 * Tanpa ini, berkas program disajikan dari cache lama (stale-while-revalidate),
 * sehingga pembukaan pertama sesudah pembaruan masih menjalankan versi
 * sebelumnya — perbaikan baru terasa pada pembukaan kedua. Untuk orang tua yang
 * menunggu perbaikan, itu tampak seperti perbaikannya tidak pernah datang.
 *
 * Dua penjagaan: hanya bila halaman ini memang sudah dikendalikan service
 * worker sebelumnya (pemasangan pertama tidak perlu dimuat ulang), dan hanya
 * bila pemanggil menyatakan saat ini aman — memuat ulang di tengah pelajaran
 * akan membuang jawaban yang sedang dikerjakan anak.
 */
function reloadWhenTakenOver({ serviceWorker, canReload, reload, onUpdateReady }) {
  const wasControlled = Boolean(serviceWorker.controller);
  let done = false;
  serviceWorker.addEventListener('controllerchange', () => {
    if (!wasControlled || done) return;
    done = true;
    if (canReload()) reload();
    else onUpdateReady?.();
  });
}

/**
 * @param {{scriptUrl?: string, onUpdateReady?: () => void,
 *          canReload?: () => boolean, reload?: () => void}} [options]
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker(options = {}) {
  const {
    scriptUrl = './sw.js',
    onUpdateReady,
    canReload = () => true,
    reload = () => globalThis.location.reload(),
  } = options;
  const serviceWorker = globalThis.navigator?.serviceWorker;
  if (!serviceWorker) return null;
  reloadWhenTakenOver({ serviceWorker, canReload, reload, onUpdateReady });
  try {
    // `updateViaCache: 'none'` melarang peramban mengambil sw.js dari cache
    // HTTP-nya sendiri. Uji lokal lulus tanpa opsi ini karena server ujinya
    // mengirim `no-cache`; ia dipasang sebagai jaminan terhadap hosting yang
    // menyimpan sw.js lebih lama — bukan karena terbukti perlu di sini.
    const registration = await serviceWorker.register(scriptUrl, { updateViaCache: 'none' });
    // Periksa sekali tiap aplikasi dibuka, tidak menunggu peramban berbaik hati.
    registration.update?.().catch(() => {});
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        // Pesan ini hanya untuk keadaan yang tidak bisa dimuat ulang sekarang;
        // selebihnya `controllerchange` yang menuntaskannya tanpa diminta.
        const hasOldVersion = Boolean(serviceWorker.controller);
        if (installing.state === 'installed' && hasOldVersion && !canReload()) onUpdateReady?.();
      });
    });
    return registration;
  } catch (error) {
    console.warn('Service worker gagal didaftarkan; aplikasi tetap jalan online.', error);
    return null;
  }
}
