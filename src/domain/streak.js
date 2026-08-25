/**
 * ATURAN DOMAIN — hari beruntun (streak).
 * Bertambah sekali per hari, terputus bila melewatkan satu hari penuh.
 */
import { previousDayKey } from '../shared/calendar.js';

/**
 * @typedef {{count: number, best: number, lastDay: (string|null)}} Streak
 */

/** Streak awal untuk profil baru. */
export function emptyStreak() {
  return { count: 0, best: 0, lastDay: null };
}

/**
 * Hitung streak setelah ada aktivitas belajar pada `todayKey`.
 * @param {Streak} streak
 * @param {string} todayKey
 * @returns {{streak: Streak, increased: boolean}}
 */
export function advanceStreak(streak, todayKey) {
  if (streak.lastDay === todayKey) {
    return { streak, increased: false };
  }
  const continued = streak.lastDay === previousDayKey(todayKey);
  const count = continued ? streak.count + 1 : 1;
  return {
    streak: { count, best: Math.max(streak.best, count), lastDay: todayKey },
    increased: true,
  };
}

/**
 * Streak yang layak ditampilkan hari ini: nol bila kemarin pun tidak belajar.
 * @param {Streak} streak
 * @param {string} todayKey
 * @returns {number}
 */
export function visibleStreak(streak, todayKey) {
  if (!streak.lastDay) return 0;
  if (streak.lastDay === todayKey || streak.lastDay === previousDayKey(todayKey)) {
    return streak.count;
  }
  return 0;
}
