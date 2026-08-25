import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS, findNewlyUnlocked, MAX_ACHIEVEMENT_POINTS,
} from '../../src/domain/achievements.js';

const emptyStats = {
  xp: 0, points: 0, level: 1, lessonsDone: 0, totalLessons: 46, correct: 0, wrong: 0,
  perfect: 0, missionsDone: 0, bestStreak: 0, streak: 0, mastered: 0, masteredId: 0,
  masteredEn: 0, masteredSight: 0, medals: 0, goldMedals: 0, totalWords: 190,
};

test('profil kosong belum membuka achievement apa pun', () => {
  assert.equal(findNewlyUnlocked(emptyStats, {}).length, 0);
});

test('menyelesaikan pelajaran pertama membuka lencana Langkah Pertama', () => {
  const unlocked = findNewlyUnlocked({ ...emptyStats, lessonsDone: 1 }, {});
  assert.deepEqual(unlocked.map((item) => item.id), ['first-lesson']);
});

test('achievement yang sudah terbuka tidak diberikan dua kali', () => {
  const stats = { ...emptyStats, lessonsDone: 1 };
  assert.equal(findNewlyUnlocked(stats, { 'first-lesson': 1 }).length, 0);
});

test('lencana dua bahasa butuh 15 kata Indonesia dan 15 kata Inggris', () => {
  const hasBilingual = (stats) => findNewlyUnlocked(stats, {}).some((item) => item.id === 'bilingual');
  assert.equal(hasBilingual({ ...emptyStats, masteredId: 15, masteredEn: 14 }), false);
  assert.equal(hasBilingual({ ...emptyStats, masteredId: 15, masteredEn: 15 }), true);
});

test('setiap achievement punya id unik, poin positif, dan tingkat yang dikenal', () => {
  const ids = ACHIEVEMENTS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  ACHIEVEMENTS.forEach((item) => {
    assert.ok(item.points > 0, `${item.id} poin`);
    assert.ok(['bronze', 'silver', 'gold'].includes(item.tier), `${item.id} tier`);
    assert.equal(typeof item.check, 'function', `${item.id} aturan`);
    assert.ok(item.title && item.desc && item.emoji, `${item.id} tampilan`);
  });
  assert.equal(MAX_ACHIEVEMENT_POINTS,
    ACHIEVEMENTS.reduce((total, item) => total + item.points, 0));
});

test('aturan achievement tidak melempar walau statistik tidak lengkap', () => {
  assert.doesNotThrow(() => findNewlyUnlocked({}, {}));
});
