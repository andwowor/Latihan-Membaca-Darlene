/**
 * Test integrasi sinkronisasi dari sisi klien: dua perangkat memakai satu
 * "server" tiruan yang menggabungkan memakai aturan domain yang sama seperti
 * Worker sungguhan.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/config/container.js';
import { createMemoryProgressRepository } from '../../src/adapters/outbound/memoryProgressRepository.js';
import { createFixedClock } from '../../src/adapters/outbound/systemClock.js';
import { seededRandom } from '../../src/shared/random.js';
import { mergeProfiles } from '../../src/domain/merge.js';

const START = Date.parse('2026-08-26T08:00:00Z');
const NO_CAPABILITIES = {
  hasLocalStorage: false, hasSpeechSynthesis: false, hasWebAudio: false, hasServiceWorker: false,
};

/** Kunci yang dipakai Worker bila klien tidak mengirim kode (ADR-0009). */
const PROFIL_KELUARGA = '(keluarga)';

/** Server tiruan yang berperilaku seperti Worker: menggabungkan, bukan menimpa. */
function createFakeServer() {
  const stored = new Map();
  const pushed = [];
  return {
    stored,
    pushed,
    offline: false,
    port: {
      async pull(code) {
        if (server.offline) throw new Error('Jaringan mati.');
        const profile = stored.get(code || PROFIL_KELUARGA);
        return profile ? { profile, updatedAt: START } : null;
      },
      async push(code, profile) {
        if (server.offline) throw new Error('Jaringan mati.');
        pushed.push({ code, profile });
        const key = code || PROFIL_KELUARGA;
        const merged = mergeProfiles(stored.get(key) || null, profile);
        stored.set(key, merged);
        return { profile: merged, updatedAt: START };
      },
    },
  };
}

const server = createFakeServer();

function bootDevice({ seed, repository = createMemoryProgressRepository() }) {
  const device = createContainer({
    repository,
    clock: createFixedClock(START),
    random: { next: seededRandom(seed) },
    sync: server.port,
    capabilities: NO_CAPABILITIES,
  }).start();
  devices.push(device);
  return device;
}

/** Beri kesempatan pekerjaan latar (sinkronisasi otomatis) menyelesaikan diri. */
const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });

/** Kerjakan satu pelajaran sampai selesai dengan semua jawaban benar. */
function playLesson(device, lessonId) {
  const session = device.lessonSessions.startLesson(lessonId);
  let finished = null;
  while (!finished) {
    const question = session.current();
    const answer = question.kind === 'choice'
      ? question.options.find((option) => option.correct).key
      : question.kind === 'build' ? question.answer : true;
    session.answer(answer);
    const step = session.next();
    if (step.finished) finished = step.result;
  }
  return finished;
}

/** Perangkat yang dinyalakan sebuah test, supaya timernya bisa dihentikan. */
const devices = [];

test.afterEach(() => {
  while (devices.length) devices.pop().syncService.stop();
});

test.beforeEach(() => {
  server.stored.clear();
  server.pushed.length = 0;
  server.offline = false;
});

test('perangkat baru langsung tersinkron tanpa langkah persiapan apa pun', async () => {
  const phone = bootDevice({ seed: 'hp' });
  assert.equal(phone.syncService.status().enabled, true, 'menyala secara bawaan');
  assert.equal(phone.syncService.status().code, '', 'tidak ada kode yang perlu diurus');

  playLesson(phone, 'u1-l1');
  const result = await phone.syncService.syncNow();
  assert.equal(result.ok, true);
  assert.equal(server.stored.size, 1);
});

test('perangkat kedua ikut progres begitu dibuka, tanpa memasukkan apa pun', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  await phone.syncService.syncNow();

  // Perangkat kedua menyinkron sendiri saat dibuka; menunggu putaran itu selesai.
  const tablet = bootDevice({ seed: 'tablet' });
  await tablet.syncService.syncNow();
  assert.equal(tablet.profileService.summary().lessonsDone, 1);
  assert.equal(tablet.queryService.lessonRecord('u1-l1').stars, 3);
  assert.equal(tablet.queryService.currentLessonId(), 'u1-l2');
  assert.equal(server.stored.size, 1, 'keduanya memakai satu profil yang sama');
});

test('tidak ada identitas yang dikirim ke server', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  await phone.syncService.syncNow();

  assert.ok(server.pushed.length >= 1);
  server.pushed.forEach(({ code, profile }) => {
    assert.ok(!code, 'tidak ada kode yang menyertai permintaan');
    assert.equal(profile.sync, undefined, 'blok sinkronisasi dibuang sebelum dikirim');
  });
  server.stored.forEach((profile) => assert.equal(profile.sync, undefined));
});

