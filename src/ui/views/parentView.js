/**
 * Layar "Orang Tua" — statistik belajar, pengaturan suara, cara memasang
 * aplikasi, serta cadangan/pemulihan data.
 */
import { el, render, formatNumber, escapeHtml } from '../dom.js';
import { showToast } from '../components/effects.js';
import { formatDayLabel } from '../../shared/calendar.js';

const INSTALL_STEPS = {
  ios: [
    'Buka aplikasi ini di Safari (bukan Chrome).',
    'Ketuk tombol Bagikan (kotak dengan panah ke atas).',
    'Pilih "Tambahkan ke Layar Utama" / "Add to Home Screen".',
    'Ketuk "Tambah". Ikonnya akan muncul di layar utama seperti aplikasi biasa.',
  ],
  safari: [
    'Buka menu Berkas / File di Safari Mac.',
    'Pilih "Tambahkan ke Dock".',
    'Aplikasi akan terbuka di jendelanya sendiri.',
  ],
  other: [
    'Ketuk menu ⋮ di Chrome.',
    'Pilih "Tambahkan ke Layar utama" atau "Instal aplikasi".',
    'Konfirmasi dengan "Instal".',
  ],
};

function toggleRow({ label, hint, checked, onChange }) {
  const button = el('button', {
    class: 'switch',
    type: 'button',
    role: 'switch',
    'aria-checked': String(checked),
    'aria-label': label,
    on: {
      click: () => {
        const next = button.getAttribute('aria-checked') !== 'true';
        button.setAttribute('aria-checked', String(next));
        onChange(next);
      },
    },
  });
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting__label' }, [
      el('div', { text: label }),
      hint ? el('div', { class: 'setting__hint', text: hint }) : null,
    ]),
    button,
  ]);
}

function selectRow({ label, hint, value, options, onChange }) {
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting__label' }, [
      el('div', { text: label }),
      hint ? el('div', { class: 'setting__hint', text: hint }) : null,
    ]),
    el('select', {
      on: { change: (event) => onChange(event.currentTarget.value) },
    }, options.map((option) => el('option', {
      value: option.value,
      selected: String(option.value) === String(value) ? true : null,
      text: option.label,
    }))),
  ]);
}

function historyChart(history) {
  const maxXp = Math.max(10, ...history.map((day) => day.xp || 0));
  return el('div', { class: 'chart' }, history.map((day) => el('div', { class: 'chart__bar' }, [
    el('div', {
      class: 'chart__value',
      style: { height: `${Math.round(((day.xp || 0) / maxXp) * 100)}%` },
      title: `${formatDayLabel(day.day)} • ${day.xp} XP`,
    }),
    el('span', { text: day.day.slice(-2) }),
  ])));
}

/** Ringkasan angka belajar + grafik 14 hari. */
function summarySection(summary, history) {
  const boxes = [
    [formatNumber(summary.xp), 'TOTAL XP'],
    [`${Math.round(summary.accuracy * 100)}%`, 'KETEPATAN'],
    [`${summary.mastered}/${summary.totalWords}`, 'KATA DIKUASAI'],
    [`${summary.masteredId} / ${summary.masteredEn}`, 'ID / EN DIKUASAI'],
  ];
  return el('div', { class: 'card' }, [
    el('div', { class: 'stat-grid' }, boxes.map(([value, label]) => el('div', {
      class: 'stat-box',
    }, [el('b', { text: value }), el('span', { text: label })]))),
    el('div', { class: 'section-title', style: { marginTop: '18px' }, text: 'XP 14 Hari Terakhir' }),
    historyChart(history),
  ]);
}

/** Pengaturan nama anak, efek suara, dan pengucapan. */
/** Langkah memasang suara Bahasa Indonesia per jenis perangkat. */
const VOICE_INSTALL_STEPS = {
  ios: [
    'Buka Setelan (Settings) di perangkat.',
    'Pilih Aksesibilitas → Konten Lisan → Suara.',
    'Pilih Bahasa Indonesia, lalu unduh suaranya.',
    'Kembali ke aplikasi ini dan tekan "Uji Suara".',
  ],
  other: [
    'Buka Setelan perangkat.',
    'Pilih Sistem → Bahasa & masukan → Keluaran text-to-speech.',
    'Ketuk ikon roda gigi → Instal data suara → Bahasa Indonesia.',
    'Kembali ke aplikasi ini dan tekan "Uji Suara".',
  ],
};

