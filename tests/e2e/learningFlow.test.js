/**
 * Test alur penuh (tanpa DOM): dari membuka aplikasi, mengerjakan pelajaran,
 * mengambil hadiah misi, sampai mencadangkan dan memulihkan data.
 * Menggunakan adapter memori + jam beku supaya hasilnya bisa diulang persis.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/config/container.js';
import { createMemoryProgressRepository } from '../../src/adapters/outbound/memoryProgressRepository.js';
import { createFixedClock } from '../../src/adapters/outbound/systemClock.js';
import { seededRandom } from '../../src/shared/random.js';
import { LESSON_ORDER } from '../../src/domain/curriculum.js';

const START = Date.parse('2026-08-25T08:00:00Z');
const NO_CAPABILITIES = {
  hasLocalStorage: false, hasSpeechSynthesis: false, hasWebAudio: false, hasServiceWorker: false,
};

function bootApp({ repository = createMemoryProgressRepository(), seed = 'e2e' } = {}) {
  const clock = createFixedClock(START);
  const container = createContainer({
    repository,
    clock,
    random: { next: seededRandom(seed) },
    capabilities: NO_CAPABILITIES,
  }).start();
  return { container, clock, repository };
}

/** Jawaban untuk sebuah soal; `shouldMiss` sengaja memilih yang salah. */
function answerFor(question, shouldMiss) {
  if (question.kind === 'choice') {
    return question.options.find((item) => (shouldMiss ? !item.correct : item.correct)).key;
  }
  if (question.kind === 'build') {
    return shouldMiss ? question.answer.slice(1) : question.answer;
  }
  return !shouldMiss;
}

/** Kerjakan satu pelajaran; `wrongAnswers` menentukan berapa soal sengaja disalahkan. */
function playLesson(container, lessonId, { wrongAnswers = 0 } = {}) {
  const session = container.lessonSessions.startLesson(lessonId);
  assert.ok(session, `pelajaran ${lessonId} gagal dimulai`);
  let mistakesMade = 0;
  let result = null;

  while (!result) {
    const question = session.current();

    // Kartu perkenalan tidak dinilai: cukup dilewati seperti anak menekan "Lanjut".
    if (question.kind === 'teach') {
      const step = session.next();
      if (step.finished) result = step.result;
      continue;
    }

    const shouldMiss = mistakesMade < wrongAnswers;
    if (shouldMiss) mistakesMade += 1;

    session.answer(answerFor(question, shouldMiss));
    const step = session.next();
    if (step.finished) result = step.result;
  }
  return result;
}

test('pelajaran sempurna memberi tiga bintang, XP, streak, dan membuka pelajaran berikutnya', () => {
  const { container } = bootApp();
  const result = playLesson(container, 'u1-l1');

  assert.equal(result.stars, 3);
  assert.equal(result.correctCount, 8);
  assert.equal(result.mistakes, 0);
  assert.equal(result.xpTotal, 8 * 10 + 20 + 15);
  assert.equal(result.streakCount, 1);
  assert.equal(result.nextLessonId, 'u1-l2');
  assert.ok(result.unlocked.some((item) => item.id === 'first-lesson'));

  assert.equal(container.queryService.isLessonUnlocked('u1-l2'), true);
  assert.equal(container.queryService.isLessonUnlocked('u1-l3'), false);
  assert.equal(container.queryService.currentLessonId(), 'u1-l2');
});

test('kesalahan mengurangi bintang tetapi pelajaran tetap selesai', () => {
  const { container } = bootApp({ seed: 'salah' });
  const result = playLesson(container, 'u1-l1', { wrongAnswers: 3 });
  assert.equal(result.mistakes, 3);
  assert.equal(result.stars, 1);
  assert.equal(container.queryService.isLessonUnlocked('u1-l2'), true);
});

test('menamatkan satu unit memberi medali emas dan tercatat di halaman piala', () => {
  const { container } = bootApp({ seed: 'medali' });
  const unitLessons = LESSON_ORDER.filter((lessonId) => lessonId.startsWith('u1-'));
  unitLessons.forEach((lessonId) => playLesson(container, lessonId));

  const [firstUnit] = container.queryService.learningPath();
  assert.equal(firstUnit.complete, true);
  assert.equal(firstUnit.medal, 'gold');
  assert.equal(container.profileService.summary().goldMedals, 1);
  assert.ok(container.queryService.achievements().items
    .find((item) => item.id === 'medal-1').unlockedAt);
});

test('progres tersimpan dan pulih setelah aplikasi ditutup lalu dibuka lagi', () => {
  const repository = createMemoryProgressRepository();
  const first = bootApp({ repository });
  playLesson(first.container, 'u1-l1');
  const before = first.container.profileService.summary();

  // "tutup lalu buka lagi": container baru dari penyimpanan yang sama
  const second = bootApp({ repository });
  const after = second.container.profileService.summary();
  assert.equal(after.xp, before.xp);
  assert.equal(after.lessonsDone, 1);
  assert.equal(second.container.queryService.currentLessonId(), 'u1-l2');
});

