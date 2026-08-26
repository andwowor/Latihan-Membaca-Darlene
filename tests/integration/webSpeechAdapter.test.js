/**
 * Test integrasi adapter suara: memastikan seluruh audio Bahasa Indonesia
 * benar-benar terdengar Indonesia, termasuk pada perangkat yang hanya punya
 * mesin suara Inggris.
 *
 * Latar belakang: di perangkat tanpa suara Bahasa Indonesia, "be" terdengar
 * "bi" dan "ca" terdengar "ka" karena mesin Inggris memakai aturan ejaannya
 * sendiri. Aturan ejaan ulang ada di domain (lihat unit/pronunciation.test.js);
 * berkas ini menguji bahwa aturan itu benar-benar terpasang di adapter.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebSpeechAdapter } from '../../src/adapters/outbound/webSpeechAdapter.js';
import { FALLBACK_SETTINGS } from '../../src/config/environment.js';

const INDONESIAN_VOICE = { name: 'Damayanti', voiceURI: 'Damayanti', lang: 'id-ID', localService: true };
const ENGLISH_VOICE = { name: 'Samantha', voiceURI: 'Samantha', lang: 'en-US', localService: true };

/** Mesin suara tiruan yang mencatat setiap ucapan, seperti browser sungguhan. */
function installFakeSpeech(voices) {
  const spoken = [];
  const synthesis = {
    getVoices: () => voices,
    addEventListener() {},
    cancel() {},
    speak(utterance) {
      spoken.push({ text: utterance.text, voice: utterance.voice?.name || null, lang: utterance.lang });
      utterance.onend?.();
    },
  };

  class FakeUtterance {
    constructor(text) {
      this.text = text;
      this.voice = null;
      this.lang = '';
    }
  }

  const previous = {
    speechSynthesis: Object.getOwnPropertyDescriptor(globalThis, 'speechSynthesis'),
    SpeechSynthesisUtterance: Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance'),
  };
  // defineProperty, bukan penugasan biasa: di sebagian runtime `speechSynthesis`
  // adalah getter pada prototipe sehingga penugasan gagal diam-diam.
  Object.defineProperty(globalThis, 'speechSynthesis', { value: synthesis, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true, writable: true });

  const restore = () => {
    ['speechSynthesis', 'SpeechSynthesisUtterance'].forEach((key) => {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]);
      else delete globalThis[key];
    });
  };

  return { spoken, restore };
}

/** Jalankan satu kasus dengan daftar suara tertentu, lalu bersihkan global. */
async function withVoices(voices, run, settings = {}) {
  const { spoken, restore } = installFakeSpeech(voices);
  try {
    const adapter = createWebSpeechAdapter({ getSettings: () => ({ ...FALLBACK_SETTINGS, ...settings }) });
    await run(adapter, spoken);
  } finally {
    restore();
  }
}

test('dengan suara Indonesia, teks diucapkan apa adanya', () => withVoices(
  [INDONESIAN_VOICE, ENGLISH_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('kucing', 'id');
    assert.deepEqual(spoken, [{ text: 'kucing', voice: 'Damayanti', lang: 'id-ID' }]);
  },
));

test('tanpa suara Indonesia, teks dieja ulang dan dibacakan suara Inggris', () => withVoices(
  [ENGLISH_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('kucing', 'id');
    assert.deepEqual(spoken, [{ text: 'koo-cheeng', voice: 'Samantha', lang: 'en-US' }]);
  },
));

test('regresi: ba-bi-bu-be-bo tidak berubah jadi ba-bi-bu-bi-bo', () => withVoices(
  [ENGLISH_VOICE],
  async (adapter, spoken) => {
    for (const syllable of ['ba', 'bi', 'bu', 'be', 'bo']) {
      await adapter.speak(syllable, 'id');
    }
    const bunyi = spoken.map((entry) => entry.text);
    assert.deepEqual(bunyi, ['bah', 'bee', 'boo', 'beh', 'boh']);
    assert.equal(new Set(bunyi).size, 5);
  },
));

test('regresi: ca-ci-cu-ce-co tidak berubah jadi ka-ci-cu-ce-ko', () => withVoices(
  [ENGLISH_VOICE],
  async (adapter, spoken) => {
    for (const syllable of ['ca', 'ci', 'cu', 'ce', 'co']) {
      await adapter.speak(syllable, 'id');
    }
    assert.deepEqual(spoken.map((entry) => entry.text), ['chah', 'chee', 'choo', 'cheh', 'choh']);
  },
));

test('teks Inggris tidak pernah dieja ulang dengan aturan Indonesia', () => withVoices(
  [INDONESIAN_VOICE, ENGLISH_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('cat', 'en');
    assert.deepEqual(spoken, [{ text: 'cat', voice: 'Samantha', lang: 'en-US' }]);
  },
));

test('mengeja kata Indonesia memakai nama huruf Indonesia', () => withVoices(
  [INDONESIAN_VOICE],
  async (adapter, spoken) => {
    await adapter.spellOut('bola', 'id');
    assert.deepEqual(spoken.map((entry) => entry.text), ['be', 'o', 'el', 'a']);
  },
));

test('mengeja kata Indonesia pada suara asing tetap terdengar Indonesia', () => withVoices(
  [ENGLISH_VOICE],
  async (adapter, spoken) => {
    await adapter.spellOut('bola', 'id');
    assert.deepEqual(spoken.map((entry) => entry.text), ['beh', 'oh', 'ehl', 'ah']);
    spoken.forEach((entry) => assert.equal(entry.lang, 'en-US'));
  },
));

test('mengeja kata Inggris tetap memakai huruf Inggris', () => withVoices(
  [ENGLISH_VOICE],
  async (adapter, spoken) => {
    await adapter.spellOut('cat', 'en');
    assert.deepEqual(spoken.map((entry) => entry.text), ['c', 'a', 't']);
  },
));

test('isAvailable jujur soal ketiadaan suara Indonesia', () => withVoices(
  [ENGLISH_VOICE],
  async (adapter) => {
    assert.equal(adapter.isAvailable('id'), false);
    assert.equal(adapter.isAvailable('en'), true);
    assert.deepEqual(adapter.voicesFor('id'), []);
  },
));

test('preferensi suara pilihan orang tua dipakai lebih dahulu', () => withVoices(
  [INDONESIAN_VOICE, { name: 'Andika', voiceURI: 'Andika', lang: 'id-ID', localService: false }],
  async (adapter, spoken) => {
    await adapter.speak('meja', 'id');
    assert.deepEqual(spoken, [{ text: 'meja', voice: 'Andika', lang: 'id-ID' }]);
  },
  { indonesianVoiceId: 'Andika' },
));

test('suara dimatikan berarti tidak ada yang diucapkan', () => withVoices(
  [INDONESIAN_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('meja', 'id');
    assert.deepEqual(spoken, []);
  },
  { speech: false },
));
