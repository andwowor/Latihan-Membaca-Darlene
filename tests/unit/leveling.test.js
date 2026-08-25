import test from 'node:test';
import assert from 'node:assert/strict';
import { describeLevel, xpRequiredForLevel, LEVEL_TITLES } from '../../src/domain/leveling.js';

test('level 1 mulai dari 0 XP dan jaraknya makin jauh', () => {
  assert.equal(xpRequiredForLevel(1), 0);
  assert.equal(xpRequiredForLevel(2), 100);
  assert.equal(xpRequiredForLevel(3), 250);
  assert.equal(xpRequiredForLevel(4), 450);
});

test('ambang level selalu menaik', () => {
  for (let level = 1; level < 30; level += 1) {
    assert.ok(xpRequiredForLevel(level + 1) > xpRequiredForLevel(level));
  }
});

test('describeLevel menghitung sisa XP menuju level berikutnya', () => {
  const info = describeLevel(115);
  assert.equal(info.level, 2);
  assert.equal(info.xpInLevel, 15);
  assert.equal(info.xpNeeded, 150);
  assert.ok(info.progress > 0 && info.progress < 1);
});

test('tepat di ambang berarti sudah naik level', () => {
  assert.equal(describeLevel(100).level, 2);
  assert.equal(describeLevel(99).level, 1);
});

test('judul level tidak pernah kosong walau XP sangat besar', () => {
  const info = describeLevel(1_000_000);
  assert.equal(info.title, LEVEL_TITLES[LEVEL_TITLES.length - 1]);
});
