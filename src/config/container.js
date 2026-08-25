/**
 * COMPOSITION ROOT — satu-satunya tempat perakitan dependensi.
 *
 * Di sinilah adapter nyata dipasangkan ke port. Mengganti penyimpanan lokal
 * dengan penyimpanan awan cukup mengubah satu baris di berkas ini
 * (lihat docs/architecture/adr/ADR-0002).
 */
import { createProfileService } from '../application/ProfileService.js';
import { createLessonSessionFactory } from '../application/LessonSession.js';
import { createDailyMissionService } from '../application/DailyMissionService.js';
import { createProgressQueryService } from '../application/ProgressQueryService.js';

import { createLocalStorageProgressRepository } from '../adapters/outbound/localStorageProgressRepository.js';
import { createMemoryProgressRepository } from '../adapters/outbound/memoryProgressRepository.js';
import { createWebSpeechAdapter } from '../adapters/outbound/webSpeechAdapter.js';
import { createWebAudioSoundAdapter } from '../adapters/outbound/webAudioSoundAdapter.js';
import { createNullSpeechAdapter, createNullSoundAdapter } from '../adapters/outbound/nullSpeechAdapter.js';
import { createSystemClock } from '../adapters/outbound/systemClock.js';
import { createMathRandom } from '../adapters/outbound/mathRandom.js';

import { detectCapabilities, FALLBACK_SETTINGS } from './environment.js';

/** Pilih adapter penyimpanan sesuai kemampuan perangkat. */
function resolveRepository(overrides, capabilities) {
  if (overrides.repository) return overrides.repository;
  return capabilities.hasLocalStorage
    ? createLocalStorageProgressRepository()
    : createMemoryProgressRepository();
}

/** Pilih adapter pengucapan; perangkat tanpa Web Speech memakai adapter kosong. */
function resolveSpeech(overrides, capabilities, getSettings) {
  if (overrides.speech) return overrides.speech;
  return capabilities.hasSpeechSynthesis
    ? createWebSpeechAdapter({ getSettings })
    : createNullSpeechAdapter();
}

/** Pilih adapter efek suara. */
function resolveSound(overrides, capabilities, getSettings) {
  if (overrides.sound) return overrides.sound;
  return capabilities.hasWebAudio
    ? createWebAudioSoundAdapter({ getSettings })
    : createNullSoundAdapter();
}

/**
 * Rakit seluruh aplikasi.
 * @param {{clock?: object, random?: object, repository?: object,
 *          speech?: object, sound?: object, capabilities?: object}} [overrides]
 *        Penggantian untuk keperluan test.
 * @returns {object} kumpulan layanan siap pakai
 */
export function createContainer(overrides = {}) {
  const capabilities = overrides.capabilities || detectCapabilities();
  const clock = overrides.clock || createSystemClock();
  const random = overrides.random || createMathRandom();

  const repository = resolveRepository(overrides, capabilities);
  const profileService = createProfileService({ repository, clock });
  const getSettings = () => profileService.get()?.settings || FALLBACK_SETTINGS;
  const speech = resolveSpeech(overrides, capabilities, getSettings);
  const sound = resolveSound(overrides, capabilities, getSettings);

  const lessonSessions = createLessonSessionFactory({ profileService, random, clock });
  const missionService = createDailyMissionService({ profileService });
  const queryService = createProgressQueryService({ profileService });

  return {
    capabilities,
    clock,
    random,
    repository,
    speech,
    sound,
    profileService,
    lessonSessions,
    missionService,
    queryService,

    /** Muat progres tersimpan; panggil sekali saat aplikasi dibuka. */
    start() {
      profileService.load();
      return this;
    },

    /** Buka kunci audio pada sentuhan pertama (syarat iOS Safari). */
    unlockAudio() {
      sound.unlock();
      speech.unlock();
    },
  };
}
