/**
 * Tahap cerita & tujuan akhir.
 *
 * Dua janji yang dijaga berkas ini, keduanya datang langsung dari orang tua:
 *  1. Tujuan akhir aplikasi adalah membaca 2 paragraf Indonesia + 2 paragraf
 *     Inggris, masing-masing minimal 4 baris.
 *  2. Tingkat kesulitan TIDAK naik: setiap kata dalam cerita harus sudah
 *     pernah diajarkan (kosakata, kalimat latihan, atau kata sambung yang
 *     diizinkan), dan setiap baris tetap kalimat pendek.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORIES, STORY_CONNECTORS, WORD_LIST, SENTENCES,
} from '../../src/domain/vocabulary.js';
import { UNITS, LESSONS, READING_EXAM_LESSON_IDS } from '../../src/domain/curriculum.js';
import { readingGoalProgress } from '../../src/domain/goal.js';

const normalize = (text) => text.toLowerCase().replace(/[.,!?]/g, '');

function allowedWords(lang) {
  const allowed = new Set();
  WORD_LIST.filter((word) => word.lang === lang)
    .forEach((word) => allowed.add(normalize(word.text)));
  SENTENCES.filter((sentence) => sentence.lang === lang)
    .forEach((sentence) => sentence.text.split(' ')
      .forEach((word) => allowed.add(normalize(word))));
  STORY_CONNECTORS[lang].forEach((word) => allowed.add(word));
  return allowed;
}

test('kesulitan tidak naik: seluruh kata cerita sudah pernah diajarkan', () => {
  const allowed = { id: allowedWords('id'), en: allowedWords('en') };
  STORIES.forEach((story) => {
    [...story.lines, story.title].forEach((line) => {
      line.split(' ').forEach((word) => {
        assert.ok(allowed[story.lang].has(normalize(word)),
          `${story.id}: kata "${word}" belum pernah diajarkan`);
      });
    });
  });
});

test('kesulitan tidak naik: tiap baris tetap kalimat pendek', () => {
  STORIES.forEach((story) => {
    story.lines.forEach((line) => {
      assert.ok(line.split(' ').length <= 6, `${story.id}: "${line}" terlalu panjang`);
      assert.match(line, /\.$/, `${story.id}: "${line}" tanpa titik`);
    });
  });
});

test('baris dalam satu cerita tidak kembar, supaya soal dengar tak ambigu', () => {
  STORIES.forEach((story) => {
    assert.equal(new Set(story.lines).size, story.lines.length, story.id);
  });
});

test('tujuan akhir: 2 paragraf Indonesia + 2 Inggris, masing-masing ≥ 4 baris', () => {
  const exams = STORIES.filter((story) => story.exam);
  assert.equal(exams.filter((story) => story.lang === 'id').length, 2);
  assert.equal(exams.filter((story) => story.lang === 'en').length, 2);
  exams.forEach((story) => {
    assert.ok(story.lines.length >= 4, `${story.id}: hanya ${story.lines.length} baris`);
  });
});

test('cerita naik setapak demi setapak: 2 baris dulu, ujian paling akhir', () => {
  ['u12', 'u13'].forEach((unitId) => {
    const unit = UNITS.find((candidate) => candidate.id === unitId);
    assert.ok(unit, unitId);
    const lineCounts = unit.lessons.map((lesson) => Math.max(
      ...lesson.items.map((id) => STORIES.find((story) => story.id === id).lines.length),
    ));
    for (let i = 1; i < lineCounts.length; i += 1) {
      assert.ok(lineCounts[i] >= lineCounts[i - 1],
        `${unitId}: pelajaran ${i + 1} lebih pendek dari sebelumnya`);
    }
    assert.ok(unit.lessons.at(-1).exam, `${unitId}: pelajaran terakhir bukan ujian`);
  });
});

test('unit cerita berdiri SETELAH Baca Kalimat: bukan pengganti, tapi lanjutan', () => {
  const order = LESSONS.map((lesson) => lesson.unitId);
  assert.ok(order.indexOf('u12') > order.lastIndexOf('u10'));
  assert.ok(order.indexOf('u13') > order.lastIndexOf('u12'));
});

test('kemajuan tujuan dihitung dari pelajaran ujian, bukan dari XP', () => {
  const none = readingGoalProgress({});
  assert.equal(none.done, false);
  assert.equal(none.exams.length, 2);
  assert.equal(none.storiesDone, 0);
  assert.ok(none.storiesTotal >= 6);

  const half = readingGoalProgress({ [READING_EXAM_LESSON_IDS[0]]: { done: true, stars: 3 } });
  assert.equal(half.done, false, 'satu bahasa saja belum cukup');

  const records = Object.fromEntries(
    READING_EXAM_LESSON_IDS.map((id) => [id, { done: true, stars: 2 }]),
  );
  const done = readingGoalProgress(records);
  assert.equal(done.done, true);
  assert.deepEqual(done.exams.map((exam) => exam.language).sort(), ['en', 'id']);
});
