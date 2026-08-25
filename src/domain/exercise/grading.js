/**
 * ATURAN DOMAIN — penilaian jawaban & pemetaan tipe soal ke metrik misi.
 */

/** Seluruh tipe latihan yang dikenal aplikasi. */
export const EXERCISE_TYPES = [
  'pic-word', 'word-pic', 'listen-word', 'spell', 'read-aloud', 'translate',
  'letter-sound', 'letter-find', 'letter-word', 'syl-listen', 'syl-build',
  'sentence-pic', 'sentence-build', 'sentence-read',
];

/** Tipe soal yang kebenarannya dilaporkan sendiri oleh anak/orang tua. */
export const SELF_CHECK_TYPES = new Set(['read-aloud', 'sentence-read']);

/** Tipe soal yang tidak bisa dipakai untuk kata tanpa gambar (sight word). */
export const PICTURE_DEPENDENT_TYPES = new Set(['pic-word', 'word-pic']);

/**
 * Apakah jawaban benar?
 * @param {object} question
 * @param {*} response kunci opsi, susunan kepingan, atau boolean (self check)
 * @returns {boolean}
 */
export function isAnswerCorrect(question, response) {
  if (question.kind === 'choice') {
    return Boolean(question.options.find((option) => option.key === response)?.correct);
  }
  if (question.kind === 'build') {
    return Array.isArray(response)
      && response.length === question.answer.length
      && response.every((tile, index) => tile === question.answer[index]);
  }
  return response === true;
}

/**
 * Metrik misi harian yang terisi oleh sebuah tipe soal.
 * @param {string} exerciseType
 * @returns {('spell'|'listen'|'read'|null)}
 */
export function missionMetricForExerciseType(exerciseType) {
  if (['spell', 'syl-build', 'sentence-build'].includes(exerciseType)) return 'spell';
  if (['listen-word', 'letter-sound', 'syl-listen'].includes(exerciseType)) return 'listen';
  if (SELF_CHECK_TYPES.has(exerciseType)) return 'read';
  return null;
}
