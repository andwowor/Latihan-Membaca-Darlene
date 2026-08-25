/**
 * USE CASE — pertanyaan baca-saja untuk dashboard, peta belajar, piala,
 * daftar kata, dan Area Orang Tua. Tidak mengubah apa pun.
 */
import { LESSON_ORDER, LESSON_MAP, UNITS } from '../domain/curriculum.js';
import { evaluateUnit } from '../domain/medals.js';
import { ACHIEVEMENTS, MAX_ACHIEVEMENT_POINTS } from '../domain/achievements.js';
import { WORD_LIST } from '../domain/vocabulary.js';
import { isMastered, masteryLabel } from '../domain/mastery.js';
import { previousDayKey } from '../shared/calendar.js';

/**
 * @param {{profileService: object}} dependencies
 */
export function createProgressQueryService({ profileService }) {
  const lessons = () => profileService.get().lessons;

  /** Pelajaran terbuka bila pelajaran sebelumnya sudah selesai. */
  function isLessonUnlocked(lessonId) {
    const position = LESSON_ORDER.indexOf(lessonId);
    if (position <= 0) return true;
    return Boolean(lessons()[LESSON_ORDER[position - 1]]?.done);
  }

  return {
    isLessonUnlocked,

    lessonRecord(lessonId) {
      return lessons()[lessonId] || { done: false, stars: 0, attempts: 0, bestCorrect: 0 };
    },

    /** Pelajaran pertama yang belum selesai — tombol "Lanjut Belajar". */
    currentLessonId() {
      const record = lessons();
      return LESSON_ORDER.find((lessonId) => !record[lessonId]?.done)
        || LESSON_ORDER[LESSON_ORDER.length - 1];
    },

    lessonById(lessonId) {
      return LESSON_MAP[lessonId];
    },

    /** Peta belajar lengkap: unit, capaian, medali, status kunci tiap pelajaran. */
    learningPath() {
      const record = lessons();
      return UNITS.map((unit) => ({
        unit,
        ...evaluateUnit(unit, record),
        lessons: unit.lessons.map((lesson) => ({
          lesson,
          record: record[lesson.id] || { done: false, stars: 0 },
          unlocked: isLessonUnlocked(lesson.id),
        })),
      }));
    },

    /** Daftar achievement beserta status terbuka/terkunci. */
    achievements() {
      const owned = profileService.get().achievements;
      return {
        maxPoints: MAX_ACHIEVEMENT_POINTS,
        items: ACHIEVEMENTS.map((achievement) => ({
          ...achievement,
          unlockedAt: owned[achievement.id] || null,
        })),
      };
    },

    /**
     * Daftar kata beserta tingkat penguasaannya.
     * @param {{language?: ('id'|'en'), onlyMastered?: boolean}} [filter]
     */
    words(filter = {}) {
      const records = profileService.get().words;
      return WORD_LIST
        .filter((word) => (!filter.language || word.lang === filter.language))
        .filter((word) => (!filter.onlyMastered || isMastered(records[word.id])))
        .map((word) => ({
          ...word,
          record: records[word.id] || null,
          mastery: records[word.id]?.mastery || 0,
          mastered: isMastered(records[word.id]),
          masteryLabel: masteryLabel(records[word.id]),
        }));
    },

    /**
     * Riwayat harian untuk grafik di Area Orang Tua.
     * Hari tanpa aktivitas tetap muncul sebagai batang kosong supaya grafik
     * selalu mewakili rentang waktu yang sama.
     * @param {number} [days]
     */
    dailyHistory(days = 14) {
      const profile = profileService.get();
      const recorded = new Map(
        [...profile.history, profile.daily].map((entry) => [entry.day, entry]),
      );
      const timeline = [];
      let dayKey = profileService.todayKey();
      for (let index = 0; index < days; index += 1) {
        timeline.unshift(recorded.get(dayKey) || { day: dayKey, xp: 0, correct: 0, lessons: 0 });
        dayKey = previousDayKey(dayKey);
      }
      return timeline;
    },
  };
}
