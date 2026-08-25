import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recordWordAttempt, isMastered, masteryLabel, MASTERY_MAX, MASTERY_THRESHOLD,
} from '../../src/domain/mastery.js';

test('jawaban benar menaikkan penguasaan, salah menurunkan', () => {
  let record = recordWordAttempt(null, true, 1);
  assert.equal(record.mastery, 1);
  assert.equal(record.seen, 1);
  record = recordWordAttempt(record, false, 2);
  assert.equal(record.mastery, 0);
  assert.equal(record.wrong, 1);
  assert.equal(record.seen, 2);
});

test('penguasaan tidak melewati batas atas maupun bawah', () => {
  let record = null;
  for (let index = 0; index < 10; index += 1) record = recordWordAttempt(record, true, index);
  assert.equal(record.mastery, MASTERY_MAX);
  for (let index = 0; index < 10; index += 1) record = recordWordAttempt(record, false, index);
  assert.equal(record.mastery, 0);
});

test('kata dianggap dikuasai pada ambang yang ditetapkan', () => {
  assert.equal(isMastered({ mastery: MASTERY_THRESHOLD - 1 }), false);
  assert.equal(isMastered({ mastery: MASTERY_THRESHOLD }), true);
  assert.equal(isMastered(null), false);
});

test('label penguasaan sesuai tahapnya', () => {
  assert.equal(masteryLabel(null), 'Belum dilatih');
  assert.equal(masteryLabel({ seen: 1, mastery: 1 }), 'Baru belajar');
  assert.equal(masteryLabel({ seen: 3, mastery: 2 }), 'Hampir bisa');
  assert.equal(masteryLabel({ seen: 5, mastery: 5 }), 'Dikuasai');
});
