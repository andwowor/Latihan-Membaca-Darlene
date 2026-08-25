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

### QAS-07 — Security / Privacy (data anak tidak ke mana-mana)

| Bagian | Isi |
|---|---|
| Atribut | Security (Confidentiality), Privacy |
| Source | Orang tua |
| Stimulus | Anak memakai aplikasi setiap hari selama berbulan-bulan |
| Artifact | Seluruh sistem |
| Environment | Operasi normal |
| Response | Tidak ada data anak yang dikirim keluar perangkat; tidak ada pelacak, iklan, atau akun |
| Response measure | **0** panggilan jaringan pihak ketiga; **0** kredensial di kode/riwayat Git; cadangan hanya dibuat atas perintah orang tua ke berkas lokal |

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
