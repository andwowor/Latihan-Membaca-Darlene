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
| Pemandangan ilustrasi baru | `src/ui/components/artwork.js` → `SCENES` + `SCENE_BY_CATEGORY` | SVG 320×180 dengan "lantai" di sekitar y=150 |

Setelah menambah: `npm test` (test integritas kosakata & kurikulum akan menangkap
emoji kembar, suku kata salah, atau materi yang tidak dikenal).

## 6. Pemulihan masalah

| Gejala | Penyebab paling mungkin | Tindakan |
|---|---|---|
| Progres tiba-tiba nol | Data situs terhapus / dibuka di peramban berbeda | Pulihkan dari cadangan `.json` di **Orang Tua → Pulihkan dari Cadangan** |
| Tidak ada suara sama sekali | Audio belum "terbuka" di iOS | Ketuk sekali di mana saja lalu coba tombol 🔊; pastikan mode senyap mati |
| Nama anak terdengar salah saat diucapkan | Mesin suara Indonesia membaca sesuai ortografi Indonesia, jadi nama serapan asing meleset | Isi **Orang Tua → Cara baca nama** dengan ejaan bunyinya, mis. `Darlin` untuk Darlene |
| Suara Inggris ada, Indonesia tidak | Perangkat belum punya suara `id-ID` | Android: Setelan → Bahasa → Keluaran text-to-speech → pasang Bahasa Indonesia. iOS: Setelan → Aksesibilitas → Konten Lisan → Suara → Indonesia |
| Aplikasi tidak bisa dipasang di iPhone | Dibuka lewat Chrome/dalam aplikasi lain | Buka URL-nya di Safari |
| Aplikasi tetap versi lama | Pembaruan belum sempat terunduh | Tutup aplikasi sepenuhnya lalu buka lagi **saat daring** — sejak 1.5.0 aplikasi memuat ulang dirinya sendiri sekali begitu versi baru siap, jadi cukup satu kali. Versi yang sedang berjalan tertulis di baris paling bawah Area Orang Tua |
| Deploy gagal di Actions | Secret salah/kedaluwarsa | Buat ulang API token, perbarui secret, jalankan ulang workflow |
| Sinkronisasi gagal terus | Tidak ada internet, atau Worker belum ter-deploy dengan binding D1 | Cek koneksi; pastikan deploy terakhir sukses dan `d1_databases` ada di `wrangler.jsonc` |
| Progres perangkat kedua tidak muncul | Perangkat pertama belum sempat mengirim, atau sinkronisasi dimatikan di salah satunya | Buka Orang Tua di perangkat pertama, tekan 🔄 Sinkronkan Sekarang, lalu buka ulang aplikasi di perangkat kedua |
| Huruf/suku kata Indonesia terdengar Inggris ("be" jadi "bi", "ca" jadi "ka") | Perangkat belum punya suara `id-ID`, jadi mesin Inggris memakai aturan ejaannya sendiri | Aplikasi sudah mengeja ulang otomatis sehingga bunyinya mendekati benar; untuk hasil terbaik pasang suara Bahasa Indonesia (lihat baris di atas dan panduan di Area Orang Tua) |
| API menjawab 503 | Binding D1 tidak terpasang di Worker | Deploy ulang; periksa `database_id` pada `wrangler.jsonc` |
| Deploy gagal: `Missing entry-point` | Wrangler yang dipakai lebih tua dari 3.91, yaitu sebelum Workers mendukung deployment assets-only | Pakai wrangler 4 (`npx wrangler@4 deploy`). Workflow di repo sudah mematoknya |

## 6a. Mengulang pelajaran

Bila sebuah pelajaran selesai dengan kurang dari tiga bintang, layar hasil
menawarkan **🔁 Ulangi untuk 3 Bintang**. Yang perlu diketahui:

- **Bintang tidak pernah turun.** Yang tersimpan selalu hasil terbaik, jadi
  mengulang tidak berisiko merusak capaian.
- **XP bonus pengulangan separuh** dari pelajaran pertama, supaya mengulang
  tidak jadi jalan pintas menumpuk XP.
- **Medali unit ikut naik**: unit yang tadinya perunggu bisa menjadi emas
  setelah semua pelajarannya diulang sampai tiga bintang.