test('misi harian bisa dituntaskan lalu hadiahnya diambil sekali', () => {
  const { container } = bootApp({ seed: 'misi' });
  // paksa satu misi yang pasti selesai dengan dua pelajaran
  const profile = container.profileService.get();
  profile.missions.ids = ['m-lesson-2'];
  container.profileService.setSetting('sound', true); // memicu penyimpanan

  playLesson(container, 'u1-l1');
  assert.equal(container.missionService.list()[0].done, false);
  playLesson(container, 'u1-l2');

  const mission = container.missionService.list()[0];
  assert.equal(mission.done, true);
  assert.equal(mission.claimed, false);

  const pointsBefore = container.profileService.summary().points;
  const claim = container.missionService.claim('m-lesson-2');
  assert.ok(claim);
  assert.equal(container.profileService.summary().points, pointsBefore + mission.points);
  assert.equal(container.missionService.claim('m-lesson-2'), null, 'hadiah tidak bisa diambil dua kali');
});

test('hari berganti: capaian harian disetel ulang, streak berlanjut', () => {
  const repository = createMemoryProgressRepository();
  const first = bootApp({ repository, seed: 'hari' });
  playLesson(first.container, 'u1-l1');
  assert.equal(first.container.profileService.get().daily.lessons, 1);

  // buka aplikasi lagi keesokan harinya
  const clock = createFixedClock(START + 86400000);
  const nextDay = createContainer({
    repository,
    clock,
    random: { next: seededRandom('hari-2') },
    capabilities: NO_CAPABILITIES,
  }).start();

  assert.equal(nextDay.profileService.get().daily.lessons, 0);
  assert.equal(nextDay.profileService.get().history.length, 1);
  playLesson(nextDay, 'u1-l2');
  assert.equal(nextDay.profileService.summary().streak, 2);
});

test('latihan cepat menambah XP tetapi tidak membuka kunci pelajaran', () => {
  const { container } = bootApp({ seed: 'latihan' });
  playLesson(container, 'u1-l1');
  const before = container.profileService.summary();

  const session = container.lessonSessions.startReviewPractice();
  assert.ok(session);
  let result = null;
  while (!result) {
    const question = session.current();
    session.answer(question.kind === 'choice'
      ? question.options.find((option) => option.correct).key
      : question.kind === 'build' ? question.answer : true);
    const step = session.next();
    if (step.finished) result = step.result;
  }
  assert.equal(result.practice, true);
  assert.ok(container.profileService.summary().xp > before.xp);
  assert.equal(container.profileService.summary().lessonsDone, before.lessonsDone,
    'latihan bebas tidak menambah pelajaran selesai');
});

test('cadangan bisa disimpan lalu dipulihkan di perangkat lain', () => {
  const source = bootApp({ seed: 'backup' });
  playLesson(source.container, 'u1-l1');
  const backup = source.container.profileService.exportBackup();

  const target = bootApp({ repository: createMemoryProgressRepository(), seed: 'target' });
  assert.equal(target.container.profileService.summary().xp, 0);
  target.container.profileService.importBackup(backup);
  assert.equal(
    target.container.profileService.summary().xp,
    source.container.profileService.summary().xp,
  );
  assert.equal(target.container.queryService.currentLessonId(), 'u1-l2');
});

test('cadangan yang tidak dikenal ditolak dengan pesan jelas', () => {
  const { container } = bootApp();
  assert.throws(() => container.profileService.importBackup('{"apa":"ini"}'), /tidak dikenali/);
  assert.throws(() => container.profileService.importBackup('bukan json'));
});

test('reset mengembalikan aplikasi ke keadaan awal', () => {
  const { container } = bootApp({ seed: 'reset' });
  playLesson(container, 'u1-l1');
  container.profileService.reset();
  const summary = container.profileService.summary();
  assert.equal(summary.xp, 0);
  assert.equal(summary.lessonsDone, 0);
  assert.equal(container.queryService.currentLessonId(), 'u1-l1');
});

test('menamatkan seluruh peta belajar membuka achievement penamat', () => {
  const { container } = bootApp({ seed: 'tamat' });
  LESSON_ORDER.forEach((lessonId) => playLesson(container, lessonId));
  const summary = container.profileService.summary();
  assert.equal(summary.lessonsDone, LESSON_ORDER.length);
  assert.equal(summary.medals, container.queryService.learningPath().length);
  assert.ok(container.queryService.achievements().items
    .find((item) => item.id === 'lesson-all').unlockedAt);
  assert.ok(summary.mastered > 0);
});

