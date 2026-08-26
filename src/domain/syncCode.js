/**
 * ATURAN DOMAIN — kode sinkron.
 *
 * Kode inilah identitas sekaligus kredensial sinkronisasi (lihat ADR-0008):
 * siapa pun yang memilikinya dapat membaca dan menulis profil tersebut.
 * Karena itu kode dibuat acak panjang, memakai abjad tanpa huruf/angka yang
 * mudah tertukar saat diketik ulang orang tua (tanpa I, O, 0, 1).
 */

/** 32 lambang; 16 lambang menghasilkan keacakan 80 bit. */
export const SYNC_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SYNC_CODE_LENGTH = 16;
export const SYNC_CODE_GROUP = 4;

/**
 * Buat kode sinkron baru.
 * @param {() => number} random
 * @returns {string} bentuk berkelompok, mis. "XK4M-7QPZ-R2TW-9HDF"
 */
export function generateSyncCode(random) {
  let code = '';
  for (let index = 0; index < SYNC_CODE_LENGTH; index += 1) {
    code += SYNC_CODE_ALPHABET[Math.floor(random() * SYNC_CODE_ALPHABET.length)];
  }
  return formatSyncCode(code);
}

/**
 * Rapikan masukan pengguna menjadi bentuk baku: huruf besar, tanpa pemisah.
 * Menerima tanda hubung, spasi, dan huruf kecil.
 * @param {string} input
 * @returns {string} string kosong bila tidak sah
 */
export function normalizeSyncCode(input) {
  const cleaned = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== SYNC_CODE_LENGTH) return '';
  const isValid = [...cleaned].every((symbol) => SYNC_CODE_ALPHABET.includes(symbol));
  return isValid ? cleaned : '';
}

/**
 * Tampilkan kode dalam kelompok empat agar mudah dibacakan dan diketik.
 * @param {string} code
 * @returns {string}
 */
export function formatSyncCode(code) {
  const canonical = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return canonical.match(new RegExp(`.{1,${SYNC_CODE_GROUP}}`, 'g'))?.join('-') || '';
}

/** Apakah masukan merupakan kode sinkron yang sah? */
export function isValidSyncCode(input) {
  return normalizeSyncCode(input) !== '';
}
