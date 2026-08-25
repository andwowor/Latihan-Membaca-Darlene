/**
 * USE CASE — menjalankan satu sesi pelajaran dari soal pertama sampai selesai.
 *
 * Sesi menyimpan keadaan sementara (soal ke berapa, berapa kali salah) dan
 * meneruskan setiap hasil ke ProfileService. Aturan penilaian, XP, bintang,
 * dan medali tetap di lapisan domain.
 */
import { LESSON_MAP, unitOfLesson, nextLessonId } from '../domain/curriculum.js';
import { planLesson, planPractice, selectReviewWordIds, REVIEW_WORD_COUNT } from '../domain/exercise/lessonPlan.js';
import { isAnswerCorrect } from '../domain/exercise/grading.js';
import { registerAnswer, registerLessonCompletion } from '../domain/profile.js';

/**
 * Bungkus satu sesi mengerjakan soal: menyimpan posisi, jumlah salah, dan XP
 * yang terkumpul, lalu meneruskan setiap jawaban ke ProfileService.
 * @param {{lessonId: (string|null), questions: Array<object>, profileService: object,
 *          clock: object, onComplete: (tally: object) => object}} params
 */
function createSession({ lessonId, questions, profileService, clock, onComplete }) {
  let position = 0;
  let mistakes = 0;
  let correctCount = 0;
  let xpFromAnswers = 0;
  let answered = false;

  return {
    lessonId,
    questions,
    total: questions.length,
    position: () => position,
    mistakes: () => mistakes,
    current: () => questions[position],
    isLast: () => position >= questions.length - 1,
    progress: () => position / questions.length,

    /**
     * Nilai jawaban untuk soal saat ini.
     * @param {*} response
     * @returns {{correct: boolean, question: object, xpGained: number, unlocked: Array}}
     */
    answer(response) {
      const question = questions[position];
      if (answered) return { correct: null, question, xpGained: 0, unlocked: [] };
      answered = true;

      const correct = isAnswerCorrect(question, response);
      if (correct) correctCount += 1; else mistakes += 1;

      let xpGained = 0;
      const { unlocked } = profileService.apply((profile) => {
        const outcome = registerAnswer(profile, {
          exerciseType: question.type,
          wordId: question.wordId,
          correct,
          now: clock.now(),
        });
        xpGained = outcome.xpGained;
        return outcome.profile;
      });

      xpFromAnswers += xpGained;
      return { correct, question, xpGained, unlocked };
    },

    /**
     * Lanjut ke soal berikutnya, atau selesaikan pelajaran.
     * @returns {{finished: boolean, result: (object|null)}}
     */
    next() {
      answered = false;
      if (position < questions.length - 1) {
        position += 1;
        return { finished: false, result: null };
      }
      return { finished: true, result: onComplete({ correctCount, mistakes, xpFromAnswers }) };
    },
  };
}

/**
 * @param {{profileService: object,
 *          random: import('../ports/RandomPort.js').RandomPort,
 *          clock: import('../ports/ClockPort.js').ClockPort}} dependencies
 */
export function createLessonSessionFactory({ profileService, random, clock }) {
  const randomFn = () => random.next();

  /** Selesaikan pelajaran resmi: catat bintang, XP bonus, streak, achievement. */
  function completeLesson(lessonId, { correctCount, mistakes, xpFromAnswers }) {
    let outcome = null;
    const applied = profileService.apply((profile) => {
      outcome = registerLessonCompletion(profile, {
        lessonId,
        mistakes,
        correctCount,
        now: clock.now(),
        todayKey: profileService.todayKey(),
      });
      return outcome.profile;
    });

    return {
      lessonId,
      unit: unitOfLesson(lessonId),
      lesson: LESSON_MAP[lessonId],
      nextLessonId: nextLessonId(lessonId),
      correctCount,
      mistakes,
      total: correctCount + mistakes,
      stars: outcome.stars,
      xpBonus: outcome.xpGained,
      xpFromAnswers,
      xpTotal: outcome.xpGained + xpFromAnswers,
      firstTime: outcome.firstTime,
      streakIncreased: outcome.streakIncreased,
      streakCount: outcome.streakCount,
      unlocked: applied.unlocked,
      leveledUp: applied.leveledUp,
      level: applied.level,
      missions: profileService.missions(),
    };
  }

  return {
    /**
     * Mulai satu pelajaran dari peta belajar.
     * @param {string} lessonId
     * @returns {object|null} sesi, atau null bila pelajaran tidak ada
     */
    startLesson(lessonId) {
      const lesson = LESSON_MAP[lessonId];
      if (!lesson) return null;
      const itemIds = lesson.kind === 'mixed'
        ? selectReviewWordIds(profileService.get().words, REVIEW_WORD_COUNT, randomFn)
        : undefined;
      const questions = planLesson({ lesson, itemIds, random: randomFn });
      if (!questions.length) return null;
      return createSession({
        lessonId,
        questions,
        profileService,
        clock,
        onComplete: (tally) => completeLesson(lessonId, tally),
      });
    },

    /**
     * Mulai latihan ulangan otomatis: kata yang sudah dilatih tetapi belum kuat.
     * @param {number} [wordCount]
     * @returns {object|null}
     */
    startReviewPractice(wordCount = REVIEW_WORD_COUNT) {
      const wordIds = selectReviewWordIds(profileService.get().words, wordCount, randomFn);
      return this.startPractice(wordIds);
    },

    /**
     * Mulai latihan bebas dari daftar kata (tanpa bintang & tanpa membuka kunci).
     * @param {Array<string>} wordIds
     * @returns {object|null}
     */
    startPractice(wordIds) {
      const questions = planPractice({ wordIds, random: randomFn });
      if (!questions.length) return null;
      return createSession({
        lessonId: null,
        questions,
        profileService,
        clock,
        onComplete: ({ correctCount, mistakes, xpFromAnswers }) => ({
          practice: true,
          correctCount,
          mistakes,
          total: correctCount + mistakes,
          xpBonus: 0,
          xpFromAnswers,
          xpTotal: xpFromAnswers,
          unlocked: [],
          missions: profileService.missions(),
          level: profileService.level(),
        }),
      });
    },
  };
}
