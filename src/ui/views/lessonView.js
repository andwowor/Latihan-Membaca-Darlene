/**
 * Layar pelajaran — menampilkan soal, menerima jawaban, dan menutup dengan
 * layar hasil. Semua keputusan penilaian/XP dikerjakan lapisan aplikasi;
 * berkas ini hanya menggambar dan meneruskan sentuhan.
 */
import { el, render, formatNumber, starRow } from '../dom.js';
import { burstConfetti, showToast } from '../components/effects.js';

const ENCOURAGEMENTS = ['Hebat!', 'Keren!', 'Pintar!', 'Mantap!', 'Bagus sekali!', 'Wow!'];
const MAX_MISTAKES_FOR_TWO_STARS = 2;

/* ------------------------------------------------------------------ */
/* Potongan tampilan (murni: masukan -> elemen)                        */
/* ------------------------------------------------------------------ */

function lessonHeader({ position, total, mistakes, onClose }) {
  const percent = Math.round((position / total) * 100);
  const heartsLeft = 3 - Math.min(MAX_MISTAKES_FOR_TWO_STARS, mistakes);
  return el('div', { class: 'lesson-head' }, [
    el('button', {
      class: 'lesson-head__close',
      type: 'button',
      'aria-label': 'Tutup pelajaran',
      on: { click: onClose },
    }, [el('span', { text: '✕' })]),
    el('div', {
      class: 'lesson-head__track',
      role: 'progressbar',
      'aria-valuenow': percent,
      'aria-label': 'Kemajuan pelajaran',
    }, [
      el('div', { class: 'lesson-head__fill', style: { width: `${percent}%` } }),
    ]),
    el('div', {
      class: 'lesson-head__mistakes',
      text: `❤️${heartsLeft}`,
      title: 'Bintang yang masih bisa diraih',
    }),
  ]);
}

/**
 * Bagian tampilan soal yang mungkin muncul, berurutan dari atas ke bawah.
 * Tabel ini menggantikan rentetan percabangan agar fungsinya tetap sederhana.
 */
const PROMPT_PARTS = [
  ['emoji', (value) => el('div', { class: 'prompt__emoji', text: value })],
  ['letter', (value) => el('div', { class: 'prompt__letter', text: value })],
  ['sentence', (value) => el('div', { class: 'prompt__sentence', text: value })],
  ['text', (value) => el('div', { class: 'prompt__word', text: value })],
  ['big', (value, display) => el('div', {
    class: display.sentenceMode ? 'prompt__sentence' : 'prompt__word',
    text: value,
  })],
  ['hint', (value) => el('div', { class: 'prompt__hint', text: `Artinya: ${value}` })],
];

/** Bagian atas soal: gambar, huruf, kata, kalimat, atau tombol dengar. */
function promptCard(question, { onSpeak }) {
  const { display } = question;
  const speakerButton = (className, label) => el('button', {
    class: className,
    type: 'button',
    'aria-label': 'Dengarkan',
    on: { click: (event) => onSpeak(event.currentTarget) },
  }, [el('span', { text: label })]);

  const pieces = display.speaker ? [speakerButton('speaker', '🔊')] : [];
  PROMPT_PARTS.forEach(([key, build]) => {
    if (display[key]) pieces.push(build(display[key], display));
  });
  if (!display.speaker && question.audio) {
    pieces.push(speakerButton('speaker-mini', '🔊 Dengarkan'));
  }
  return el('div', { class: 'prompt' }, pieces);
}

function optionFace(option, style) {
  if (style === 'emoji') return [el('span', { text: option.emoji })];
  if (style === 'picture') {
    return [
      el('span', { text: option.emoji }),
      el('span', { class: 'option__caption', text: option.text }),
    ];
  }
  return [el('span', { text: option.text })];
}

/** Tandai opsi benar/salah setelah anak memilih. */
function markChoiceResult(body, question, chosenButton) {
  body.querySelectorAll('.option').forEach((node) => {
    const isAnswer = question.options.find(
      (option) => String(option.key) === node.dataset.key,
    )?.correct;
    node.disabled = true;
    if (isAnswer) node.classList.add('option--correct');
    else if (node === chosenButton) node.classList.add('option--wrong');
    else node.classList.add('option--dim');
  });
}

function feedbackBanner({ correct, question, isLast, onNext }) {
  const banner = el('div', {
    class: `feedback feedback--${correct ? 'correct' : 'wrong'}`,
    role: 'status',
  }, [
    el('div', { class: 'feedback__row' }, [
      el('span', { class: 'feedback__icon', text: correct ? '🎉' : '💡' }),
      el('div', {}, [
        el('div', {
          class: 'feedback__title',
          text: correct
            ? ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
            : 'Hampir benar!',
        }),
        el('div', { class: 'feedback__answer', text: `Jawabannya: ${question.reveal}` }),
      ]),
    ]),
    el('button', {
      class: `btn btn--block ${correct ? 'btn--success' : 'btn--primary'}`,
      type: 'button',
      on: {
        click: () => {
          banner.remove();
          onNext();
        },
      },
    }, [el('span', { text: isLast ? 'Selesai! 🏁' : 'Lanjut ➜' })]),
  ]);
  return banner;
}

