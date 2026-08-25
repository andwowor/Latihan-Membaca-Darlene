/**
 * PORT (outbound) — sumber waktu.
 *
 * Keputusan yang disembunyikan: dari mana waktu diambil. Domain tidak boleh
 * memanggil Date.now() langsung agar streak & misi harian bisa diuji
 * secara deterministik.
 *
 * @typedef {Object} ClockPort
 * @property {() => number} now Milidetik sejak epoch.
 */

export const CLOCK_PORT_METHODS = ['now'];
