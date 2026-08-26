/**
 * Kumpulan kontrak port. Dipakai test integrasi untuk memastikan setiap
 * adapter benar-benar bisa menggantikan kontraknya (Liskov & Wing, 1994).
 */
export { PROGRESS_REPOSITORY_METHODS } from './ProgressRepository.js';
export { SPEECH_PORT_METHODS } from './SpeechPort.js';
export { SOUND_PORT_METHODS } from './SoundPort.js';
export { CLOCK_PORT_METHODS } from './ClockPort.js';
export { RANDOM_PORT_METHODS } from './RandomPort.js';
export { SYNC_PORT_METHODS } from './SyncPort.js';
