import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceStreak, emptyStreak, visibleStreak } from '../../src/domain/streak.js';

test('belajar hari pertama membuat streak menjadi 1', () => {
  const { streak, increased } = advanceStreak(emptyStreak(), '2026-08-25');
  assert.equal(streak.count, 1);
  assert.equal(streak.best, 1);
  assert.equal(increased, true);
});

test('belajar dua kali di hari yang sama tidak menambah streak', () => {
  const first = advanceStreak(emptyStreak(), '2026-08-25').streak;
  const second = advanceStreak(first, '2026-08-25');
  assert.equal(second.streak.count, 1);
  assert.equal(second.increased, false);
});

test('hari berurutan menambah streak, bolong satu hari mengulang dari 1', () => {
  let streak = advanceStreak(emptyStreak(), '2026-08-24').streak;
  streak = advanceStreak(streak, '2026-08-25').streak;
  streak = advanceStreak(streak, '2026-08-26').streak;
  assert.equal(streak.count, 3);

  const afterGap = advanceStreak(streak, '2026-08-28').streak;
  assert.equal(afterGap.count, 1);
  assert.equal(afterGap.best, 3, 'rekor terbaik tetap tersimpan');
});

test('streak yang tampil menjadi 0 bila sudah lewat dari kemarin', () => {
  const streak = advanceStreak(emptyStreak(), '2026-08-25').streak;
  assert.equal(visibleStreak(streak, '2026-08-25'), 1);
  assert.equal(visibleStreak(streak, '2026-08-26'), 1, 'hari ini belum belajar, tapi belum putus');
  assert.equal(visibleStreak(streak, '2026-08-27'), 0);
  assert.equal(visibleStreak(emptyStreak(), '2026-08-27'), 0);
});
