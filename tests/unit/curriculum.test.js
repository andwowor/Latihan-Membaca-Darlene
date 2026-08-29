import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UNITS, LESSONS, LESSON_MAP, LESSON_ORDER, unitOfLesson, nextLessonId, MIN_ITEMS_PER_LESSON,
} from '../../src/domain/curriculum.js';
import { WORDS, LETTERS, SYLLABLE_FAMILIES, SENTENCE_MAP, STORY_MAP } from '../../src/domain/vocabulary.js';
import { EXERCISE_TYPES } from '../../src/domain/exercise/grading.js';

const KNOWN_IDS = {
  letters: new Set(LETTERS.map((letter) => letter.id)),
  syllables: new Set(SYLLABLE_FAMILIES.map((family) => family.id)),
  sentences: new Set(Object.keys(SENTENCE_MAP)),
  stories: new Set(Object.keys(STORY_MAP)),
  words: new Set(Object.keys(WORDS)),
};

test('peta belajar punya cukup unit dan pelajaran', () => {
  assert.ok(UNITS.length >= 10, `unit: ${UNITS.length}`);
  assert.ok(LESSONS.length >= 40, `pelajaran: ${LESSONS.length}`);
});

test('id pelajaran unik dan urutannya konsisten', () => {
  assert.equal(new Set(LESSON_ORDER).size, LESSON_ORDER.length);
  assert.equal(LESSON_ORDER.length, LESSONS.length);
});

test('setiap pelajaran menunjuk materi yang benar-benar ada', () => {
  LESSONS.forEach((lesson) => {
    if (lesson.kind === 'mixed') return;
    // Pelajaran cerita boleh berisi lebih sedikit materi: pengecoh soalnya
    // datang dari dalam ceritanya sendiri (baris-barisnya), bukan dari
    // sesama materi, dan satu cerita panjang sudah cukup untuk 8 soal.
    const minimum = lesson.kind === 'stories' ? 2 : MIN_ITEMS_PER_LESSON;
    assert.ok(lesson.items.length >= minimum,
      `${lesson.id} hanya berisi ${lesson.items.length} materi`);
    lesson.items.forEach((itemId) => {
      assert.ok(KNOWN_IDS[lesson.kind].has(itemId), `${lesson.id} memakai materi asing: ${itemId}`);
    });
  });
});

test('setiap pelajaran memakai tipe latihan yang dikenal', () => {
  LESSONS.forEach((lesson) => {
    assert.ok(lesson.types.length > 0, `${lesson.id} tanpa tipe soal`);
    lesson.types.forEach((type) => {
      assert.ok(EXERCISE_TYPES.includes(type), `${lesson.id} memakai tipe asing: ${type}`);
    });
  });
});

test('unit Indonesia dan Inggris sama-sama tersedia dan bercampur', () => {
  const withIndonesian = UNITS.filter((unit) => unit.lessons.some(
    (lesson) => lesson.items.some((id) => id.startsWith('id-')),
  ));
  const withEnglish = UNITS.filter((unit) => unit.lessons.some(
    (lesson) => lesson.items.some((id) => id.startsWith('en-')),
  ));
  const mixedUnits = UNITS.filter((unit) => unit.lessons.some((lesson) => (
    lesson.items.some((id) => id.startsWith('id-')) && lesson.items.some((id) => id.startsWith('en-'))
  )));
  assert.ok(withIndonesian.length >= 3);
  assert.ok(withEnglish.length >= 3);
  assert.ok(mixedUnits.length >= 3, 'harus ada unit yang mencampur dua bahasa dalam satu pelajaran');
});

test('navigasi antar pelajaran', () => {
  assert.equal(nextLessonId(LESSON_ORDER[0]), LESSON_ORDER[1]);
  assert.equal(nextLessonId(LESSON_ORDER.at(-1)), null);
  assert.equal(unitOfLesson(LESSON_ORDER[0]).id, LESSONS[0].unitId);
  assert.ok(LESSON_MAP[LESSON_ORDER[0]]);
});

test('setiap unit punya identitas tampilan', () => {
  UNITS.forEach((unit) => {
    assert.ok(unit.title && unit.subtitle && unit.emoji, `${unit.id} tampilan`);
    assert.match(unit.color, /^#[0-9a-f]{6}$/i, `${unit.id} warna`);
  });
});
