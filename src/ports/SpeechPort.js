/**
 * PORT (outbound) — pengucapan kata/kalimat.
 *
 * Keputusan yang disembunyikan: mesin text-to-speech yang dipakai.
 * Saat ini Web Speech API bawaan browser; bisa diganti berkas audio
 * rekaman atau TTS awan tanpa menyentuh lapisan lain.
 *
 * @typedef {Object} SpeechPort
 * @property {(text: string, language: 'id'|'en', options?: object) => Promise<void>} speak
 * @property {(text: string, language: 'id'|'en') => Promise<void>} spellOut Eja huruf per huruf.
 * @property {() => void} stop
 * @property {(language: 'id'|'en') => Array<{id: string, label: string}>} voicesFor
 * @property {(language: 'id'|'en') => boolean} isAvailable
 * @property {() => void} unlock Dipanggil pada interaksi pertama (syarat iOS Safari).
 * @property {() => Array<{name: string, lang: string, local: boolean}>} allVoices
 *   Seluruh suara yang dilaporkan perangkat, apa adanya — untuk diagnosa.
 * @property {(text: string, language: 'id'|'en') => {text: string, voiceName: string|null,
 *   voiceLang: string|null, respelled: boolean}} describe
 *   Apa yang *akan* diucapkan, tanpa membunyikannya. Dipakai Area Orang Tua
 *   untuk menjawab "kenapa bunyinya salah?" dengan fakta, bukan dugaan.
 */

export const SPEECH_PORT_METHODS = [
  'speak', 'spellOut', 'stop', 'voicesFor', 'isAvailable', 'unlock', 'allVoices', 'describe',
];
