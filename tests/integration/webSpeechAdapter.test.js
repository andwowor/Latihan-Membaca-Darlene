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
const AUSTRALIAN_VOICE = { name: 'Karen', voiceURI: 'Karen', lang: 'en-AU', localService: true };

// Persis seperti yang dilaporkan perangkat Android sungguhan: label bergaya
// Java, bukan BCP 47. Inilah yang membuat "be" tetap terdengar "bi" meski
// suara Indonesia sudah terpilih dengan benar.
const ANDROID_ID = { name: 'Indonesian Indonesia', voiceURI: 'id_ID', lang: 'id_ID', localService: true };
const ANDROID_EN_AU = { name: 'English Australia', voiceURI: 'en_AU', lang: 'en_AU', localService: true };
const ANDROID_EN_US = { name: 'English United States', voiceURI: 'en_US', lang: 'en_US', localService: true };

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

/* ------------------------- logat Inggris Australia ------------------------- */

test('logat Australia dipilih lebih dahulu bila terpasang', () => withVoices(
  [ENGLISH_VOICE, AUSTRALIAN_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('cat', 'en');
    assert.deepEqual(spoken, [{ text: 'cat', voice: 'Karen', lang: 'en-AU' }]);
  },
));

test('logat Australia menang atas suara lokal berlogat lain', () => withVoices(
  [ENGLISH_VOICE, { name: 'Lee', voiceURI: 'Lee', lang: 'en-AU', localService: false }],
  async (adapter, spoken) => {
    await adapter.speak('cat', 'en');
    assert.equal(spoken[0].voice, 'Lee');
  },
));

test('label en_AU dengan garis bawah tetap dikenali', () => withVoices(
  [ENGLISH_VOICE, { name: 'Karen', voiceURI: 'Karen', lang: 'en_AU', localService: true }],
  async (adapter, spoken) => {
    assert.equal(spoken.length, 0);
    await adapter.speak('cat', 'en');
    assert.equal(spoken[0].voice, 'Karen');
  },
));

test('tanpa suara Australia, suara Inggris lain tetap dipakai', () => withVoices(
  [ENGLISH_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('cat', 'en');
    assert.deepEqual(spoken, [{ text: 'cat', voice: 'Samantha', lang: 'en-US' }]);
  },
));

test('pilihan orang tua tetap menang atas logat Australia', () => withVoices(
  [AUSTRALIAN_VOICE, ENGLISH_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('cat', 'en');
    assert.equal(spoken[0].voice, 'Samantha');
  },
  { englishVoiceId: 'Samantha' },
));

test('ejaan ulang Indonesia ikut memakai suara Australia bila itu yang ada', () => withVoices(
  [AUSTRALIAN_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('kucing', 'id');
    assert.deepEqual(spoken, [{ text: 'koo-cheeng', voice: 'Karen', lang: 'en-AU' }]);
  },
));

/* ---------------- label bahasa bergaya Java (Android) --------------------- */

test('regresi: label id_ID dipasang sebagai id-ID yang sah', () => withVoices(
  [ANDROID_ID, ANDROID_EN_US],
  async (adapter, spoken) => {
    await adapter.speak('ba, bi, bu, be, bo', 'id');
    assert.deepEqual(spoken, [{
      text: 'ba, bi, bu, be, bo',
      voice: 'Indonesian Indonesia',
      lang: 'id-ID',
    }], 'tag bergaris bawah ditolak mesin suara dan jatuh ke bahasa bawaan');
  },
));

test('suara Indonesia bergaya Java tetap dikenali, jadi teks tidak dieja ulang', () => withVoices(
  [ANDROID_ID, ANDROID_EN_US],
  async (adapter) => {
    assert.equal(adapter.isAvailable('id'), true);
    assert.equal(adapter.describe('kucing', 'id').respelled, false);
  },
));

test('logat Australia bergaya Java tetap diutamakan', () => withVoices(
  [ANDROID_EN_US, ANDROID_EN_AU],
  async (adapter, spoken) => {
    await adapter.speak('cat', 'en');
    assert.deepEqual(spoken, [{ text: 'cat', voice: 'English Australia', lang: 'en-AU' }]);
  },
));

test('varian aksara seperti zh_CN_#Hans tidak merusak tag', () => withVoices(
  [{ name: 'Chinese China', voiceURI: 'zh_CN', lang: 'zh_CN_#Hans', localService: true }, ANDROID_ID],
  async (adapter, spoken) => {
    await adapter.speak('kucing', 'id');
    assert.equal(spoken[0].lang, 'id-ID');
  },
));

/* -------------------- paksa pelafalan Indonesia --------------------------- */

test('sakelar paksa: teks dieja ulang meski suara Indonesia ada', () => withVoices(
  [ANDROID_ID, ANDROID_EN_AU],
  async (adapter, spoken) => {
    await adapter.speak('ba, bi, bu, be, bo', 'id');
    assert.deepEqual(spoken, [{
      text: 'bah, bee, boo, beh, boh',
      voice: 'English Australia',
      lang: 'en-AU',
    }]);
  },
  { forceRespellIndonesian: true },
));

