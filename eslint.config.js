/**
 * Aturan mutu kode sesuai Standar Arsitektur §6.
 * Menegakkan batas kompleksitas McCabe (1976) dan menjaga aturan dependensi
 * antar lapisan: domain/ tidak boleh menyentuh vendor, framework, atau DOM.
 */
const BROWSER_GLOBALS = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly',
  localStorage: 'readonly', globalThis: 'readonly', console: 'readonly', fetch: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', requestAnimationFrame: 'readonly',
  performance: 'readonly', devicePixelRatio: 'readonly', Intl: 'readonly', URL: 'readonly',
  Blob: 'readonly', FileReader: 'readonly', SpeechSynthesisUtterance: 'readonly',
  AudioContext: 'readonly', caches: 'readonly', self: 'readonly',
};

const QUALITY_RULES = {
  // McCabe (1976): fungsi dengan kompleksitas > 10 wajib dipecah.
  complexity: ['error', 10],
  'max-depth': ['error', 4],
  'max-params': ['error', 4],
  'max-lines-per-function': ['error', { max: 120, skipComments: true, skipBlankLines: true }],
  eqeqeq: ['error', 'smart'],
  'no-var': 'error',
  'prefer-const': 'error',
  'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
};

export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: BROWSER_GLOBALS,
    },
    rules: QUALITY_RULES,
  },
  {
    // Aturan dependensi §4: lapisan domain tidak boleh menunjuk ke luar.
    files: ['src/domain/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['../adapters/*', '../../adapters/*', '../ui/*', '../../ui/*', '../config/*', '../../config/*', '../application/*', '../../application/*'],
            message: 'domain/ tidak boleh mengimpor lapisan luar (lihat docs/architecture/02-views/logical.md).' },
        ],
      }],
      'no-restricted-globals': ['error',
        { name: 'window', message: 'domain/ harus murni: DOM dilarang.' },
        { name: 'document', message: 'domain/ harus murni: DOM dilarang.' },
        { name: 'localStorage', message: 'Akses penyimpanan hanya lewat ProgressRepository.' },
        { name: 'fetch', message: 'domain/ tidak boleh memanggil jaringan.' },
      ],
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'Pakai RandomPort agar domain tetap deterministik.' },
        { object: 'Date', property: 'now', message: 'Pakai ClockPort agar domain tetap bisa diuji.' },
      ],
    },
  },
  {
    files: ['src/application/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['../adapters/*', '../../adapters/*', '../ui/*', '../../ui/*'],
            message: 'application/ hanya boleh bergantung pada domain/ dan ports/.' },
        ],
      }],
    },
  },
];
