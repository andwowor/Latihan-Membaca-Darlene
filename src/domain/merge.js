/**
 * ATURAN DOMAIN — penggabungan dua profil belajar.
 *
 * Dipakai saat progres dari dua perangkat bertemu. Aturannya **monotonik**:
 * capaian tidak pernah berkurang, sehingga hasil belajar di perangkat mana pun
 * tidak bisa terhapus oleh perangkat lain (lihat adr/ADR-0008).
 *
 * Fungsi ini murni dan berjalan di dua tempat: di peramban sebelum mengirim,
 * dan di dalam Worker saat menerima — satu sumber kebenaran untuk keduanya.
 */
import { HISTORY_DAYS_KEPT, PROFILE_SCHEMA_VERSION } from './profile.js';

const DAILY_METRICS = [
  'lessons', 'correct', 'wrong', 'xp', 'perfect',
  'idWords', 'enWords', 'spell', 'listen', 'read',
];

const TOTAL_METRICS = ['correct', 'wrong', 'lessonsDone', 'perfect', 'missionsDone'];

const largest = (first, second) => Math.max(first || 0, second || 0);

/** Kunci hari terbaru dari dua nilai; null aman. */
function laterDay(first, second) {
  if (!first) return second || null;
  if (!second) return first;
  return first >= second ? first : second;
}

/** Ambil penghitung terbesar untuk setiap metrik yang disebut. */
function mergeCounters(metrics, base, incoming, extra = {}) {
  const result = { ...extra };
  metrics.forEach((metric) => {
    result[metric] = largest(base?.[metric], incoming?.[metric]);
  });
  return result;
}

/** Streak: rekor terbaik selalu bertahan; hitungan mengikuti hari terakhir. */
export function mergeStreak(base, incoming) {
  const best = largest(base.best, incoming.best);
  if (base.lastDay === incoming.lastDay) {
    return { count: largest(base.count, incoming.count), best, lastDay: base.lastDay };
  }
  const newest = laterDay(base.lastDay, incoming.lastDay) === base.lastDay ? base : incoming;
  return { count: newest.count, best, lastDay: newest.lastDay };
}

const EMPTY_LESSON_RECORD = Object.freeze({
  done: false, stars: 0, attempts: 0, bestCorrect: 0, lastAt: 0,
});

/** Satu catatan pelajaran: ambil capaian terbaik dari kedua sisi. */
function bestLessonRecord(first, second) {
  const left = first || EMPTY_LESSON_RECORD;
  const right = second || EMPTY_LESSON_RECORD;
  const record = mergeCounters(['stars', 'attempts', 'bestCorrect', 'lastAt'], left, right);
  record.done = Boolean(left.done || right.done);
  record.lastAt = record.lastAt || null;
  return record;
}

/** Catatan pelajaran: bintang, percobaan, dan jawaban benar terbaik. */
export function mergeLessonRecords(base = {}, incoming = {}) {
  const merged = {};
  new Set([...Object.keys(base), ...Object.keys(incoming)]).forEach((lessonId) => {
    merged[lessonId] = bestLessonRecord(base[lessonId], incoming[lessonId]);
  });
  return merged;
}

/** Catatan kata: penguasaan dan hitungan tertinggi. */
export function mergeWordRecords(base = {}, incoming = {}) {
  const merged = {};
  new Set([...Object.keys(base), ...Object.keys(incoming)]).forEach((wordId) => {
    merged[wordId] = mergeCounters(
      ['seen', 'correct', 'wrong', 'mastery'],
      base[wordId],
      incoming[wordId],
      { lastAt: largest(base[wordId]?.lastAt, incoming[wordId]?.lastAt) || null },
    );
  });
  return merged;
}

/** Lencana: gabungan keduanya, waktu terbuka yang paling awal dipertahankan. */
export function mergeAchievements(base = {}, incoming = {}) {
  const merged = { ...base };
  Object.entries(incoming).forEach(([achievementId, unlockedAt]) => {
    const existing = merged[achievementId];
    merged[achievementId] = existing ? Math.min(existing, unlockedAt) : unlockedAt;
  });
  return merged;
}