test('pelajaran dimulai dengan perkenalan materi, bukan langsung bertanya', () => {
  const { container } = bootApp({ seed: 'kenalan' });
  const session = container.lessonSessions.startLesson('u1-l1');

  assert.equal(session.current().kind, 'teach', 'langkah pertama harus kartu perkenalan');
  assert.equal(session.questionCount, 8, 'jumlah soal tetap delapan');
  assert.ok(session.total > session.questionCount, 'ada langkah tambahan berupa perkenalan');
  assert.equal(session.isTeaching(), true);
});

test('kartu perkenalan tidak memengaruhi bintang maupun XP', () => {
  const { container } = bootApp({ seed: 'kenalan-nilai' });
  const result = playLesson(container, 'u1-l1');
  assert.equal(result.stars, 3);
  assert.equal(result.total, 8, 'yang dinilai hanya soal');
  assert.equal(result.xpTotal, 8 * 10 + 20 + 15);
});

test('kata Bahasa Inggris selalu diperkenalkan beserta artinya sebelum ditanya', () => {
  const { container } = bootApp({ seed: 'inggris' });
  // buka jalan menuju unit Bahasa Inggris
  LESSON_ORDER.slice(0, LESSON_ORDER.indexOf('u4-l1')).forEach((lessonId) => {
    playLesson(container, lessonId);
  });

  const session = container.lessonSessions.startLesson('u4-l1');
  const introduction = session.steps.filter((step) => step.kind === 'teach');
  assert.ok(introduction.length > 0, 'harus ada kartu perkenalan');

  const englishCards = introduction.filter((card) => card.lang === 'en');
  assert.ok(englishCards.length > 0);
  englishCards.forEach((card) => {
    assert.match(card.display.meaning, /^Artinya: /, 'arti Bahasa Indonesia harus ditampilkan');
    assert.ok(card.audio.text, 'kata harus bisa didengarkan');
  });

  // setiap kata yang ditanyakan sudah pernah diperkenalkan atau sudah dikuasai
  const introducedWords = new Set(introduction.map((card) => card.wordId).filter(Boolean));
  const askedWords = new Set(
    session.questions.map((question) => question.wordId).filter(Boolean),
  );
  askedWords.forEach((wordId) => {
    assert.ok(introducedWords.has(wordId), `kata ${wordId} ditanya tanpa diperkenalkan`);
  });
});

test('materi yang sudah dikuasai tidak diperkenalkan ulang', () => {
  const { container } = bootApp({ seed: 'ulang' });
  const profile = container.profileService.get();
  container.queryService.lessonById('u3-l1').items.forEach((wordId) => {
    profile.words[wordId] = { seen: 9, correct: 9, wrong: 0, mastery: 5, lastAt: 1 };
  });

  const session = container.lessonSessions.startLesson('u3-l1');
  assert.equal(session.steps.filter((step) => step.kind === 'teach').length, 0);
  assert.equal(session.total, 8);
});

test('mengulang pelajaran bisa menaikkan bintang, dan tidak pernah menurunkannya', () => {
  const { container } = bootApp({ seed: 'ulangi' });

  const pertama = playLesson(container, 'u1-l1', { wrongAnswers: 4 });
  assert.equal(pertama.stars, 1, 'banyak salah menghasilkan satu bintang');
  assert.equal(container.queryService.lessonRecord('u1-l1').stars, 1);

  const kedua = playLesson(container, 'u1-l1');
  assert.equal(kedua.stars, 3, 'ulangan tanpa salah meraih tiga bintang');
  assert.equal(kedua.firstTime, false, 'tetap dihitung sebagai pengulangan');
  assert.equal(container.queryService.lessonRecord('u1-l1').stars, 3);

  const ketiga = playLesson(container, 'u1-l1', { wrongAnswers: 5 });
  assert.equal(ketiga.stars, 1, 'hasil ulangan terakhir apa adanya');
  assert.equal(container.queryService.lessonRecord('u1-l1').stars, 3,
    'bintang terbaik yang tersimpan, tidak diturunkan oleh ulangan yang buruk');
  assert.equal(container.profileService.summary().lessonsDone, 1,
    'mengulang tidak menggandakan hitungan pelajaran selesai');
});

test('medali unit bisa naik ke emas lewat pengulangan', () => {
  const { container } = bootApp({ seed: 'medali-ulang' });
  const unitLessons = LESSON_ORDER.filter((lessonId) => lessonId.startsWith('u1-'));

  unitLessons.forEach((lessonId) => playLesson(container, lessonId, { wrongAnswers: 4 }));
  assert.equal(container.queryService.learningPath()[0].medal, 'bronze');

  unitLessons.forEach((lessonId) => playLesson(container, lessonId));
  assert.equal(container.queryService.learningPath()[0].medal, 'gold',
    'mengulang sampai sempurna menaikkan medali unit');
});
