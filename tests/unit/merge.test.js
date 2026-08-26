/**
 * Penggabungan profil adalah bagian paling berisiko dari sinkronisasi:
 * satu aturan yang salah berarti bintang atau lencana Darlene hilang.
 * Karena itu diuji per aturan, bukan hanya alur besarnya.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeProfiles, mergeStreak, mergeLessonRecords, mergeWordRecords,
  mergeAchievements, mergeMissions, mergeDaily, mergeHistory,
} from '../../src/domain/merge.js';
import {
  createProfile, registerAnswer, registerLessonCompletion, grantNewAchievements, summarize,
} from '../../src/domain/profile.js';
import { HISTORY_DAYS_KEPT } from '../../src/domain/profile.js';

const NOW = Date.parse('2026-08-26T08:00:00Z');
const TODAY = '2026-08-26';

function playLesson(profile, { lessonId, wordId, mistakes = 0, day = TODAY }) {
  let current = profile;
  for (let index = 0; index < 8 - mistakes; index += 1) {
    current = registerAnswer(current, {
      exerciseType: 'pic-word', wordId, correct: true, now: NOW,
    }).profile;
  }
  for (let index = 0; index < mistakes; index += 1) {
    current = registerAnswer(current, {
      exerciseType: 'pic-word', wordId, correct: false, now: NOW,
    }).profile;
  }
  current = registerLessonCompletion(current, {
    lessonId, mistakes, correctCount: 8 - mistakes, now: NOW, todayKey: day,
  }).profile;
  return grantNewAchievements(current, NOW).profile;
}

/* ------------------------------ aturan satuan ------------------------------ */

test('streak: rekor terbaik tidak pernah hilang', () => {
  const merged = mergeStreak(
    { count: 2, best: 9, lastDay: '2026-08-25' },
    { count: 4, best: 4, lastDay: '2026-08-26' },
  );
  assert.equal(merged.best, 9, 'rekor lama dipertahankan');
  assert.equal(merged.count, 4, 'hitungan mengikuti hari terbaru');
  assert.equal(merged.lastDay, '2026-08-26');
});

test('streak: hari sama mengambil hitungan tertinggi', () => {
  const merged = mergeStreak(
    { count: 5, best: 5, lastDay: TODAY },
    { count: 3, best: 3, lastDay: TODAY },
  );
  assert.equal(merged.count, 5);
});

test('pelajaran: bintang terbaik menang dan tidak ada yang hilang', () => {
  const merged = mergeLessonRecords(
    { 'u1-l1': { done: true, stars: 3, attempts: 2, bestCorrect: 8, lastAt: 10 } },
    {
      'u1-l1': { done: true, stars: 1, attempts: 1, bestCorrect: 5, lastAt: 20 },
      'u1-l2': { done: true, stars: 2, attempts: 1, bestCorrect: 7, lastAt: 30 },
    },
  );
  assert.equal(merged['u1-l1'].stars, 3, 'bintang tidak boleh turun');
  assert.equal(merged['u1-l1'].attempts, 2);
  assert.equal(merged['u1-l1'].lastAt, 20);
  assert.ok(merged['u1-l2'], 'pelajaran dari perangkat lain ikut terbawa');
});

test('kata: penguasaan tertinggi menang', () => {
  const merged = mergeWordRecords(
    { 'id-bola': { seen: 5, correct: 4, wrong: 1, mastery: 4, lastAt: 1 } },
    { 'id-bola': { seen: 3, correct: 3, wrong: 0, mastery: 2, lastAt: 9 }, 'en-cat': { seen: 1, correct: 1, wrong: 0, mastery: 1, lastAt: 5 } },
  );
  assert.equal(merged['id-bola'].mastery, 4);
  assert.equal(merged['id-bola'].seen, 5);
  assert.equal(merged['en-cat'].mastery, 1);
});

test('lencana: digabung, waktu terbuka paling awal dipertahankan', () => {
  const merged = mergeAchievements({ 'first-lesson': 500 }, { 'first-lesson': 100, 'xp-100': 700 });
  assert.equal(merged['first-lesson'], 100);
  assert.equal(merged['xp-100'], 700);
});

test('misi: hari sama menggabungkan klaim, hari berbeda memakai yang terbaru', () => {
  const sameDay = mergeMissions(
    { day: TODAY, ids: ['m-lesson-2'], claimed: ['m-lesson-2'] },
    { day: TODAY, ids: ['m-lesson-2'], claimed: [] },
  );
  assert.deepEqual(sameDay.claimed, ['m-lesson-2'], 'klaim tidak boleh hangus');

  const differentDay = mergeMissions(
    { day: '2026-08-25', ids: ['a'], claimed: ['a'] },
    { day: TODAY, ids: ['b'], claimed: [] },
  );
  assert.equal(differentDay.day, TODAY);
});

test('capaian harian: hari sama diambil tertinggi, hari lama dikembalikan untuk diarsipkan', () => {
  const sameDay = mergeDaily(
    { day: TODAY, correct: 10, xp: 100, lessons: 1 },
    { day: TODAY, correct: 4, xp: 40, lessons: 2 },
  );
  assert.equal(sameDay.daily.correct, 10);
  assert.equal(sameDay.daily.lessons, 2);
  assert.equal(sameDay.archived, null);

  const differentDay = mergeDaily(
    { day: '2026-08-25', correct: 9, xp: 90, lessons: 1 },
    { day: TODAY, correct: 2, xp: 20, lessons: 1 },
  );
  assert.equal(differentDay.daily.day, TODAY);
  assert.equal(differentDay.archived.day, '2026-08-25', 'hari lama tidak boleh hilang begitu saja');
});

