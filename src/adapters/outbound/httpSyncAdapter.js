/**
 * ADAPTER (outbound) — SyncPort lewat HTTP ke Worker milik sendiri.
 * Satu-satunya berkas sisi klien yang tahu bentuk API sinkronisasi.
 */

const ENDPOINT = './api/progress';
const HEADER = 'X-Sync-Code';
const TIMEOUT_MS = 12000;

async function requestJson(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (response.status === 404) return null;

    // Bila yang kembali bukan JSON, berarti permintaan tidak sampai ke API —
    // biasanya karena aplikasi dijalankan tanpa Worker (server statis biasa).
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!isJson) {
      throw new Error('Layanan sinkronisasi belum tersedia di alamat ini.');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Server menolak permintaan (${response.status}).`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {{baseUrl?: string}} [options]
 * @returns {import('../../ports/SyncPort.js').SyncPort}
 */
export function createHttpSyncAdapter(options = {}) {
  const endpoint = options.baseUrl ? `${options.baseUrl}/api/progress` : ENDPOINT;

  /**
   * Tanpa kode, permintaan dikirim polos: server memakai profil keluarga
   * (ADR-0009). Parameter kode tetap dihormati agar jalur berbasis kode
   * bisa dihidupkan lagi tanpa mengubah adapter ini.
   */
  const headersFor = (syncCode, extra = {}) => (syncCode
    ? { [HEADER]: syncCode, ...extra }
    : { ...extra });

  return {
    async pull(syncCode) {
      return requestJson(endpoint, {
        method: 'GET',
        headers: headersFor(syncCode),
      });
    },

    async push(syncCode, profile) {
      return requestJson(endpoint, {
        method: 'PUT',
        headers: headersFor(syncCode, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ profile }),
      });
    },
  };
}

/** SyncPort kosong untuk perangkat/lingkungan tanpa jaringan. */
export function createNullSyncAdapter() {
  return {
    pull: async () => null,
    push: async (unusedCode, profile) => ({ profile, updatedAt: 0 }),
  };
}
