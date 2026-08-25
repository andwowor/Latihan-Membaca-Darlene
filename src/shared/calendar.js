/**
 * Utilitas tanggal murni. Tidak pernah memanggil Date.now() sendiri —
 * waktu selalu diberikan dari luar lewat ClockPort.
 * Lapisan: shared.
 */

/**
 * Ubah timestamp menjadi kunci hari lokal (YYYY-MM-DD).
 * @param {number} timestamp milidetik epoch
 * @returns {string}
 */
export function toDayKey(timestamp) {
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * Kunci hari sebelum `dayKey`.
 * @param {string} dayKey format YYYY-MM-DD
 * @returns {string}
 */
export function previousDayKey(dayKey) {
  const date = new Date(`${dayKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Selisih hari antara dua kunci hari.
 * @param {string} fromDayKey
 * @param {string} toDayKey
 * @returns {number}
 */
export function daysBetween(fromDayKey, toDayKey) {
  const from = Date.parse(`${fromDayKey}T12:00:00Z`);
  const to = Date.parse(`${toDayKey}T12:00:00Z`);
  return Math.round((to - from) / 86400000);
}

/**
 * Format tanggal untuk ditampilkan, mis. "Senin, 25 Agustus".
 * @param {string} dayKey
 * @returns {string}
 */
export function formatDayLabel(dayKey) {
  const date = new Date(`${dayKey}T12:00:00Z`);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}
