# 03 — Evaluasi Arsitektur (ATAM Ringan) & Utang Teknis

Metode: ATAM ringkas (Kazman et al., 1998) — satu halaman untuk proyek kecil,
sesuai Standar §2 Langkah 7. Ditinjau ulang setiap kali ada ADR baru.

---

## 1. Titik Sensitif / Sensitivity Points

Keputusan yang bila diubah langsung menggeser satu atribut mutu.

| # | Titik sensitif | Atribut terdampak | Catatan |
|---|---|---|---|
| S1 | Kemurnian `domain/` (tanpa DOM, jam, keacakan) | Testability (QAS-08) | Satu pelanggaran saja membuat aturan permainan tidak lagi deterministik; karena itu ditegakkan lewat lint, bukan niat baik |
| S2 | Undian misi berbenih tanggal | Reliability, Usability | Bila diganti keacakan biasa, misi berubah setiap kali aplikasi dibuka dan anak kehilangan target harian |
| S3 | Daftar precache service worker | Availability (QAS-03) | Dihasilkan otomatis saat build; bila kembali manual, satu berkas terlewat = aplikasi rusak saat offline |
| S4 | `ProgressRepository` sebagai satu-satunya jalan ke penyimpanan | Modifiability (QAS-05) | Jalan pintas memanggil `localStorage` dari view akan mematikan opsi sinkronisasi awan |
| S5 | `APP_VERSION` dinaikkan tiap rilis | Availability, Modifiability | Bila lupa, pengguna terpasang bisa tertahan di versi lama |
| S6 | Batas kompleksitas 10 di CI | Maintainability | Menjaga fungsi tetap bisa dibaca kembali setelah berbulan-bulan tidak disentuh |

## 2. Titik Kompromi / Trade-off Points

| # | Kompromi | Untung | Rugi | Putusan |
|---|---|---|---|---|
| T1 | Penyimpanan lokal saja (ADR-0002) | Privasi maksimal, biaya nol, offline penuh | Tidak ada sinkronisasi antarperangkat; progres bisa hilang | Diterima; ditebus dengan cadangan `.json` |
| T2 | Tanpa framework & bundler (ADR-0004) | Muatan kecil, umur simpan panjang, nol dependensi | Kode DOM ditulis tangan; tanpa tipe statis | Diterima untuk ukuran UI saat ini |
| T3 | TTS bawaan perangkat (ADR-0005) | Gratis, offline, dua bahasa, skalabel | Kualitas suara tidak seragam; sebagian Android tanpa suara Indonesia | Diterima; adapter memungkinkan penggantian nanti |
| T4 | Tanpa sistem "nyawa" (ADR-0007) | Anak tidak pernah terhenti/kecil hati | Tekanan untuk teliti berkurang | Diterima; ketelitian tetap dihargai lewat bintang & pelajaran sempurna |
| T5 | ES module tanpa bundle (banyak permintaan berkas) | Build sederhana, mudah ditelusuri | Kunjungan pertama melakukan ± 40 permintaan HTTP | Diterima: HTTP/2 di Cloudflare + precache membuat kunjungan berikutnya nol permintaan |
| T6 | Menilai sendiri soal "baca keras" | Melatih membaca nyaring, yang tidak bisa diukur pilihan ganda | Data penguasaan jadi kurang objektif | Diterima; dibatasi 2 soal/pelajaran |
| T7 | Sinkronisasi otomatis tanpa kode (ADR-0009) | Orang tua tidak mengerjakan apa pun; berganti perangkat benar-benar mulus | **Tidak ada kendali akses** pada API sinkronisasi | Diterima secara sadar: muatan tidak memuat data pribadi dan penggabungan tidak pernah menurunkan capaian, jadi dampak terburuknya terbatas. Dicatat di R7 dan D8 |
| T8 | Mengeja ulang teks Indonesia untuk suara asing (`domain/pronunciation.js`) | Bunyi tetap Indonesia di perangkat tanpa suara `id-ID` — tanpa itu anak belajar bunyi yang salah | Satu aturan fonologi lagi yang harus dipelihara, dan hasilnya hanya mendekati | Diterima sebagai penyangga; Area Orang Tua tetap mengarahkan ke perbaikan sesungguhnya, yaitu memasang suara Bahasa Indonesia |

## 3. Risiko / Risks

| # | Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|---|
| R1 | Safari menghapus penyimpanan situs yang lama tidak dibuka | Sedang | Tinggi (progres hilang) | Dorong pemasangan ke layar utama; ingatkan cadangan berkala di Area Orang Tua |
| R2 | Perangkat tidak punya suara Bahasa Indonesia | Sedang | Sedang | Ejaan ulang otomatis (`domain/pronunciation.js`) agar bunyinya tetap Indonesia, peringatan + langkah pemasangan suara di Area Orang Tua, pemilih suara, `nullSpeechAdapter` |
| R3 | Anak menekan "Reset Semua Progres" | Rendah | Tinggi | Tombol ada di Area Orang Tua paling bawah + dialog konfirmasi |
| R4 | Materi habis (46 pelajaran) sebelum anak siap naik tingkat | Sedang | Rendah | Unit "Tantangan Juara" mengulang kata yang belum dikuasai tanpa batas |
| R5 | Perubahan bentuk data profil membuat cadangan lama tidak terbaca | Rendah | Sedang | `schemaVersion` + `normalizeProfile()` melengkapi bidang yang hilang; diuji di `tests/unit/profile.test.js` |
| R6 | Emoji tampil berbeda/kosong di sebagian perangkat | Rendah | Rendah | Hanya memakai emoji Unicode lama yang lazim; kata selalu disertai teks |
| R7 | Alamat aplikasi diketahui orang lain, lalu progres dibaca atau diubah | Rendah | Rendah | Konsekuensi sadar dari ADR-0009. Muatan tidak memuat data pribadi; penggabungan monoton berarti penulisan asing tidak dapat menghapus capaian; alamat tidak dipublikasikan. Bila pernah terjadi, lunasi D8 |

