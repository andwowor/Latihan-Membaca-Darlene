# 01 — Quality Attribute Scenarios (QAS)

Format enam bagian (Bass, Clements & Kazman, 2021); atribut mengacu ISO/IEC 25010:2023.
Dokumen inilah spesifikasi arsitektur yang sebenarnya — fitur menyusul, mutu memimpin.

---

### QAS-01 — Usability (anak 5 tahun bisa memakai sendiri)

| Bagian | Isi |
|---|---|
| Atribut | Usability / Operability |
| Source | Darlene (5 tahun, belum lancar membaca) |
| Stimulus | Ingin mulai berlatih setelah membuka aplikasi |
| Artifact | Layar Belajar + peta pelajaran |
| Environment | Operasi normal, aplikasi terpasang di layar utama, tanpa pendampingan |
| Response | Soal pertama tampil dan bisa dijawab dengan satu ketukan |
| Response measure | **≤ 2 ketukan** dari membuka aplikasi; semua target sentuh **≥ 44×44 px**; tidak ada teks instruksi yang wajib dibaca untuk memulai |

**Bukti/verifikasi:** tombol "Lanjut Belajar" langsung membuka pelajaran berjalan;
CSS `--tap: 52px`; ikon + suara menemani setiap perintah.

---

### QAS-02 — Portability / Installability (dipasang lewat Safari dan Chrome)

| Bagian | Isi |
|---|---|
| Atribut | Portability (Installability) |
| Source | Orang tua |
| Stimulus | Memasang aplikasi ke layar utama iPhone (Safari) dan Android (Chrome) |
| Artifact | Manifest PWA, meta tag Apple, ikon, service worker |
| Environment | Kunjungan pertama, perangkat daring |
| Response | Aplikasi muncul sebagai ikon tersendiri dan terbuka layar penuh tanpa bilah alamat |
| Response measure | Berhasil di **iOS Safari ≥ 16** dan **Chrome ≥ 100** tanpa langkah teknis; petunjuk pemasangan spesifik peramban tersedia di dalam aplikasi |

---

### QAS-03 — Reliability / Availability (tetap jalan tanpa internet)

| Bagian | Isi |
|---|---|
| Atribut | Reliability (Availability), Fault tolerance |
| Source | Lingkungan (jaringan) |
| Stimulus | Perangkat kehilangan koneksi internet di tengah pemakaian |
| Artifact | Service worker + penyimpanan lokal |
| Environment | Aplikasi sudah pernah dibuka minimal satu kali |
| Response | Seluruh pelajaran, progres, dan suara tetap berfungsi; tidak ada layar galat |
| Response measure | **100% fungsi inti** tersedia offline; **0** permintaan jaringan wajib saat menjawab soal |

---

### QAS-04 — Modifiability (menambah materi belajar)

| Bagian | Isi |
|---|---|
| Atribut | Modifiability |
| Source | Pengembang/orang tua |
| Stimulus | Menambah 20 kata baru beserta gambarnya |
| Artifact | `src/domain/vocabulary.js` |
| Environment | Waktu desain |
| Response | Kata baru otomatis muncul di daftar kata, soal, dan perhitungan penguasaan |
| Response measure | **< 30 menit**, **0** perubahan di `application/`, `adapters/`, dan `ui/`; test integritas kosakata membuktikan tidak ada regresi |

---

### QAS-05 — Modifiability (memindahkan progres ke penyimpanan awan)

| Bagian | Isi |
|---|---|
| Atribut | Modifiability |
| Source | Pemilik sistem |
| Stimulus | Ingin progres tersinkron antar perangkat (mis. lewat Cloudflare D1/KV) |
| Artifact | `ports/ProgressRepository.js` + adapter baru |
| Environment | Waktu desain, sistem berjalan normal |
| Response | Tambah satu adapter outbound, ganti satu baris di composition root |
| Response measure | **0 perubahan** di `domain/` dan `application/`; **1 berkas baru** + **1 baris** di `config/container.js`; test kontrak adapter yang sudah ada dipakai ulang |

---

### QAS-06 — Performance (aplikasi terasa langsung siap)

| Bagian | Isi |
|---|---|
| Atribut | Performance efficiency (Time behaviour) |
| Source | Darlene |
| Stimulus | Mengetuk ikon aplikasi |
| Artifact | Seluruh berkas aplikasi |
| Environment | Perangkat kelas menengah, kunjungan kedua dan seterusnya (cache terisi) |
| Response | Layar Belajar tampil dan bisa disentuh |
| Response measure | **< 1 detik** dari cache; total muatan awal **< 500 KB**; **0** dependensi pihak ketiga yang harus diunduh |

---

### QAS-07 — Security / Privacy (data anak tetap terkendali)

*Direvisi 2026-08-26 oleh ADR-0008, lalu **dilemahkan dengan sengaja** oleh
ADR-0009. Semula "tidak ada data anak yang meninggalkan perangkat"; lalu
"dilindungi kode sinkron 80 bit"; kini sinkronisasi otomatis tanpa kode berarti
**tidak ada kendali akses sama sekali** pada API. Pertukaran itu dicatat apa
adanya di ADR-0009, bukan disamarkan.*

| Bagian | Isi |
|---|---|
| Atribut | Security (Confidentiality), Privacy |
| Source | Orang tua |
| Stimulus | Anak memakai aplikasi setiap hari di lebih dari satu perangkat |
| Artifact | Seluruh sistem |
| Environment | Operasi normal |
| Response | Yang dikirim hanya progres belajar dan nama panggilan, dan hanya ke akun Cloudflare milik orang tua sendiri. Tidak ada akun, surel, tanggal lahir, foto, maupun lokasi — sehingga kebocoran pun tidak mengungkap identitas anak |
| Response measure | **0** pelacak, iklan, akun, surel, maupun pihak ketiga; **0** kredensial di kode/riwayat Git; **0** medan data pribadi dalam muatan sinkron; sisa perlindungan hanyalah **alamat yang tidak dipublikasikan** dan sifat penggabungan yang **tidak pernah menurunkan** capaian, sehingga penulisan asing pun tidak menghapus progres |

