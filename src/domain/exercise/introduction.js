/**
 * ATURAN DOMAIN — tahap perkenalan sebelum soal.
 *
 * Anak tidak boleh ditanya kata yang belum pernah ia lihat artinya. Sebelum
 * soal dimulai, pelajaran menampilkan beberapa kartu perkenalan: gambar, kata,
 * cara membacanya, dan artinya. Kata Bahasa Inggris selalu disertai arti
 * Bahasa Indonesia, karena di situlah anak paling mudah tersesat.
 *
 * Kartu hanya muncul untuk materi yang belum dikenal atau belum kuat, sehingga
 * pelajaran ulangan tidak jadi bertele-tele.
 */
import { WORDS, LETTERS, SYLLABLE_FAMILIES, SENTENCE_MAP, STORY_MAP } from '../vocabulary.js';
import { indexById } from '../../shared/collections.js';
import { shuffle } from '../../shared/random.js';
import { letterName } from '../pronunciation.js';

/** Paling banyak sekian kartu perkenalan dalam satu pelajaran. */
export const MAX_INTRO_CARDS = 5;

/** Materi dianggap sudah dikenal bila penguasaannya mencapai angka ini. */
export const FAMILIAR_MASTERY = 2;

const LETTER_MAP = indexById(LETTERS);
const SYLLABLE_FAMILY_MAP = indexById(SYLLABLE_FAMILIES);

const INTRO_TITLE = 'Kenalan dulu yuk!';

function teachWord(word) {
  const isEnglish = word.lang === 'en';
  return {
    kind: 'teach',
    type: 'teach-word',
    title: INTRO_TITLE,
    lang: word.lang,
    wordId: word.id,
    display: {
      emoji: word.sight ? '💬' : word.emoji,
      category: word.category,
      big: word.text,
      meaning: isEnglish ? `Artinya: ${word.translation}` : `Bahasa Inggris: ${word.translation}`,
      badge: isEnglish ? '🇬🇧 Bahasa Inggris' : '🇮🇩 Bahasa Indonesia',
    },
    audio: { text: word.text, lang: word.lang },
    autoplay: true,
  };
}

function teachLetter(letter) {
  return {
    kind: 'teach',
    type: 'teach-letter',
    title: INTRO_TITLE,
    lang: 'id',
    wordId: null,
    display: {
      letter: letter.letter,
      big: `${letter.letter} ${letter.letter.toLowerCase()}`,
      meaning: `${letter.idEmoji} ${letter.idWord}  •  ${letter.enEmoji} ${letter.enWord}`,
      badge: 'Huruf',
    },
    audio: { text: letterName(letter.letter), lang: 'id' },
    autoplay: true,
  };
}

function teachSyllable(family) {
  return {
    kind: 'teach',
    type: 'teach-syllable',
    title: INTRO_TITLE,
    lang: 'id',
    wordId: null,
    display: {
      big: family.syllables.join(' · '),
      meaning: `Bunyi huruf ${family.consonant.toUpperCase()} digabung dengan a, i, u, e, o`,
      badge: 'Suku kata',
    },
    audio: { text: family.syllables.join(', '), lang: 'id' },
    autoplay: true,
  };
}

function teachSentence(sentence) {
  return {
    kind: 'teach',
    type: 'teach-sentence',
    title: INTRO_TITLE,
    lang: sentence.lang,
    wordId: null,
    display: {
      emoji: sentence.emoji,
      big: sentence.text,
      meaning: 'Dengarkan dulu, lalu tirukan.',
      badge: sentence.lang === 'en' ? '🇬🇧 Bahasa Inggris' : '🇮🇩 Bahasa Indonesia',
    },
    audio: { text: sentence.text, lang: sentence.lang },
    autoplay: true,
  };
}

function teachStory(story) {
  return {
    kind: 'teach',
    type: 'teach-story',
    title: INTRO_TITLE,
    lang: story.lang,
    wordId: null,
    display: {
      emoji: story.emoji,
      storyTitle: story.title,
      lines: story.lines,
      badge: story.lang === 'en' ? '🇬🇧 Cerita' : '🇮🇩 Cerita',
    },
    audio: { text: story.lines.join(' '), lang: story.lang },
    autoplay: true,
  };
}