test('sakelar paksa: "ca" tidak pernah lagi terdengar "ka"', () => withVoices(
  [ANDROID_ID, ANDROID_EN_AU],
  async (adapter, spoken) => {
    await adapter.speak('ca, ci, cu, ce, co', 'id');
    assert.equal(spoken[0].text, 'chah, chee, choo, cheh, choh');
  },
  { forceRespellIndonesian: true },
));

test('sakelar paksa tidak menyentuh Bahasa Inggris', () => withVoices(
  [ANDROID_ID, ANDROID_EN_AU],
  async (adapter, spoken) => {
    await adapter.speak('cat', 'en');
    assert.deepEqual(spoken, [{ text: 'cat', voice: 'English Australia', lang: 'en-AU' }]);
  },
  { forceRespellIndonesian: true },
));

test('sakelar paksa: mengeja huruf tetap memakai nama abjad Indonesia', () => withVoices(
  [ANDROID_ID, ANDROID_EN_AU],
  async (adapter, spoken) => {
    await adapter.spellOut('bola', 'id');
    assert.deepEqual(spoken.map((entry) => entry.text), ['beh', 'oh', 'ehl', 'ah']);
  },
  { forceRespellIndonesian: true },
));

test('sakelar paksa terlihat di diagnosa', () => withVoices(
  [ANDROID_ID, ANDROID_EN_AU],
  async (adapter) => {
    const hasil = adapter.describe('kucing', 'id');
    assert.equal(hasil.respelled, true);
    assert.equal(hasil.text, 'koo-cheeng');
    assert.equal(hasil.voiceName, 'English Australia');
  },
  { forceRespellIndonesian: true },
));

test('tanpa sakelar, perilaku lama tidak berubah', () => withVoices(
  [ANDROID_ID, ANDROID_EN_AU],
  async (adapter, spoken) => {
    await adapter.speak('kucing', 'id');
    assert.deepEqual(spoken, [{ text: 'kucing', voice: 'Indonesian Indonesia', lang: 'id-ID' }]);
  },
));

test('sakelar paksa tetap masuk akal di perangkat tanpa suara Inggris', () => withVoices(
  [ANDROID_ID],
  async (adapter, spoken) => {
    await adapter.speak('kucing', 'id');
    assert.equal(spoken[0].text, 'koo-cheeng');
    assert.equal(spoken[0].voice, null, 'tidak ada suara Inggris: pakai bawaan perangkat');
    assert.equal(spoken[0].lang, 'en-AU');
  },
  { forceRespellIndonesian: true },
));

/* ------------------------------- diagnosa -------------------------------- */

test('diagnosa menyebut tag bahasa yang benar-benar dipasang', () => withVoices(
  [ANDROID_ID],
  async (adapter) => {
    const hasil = adapter.describe('kucing', 'id');
    assert.equal(hasil.voiceLang, 'id_ID', 'label mentah perangkat, apa adanya');
    assert.equal(hasil.lang, 'id-ID', 'tag yang dipasang, sudah dibetulkan');
  },
));

test('diagnosa melaporkan seluruh suara perangkat apa adanya', () => withVoices(
  [INDONESIAN_VOICE, ENGLISH_VOICE, AUSTRALIAN_VOICE],
  async (adapter) => {
    assert.deepEqual(adapter.allVoices(), [
      { name: 'Damayanti', lang: 'id-ID', local: true },
      { name: 'Samantha', lang: 'en-US', local: true },
      { name: 'Karen', lang: 'en-AU', local: true },
    ]);
  },
));

test('diagnosa menyebut suara yang dipakai tanpa membunyikannya', () => withVoices(
  [INDONESIAN_VOICE, AUSTRALIAN_VOICE],
  async (adapter, spoken) => {
    assert.deepEqual(adapter.describe('ba, bi, bu, be, bo', 'id'), {
      text: 'ba, bi, bu, be, bo',
      voiceName: 'Damayanti',
      voiceLang: 'id-ID',
      lang: 'id-ID',
      respelled: false,
    });
    assert.deepEqual(spoken, [], 'diagnosa tidak boleh berbunyi');
  },
));

test('diagnosa menandai saat teks dieja ulang', () => withVoices(
  [ENGLISH_VOICE],
  async (adapter) => {
    const hasil = adapter.describe('ba, bi, bu, be, bo', 'id');
    assert.equal(hasil.respelled, true);
    assert.equal(hasil.text, 'bah, bee, boo, beh, boh');
    assert.equal(hasil.voiceName, 'Samantha');
  },
));

test('diagnosa tetap menjawab di perangkat tanpa suara sama sekali', () => withVoices(
  [],
  async (adapter) => {
    assert.deepEqual(adapter.allVoices(), []);
    const hasil = adapter.describe('kucing', 'id');
    assert.equal(hasil.voiceName, null);
    assert.equal(hasil.respelled, true);
    assert.equal(hasil.lang, 'en-AU', 'jatuh ke tag bawaan yang sah, bukan string kosong');
  },
));

test('suara dimatikan berarti tidak ada yang diucapkan', () => withVoices(
  [INDONESIAN_VOICE],
  async (adapter, spoken) => {
    await adapter.speak('meja', 'id');
    assert.deepEqual(spoken, []);
  },
  { speech: false },
));