function lockedScreen({ locked, onBack }) {
  return el('div', { class: 'empty-state' }, [
    el('span', { class: 'empty-state__emoji', text: locked ? '🔒' : '🤔' }),
    el('p', {
      text: locked
        ? 'Pelajaran ini masih terkunci. Selesaikan pelajaran sebelumnya dulu ya!'
        : 'Pelajaran ini belum bisa dibuka.',
    }),
    el('button', {
      class: 'btn btn--primary mt-12',
      type: 'button',
      on: { click: onBack },
    }, [el('span', { text: 'Kembali ke Peta' })]),
  ]);
}

/* ------------------------------------------------------------------ */
/* Tiga bentuk soal                                                    */
/* ------------------------------------------------------------------ */

function drawChoice(question, body, { onAnswer }) {
  body.append(el('div', { class: 'options' }, question.options.map((option) => el('button', {
    class: `option option--${question.optionStyle}`,
    type: 'button',
    dataset: { key: option.key },
    on: {
      click: (event) => onAnswer(option.key, {
        decorate: () => markChoiceResult(body, question, event.currentTarget),
      }),
    },
  }, optionFace(option, question.optionStyle)))));
}

function drawBuild(question, body, { onAnswer, onTap, actionHost }) {
  const placed = [];
  const tileClass = `tile${question.tileStyle === 'word' ? ' tile--word' : ''}`;
  const emptyHint = () => el('span', { class: 'slots__empty', text: 'Ketuk kepingan di bawah ➜' });

  const slots = el('div', { class: 'slots' }, [emptyHint()]);
  const tray = el('div', { class: 'tiles' });
  const checkButton = el('button', {
    class: 'btn btn--primary btn--block',
    type: 'button',
    disabled: true,
    on: {
      click: () => onAnswer(placed.map((item) => item.value), {
        decorate: () => { checkButton.disabled = true; },
      }),
    },
  }, [el('span', { text: 'Periksa' })]);

  function refresh() {
    render(slots, ...(placed.length
      ? placed.map((item, index) => el('button', {
        class: `${tileClass} tile--placed`,
        type: 'button',
        on: {
          click: () => {
            placed.splice(index, 1);
            item.node.classList.remove('tile--used');
            onTap();
            refresh();
          },
        },
      }, [el('span', { text: item.value })]))
      : [emptyHint()]));
    checkButton.disabled = placed.length !== question.answer.length;
  }

  question.tiles.forEach((value) => {
    const tile = el('button', {
      class: tileClass,
      type: 'button',
      on: {
        click: (event) => {
          const node = event.currentTarget;
          if (node.classList.contains('tile--used')) return;
          node.classList.add('tile--used');
          placed.push({ value, node });
          onTap();
          refresh();
        },
      },
    }, [el('span', { text: value })]);
    tray.append(tile);
  });

  body.classList.add('question--with-action');
  body.append(slots, tray);
  actionHost.append(el('div', { class: 'action-bar' }, [checkButton]));
  refresh();
}

function drawConfirm(question, body, { onAnswer }) {
  body.append(el('div', { class: 'options', style: { gridTemplateColumns: '1fr' } }, [
    el('button', {
      class: 'btn btn--success btn--block',
      type: 'button',
      on: { click: () => onAnswer(true, {}) },
    }, [el('span', { text: question.confirmYes })]),
    el('button', {
      class: 'btn btn--ghost btn--block',
      type: 'button',
      on: { click: () => onAnswer(false, {}) },
    }, [el('span', { text: question.confirmNo })]),
  ]));
}

const QUESTION_RENDERERS = { choice: drawChoice, build: drawBuild, confirm: drawConfirm };

/* ------------------------------------------------------------------ */
/* Layar hasil                                                         */
/* ------------------------------------------------------------------ */

function resultStats(result, claimableMissions) {
  const cells = [
    [`${result.correctCount}/${result.total}`, 'Jawaban Benar'],
    [`+${formatNumber(result.xpTotal)}`, 'XP Didapat'],
    [`Lv ${result.level.level}`, result.level.title],
    result.streakCount
      ? [`${result.streakCount}🔥`, 'Hari Beruntun']
      : [`${claimableMissions}🎁`, 'Hadiah Misi'],
  ];
  return el('div', { class: 'finish__grid' }, cells.map(([value, label]) => el('div', {
    class: 'finish__stat',
  }, [el('b', { text: value }), el('span', { text: label })])));
}

function resultActions({ result, claimableMissions, navigate }) {
  const buttons = [];
  if (claimableMissions > 0) {
    buttons.push(['btn btn--block mt-12', `🎁 Ambil ${claimableMissions} hadiah misi`, () => navigate('misi')]);
  }
  if (!result.practice && result.nextLessonId) {
    buttons.push(['btn btn--primary btn--block mt-12', 'Pelajaran Berikutnya ➜', () => navigate('pelajaran', result.nextLessonId)]);
  }
  buttons.push([
    'btn btn--block mt-12',
    result.practice ? 'Kembali ke Daftar Kata' : 'Kembali ke Peta',
    () => navigate(result.practice ? 'kata' : 'belajar'),
  ]);
  return buttons.map(([className, label, handler]) => el('button', {
    class: className,
    type: 'button',
    on: { click: handler },
  }, [el('span', { text: label })]));
}