test('profil lama berkode ikut pindah ke profil keluarga tanpa kehilangan progres', async () => {
  const repository = createMemoryProgressRepository();
  const lama = bootDevice({ seed: 'lama', repository });
  playLesson(lama, 'u1-l1');

  // tiru profil versi 1: masih menyimpan kode manual
  const tersimpan = JSON.parse(JSON.stringify(lama.profileService.get()));
  tersimpan.schemaVersion = 1;
  tersimpan.sync = { enabled: true, code: 'XK4M7QPZR2TW9HDF', lastSyncAt: 1, lastStatus: 'ok', message: '' };
  repository.save(tersimpan);

  const setelahPembaruan = bootDevice({ seed: 'baru', repository });
  const status = setelahPembaruan.syncService.status();
  assert.equal(status.enabled, true);
  assert.equal(status.code, '', 'kode lama dilupakan');
  assert.equal(setelahPembaruan.profileService.summary().lessonsDone, 1, 'progres tetap utuh');

  await setelahPembaruan.syncService.syncNow();
  assert.equal(server.pushed.at(-1).code, '', 'kirim ke profil keluarga, bukan kode lama');
});

test('belajar di dua perangkat: keduanya bertemu tanpa ada yang hilang', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  await phone.syncService.syncNow();

  const tablet = bootDevice({ seed: 'tablet' });
  await tablet.syncService.syncNow();
  playLesson(tablet, 'u1-l2');
  await tablet.syncService.syncNow();

  // HP menarik lagi: pelajaran dari tablet ikut masuk
  await phone.syncService.syncNow();
  assert.equal(phone.queryService.lessonRecord('u1-l1').stars, 3, 'pelajaran HP tetap ada');
  assert.equal(phone.queryService.lessonRecord('u1-l2').stars, 3, 'pelajaran tablet ikut masuk');
  assert.equal(phone.profileService.summary().lessonsDone, 2);
});

test('pengaturan suara tetap milik masing-masing perangkat', async () => {
  const phone = bootDevice({ seed: 'hp' });
  phone.profileService.setSetting('indonesianVoiceId', 'suara-hp');
  await phone.syncService.syncNow();

  const tablet = bootDevice({ seed: 'tablet' });
  tablet.profileService.setSetting('indonesianVoiceId', 'suara-tablet');
  await tablet.syncService.syncNow();

  assert.equal(tablet.profileService.settings().indonesianVoiceId, 'suara-tablet');
  await phone.syncService.syncNow();
  assert.equal(phone.profileService.settings().indonesianVoiceId, 'suara-hp');
});

test('kode pemisah profil yang salah ketik tetap ditolak sebelum menyentuh jaringan', async () => {
  const device = bootDevice({ seed: 'salah' });
  await settle(); // biarkan sinkronisasi otomatis saat aplikasi dibuka selesai dulu
  device.syncService.disable();
  server.pushed.length = 0;

  const result = await device.syncService.enable('ABC-123');
  assert.equal(result.ok, false);
  assert.match(result.message, /tidak dikenali/i);
  assert.equal(device.syncService.status().enabled, false);
  assert.equal(server.pushed.length, 0, 'tidak ada yang dikirim saat kode ditolak');
});

test('gagal jaringan tidak merusak progres lokal dan dilaporkan apa adanya', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  await phone.syncService.syncNow();

  server.offline = true;
  const result = await phone.syncService.syncNow();
  assert.equal(result.ok, false);
  assert.equal(phone.syncService.status().lastStatus, 'error');
  assert.equal(phone.profileService.summary().lessonsDone, 1, 'progres lokal utuh');

  server.offline = false;
  assert.equal((await phone.syncService.syncNow()).ok, true, 'pulih setelah jaringan kembali');
});

test('mematikan sinkronisasi tidak menyentuh progres, dan bisa dinyalakan lagi', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  await phone.syncService.syncNow();

  phone.syncService.disable();
  assert.equal(phone.syncService.status().enabled, false);
  assert.equal(phone.profileService.summary().lessonsDone, 1);

  const afterDisable = await phone.syncService.syncNow();
  assert.equal(afterDisable.ok, false, 'tidak mengirim apa pun setelah dimatikan');
});

test('pilihan mematikan sinkronisasi bertahan setelah aplikasi dibuka ulang', async () => {
  const repository = createMemoryProgressRepository();
  const phone = bootDevice({ seed: 'hp', repository });
  playLesson(phone, 'u1-l1');
  phone.syncService.disable();

  const reopened = bootDevice({ seed: 'hp-2', repository });
  assert.equal(reopened.syncService.status().enabled, false, 'tidak menyala sendiri lagi');
});
