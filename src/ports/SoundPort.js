/**
 * PORT (outbound) — efek suara permainan (benar, salah, naik level, dll).
 *
 * Keputusan yang disembunyikan: cara membunyikan efek (sintesis Web Audio
 * hari ini, berkas .mp3 di kemudian hari).
 *
 * @typedef {Object} SoundPort
 * @property {(effect: 'tap'|'correct'|'wrong'|'star'|'levelup'|'finish'|'badge') => void} play
 * @property {() => void} unlock
 */

export const SOUND_PORT_METHODS = ['play', 'unlock'];
