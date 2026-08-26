/**
 * Ilustrasi: panggung bergambar dan maskot.
 *
 * Semua gambar berupa SVG yang ditulis langsung di sini — tanpa berkas gambar,
 * tanpa permintaan jaringan — sehingga tetap tajam di layar apa pun, ringan,
 * dan ikut berfungsi saat aplikasi dipakai offline.
 *
 * Pemandangan dipilih dari kategori materi, sehingga kucing muncul di hutan,
 * roti di atas meja, dan mobil di jalan. Emoji materi menjadi "tokoh" di depan
 * pemandangan itu.
 */
import { el } from '../dom.js';

const sky = (id, from, to) => `
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="320" height="180" fill="url(#${id})"/>`;

const sun = (x = 268, y = 34, r = 20) => `
  <circle cx="${x}" cy="${y}" r="${r}" fill="#fde047"/>
  <circle cx="${x}" cy="${y}" r="${r + 8}" fill="#fde047" opacity=".28"/>`;

const cloud = (x, y, scale = 1) => `
  <g transform="translate(${x} ${y}) scale(${scale})" fill="#ffffff" opacity=".92">
    <ellipse cx="0" cy="0" rx="20" ry="13"/><ellipse cx="17" cy="4" rx="15" ry="10"/>
    <ellipse cx="-16" cy="4" rx="13" ry="9"/>
  </g>`;

