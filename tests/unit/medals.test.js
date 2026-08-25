import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateUnit, medalForStars } from '../../src/domain/medals.js';

const unit = { lessons: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
const done = (stars) => ({ done: true, stars });

test('tanpa menyelesaikan semua pelajaran, belum ada medali', () => {
  const result = evaluateUnit(unit, { a: done(3), b: done(3) });
  assert.equal(result.medal, null);
  assert.equal(result.complete, false);
  assert.equal(result.done, 2);
});

test('semua pelajaran 3 bintang menghasilkan emas', () => {
  const result = evaluateUnit(unit, { a: done(3), b: done(3), c: done(3) });
  assert.equal(result.medal, 'gold');
  assert.equal(result.stars, 9);
  assert.equal(result.maxStars, 9);
});

test('rata-rata dua bintang menghasilkan perak, di bawah itu perunggu', () => {
  assert.equal(evaluateUnit(unit, { a: done(2), b: done(2), c: done(2) }).medal, 'silver');
  assert.equal(evaluateUnit(unit, { a: done(1), b: done(2), c: done(1) }).medal, 'bronze');
});

test('medalForStars memakai ambang yang sama', () => {
  assert.equal(medalForStars(9, 3), 'gold');
  assert.equal(medalForStars(6, 3), 'silver');
  assert.equal(medalForStars(5, 3), 'bronze');
});

test('unit tanpa pelajaran tidak menghasilkan medali', () => {
  const result = evaluateUnit({ lessons: [] }, {});
  assert.equal(result.medal, null);
  assert.equal(result.progress, 0);
});
