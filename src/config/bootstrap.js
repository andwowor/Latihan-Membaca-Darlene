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
  onUpdateReady: () => showToast(
    elements.toasts,
    '✨ Versi baru siap — tutup lalu buka lagi aplikasinya',
    { durationMs: 5200 },
  ),
});
