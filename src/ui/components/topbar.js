/**
 * Bilah atas: level, batang XP, api beruntun, dan poin prestasi.
 */
import { el, render, formatNumber } from '../dom.js';

/**
 * @param {HTMLElement} host
 * @param {{summary: object, level: object}} viewModel
 */
export function renderTopbar(host, { summary, level }) {
  const percent = Math.max(0, Math.min(100, Math.round(level.progress * 100)));

  render(
    host,
    el('div', { class: 'topbar__row' }, [
      el('span', { class: 'stat-chip stat-chip--level', title: level.title }, [
        el('span', { class: 'stat-chip__icon', text: '🏵️' }),
        el('span', { text: `Lv ${level.level}` }),
      ]),
      el('span', { class: 'stat-chip stat-chip--streak', title: 'Hari beruntun' }, [
        el('span', { class: 'stat-chip__icon', text: '🔥' }),
        el('span', { text: String(summary.streak) }),
      ]),
      el('span', { class: 'stat-chip stat-chip--points', title: 'Poin prestasi' }, [
        el('span', { class: 'stat-chip__icon', text: '💎' }),
        el('span', { text: formatNumber(summary.points) }),
      ]),
      el('span', { class: 'stat-chip', title: 'Kata dikuasai' }, [
        el('span', { class: 'stat-chip__icon', text: '🧠' }),
        el('span', { text: String(summary.mastered) }),
      ]),
    ]),
    el('div', { class: 'xpbar' }, [
      el('div', { class: 'xpbar__meta' }, [
        el('span', { text: level.title }),
        el('span', { text: `${formatNumber(level.xpInLevel)} / ${formatNumber(level.xpNeeded)} XP` }),
      ]),
      el('div', {
        class: 'xpbar__track',
        role: 'progressbar',
        'aria-valuenow': percent,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': 'Kemajuan menuju level berikutnya',
      }, [
        el('div', { class: 'xpbar__fill', style: { width: `${percent}%` } }),
      ]),
    ]),
  );
}