- Pelajaran yang diulang **tidak dihitung dua kali** pada jumlah pelajaran selesai.

## 6b. Sinkronisasi antar perangkat

**Tidak ada langkah pemasangan.** Buka alamat aplikasi di perangkat mana pun —
ponsel, tablet, laptop — dan progres Darlene sudah ada di sana. Satu profil
keluarga, tanpa kode, tanpa akun (ADR-0009).

Progres terkirim otomatis beberapa detik setiap kali ada perubahan, dan
ditarik lagi setiap aplikasi dibuka. Tombol **🔄 Sinkronkan Sekarang** di
**Orang Tua → Sinkronisasi** ada bila ingin memaksa.

Hal-hal yang perlu diketahui:

- **Tidak ada kode berarti tidak ada kunci.** Siapa pun yang mengetahui alamat
  aplikasi ini bisa membaca dan mengubah progres Darlene. Yang tersimpan hanya
  nama panggilan, XP, bintang, dan lencana — tidak ada data pribadi. Alamatnya
  tidak dipublikasikan di mana pun; jangan sebarkan.
- **Progres digabung, bukan ditimpa.** Belajar di dua perangkat sekaligus tidak
  akan menghapus capaian salah satunya.
- **Pengaturan suara tidak ikut** — tiap perangkat punya suara terpasang sendiri.
- **Offline tetap jalan.** Perubahan tersimpan lokal dan menyusul begitu ada
  koneksi.
- **Bisa dimatikan per perangkat** di **Orang Tua → Sinkronisasi**, mis. pada
  perangkat pinjaman. Data lokal tetap utuh.
- **Menghapus progres tidak menyebar.** Menekan "Reset Semua Progres" hanya
  mengosongkan perangkat itu; sinkronisasi berikutnya akan mengembalikannya
  dari server. Untuk benar-benar mulai dari nol, hapus juga barisnya di D1
  (perintah SQL di bawah).

**Melihat atau menghapus data tersinkron** (lewat dasbor Cloudflare →
**Storage & Databases → D1 → baca-yuk-darlene-progres → Console**):

```sql
-- berapa profil tersimpan dan kapan terakhir berubah
SELECT code_hash, updated_at, revision, length(payload) AS ukuran FROM profiles;

-- hapus seluruh data tersinkron (progres di perangkat tidak tersentuh)
DELETE FROM profiles;
```

## 6c. Suara & pelafalan Bahasa Indonesia

Aplikasi memakai mesin suara bawaan perangkat (Web Speech API, ADR-0005). Bila
perangkat punya suara Bahasa Indonesia, tidak ada yang perlu dikerjakan.

**Bila belum punya**, mesin suara Inggris akan membaca teks Indonesia memakai
aturan ejaan Inggris: "be" terdengar "bi", "ca" terdengar "ka", "kucing"
terdengar "kyoo-sing". Untuk anak yang sedang belajar membaca, itu mengajarkan
bunyi yang salah.

Aplikasi menanganinya dengan **mengeja ulang** teks Indonesia
(`src/domain/pronunciation.js`) menjadi ejaan yang, bila dibaca dengan aturan
Inggris, menghasilkan bunyi Indonesia yang mendekati benar — `kucing` dikirim
sebagai `koo-cheeng`, `ba-bi-bu-be-bo` sebagai `bah-bee-boo-beh-boh`. Huruf pun
disebut dengan nama abjad Indonesia (`be`, `ce`, `ge`), bukan `bee`, `see`,
`jee`. Ini penyangga, bukan perbaikan sesungguhnya.

**Perbaikan sesungguhnya** — pasang suara Bahasa Indonesia sekali saja:

| Perangkat | Langkah |
|---|---|
| iPhone / iPad | Setelan → Aksesibilitas → Konten Lisan → Suara → Bahasa Indonesia → unduh |
| Android | Setelan → Sistem → Bahasa & masukan → Keluaran text-to-speech → Setelan mesin → Pasang data suara → Bahasa Indonesia |
| Windows | Settings → Time & Language → Speech → Manage voices → Add voices → Indonesian |
| macOS | System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Indonesian |

