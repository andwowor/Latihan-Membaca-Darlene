/**
 * ATURAN DOMAIN — pembuat soal per tipe latihan.
 *
 * Setiap pembuat menerima satu materi (kata / huruf / keluarga suku kata /
 * kalimat) dan sebuah sumber acak, lalu mengembalikan objek soal yang siap
 * ditampilkan. Berkas ini tidak tahu apa-apa soal DOM, suara, atau penyimpanan.
 *
 * Bentuk soal:
 *   kind 'choice'  -> pilih satu dari empat opsi
 *   kind 'build'   -> susun kepingan (huruf / suku kata / kata) jadi urutan benar
 *   kind 'confirm' -> anak membaca sendiri lalu mengonfirmasi
 */
import {
  WORD_LIST, LETTERS, SYLLABLE_FAMILIES, PICTURE_WORDS,
} from '../vocabulary.js';
import { shuffle, pickOne } from '../../shared/random.js';
import { takeDistinctBy } from '../../shared/collections.js';

/** Jumlah opsi pada soal pilihan. */
export const OPTIONS_PER_QUESTION = 4;
const DISTRACTORS_PER_QUESTION = OPTIONS_PER_QUESTION - 1;

const SPELL_FILLER_LETTERS = 'abcdefghijklmnoprstu'.split('');
const ALL_SYLLABLES = SYLLABLE_FAMILIES.flatMap((family) => family.syllables);

/**
 * Ambil pengecoh yang labelnya belum terpakai.
 * Perlu karena kata berbeda bisa berbagi label yang sama —
 * "is" dan "am" sama-sama berarti "adalah"; apel & apple sama-sama 🍎.
 */
function distinctDistractors({ candidates, labelOf, usedLabels, count, random }) {
  return takeDistinctBy(shuffle(candidates, random), labelOf, usedLabels, count);
}

/** Pengecoh kata: dahulukan kategori yang sama supaya soal tetap menantang. */
function wordDistractors(word, count, random, labelOf = (item) => item.text) {
  const sameLanguage = PICTURE_WORDS.filter(
    (candidate) => candidate.lang === word.lang && candidate.id !== word.id,
  );
  const sameCategory = sameLanguage.filter((candidate) => candidate.category === word.category);
  const picked = distinctDistractors({
    candidates: sameCategory, labelOf, usedLabels: [labelOf(word)], count, random,
  });
  if (picked.length === count) return picked;

  const alreadyPicked = new Set(picked.map((item) => item.id));
  return picked.concat(distinctDistractors({
    candidates: sameLanguage.filter((candidate) => !alreadyPicked.has(candidate.id)),
    labelOf,
    usedLabels: [labelOf(word), ...picked.map(labelOf)],
    count: count - picked.length,
    random,
  }));
}

/** Bentuk daftar opsi acak dari materi benar + pengecoh. */
function toOptions(correctItem, distractorItems, toOption, random) {
  return shuffle([correctItem, ...distractorItems], random).map((item) => ({
    ...toOption(item),
    correct: item === correctItem,
  }));
}

/* ------------------------------------------------------------------ */
/* Soal berbasis kata                                                  */
/* ------------------------------------------------------------------ */

function buildPictureToWord(word, random) {
  return {
    type: 'pic-word',
    kind: 'choice',
    title: 'Kata apa ini?',
    lang: word.lang,
    wordId: word.id,
    display: { emoji: word.emoji, category: word.category },
    audio: null,
    optionStyle: 'text',
    options: toOptions(
      word,
      wordDistractors(word, DISTRACTORS_PER_QUESTION, random),
      (item) => ({ key: item.id, text: item.text }),
      random,
    ),
    reveal: word.text,
  };
}

function buildWordToPicture(word, random) {
  return {
    type: 'word-pic',
    kind: 'choice',
    title: 'Pilih gambar yang benar',
    lang: word.lang,
    wordId: word.id,
    display: { text: word.text, category: word.category },
    audio: { text: word.text, lang: word.lang },
    autoplay: true,
    optionStyle: 'emoji',
    options: toOptions(
      word,
      wordDistractors(word, DISTRACTORS_PER_QUESTION, random, (item) => item.emoji),
      (item) => ({ key: item.id, emoji: item.emoji }),
      random,
    ),
    reveal: word.text,
  };
}

function buildListenToWord(word, random) {
  const pool = WORD_LIST.filter((candidate) => candidate.lang === word.lang
    && candidate.id !== word.id
    && Boolean(candidate.sight) === Boolean(word.sight));
  return {
    type: 'listen-word',
    kind: 'choice',
    title: 'Dengarkan, lalu pilih katanya',
    lang: word.lang,
    wordId: word.id,
    display: { speaker: true },
    audio: { text: word.text, lang: word.lang },
    autoplay: true,
    optionStyle: 'text',
    options: toOptions(
      word,
      distinctDistractors({
        candidates: pool,
        labelOf: (item) => item.text,
        usedLabels: [word.text],
        count: DISTRACTORS_PER_QUESTION,
        random,
      }),
      (item) => ({ key: item.id, text: item.text }),
      random,
    ),
    reveal: word.text,
  };
}

