/**
 * ADAPTER (inbound, sisi server) — titik masuk HTTP Worker.
 *
 * Hanya melayani /api/progress; seluruh berkas aplikasi lain dilayani langsung
 * oleh lapisan static assets Cloudflare tanpa menyentuh kode ini
 * (lihat `run_worker_first` di wrangler.jsonc).
 *
 * Berkas ini tidak mengandung aturan bisnis: penggabungan profil memakai
 * fungsi domain yang sama persis dengan yang dipakai peramban.
 */
import { mergeProfiles } from '../../domain/merge.js';
import { normalizeSyncCode } from '../../domain/syncCode.js';
import { createD1ProfileStore } from '../outbound/d1ProfileStore.js';

/** Batas ukuran kiriman; profil normal berukuran puluhan kilobyte. */
export const MAX_PAYLOAD_BYTES = 512 * 1024;

const SYNC_CODE_HEADER = 'X-Sync-Code';
const API_PATH = '/api/progress';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

const jsonResponse = (body, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: JSON_HEADERS },
);

const errorResponse = (message, status) => jsonResponse({ error: message }, status);

/** Kunci baris = SHA-256 dari kode sinkron, supaya kode tidak tersimpan apa adanya. */
export async function hashSyncCode(code) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Apakah kiriman berbentuk profil yang masuk akal? */
export function looksLikeProfile(value) {
  return Boolean(value)
    && typeof value === 'object'
    && typeof value.experiencePoints === 'number'
    && typeof value.schemaVersion === 'number'
    && typeof value.lessons === 'object'
    && typeof value.words === 'object';
}

async function readProfileFromRequest(request) {
  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) return { error: 'Data terlalu besar.', status: 413 };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'Isi permintaan bukan JSON yang sah.', status: 400 };
  }
  const profile = parsed?.profile;
  if (!looksLikeProfile(profile)) return { error: 'Bentuk profil tidak dikenali.', status: 422 };
  return { profile };
}

async function handleGet(store, codeHash) {
  const stored = await store.load(codeHash);
  if (!stored) return errorResponse('Belum ada progres untuk kode ini.', 404);
  return jsonResponse({ profile: stored.profile, updatedAt: stored.updatedAt });
}

async function handlePut(store, codeHash, request, now) {
  const { profile, error, status } = await readProfileFromRequest(request);
  if (error) return errorResponse(error, status);

  const stored = await store.load(codeHash);
  // Yang tersimpan menjadi acuan, kiriman digabungkan ke atasnya: capaian
  // dari perangkat mana pun tidak bisa terhapus oleh perangkat lain.
  const merged = stored ? mergeProfiles(stored.profile, profile) : profile;
  const saved = await store.save(codeHash, merged, now);
  return jsonResponse({ profile: merged, updatedAt: saved.updatedAt });
}

/**
 * Tangani satu permintaan API.
 * @param {Request} request
 * @param {{store: object, now: () => number}} dependencies
 * @returns {Promise<Response>}
 */
export async function handleApiRequest(request, { store, now }) {
  const code = normalizeSyncCode(request.headers.get(SYNC_CODE_HEADER));
  if (!code) return errorResponse('Kode sinkron tidak sah.', 400);

  const codeHash = await hashSyncCode(code);
  if (request.method === 'GET') return handleGet(store, codeHash);
  if (request.method === 'PUT') return handlePut(store, codeHash, request, now());
  return errorResponse('Metode tidak didukung.', 405);
}

export default {
  /**
   * @param {Request} request
   * @param {{DB: object}} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== API_PATH) return errorResponse('Tidak ditemukan.', 404);
    if (!env?.DB) return errorResponse('Penyimpanan sinkronisasi belum disiapkan.', 503);

    try {
      return await handleApiRequest(request, {
        store: createD1ProfileStore(env.DB),
        now: () => Date.now(),
      });
    } catch (error) {
      console.error('Gagal melayani permintaan sinkronisasi', error);
      return errorResponse('Terjadi kesalahan di server.', 500);
    }
  },
};
