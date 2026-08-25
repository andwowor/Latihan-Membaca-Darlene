/**
 * ATURAN DOMAIN — medali unit.
 * Perunggu: semua pelajaran unit selesai.
 * Perak   : selesai + rata-rata minimal 2 bintang.
 * Emas    : selesai + seluruh pelajaran 3 bintang.
 */
import { MAX_STARS_PER_LESSON } from './scoring.js';

export const MEDAL_ORDER = ['bronze', 'silver', 'gold'];

export const MEDAL_LABELS = {
  bronze: { emoji: '🥉', name: 'Perunggu' },
  silver: { emoji: '🥈', name: 'Perak' },
  gold: { emoji: '🥇', name: 'Emas' },
};

/**
 * Hitung capaian sebuah unit dari catatan pelajarannya.
 * @param {{lessons: Array<{id: string}>}} unit
 * @param {Object<string, {done: boolean, stars: number}>} lessonRecords
 * @returns {{total: number, done: number, stars: number, maxStars: number,
 *            medal: (string|null), complete: boolean, progress: number}}
 */
export function evaluateUnit(unit, lessonRecords) {
  const total = unit.lessons.length;
  let done = 0;
  let stars = 0;
  unit.lessons.forEach((lesson) => {
    const record = lessonRecords[lesson.id];
    if (!record?.done) return;
    done += 1;
    stars += record.stars || 0;
  });
  const complete = total > 0 && done === total;
  return {
    total,
    done,
    stars,
    maxStars: total * MAX_STARS_PER_LESSON,
    complete,
    progress: total === 0 ? 0 : done / total,
    medal: complete ? medalForStars(stars, total) : null,
  };
}

/**
 * Tentukan tingkat medali dari jumlah bintang yang terkumpul.
 * @param {number} stars
 * @param {number} lessonCount
 * @returns {'gold'|'silver'|'bronze'}
 */
export function medalForStars(stars, lessonCount) {
  if (stars >= lessonCount * MAX_STARS_PER_LESSON) return 'gold';
  if (stars >= lessonCount * 2) return 'silver';
  return 'bronze';
}