/** Setiap pemandangan berukuran 320×180 dengan "lantai" di sekitar y=150. */
const SCENES = {
  langit: `${sky('sky-langit', '#8ec5ff', '#dff1ff')}${sun()}${cloud(60, 40)}${cloud(180, 26, .8)}
    <path d="M0 150 Q60 108 120 150 T320 150 V180 H0Z" fill="#86efac"/>
    <path d="M0 162 Q80 132 170 162 T320 158 V180 H0Z" fill="#4ade80"/>`,

  hutan: `${sky('sky-hutan', '#a7d8ff', '#e8f7ff')}${cloud(240, 32, .7)}
    <g fill="#166534">
      <circle cx="40" cy="96" r="30"/><circle cx="68" cy="110" r="22"/><circle cx="14" cy="112" r="20"/>
      <circle cx="278" cy="86" r="26"/><circle cx="300" cy="106" r="20"/>
    </g>
    <rect x="34" y="118" width="12" height="36" rx="5" fill="#78350f"/>
    <rect x="272" y="106" width="11" height="48" rx="5" fill="#78350f"/>
    <path d="M0 148 Q80 128 160 148 T320 144 V180 H0Z" fill="#4ade80"/>
    <g fill="#22c55e"><circle cx="110" cy="158" r="12"/><circle cx="126" cy="162" r="9"/>
      <circle cx="212" cy="160" r="11"/></g>`,

  rumah: `<rect width="320" height="180" fill="#fde8d7"/>
    <rect x="0" y="0" width="320" height="120" fill="#fef3e2"/>
    <g><rect x="28" y="26" width="72" height="58" rx="8" fill="#bae6fd" stroke="#f59e0b" stroke-width="5"/>
      <path d="M64 26v58M28 55h72" stroke="#f59e0b" stroke-width="5"/></g>
    <g><rect x="222" y="30" width="64" height="48" rx="6" fill="#fff" stroke="#a16207" stroke-width="5"/>
      <circle cx="243" cy="50" r="8" fill="#fbbf24"/><path d="M226 74l22-22 16 16 12-10 10 16z" fill="#86efac"/></g>
    <rect x="0" y="118" width="320" height="62" fill="#f3d5b5"/>
    <rect x="60" y="140" width="200" height="30" rx="12" fill="#fca5a5" opacity=".8"/>`,

  meja: `${sky('sky-meja', '#fef3c7', '#fffbeb')}
    <rect x="0" y="120" width="320" height="60" fill="#c084fc" opacity=".28"/>
    <rect x="0" y="112" width="320" height="14" rx="7" fill="#f472b6"/>
    <ellipse cx="160" cy="152" rx="112" ry="20" fill="#ffffff" opacity=".85"/>
    <ellipse cx="160" cy="152" rx="92" ry="15" fill="#fef9c3"/>
    <g fill="#fbbf24" opacity=".55"><circle cx="46" cy="60" r="7"/><circle cx="286" cy="52" r="6"/>
      <circle cx="248" cy="86" r="5"/><circle cx="72" cy="94" r="5"/></g>`,

  jalan: `${sky('sky-jalan', '#93c5fd', '#e0f2fe')}${sun(52, 32, 16)}${cloud(210, 34, .85)}
    <g fill="#cbd5e1"><rect x="16" y="66" width="46" height="62" rx="6"/>
      <rect x="72" y="84" width="36" height="44" rx="6"/><rect x="240" y="72" width="52" height="56" rx="6"/></g>
    <g fill="#93c5fd"><rect x="24" y="76" width="12" height="12" rx="3"/><rect x="42" y="76" width="12" height="12" rx="3"/>
      <rect x="250" y="84" width="14" height="12" rx="3"/><rect x="270" y="84" width="14" height="12" rx="3"/></g>
    <rect x="0" y="126" width="320" height="54" fill="#64748b"/>
    <rect x="0" y="124" width="320" height="6" fill="#f8fafc"/>
    <g fill="#fef08a"><rect x="20" y="150" width="34" height="6" rx="3"/><rect x="86" y="150" width="34" height="6" rx="3"/>
      <rect x="152" y="150" width="34" height="6" rx="3"/><rect x="218" y="150" width="34" height="6" rx="3"/></g>`,

  laut: `${sky('sky-laut', '#7dd3fc', '#e0f7ff')}${sun(266, 38, 18)}${cloud(70, 34, .9)}
    <path d="M0 122 Q40 110 80 122 T160 122 T240 122 T320 122 V180 H0Z" fill="#38bdf8"/>
    <path d="M0 140 Q40 128 80 140 T160 140 T240 140 T320 140 V180 H0Z" fill="#0ea5e9"/>
    <path d="M0 158 Q40 148 80 158 T160 158 T240 158 T320 158 V180 H0Z" fill="#0284c7"/>`,

  pelangi: `${sky('sky-pelangi', '#e9d5ff', '#fdf4ff')}
    <g fill="none" stroke-width="13" stroke-linecap="round">
      <path d="M40 168 A120 120 0 0 1 280 168" stroke="#ef4444"/>
      <path d="M56 168 A104 104 0 0 1 264 168" stroke="#f97316"/>
      <path d="M72 168 A88 88 0 0 1 248 168" stroke="#facc15"/>
      <path d="M88 168 A72 72 0 0 1 232 168" stroke="#22c55e"/>
      <path d="M104 168 A56 56 0 0 1 216 168" stroke="#3b82f6"/>
      <path d="M120 168 A40 40 0 0 1 200 168" stroke="#a855f7"/>
    </g>${cloud(44, 158, 1.05)}${cloud(276, 158, 1.05)}`,

  kelas: `<rect width="320" height="180" fill="#fef9f3"/>
    <rect x="24" y="18" width="272" height="104" rx="10" fill="#166534"/>
    <rect x="30" y="24" width="260" height="92" rx="7" fill="#15803d"/>
    <g fill="#ffffff" opacity=".85" font-family="ui-rounded, system-ui" font-weight="700" font-size="21">
      <text x="44" y="56">A</text><text x="44" y="84">B</text><text x="44" y="112">C</text>
      <text x="252" y="56">1</text><text x="252" y="84">2</text><text x="252" y="112">3</text>
    </g>
    <rect x="24" y="122" width="272" height="9" rx="4" fill="#a16207"/>
    <rect x="0" y="140" width="320" height="40" fill="#fcd9b6"/>`,
};

/** Kategori materi ➜ pemandangan yang cocok. */
const SCENE_BY_CATEGORY = {
  hewan: 'hutan', animal: 'hutan',
  alam: 'langit', nature: 'langit',
  makanan: 'meja', food: 'meja',
  kendaraan: 'jalan', vehicle: 'jalan',
  tubuh: 'rumah', body: 'rumah', keluarga: 'rumah', family: 'rumah',
  warna: 'pelangi', color: 'pelangi',
  benda: 'kelas', thing: 'kelas', sight: 'kelas',
};

