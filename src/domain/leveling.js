/**
 * ATURAN DOMAIN — XP dan level.
 *
 * Keputusan yang disembunyikan: rumus kenaikan level. Bila kurva terasa
 * terlalu cepat/lambat untuk Darlene, hanya berkas ini yang berubah.
 */

/** Judul level yang ditampilkan di dashboard. */
export const LEVEL_TITLES = [
  'Pembaca Cilik', 'Penjelajah Huruf', 'Pemburu Kata', 'Sahabat Buku',
  'Perakit Suku Kata', 'Pembaca Hebat', 'Bintang Baca', 'Ahli Kata',
  'Juara Membaca', 'Master Baca', 'Legenda Baca',
];

/**
 * XP kumulatif minimum untuk mencapai sebuah level.
 * Level 1 = 0, lalu jarak antarlevel bertambah 50 XP setiap kali
 * (100, 150, 200, ...) agar kenaikan awal terasa cepat bagi anak.
 * @param {number} level
 * @returns {number}
 */
export function xpRequiredForLevel(level) {
  const steps = level - 1;
  return 100 * steps + 25 * steps * (steps - 1);
}

/**
 * Uraikan XP menjadi informasi level yang siap ditampilkan.
 * @param {number} experiencePoints
 * @returns {{level: number, title: string, xpInLevel: number, xpNeeded: number,
 *            progress: number, nextLevelAt: number}}
 */
export function describeLevel(experiencePoints) {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= experiencePoints) level += 1;
  const floor = xpRequiredForLevel(level);
  const ceiling = xpRequiredForLevel(level + 1);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    xpInLevel: experiencePoints - floor,
    xpNeeded: ceiling - floor,
    progress: (experiencePoints - floor) / (ceiling - floor),
    nextLevelAt: ceiling,
  };
}
