/**
 * ATURAN DOMAIN — pelafalan Bahasa Indonesia untuk mesin suara asing.
 *
 * Bila perangkat tidak memiliki suara Bahasa Indonesia, mesin suara Inggris
 * akan membaca teks Indonesia memakai aturan ejaan Inggris: "be" terdengar
 * "bi", "ca" terdengar "ka", "kucing" terdengar "kyoo-sing". Untuk anak yang
 * sedang belajar membaca, itu bukan sekadar janggal — ia mengajarkan bunyi
 * yang salah.
 *
 * Berkas ini mengeja ulang teks Indonesia memakai ejaan yang, bila dibaca
 * dengan aturan Inggris, menghasilkan bunyi Indonesia yang mendekati benar.
 * Ini jalan keluar sementara: memasang suara Bahasa Indonesia di perangkat
 * tetap merupakan perbaikan yang sesungguhnya.
 */

const VOWELS = 'aiueo';

/** Gugus konsonan yang dibaca sebagai satu bunyi. */
const CONSONANT_DIGRAPHS = ['ng', 'ny', 'kh', 'sy'];

/** Diftong pada akhir suku kata. */
const DIPHTHONGS = { ai: 'eye', au: 'ow', oi: 'oy' };

/** Vokal Indonesia ditulis ulang agar dibaca benar oleh mesin suara Inggris. */
const VOWEL_RESPELLING = { a: 'ah', i: 'ee', u: 'oo', e: 'eh', o: 'oh' };

/**
 * Konsonan awal yang perlu ditulis ulang. Sisanya sudah dibaca cukup dekat.
 * "c" Indonesia berbunyi /tʃ/ (seperti "ch"), dan "g" harus selalu keras.
 */
const ONSET_RESPELLING = { c: 'ch', g: 'g', j: 'j', y: 'y' };

/** Nama huruf A–Z dalam Bahasa Indonesia. */
export const INDONESIAN_LETTER_NAMES = {
  A: 'a', B: 'be', C: 'ce', D: 'de', E: 'e', F: 'ef', G: 'ge', H: 'ha',
  I: 'i', J: 'je', K: 'ka', L: 'el', M: 'em', N: 'en', O: 'o', P: 'pe',
  Q: 'ki', R: 'er', S: 'es', T: 'te', U: 'u', V: 've', W: 'we', X: 'eks',
  Y: 'ye', Z: 'zet',
};

const isVowel = (character) => VOWELS.includes(character);

/**
 * Berapa konsonan yang menjadi awal suku kata berikutnya.
 * Gugus seperti "ng" dan "ny" tidak boleh dipecah, jadi keduanya ikut utuh.
 */
function onsetLengthBefore(letters, vowelPosition, clusterLength) {
  if (clusterLength === 0) return 0;
  const lastTwo = letters.slice(vowelPosition - 2, vowelPosition);
  if (clusterLength >= 2 && CONSONANT_DIGRAPHS.includes(lastTwo)) return 2;
  return 1;
}

/** Posisi vokal berikutnya mulai dari `from`; panjang teks bila tidak ada. */
function nextVowelPosition(letters, from) {
  let position = from;
  while (position < letters.length && !isVowel(letters[position])) position += 1;
  return position;
}

/**
 * Pecah kata Indonesia menjadi suku kata.
 *
 * Ejaan Indonesia sangat teratur, sehingga aturan sederhana sudah memadai:
 * satu konsonan di antara dua vokal ikut ke suku kata berikutnya (V-KV),
 * dua konsonan dipisah (VK-KV), gugus "ng"/"ny" tidak pernah dipecah, dan
 * diftong hanya berlaku di akhir kata — "hijau" berbunyi hi-jau, sedangkan
 * "laut" tetap la-ut.
 *
 * @param {string} word
 * @returns {Array<string>}
 */
export function syllabifyIndonesian(word) {
  const letters = String(word || '').toLowerCase();
  const syllables = [];
  let start = 0;
  let index = 0;

  while (index < letters.length) {
    if (!isVowel(letters[index])) {
      index += 1;
      continue;
    }

    const isFinalDiphthong = DIPHTHONGS[letters.slice(index, index + 2)]
      && index + 2 === letters.length;
    const nucleusEnd = index + (isFinalDiphthong ? 2 : 1);
    const nextVowel = nextVowelPosition(letters, nucleusEnd);

    if (nextVowel >= letters.length) break;

    const onsetLength = onsetLengthBefore(letters, nextVowel, nextVowel - nucleusEnd);
    const cut = nextVowel - onsetLength;
    syllables.push(letters.slice(start, cut));
    start = cut;
    index = nextVowel;
  }

  if (start < letters.length) syllables.push(letters.slice(start));
  return syllables.filter(Boolean);
}

/**
 * Tulis ulang satu suku kata Indonesia agar dibaca benar oleh suara Inggris.
 * @param {string} syllable
 * @returns {string}
 */
export function respellSyllable(syllable) {
  const letters = String(syllable || '').toLowerCase();
  const vowelAt = [...letters].findIndex(isVowel);
  if (vowelAt < 0) return letters;

  const onset = letters.slice(0, vowelAt);
  const rest = letters.slice(vowelAt);
  const diphthong = DIPHTHONGS[rest.slice(0, 2)];
  const nucleus = diphthong || VOWEL_RESPELLING[rest[0]] || rest[0];
  const coda = rest.slice(diphthong ? 2 : 1);

  const respelledOnset = ONSET_RESPELLING[onset] || onset;
  return `${respelledOnset}${nucleus}${coda}`;
}

/**
 * Tulis ulang seluruh teks Indonesia (kata atau kalimat) untuk suara asing.
 * Tanda baca dan angka dibiarkan apa adanya.
 * @param {string} text
 * @returns {string}
 */
export function respellIndonesian(text) {
  return String(text || '').replace(/[A-Za-z]+/g, (word) => (
    syllabifyIndonesian(word).map(respellSyllable).join('-')
  ));
}

/**
 * Nama huruf Indonesia, siap diucapkan.
 * @param {string} letter satu huruf A–Z
 * @param {{foreignVoice?: boolean}} [options] true bila suara Indonesia tidak ada
 * @returns {string}
 */
export function letterName(letter, { foreignVoice = false } = {}) {
  const name = INDONESIAN_LETTER_NAMES[String(letter || '').toUpperCase()];
  if (!name) return letter;
  return foreignVoice ? respellIndonesian(name) : name;
}
