/**
 * USE CASE — mengelola profil belajar.
 *
 * Lapisan aplikasi: hanya mengorkestrasi. Aturan perhitungan ada di
 * domain/profile.js, penyimpanan ada di balik ProgressRepository.
 * Berkas ini tidak boleh tahu localStorage, DOM, atau vendor apa pun.
 */
import {
  createProfile, normalizeProfile, rollToDay, summarize, missionsOf,
  grantNewAchievements, updateSetting, renameLearner, setLearnerSpokenName,
  spokenLearnerName,
} from '../domain/profile.js';
import { describeLevel } from '../domain/leveling.js';
import { toDayKey } from '../shared/calendar.js';

/**
 * @param {{repository: import('../ports/ProgressRepository.js').ProgressRepository,
 *          clock: import('../ports/ClockPort.js').ClockPort}} dependencies
 */
export function createProfileService({ repository, clock }) {
  const listeners = new Set();
  let profile = null;

  const today = () => toDayKey(clock.now());

  function notify() {
    listeners.forEach((listener) => listener(profile));
  }

  function persist() {
    repository.save(profile);
    notify();
  }

  /** Muat profil dari penyimpanan (atau buat baru) lalu segarkan harinya. */
  function load() {
    const stored = repository.load();
    const now = clock.now();
    profile = stored
      ? normalizeProfile(stored, now)
      : createProfile({ now });
    profile = rollToDay(profile, today());
    profile = grantNewAchievements(profile, now).profile;
    persist();
    return profile;
  }

  /**
   * Terapkan satu perubahan domain lalu berikan achievement yang baru terpenuhi.
   * @param {(current: object) => object} mutate fungsi domain murni
   * @returns {{unlocked: Array<object>, leveledUp: boolean, level: object}}
   */
  function apply(mutate) {
    const levelBefore = describeLevel(profile.experiencePoints).level;
    const mutated = rollToDay(mutate(profile), today());
    const granted = grantNewAchievements(mutated, clock.now());
    profile = granted.profile;
    persist();
    const level = describeLevel(profile.experiencePoints);
    return { unlocked: granted.unlocked, leveledUp: level.level > levelBefore, level };
  }

  return {
    load,
    apply,
    get: () => profile,
    todayKey: today,
    summary: () => summarize(profile, today()),
    level: () => describeLevel(profile.experiencePoints),
    missions: () => missionsOf(profile),
    settings: () => profile.settings,

    /** Berlangganan perubahan profil; mengembalikan fungsi berhenti berlangganan. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setSetting(key, value) {
      profile = updateSetting(profile, key, value);
      persist();
    },

    setLearnerName(name) {
      profile = renameLearner(profile, name);
      persist();
    },

    /** Ejaan nama untuk mesin suara Bahasa Indonesia (mis. "Darlin"). */
    setLearnerSpokenName(spokenName) {
      profile = setLearnerSpokenName(profile, spokenName);
      persist();
    },

    /** Nama anak sebagaimana harus diucapkan pada bahasa tertentu. */
    spokenName(language) {
      return spokenLearnerName(profile, language);
    },

    /** Cadangan data untuk disimpan orang tua. */
    exportBackup() {
      return JSON.stringify(profile, null, 2);
    },

    /**
     * Pulihkan dari berkas cadangan.
     * @throws {Error} bila isi berkas tidak dikenali
     */
    importBackup(json) {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.experiencePoints !== 'number') {
        throw new Error('Berkas cadangan tidak dikenali.');
      }
      profile = rollToDay(normalizeProfile(parsed, clock.now()), today());
      persist();
    },

    reset() {
      repository.clear();
      profile = createProfile({ now: clock.now() });
      persist();
    },
  };
}
