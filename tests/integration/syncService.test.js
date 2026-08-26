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
        if (this.offline) throw new Error('Jaringan mati.');
        const profile = stored.get(code);
        return profile ? { profile, updatedAt: START } : null;
      },
      async push(code, profile) {
        if (server.offline) throw new Error('Jaringan mati.');
        pushed.push({ code, profile });
        const merged = mergeProfiles(stored.get(code) || null, profile);
        stored.set(code, merged);
        return { profile: merged, updatedAt: START };
      },
    },
  };
}

const server = createFakeServer();

function bootDevice({ seed, repository = createMemoryProgressRepository() }) {
  return createContainer({
    repository,
    clock: createFixedClock(START),
    random: { next: seededRandom(seed) },
    sync: server.port,
    capabilities: NO_CAPABILITIES,
  }).start();
}

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

test.beforeEach(() => {
  server.stored.clear();
  server.pushed.length = 0;
  server.offline = false;
});

test('menyalakan sinkronisasi menghasilkan kode dan langsung mengirim progres', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');

  const result = await phone.syncService.enable();
  assert.equal(result.ok, true);
  assert.match(result.code, /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);
  assert.equal(server.stored.size, 1, 'progres tersimpan di server');
  assert.equal(phone.syncService.status().enabled, true);
});

test('perangkat kedua yang memakai kode sama langsung mendapat progres', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  const { code } = await phone.syncService.enable();

  const tablet = bootDevice({ seed: 'tablet' });
  assert.equal(tablet.profileService.summary().lessonsDone, 0, 'tablet mulai kosong');

  const joined = await tablet.syncService.enable(code);
  assert.equal(joined.ok, true);
  assert.equal(tablet.profileService.summary().lessonsDone, 1);
  assert.equal(tablet.queryService.lessonRecord('u1-l1').stars, 3);
  assert.equal(tablet.queryService.currentLessonId(), 'u1-l2');
});

test('belajar di dua perangkat: keduanya bertemu tanpa ada yang hilang', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  const { code } = await phone.syncService.enable();

  const tablet = bootDevice({ seed: 'tablet' });
  await tablet.syncService.enable(code);
  playLesson(tablet, 'u1-l2');
  await tablet.syncService.syncNow();

  await phone.syncService.syncNow();
  assert.equal(phone.queryService.lessonRecord('u1-l1').stars, 3, 'pelajaran HP tetap ada');
  assert.equal(phone.queryService.lessonRecord('u1-l2').stars, 3, 'pelajaran tablet ikut masuk');
  assert.equal(phone.profileService.summary().lessonsDone, 2);
});

test('kode sinkron tidak pernah ikut terkirim ke server', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  const { code } = await phone.syncService.enable();
  await phone.syncService.syncNow();

  assert.ok(server.pushed.length >= 1);
  server.pushed.forEach(({ profile }) => {
    assert.equal(profile.sync, undefined, 'blok sinkronisasi harus dibuang sebelum dikirim');
    assert.equal(JSON.stringify(profile).includes(code.replace(/-/g, '')), false,
      'kode tidak boleh muncul di mana pun dalam kiriman');
  });
  server.stored.forEach((profile) => {
    assert.equal(profile.sync, undefined, 'server pun tidak menyimpan kode');
  });
});

test('pengaturan suara tetap milik masing-masing perangkat', async () => {
  const phone = bootDevice({ seed: 'hp' });
  phone.profileService.setSetting('indonesianVoiceId', 'suara-hp');
  const { code } = await phone.syncService.enable();

  const tablet = bootDevice({ seed: 'tablet' });
  tablet.profileService.setSetting('indonesianVoiceId', 'suara-tablet');
  await tablet.syncService.enable(code);

  assert.equal(tablet.profileService.settings().indonesianVoiceId, 'suara-tablet');
  await phone.syncService.syncNow();
  assert.equal(phone.profileService.settings().indonesianVoiceId, 'suara-hp');
});

test('kode yang salah ketik ditolak sebelum menyentuh jaringan', async () => {
  const device = bootDevice({ seed: 'salah' });
  const result = await device.syncService.enable('ABC-123');
  assert.equal(result.ok, false);
  assert.match(result.message, /tidak dikenali/i);
  assert.equal(device.syncService.status().enabled, false);
  assert.equal(server.pushed.length, 0);
});

test('gagal jaringan tidak merusak progres lokal dan dilaporkan apa adanya', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  await phone.syncService.enable();

  server.offline = true;
  const result = await phone.syncService.syncNow();
  assert.equal(result.ok, false);
  assert.equal(phone.syncService.status().lastStatus, 'error');
  assert.equal(phone.profileService.summary().lessonsDone, 1, 'progres lokal utuh');

  server.offline = false;
  assert.equal((await phone.syncService.syncNow()).ok, true, 'pulih setelah jaringan kembali');
});

test('mematikan sinkronisasi menghapus kode tetapi tidak menyentuh progres', async () => {
  const phone = bootDevice({ seed: 'hp' });
  playLesson(phone, 'u1-l1');
  await phone.syncService.enable();

  phone.syncService.disable();
  assert.equal(phone.syncService.status().enabled, false);
  assert.equal(phone.syncService.status().code, '');
  assert.equal(phone.profileService.summary().lessonsDone, 1);

  const afterDisable = await phone.syncService.syncNow();
  assert.equal(afterDisable.ok, false, 'tidak mengirim apa pun setelah dimatikan');
});

test('membuka aplikasi lagi di perangkat yang sama tetap tersinkron', async () => {
  const repository = createMemoryProgressRepository();
  const phone = bootDevice({ seed: 'hp', repository });
  playLesson(phone, 'u1-l1');
  const { code } = await phone.syncService.enable();

  const reopened = bootDevice({ seed: 'hp-2', repository });
  const status = reopened.syncService.status();
  assert.equal(status.enabled, true);
  assert.equal(status.code, code, 'kode tersimpan bersama profil');
});
