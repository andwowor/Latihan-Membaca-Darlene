/**
 * Layar "Piala" — medali per unit dan lencana achievement.
 */
import { el, render, formatNumber } from '../dom.js';
import { MEDAL_LABELS } from '../../domain/medals.js';

function medalCard(group) {
  const medal = group.medal ? MEDAL_LABELS[group.medal] : null;
  return el('div', { class: `medal${medal ? '' : ' medal--empty'}` }, [
    el('div', { class: 'medal__icon', text: medal ? medal.emoji : group.unit.emoji }),
    el('div', { class: 'medal__name', text: group.unit.title }),
    el('div', {
      class: 'medal__sub',
      text: medal ? `Medali ${medal.name}` : `${group.done}/${group.total} pelajaran`,
    }),
  ]);
}

function badgeCard(achievement) {
  const locked = !achievement.unlockedAt;
  return el('div', {
    class: `badge badge--${achievement.tier}${locked ? ' badge--locked' : ''}`,
    title: achievement.desc,
  }, [
    el('div', { class: 'badge__icon', text: locked ? '🔒' : achievement.emoji }),
    el('div', { class: 'badge__name', text: achievement.title }),
    el('div', { class: 'badge__points', text: `+${achievement.points}` }),
  ]);
}

/**
 * @param {HTMLElement} host
 * @param {object} context
 */
export function renderTrophiesView(host, context) {
  const { queryService, profileService } = context;
  const summary = profileService.summary();
  const path = queryService.learningPath();
  const { items, maxPoints } = queryService.achievements();
  const unlockedCount = items.filter((item) => item.unlockedAt).length;

  render(
    host,
    el('div', { class: 'hero' }, [
      el('span', { class: 'hero__mascot', text: '🏆' }),
      el('div', {}, [
        el('div', { class: 'hero__title', text: `${formatNumber(summary.points)} Poin Prestasi` }),
        el('div', {
          class: 'hero__subtitle',
          text: `${summary.medals} medali • ${unlockedCount}/${items.length} lencana • maks ${formatNumber(maxPoints)} poin`,
        }),
      ]),
    ]),

    el('div', { class: 'section-title', text: 'Medali Unit' }),
    el('div', { class: 'medal-grid' }, path.map(medalCard)),
    el('p', {
      class: 'muted mt-12',
      style: { fontSize: '13px' },
      text: '🥉 semua pelajaran selesai • 🥈 rata-rata 2 bintang • 🥇 semua pelajaran 3 bintang',
    }),

    el('div', { class: 'section-title', text: 'Lencana Prestasi' }),
    el('div', { class: 'badge-grid' }, items.map(badgeCard)),

    el('div', { class: 'section-title', text: 'Rekor' }),
    el('div', { class: 'card' }, [
      el('div', { class: 'stat-grid' }, [
        el('div', { class: 'stat-box' }, [
          el('b', { text: `${summary.bestStreak}🔥` }),
          el('span', { text: 'BERUNTUN TERBAIK' }),
        ]),
        el('div', { class: 'stat-box' }, [
          el('b', { text: String(summary.perfect) }),
          el('span', { text: 'PELAJARAN SEMPURNA' }),
        ]),
        el('div', { class: 'stat-box' }, [
          el('b', { text: formatNumber(summary.correct) }),
          el('span', { text: 'JAWABAN BENAR' }),
        ]),
        el('div', { class: 'stat-box' }, [
          el('b', { text: String(summary.missionsDone) }),
          el('span', { text: 'MISI SELESAI' }),
        ]),
      ]),
    ]),
  );
}
