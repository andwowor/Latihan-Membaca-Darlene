/**
 * ATURAN DOMAIN — penguasaan kata.
 * Skor 0..5 per kata: naik satu saat benar, turun satu saat salah.
 * Kata dianggap "dikuasai" pada skor >= AMBANG_PENGUASAAN.
 */

export const MASTERY_MAX = 5;
export const MASTERY_THRESHOLD = 4;

/** Catatan kosong untuk kata yang belum pernah dilatih. */
export function emptyWordRecord() {
  return { seen: 0, correct: 0, wrong: 0, mastery: 0, lastAt: null };
}

/**
 * Perbarui catatan sebuah kata setelah satu jawaban.
 * @param {object} record
 * @param {boolean} answeredCorrectly
 * @param {number} timestamp
 * @returns {object} catatan baru (tidak mengubah yang lama)
 */
export function recordWordAttempt(record, answeredCorrectly, timestamp) {
  const base = record || emptyWordRecord();
  const mastery = answeredCorrectly
    ? Math.min(MASTERY_MAX, base.mastery + 1)
    : Math.max(0, base.mastery - 1);
  return {
    seen: base.seen + 1,
    correct: base.correct + (answeredCorrectly ? 1 : 0),
    wrong: base.wrong + (answeredCorrectly ? 0 : 1),
    mastery,
    lastAt: timestamp,
  };
}

/** Apakah kata sudah dikuasai? */
export function isMastered(record) {
  return (record?.mastery || 0) >= MASTERY_THRESHOLD;
}

/** Label tingkat penguasaan untuk ditampilkan ke orang tua. */
export function masteryLabel(record) {
  const mastery = record?.mastery || 0;
  if (!record?.seen) return 'Belum dilatih';
  if (mastery >= MASTERY_THRESHOLD) return 'Dikuasai';
  if (mastery >= 2) return 'Hampir bisa';
  return 'Baru belajar';
}