---

### QAS-09 — Data integrity (progres tidak boleh hilang saat digabung)

| Bagian | Isi |
|---|---|
| Atribut | Reliability (Fault tolerance), Functional correctness |
| Source | Dua perangkat yang sama-sama dipakai belajar |
| Stimulus | Keduanya menyinkronkan progres ke profil keluarga yang sama |
| Artifact | `domain/merge.js` dan Worker API |
| Environment | Operasi normal, termasuk setelah salah satu perangkat lama offline |
| Response | Hasil gabungan tidak pernah lebih rendah dari capaian mana pun sebelumnya |
| Response measure | Bintang, lencana, penguasaan kata, rekor beruntun, dan riwayat **tidak pernah menurun** — dijaga oleh test "penggabungan tidak pernah menurunkan capaian" dan sifat idempoten yang diuji otomatis |

---

### QAS-10 — Learnability (anak tidak ditanya materi yang belum diajarkan)

| Bagian | Isi |
|---|---|
| Atribut | Usability (Learnability) |
| Source | Darlene |
| Stimulus | Membuka pelajaran berisi kata Bahasa Inggris yang belum pernah ia lihat |
| Artifact | `domain/exercise/introduction.js` |
| Environment | Operasi normal |
| Response | Pelajaran dibuka dengan kartu perkenalan: gambar, kata, cara membaca, dan artinya dalam Bahasa Indonesia — barulah soal dimulai |
| Response measure | **100%** materi yang ditanyakan sudah diperkenalkan pada sesi itu atau sudah dikuasai sebelumnya (penguasaan ≥ 2); dijaga test otomatis pada seluruh pelajaran |

---

### QAS-11 — Functional correctness (bunyi Bahasa Indonesia harus benar)

*Ditambahkan 2026-08-26 setelah laporan orang tua: "ba-bi-bu-be-bo" terdengar
"ba-bi-bu-bi-bo" dan "ca-ci-cu-ce-co" terdengar "ka-ci-cu-ce-ko". Untuk aplikasi
belajar membaca, bunyi yang salah bukan cacat kosmetik — ia mengajarkan hal
yang keliru.*

| Bagian | Isi |
|---|---|
| Atribut | Functional correctness (Usability bagi anak yang belum bisa membaca) |
| Source | Darlene |
| Stimulus | Mendengarkan huruf, suku kata, kata, atau kalimat Bahasa Indonesia pada perangkat yang **tidak** memiliki suara `id-ID` |
| Artifact | `domain/pronunciation.js` + `adapters/outbound/webSpeechAdapter.js` |
| Environment | Operasi normal, termasuk offline |
| Response | Teks Indonesia dieja ulang sebelum diucapkan sehingga tetap terdengar Indonesia; nama huruf memakai abjad Indonesia (`be`, `ce`, `ge`), bukan Inggris |
| Response measure | **100%** kata Indonesia di kamus (83 kata) menghasilkan pemenggalan suku kata yang sama persis dengan data kurikulum; **setiap** keluarga suku kata menghasilkan **5 bunyi berbeda** (regresi `be`≠`bi`, `ca`≠`ka`); dijaga 16 test unit + 11 test integrasi adapter |

---

### QAS-12 — Functional suitability (tujuan akhir terdesain, bukan tersirat)

*Ditambahkan 2026-08-27 atas permintaan eksplisit orang tua (ADR-0010).*

| Bagian | Isi |
|---|---|
| Atribut | Functional suitability (Completeness) |
| Source | Orang tua |
| Stimulus | Menetapkan ukuran keberhasilan: Darlene mampu membaca 2 paragraf Indonesia + 2 paragraf Inggris, masing-masing ≥ 4 baris — tanpa menaikkan kesulitan kurikulum yang ada |
| Artifact | `domain/vocabulary.js` (STORIES), `domain/curriculum.js` (u12/u13), `domain/goal.js` |
| Environment | Desain kurikulum |
| Response | Tahap cerita bertingkat (2 ➜ 3 ➜ 4 baris) menuju dua pelajaran 🎓 Ujian Membaca yang berisi persis paragraf-paragraf tujuan; kemajuannya tampil di kartu 🎯 Tujuan Akhir |
| Response measure | Test menegakkan: **2+2** cerita ujian dengan **≥ 4 baris** masing-masing; **100%** kata cerita berasal dari materi yang sudah diajarkan; tiap baris **≤ 6 kata**; tujuan dinyatakan tercapai **hanya** oleh selesainya kedua pelajaran ujian |

---

### QAS-08 — Testability (aturan permainan bisa diuji ulang persis)

| Bagian | Isi |
|---|---|
| Atribut | Maintainability (Testability) |
| Source | Pengembang |
| Stimulus | Menjalankan test setelah mengubah aturan XP/streak/misi |
| Artifact | `domain/` + port jam & keacakan |
| Environment | Waktu build / CI |
| Response | Seluruh aturan diuji tanpa peramban, tanpa menunggu waktu nyata |
| Response measure | Suite selesai **< 5 detik**; hasil **deterministik** (jam beku + keacakan berbenih); domain **tidak** memanggil `Date.now()` atau `Math.random()` — ditegakkan lewat aturan lint |