/** Misi: hanya hari terbaru yang berlaku; klaim di hari sama digabung. */
export function mergeMissions(base, incoming) {
  if (base.day === incoming.day) {
    return {
      day: base.day,
      ids: base.ids?.length ? base.ids : incoming.ids,
      claimed: [...new Set([...(base.claimed || []), ...(incoming.claimed || [])])],
    };
  }
  return laterDay(base.day, incoming.day) === base.day ? base : incoming;
}

/**
 * Capaian harian: bila hari sama, ambil angka terbesar; bila berbeda, hari
 * terbaru yang dipakai dan hari yang lebih tua dikembalikan untuk diarsipkan
 * supaya tidak hilang.
 * @returns {{daily: object, archived: (object|null)}}
 */
export function mergeDaily(base, incoming) {
  if (base.day === incoming.day) {
    return { daily: mergeCounters(DAILY_METRICS, base, incoming, { day: base.day }), archived: null };
  }
  const baseIsNewer = laterDay(base.day, incoming.day) === base.day;
  return {
    daily: baseIsNewer ? base : incoming,
    archived: baseIsNewer ? incoming : base,
  };
}

/** Riwayat harian: disatukan per tanggal, versi dengan XP tertinggi menang. */
export function mergeHistory(base = [], incoming = [], extraEntries = []) {
  const byDay = new Map();
  [...base, ...incoming, ...extraEntries]
    .filter((entry) => entry?.day)
    .forEach((entry) => {
      const existing = byDay.get(entry.day);
      if (!existing || (entry.xp || 0) > (existing.xp || 0)) byDay.set(entry.day, entry);
    });
  return [...byDay.values()]
    .sort((first, second) => first.day.localeCompare(second.day))
    .slice(-HISTORY_DAYS_KEPT);
}

/** Nama anak diambil dari profil yang lebih banyak dipakai (XP lebih besar). */
function pickIdentity(base, incoming) {
  const source = (incoming.experiencePoints || 0) > (base.experiencePoints || 0) ? incoming : base;
  return {
    learnerName: source.learnerName || base.learnerName,
    learnerSpokenName: source.learnerSpokenName ?? base.learnerSpokenName,
  };
}

/**
 * Gabungkan dua profil.
 *
 * `base` adalah pemilik pengaturan: pengaturan suara TIDAK ikut digabung karena
 * terikat pada perangkat masing-masing (suara yang terpasang berbeda-beda).
 *
 * @param {object} base profil acuan (di klien: profil perangkat ini)
 * @param {object} incoming profil lain yang datang
 * @returns {object} profil gabungan
 */
export function mergeProfiles(base, incoming) {
  if (!incoming) return base;
  if (!base) return incoming;

  const { daily, archived } = mergeDaily(base.daily, incoming.daily);
  const archivedEntries = archived && (archived.correct > 0 || archived.lessons > 0)
    ? [archived]
    : [];

  return {
    ...base,
    ...pickIdentity(base, incoming),
    schemaVersion: PROFILE_SCHEMA_VERSION,
    createdAt: Math.min(base.createdAt || Infinity, incoming.createdAt || Infinity),
    experiencePoints: largest(base.experiencePoints, incoming.experiencePoints),
    achievementPoints: largest(base.achievementPoints, incoming.achievementPoints),
    streak: mergeStreak(base.streak, incoming.streak),
    lessons: mergeLessonRecords(base.lessons, incoming.lessons),
    words: mergeWordRecords(base.words, incoming.words),
    achievements: mergeAchievements(base.achievements, incoming.achievements),
    missions: mergeMissions(base.missions, incoming.missions),
    daily,
    history: mergeHistory(base.history, incoming.history, archivedEntries),
    totals: mergeCounters(TOTAL_METRICS, base.totals, incoming.totals),
    settings: base.settings,
  };
}
