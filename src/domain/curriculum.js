/**
 * ENTITAS DOMAIN — peta belajar (learning path) bergaya Duolingo.
 * Setiap unit berisi beberapa pelajaran; setiap pelajaran menghasilkan 8 soal.
 * Murni data & aturan penyusunan; tidak tahu apa pun soal UI atau penyimpanan.
 */
import { LETTERS, SYLLABLE_FAMILIES, SENTENCES, WORD_LIST } from './vocabulary.js';
import { chunk, interleave, indexById } from '../shared/collections.js';

/** Jumlah soal yang dirakit untuk satu pelajaran. */
export const QUESTIONS_PER_LESSON = 8;

/** Pelajaran tidak boleh berisi kurang dari sekian materi. */
export const MIN_ITEMS_PER_LESSON = 4;

/** Ambil id kata pada satu bahasa untuk kategori tertentu. */
function pick(language, ...categories) {
  return WORD_LIST
    .filter((word) => word.lang === language && categories.includes(word.category))
    .map((word) => word.id);
}

function wordLessons(unitId, ids, types, perLesson = 6) {
  return chunk(ids, perLesson, MIN_ITEMS_PER_LESSON).map((items, i) => ({
    id: `${unitId}-l${i + 1}`,
    title: `Pelajaran ${i + 1}`,
    kind: 'words',
    items,
    types,
  }));
}

const WORD_TYPES = ['pic-word', 'word-pic', 'listen-word', 'spell', 'read-aloud'];
const WORD_TYPES_PLUS = [...WORD_TYPES, 'translate'];
const SIGHT_TYPES = ['listen-word', 'spell', 'read-aloud', 'translate'];

export const UNITS = [
  {
    id: 'u1',
    title: 'Kenal Huruf',
    subtitle: 'A sampai Z • bunyi huruf',
    emoji: '🔤',
    color: '#7c3aed',
    lessons: chunk(LETTERS.map((letter) => letter.id), 7, MIN_ITEMS_PER_LESSON).map((items, i) => ({
      id: `u1-l${i + 1}`,
      title: `Huruf ${items[0].slice(-1)}–${items[items.length - 1].slice(-1)}`,
      kind: 'letters',
      items,
      types: ['letter-sound', 'letter-find', 'letter-word'],
    })),
  },
  {
    id: 'u2',
    title: 'Suku Kata',
    subtitle: 'ba • bi • bu • be • bo',
    emoji: '🧩',
    color: '#db2777',
    lessons: chunk(SYLLABLE_FAMILIES.map((family) => family.id), 4, MIN_ITEMS_PER_LESSON).map((items, i) => ({
      id: `u2-l${i + 1}`,
      title: `Pelajaran ${i + 1}`,
      kind: 'syllables',
      items,
      types: ['syl-listen', 'syl-build'],
    })),
  },
  {
    id: 'u3',
    title: 'Kata Pertamaku',
    subtitle: 'Benda & makanan • Indonesia',
    emoji: '🇮🇩',
    color: '#ea580c',
    lessons: wordLessons('u3', [...pick('id', 'benda'), ...pick('id', 'makanan')], WORD_TYPES),
  },
  {
    id: 'u4',
    title: 'My First Words',
    subtitle: 'Things & food • English',
    emoji: '🇬🇧',
    color: '#0284c7',
    lessons: wordLessons('u4', [...pick('en', 'thing'), ...pick('en', 'food')], WORD_TYPES_PLUS),
  },
  {
    id: 'u5',
    title: 'Tubuh & Keluarga',
    subtitle: 'Body & family • ID + EN',
    emoji: '👨‍👩‍👧',
    color: '#16a34a',
    lessons: wordLessons(
      'u5',
      interleave(pick('id', 'tubuh', 'keluarga'), pick('en', 'body', 'family')),
      WORD_TYPES_PLUS,
    ),
  },
  {
    id: 'u6',
    title: 'Kebun Binatang',
    subtitle: 'Hewan & animals • ID + EN',
    emoji: '🦁',
    color: '#ca8a04',
    lessons: wordLessons(
      'u6',
      interleave(pick('id', 'hewan'), pick('en', 'animal')),
      WORD_TYPES_PLUS,
    ),
  },
  {
    id: 'u7',
    title: 'Alam & Warna',
    subtitle: 'Nature & colors • ID + EN',
    emoji: '🌈',
    color: '#0d9488',
    lessons: wordLessons(
      'u7',
      interleave(pick('id', 'alam', 'warna'), pick('en', 'nature', 'color')),
      WORD_TYPES_PLUS,
    ),
  },
  {
    id: 'u8',
    title: 'Sight Words',
    subtitle: 'Kata hafalan Bahasa Inggris',
    emoji: '⚡',
    color: '#9333ea',
    lessons: wordLessons('u8', pick('en', 'sight'), SIGHT_TYPES, 7),
  },
  {
    id: 'u9',
    title: 'Kendaraan',
    subtitle: 'Vehicles • ID + EN',
    emoji: '🚗',
    color: '#dc2626',
    lessons: wordLessons(
      'u9',
      interleave(pick('id', 'kendaraan'), pick('en', 'vehicle')),
      WORD_TYPES_PLUS,
    ),
  },
  {
    id: 'u10',
    title: 'Baca Kalimat',
    subtitle: 'Kalimat pendek • ID + EN',
    emoji: '📖',
    color: '#4f46e5',
    lessons: chunk(
      interleave(
        SENTENCES.filter((sentence) => sentence.lang === 'id').map((sentence) => sentence.id),
        SENTENCES.filter((sentence) => sentence.lang === 'en').map((sentence) => sentence.id),
      ),
      5,
      MIN_ITEMS_PER_LESSON,
    ).map((items, i) => ({
      id: `u10-l${i + 1}`,
      title: `Pelajaran ${i + 1}`,
      kind: 'sentences',
      items,
      types: ['sentence-pic', 'sentence-build', 'sentence-read'],
    })),
  },
  {
    id: 'u11',
    title: 'Tantangan Juara',
    subtitle: 'Ulangan campur semua materi',
    emoji: '🏆',
    color: '#f59e0b',
    lessons: [1, 2, 3].map((i) => ({
      id: `u11-l${i}`,
      title: `Tantangan ${i}`,
      kind: 'mixed',
      items: [],
      types: WORD_TYPES_PLUS,
    })),
  },
];

export const LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unitId: u.id })));
export const LESSON_MAP = indexById(LESSONS);
export const UNIT_MAP = indexById(UNITS);

/** Unit tempat sebuah pelajaran berada. */
export function unitOfLesson(lessonId) {
  return UNIT_MAP[LESSON_MAP[lessonId]?.unitId];
}

/** Urutan semua pelajaran di seluruh peta (untuk membuka kunci berikutnya). */
export const LESSON_ORDER = LESSONS.map((lesson) => lesson.id);

/** Pelajaran berikutnya pada peta belajar, null bila sudah yang terakhir. */
export function nextLessonId(lessonId) {
  const position = LESSON_ORDER.indexOf(lessonId);
  if (position < 0 || position === LESSON_ORDER.length - 1) return null;
  return LESSON_ORDER[position + 1];
}