/**
 * Peringatan bila perangkat tidak punya suara Bahasa Indonesia.
 *
 * Tanpa suara itu, mesin suara Inggris akan membaca teks Indonesia dengan
 * aturan ejaannya sendiri. Aplikasi sudah mengeja ulang teksnya supaya
 * bunyinya mendekati benar, tetapi memasang suara Indonesia jauh lebih baik —
 * karena itu peringatannya dibuat menonjol, bukan sekadar catatan kecil.
 */
function indonesianVoiceWarning({ speech, browser }) {
  if (speech.isAvailable('id')) return null;
  const steps = VOICE_INSTALL_STEPS[browser === 'ios' ? 'ios' : 'other'];

  return el('div', {
    class: 'card',
    style: { borderColor: 'var(--gold)', borderWidth: '2px' },
  }, [
    el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
      el('span', { style: { fontSize: '26px' }, text: '🔈' }),
      el('div', {}, [
        el('div', { style: { fontWeight: '900' }, text: 'Suara Bahasa Indonesia belum terpasang' }),
        el('div', {
          class: 'muted',
          style: { fontSize: '13.5px', marginTop: '2px' },
          text: 'Sementara ini kata Indonesia dibacakan sedekat mungkin memakai suara yang ada. Pasang suara Indonesia agar pelafalannya benar-benar tepat.',
        }),
      ]),
    ]),
    el('ol', { class: 'install-steps' }, steps.map((step) => el('li', { text: step }))),
  ]);
}

/** Contoh yang paling sering dilaporkan salah bunyinya. */
const DIAGNOSIS_SAMPLES = [
  { label: 'suku kata b', text: 'ba, bi, bu, be, bo', lang: 'id' },
  { label: 'suku kata c', text: 'ca, ci, cu, ce, co', lang: 'id' },
  { label: 'kata', text: 'kucing', lang: 'id' },
  { label: 'Inggris', text: 'cat', lang: 'en' },
];

/** Susun laporan diagnosa sebagai teks polos, siap disalin dan dikirim. */
function speechReport({ speech, appVersion }) {
  const voices = speech.allVoices();
  const baris = [
    `Baca Yuk v${appVersion}`,
    `Suara terdeteksi: ${voices.length}`,
    ...voices.map((voice) => `  - ${voice.name} [${voice.lang}]${voice.local ? ' lokal' : ''}`),
    `Ada suara Indonesia: ${speech.isAvailable('id') ? 'ya' : 'tidak'}`,
    `Ada suara Inggris: ${speech.isAvailable('en') ? 'ya' : 'tidak'}`,
    '',
  ];
  DIAGNOSIS_SAMPLES.forEach((sample) => {
    const hasil = speech.describe(sample.text, sample.lang);
    baris.push(
      `${sample.label} (${sample.lang}): "${sample.text}"`,
      `  dikirim  : "${hasil.text}"${hasil.respelled ? ' (dieja ulang)' : ''}`,
      `  suara    : ${hasil.voiceName || '(bawaan perangkat)'} [${hasil.voiceLang || '-'}]`,
      `  tag bahasa: ${hasil.lang || '-'}`,
    );
  });
  return baris.join('\n');
}

/**
 * Diagnosa suara — menjawab "kenapa bunyinya masih salah?" dengan fakta.
 *
 * Ada karena sebuah bug pelafalan sempat diperbaiki tiga kali tanpa pernah
 * benar-benar diketahui apa yang terjadi di perangkat orang tua. Menebak dari
 * jauh memakan waktu berhari-hari; satu laporan yang bisa disalin
 * menyelesaikannya dalam satu putaran.
 */