function buildSpelling(word, random) {
  const letters = word.text.replace(/[^a-z]/gi, '').toLowerCase().split('');
  const fillerCount = letters.length <= 4 ? 2 : 1;
  const fillers = shuffle(
    SPELL_FILLER_LETTERS.filter((letter) => !letters.includes(letter)),
    random,
  ).slice(0, fillerCount);
  return {
    type: 'spell',
    kind: 'build',
    title: 'Susun huruf jadi kata',
    lang: word.lang,
    wordId: word.id,
    display: {
      emoji: word.sight ? null : word.emoji,
      hint: word.sight ? word.translation : null,
      category: word.category,
    },
    audio: { text: word.text, lang: word.lang },
    autoplay: true,
    tiles: shuffle([...letters, ...fillers], random),
    answer: letters,
    tileStyle: 'letter',
    reveal: word.text,
  };
}

function buildReadAloud(word) {
  return {
    type: 'read-aloud',
    kind: 'confirm',
    title: 'Baca keras-keras!',
    lang: word.lang,
    wordId: word.id,
    display: { emoji: word.sight ? '🗣️' : word.emoji, big: word.text, category: word.category },
    audio: { text: word.text, lang: word.lang },
    autoplay: false,
    confirmYes: 'Sudah aku baca! ⭐',
    confirmNo: 'Bantu aku 🔊',
    reveal: word.text,
  };
}

function buildTranslate(word, random) {
  const pool = WORD_LIST.filter((candidate) => candidate.lang === word.lang
    && candidate.id !== word.id);
  const sameCategory = pool.filter((candidate) => candidate.category === word.category);
  const labelOf = (item) => item.translation;
  const picked = distinctDistractors({
    candidates: sameCategory,
    labelOf,
    usedLabels: [word.translation],
    count: DISTRACTORS_PER_QUESTION,
    random,
  });
  if (picked.length < DISTRACTORS_PER_QUESTION) {
    const chosen = new Set(picked.map((item) => item.id));
    picked.push(...distinctDistractors({
      candidates: pool.filter((candidate) => !chosen.has(candidate.id)),
      labelOf,
      usedLabels: [word.translation, ...picked.map(labelOf)],
      count: DISTRACTORS_PER_QUESTION - picked.length,
      random,
    }));
  }
  const askedLanguage = word.lang === 'id' ? 'Bahasa Inggris' : 'Bahasa Indonesia';
  return {
    type: 'translate',
    kind: 'choice',
    title: `Apa ${askedLanguage}-nya?`,
    lang: word.lang,
    wordId: word.id,
    display: { text: word.text, emoji: word.sight ? null : word.emoji, category: word.category },
    audio: { text: word.text, lang: word.lang },
    optionStyle: 'text',
    options: toOptions(word, picked, (item) => ({ key: item.id, text: item.translation }), random),
    reveal: word.translation,
  };
}

/* ------------------------------------------------------------------ */
/* Soal berbasis huruf                                                 */
/* ------------------------------------------------------------------ */

function letterDistractors(letter, random) {
  return shuffle(
    LETTERS.filter((candidate) => candidate.id !== letter.id),
    random,
  ).slice(0, DISTRACTORS_PER_QUESTION);
}

const asLetterOption = (item) => ({ key: item.id, text: item.letter });

function buildLetterSound(letter, random) {
  return {
    type: 'letter-sound',
    kind: 'choice',
    title: 'Dengarkan bunyinya, pilih hurufnya',
    lang: 'id',
    wordId: null,
    display: { speaker: true },
    audio: { text: letter.letter, lang: 'id' },
    autoplay: true,
    optionStyle: 'letter',
    options: toOptions(letter, letterDistractors(letter, random), asLetterOption, random),
    reveal: letter.letter,
  };
}

function buildLetterFind(letter, random) {
  const useEnglish = random() < 0.5;
  return {
    type: 'letter-find',
    kind: 'choice',
    title: 'Huruf awalnya apa?',
    lang: useEnglish ? 'en' : 'id',
    wordId: null,
    display: {
      emoji: useEnglish ? letter.enEmoji : letter.idEmoji,
      text: useEnglish ? letter.enWord : letter.idWord,
    },
    audio: { text: useEnglish ? letter.enWord : letter.idWord, lang: useEnglish ? 'en' : 'id' },
    autoplay: true,
    optionStyle: 'letter',
    options: toOptions(letter, letterDistractors(letter, random), asLetterOption, random),
    reveal: letter.letter,
  };
}

function buildLetterToWord(letter, random) {
  const useEnglish = random() < 0.5;
  const faceOf = (item) => (useEnglish
    ? { key: item.id, emoji: item.enEmoji, text: item.enWord }
    : { key: item.id, emoji: item.idEmoji, text: item.idWord });
  return {
    type: 'letter-word',
    kind: 'choice',
    title: `Mana yang diawali huruf ${letter.letter}?`,
    lang: useEnglish ? 'en' : 'id',
    wordId: null,
    display: { letter: letter.letter },
    audio: { text: letter.letter, lang: 'id' },
    optionStyle: 'picture',
    options: toOptions(letter, letterDistractors(letter, random), faceOf, random),
    reveal: useEnglish ? letter.enWord : letter.idWord,
  };
}

