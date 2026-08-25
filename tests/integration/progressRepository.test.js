/**
 * Test integrasi adapter penyimpanan: memastikan adapter nyata berperilaku
 * sesuai kontrak ProgressRepository, termasuk saat perangkat menolak menyimpan.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalStorageProgressRepository } from '../../src/adapters/outbound/localStorageProgressRepository.js';
import { createMemoryProgressRepository } from '../../src/adapters/outbound/memoryProgressRepository.js';
import { PROGRESS_REPOSITORY_METHODS } from '../../src/ports/ProgressRepository.js';

/** localStorage tiruan sesuai antarmuka Storage. */
function createFakeStorage(behaviour = {}) {
  const data = new Map();
  return {
    data,
    getItem: (key) => (behaviour.readThrows ? (() => { throw new Error('ditolak'); })() : data.get(key) ?? null),
    setItem: (key, value) => {
      if (behaviour.quotaFull) throw new Error('QuotaExceededError');
      data.set(key, value);
    },
    removeItem: (key) => data.delete(key),
  };
}

const IMPLEMENTATIONS = [
  ['localStorage', () => createLocalStorageProgressRepository({ storage: createFakeStorage() })],
  ['memori', () => createMemoryProgressRepository()],
];

IMPLEMENTATIONS.forEach(([name, create]) => {
  test(`adapter ${name} memenuhi kontrak ProgressRepository`, () => {
    const repository = create();
    PROGRESS_REPOSITORY_METHODS.forEach((method) => {
      assert.equal(typeof repository[method], 'function', `metode ${method} tidak ada`);
    });
  });

  test(`adapter ${name}: simpan lalu muat mengembalikan data yang sama`, () => {
    const repository = create();
    assert.equal(repository.load(), null);
    repository.save({ experiencePoints: 120, lessons: { 'u1-l1': { done: true } } });
    assert.equal(repository.load().experiencePoints, 120);
    repository.clear();
    assert.equal(repository.load(), null);
  });

  test(`adapter ${name}: data yang dimuat terlepas dari objek aslinya`, () => {
    const repository = create();
    const profile = { experiencePoints: 10, words: {} };
    repository.save(profile);
    profile.experiencePoints = 999;
    assert.equal(repository.load().experiencePoints, 10);
  });
});

test('data rusak di penyimpanan tidak membuat aplikasi gagal', () => {
  const storage = createFakeStorage();
  storage.data.set('darlene-membaca-v1', '{bukan json');
  const repository = createLocalStorageProgressRepository({ storage });
  assert.equal(repository.load(), null);
});

test('penyimpanan penuh tidak melempar galat ke pemanggil', () => {
  const repository = createLocalStorageProgressRepository({
    storage: createFakeStorage({ quotaFull: true }),
  });
  assert.doesNotThrow(() => repository.save({ experiencePoints: 1 }));
});

test('penyimpanan yang diblokir (mode penyamaran) tetap aman dibaca', () => {
  const repository = createLocalStorageProgressRepository({
    storage: createFakeStorage({ readThrows: true }),
  });
  assert.equal(repository.load(), null);
});
