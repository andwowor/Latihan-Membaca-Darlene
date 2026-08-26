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
import { normalizeSyncCode, formatSyncCode } from '../domain/syncCode.js';

/** Jeda sebelum perubahan dikirim, supaya tidak mengirim tiap jawaban. */
export const SYNC_DEBOUNCE_MS = 6000;

/**
 * @param {{profileService: object, sync: object, clock: object,
 *          isOnline?: () => boolean}} dependencies
 */
export function createSyncService({ profileService, sync, clock, isOnline }) {
  const online = isOnline || (() => globalThis.navigator?.onLine !== false);
  let pendingTimer = null;
  let inFlight = null;
  /** Antrean agar dua putaran tidak pernah berjalan bersamaan. */
  let queue = Promise.resolve();

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

  /** Satu putaran kirim-gabung-adopsi. */
  async function runSync(code) {
    try {
      const payload = withoutSyncSecret(profileService.get());
      const result = await sync.push(code, payload);
      if (result?.profile) adopt(result.profile);
      return finish(true, 'Progres tersinkron.');
    } catch (error) {
      return finish(false, error.message || 'Sinkronisasi gagal.');
    }
  }

  /**
   * Jalankan sinkronisasi.
   *
   * Permintaan diantrekan, tidak dijalankan bersamaan. Yang datang saat satu
   * putaran masih berjalan akan menunggu giliran lalu mengirim keadaan
   * terbaru — bukan menumpang hasil putaran sebelumnya, yang bisa saja
   * berangkat sebelum perubahan terakhir tercatat.
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  function syncNow() {
    if (!state().enabled) {
      return Promise.resolve({ ok: false, message: 'Sinkronisasi dimatikan di perangkat ini.' });
    }
    if (!online()) return Promise.resolve(finish(false, 'Tidak ada koneksi internet.'));

    const run = queue.then(() => runSync(state().code));
    queue = run.then(() => {}, () => {});
    inFlight = run;
    run.finally(() => { if (inFlight === run) inFlight = null; });
    return run;
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
     * Nyalakan sinkronisasi di perangkat ini lalu langsung tarik progres.
     * Pemakaian biasa tidak memerlukan kode sama sekali (ADR-0009); kode
     * hanya dipakai bila profil sengaja dipisahkan.
     * @param {string} [separateProfileCode]
     * @returns {Promise<{ok: boolean, message: string}>}
     */
    async enable(separateProfileCode) {
      let code = '';
      if (separateProfileCode) {
        code = normalizeSyncCode(separateProfileCode);
        if (!code) {
          return { ok: false, message: 'Kode tidak dikenali. Periksa lagi ketikannya.' };
        }
      }
      profileService.apply((profile) => enableSync(profile, code));
      return syncNow();
    },

    /**
     * Batalkan kiriman yang masih menunggu jeda.
     *
     * Dipakai saat aplikasi ditutup atau saat test selesai: tanpa ini, timer
     * jeda 6 detik menahan proses tetap hidup padahal tidak ada lagi yang
     * perlu dikirim.
     */
    stop() {
      clearTimeout(pendingTimer);
      pendingTimer = null;
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
      if (inFlight || !state().enabled) return;
      clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => { syncNow(); }, SYNC_DEBOUNCE_MS);
    },
  };
}