function speechDiagnosis({ speech, appVersion, toastHost }) {
  const report = speechReport({ speech, appVersion });
  const box = el('pre', {
    class: 'diagnosis',
    text: report,
  });

  const salin = el('button', {
    class: 'btn btn--block mt-12',
    type: 'button',
    text: '📋 Salin laporan ini',
    on: {
      click: async () => {
        try {
          await globalThis.navigator.clipboard.writeText(report);
          showToast(toastHost, 'Laporan disalin — tempelkan ke percakapan.');
        } catch {
          showToast(toastHost, 'Peramban menolak menyalin. Sorot teksnya lalu salin manual.');
        }
      },
    },
  });

  const uji = el('button', {
    class: 'btn btn--block mt-12',
    type: 'button',
    text: '🔊 Bunyikan ba-bi-bu-be-bo',
    on: { click: () => speech.speak('ba, bi, bu, be, bo', 'id') },
  });

  return el('div', { class: 'card' }, [
    el('div', { style: { fontWeight: '900' }, text: '🩺 Diagnosa suara' }),
    el('p', {
      class: 'muted',
      text: 'Bila ada bunyi yang terdengar salah, bunyikan contohnya lalu salin laporan '
        + 'di bawah dan kirimkan. Isinya hanya daftar suara perangkat — tidak ada data pribadi.',
    }),
    uji,
    box,
    salin,
  ]);
}

function settingsSection({ profile, settings, speech, profileService, toastHost }) {
  // "Otomatis" bukan sekadar suara pertama: untuk Inggris, logat Australia
  // diutamakan bila terpasang. Labelnya menyebutkan itu supaya tidak menipu.
  const AUTO_LABEL = {
    id: 'Otomatis (bawaan perangkat)',
    en: 'Otomatis (utamakan Australia)',
  };
  const voiceOptions = (language) => [
    { value: '', label: AUTO_LABEL[language] },
    ...speech.voicesFor(language).map((voice) => ({ value: voice.id, label: voice.label })),
  ];

  return el('div', { class: 'card' }, [
    el('div', { class: 'setting' }, [
      el('div', { class: 'setting__label' }, [
        el('div', { text: 'Nama anak' }),
        el('div', { class: 'setting__hint', text: 'Tampil pada sapaan di halaman depan' }),
      ]),
      el('input', {
        type: 'text',
        value: escapeHtml(profile.learnerName),
        maxlength: 20,
        on: {
          change: (event) => {
            profileService.setLearnerName(event.currentTarget.value);
            showToast(toastHost, '✅ Nama disimpan');
          },
        },
      }),
    ]),
    el('div', { class: 'setting' }, [
      el('div', { class: 'setting__label' }, [
        el('div', { text: 'Cara baca nama' }),
        el('div', {
          class: 'setting__hint',
          text: 'Ditulis sesuai bunyinya untuk suara Bahasa Indonesia, mis. "Darlin" untuk Darlene',
        }),
      ]),
      el('input', {
        type: 'text',
        value: escapeHtml(profile.learnerSpokenName || ''),
        maxlength: 20,
        placeholder: profile.learnerName,
        on: {
          change: (event) => {
            profileService.setLearnerSpokenName(event.currentTarget.value);
            showToast(toastHost, '✅ Cara baca nama disimpan');
          },
        },
      }),
    ]),
    toggleRow({
      label: 'Efek suara',
      hint: 'Bunyi benar, salah, dan naik level',
      checked: settings.sound,
      onChange: (value) => profileService.setSetting('sound', value),
    }),
    toggleRow({
      label: 'Suara pengucapan',
      hint: speech.isAvailable('id')
        ? 'Membacakan kata Indonesia & Inggris'
        : 'Suara Bahasa Indonesia belum tersedia di perangkat ini',
      checked: settings.speech,
      onChange: (value) => profileService.setSetting('speech', value),
    }),
    selectRow({
      label: 'Kecepatan bicara',
      value: settings.speechRate,
      options: [
        { value: 0.7, label: 'Pelan sekali' },
        { value: 0.85, label: 'Pelan (disarankan)' },
        { value: 1, label: 'Normal' },
      ],
      onChange: (value) => profileService.setSetting('speechRate', Number(value)),
    }),
    selectRow({
      label: 'Suara Bahasa Indonesia',
      value: settings.indonesianVoiceId,
      options: voiceOptions('id'),
      onChange: (value) => profileService.setSetting('indonesianVoiceId', value),
    }),
    selectRow({
      label: 'Suara Bahasa Inggris',
      value: settings.englishVoiceId,
      options: voiceOptions('en'),
      onChange: (value) => profileService.setSetting('englishVoiceId', value),
    }),
    el('button', {
      class: 'btn btn--block mt-12',
      type: 'button',
      on: {
        click: () => {
          speech.speak(`Halo ${profileService.spokenName('id')}, ayo belajar membaca!`, 'id');
          setTimeout(
            () => speech.speak(`Hello ${profileService.spokenName('en')}, let us read!`, 'en'),
            2600,
          );
        },
      },
    }, [el('span', { text: '🔊 Uji Suara' })]),
  ]);
}