Area Orang Tua menampilkan peringatan beserta langkah-langkah ini secara
otomatis bila suara Bahasa Indonesia tidak ditemukan, dan menyediakan pemilih
suara bila ada lebih dari satu.

**Bila bunyinya masih terdengar salah.** Jangan menebak dari jauh — Area Orang
Tua punya bagian **🩺 Diagnosa suara** yang menyebutkan fakta perangkat: berapa
suara terdeteksi, namanya beserta label bahasanya, dan untuk tiap contoh: teks
apa yang benar-benar dikirim ke mesin suara dan suara mana yang dipakai. Tekan
**📋 Salin laporan ini** lalu kirimkan. Isinya hanya daftar suara — tidak ada
data pribadi.

Cara membacanya:

| Yang tertulis | Artinya |
|---|---|
| `Ada suara Indonesia: tidak` + `(dieja ulang)` | Berjalan sebagaimana mestinya; bunyinya mendekati benar. Pasang suara Indonesia untuk hasil terbaik |
| `Ada suara Indonesia: ya` + tanpa `(dieja ulang)` | Teks dikirim apa adanya ke suara Indonesia — bila bunyinya tetap salah, masalahnya ada pada mesin suara perangkat, bukan pada aplikasi |
| `suara : (bawaan perangkat)` | Perangkat tidak melaporkan satu pun suara; aplikasi memakai apa pun yang jadi bawaan sistem |

**Logat Bahasa Inggris.** Aplikasi mengutamakan **Inggris Australia** (`en-AU`)
bila terpasang di perangkat; bila tidak ada, suara Inggris mana pun yang tersedia
dipakai. Untuk memasangnya: iOS → Setelan → Aksesibilitas → Konten Lisan → Suara
→ English → **Australia**; Android → Keluaran text-to-speech → Setelan mesin →
Pasang data suara → English (Australia). Pilihan **Orang Tua → Suara Bahasa
Inggris** tetap menimpa pilihan otomatis ini bila diisi.

**Cara baca nama.** Nama serapan asing dibaca sesuai ortografi Indonesia
sehingga bisa meleset — "Darlene" terdengar "dar-le-ne". Isi **Orang Tua → Cara
baca nama** dengan ejaan bunyinya (`Darlin`); yang tampil di layar tetap nama
aslinya.

## 6d. Memastikan versi yang sedang berjalan

Baris paling bawah **Area Orang Tua** menuliskannya:

```
Baca Yuk, Darlene! v1.5.0 • dibuat dengan ❤️ untuk Darlene
```

Bandingkan dengan `APP_VERSION` di `src/config/environment.js` pada commit
terakhir yang ter-deploy. Bila berbeda, aplikasi belum memuat versi baru: tutup
sepenuhnya lalu buka lagi dalam keadaan daring.

Sejak 1.5.0 aplikasi mengurus ini sendiri — ia memuat ulang sekali begitu versi
baru siap, kecuali bila anak sedang mengerjakan pelajaran (jawabannya tidak
boleh terbuang); dalam keadaan itu muncul pesan dan pembaruan menunggu sampai
pelajaran selesai.

**Bila benar-benar mogok di versi lama**, hapus data situsnya sekali:

- **iOS**: Setelan → Safari → Lanjutan → Data Situs Web → cari alamat aplikasi →
  geser untuk menghapus. Progres tetap aman karena tersimpan online.
- **Android (Chrome)**: tekan lama ikon aplikasi → Info aplikasi → Penyimpanan →
  Hapus data.

Setelah itu buka lagi alamatnya; progres Darlene ditarik kembali dari profil
keluarga.

## 7. Cadangan rutin (disarankan)

Sebulan sekali: **Orang Tua → Simpan Cadangan (.json)**, lalu simpan berkasnya di
Google Drive/iCloud. Cadangan berisi seluruh progres, penguasaan kata, lencana,
dan riwayat harian; ukurannya beberapa puluh kilobyte.

## 8. Kontak & rujukan

- Standar arsitektur: `docs/architecture/STANDAR-ARSITEKTUR-v1.0.md`
- Keputusan arsitektur: `docs/architecture/adr/`
- Evaluasi & utang teknis: `docs/architecture/03-evaluation.md`
