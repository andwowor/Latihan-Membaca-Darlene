import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProfile, normalizeProfile, rollToDay, summarize, missionsOf,
  registerAnswer, registerLessonCompletion, registerMissionClaim, grantNewAchievements,
  updateSetting, renameLearner, HISTORY_DAYS_KEPT,
} from '../../src/domain/profile.js';
import { XP_PER_CORRECT_ANSWER } from '../../src/domain/scoring.js';

const NOW = Date.parse('2026-08-25T08:00:00Z');
const TODAY = '2026-08-25';

const answerCorrectly = (profile, count, wordId = 'id-bola') => {
  let current = profile;
  for (let index = 0; index < count; index += 1) {
    current = registerAnswer(current, {
      exerciseType: 'pic-word', wordId, correct: true, now: NOW,
    }).profile;
  }
  return current;
};

test('profil baru kosong tetapi lengkap', () => {
  const profile = createProfile({ now: NOW });
  assert.equal(profile.experiencePoints, 0);
  assert.equal(profile.learnerName, 'Darlene');
  assert.equal(profile.missions.ids.length, 3);
  assert.equal(profile.settings.speech, true);
  assert.deepEqual(profile.lessons, {});
});

test('jawaban benar menambah XP dan penguasaan kata; profil lama tidak berubah', () => {
  const before = createProfile({ now: NOW });
  const { profile, xpGained, masteryLevel } = registerAnswer(before, {
    exerciseType: 'pic-word', wordId: 'id-bola', correct: true, now: NOW,
  });
  assert.equal(xpGained, XP_PER_CORRECT_ANSWER);
  assert.equal(masteryLevel, 1);
  assert.equal(profile.daily.idWords, 1);
  assert.equal(before.experiencePoints, 0, 'fungsi domain harus murni');
});

test('jawaban salah tidak memberi XP tetapi tetap tercatat', () => {
  const { profile, xpGained } = registerAnswer(createProfile({ now: NOW }), {
    exerciseType: 'spell', wordId: 'en-cat', correct: false, now: NOW,
  });
  assert.equal(xpGained, 0);
  assert.equal(profile.totals.wrong, 1);
  assert.equal(profile.daily.spell, 0, 'metrik misi hanya naik saat benar');
});

test('tipe soal mengisi metrik misi yang sesuai', () => {
  let profile = createProfile({ now: NOW });
  profile = registerAnswer(profile, { exerciseType: 'spell', wordId: 'id-bola', correct: true, now: NOW }).profile;
  profile = registerAnswer(profile, { exerciseType: 'listen-word', wordId: 'en-cat', correct: true, now: NOW }).profile;
  profile = registerAnswer(profile, { exerciseType: 'read-aloud', wordId: 'id-buku', correct: true, now: NOW }).profile;
  assert.equal(profile.daily.spell, 1);
  assert.equal(profile.daily.listen, 1);
  assert.equal(profile.daily.read, 1);
  assert.equal(profile.daily.idWords, 2);
  assert.equal(profile.daily.enWords, 1);
});

test('menyelesaikan pelajaran memberi bintang, bonus XP, dan streak', () => {
  const result = registerLessonCompletion(createProfile({ now: NOW }), {
    lessonId: 'u1-l1', mistakes: 0, correctCount: 8, now: NOW, todayKey: TODAY,
  });
  assert.equal(result.stars, 3);
  assert.equal(result.firstTime, true);
  assert.equal(result.streakCount, 1);
  assert.equal(result.profile.totals.lessonsDone, 1);
  assert.equal(result.profile.totals.perfect, 1);
});

test('mengulang pelajaran tidak menambah hitungan pelajaran dan menjaga bintang terbaik', () => {
  const first = registerLessonCompletion(createProfile({ now: NOW }), {
    lessonId: 'u1-l1', mistakes: 0, correctCount: 8, now: NOW, todayKey: TODAY,
  }).profile;
  const second = registerLessonCompletion(first, {
    lessonId: 'u1-l1', mistakes: 5, correctCount: 3, now: NOW, todayKey: TODAY,
  });
  assert.equal(second.firstTime, false);
  assert.equal(second.profile.totals.lessonsDone, 1);
  assert.equal(second.profile.lessons['u1-l1'].stars, 3, 'bintang terbaik dipertahankan');
  assert.equal(second.profile.lessons['u1-l1'].attempts, 2);
});

test('achievement diberikan sekali dan menambah poin prestasi', () => {
  let profile = registerLessonCompletion(createProfile({ now: NOW }), {
    lessonId: 'u1-l1', mistakes: 0, correctCount: 8, now: NOW, todayKey: TODAY,
  }).profile;
  const granted = grantNewAchievements(profile, NOW);
  profile = granted.profile;
  assert.ok(granted.unlocked.some((item) => item.id === 'first-lesson'));
  assert.ok(profile.achievementPoints > 0);

  const again = grantNewAchievements(profile, NOW);
  assert.equal(again.unlocked.length, 0);
  assert.equal(again.profile.achievementPoints, profile.achievementPoints);
});

