/**
 * Fungsi acak murni. Semua fungsi menerima `random` (RandomPort) dari luar
 * supaya lapisan domain tetap deterministik dan bisa diuji.
 * Lapisan: shared.
 */

/**
 * Acak urutan array (Fisher–Yates) tanpa mengubah array asal.
 * @param {Array} items
 * @param {() => number} random pengembali angka [0,1)
 * @returns {Array}
 */
export function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [result[index], result[swapWith]] = [result[swapWith], result[index]];
  }
  return result;
}

/**
 * Ambil satu elemen acak.
 * @param {Array} items
 * @param {() => number} random
 */
export function pickOne(items, random) {
  return items[Math.floor(random() * items.length)];
}

/**
 * Pembangkit angka acak deterministik dari sebuah teks benih (seed).
 * Dipakai agar undian misi harian tetap sama sepanjang hari yang sama.
 * @param {string} seed
 * @returns {() => number}
 */
export function seededRandom(seed) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
