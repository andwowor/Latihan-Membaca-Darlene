/**
 * Layar "Belajar" — sapaan, tombol lanjut, ringkasan misi, dan peta belajar.
 */
import { el, render, escapeHtml } from '../dom.js';
import { MEDAL_LABELS } from '../../domain/medals.js';
import { createMascot } from '../components/artwork.js';

function greeting(name, summary) {
  if (summary.lessonsDone === 0) return `Halo, ${name}! Ayo mulai petualangan membaca!`;
  if (summary.streak >= 3) return `Wah, ${summary.streak} hari beruntun! Hebat, ${name}!`;
  if (summary.streak === 0) return `Halo lagi, ${name}! Yuk lanjut baca hari ini.`;
  return `Semangat, ${name}! Lanjut belajar yuk.`;
}

function lessonNode({ entry, isCurrent, onOpen }) {
  const { lesson, record, unlocked } = entry;
  const perfect = record.stars === 3;
  const classNames = ['node'];
  if (!unlocked) classNames.push('node--locked');
  else if (perfect) classNames.push('node--gold');
  else if (record.done) classNames.push('node--done');
  else classNames.push('node--current');

  const face = !unlocked ? '🔒' : record.done ? (perfect ? '👑' : '✓') : '⭐';

  return el('div', { class: 'node-wrap' }, [
    isCurrent ? el('span', { class: 'start-bubble', text: 'MULAI' }) : null,
    el('button', {
      class: classNames.join(' '),
      type: 'button',
      disabled: !unlocked,
      'aria-label': `${lesson.title}${unlocked ? '' : ' (terkunci)'}`,
      on: { click: () => unlocked && onOpen(lesson.id) },
    }, [
      el('span', { text: face }),
      record.done ? el('span', { class: 'node__stars', text: '★'.repeat(record.stars) }) : null,
    ]),
    el('span', { class: 'node__label', text: lesson.title }),
  ]);
}

function unitCard({ group, currentLessonId, onOpen }) {
  const { unit } = group;
  const medal = group.medal ? MEDAL_LABELS[group.medal] : null;

  return el('section', { class: 'unit' }, [
    el('header', { class: 'unit__header', style: { background: unit.color } }, [
      el('span', { class: 'unit__emoji', text: unit.emoji }),
      el('div', {}, [
        el('div', { class: 'unit__name', text: unit.title }),
        el('div', { class: 'unit__sub', text: unit.subtitle }),
        el('div', { class: 'unit__progress', text: `${group.done}/${group.total} pelajaran • ${group.stars}/${group.maxStars} ★` }),
      ]),
      medal ? el('span', { class: 'unit__medal', title: `Medali ${medal.name}`, text: medal.emoji }) : null,
    ]),
    el('div', { class: 'path' }, group.lessons.map((entry) => lessonNode({
      entry,
      isCurrent: entry.lesson.id === currentLessonId,
      onOpen,
    }))),
  ]);
}

/**
 * @param {HTMLElement} host
 * @param {object} context layanan aplikasi + navigasi
 */
export function renderHomeView(host, context) {
  const { queryService, profileService, missionService, navigate } = context;
  const summary = profileService.summary();
  const profile = profileService.get();
  const currentLessonId = queryService.currentLessonId();
  const currentLesson = queryService.lessonById(currentLessonId);
  const currentUnit = queryService.learningPath()
    .find((group) => group.unit.id === currentLesson?.unitId)?.unit;
  const missions = missionService.list();
  const missionsDone = missions.filter((mission) => mission.done).length;
  const claimable = missions.filter((mission) => mission.done && !mission.claimed).length;

  render(
    host,
    el('div', { class: 'hero' }, [
      createMascot({ mood: 'senang', size: 64 }),
      el('div', {}, [
        el('div', { class: 'hero__title', html: escapeHtml(greeting(profile.learnerName, summary)) }),
        el('div', {
          class: 'hero__subtitle',
          text: `${summary.lessonsDone}/${summary.totalLessons} pelajaran selesai • ${summary.mastered} kata dikuasai`,
        }),
      ]),
    ]),

    el('div', { class: 'quick-row' }, [
      el('button', {
        class: 'btn btn--primary',
        type: 'button',
        on: { click: () => navigate('pelajaran', currentLessonId) },
      }, [el('span', { text: '▶️ Lanjut Belajar' })]),
      el('button', {
        class: 'btn',
        type: 'button',
        on: { click: () => navigate('latihan') },
      }, [el('span', { text: '⚡ Latihan Cepat' })]),
    ]),

    el('button', {
      class: 'card mt-12 row row--between',
      type: 'button',
      style: { width: '100%', cursor: 'pointer', textAlign: 'left' },
      on: { click: () => navigate('misi') },
    }, [
      el('div', { class: 'row' }, [
        el('span', { style: { fontSize: '30px' }, text: '🎯' }),
        el('div', {}, [
          el('div', { style: { fontWeight: '900' }, text: 'Misi Hari Ini' }),
          el('div', {
            class: 'muted',
            style: { fontSize: '13.5px' },
            text: claimable > 0
              ? `${claimable} hadiah siap diambil!`
              : `${missionsDone} dari ${missions.length} misi selesai`,
          }),
        ]),
      ]),
      el('span', { style: { fontSize: '22px' }, text: claimable > 0 ? '🎁' : '›' }),
    ]),

    el('div', {
      class: 'section-title',
      text: `Peta Belajar • sekarang: ${currentUnit?.title || ''} — ${currentLesson?.title || ''}`,
    }),
    ...queryService.learningPath().map((group) => unitCard({
      group,
      currentLessonId,
      onOpen: (lessonId) => navigate('pelajaran', lessonId),
    })),

    el('p', {
      class: 'center muted mt-18',
      style: { fontSize: '13px' },
      text: 'Setiap pelajaran berisi 8 soal. Selesaikan untuk membuka pelajaran berikutnya.',
    }),
  );
}
