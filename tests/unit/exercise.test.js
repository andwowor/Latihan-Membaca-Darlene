import test from 'node:test';
import assert from 'node:assert/strict';
import { planLesson, planPractice, selectReviewWordIds, MAX_SELF_CHECK_QUESTIONS } from '../../src/domain/exercise/lessonPlan.js';
import { QUESTION_BUILDERS, OPTIONS_PER_QUESTION } from '../../src/domain/exercise/builders.js';
import { isAnswerCorrect, missionMetricForExerciseType, EXERCISE_TYPES } from '../../src/domain/exercise/grading.js';
import { LESSONS, LESSON_MAP, QUESTIONS_PER_LESSON } from '../../src/domain/curriculum.js';
import { WORDS, WORD_LIST } from '../../src/domain/vocabulary.js';
import { seededRandom } from '../../src/shared/random.js';

const REPEATS = 12;
const labelOf = (option) => option.text ?? option.emoji;

function everyQuestion(callback) {
  LESSONS.forEach((lesson) => {
    for (let seed = 0; seed < REPEATS; seed += 1) {
      const random = seededRandom(`${lesson.id}-${seed}`);
      const itemIds = lesson.kind === 'mixed'
        ? selectReviewWordIds({}, 6, random)
        : undefined;
      planLesson({ lesson, itemIds, random }).forEach((question) => callback(question, lesson));
    }
  });
}

test('semua tipe latihan punya pembuat soal', () => {
  EXERCISE_TYPES.forEach((type) => assert.ok(QUESTION_BUILDERS[type], `tipe ${type}`));
});

test('setiap pelajaran menghasilkan tepat delapan soal', () => {
  LESSONS.forEach((lesson) => {
    for (let seed = 0; seed < REPEATS; seed += 1) {
      const random = seededRandom(`n-${lesson.id}-${seed}`);
      const itemIds = lesson.kind === 'mixed' ? selectReviewWordIds({}, 6, random) : undefined;
      const questions = planLesson({ lesson, itemIds, random });
      assert.equal(questions.length, QUESTIONS_PER_LESSON, `${lesson.id} seed ${seed}`);
    }
  });
});

test('soal pilihan punya cukup opsi dengan tepat satu jawaban benar', () => {
  everyQuestion((question, lesson) => {
    if (question.kind !== 'choice') return;
    // Soal "baris mana yang dibacakan" mengambil opsinya dari baris cerita
    // itu sendiri — cerita 2 baris hanya bisa menawarkan 2 pilihan. Selain
    // itu tetap wajib empat opsi.
    if (question.type === 'story-line') {
      assert.ok(question.options.length >= 2, `${lesson.id}/${question.type}`);
      assert.ok(question.options.length <= OPTIONS_PER_QUESTION, `${lesson.id}/${question.type}`);
    } else {
      assert.equal(question.options.length, OPTIONS_PER_QUESTION, `${lesson.id}/${question.type}`);
    }
    const correct = question.options.filter((option) => option.correct);
    assert.equal(correct.length, 1, `${lesson.id}/${question.type} jawaban benar`);
  });
});

// REGRESI — bug pertama: pengecoh boleh berbeda kata tetapi berlabel sama,
// mis. "is" dan "am" sama-sama "adalah", sehingga ada dua opsi yang benar.
test('regresi: label opsi tidak boleh kembar', () => {
  everyQuestion((question, lesson) => {
    if (question.kind !== 'choice') return;
    const labels = question.options.map(labelOf);
    assert.equal(new Set(labels).size, labels.length,
      `${lesson.id}/${question.type} punya label kembar: ${labels.join(', ')}`);
  });
});

// REGRESI — bug kedua: dua kata berbeda bahasa memakai emoji sama (🍎 apel/apple)
// sehingga soal "pilih gambar" punya dua gambar yang sama.
test('regresi: opsi gambar tidak boleh memakai emoji kembar', () => {
  const random = seededRandom('emoji');
  for (let index = 0; index < 400; index += 1) {
    const word = WORD_LIST.filter((item) => !item.sight)[index % 100];
    const question = QUESTION_BUILDERS['word-pic'](word, random);
    const emojis = question.options.map((option) => option.emoji);
    assert.equal(new Set(emojis).size, emojis.length, `emoji kembar untuk ${word.id}`);
  }
});

test('kunci opsi tidak kembar sehingga penilaian tidak ambigu', () => {
  everyQuestion((question, lesson) => {
    if (question.kind !== 'choice') return;
    const keys = question.options.map((option) => option.key);
    assert.equal(new Set(keys).size, keys.length, `${lesson.id}/${question.type} kunci kembar`);
  });
});

test('soal susun selalu bisa diselesaikan dari kepingan yang tersedia', () => {
  everyQuestion((question, lesson) => {
    if (question.kind !== 'build') return;
    assert.ok(question.answer.length >= 2, `${lesson.id}/${question.type} jawaban terlalu pendek`);
    const remaining = [...question.tiles];
    question.answer.forEach((tile) => {
      const position = remaining.indexOf(tile);
      assert.ok(position >= 0, `${lesson.id}/${question.type} kekurangan kepingan "${tile}"`);
      remaining.splice(position, 1);
    });
    // Soal susun huruf & suku kata memakai kepingan pengecoh; soal susun
    // kalimat tidak — kata-katanya memang persis sebanyak kalimatnya.
    if (question.type === 'sentence-build') {
      assert.equal(question.tiles.length, question.answer.length);
    } else {
      assert.ok(question.tiles.length > question.answer.length,
        `${lesson.id}/${question.type} tanpa kepingan pengecoh`);
    }
  });
});

