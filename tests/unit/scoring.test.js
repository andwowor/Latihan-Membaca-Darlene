import test from 'node:test';
import assert from 'node:assert/strict';
import {
  starsForMistakes, lessonCompletionXp, XP_LESSON_BONUS, XP_PERFECT_BONUS,
} from '../../src/domain/scoring.js';

test('bintang mengikuti jumlah kesalahan dan tidak pernah nol', () => {
  assert.equal(starsForMistakes(0), 3);
  assert.equal(starsForMistakes(1), 2);
  assert.equal(starsForMistakes(2), 2);
  assert.equal(starsForMistakes(3), 1);
  assert.equal(starsForMistakes(8), 1);
});

test('pelajaran sempurna pertama kali mendapat bonus penuh', () => {
  assert.equal(
    lessonCompletionXp({ mistakes: 0, firstTime: true }),
    XP_LESSON_BONUS + XP_PERFECT_BONUS,
  );
});

test('mengulang pelajaran hanya mendapat separuh bonus', () => {
  assert.equal(lessonCompletionXp({ mistakes: 0, firstTime: false }),
    Math.round((XP_LESSON_BONUS + XP_PERFECT_BONUS) / 2));
  assert.equal(lessonCompletionXp({ mistakes: 3, firstTime: false }),
    Math.round(XP_LESSON_BONUS / 2));
});
