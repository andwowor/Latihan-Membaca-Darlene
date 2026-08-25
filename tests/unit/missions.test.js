import test from 'node:test';
import assert from 'node:assert/strict';
import {
  missionsForDay, evaluateMissions, MISSION_MAP, MISSION_TEMPLATES, MISSIONS_PER_DAY,
} from '../../src/domain/missions.js';

test('undian misi tetap sama untuk hari yang sama', () => {
  assert.deepEqual(missionsForDay('2026-08-25'), missionsForDay('2026-08-25'));
});

test('setiap hari mendapat tiga misi yang valid', () => {
  for (let day = 1; day <= 28; day += 1) {
    const dayKey = `2026-08-${String(day).padStart(2, '0')}`;
    const ids = missionsForDay(dayKey);
    assert.equal(ids.length, MISSIONS_PER_DAY, `jumlah misi ${dayKey}`);
    ids.forEach((id) => assert.ok(MISSION_MAP[id], `misi ${id} dikenal`));
  }
});

test('tiga misi harian tidak memakai metrik yang sama', () => {
  for (let day = 1; day <= 31; day += 1) {
    const dayKey = `2026-01-${String(day).padStart(2, '0')}`;
    const metrics = missionsForDay(dayKey).map((id) => MISSION_MAP[id].metric);
    assert.equal(new Set(metrics).size, metrics.length, `metrik kembar di ${dayKey}`);
  }
});

test('misi berbeda antar hari (tidak selalu itu-itu saja)', () => {
  const combos = new Set();
  for (let day = 1; day <= 20; day += 1) {
    combos.add(missionsForDay(`2026-05-${String(day).padStart(2, '0')}`).join(','));
  }
  assert.ok(combos.size >= 5, `variasi misi terlalu sedikit: ${combos.size}`);
});

test('evaluateMissions menghitung progres, status selesai, dan klaim', () => {
  const [mission] = evaluateMissions(['m-lesson-2'], { lessons: 1 }, []);
  assert.equal(mission.value, 1);
  assert.equal(mission.done, false);
  assert.equal(mission.progress, 0.5);

  const [finished] = evaluateMissions(['m-lesson-2'], { lessons: 5 }, ['m-lesson-2']);
  assert.equal(finished.done, true);
  assert.equal(finished.claimed, true);
  assert.equal(finished.value, 2, 'nilai tidak melebihi target');
});

test('semua template misi punya hadiah dan target yang masuk akal', () => {
  MISSION_TEMPLATES.forEach((mission) => {
    assert.ok(mission.target > 0, `${mission.id} target`);
    assert.ok(mission.xp > 0 && mission.points > 0, `${mission.id} hadiah`);
    assert.ok(mission.title && mission.emoji, `${mission.id} tampilan`);
  });
});
