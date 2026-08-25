/**
 * Test integrasi composition root: seluruh adapter harus bisa menggantikan
 * kontrak port-nya (substitutability — Liskov & Wing, 1994), dan aplikasi
 * harus tetap jalan pada perangkat tanpa suara maupun penyimpanan.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/config/container.js';
import { createMemoryProgressRepository } from '../../src/adapters/outbound/memoryProgressRepository.js';
import { createFixedClock } from '../../src/adapters/outbound/systemClock.js';
import { createWebSpeechAdapter } from '../../src/adapters/outbound/webSpeechAdapter.js';
import { createWebAudioSoundAdapter } from '../../src/adapters/outbound/webAudioSoundAdapter.js';
import { createNullSpeechAdapter, createNullSoundAdapter } from '../../src/adapters/outbound/nullSpeechAdapter.js';
import { SPEECH_PORT_METHODS, SOUND_PORT_METHODS, CLOCK_PORT_METHODS, RANDOM_PORT_METHODS } from '../../src/ports/index.js';
import { FALLBACK_SETTINGS } from '../../src/config/environment.js';

const NO_CAPABILITIES = {
  hasLocalStorage: false, hasSpeechSynthesis: false, hasWebAudio: false, hasServiceWorker: false,
};

const buildContainer = (overrides = {}) => createContainer({
  repository: createMemoryProgressRepository(),
  clock: createFixedClock(Date.parse('2026-08-25T08:00:00Z')),
  capabilities: NO_CAPABILITIES,
  ...overrides,
});

test('adapter suara nyata dan tiruan memenuhi kontrak yang sama', () => {
  const getSettings = () => FALLBACK_SETTINGS;
  const speechAdapters = [createWebSpeechAdapter({ getSettings }), createNullSpeechAdapter()];
  speechAdapters.forEach((adapter) => {
    SPEECH_PORT_METHODS.forEach((method) => {
      assert.equal(typeof adapter[method], 'function', `SpeechPort.${method}`);
    });
  });

  const soundAdapters = [createWebAudioSoundAdapter({ getSettings }), createNullSoundAdapter()];
  soundAdapters.forEach((adapter) => {
    SOUND_PORT_METHODS.forEach((method) => {
      assert.equal(typeof adapter[method], 'function', `SoundPort.${method}`);
    });
  });
});

test('adapter jam dan keacakan memenuhi kontraknya', () => {
  const container = buildContainer();
  CLOCK_PORT_METHODS.forEach((method) => assert.equal(typeof container.clock[method], 'function'));
  RANDOM_PORT_METHODS.forEach((method) => assert.equal(typeof container.random[method], 'function'));
  const value = container.random.next();
  assert.ok(value >= 0 && value < 1);
});

test('perangkat tanpa suara & tanpa penyimpanan tetap bisa menjalankan aplikasi', () => {
  const container = buildContainer().start();
  assert.doesNotThrow(() => container.unlockAudio());
  assert.doesNotThrow(() => container.sound.play('correct'));
  assert.equal(container.speech.isAvailable('id'), false);
  assert.equal(container.queryService.currentLessonId(), 'u1-l1');
});

test('composition root menyediakan seluruh layanan yang dipakai UI', () => {
  const container = buildContainer().start();
  ['profileService', 'lessonSessions', 'missionService', 'queryService', 'speech', 'sound']
    .forEach((service) => assert.ok(container[service], `layanan ${service} tidak dirakit`));
});

test('adapter Web Speech tidak melempar galat di lingkungan tanpa speechSynthesis', async () => {
  const adapter = createWebSpeechAdapter({ getSettings: () => FALLBACK_SETTINGS });
  await assert.doesNotReject(() => adapter.speak('bola', 'id'));
  await assert.doesNotReject(() => adapter.spellOut('bola', 'id'));
  assert.deepEqual(adapter.voicesFor('id'), []);
  assert.doesNotThrow(() => adapter.stop());
  assert.doesNotThrow(() => adapter.unlock());
});
