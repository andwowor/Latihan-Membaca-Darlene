/**
 * ADAPTER (outbound) — SpeechPort di atas Web Speech API bawaan browser.
 * Satu-satunya berkas yang boleh menyebut window.speechSynthesis.
 *
 * Catatan Safari iOS: daftar suara datang belakangan (event `voiceschanged`)
 * dan pengucapan pertama harus dipicu oleh sentuhan pengguna.
 */

/** Batas aman menunggu event selesai bicara (beberapa browser tidak mengirimnya). */
const SPEECH_TIMEOUT_BASE_MS = 1200;
const SPEECH_TIMEOUT_PER_CHAR_MS = 140;

const LANGUAGE_TAGS = { id: 'id-ID', en: 'en-US' };

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

  /** Pilih suara: preferensi orang tua dahulu, lalu suara lokal, lalu apa adanya. */
  function selectVoice(language) {
    if (!voices.length) refreshVoices();
    const settings = getSettings();
    const preferredId = language === 'id' ? settings.indonesianVoiceId : settings.englishVoiceId;
    const preferred = voices.find(
      (voice) => voice.voiceURI === preferredId || voice.name === preferredId,
    );
    if (preferred) return preferred;

    const matching = voices.filter(
      (voice) => (voice.lang || '').toLowerCase().startsWith(language),
    );
    return matching.find((voice) => voice.localService) || matching[0] || null;
  }

  /** Susun objek ucapan lengkap dengan suara, bahasa, dan kecepatannya. */
  function buildUtterance(text, language, overrides) {
    const settings = getSettings();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = selectVoice(language);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || LANGUAGE_TAGS[language] || LANGUAGE_TAGS.id;
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
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        utterance.onend = finish;
        utterance.onerror = finish;
        synthesis.speak(utterance);
        // Jaring pengaman: sebagian browser tidak pernah mengirim `onend`.
        setTimeout(finish, SPEECH_TIMEOUT_BASE_MS + text.length * SPEECH_TIMEOUT_PER_CHAR_MS);
      } catch {
        resolve();
      }
    });
  }

  return {
    speak: speakOnce,

    async spellOut(text, language) {
      for (const character of text.replace(/\s+/g, '')) {
        // sengaja berurutan: huruf harus terdengar satu per satu
        await speakOnce(character, language, { rate: 0.7 });
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
        .filter((voice) => (voice.lang || '').toLowerCase().startsWith(language))
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
