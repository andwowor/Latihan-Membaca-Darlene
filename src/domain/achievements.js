/**
 * ENTITAS DOMAIN — katalog achievement (lencana + poin prestasi).
 *
 * Setiap achievement adalah aturan murni: fungsi `check(statistik)` yang
 * dievaluasi ulang setiap kali progres berubah. Tidak ada penyimpanan,
 * tidak ada UI, tidak ada dependensi luar di berkas ini.
 */

import { indexById } from '../shared/collections.js';

export const ACHIEVEMENTS = [
  // --- Langkah pertama ---
  { id: 'first-lesson', title: 'Langkah Pertama', desc: 'Selesaikan 1 pelajaran', emoji: '🎉', points: 10, tier: 'bronze', check: (s) => s.lessonsDone >= 1 },
  { id: 'lesson-5', title: 'Rajin Belajar', desc: 'Selesaikan 5 pelajaran', emoji: '📗', points: 20, tier: 'bronze', check: (s) => s.lessonsDone >= 5 },
  { id: 'lesson-15', title: 'Kutu Buku', desc: 'Selesaikan 15 pelajaran', emoji: '📘', points: 40, tier: 'silver', check: (s) => s.lessonsDone >= 15 },
  { id: 'lesson-30', title: 'Pembaca Tangguh', desc: 'Selesaikan 30 pelajaran', emoji: '📙', points: 70, tier: 'gold', check: (s) => s.lessonsDone >= 30 },
  { id: 'lesson-all', title: 'Tamat Semua Peta', desc: 'Selesaikan semua pelajaran', emoji: '🗺️', points: 150, tier: 'gold', check: (s) => s.lessonsDone >= s.totalLessons },
  { id: 'story-reader', title: 'Pembaca Cerita', desc: 'Selesaikan pelajaran cerita pertamamu', emoji: '📚', points: 30, tier: 'silver', check: (s) => s.readingGoal.storiesDone >= 1 },
  { id: 'goal-reader', title: 'Juara Membaca', desc: 'Lulus Ujian Membaca Indonesia & Inggris', emoji: '🎓', points: 200, tier: 'gold', check: (s) => s.readingGoal.done },

  // --- XP & level ---
  { id: 'xp-100', title: 'Kumpul 100 XP', desc: 'Kumpulkan 100 XP', emoji: '✨', points: 10, tier: 'bronze', check: (s) => s.xp >= 100 },
  { id: 'xp-500', title: 'Kumpul 500 XP', desc: 'Kumpulkan 500 XP', emoji: '💫', points: 25, tier: 'silver', check: (s) => s.xp >= 500 },
  { id: 'xp-1500', title: 'Kumpul 1500 XP', desc: 'Kumpulkan 1500 XP', emoji: '🌟', points: 60, tier: 'gold', check: (s) => s.xp >= 1500 },
  { id: 'level-5', title: 'Naik Level 5', desc: 'Capai level 5', emoji: '🚀', points: 30, tier: 'silver', check: (s) => s.level >= 5 },
  { id: 'level-10', title: 'Naik Level 10', desc: 'Capai level 10', emoji: '👑', points: 80, tier: 'gold', check: (s) => s.level >= 10 },

  // --- Beruntun (streak) ---
  { id: 'streak-3', title: 'Api Kecil', desc: 'Belajar 3 hari beruntun', emoji: '🔥', points: 20, tier: 'bronze', check: (s) => s.bestStreak >= 3 },
  { id: 'streak-7', title: 'Seminggu Penuh', desc: 'Belajar 7 hari beruntun', emoji: '🔥', points: 40, tier: 'silver', check: (s) => s.bestStreak >= 7 },
  { id: 'streak-14', title: 'Dua Minggu Hebat', desc: 'Belajar 14 hari beruntun', emoji: '🔥', points: 70, tier: 'gold', check: (s) => s.bestStreak >= 14 },
  { id: 'streak-30', title: 'Sebulan Nonstop', desc: 'Belajar 30 hari beruntun', emoji: '🏅', points: 120, tier: 'gold', check: (s) => s.bestStreak >= 30 },

  // --- Ketepatan ---
  { id: 'perfect-1', title: 'Sempurna!', desc: '1 pelajaran tanpa salah', emoji: '💯', points: 15, tier: 'bronze', check: (s) => s.perfect >= 1 },
  { id: 'perfect-5', title: 'Lima Kali Sempurna', desc: '5 pelajaran tanpa salah', emoji: '💯', points: 35, tier: 'silver', check: (s) => s.perfect >= 5 },
  { id: 'perfect-15', title: 'Raja Sempurna', desc: '15 pelajaran tanpa salah', emoji: '🎯', points: 80, tier: 'gold', check: (s) => s.perfect >= 15 },
  { id: 'correct-100', title: '100 Jawaban Benar', desc: 'Jawab benar 100 soal', emoji: '✅', points: 25, tier: 'bronze', check: (s) => s.correct >= 100 },
  { id: 'correct-500', title: '500 Jawaban Benar', desc: 'Jawab benar 500 soal', emoji: '✅', points: 60, tier: 'gold', check: (s) => s.correct >= 500 },

  // --- Penguasaan kata ---
  { id: 'words-10', title: '10 Kata Dikuasai', desc: 'Kuasai 10 kata', emoji: '🧠', points: 15, tier: 'bronze', check: (s) => s.mastered >= 10 },
  { id: 'words-40', title: '40 Kata Dikuasai', desc: 'Kuasai 40 kata', emoji: '🧠', points: 40, tier: 'silver', check: (s) => s.mastered >= 40 },
  { id: 'words-100', title: '100 Kata Dikuasai', desc: 'Kuasai 100 kata', emoji: '🧠', points: 100, tier: 'gold', check: (s) => s.mastered >= 100 },
  { id: 'bilingual', title: 'Dua Bahasa', desc: 'Kuasai 15 kata Indonesia & 15 kata Inggris', emoji: '🌏', points: 50, tier: 'silver', check: (s) => s.masteredId >= 15 && s.masteredEn >= 15 },
  { id: 'sight-master', title: 'Jago Sight Words', desc: 'Kuasai 20 sight words', emoji: '⚡', points: 45, tier: 'silver', check: (s) => s.masteredSight >= 20 },

  // --- Misi & medali ---
  { id: 'mission-3', title: 'Misi Pertama', desc: 'Selesaikan 3 misi harian', emoji: '🎯', points: 15, tier: 'bronze', check: (s) => s.missionsDone >= 3 },
  { id: 'mission-15', title: 'Pemburu Misi', desc: 'Selesaikan 15 misi harian', emoji: '🎖️', points: 40, tier: 'silver', check: (s) => s.missionsDone >= 15 },
  { id: 'mission-50', title: 'Master Misi', desc: 'Selesaikan 50 misi harian', emoji: '🏵️', points: 90, tier: 'gold', check: (s) => s.missionsDone >= 50 },
  { id: 'medal-1', title: 'Medali Pertama', desc: 'Dapatkan 1 medali unit', emoji: '🥉', points: 20, tier: 'bronze', check: (s) => s.medals >= 1 },
  { id: 'medal-5', title: 'Kotak Medali', desc: 'Dapatkan 5 medali unit', emoji: '🥈', points: 50, tier: 'silver', check: (s) => s.medals >= 5 },
  { id: 'gold-3', title: 'Tiga Emas', desc: 'Dapatkan 3 medali emas', emoji: '🥇', points: 90, tier: 'gold', check: (s) => s.goldMedals >= 3 },
];

export const ACHIEVEMENT_MAP = indexById(ACHIEVEMENTS);

/** Total poin bila seluruh achievement terkumpul. */
export const MAX_ACHIEVEMENT_POINTS = ACHIEVEMENTS
  .reduce((total, achievement) => total + achievement.points, 0);

/**
 * Cari achievement yang baru saja terpenuhi.
 * @param {object} statistics ringkasan progres (lihat domain/profile.js)
 * @param {Object<string, number>} alreadyUnlocked peta id -> waktu terbuka
 * @returns {Array<object>} achievement yang baru terbuka
 */
export function findNewlyUnlocked(statistics, alreadyUnlocked) {
  return ACHIEVEMENTS.filter((achievement) => {
    if (alreadyUnlocked[achievement.id]) return false;
    try {
      return achievement.check(statistics) === true;
    } catch {
      return false;
    }
  });
}