const CARD_BUILDERS = {
  words: { resolve: (id) => WORDS[id], build: teachWord },
  letters: { resolve: (id) => LETTER_MAP[id], build: teachLetter },
  syllables: { resolve: (id) => SYLLABLE_FAMILY_MAP[id], build: teachSyllable },
  sentences: { resolve: (id) => SENTENCE_MAP[id], build: teachSentence },
  stories: { resolve: (id) => STORY_MAP[id], build: teachStory },
};

/** Materi berbasis kata dilewati bila anak sudah menguasainya. */
function needsIntroduction(item, wordRecords) {
  if (!item?.id?.startsWith('id-') && !item?.id?.startsWith('en-')) return true;
  return (wordRecords[item.id]?.mastery || 0) < FAMILIAR_MASTERY;
}

/**
 * Susun kartu perkenalan untuk sebuah pelajaran.
 * @param {object} params
 * @param {object} params.lesson
 * @param {Array<string>} [params.itemIds] materi pengganti (unit ulangan)
 * @param {Object<string, object>} params.wordRecords catatan penguasaan kata
 * @param {() => number} params.random
 * @returns {Array<object>} kartu perkenalan, mungkin kosong
 */
export function planIntroduction({ lesson, itemIds, wordRecords = {}, random }) {
  if (!lesson) return [];
  const kind = lesson.kind === 'mixed' ? 'words' : lesson.kind;
  const builder = CARD_BUILDERS[kind];
  if (!builder) return [];

  const sourceIds = itemIds?.length ? itemIds : lesson.items;
  const items = sourceIds
    .map(builder.resolve)
    .filter(Boolean)
    .filter((item) => needsIntroduction(item, wordRecords));

  // Kata Bahasa Inggris didahulukan: di situ anak paling butuh penjelasan arti.
  const english = items.filter((item) => item.lang === 'en');
  const rest = items.filter((item) => item.lang !== 'en');
  const ordered = [...shuffle(english, random), ...shuffle(rest, random)];

  return ordered.slice(0, MAX_INTRO_CARDS).map((item, index) => ({
    ...builder.build(item),
    id: `${lesson.id}-intro${index + 1}`,
    index,
  }));
}

/**
 * Materi yang boleh ditanyakan dalam pelajaran ini.
 *
 * Anak hanya ditanya materi yang baru saja diperkenalkan atau yang memang
 * sudah dikenalnya. Bila satu pelajaran memuat lebih banyak materi daripada
 * jumlah kartu perkenalan, sisanya ditunda ke pengulangan berikutnya —
 * lebih baik menguasai sedikit daripada ditanya sesuatu yang belum diajarkan.
 *
 * @param {object} params
 * @param {object} params.lesson
 * @param {Array<string>} [params.itemIds]
 * @param {Array<object>} params.introduction kartu hasil planIntroduction
 * @param {Object<string, object>} params.wordRecords
 * @returns {Array<string>} daftar id materi yang aman ditanyakan
 */
export function coveredItemIds({ lesson, itemIds, introduction, wordRecords = {} }) {
  const sourceIds = itemIds?.length ? itemIds : lesson.items;
  if (!introduction.length) return sourceIds;

  const introducedIds = new Set(introduction.map((card) => card.wordId).filter(Boolean));
  const introducedCount = introduction.length;

  const covered = sourceIds.filter((itemId) => {
    if (introducedIds.has(itemId)) return true;
    return (wordRecords[itemId]?.mastery || 0) >= FAMILIAR_MASTERY;
  });

  // Materi non-kata (huruf, suku kata, kalimat) tidak punya id kata pada kartu,
  // jadi cakupannya diukur dari jumlah kartu yang ditampilkan.
  if (!introducedIds.size) return sourceIds.slice(0, introducedCount);

  return covered.length ? covered : sourceIds;
}
