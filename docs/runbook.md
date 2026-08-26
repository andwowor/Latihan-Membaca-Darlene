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

Pilih **satu** jalur. Semuanya menghasilkan aplikasi yang sama.

### Jalur A — Workers Builds (paling mudah, tanpa token)

Cloudflare yang menarik kode dari GitHub dan membuat API token-nya sendiri.

1. Buka **Cloudflare Dashboard → Workers & Pages → Create → Import a repository**.
2. Hubungkan akun GitHub, pilih repo `Latihan-Membaca-Darlene`, cabang `main`.
3. Isi konfigurasi build:

   | Kolom | Nilai |
   |---|---|
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/` |

4. **Save and Deploy.** Setiap `push` ke `main` berikutnya ikut ter-deploy sendiri.

Konfigurasi `wrangler.jsonc` di repo sudah berisi nama Worker, folder aset
(`dist`), dan penanganan rute SPA — tidak ada yang perlu diisi lagi.

### Jalur B — GitHub Actions (kontrol penuh dari repo)

Dipakai bila ingin pipeline-nya ikut ter-versi di repositori
(`.github/workflows/deploy.yml` sudah siap).

1. Buat API token: **Cloudflare → My Profile → API Tokens → Create Token →
   template "Edit Cloudflare Workers" → Continue → Create Token**, lalu salin
   nilainya (hanya tampil sekali).
   Izin yang dibutuhkan template ini: *Account Settings (Read)*,
   *Workers Scripts (Edit)*, *User Details (Read)*, *Memberships (Read)*.
2. Salin **Account ID** dari **Workers & Pages → Overview** (panel kanan).
3. Di GitHub: **Settings → Secrets and variables → Actions → New repository secret**,
   buat dua secret:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

Setelah itu setiap `push` ke `main` otomatis: test → build → deploy.
Bila kedua secret belum ada, langkah deploy dilewati dan CI tetap hijau.

### Jalur C — manual dari komputer

```bash
npx wrangler@4 login     # buka browser untuk otorisasi
npm run deploy           # build lalu wrangler deploy
```

### Jalur D — Cloudflare Pages

Masih didukung, tetapi Cloudflare menganjurkan Workers Static Assets untuk
proyek baru. **Workers & Pages → Create → Pages → Connect to Git**, lalu isi:

| Kolom | Nilai |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Framework preset | None |

### Alamat aplikasi

Setelah deploy pertama berhasil, URL-nya berbentuk
`https://baca-yuk-darlene.<subdomain-akun>.workers.dev`
(terlihat di log deploy dan di halaman Worker).

Bila deploy pertama gagal dengan keluhan soal *workers.dev subdomain*, buka
**Workers & Pages → Overview**, daftarkan subdomain akun sekali saja, lalu
jalankan ulang deploy.

Nama `baca-yuk-darlene` bisa diganti di `wrangler.jsonc` bila diinginkan.

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
| Deploy gagal: `Missing entry-point` | Wrangler yang dipakai lebih tua dari 3.91, yaitu sebelum Workers mendukung deployment assets-only | Pakai wrangler 4 (`npx wrangler@4 deploy`). Workflow di repo sudah mematoknya |

## 7. Cadangan rutin (disarankan)

Sebulan sekali: **Orang Tua → Simpan Cadangan (.json)**, lalu simpan berkasnya di
Google Drive/iCloud. Cadangan berisi seluruh progres, penguasaan kata, lencana,
dan riwayat harian; ukurannya beberapa puluh kilobyte.

## 8. Kontak & rujukan

- Standar arsitektur: `docs/architecture/STANDAR-ARSITEKTUR-v1.0.md`
- Keputusan arsitektur: `docs/architecture/adr/`
- Evaluasi & utang teknis: `docs/architecture/03-evaluation.md`
