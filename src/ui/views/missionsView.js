/**
 * Layar "Misi" — tiga misi harian, progres, dan pengambilan hadiah.
 */
import { el, render, formatNumber } from '../dom.js';
import { showToast, burstConfetti } from '../components/effects.js';
import { formatDayLabel } from '../../shared/calendar.js';

function missionCard(mission, { onClaim }) {
  const percent = Math.round(mission.progress * 100);
  return el('div', { class: `mission${mission.claimed ? ' mission--claimed' : ''}` }, [
    el('span', { class: 'mission__emoji', text: mission.claimed ? '✅' : mission.emoji }),
    el('div', { class: 'mission__body' }, [
      el('div', { class: 'mission__title', text: mission.title }),
      el('div', { class: 'mission__track' }, [
        el('div', { class: 'mission__fill', style: { width: `${percent}%` } }),
      ]),
      el('div', {
        class: 'mission__meta',
        text: `${mission.value}/${mission.target} • hadiah +${mission.xp} XP & +${mission.points} 💎`,
      }),
    ]),
    mission.done && !mission.claimed
      ? el('button', {
        class: 'btn btn--success btn--small',
        type: 'button',
        on: { click: () => onClaim(mission) },
      }, [el('span', { text: 'Ambil 🎁' })])
      : null,
  ]);
}

/**
 * @param {HTMLElement} host
 * @param {object} context
 */
export function renderMissionsView(host, context) {
  const { missionService, profileService, sound, confettiCanvas, toastHost, refresh } = context;
  const missions = missionService.list();
  const summary = profileService.summary();
  const profile = profileService.get();
  const doneCount = missions.filter((mission) => mission.done).length;

  function claim(mission) {
    const result = missionService.claim(mission.id);
    if (!result) return;
    sound.play('star');
    burstConfetti(confettiCanvas, 60);
    showToast(toastHost, `🎁 +${result.reward.xp} XP & +${result.reward.points} poin prestasi!`, { tone: 'gold' });
    result.unlocked.forEach((achievement) => {
      showToast(toastHost, `${achievement.emoji} ${achievement.title}`, { tone: 'gold' });
    });
    refresh();
  }

  render(
    host,
    el('div', { class: 'hero' }, [
      el('span', { class: 'hero__mascot', text: '🎯' }),
      el('div', {}, [
        el('div', { class: 'hero__title', text: `Misi Hari Ini (${doneCount}/${missions.length})` }),
        el('div', { class: 'hero__subtitle', text: formatDayLabel(profile.daily.day) }),
      ]),
    ]),

    el('div', { class: 'section-title', text: 'Misi Harian' }),
    ...missions.map((mission) => missionCard(mission, { onClaim: claim })),

    el('div', { class: 'section-title', text: 'Capaian Hari Ini' }),
    el('div', { class: 'card' }, [
      el('div', { class: 'stat-grid' }, [
        el('div', { class: 'stat-box' }, [
          el('b', { text: formatNumber(profile.daily.xp) }),
          el('span', { text: 'XP HARI INI' }),
        ]),
        el('div', { class: 'stat-box' }, [
          el('b', { text: String(profile.daily.correct) }),
          el('span', { text: 'JAWABAN BENAR' }),
        ]),
        el('div', { class: 'stat-box' }, [
          el('b', { text: String(profile.daily.lessons) }),
          el('span', { text: 'PELAJARAN' }),
        ]),
        el('div', { class: 'stat-box' }, [
          el('b', { text: `${summary.streak}🔥` }),
          el('span', { text: 'HARI BERUNTUN' }),
        ]),
      ]),
    ]),

    el('p', {
      class: 'muted center mt-18',
      style: { fontSize: '13px' },
      text: 'Misi baru muncul setiap hari. Jangan lupa ambil hadiahnya ya!',
    }),
  );
}
