/**
 * Layar "Kata" — daftar seluruh kata, tingkat penguasaan, dan latihan cepat.
 * Mengetuk kata akan mengucapkannya (bagus untuk menirukan bunyi).
 */
import { el, render, formatNumber } from '../dom.js';

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'id', label: '🇮🇩 Indonesia' },
  { id: 'en', label: '🇬🇧 Inggris' },
  { id: 'mastered', label: '🧠 Dikuasai' },
  { id: 'learning', label: '📌 Belum kuat' },
];

function filterWords(words, filterId) {
  if (filterId === 'id') return words.filter((word) => word.lang === 'id');
  if (filterId === 'en') return words.filter((word) => word.lang === 'en');
  if (filterId === 'mastered') return words.filter((word) => word.mastered);
  if (filterId === 'learning') return words.filter((word) => !word.mastered && word.record?.seen);
  return words;
}

function wordRow(word, { onSpeak }) {
  return el('button', {
    class: 'word-row',
    type: 'button',
    on: { click: () => onSpeak(word) },
  }, [
    el('span', { class: 'word-row__emoji', text: word.emoji }),
    el('span', {}, [
      el('div', { class: 'word-row__text', text: word.text }),
      el('div', {
        class: 'word-row__meta',
        text: `${word.lang === 'id' ? 'Indonesia' : 'Inggris'} • ${word.translation}`,
      }),
    ]),
    el('span', {
      class: 'word-row__mastery',
      title: word.masteryLabel,
      text: '●'.repeat(word.mastery) + '○'.repeat(5 - word.mastery),
    }),
  ]);
}

/**
 * @param {HTMLElement} host
 * @param {object} context
 */
export function renderWordsView(host, context) {
  const { queryService, speech, navigate, uiState } = context;
  const activeFilter = uiState.wordFilter || 'all';
  const allWords = queryService.words();
  const words = filterWords(allWords, activeFilter);
  const masteredCount = allWords.filter((word) => word.mastered).length;

  function speakWord(word) {
    speech.speak(word.text, word.lang);
  }

  render(
    host,
    el('div', { class: 'hero' }, [
      el('span', { class: 'hero__mascot', text: '📖' }),
      el('div', {}, [
        el('div', { class: 'hero__title', text: `${formatNumber(masteredCount)} dari ${allWords.length} kata dikuasai` }),
        el('div', { class: 'hero__subtitle', text: 'Ketuk kata untuk mendengar cara bacanya' }),
      ]),
    ]),

    el('div', { class: 'quick-row' }, [
      el('button', {
        class: 'btn btn--primary btn--block',
        type: 'button',
        on: { click: () => navigate('latihan') },
      }, [el('span', { text: '⚡ Latihan Cepat 8 Soal' })]),
    ]),

    el('div', { class: 'section-title', text: 'Daftar Kata' }),
    el('div', { class: 'filter-row' }, FILTERS.map((filter) => el('button', {
      class: `chip${filter.id === activeFilter ? ' chip--active' : ''}`,
      type: 'button',
      on: {
        click: () => {
          uiState.wordFilter = filter.id;
          renderWordsView(host, context);
        },
      },
    }, [el('span', { text: filter.label })]))),

    words.length
      ? el('div', { class: 'card', style: { padding: '0', overflow: 'hidden' } },
        words.map((word) => wordRow(word, { onSpeak: speakWord })))
      : el('div', { class: 'empty-state' }, [
        el('span', { class: 'empty-state__emoji', text: '🔍' }),
        el('p', { text: 'Belum ada kata di kelompok ini. Ayo belajar dulu!' }),
      ]),
  );
}
