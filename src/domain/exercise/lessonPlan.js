/**
 * ATURAN DOMAIN — perakit satu pelajaran menjadi daftar soal.
 *
 * Aturan yang dijaga di sini:
 *  - satu pelajaran selalu berisi QUESTIONS_PER_LESSON soal;
 *  - tipe soal bergantian supaya anak tidak bosan;
 *  - soal "baca sendiri" dibatasi agar tidak mendominasi;
 *  - kata tanpa gambar (sight word) tidak pernah dapat soal bergambar.
 */
import { WORDS, LETTERS, SYLLABLE_FAMILIES, SENTENCE_MAP, PICTURE_WORDS } from '../vocabulary.js';
import { QUESTIONS_PER_LESSON } from '../curriculum.js';
import { MASTERY_THRESHOLD } from '../mastery.js';
import { QUESTION_BUILDERS } from './builders.js';
import { SELF_CHECK_TYPES, PICTURE_DEPENDENT_TYPES } from './grading.js';
import { indexById } from '../../shared/collections.js';
import { shuffle } from '../../shared/random.js';

const LETTER_MAP = indexById(LETTERS);
const SYLLABLE_FAMILY_MAP = indexById(SYLLABLE_FAMILIES);

/** Maksimal soal "baca sendiri" dalam satu pelajaran. */
export const MAX_SELF_CHECK_QUESTIONS = 2;

/** Jumlah kata yang diambil untuk satu sesi ulangan campur. */
export const REVIEW_WORD_COUNT = 6;

function resolveItem(lessonKind, itemId) {
  if (lessonKind === 'letters') return LETTER_MAP[itemId];
  if (lessonKind === 'syllables') return SYLLABLE_FAMILY_MAP[itemId];
  if (lessonKind === 'sentences') return SENTENCE_MAP[itemId];
  return WORDS[itemId];
}

/**
 * Pilih tipe soal untuk putaran ke-`index`, dengan penyesuaian:
 * batasi soal baca-sendiri, dan hindari soal bergambar untuk sight word.
 */
function chooseType(types, index, item, selfCheckCount) {
  const round = Math.floor(index / Math.max(1, types.length));
  let type = types[(index + round) % types.length];

  if (SELF_CHECK_TYPES.has(type) && selfCheckCount >= MAX_SELF_CHECK_QUESTIONS) {
    type = types.find((candidate) => !SELF_CHECK_TYPES.has(candidate)) || type;
  }
  if (item.sight && PICTURE_DEPENDENT_TYPES.has(type)) {
    type = 'listen-word';
  }
  return type;
}

/**
 * Rakit soal untuk sebuah pelajaran.
 * @param {object} params
 * @param {object} params.lesson pelajaran dari domain/curriculum.js
 * @param {Array<string>} [params.itemIds] materi pengganti (untuk unit ulangan)
 * @param {() => number} params.random
 * @returns {Array<object>} daftar soal
 */
export function planLesson({ lesson, itemIds, random }) {
  if (!lesson) return [];
  const kind = lesson.kind === 'mixed' ? 'words' : lesson.kind;
  const sourceIds = itemIds?.length ? itemIds : lesson.items;
  const items = shuffle(
    sourceIds.map((itemId) => resolveItem(kind, itemId)).filter(Boolean),
    random,
  );
  if (!items.length) return [];

  const questions = [];
  const attemptLimit = QUESTIONS_PER_LESSON * 3;
  let selfCheckCount = 0;

  for (let index = 0; questions.length < QUESTIONS_PER_LESSON && index < attemptLimit; index += 1) {
    const item = items[index % items.length];
    const type = chooseType(lesson.types, index, item, selfCheckCount);
    const build = QUESTION_BUILDERS[type];
    if (!build) continue;
    if (SELF_CHECK_TYPES.has(type)) selfCheckCount += 1;

    questions.push({
      ...build(item, random),
      id: `${lesson.id}-q${questions.length + 1}`,
      index: questions.length,
    });
  }
  return questions;
}

/**
 * Rakit latihan cepat dari sekumpulan kata (dipakai di tab Kata).
 * @param {{wordIds: Array<string>, count?: number, random: () => number}} params
 * @returns {Array<object>}
 */
export function planPractice({ wordIds, count = QUESTIONS_PER_LESSON, random }) {
  const words = shuffle(wordIds.map((wordId) => WORDS[wordId]).filter(Boolean), random);
  if (!words.length) return [];
  const types = ['pic-word', 'listen-word', 'spell', 'word-pic'];
  const questions = [];

  for (let index = 0; questions.length < count && index < count * 3; index += 1) {
    const word = words[index % words.length];
    const type = chooseType(types, index, word, MAX_SELF_CHECK_QUESTIONS);
    questions.push({
      ...QUESTION_BUILDERS[type](word, random),
      id: `practice-q${questions.length + 1}`,
      index: questions.length,
    });
  }
  return questions;
}

/**
 * Pilih kata untuk sesi ulangan: dahulukan kata yang sudah pernah dilatih
 * tetapi belum dikuasai, supaya pengulangan tepat sasaran.
 * @param {Object<string, {seen: number, mastery: number}>} wordRecords
 * @param {number} count
 * @param {() => number} random
 * @returns {Array<string>} daftar id kata
 */
export function selectReviewWordIds(wordRecords, count, random) {
  const practiced = PICTURE_WORDS.filter((word) => (wordRecords[word.id]?.seen || 0) > 0);
  const notYetMastered = practiced.filter(
    (word) => (wordRecords[word.id]?.mastery || 0) < MASTERY_THRESHOLD,
  );
  let pool = PICTURE_WORDS;
  if (notYetMastered.length >= count) pool = notYetMastered;
  else if (practiced.length >= count) pool = practiced;
  return shuffle(pool, random).slice(0, count).map((word) => word.id);
}