export const DEFAULT_SCENE = 'langit';

/**
 * Nama pemandangan untuk sebuah kategori materi.
 * @param {string} [category]
 * @returns {string}
 */
export function sceneForCategory(category) {
  return SCENE_BY_CATEGORY[category] || DEFAULT_SCENE;
}

/**
 * Panggung bergambar: pemandangan di belakang, tokoh (emoji) di depan.
 * @param {{scene?: string, emoji?: string, text?: string, size?: 'besar'|'sedang'}} options
 * @returns {HTMLElement}
 */
export function createStage({ scene = DEFAULT_SCENE, emoji, text, size = 'besar' }) {
  const stage = el('div', { class: `stage stage--${size}` });
  stage.innerHTML = `<svg class="stage__scene" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"
    role="presentation" aria-hidden="true">${SCENES[scene] || SCENES[DEFAULT_SCENE]}</svg>`;
  if (emoji) stage.append(el('div', { class: 'stage__subject', text: emoji }));
  if (text) stage.append(el('div', { class: 'stage__caption', text }));
  return stage;
}

/* ------------------------------------------------------------------ */
/* Maskot                                                              */
/* ------------------------------------------------------------------ */

const MASCOT_EYES = {
  senang: '<circle cx="-13" cy="-6" r="4.5" fill="#1f1633"/><circle cx="13" cy="-6" r="4.5" fill="#1f1633"/>',
  sorak: '<path d="M-19 -8q6 -8 12 0" stroke="#1f1633" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M7 -8q6 -8 12 0" stroke="#1f1633" stroke-width="4" fill="none" stroke-linecap="round"/>',
  peduli: '<circle cx="-13" cy="-5" r="4" fill="#1f1633"/><circle cx="13" cy="-5" r="4" fill="#1f1633"/><path d="M-21 -16q8 -5 16 -1M5 -17q8 -4 16 1" stroke="#78350f" stroke-width="3" fill="none" stroke-linecap="round"/>',
};

/**
 * Maskot burung hantu "Kiko".
 * @param {{mood?: 'senang'|'sorak'|'peduli', size?: number}} [options]
 * @returns {HTMLElement}
 */
export function createMascot({ mood = 'senang', size = 76 } = {}) {
  const wingAngle = mood === 'sorak' ? -34 : -6;
  const wrapper = el('div', { class: `mascot mascot--${mood}`, style: { width: `${size}px` } });
  wrapper.innerHTML = `
    <svg viewBox="-60 -70 120 132" role="img" aria-label="Kiko si burung hantu">
      <ellipse cx="0" cy="52" rx="26" ry="6" fill="#000" opacity=".14"/>
      <g transform="translate(-30 6) rotate(${wingAngle})">
        <ellipse cx="0" cy="8" rx="11" ry="24" fill="#a855f7"/>
      </g>
      <g transform="translate(30 6) rotate(${-wingAngle})">
        <ellipse cx="0" cy="8" rx="11" ry="24" fill="#a855f7"/>
      </g>
      <ellipse cx="0" cy="6" rx="34" ry="38" fill="#7c3aed"/>
      <ellipse cx="0" cy="16" rx="23" ry="26" fill="#f5d0fe"/>
      <path d="M-34 -14q10 -22 34 -22t34 22z" fill="#8b5cf6"/>
      <g><circle cx="-13" cy="-6" r="13" fill="#fff"/><circle cx="13" cy="-6" r="13" fill="#fff"/>
        ${MASCOT_EYES[mood] || MASCOT_EYES.senang}</g>
      <path d="M0 2l-7 8h14z" fill="#f59e0b"/>
      <g fill="#f59e0b"><path d="M-14 44l-6 8h12z"/><path d="M14 44l-6 8h12z"/></g>
      <path d="M-26 -34l-8 -14 16 4z" fill="#7c3aed"/>
      <path d="M26 -34l8 -14 -16 4z" fill="#7c3aed"/>
    </svg>`;
  return wrapper;
}
