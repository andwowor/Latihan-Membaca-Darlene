/**
 * ATURAN DOMAIN — tujuan akhir aplikasi.
 *
 * Diminta langsung oleh orang tua: Darlene dinyatakan berhasil bila mampu
 * membaca 2 paragraf Bahasa Indonesia dan 2 paragraf Bahasa Inggris,
 * masing-masing minimal 4 baris. Ukurannya bukan XP atau bintang, melainkan
 * dua pelajaran "🎓 Ujian Membaca" — di sana anak membaca paragraf-paragraf
 * itu keras-keras dan orang tualah yang menilai, karena membaca nyaring
 * memang hanya bisa dinilai telinga manusia.
 */
import { LESSONS, LESSON_MAP, UNIT_MAP, READING_EXAM_LESSON_IDS } from './curriculum.js';

/** Pelajaran cerita (bukan ujian) — anak tangga menuju ujian. */
const STORY_LESSON_IDS = LESSONS
  .filter((lesson) => lesson.kind === 'stories' && !lesson.exam)
  .map((lesson) => lesson.id);

/**
 * Sejauh mana Darlene dari tujuan akhir.
 * @param {Object<string, {done?: boolean, stars?: number}>} lessonRecords
 * @returns {{done: boolean, exams: Array<object>, storiesDone: number,
 *            storiesTotal: number}}
 */
export function readingGoalProgress(lessonRecords = {}) {
  const exams = READING_EXAM_LESSON_IDS.map((lessonId) => {
    const lesson = LESSON_MAP[lessonId];
    const unit = UNIT_MAP[lesson.unitId];
    const record = lessonRecords[lessonId];
    return {
      lessonId,
      language: unit.id === 'u13' ? 'en' : 'id',
      unitTitle: unit.title,
      done: Boolean(record?.done),
      stars: record?.stars || 0,
    };
  });
  return {
    done: exams.length > 0 && exams.every((exam) => exam.done),
    exams,
    storiesDone: STORY_LESSON_IDS.filter((lessonId) => lessonRecords[lessonId]?.done).length,
    storiesTotal: STORY_LESSON_IDS.length,
  };
}
