# Runbook — Cara Mengoperasikan & Memulihkan Sistem

Untuk pemilik sistem (orang tua/pengembang). Semua perintah dijalankan dari akar repositori.

---

## 1. Menjalankan di komputer sendiri

```bash
npm run dev          # build lalu sajikan di http://localhost:4173
npm test             # 121 test: unit, integrasi, e2e
npm run build        # hasilkan dist/ saja
npm run icons        # buat ulang ikon PWA (butuh python3)
```

Tidak ada `npm install` — proyek ini tanpa dependensi.

## 2. Deploy ke Cloudflare

### Jalur A — otomatis lewat GitHub Actions (dianjurkan)

Sekali pasang:

1. Buat API token di Cloudflare: **My Profile → API Tokens → Create Token →
   Edit Cloudflare Workers**.
2. Salin **Account ID** dari **Workers & Pages → Overview**.
3. Di GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

Setelah itu setiap `push` ke `main` otomatis: test → build → deploy.
Bila kedua secret belum ada, langkah deploy dilewati (CI tetap hijau).

### Jalur B — manual dari komputer

```bash
npx wrangler@4 login
npm run deploy
```

### Jalur C — Cloudflare Pages (tanpa token)

**Workers & Pages → Create → Pages → Connect to Git**, lalu isi:

| Kolom | Nilai |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Framework preset | None |

## 3. Memasang aplikasi di perangkat

**iPhone / iPad (wajib Safari):** buka URL → tombol **Bagikan** →
**Tambahkan ke Layar Utama** → **Tambah**.

**Android / Chrome:** buka URL → menu **⋮** → **Instal aplikasi** /
**Tambahkan ke Layar utama**. Bila tombol **Pasang Sekarang** muncul di
Area Orang Tua, itu jalan tercepat.

**Mac Safari:** **File → Tambahkan ke Dock**.

Petunjuk yang sama tersedia di dalam aplikasi: tab **Orang Tua → Pasang Sebagai Aplikasi**.

## 4. Merilis versi baru

1. Naikkan `APP_VERSION` di `src/config/environment.js` (mis. `1.0.0` → `1.1.0`).
   Ini yang membuat cache lama dibuang — **jangan dilewati**.
2. `npm test` harus hijau.
3. `git push` ke `main`; Actions mengurus sisanya.
4. Di perangkat terpasang, pembaruan terpakai setelah aplikasi ditutup lalu
   dibuka lagi saat daring; aplikasi memunculkan notifikasi kecil bila versi
   baru sudah siap.

## 5. Menambah materi belajar

| Yang ingin ditambah | Berkas | Catatan |
|---|---|---|
| Kata Indonesia | `src/domain/vocabulary.js` → `ID_RAW` | format `kata\|emoji\|su-ku-ka-ta\|arti inggris\|kategori`; suku kata harus menyusun kembali katanya (diuji otomatis) |
| Kata Inggris | `vocabulary.js` → `EN_RAW` | format `word\|emoji\|arti indonesia\|kategori` |
| Sight word | `vocabulary.js` → `SIGHT_RAW` | format `word\|arti indonesia` |
| Kalimat | `vocabulary.js` → `SENTENCES` | sertakan emoji yang mewakili |
| Unit/pelajaran baru | `src/domain/curriculum.js` → `UNITS` | pelajaran otomatis terpotong 6 materi |

Setelah menambah: `npm test` (test integritas kosakata & kurikulum akan menangkap
emoji kembar, suku kata salah, atau materi yang tidak dikenal).

## 6. Pemulihan masalah

| Gejala | Penyebab paling mungkin | Tindakan |
|---|---|---|
| Progres tiba-tiba nol | Data situs terhapus / dibuka di peramban berbeda | Pulihkan dari cadangan `.json` di **Orang Tua → Pulihkan dari Cadangan** |
| Tidak ada suara sama sekali | Audio belum "terbuka" di iOS | Ketuk sekali di mana saja lalu coba tombol 🔊; pastikan mode senyap mati |
| Suara Inggris ada, Indonesia tidak | Perangkat belum punya suara `id-ID` | Android: Setelan → Bahasa → Keluaran text-to-speech → pasang Bahasa Indonesia. iOS: Setelan → Aksesibilitas → Konten Lisan → Suara → Indonesia |
| Aplikasi tidak bisa dipasang di iPhone | Dibuka lewat Chrome/dalam aplikasi lain | Buka URL-nya di Safari |
| Aplikasi tetap versi lama | Service worker masih memegang cache | Tutup aplikasi sepenuhnya lalu buka lagi saat daring; bila perlu hapus dari layar utama lalu pasang ulang |
| Deploy gagal di Actions | Secret salah/kedaluwarsa | Buat ulang API token, perbarui secret, jalankan ulang workflow |

## 7. Cadangan rutin (disarankan)

Sebulan sekali: **Orang Tua → Simpan Cadangan (.json)**, lalu simpan berkasnya di
Google Drive/iCloud. Cadangan berisi seluruh progres, penguasaan kata, lencana,
dan riwayat harian; ukurannya beberapa puluh kilobyte.

## 8. Kontak & rujukan

- Standar arsitektur: `docs/architecture/STANDAR-ARSITEKTUR-v1.0.md`
- Keputusan arsitektur: `docs/architecture/adr/`
- Evaluasi & utang teknis: `docs/architecture/03-evaluation.md`
