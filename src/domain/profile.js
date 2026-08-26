/**
 * ENTITAS DOMAIN — profil belajar seorang anak.
 *
 * Berkas ini memegang bentuk data progres beserta seluruh aturan
 * perubahannya. Semua fungsi murni: menerima profil lama, mengembalikan
 * profil baru; tidak menyimpan, tidak membaca jam, tidak menyentuh DOM.
 * Waktu selalu dikirim dari luar (ClockPort) agar bisa diuji.
 */
import { LESSONS, UNITS } from './curriculum.js';
import { describeLevel } from './leveling.js';
import { advanceStreak, emptyStreak, visibleStreak } from './streak.js';
import { isMastered, recordWordAttempt } from './mastery.js';
import { lessonCompletionXp, starsForMistakes, XP_PER_CORRECT_ANSWER } from './scoring.js';
import { evaluateUnit } from './medals.js';
import { findNewlyUnlocked } from './achievements.js';
import { evaluateMissions, missionsForDay, MISSION_MAP } from './missions.js';
import { missionMetricForExerciseType } from './exercise/grading.js';
import { WORD_LIST, WORDS } from './vocabulary.js';
import { toDayKey } from '../shared/calendar.js';

/**
 * Versi bentuk data; dinaikkan bila struktur berubah.
 * v2: sinkronisasi tidak lagi memakai kode manual (ADR-0009).
 */
export const PROFILE_SCHEMA_VERSION = 2;

/** Berapa hari riwayat harian yang disimpan. */
export const HISTORY_DAYS_KEPT = 60;

const DAILY_METRICS = [
  'lessons', 'correct', 'wrong', 'xp', 'perfect',
  'idWords', 'enWords', 'spell', 'listen', 'read',
];

function emptyDailyCounters(dayKey) {
  const counters = { day: dayKey };
  DAILY_METRICS.forEach((metric) => { counters[metric] = 0; });
  return counters;
}

function clone(profile) {
  return JSON.parse(JSON.stringify(profile));
}

/**
 * Profil baru untuk anak yang belum pernah belajar.
 * @param {{now: number, learnerName?: string}} params
 * @returns {object}
 */
export function createProfile({ now, learnerName = 'Darlene', learnerSpokenName = 'Darlin' }) {
  const today = toDayKey(now);
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    learnerName,
    learnerSpokenName,
    createdAt: now,
    experiencePoints: 0,
    achievementPoints: 0,
    streak: emptyStreak(),
    lessons: {},
    words: {},
    achievements: {},
    missions: { day: today, ids: missionsForDay(today), claimed: [] },
    daily: emptyDailyCounters(today),
    history: [],
    totals: { correct: 0, wrong: 0, lessonsDone: 0, perfect: 0, missionsDone: 0 },
    settings: {
      sound: true,
      speech: true,
      speechRate: 0.85,
      indonesianVoiceId: '',
      englishVoiceId: '',
    },
    sync: emptySyncState(),
  };
}

/**
 * Keadaan sinkronisasi bawaan: menyala, tanpa kode.
 * Sejak ADR-0009 sinkronisasi berjalan otomatis; `code` hanya tersisa untuk
 * kemungkinan pemisahan profil di kemudian hari dan biasanya kosong.
 */
export function emptySyncState() {
  return { enabled: true, code: '', lastSyncAt: null, lastStatus: null, message: '' };
}

/**
 * Rapikan profil hasil muat/impor: lengkapi bidang yang hilang agar versi
 * lama tetap bisa dibuka (Lehman 1980 — data pasti ikut berevolusi).
 * @param {object} raw
 * @param {number} now
 * @returns {object}
 */
