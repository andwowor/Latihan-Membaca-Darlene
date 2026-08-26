/**
 * PORT (outbound) — sinkronisasi progres antar perangkat.
 *
 * Keputusan yang disembunyikan: bagaimana dan ke mana progres dipertukarkan.
 * Hari ini lewat HTTP ke Worker milik sendiri; besok bisa lewat mekanisme lain
 * tanpa mengubah domain maupun lapisan aplikasi.
 *
 * @typedef {Object} SyncPort
 * @property {(syncCode: string) => Promise<{profile: object, updatedAt: number}|null>} pull
 *   Ambil profil tersimpan; null bila kode itu belum punya data.
 * @property {(syncCode: string, profile: object) => Promise<{profile: object, updatedAt: number}>} push
 *   Kirim profil; server menggabungkannya dan mengembalikan hasil gabungan.
 */

export const SYNC_PORT_METHODS = ['pull', 'push'];
