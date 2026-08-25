import test from 'node:test';
import assert from 'node:assert/strict';
import { chunk, interleave, takeDistinctBy, indexById } from '../../src/shared/collections.js';
import { toDayKey, previousDayKey, daysBetween, formatDayLabel } from '../../src/shared/calendar.js';
import { shuffle, pickOne, seededRandom } from '../../src/shared/random.js';

test('chunk memotong sesuai ukuran', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test('chunk menggabungkan sisa yang terlalu pendek ke potongan sebelumnya', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2, 2), [[1, 2], [3, 4, 5]]);
  assert.deepEqual(chunk([1, 2], 5, 4), [[1, 2]], 'satu potongan tidak digabung ke mana-mana');
});

test('interleave menyelang-nyeling dua daftar dengan panjang berbeda', () => {
  assert.deepEqual(interleave(['a', 'b', 'c'], [1, 2]), ['a', 1, 'b', 2, 'c']);
});

test('takeDistinctBy melewati label yang sudah terpakai', () => {
  const items = [{ v: 'a' }, { v: 'b' }, { v: 'a' }, { v: 'c' }];
  const picked = takeDistinctBy(items, (item) => item.v, ['b'], 2);
  assert.deepEqual(picked.map((item) => item.v), ['a', 'c']);
});

test('indexById membuat peta berdasarkan id', () => {
  assert.deepEqual(indexById([{ id: 'x', n: 1 }]), { x: { id: 'x', n: 1 } });
});

test('toDayKey memakai tanggal lokal, previousDayKey menyeberangi bulan', () => {
  assert.match(toDayKey(Date.parse('2026-08-25T10:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(previousDayKey('2026-03-01'), '2026-02-28');
  assert.equal(previousDayKey('2026-01-01'), '2025-12-31');
  assert.equal(daysBetween('2026-08-20', '2026-08-25'), 5);
});

test('formatDayLabel memakai Bahasa Indonesia', () => {
  assert.match(formatDayLabel('2026-08-25'), /Agustus/);
});

test('seededRandom deterministik dan shuffle tidak mengubah asal', () => {
  const original = [1, 2, 3, 4, 5];
  const first = shuffle(original, seededRandom('benih'));
  const second = shuffle(original, seededRandom('benih'));
  assert.deepEqual(first, second);
  assert.deepEqual(original, [1, 2, 3, 4, 5]);
  assert.deepEqual([...first].sort(), original);
});

test('pickOne selalu mengembalikan anggota daftar', () => {
  const random = seededRandom('p');
  for (let index = 0; index < 20; index += 1) {
    assert.ok(['a', 'b', 'c'].includes(pickOne(['a', 'b', 'c'], random)));
  }
});