function finishScreen({ result, learnerName, claimableMissions, navigate }) {
  const stars = result.practice ? 0 : result.stars;
  return el('div', { class: 'finish' }, [
    el('div', { class: 'finish__emoji', text: result.mistakes === 0 ? '🏆' : '🎉' }),
    el('h2', {
      class: 'finish__title',
      text: result.practice ? 'Latihan Selesai!' : 'Pelajaran Selesai!',
    }),
    el('p', { class: 'muted', text: `${learnerName} makin pintar membaca!` }),
    result.practice ? null : el('div', { class: 'finish__stars' },
      [0, 1, 2].map((index) => el('span', {
        class: 'finish__star',
        style: { animationDelay: `${index * 0.22}s` },
        text: index < stars ? '⭐' : '☆',
      }))),
    resultStats(result, claimableMissions),
    ...resultActions({ result, claimableMissions, navigate }),
    result.practice ? null : el('p', {
      class: 'muted center mt-18',
      style: { fontSize: '13px' },
      text: `Bintang pelajaran ini: ${starRow(stars)}`,
    }),
  ].filter(Boolean));
}

/* ------------------------------------------------------------------ */
/* View utama                                                          */
/* ------------------------------------------------------------------ */

/**
 * @param {HTMLElement} host
 * @param {object} context layanan aplikasi + navigasi + elemen efek
 * @param {{lessonId?: string, practice?: boolean}} options
 */
export function renderLessonView(host, context, options) {
  const {
    lessonSessions, speech, sound, navigate, confettiCanvas, toastHost, profileService,
    queryService,
  } = context;

  // Pelajaran terkunci tidak boleh dibuka walau alamatnya diketik langsung.
  const locked = !options.practice && !queryService.isLessonUnlocked(options.lessonId);
  const session = locked ? null : (options.practice
    ? lessonSessions.startReviewPractice()
    : lessonSessions.startLesson(options.lessonId));

  if (!session) {
    render(host, lockedScreen({ locked, onBack: () => navigate('belajar') }));
    return;
  }

  host.classList.add('view--lesson');

  function speakCurrent(button) {
    const question = session.current();
    if (!question?.audio) return;
    button?.classList.add('speaker--playing');
    speech.speak(question.audio.text, question.audio.lang)
      .finally(() => button?.classList.remove('speaker--playing'));
  }

  function showResult(result) {
    host.classList.remove('view--lesson');
    sound.play('finish');
    burstConfetti(confettiCanvas, result.mistakes === 0 ? 130 : 80);
    if (result.leveledUp) {
      sound.play('levelup');
      showToast(toastHost, `🚀 Naik ke Level ${result.level.level} — ${result.level.title}!`, { tone: 'gold' });
    }
    result.unlocked?.forEach((achievement) => {
      showToast(toastHost, `${achievement.emoji} ${achievement.title} • +${achievement.points} poin`, { tone: 'gold' });
    });
    render(host, finishScreen({
      result,
      learnerName: profileService.get().learnerName,
      claimableMissions: result.missions.filter((mission) => mission.done && !mission.claimed).length,
      navigate,
    }));
  }

  function goNext() {
    const step = session.next();
    if (step.finished) showResult(step.result);
    else drawQuestion();
  }

  function handleAnswer(response, { decorate }) {
    const question = session.current();
    const outcome = session.answer(response);
    if (outcome.correct === null) return;

    decorate?.();
    sound.play(outcome.correct ? 'correct' : 'wrong');
    if (question.audio && question.type !== 'translate') {
      speech.speak(question.audio.text, question.audio.lang);
    }
    outcome.unlocked.forEach((achievement) => {
      sound.play('badge');
      showToast(toastHost, `${achievement.emoji} ${achievement.title} • +${achievement.points} poin`, { tone: 'gold' });
    });

    const banner = feedbackBanner({
      correct: outcome.correct,
      question,
      isLast: session.isLast(),
      onNext: goNext,
    });
    host.append(banner);
    banner.querySelector('.btn').focus({ preventScroll: true });
  }

  function closeLesson() {
    speech.stop();
    host.classList.remove('view--lesson');
    navigate(options.practice ? 'kata' : 'belajar');
  }

  function drawQuestion() {
    const question = session.current();
    const body = el('div', { class: 'question' }, [
      el('h2', { class: 'question__title', text: question.title }),
      promptCard(question, { onSpeak: speakCurrent }),
    ]);

    render(host, lessonHeader({
      position: session.position(),
      total: session.total,
      mistakes: session.mistakes(),
      onClose: closeLesson,
    }), body);

    QUESTION_RENDERERS[question.kind](question, body, {
      onAnswer: handleAnswer,
      onTap: () => sound.play('tap'),
      actionHost: host,
    });

    if (question.autoplay && question.audio) {
      setTimeout(() => speakCurrent(host.querySelector('.speaker')), 260);
    }
  }

  drawQuestion();
}