/* ------------------------------------------------------------------ */
/* Soal berbasis suku kata                                             */
/* ------------------------------------------------------------------ */

function buildSyllableListen(family, random) {
  const target = pickOne(family.syllables, random);
  const sameFamily = shuffle(
    family.syllables.filter((syllable) => syllable !== target),
    random,
  ).slice(0, 2);
  const outsider = shuffle(
    ALL_SYLLABLES.filter((syllable) => syllable !== target && !sameFamily.includes(syllable)),
    random,
  ).slice(0, DISTRACTORS_PER_QUESTION - sameFamily.length);
  return {
    type: 'syl-listen',
    kind: 'choice',
    title: 'Dengarkan suku katanya',
    lang: 'id',
    wordId: null,
    display: { speaker: true },
    audio: { text: target, lang: 'id' },
    autoplay: true,
    optionStyle: 'letter',
    options: toOptions(
      target, [...sameFamily, ...outsider], (item) => ({ key: item, text: item }), random,
    ),
    reveal: target,
  };
}

function buildSyllableWord(family, random) {
  const startsWithFamily = WORD_LIST.filter((word) => word.lang === 'id'
    && word.syllables?.length >= 2
    && word.text.startsWith(family.consonant));
  const fallback = WORD_LIST.filter((word) => word.lang === 'id' && word.syllables?.length === 2);
  const word = pickOne(startsWithFamily.length ? startsWithFamily : fallback, random);
  const fillers = shuffle(
    ALL_SYLLABLES.filter((syllable) => !word.syllables.includes(syllable)),
    random,
  ).slice(0, 2);
  return {
    type: 'syl-build',
    kind: 'build',
    title: 'Susun suku kata jadi kata',
    lang: 'id',
    wordId: word.id,
    display: { emoji: word.emoji, category: word.category },
    audio: { text: word.text, lang: 'id' },
    autoplay: true,
    tiles: shuffle([...word.syllables, ...fillers], random),
    answer: word.syllables,
    tileStyle: 'syllable',
    reveal: word.text,
  };
}

/* ------------------------------------------------------------------ */
/* Soal berbasis kalimat                                               */
/* ------------------------------------------------------------------ */

function buildSentencePicture(sentence, random) {
  const distractors = distinctDistractors({
    candidates: PICTURE_WORDS,
    labelOf: (item) => item.emoji,
    usedLabels: [sentence.emoji],
    count: DISTRACTORS_PER_QUESTION,
    random,
  });
  return {
    type: 'sentence-pic',
    kind: 'choice',
    title: 'Baca kalimatnya, pilih gambarnya',
    lang: sentence.lang,
    wordId: null,
    display: { sentence: sentence.text },
    audio: { text: sentence.text, lang: sentence.lang },
    optionStyle: 'emoji',
    options: toOptions(
      sentence, distractors, (item) => ({ key: item.id, emoji: item.emoji }), random,
    ),
    reveal: sentence.text,
  };
}

function buildSentenceOrder(sentence, random) {
  const words = sentence.text.replace(/\.$/, '').split(' ');
  return {
    type: 'sentence-build',
    kind: 'build',
    title: 'Susun jadi kalimat yang benar',
    lang: sentence.lang,
    wordId: null,
    display: { emoji: sentence.emoji },
    audio: { text: sentence.text, lang: sentence.lang },
    autoplay: true,
    tiles: shuffle(words, random),
    answer: words,
    tileStyle: 'word',
    reveal: sentence.text,
  };
}

function buildSentenceRead(sentence) {
  return {
    type: 'sentence-read',
    kind: 'confirm',
    title: 'Baca kalimat ini keras-keras!',
    lang: sentence.lang,
    wordId: null,
    display: { emoji: sentence.emoji, big: sentence.text, sentenceMode: true },
    audio: { text: sentence.text, lang: sentence.lang },
    autoplay: false,
    confirmYes: 'Sudah aku baca! ⭐',
    confirmNo: 'Bantu aku 🔊',
    reveal: sentence.text,
  };
}

/** Peta tipe latihan -> pembuat soal. */
export const QUESTION_BUILDERS = {
  'pic-word': buildPictureToWord,
  'word-pic': buildWordToPicture,
  'listen-word': buildListenToWord,
  spell: buildSpelling,
  'read-aloud': buildReadAloud,
  translate: buildTranslate,
  'letter-sound': buildLetterSound,
  'letter-find': buildLetterFind,
  'letter-word': buildLetterToWord,
  'syl-listen': buildSyllableListen,
  'syl-build': buildSyllableWord,
  'sentence-pic': buildSentencePicture,
  'sentence-build': buildSentenceOrder,
  'sentence-read': buildSentenceRead,
};
