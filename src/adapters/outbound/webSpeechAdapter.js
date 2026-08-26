/**
 * ADAPTER (outbound) — SpeechPort di atas Web Speech API bawaan browser.
 * Satu-satunya berkas yang boleh menyebut window.speechSynthesis.
 *
 * Catatan Safari iOS: daftar suara datang belakangan (event `voiceschanged`)
 * dan pengucapan pertama harus dipicu oleh sentuhan pengguna.
 */

import { respellIndonesian, letterName } from '../../domain/pronunciation.js';

/** Batas aman menunggu event selesai bicara (beberapa browser tidak mengirimnya). */
const SPEECH_TIMEOUT_BASE_MS = 1200;
const SPEECH_TIMEOUT_PER_CHAR_MS = 140;

/**
 * Logat yang dipilih lebih dahulu bila perangkat punya beberapa suara untuk
 * satu bahasa. Inggris Australia dipilih atas permintaan orang tua; orang tua
 * tetap bisa menimpanya lewat pemilih suara di Area Orang Tua.
 */
const LANGUAGE_TAGS = { id: 'id-ID', en: 'en-AU' };

/** Samakan bentuk label bahasa: sebagian perangkat memakai `en_AU`. */
const normalizeLang = (voice) => (voice?.lang || '').toLowerCase().replace('_', '-');

/** True bila perangkat punya suara untuk bahasa itu. */
const speaksLanguage = (voice, language) => normalizeLang(voice).startsWith(language);

/** True bila suara memakai logat yang diutamakan, mis. en-AU untuk Inggris. */
const speaksPreferredLocale = (voice, language) => (
  normalizeLang(voice) === LANGUAGE_TAGS[language].toLowerCase()
);

/**
 * @param {{getSettings: () => object}} dependencies akses pengaturan suara terkini
 * @returns {import('../../ports/SpeechPort.js').SpeechPort}
 */
export function createWebSpeechAdapter({ getSettings }) {
  const synthesis = globalThis.speechSynthesis || null;
  let voices = [];

  function refreshVoices() {
    if (!synthesis) return;
    voices = synthesis.getVoices() || [];
  }

  if (synthesis) {
    refreshVoices();
    synthesis.addEventListener?.('voiceschanged', refreshVoices);
  }

  /**
   * Pilih suara: pilihan orang tua dahulu, lalu logat yang diutamakan
   * (mis. en-AU), lalu suara terpasang lokal, lalu apa adanya.
   */
  function selectVoice(language) {
    if (!voices.length) refreshVoices();
    const settings = getSettings();
    const preferredId = language === 'id' ? settings.indonesianVoiceId : settings.englishVoiceId;
    const chosen = voices.find(
      (voice) => voice.voiceURI === preferredId || voice.name === preferredId,
    );
    if (chosen) return chosen;

    const matching = voices.filter((voice) => speaksLanguage(voice, language));
    const sameLocale = matching.filter((voice) => speaksPreferredLocale(voice, language));
    const pool = sameLocale.length ? sameLocale : matching;
    return pool.find((voice) => voice.localService) || pool[0] || null;
  }

  /**
   * Tentukan teks dan suara yang benar-benar dipakai.
   *
   * Bila perangkat tidak punya suara Bahasa Indonesia, mesin suara asing akan
   * membaca teks Indonesia dengan aturan ejaannya sendiri — "be" jadi "bi",
   * "ca" jadi "ka", "kucing" jadi "kyoo-sing". Dalam keadaan itu teks dieja
   * ulang (lihat domain/pronunciation.js) dan sengaja diucapkan dengan suara
   * Inggris, karena ejaan ulang itu memang disusun untuk dibaca aturan Inggris.
   *
   * Ini penyangga sementara; memasang suara Bahasa Indonesia di perangkat
   * tetap merupakan perbaikan yang sesungguhnya.
   */
  function resolveUtteranceSource(text, language) {
    const preferred = selectVoice(language);
    if (language !== 'id' || preferred) {
      return { text, voice: preferred, lang: preferred?.lang || LANGUAGE_TAGS[language] };
    }
    const englishVoice = selectVoice('en');
    return {
      text: respellIndonesian(text),
      voice: englishVoice,
      lang: englishVoice?.lang || LANGUAGE_TAGS.en,
    };
  }

  /** Susun objek ucapan lengkap dengan suara, bahasa, dan kecepatannya. */
  function buildUtterance(text, language, overrides) {
    const settings = getSettings();
    const source = resolveUtteranceSource(text, language);
    const utterance = new SpeechSynthesisUtterance(source.text);
    if (source.voice) utterance.voice = source.voice;
    utterance.lang = source.lang || LANGUAGE_TAGS.id;
    utterance.rate = overrides.rate ?? settings.speechRate ?? 0.85;
    utterance.pitch = overrides.pitch ?? 1.1;
    return utterance;
  }

  function speakOnce(text, language, overrides = {}) {
    return new Promise((resolve) => {
      if (!synthesis || !getSettings().speech || !text) {
        resolve();
        return;
      }
      try {
        synthesis.cancel();
        const utterance = buildUtterance(text, language, overrides);
        let timer = null;
        const finish = () => {
          if (timer === null) return;
          clearTimeout(timer);
          timer = null;
          resolve();
        };
        utterance.onend = finish;
        utterance.onerror = finish;
        // Jaring pengaman: sebagian browser tidak pernah mengirim `onend`.
        timer = setTimeout(finish, SPEECH_TIMEOUT_BASE_MS + text.length * SPEECH_TIMEOUT_PER_CHAR_MS);
        synthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  return {
    speak: speakOnce,

    async spellOut(text, language) {
      for (const character of text.replace(/\s+/g, '')) {
        // Huruf Indonesia disebut dengan nama abjadnya — "b" adalah "be",
        // bukan "bee". Tanpa ini, mengeja bola terdengar "bee-oh-el-ay".
        const spoken = language === 'id' ? letterName(character) : character;
        // sengaja berurutan: huruf harus terdengar satu per satu
        await speakOnce(spoken, language, { rate: 0.7 });
      }
    },

    stop() {
      try {
        synthesis?.cancel();
      } catch {
        /* tidak apa-apa bila browser menolak */
      }
    },

    voicesFor(language) {
      if (!voices.length) refreshVoices();
      return voices
        .filter((voice) => speaksLanguage(voice, language))
        .map((voice) => ({ id: voice.voiceURI || voice.name, label: `${voice.name} (${voice.lang})` }));
    },

    isAvailable(language) {
      return Boolean(selectVoice(language));
    },

    unlock() {
      if (!synthesis) return;
      try {
        const primer = new SpeechSynthesisUtterance(' ');
        primer.volume = 0;
        synthesis.speak(primer);
      } catch {
        /* abaikan: hanya pemanasan */
      }
      refreshVoices();
    },
  };
}
