/**
 * PORT (outbound) — penyimpanan progres belajar.
 *
 * Keputusan yang disembunyikan (Parnas 1972): DI MANA dan BAGAIMANA progres
 * disimpan. Hari ini localStorage di perangkat; besok bisa Cloudflare D1/KV
 * tanpa mengubah domain/ maupun application/.
 *
 * @typedef {Object} ProgressRepository
 * @property {() => (object|null)} load Ambil profil tersimpan, null bila belum ada.
 * @property {(profile: object) => void} save Simpan profil apa adanya.
 * @property {() => void} clear Hapus profil tersimpan.
 */

/** Metode wajib sebuah implementasi ProgressRepository. */
export const PROGRESS_REPOSITORY_METHODS = ['load', 'save', 'clear'];
