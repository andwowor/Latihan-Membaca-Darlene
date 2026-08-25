/**
 * ATURAN DOMAIN — perolehan XP dan bintang pelajaran.
 * Semua angka hadiah terkumpul di satu berkas agar mudah disetel ulang.
 */

export const XP_PER_CORRECT_ANSWER = 10;
export const XP_LESSON_BONUS = 20;
export const XP_PERFECT_BONUS = 15;
export const MAX_STARS_PER_LESSON = 3;

/**
 * Bintang pelajaran: 3 bila tanpa salah, 2 bila maksimal dua kali salah,
 * selebihnya 1. Tidak pernah nol supaya anak tetap merasa berhasil.
 * @param {number} mistakes
 * @returns {number} 1..3
 */
export function starsForMistakes(mistakes) {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

/**
 * XP bonus saat pelajaran selesai. Mengulang pelajaran tetap dapat XP,
 * tetapi separuhnya, agar mengulang tidak jadi jalan pintas menumpuk XP.
 * @param {{mistakes: number, firstTime: boolean}} params
 * @returns {number}
 */
export function lessonCompletionXp({ mistakes, firstTime }) {
  const bonus = XP_LESSON_BONUS + (mistakes === 0 ? XP_PERFECT_BONUS : 0);
  return firstTime ? bonus : Math.round(bonus / 2);
}
