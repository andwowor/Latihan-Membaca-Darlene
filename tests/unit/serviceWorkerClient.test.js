/**
 * Pembaruan harus sampai ke anak pada pembukaan pertama, bukan kedua.
 *
 * Berkas program disajikan stale-while-revalidate, jadi halaman yang dibuka
 * tepat setelah pembaruan masih menjalankan versi lama sampai service worker
 * baru mengambil alih. Berkas ini menguji bahwa halaman lalu memuat ulang
 * sendiri — dan bahwa ia tidak melakukannya saat anak sedang belajar.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerServiceWorker } from '../../src/adapters/inbound/serviceWorkerClient.js';

/** Wadah service worker tiruan yang bisa dipicu mengganti pengendali. */
function fakeServiceWorker({ controlled }) {
  const listeners = [];
  return {
    controller: controlled ? { state: 'activated' } : null,
    addEventListener: (name, handler) => {
      if (name === 'controllerchange') listeners.push(handler);
    },
    register: async () => ({ addEventListener() {} }),
    ambilAlih: () => listeners.forEach((handler) => handler()),
  };
}

/** Pasang navigator tiruan selama satu kasus, lalu bersihkan. */
async function withNavigator(serviceWorker, run) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    value: { serviceWorker }, configurable: true, writable: true,
  });
  try {
    await run();
  } finally {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous);
    else delete globalThis.navigator;
  }
}

test('versi baru mengambil alih: halaman memuat ulang sekali', async () => {
  const serviceWorker = fakeServiceWorker({ controlled: true });
  await withNavigator(serviceWorker, async () => {
    let muatUlang = 0;
    await registerServiceWorker({ reload: () => { muatUlang += 1; } });
    serviceWorker.ambilAlih();
    serviceWorker.ambilAlih();
    assert.equal(muatUlang, 1, 'cukup sekali, tidak boleh berulang');
  });
});

test('pemasangan pertama tidak memuat ulang', async () => {
  const serviceWorker = fakeServiceWorker({ controlled: false });
  await withNavigator(serviceWorker, async () => {
    let muatUlang = 0;
    await registerServiceWorker({ reload: () => { muatUlang += 1; } });
    serviceWorker.ambilAlih();
    assert.equal(muatUlang, 0);
  });
});

test('tidak memuat ulang di tengah pelajaran; memberi tahu saja', async () => {
  const serviceWorker = fakeServiceWorker({ controlled: true });
  await withNavigator(serviceWorker, async () => {
    let muatUlang = 0;
    let diberitahu = 0;
    await registerServiceWorker({
      canReload: () => false,
      reload: () => { muatUlang += 1; },
      onUpdateReady: () => { diberitahu += 1; },
    });
    serviceWorker.ambilAlih();
    assert.equal(muatUlang, 0, 'jawaban anak tidak boleh terbuang');
    assert.equal(diberitahu, 1);
  });
});

test('perangkat tanpa service worker tidak membuat aplikasi gagal', async () => {
  await withNavigator(undefined, async () => {
    assert.equal(await registerServiceWorker(), null);
  });
});