test('riwayat: disatukan per tanggal, versi dengan XP tertinggi menang', () => {
  const merged = mergeHistory(
    [{ day: '2026-08-24', xp: 50 }, { day: '2026-08-25', xp: 10 }],
    [{ day: '2026-08-25', xp: 80 }, { day: '2026-08-26', xp: 30 }],
  );
  assert.equal(merged.length, 3);
  assert.equal(merged.find((entry) => entry.day === '2026-08-25').xp, 80);
  assert.deepEqual(merged.map((entry) => entry.day),
    ['2026-08-24', '2026-08-25', '2026-08-26'], 'urut menaik');
});

test('riwayat: tetap dibatasi supaya penyimpanan tidak membengkak', () => {
  const many = (offset) => Array.from({ length: 50 }, (unused, index) => ({
    day: `2026-0${offset}-${String((index % 28) + 1).padStart(2, '0')}`,
    xp: index,
  }));
  assert.ok(mergeHistory(many(1), many(2)).length <= HISTORY_DAYS_KEPT);
});

/* ------------------------------ alur gabungan ------------------------------ */

test('dua perangkat dengan pelajaran berbeda: keduanya terbawa', () => {
  const phone = playLesson(createProfile({ now: NOW }), { lessonId: 'u1-l1', wordId: 'id-bola' });
  const tablet = playLesson(createProfile({ now: NOW }), { lessonId: 'u1-l2', wordId: 'en-cat', mistakes: 2 });

  const merged = mergeProfiles(phone, tablet);
  assert.equal(merged.lessons['u1-l1'].stars, 3);
  assert.equal(merged.lessons['u1-l2'].stars, 2);
  assert.ok(merged.words['id-bola'] && merged.words['en-cat']);
  assert.ok(Object.keys(merged.achievements).length >= 1);
});

test('penggabungan tidak pernah menurunkan capaian', () => {
  const strong = playLesson(playLesson(createProfile({ now: NOW }), { lessonId: 'u1-l1', wordId: 'id-bola' }), { lessonId: 'u1-l2', wordId: 'id-buku' });
  const weak = createProfile({ now: NOW });

  [mergeProfiles(strong, weak), mergeProfiles(weak, strong)].forEach((merged) => {
    const before = summarize(strong, TODAY);
    const after = summarize(merged, TODAY);
    assert.ok(after.xp >= before.xp, 'XP tidak boleh turun');
    assert.ok(after.lessonsDone >= before.lessonsDone, 'pelajaran selesai tidak boleh turun');
    assert.ok(after.mastered >= before.mastered, 'kata dikuasai tidak boleh turun');
    assert.ok(after.points >= before.points, 'poin prestasi tidak boleh turun');
  });
});

test('penggabungan bersifat idempoten: mengulanginya tidak mengubah apa pun', () => {
  const phone = playLesson(createProfile({ now: NOW }), { lessonId: 'u1-l1', wordId: 'id-bola' });
  const tablet = playLesson(createProfile({ now: NOW }), { lessonId: 'u1-l2', wordId: 'en-cat' });
  const once = mergeProfiles(phone, tablet);
  const twice = mergeProfiles(once, tablet);
  assert.deepEqual(twice, once);
});

test('pemakaian bergantian menghasilkan angka yang tepat', () => {
  // HP main, sinkron; tablet melanjutkan dari hasil sinkron itu, lalu sinkron lagi.
  const phone = playLesson(createProfile({ now: NOW }), { lessonId: 'u1-l1', wordId: 'id-bola' });
  const server = mergeProfiles(phone, null);
  const tablet = playLesson(server, { lessonId: 'u1-l2', wordId: 'en-cat' });
  const merged = mergeProfiles(server, tablet);

  assert.equal(merged.experiencePoints, tablet.experiencePoints,
    'tidak ada XP yang hilang maupun terhitung dua kali');
  assert.equal(merged.totals.lessonsDone, 2);
});

test('pengaturan perangkat tidak ikut terbawa', () => {
  const phone = createProfile({ now: NOW });
  phone.settings.indonesianVoiceId = 'suara-hp';
  const tablet = createProfile({ now: NOW });
  tablet.settings.indonesianVoiceId = 'suara-tablet';

  assert.equal(mergeProfiles(phone, tablet).settings.indonesianVoiceId, 'suara-hp');
});

test('nama anak diambil dari profil yang lebih banyak dipakai', () => {
  const active = playLesson(createProfile({ now: NOW, learnerName: 'Darlene' }), { lessonId: 'u1-l1', wordId: 'id-bola' });
  const fresh = createProfile({ now: NOW, learnerName: 'Belum Diisi' });
  assert.equal(mergeProfiles(fresh, active).learnerName, 'Darlene');
  assert.equal(mergeProfiles(active, fresh).learnerName, 'Darlene');
});

test('profil kosong di salah satu sisi aman', () => {
  const phone = playLesson(createProfile({ now: NOW }), { lessonId: 'u1-l1', wordId: 'id-bola' });
  assert.equal(mergeProfiles(phone, null), phone);
  assert.equal(mergeProfiles(null, phone), phone);
});