/** Petunjuk memasang aplikasi sesuai peramban yang dipakai. */
function installSection({ installPrompt, toastHost }) {
  if (installPrompt.isInstalled()) {
    return el('div', { class: 'card' }, [
      el('p', { text: '✅ Aplikasi sudah terpasang di perangkat ini.' }),
    ]);
  }
  const browser = installPrompt.browser();
  return el('div', { class: 'card' }, [
    el('p', {
      style: { fontSize: '14.5px' },
      text: browser === 'ios'
        ? 'Di iPhone/iPad, pemasangan dilakukan lewat Safari:'
        : 'Ikuti langkah berikut untuk memasang aplikasi:',
    }),
    el('ol', { class: 'install-steps' }, INSTALL_STEPS[browser].map((step) => el('li', { text: step }))),
    installPrompt.canPrompt() ? el('button', {
      class: 'btn btn--primary btn--block mt-12',
      type: 'button',
      on: {
        click: async () => {
          const accepted = await installPrompt.prompt();
          showToast(toastHost, accepted ? '🎉 Aplikasi terpasang!' : 'Pemasangan dibatalkan');
        },
      },
    }, [el('span', { text: '📲 Pasang Sekarang' })]) : null,
  ].filter(Boolean));
}

/** Waktu sinkronisasi terakhir dalam bahasa sehari-hari. */
function lastSyncLabel(status) {
  if (!status.lastSyncAt) return 'Belum pernah tersinkron';
  const moment = new Date(status.lastSyncAt).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  return `Terakhir tersinkron ${moment}`;
}

/** Bagian sinkronisasi antar perangkat — otomatis, tanpa kode (ADR-0009). */
function syncSection({ syncService, toastHost, refresh }) {
  const status = syncService.status();

  async function run(button, action, busyLabel) {
    const label = button.querySelector('span');
    const original = label.textContent;
    button.disabled = true;
    label.textContent = busyLabel;
    const result = await action();
    button.disabled = false;
    label.textContent = original;
    showToast(toastHost, result.ok ? `✅ ${result.message}` : `⚠️ ${result.message}`);
    refresh();
  }

  if (!status.enabled) {
    return el('div', { class: 'card' }, [
      el('p', {
        style: { fontSize: '14.5px' },
        text: 'Sinkronisasi dimatikan di perangkat ini. Progres tetap tersimpan lokal, tetapi tidak mengikuti ke perangkat lain.',
      }),
      el('button', {
        class: 'btn btn--primary btn--block mt-12',
        type: 'button',
        on: {
          click: (event) => run(event.currentTarget, () => syncService.enable(), 'Menyalakan…'),
        },
      }, [el('span', { text: '☁️ Nyalakan Sinkronisasi' })]),
    ]);
  }

  const tone = status.lastStatus === 'error' ? '⚠️' : '✅';
  return el('div', { class: 'card' }, [
    el('div', { class: 'row', style: { gap: '12px' } }, [
      el('span', { style: { fontSize: '30px' }, text: '☁️' }),
      el('div', {}, [
        el('div', { style: { fontWeight: '900' }, text: 'Sinkronisasi otomatis aktif' }),
        el('div', {
          class: 'muted',
          style: { fontSize: '13.5px' },
          text: 'Progres Darlene mengikuti sendiri ke setiap perangkat yang membuka aplikasi ini.',
        }),
      ]),
    ]),
    el('p', {
      class: 'muted mt-12',
      style: { fontSize: '13px' },
      text: `${tone} ${lastSyncLabel(status)}${status.message ? ` • ${status.message}` : ''}`,
    }),
    el('button', {
      class: 'btn btn--block mt-12',
      type: 'button',
      on: {
        click: (event) => run(event.currentTarget, () => syncService.syncNow(), 'Menyinkronkan…'),
      },
    }, [el('span', { text: '🔄 Sinkronkan Sekarang' })]),
    el('button', {
      class: 'btn btn--ghost btn--block mt-12',
      type: 'button',
      on: {
        click: () => {
          syncService.disable();
          showToast(toastHost, 'Sinkronisasi dimatikan. Progres di perangkat ini tetap utuh.');
          refresh();
        },
      },
    }, [el('span', { text: 'Matikan di perangkat ini' })]),
  ]);
}

