/**
 * PORT (outbound) — sumber keacakan.
 *
 * Keputusan yang disembunyikan: pembangkit angka acak. Dengan port ini,
 * pembuatan soal bisa diuji ulang persis (seeded) di dalam test.
 *
 * @typedef {Object} RandomPort
 * @property {() => number} next Angka pecahan pada rentang [0, 1).
 */

export const RANDOM_PORT_METHODS = ['next'];