export function normalizeProfile(raw, now) {
  const base = createProfile({ now, learnerName: raw?.learnerName || 'Darlene' });
  if (!raw || typeof raw !== 'object') return base;

  const merged = { ...base, ...raw, schemaVersion: PROFILE_SCHEMA_VERSION };
  MERGED_SECTIONS.forEach((section) => {
    merged[section] = { ...base[section], ...(raw[section] || {}) };
  });
  merged.sync = migrateSyncState(raw, base);
  PLAIN_MAP_SECTIONS.forEach((section) => {
    merged[section] = raw[section] || {};
  });
  merged.history = Array.isArray(raw.history) ? raw.history : [];
  return merged;
}

/**
 * Profil versi 1 menyimpan kode sinkron manual. Sejak versi 2 sinkronisasi
 * berjalan otomatis tanpa kode, jadi kode lama dibuang dan sinkronisasi
 * dinyalakan — progres yang tersimpan di perangkat tetap utuh dan akan
 * terkirim ke profil keluarga pada sinkronisasi berikutnya.
 */
function migrateSyncState(raw, base) {
  if ((raw.schemaVersion || 1) < 2) return base.sync;
  return { ...base.sync, ...(raw.sync || {}) };
}

/** Bagian profil yang perlu digabung dengan nilai bawaan bila tidak lengkap. */
const MERGED_SECTIONS = ['streak', 'totals', 'settings', 'daily', 'missions'];

/** Bagian profil berupa peta bebas yang cukup dipakai apa adanya. */
const PLAIN_MAP_SECTIONS = ['lessons', 'words', 'achievements'];

/**
 * Pindah ke hari baru: arsipkan capaian kemarin dan undi misi hari ini.
 * Aman dipanggil berkali-kali.
 * @param {object} profile
 * @param {string} todayKey
 * @returns {object}
 */
export function rollToDay(profile, todayKey) {
  const sameDay = profile.daily.day === todayKey;
  const sameMissionDay = profile.missions.day === todayKey;
  if (sameDay && sameMissionDay) return profile;

  const next = clone(profile);
  if (!sameDay) {
    const wasActive = next.daily.correct > 0 || next.daily.lessons > 0;
    if (wasActive) {
      next.history = [...next.history, next.daily].slice(-HISTORY_DAYS_KEPT);
    }
    next.daily = emptyDailyCounters(todayKey);
  }
  if (!sameMissionDay) {
    next.missions = { day: todayKey, ids: missionsForDay(todayKey), claimed: [] };
  }
  return next;
}

/* ------------------------------------------------------------------ */
/* Ringkasan progres                                                   */
/* ------------------------------------------------------------------ */

/**
 * Ringkasan yang dipakai dashboard sekaligus jadi masukan aturan achievement.
 * @param {object} profile
 * @param {string} [todayKey]
 * @returns {object}
 */
export function summarize(profile, todayKey = profile.daily.day) {
  const masteredWords = WORD_LIST.filter((word) => isMastered(profile.words[word.id]));
  const unitResults = UNITS.map((unit) => evaluateUnit(unit, profile.lessons));
  const earnedMedals = unitResults.filter((result) => result.medal);
  const level = describeLevel(profile.experiencePoints);

  return {
    xp: profile.experiencePoints,
    points: profile.achievementPoints,
    level: level.level,
    levelTitle: level.title,
    lessonsDone: profile.totals.lessonsDone,
    totalLessons: LESSONS.length,
    correct: profile.totals.correct,
    wrong: profile.totals.wrong,
    perfect: profile.totals.perfect,
    missionsDone: profile.totals.missionsDone,
    streak: visibleStreak(profile.streak, todayKey),
    bestStreak: profile.streak.best,
    mastered: masteredWords.length,
    masteredId: masteredWords.filter((word) => word.lang === 'id').length,
    masteredEn: masteredWords.filter((word) => word.lang === 'en').length,
    masteredSight: masteredWords.filter((word) => word.sight).length,
    medals: earnedMedals.length,
    goldMedals: earnedMedals.filter((result) => result.medal === 'gold').length,
    totalWords: WORD_LIST.length,
    accuracy: profile.totals.correct + profile.totals.wrong === 0
      ? 0
      : profile.totals.correct / (profile.totals.correct + profile.totals.wrong),
  };
}

