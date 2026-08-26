/**
 * ENTRY POINT — merakit lalu menjalankan aplikasi.
 * Berkas inilah yang dipanggil index.html.
 */
import { createContainer } from './container.js';
import { createApp } from '../ui/App.js';
import { registerServiceWorker } from '../adapters/inbound/serviceWorkerClient.js';
import { showToast } from '../ui/components/effects.js';

const elements = {
  view: document.getElementById('view'),
  topbar: document.getElementById('topbar'),
  tabbar: document.getElementById('tabbar'),
  confetti: document.getElementById('confetti'),
  toasts: document.getElementById('toasts'),
};

const container = createContainer().start();

createApp({ container, elements }).start();

registerServiceWorker({
  // Muat ulang sendiri saat versi baru siap — kecuali bila anak sedang
  // mengerjakan pelajaran, karena jawaban yang belum tuntas akan terbuang.
  canReload: () => !globalThis.location.hash.startsWith('#/pelajaran'),
  onUpdateReady: () => showToast(
    elements.toasts,
    '✨ Versi baru siap — akan dipasang setelah pelajaran ini selesai',
    { durationMs: 5200 },
  ),
});