## 4. Butir yang Belum Dievaluasi / Non-risks

- Skalabilitas jumlah pengguna: tidak relevan (satu anak, berkas statis di CDN).
- Ketahanan terhadap serangan: tidak ada backend, tidak ada masukan tepercaya
  dari luar, tidak ada kredensial di klien.

## 5. Utang Teknis Terdaftar / Registered Technical Debt

Dicatat eksplisit sesuai Standar §5 butir 9 (Cunningham, 1992; Kruchten et al., 2012).

| # | Utang | Alasan diterima | Pemicu untuk dilunasi |
|---|---|---|---|
| D1 | Tidak ada pemeriksaan tipe statis (JSDoc saja) | Menghindari langkah build (ADR-0004) | Bila kontributor bertambah atau bug tipe mulai lolos ke produksi |
| D2 | Tidak ada test otomatis untuk lapisan UI | Biaya perkakas peramban tinggi untuk UI sekecil ini; alur penuh sudah diuji di lapisan aplikasi | Bila layar bertambah banyak, tambahkan test Playwright pada alur kritis |
| D3 | Perilaku offline diuji manual | Menguji service worker perlu peramban sungguhan | Bila strategi cache berubah lagi |
| D4 | Kalimat latihan masih sedikit (20) | Fokus awal pada kata | Saat Darlene menamatkan unit "Baca Kalimat" |
| D5 | Belum ada penyaring materi satu bahasa | Belum dibutuhkan (ADR-0007) | Bila guru/orang tua ingin sesi khusus satu bahasa |
| D6 | Ikon dibuat oleh skrip Python, bukan aset desain | Cukup, konsisten, dan bisa dihasilkan ulang | Bila ingin identitas visual yang lebih matang |
| D7 | Penggabungan profil dua arah (bukan tiga arah), sehingga XP konservatif saat dua perangkat dipakai offline bersamaan | Pemakaian nyata bersifat bergantian, dan hasilnya tepat untuk pola itu; kerugiannya kosmetik | Bila ternyata dua perangkat sering dipakai paralel — simpan salinan acuan hasil sinkronisasi terakhir lalu gabungkan tiga arah |
| D8 | API sinkronisasi tanpa kendali akses (ADR-0009) | Kode apa pun mengembalikan gesekan yang justru ingin dihapus; data yang dipertaruhkan tidak sensitif | Bila data pribadi mulai disimpan, bila aplikasi dipakai lebih dari satu keluarga, atau bila R7 benar-benar terjadi — pasang rahasia bersama yang ditanam saat build, bukan kode yang diketik orang tua |
| D9 | Ejaan ulang Indonesia hanya menyasar suara Inggris | Itulah suara cadangan yang nyata ada di perangkat rumah ini; aturan untuk tiap bahasa lain akan jadi tebakan | Bila aplikasi dipakai di perangkat yang suara cadangannya bukan Inggris |

## 6. Kesimpulan Evaluasi

Arsitektur menjawab seluruh QAS-01 sampai QAS-11 tanpa titik risiko tinggi yang
belum dimitigasi. Risiko terbesar (R1: penyimpanan lokal terhapus) bersifat
operasional, bukan struktural, dan kini punya dua jalur pemulihan: cadangan
`.json` yang diuji di `tests/e2e/learningFlow.test.js` dan salinan tersinkron di
D1 (ADR-0008/0009).

ADR-0002 sudah ditinjau ulang dan digantikan sejauh yang diperlukan: progres
tetap tersimpan lokal lebih dulu, tetapi tidak lagi hanya di situ. Yang paling
mungkin ditinjau ulang berikutnya adalah **T7/D8** — ketiadaan kendali akses
pada API sinkronisasi. Itu diterima hari ini karena yang dipertaruhkan hanya
nama panggilan dan angka permainan; premis itulah, bukan kode programnya, yang
harus diperiksa ulang sebelum apa pun yang lebih pribadi ikut disinkronkan.

QAS-11 (bunyi Bahasa Indonesia) masuk belakangan karena laporan orang tua, bukan
karena analisis di awal. Itu sendiri sebuah temuan: skenario mutu yang disusun
dari sudut pandang pengembang melewatkan atribut yang paling terasa oleh
penggunanya — anak lima tahun tidak bisa melaporkan bahwa "be" terdengar "bi",
ia hanya belajar bunyi yang salah.
