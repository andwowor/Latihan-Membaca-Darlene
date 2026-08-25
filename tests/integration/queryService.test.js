/**
 * Test integrasi layanan tanya-jawab progres yang dipakai seluruh layar.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/config/container.js';
import { createMemoryProgressRepository } from '../../src/adapters/outbound/memoryProgressRepository.js';
import { createFixedClock } from '../../src/adapters/outbound/systemClock.js';
import { seededRandom } from '../../src/shared/random.js';
import { UNITS } from '../../src/domain/curriculum.js';

const START = Date.parse('2026-08-25T08:00:00Z');

function boot() {
  return createContainer({
    repository: createMemoryProgressRepository(),
    clock: createFixedClock(START),
    random: { next: seededRandom('query') },
    capabilities: { hasLocalStorage: false, hasSpeechSynthesis: false, hasWebAudio: false, hasServiceWorker: false },
  }).start();
}

test('peta belajar memuat semua unit dan status kunci tiap pelajaran', () => {
  const { queryService } = boot();
  const path = queryService.learningPath();
  assert.equal(path.length, UNITS.length);
  assert.equal(path[0].lessons[0].unlocked, true, 'pelajaran pertama selalu terbuka');
  assert.equal(path[0].lessons[1].unlocked, false, 'pelajaran kedua masih terkunci');
  assert.equal(path[0].medal, null);
});

test('riwayat harian selalu berisi 14 hari walau baru dipakai sehari', () => {
  const { queryService } = boot();
  const history = queryService.dailyHistory(14);
  assert.equal(history.length, 14);
  assert.equal(history.at(-1).day, '2026-08-25');
  assert.equal(history[0].day, '2026-08-12');
  history.forEach((day) => assert.equal(typeof day.xp, 'number'));
});

test('daftar kata bisa disaring per bahasa dan tingkat penguasaan', () => {
  const { queryService } = boot();
  assert.ok(queryService.words({ language: 'id' }).every((word) => word.lang === 'id'));
  assert.ok(queryService.words({ language: 'en' }).length > 60);
  assert.equal(queryService.words({ onlyMastered: true }).length, 0);
  const [word] = queryService.words();
  assert.equal(word.mastery, 0);
  assert.equal(word.masteryLabel, 'Belum dilatih');
});

test('daftar achievement menyertakan status terkunci dan total poin maksimum', () => {
  const { queryService } = boot();
  const { items, maxPoints } = queryService.achievements();
  assert.ok(items.length >= 25);
  assert.ok(items.every((item) => item.unlockedAt === null));
  assert.ok(maxPoints > 1000);
});
