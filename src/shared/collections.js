/**
 * Utilitas koleksi murni (tanpa aturan bisnis, tanpa dependensi luar).
 * Lapisan: shared.
 */

/**
 * Potong array menjadi beberapa bagian berukuran `size`.
 * Sisa potongan terakhir yang lebih pendek dari `minTail` digabung
 * ke potongan sebelumnya.
 * @param {Array} items
 * @param {number} size
 * @param {number} [minTail=0]
 * @returns {Array<Array>}
 */
export function chunk(items, size, minTail = 0) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  if (minTail > 0 && result.length > 1 && result[result.length - 1].length < minTail) {
    const tail = result.pop();
    result[result.length - 1].push(...tail);
  }
  return result;
}

/**
 * Selang-seling dua daftar: a[0], b[0], a[1], b[1], ...
 * @param {Array} first
 * @param {Array} second
 * @returns {Array}
 */
export function interleave(first, second) {
  const result = [];
  const longest = Math.max(first.length, second.length);
  for (let index = 0; index < longest; index += 1) {
    if (index < first.length) result.push(first[index]);
    if (index < second.length) result.push(second[index]);
  }
  return result;
}

/**
 * Ambil `count` elemen pertama yang labelnya belum terpakai.
 * @param {Array} candidates
 * @param {(item: any) => string} labelOf
 * @param {Array<string>} usedLabels
 * @param {number} count
 * @returns {Array}
 */
export function takeDistinctBy(candidates, labelOf, usedLabels, count) {
  const used = new Set(usedLabels);
  const result = [];
  for (const candidate of candidates) {
    const label = labelOf(candidate);
    if (!label || used.has(label)) continue;
    used.add(label);
    result.push(candidate);
    if (result.length === count) break;
  }
  return result;
}

/**
 * Bangun peta indeks berdasarkan properti `id`.
 * @param {Array<{id: string}>} items
 * @returns {Object<string, any>}
 */
export function indexById(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