test('penilaian menerima jawaban benar dan menolak yang salah', () => {
  everyQuestion((question) => {
    if (question.kind === 'choice') {
      const right = question.options.find((option) => option.correct).key;
      const wrong = question.options.find((option) => !option.correct).key;
      assert.equal(isAnswerCorrect(question, right), true);
      assert.equal(isAnswerCorrect(question, wrong), false);
    } else if (question.kind === 'build') {
      assert.equal(isAnswerCorrect(question, question.answer), true);
      assert.equal(isAnswerCorrect(question, question.answer.slice(0, 1)), false);
      // Kata simetris seperti "gigi" (gi-gi) tetap benar walau dibalik,
      // jadi urutan terbalik hanya diuji bila memang berbeda.
      const reversed = [...question.answer].reverse();
      if (reversed.join('\u0000') !== question.answer.join('\u0000')) {
        assert.equal(isAnswerCorrect(question, reversed), false);
      }
    } else {
      assert.equal(isAnswerCorrect(question, true), true);
      assert.equal(isAnswerCorrect(question, false), false);
    }
  });
});

test('soal baca-sendiri dibatasi agar tidak mendominasi pelajaran', () => {
  LESSONS.forEach((lesson) => {
    for (let seed = 0; seed < REPEATS; seed += 1) {
      const random = seededRandom(`s-${lesson.id}-${seed}`);
      const itemIds = lesson.kind === 'mixed' ? selectReviewWordIds({}, 6, random) : undefined;
      const selfChecks = planLesson({ lesson, itemIds, random })
        .filter((question) => question.kind === 'confirm').length;
      assert.ok(selfChecks <= MAX_SELF_CHECK_QUESTIONS, `${lesson.id} punya ${selfChecks} soal baca-sendiri`);
    }
  });
});

test('sight word tidak pernah mendapat soal bergambar', () => {
  everyQuestion((question) => {
    if (!question.wordId || !WORDS[question.wordId]?.sight) return;
    assert.ok(!['pic-word', 'word-pic'].includes(question.type),
      `sight word ${question.wordId} mendapat soal ${question.type}`);
  });
});

test('soal punya materi audio kecuali soal tebak gambar', () => {
  everyQuestion((question, lesson) => {
    if (question.type === 'pic-word') return;
    assert.ok(question.audio?.text, `${lesson.id}/${question.type} tanpa audio`);
    assert.ok(['id', 'en'].includes(question.audio.lang), `${question.type} bahasa audio`);
  });
});

test('benih yang sama menghasilkan pelajaran yang sama persis', () => {
  const lesson = LESSON_MAP['u3-l1'];
  const first = planLesson({ lesson, random: seededRandom('tetap') });
  const second = planLesson({ lesson, random: seededRandom('tetap') });
  assert.deepEqual(first, second);
});

test('latihan cepat menghasilkan jumlah soal yang diminta', () => {
  const questions = planPractice({
    wordIds: ['id-bola', 'id-buku', 'en-cat'],
    count: 8,
    random: seededRandom('latihan'),
  });
  assert.equal(questions.length, 8);
  questions.forEach((question) => assert.ok(question.wordId));
});

test('pemilihan kata ulangan mendahulukan kata yang belum dikuasai', () => {
  const records = {
    'id-bola': { seen: 5, mastery: 1 },
    'id-buku': { seen: 4, mastery: 2 },
    'id-susu': { seen: 3, mastery: 1 },
    'id-roti': { seen: 3, mastery: 0 },
    'id-nasi': { seen: 2, mastery: 1 },
    'id-apel': { seen: 2, mastery: 2 },
    'en-cat': { seen: 9, mastery: 5 },
  };
  const picked = selectReviewWordIds(records, 6, seededRandom('ulang'));
  assert.equal(picked.length, 6);
  assert.ok(!picked.includes('en-cat'), 'kata yang sudah dikuasai tidak diulang');
});

test('pemilihan kata ulangan tetap jalan untuk profil kosong', () => {
  const picked = selectReviewWordIds({}, 6, seededRandom('kosong'));
  assert.equal(picked.length, 6);
  assert.equal(new Set(picked).size, 6);
});

test('pemetaan tipe soal ke metrik misi', () => {
  assert.equal(missionMetricForExerciseType('spell'), 'spell');
  assert.equal(missionMetricForExerciseType('sentence-build'), 'spell');
  assert.equal(missionMetricForExerciseType('listen-word'), 'listen');
  assert.equal(missionMetricForExerciseType('letter-sound'), 'listen');
  assert.equal(missionMetricForExerciseType('read-aloud'), 'read');
  assert.equal(missionMetricForExerciseType('pic-word'), null);
});

test('pelajaran yang tidak dikenal menghasilkan daftar kosong, bukan galat', () => {
  assert.deepEqual(planLesson({ lesson: undefined, random: seededRandom('x') }), []);
});
