/**
 * ENTITAS DOMAIN — misi harian.
 *
 * Tiga misi diundi setiap hari memakai tanggal sebagai benih (seed), sehingga
 * misi hari itu tetap sama walau aplikasi ditutup-buka. Keacakan diambil dari
 * shared/random.js (murni), bukan Math.random(), supaya bisa diuji.
 */
import { indexById } from '../shared/collections.js';
import { seededRandom } from '../shared/random.js';

/** Jumlah misi yang aktif setiap hari. */
export const MISSIONS_PER_DAY = 3;
export const MISSION_TEMPLATES = [
  { id: 'm-lesson-2', emoji: '📚', title: 'Selesaikan 2 pelajaran', metric: 'lessons', target: 2, xp: 20, points: 5 },
  { id: 'm-lesson-3', emoji: '📚', title: 'Selesaikan 3 pelajaran', metric: 'lessons', target: 3, xp: 30, points: 8 },
  { id: 'm-correct-15', emoji: '✅', title: 'Jawab 15 soal dengan benar', metric: 'correct', target: 15, xp: 20, points: 5 },
  { id: 'm-correct-25', emoji: '✅', title: 'Jawab 25 soal dengan benar', metric: 'correct', target: 25, xp: 30, points: 8 },
  { id: 'm-xp-60', emoji: '✨', title: 'Kumpulkan 60 XP hari ini', metric: 'xp', target: 60, xp: 15, points: 5 },
  { id: 'm-xp-120', emoji: '✨', title: 'Kumpulkan 120 XP hari ini', metric: 'xp', target: 120, xp: 25, points: 8 },
  { id: 'm-perfect-1', emoji: '💯', title: '1 pelajaran tanpa salah', metric: 'perfect', target: 1, xp: 25, points: 8 },
  { id: 'm-id-10', emoji: '🇮🇩', title: 'Latih 10 kata Bahasa Indonesia', metric: 'idWords', target: 10, xp: 20, points: 5 },
  { id: 'm-en-10', emoji: '🇬🇧', title: 'Latih 10 kata Bahasa Inggris', metric: 'enWords', target: 10, xp: 20, points: 5 },
  { id: 'm-spell-5', emoji: '🔡', title: 'Susun 5 kata dengan benar', metric: 'spell', target: 5, xp: 20, points: 6 },
  { id: 'm-listen-8', emoji: '👂', title: 'Jawab 8 soal dengar dengan benar', metric: 'listen', target: 8, xp: 20, points: 6 },
  { id: 'm-read-5', emoji: '🗣️', title: 'Baca keras 5 kata', metric: 'read', target: 5, xp: 20, points: 6 },
];

export const MISSION_MAP = indexById(MISSION_TEMPLATES);

/**
 * Undi misi untuk satu hari. Dua misi tidak boleh memakai metrik yang sama
 * supaya tiga misi terasa berbeda.
 * @param {string} dayKey format YYYY-MM-DD
 * @returns {Array<string>} daftar id misi
 */
export function missionsForDay(dayKey) {
  const random = seededRandom(`darlene-${dayKey}`);
  const pool = [...MISSION_TEMPLATES];
  const chosen = [];
  const usedMetrics = new Set();
  while (chosen.length < MISSIONS_PER_DAY && pool.length) {
    const [candidate] = pool.splice(Math.floor(random() * pool.length), 1);
    if (usedMetrics.has(candidate.metric)) continue;
    usedMetrics.add(candidate.metric);
    chosen.push(candidate.id);
  }
  return chosen;
}

/**
 * Hitung status misi hari ini terhadap capaian harian.
 * @param {Array<string>} missionIds
 * @param {object} dailyCounters penghitung harian (lihat domain/profile.js)
 * @param {Array<string>} claimedIds misi yang hadiahnya sudah diambil
 * @returns {Array<object>} misi lengkap dengan progres
 */
export function evaluateMissions(missionIds, dailyCounters, claimedIds) {
  return missionIds.map((missionId) => {
    const template = MISSION_MAP[missionId];
    const achieved = dailyCounters[template.metric] || 0;
    return {
      ...template,
      value: Math.min(achieved, template.target),
      progress: Math.min(1, achieved / template.target),
      done: achieved >= template.target,
      claimed: claimedIds.includes(missionId),
    };
  });
}