/** Daftar misi hari ini beserta progresnya. */
export function missionsOf(profile) {
  return evaluateMissions(profile.missions.ids, profile.daily, profile.missions.claimed);
}

/* ------------------------------------------------------------------ */
/* Perubahan progres                                                   */
/* ------------------------------------------------------------------ */

function addExperience(profile, amount) {
  profile.experiencePoints += amount;
  profile.daily.xp += amount;
}

/**
 * Catat satu jawaban.
 * @param {object} profile
 * @param {{exerciseType: string, wordId: (string|null), correct: boolean, now: number}} answer
 * @returns {{profile: object, xpGained: number, masteryLevel: (number|null)}}
 */
export function registerAnswer(profile, { exerciseType, wordId, correct, now }) {
  const next = clone(profile);
  let xpGained = 0;

  if (correct) {
    next.totals.correct += 1;
    next.daily.correct += 1;
    xpGained = XP_PER_CORRECT_ANSWER;
    addExperience(next, xpGained);
    const metric = missionMetricForExerciseType(exerciseType);
    if (metric) next.daily[metric] += 1;
  } else {
    next.totals.wrong += 1;
    next.daily.wrong += 1;
  }

  const word = wordId ? WORDS[wordId] : null;
  let masteryLevel = null;
  if (word) {
    const record = recordWordAttempt(next.words[wordId], correct, now);
    next.words[wordId] = record;
    masteryLevel = record.mastery;
    if (correct) next.daily[word.lang === 'id' ? 'idWords' : 'enWords'] += 1;
  }

  return { profile: next, xpGained, masteryLevel };
}

/**
 * Catat pelajaran yang selesai.
 * @param {object} profile
 * @param {{lessonId: string, mistakes: number, correctCount: number, now: number, todayKey: string}} result
 * @returns {{profile: object, stars: number, xpGained: number, firstTime: boolean,
 *            streakIncreased: boolean, streakCount: number}}
 */
export function registerLessonCompletion(profile, {
  lessonId, mistakes, correctCount, now, todayKey,
}) {
  const next = clone(profile);
  const previous = next.lessons[lessonId];
  const firstTime = !previous?.done;
  const stars = starsForMistakes(mistakes);
  const xpGained = lessonCompletionXp({ mistakes, firstTime });

  addExperience(next, xpGained);
  next.lessons[lessonId] = {
    done: true,
    stars: Math.max(previous?.stars || 0, stars),
    attempts: (previous?.attempts || 0) + 1,
    bestCorrect: Math.max(previous?.bestCorrect || 0, correctCount),
    lastAt: now,
  };

  if (firstTime) next.totals.lessonsDone += 1;
  next.daily.lessons += 1;
  if (mistakes === 0) {
    next.totals.perfect += 1;
    next.daily.perfect += 1;
  }

  const streakResult = advanceStreak(next.streak, todayKey);
  next.streak = streakResult.streak;

  return {
    profile: next,
    stars,
    xpGained,
    firstTime,
    streakIncreased: streakResult.increased,
    streakCount: streakResult.streak.count,
  };
}

/**
 * Ambil hadiah sebuah misi yang sudah tuntas.
 * @param {object} profile
 * @param {string} missionId
 * @returns {{profile: object, reward: object}|null} null bila belum boleh diambil
 */
export function registerMissionClaim(profile, missionId) {
  const mission = missionsOf(profile).find((item) => item.id === missionId);
  if (!mission || !mission.done || mission.claimed) return null;

  const next = clone(profile);
  next.missions.claimed = [...next.missions.claimed, missionId];
  next.totals.missionsDone += 1;
  next.achievementPoints += mission.points;
  addExperience(next, mission.xp);

  return { profile: next, reward: { ...MISSION_MAP[missionId] } };
}

/**
 * Berikan achievement yang syaratnya baru terpenuhi.
 * @param {object} profile
 * @param {number} now
 * @returns {{profile: object, unlocked: Array<object>}}
 */