/** Simpan cadangan ke berkas .json di perangkat. */
function downloadBackup(profileService, profile, toastHost) {
  const blob = new Blob([profileService.exportBackup()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a', {
    href: url,
    download: `cadangan-baca-${profile.learnerName.toLowerCase()}-${profile.daily.day}.json`,
  });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(toastHost, '💾 Cadangan tersimpan');
}

/** Baca berkas cadangan lalu pulihkan progres. */
function restoreBackup(file, { profileService, toastHost, refresh }) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      profileService.importBackup(String(reader.result));
      showToast(toastHost, '✅ Data berhasil dipulihkan');
      refresh();
    } catch (error) {
      showToast(toastHost, `⚠️ ${error.message}`);
    }
  };
  reader.readAsText(file);
}

/** Cadangan, pemulihan, dan reset progres. */
function dataSection({ profileService, profile, toastHost, refresh }) {
  return el('div', { class: 'card' }, [
    el('p', {
      class: 'muted',
      style: { fontSize: '14px' },
      text: 'Semua progres disimpan di perangkat ini saja dan tidak dikirim ke mana pun. Simpan cadangan sebelum ganti perangkat.',
    }),
    el('button', {
      class: 'btn btn--block mt-12',
      type: 'button',
      on: { click: () => downloadBackup(profileService, profile, toastHost) },
    }, [el('span', { text: '💾 Simpan Cadangan (.json)' })]),
    el('label', { class: 'btn btn--block mt-12', style: { cursor: 'pointer' } }, [
      el('span', { text: '📂 Pulihkan dari Cadangan' }),
      el('input', {
        type: 'file',
        accept: 'application/json,.json',
        style: { display: 'none' },
        on: {
          change: (event) => {
            const [file] = event.currentTarget.files;
            if (file) restoreBackup(file, { profileService, toastHost, refresh });
            event.currentTarget.value = '';
          },
        },
      }),
    ]),
    el('button', {
      class: 'btn btn--danger btn--block mt-12',
      type: 'button',
      on: {
        click: () => {
          const confirmed = globalThis.confirm(
            'Hapus semua progres dan mulai dari awal? Tindakan ini tidak bisa dibatalkan.',
          );
          if (!confirmed) return;
          profileService.reset();
          showToast(toastHost, '🧹 Progres direset');
          refresh();
        },
      },
    }, [el('span', { text: '🗑️ Reset Semua Progres' })]),
  ]);
}

/**
 * @param {HTMLElement} host
 * @param {object} context
 */
export function renderParentView(host, context) {
  const {
    profileService, queryService, speech, installPrompt, toastHost, refresh, appVersion,
    syncService,
  } = context;
  const profile = profileService.get();

  render(
    host,
    el('div', { class: 'hero' }, [
      el('span', { class: 'hero__mascot', text: '👪' }),
      el('div', {}, [
        el('div', { class: 'hero__title', text: 'Area Orang Tua' }),
        el('div', { class: 'hero__subtitle', text: 'Pantau kemajuan & atur aplikasi' }),
      ]),
    ]),

    el('div', { class: 'section-title', text: 'Ringkasan Belajar' }),
    summarySection(profileService.summary(), queryService.dailyHistory(14)),

    indonesianVoiceWarning({ speech, browser: installPrompt.browser() }),

    speechDiagnosis({ speech, appVersion, toastHost }),

    el('div', { class: 'section-title', text: 'Pengaturan' }),
    settingsSection({
      profile, settings: profileService.settings(), speech, profileService, toastHost,
    }),

    el('div', { class: 'section-title', text: 'Pasang Sebagai Aplikasi' }),
    installSection({ installPrompt, toastHost }),

    el('div', { class: 'section-title', text: 'Sinkronisasi Antar Perangkat' }),
    syncSection({ syncService, toastHost, refresh }),

    el('div', { class: 'section-title', text: 'Data & Cadangan' }),
    dataSection({ profileService, profile, toastHost, refresh }),

    el('p', {
      class: 'center muted mt-18',
      style: { fontSize: '12.5px' },
      text: `Baca Yuk, Darlene! v${appVersion} • dibuat dengan ❤️ untuk ${profile.learnerName}`,
    }),
  );
}
