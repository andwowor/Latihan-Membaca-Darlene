/**
 * Pembantu DOM tingkat rendah untuk lapisan presentasi.
 * Tidak mengandung aturan bisnis apa pun.
 */

/**
 * Buat elemen.
 * @param {string} tag
 * @param {object} [props] atribut; `class`, `text`, `html`, `on` (peristiwa), sisanya atribut biasa
 * @param {Array<Node|string>} [children]
 * @returns {HTMLElement}
 */
const SPECIAL_PROPS = {
  class: (node, value) => { node.className = value; },
  text: (node, value) => { node.textContent = value; },
  html: (node, value) => { node.innerHTML = value; },
  dataset: (node, value) => Object.assign(node.dataset, value),
  style: (node, value) => Object.assign(node.style, value),
  on: (node, value) => Object.entries(value).forEach(
    ([eventName, handler]) => node.addEventListener(eventName, handler),
  ),
};

function applyProp(node, key, value) {
  if (value === null || value === undefined || value === false) return;
  const special = SPECIAL_PROPS[key];
  if (special) special(node, value);
  else node.setAttribute(key, value === true ? '' : String(value));
}

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => applyProp(node, key, value));
  (Array.isArray(children) ? children : [children])
    .filter((child) => child !== null && child !== undefined && child !== false)
    .forEach((child) => node.append(child));
  return node;
}

/** Kosongkan isi sebuah elemen. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Ganti seluruh isi elemen dengan anak-anak baru. */
export function render(host, ...children) {
  clear(host);
  children.filter(Boolean).forEach((child) => host.append(child));
  return host;
}

/** Amankan teks yang berasal dari masukan pengguna sebelum masuk ke HTML. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

/** Format angka dengan pemisah ribuan gaya Indonesia. */
export function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.round(value || 0));
}

/** Bintang penuh & kosong, mis. ★★☆ */
export function starRow(earned, total = 3) {
  return '★'.repeat(earned) + '☆'.repeat(Math.max(0, total - earned));
}