export function grantNewAchievements(profile, now) {
  const unlocked = findNewlyUnlocked(summarize(profile), profile.achievements);
  if (!unlocked.length) return { profile, unlocked: [] };

  const next = clone(profile);
  unlocked.forEach((achievement) => {
    next.achievements[achievement.id] = now;
    next.achievementPoints += achievement.points;
  });
  return { profile: next, unlocked };
}

/* ------------------------------------------------------------------ */
/* Sinkronisasi                                                        */
/* ------------------------------------------------------------------ */

/**
 * Nyalakan sinkronisasi. Kode hanya diisi bila profil sengaja dipisahkan;
 * pemakaian biasa tidak memakainya sama sekali (ADR-0009).
 * @param {object} profile
 * @param {string} [code]
 * @returns {object}
 */
export function enableSync(profile, code = '') {
  const next = clone(profile);
  next.sync = { ...emptySyncState(), ...next.sync, enabled: true, code };
  return next;
}

/** Matikan sinkronisasi di perangkat ini; progres lokal tidak tersentuh. */
export function disableSync(profile) {
  const next = clone(profile);
  next.sync = { ...emptySyncState(), enabled: false, code: '' };
  return next;
}

/**
 * Catat hasil percobaan sinkronisasi terakhir untuk ditampilkan ke orang tua.
 * @param {object} profile
 * @param {{at: number, ok: boolean, message?: string}} result
 */
export function recordSyncResult(profile, { at, ok, message = '' }) {
  const next = clone(profile);
  next.sync = {
    ...emptySyncState(),
    ...next.sync,
    lastSyncAt: ok ? at : next.sync?.lastSyncAt || null,
    lastStatus: ok ? 'ok' : 'error',
    message,
  };
  return next;
}

/**
 * Salinan profil yang aman dikirim ke server.
 *
 * Kode sinkron adalah kredensial, jadi tidak boleh ikut tersimpan di dalam
 * data yang dikirim — kalau ikut, isi basis data akan memuat kunci untuk
 * membuka dirinya sendiri.
 * @param {object} profile
 * @returns {object}
 */
export function withoutSyncSecret(profile) {
  const copy = clone(profile);
  delete copy.sync;
  return copy;
}

/* ------------------------------------------------------------------ */
/* Pengaturan                                                          */
/* ------------------------------------------------------------------ */

/** Ubah satu pengaturan; mengembalikan profil baru. */
export function updateSetting(profile, key, value) {
  const next = clone(profile);
  next.settings[key] = value;
  return next;
}

/** Ganti nama anak yang tampil di dashboard. */
export function renameLearner(profile, learnerName) {
  const next = clone(profile);
  next.learnerName = String(learnerName || '').trim() || 'Darlene';
  return next;
}

/**
 * Ganti ejaan nama untuk mesin suara Bahasa Indonesia.
 * Mesin suara Indonesia membaca huruf demi huruf sesuai ortografi Indonesia,
 * sehingga nama serapan asing perlu ditulis ulang sesuai bunyinya —
 * "Darlene" harus ditulis "Darlin" agar terdengar benar.
 * Dikosongkan berarti pakai nama tampilan apa adanya.
 */
export function setLearnerSpokenName(profile, spokenName) {
  const next = clone(profile);
  next.learnerSpokenName = String(spokenName || '').trim();
  return next;
}

/**
 * Nama anak sebagaimana harus diucapkan pada satu bahasa.
 * Ejaan khusus hanya berlaku untuk Bahasa Indonesia; mesin suara Bahasa
 * Inggris sudah melafalkan nama aslinya dengan benar.
 * @param {object} profile
 * @param {'id'|'en'} language
 * @returns {string}
 */
export function spokenLearnerName(profile, language) {
  if (language !== 'id') return profile.learnerName;
  return profile.learnerSpokenName?.trim() || profile.learnerName;
}
