/**
 * USE CASE — sinkronisasi progres antar perangkat.
 *
 * Alur satu kali sinkron: kirim profil lokal ➜ server menggabungkannya dengan
 * yang tersimpan ➜ hasil gabungan diadopsi kembali di perangkat ini.
 * Karena penggabungan dikerjakan server memakai aturan domain yang sama,
 * tidak ada balapan antar perangkat yang perlu ditangani di sini.
 */
import {
  enableSync, disableSync, recordSyncResult, withoutSyncSecret,
} from '../domain/profile.js';
import { mergeProfiles } from '../domain/merge.js';
import { generateSyncCode, normalizeSyncCode, formatSyncCode } from '../domain/syncCode.js';

/** Jeda sebelum perubahan dikirim, supaya tidak mengirim tiap jawaban. */
export const SYNC_DEBOUNCE_MS = 6000;

/**
 * @param {{profileService: object, sync: object, clock: object, random: object,
 *          isOnline?: () => boolean}} dependencies
 */
export function createSyncService({ profileService, sync, clock, random, isOnline }) {
  const online = isOnline || (() => globalThis.navigator?.onLine !== false);
  let pendingTimer = null;
  let running = false;

  const state = () => profileService.get()?.sync || { enabled: false, code: '' };

  /** Pasang kembali pengaturan perangkat ini; pengaturan tidak ikut disinkronkan. */
  function adopt(remoteProfile) {
    profileService.apply((local) => {
      const merged = mergeProfiles(local, remoteProfile);
      merged.settings = local.settings;
      merged.sync = local.sync;
      return merged;
    });
  }

  function finish(ok, message) {
    profileService.apply((profile) => recordSyncResult(profile, {
      at: clock.now(), ok, message,
    }));
    return { ok, message };
  }

  /**
   * Jalankan satu putaran sinkronisasi.
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  async function syncNow() {
    const current = state();
    if (!current.enabled || !current.code) return { ok: false, message: 'Sinkronisasi belum aktif.' };
    if (!online()) return finish(false, 'Tidak ada koneksi internet.');
    if (running) return { ok: false, message: 'Sinkronisasi sedang berjalan.' };

    running = true;
    try {
      const payload = withoutSyncSecret(profileService.get());
      const result = await sync.push(current.code, payload);
      if (result?.profile) adopt(result.profile);
      return finish(true, 'Progres tersinkron.');
    } catch (error) {
      return finish(false, error.message || 'Sinkronisasi gagal.');
    } finally {
      running = false;
    }
  }

  return {
    syncNow,

    /** Keadaan untuk ditampilkan di Area Orang Tua. */
    status() {
      const current = state();
      return {
        enabled: Boolean(current.enabled),
        code: current.code ? formatSyncCode(current.code) : '',
        lastSyncAt: current.lastSyncAt || null,
        lastStatus: current.lastStatus || null,
        message: current.message || '',
      };
    },

    /**
     * Nyalakan sinkronisasi. Tanpa kode, sebuah kode baru dibuat.
     * @param {string} [existingCode] kode dari perangkat lain
     * @returns {Promise<{ok: boolean, message: string, code?: string}>}
     */
    async enable(existingCode) {
      const code = existingCode
        ? normalizeSyncCode(existingCode)
        : normalizeSyncCode(generateSyncCode(() => random.next()));
      if (!code) {
        return { ok: false, message: 'Kode sinkron tidak dikenali. Periksa lagi ketikannya.' };
      }
      profileService.apply((profile) => enableSync(profile, code));
      const result = await syncNow();
      return { ...result, code: formatSyncCode(code) };
    },

    /** Matikan sinkronisasi; data lokal tetap utuh. */
    disable() {
      profileService.apply((profile) => disableSync(profile));
    },

    /**
     * Kirim perubahan setelah jeda; dipanggil setiap progres berubah.
     * Diabaikan selama sinkronisasi berjalan, sebab hasil gabungan yang
     * diadopsi juga mengubah profil dan akan memicu gelung tanpa akhir.
     */
    scheduleSync() {
      if (running || !state().enabled) return;
      clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => { syncNow(); }, SYNC_DEBOUNCE_MS);
    },
  };
}