test('hadiah misi hanya bisa diambil sekali dan setelah tuntas', () => {
  let profile = createProfile({ now: NOW });
  profile.missions.ids = ['m-correct-15'];
  assert.equal(registerMissionClaim(profile, 'm-correct-15'), null, 'belum tuntas');

  profile = answerCorrectly(profile, 15);
  const claimed = registerMissionClaim(profile, 'm-correct-15');
  assert.ok(claimed);
  assert.equal(claimed.profile.totals.missionsDone, 1);
  assert.equal(claimed.profile.achievementPoints, 5);
  assert.equal(registerMissionClaim(claimed.profile, 'm-correct-15'), null, 'tidak boleh dobel');
});

test('misi menampilkan progres yang benar', () => {
  let profile = createProfile({ now: NOW });
  profile.missions.ids = ['m-correct-25'];
  profile = answerCorrectly(profile, 10);
  const [mission] = missionsOf(profile);
  assert.equal(mission.value, 10);
  assert.equal(mission.done, false);
});

test('pergantian hari mengarsipkan capaian dan mengundi misi baru', () => {
  let profile = answerCorrectly(createProfile({ now: NOW }), 3);
  profile.missions.claimed = [profile.missions.ids[0]];
  profile = rollToDay(profile, '2026-08-26');
  assert.equal(profile.daily.day, '2026-08-26');
  assert.equal(profile.daily.correct, 0);
  assert.equal(profile.history.length, 1);
  assert.equal(profile.history[0].correct, 3);
  assert.equal(profile.missions.day, '2026-08-26');
  assert.deepEqual(profile.missions.claimed, [], 'klaim kemarin ikut disetel ulang');
  assert.equal(profile.missions.ids.length, 3);
});

test('hari tanpa aktivitas tidak masuk riwayat', () => {
  const profile = rollToDay(createProfile({ now: NOW }), '2026-08-26');
  assert.equal(profile.history.length, 0);
});

test('riwayat dibatasi agar penyimpanan tidak membengkak', () => {
  let profile = createProfile({ now: NOW });
  for (let day = 0; day < HISTORY_DAYS_KEPT + 12; day += 1) {
    profile = answerCorrectly(profile, 1);
    const date = new Date(Date.parse('2026-01-01T08:00:00Z') + day * 86400000);
    profile = rollToDay(profile, date.toISOString().slice(0, 10));
  }
  assert.ok(profile.history.length <= HISTORY_DAYS_KEPT);
});

test('rollToDay aman dipanggil berulang untuk hari yang sama', () => {
  const profile = createProfile({ now: NOW });
  assert.equal(rollToDay(profile, profile.daily.day), profile, 'tidak menyalin bila tidak perlu');
});

test('ringkasan menghitung ketepatan, kata dikuasai, dan medali', () => {
  let profile = answerCorrectly(createProfile({ now: NOW }), 4);
  profile = registerAnswer(profile, {
    exerciseType: 'pic-word', wordId: 'en-cat', correct: false, now: NOW,
  }).profile;
  const stats = summarize(profile, TODAY);
  assert.equal(stats.correct, 4);
  assert.equal(stats.wrong, 1);
  assert.equal(stats.accuracy, 0.8);
  assert.equal(stats.mastered, 1, 'id-bola sudah dijawab benar 4 kali');
  assert.equal(stats.masteredId, 1);
  assert.equal(stats.medals, 0);
});

test('normalizeProfile melengkapi profil versi lama', () => {
  const restored = normalizeProfile({ experiencePoints: 500, learnerName: 'Dara' }, NOW);
  assert.equal(restored.experiencePoints, 500);
  assert.equal(restored.learnerName, 'Dara');
  assert.equal(restored.settings.speech, true);
  assert.deepEqual(restored.words, {});
  assert.ok(Array.isArray(restored.history));
});

test('normalizeProfile menolak masukan yang bukan objek', () => {
  const fallback = normalizeProfile(null, NOW);
  assert.equal(fallback.experiencePoints, 0);
});

test('pengaturan dan nama anak bisa diubah tanpa mengubah profil lama', () => {
  const profile = createProfile({ now: NOW });
  const quiet = updateSetting(profile, 'sound', false);
  assert.equal(quiet.settings.sound, false);
  assert.equal(profile.settings.sound, true);

  assert.equal(renameLearner(profile, '  Kayla  ').learnerName, 'Kayla');
  assert.equal(renameLearner(profile, '   ').learnerName, 'Darlene', 'nama kosong kembali ke bawaan');
});
