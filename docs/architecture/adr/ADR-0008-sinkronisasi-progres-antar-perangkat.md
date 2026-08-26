# ADR-0008: Sinkronisasi progres antar perangkat lewat Worker + D1

Tanggal   : 2026-08-26
Status    : Accepted
Terkait   : melengkapi ADR-0002 (penyimpanan lokal), memenuhi QAS-05, mengubah QAS-07

## Konteks / Context

ADR-0002 menetapkan progres disimpan lokal saja, dan mencatat bahwa bila
kebutuhan multi-perangkat muncul, cukup ditambah satu adapter di balik
`ProgressRepository`. Kebutuhan itu kini muncul: Darlene memakai lebih dari
satu perangkat dan progresnya harus mengikuti, bukan terpecah per perangkat.

Dua kendala nyata membuat "tinggal ganti adapter" tidak cukup:

1. **Aplikasi wajib tetap jalan offline (QAS-03).** Mengganti penyimpanan lokal
   dengan penyimpanan awan akan mematikan kemampuan itu. Jadi yang dibutuhkan
   bukan penggantian, melainkan *penyimpanan lokal + sinkronisasi*.
2. **Dua perangkat bisa sama-sama dipakai offline.** Menimpa berdasarkan
   "siapa menyimpan terakhir" akan menghapus hasil belajar dari perangkat lain —
   kegagalan yang paling menyakitkan bagi anak, karena bintang dan lencananya hilang.

## Keputusan / Decision

Kami akan menambahkan sinkronisasi *opsional* dengan bentuk berikut.

**Penyimpanan lokal tetap menjadi sumber utama.** Aplikasi berfungsi penuh tanpa
sinkronisasi; sinkronisasi adalah lapisan tambahan yang bisa dimatikan.

**Server**: satu Worker beraset (`main` + `run_worker_first: ["/api/*"]`) dengan
basis data **D1**, di akun Cloudflare pemilik sendiri. Dua endpoint saja:
`GET /api/progress` (ambil) dan `PUT /api/progress` (kirim dan gabungkan).

**Identitas**: sebuah **kode sinkron** acak 80-bit yang dibuat sekali lalu
diketik di perangkat lain. Tidak ada akun, kata sandi, surel, maupun pelacak.
Server menyimpan **hash SHA-256** dari kode itu sebagai kunci baris, bukan
kodenya sendiri.

**Penggabungan, bukan penimpaan.** Fungsi murni `mergeProfiles()` di lapisan
domain menggabungkan dua profil dengan aturan monotonik: XP, poin, dan penghitung
total diambil yang terbesar; bintang per pelajaran yang tertinggi; penguasaan kata
yang tertinggi; lencana digabung; riwayat harian disatukan per tanggal. Fungsi yang
sama dipakai **di klien dan di server**, sehingga tidak ada dua sumber kebenaran.

**Pengaturan tidak ikut disinkronkan.** Pilihan suara terikat pada perangkat
(suara yang terpasang berbeda-beda), jadi klien selalu memasang kembali
pengaturannya sendiri setelah menerima hasil gabungan.

## Alternatif yang ditolak / Rejected alternatives

- **Mengganti `ProgressRepository` lokal dengan adapter D1 langsung** (rencana
  awal ADR-0002). Ditolak karena mematikan mode offline: setiap jawaban akan
  butuh jaringan, dan QAS-03 gagal.
- **Last-write-wins.** Paling sederhana, tetapi menghapus kemajuan dari perangkat
  yang menyimpan lebih dulu. Tidak dapat diterima untuk data yang tidak bisa
  dibuat ulang seperti bintang, lencana, dan hari beruntun.
- **Penggabungan hanya di klien dengan penguncian optimistis (revisi + 409).**
  Bisa bekerja, tetapi membuat klien harus menangani percobaan ulang dan tetap
  menyisakan celah balapan. Menggabungkan di server menghilangkan seluruh kelas
  masalah itu, dengan biaya kode domain harus jalan di Worker — yang justru
  gratis karena domain memang murni.
- **Akun + kata sandi, atau Cloudflare Access.** Aman, tetapi memaksa anak 5 tahun
  melewati layar masuk, dan menambah data pribadi yang tidak kami inginkan.
- **Penyedia pihak ketiga (Firebase/Supabase).** Menambah pemroses data di luar
  kendali pemilik, bertentangan dengan alasan privasi pada ADR-0002.

## Konsekuensi / Consequences

**Positif**
- Progres mengikuti anak, bukan perangkat; ganti HP tidak lagi berarti mulai nol.
- Mode offline tetap utuh: sinkronisasi hanya berjalan ketika ada jaringan.
- Aturan penggabungan berupa fungsi murni, jadi bisa diuji habis-habisan tanpa
  jaringan maupun basis data.
- Cadangan `.json` manual tetap ada sebagai jaring pengaman kedua.

**Negatif / utang teknis**
- **QAS-07 berubah**: pernyataan "tidak ada data anak yang meninggalkan perangkat"
  tidak lagi berlaku ketika sinkronisasi dinyalakan. Yang tersimpan di D1 adalah
  progres belajar beserta nama panggilan anak, di akun Cloudflare pemilik sendiri.
  Ini dicatat ulang di `01-quality-attributes.md`.
- **Keamanan bergantung pada kerahasiaan kode sinkron.** Siapa pun yang memiliki
  kode itu dapat membaca dan menulis profil tersebut. Mitigasi: kode acak 80-bit,
  hanya ditampilkan di Area Orang Tua, dan bisa dibuat ulang kapan saja.
- Aplikasi kini punya kode sisi server untuk pertama kalinya, sehingga permukaan
  yang harus dirawat bertambah (validasi masukan, batas ukuran, migrasi skema).
- **XP bersifat konservatif bila dua perangkat dipakai offline bersamaan.**
  Untuk pemakaian bergantian — yang merupakan kasus nyata di sini: main di HP,
  lalu lanjut di tablet — hasilnya tepat, karena perangkat kedua selalu memulai
  dari angka yang sudah disinkronkan sehingga "ambil yang terbesar" persis sama
  dengan "tambahkan yang baru". Namun bila kedua perangkat dipakai offline pada
  saat yang sama, XP dan penghitung harian mengambil angka tertinggi, bukan
  jumlah keduanya; sebagian XP dari sesi paralel tidak terhitung. Bintang,
  lencana, penguasaan kata, dan riwayat tetap utuh karena digabung per butir.
  Alternatifnya adalah penggabungan tiga arah dengan menyimpan salinan acuan
  hasil sinkronisasi terakhir; ditunda karena menggandakan penyimpanan dan
  menambah keadaan yang harus dijaga, sementara kerugiannya hanya kosmetik
  (level bisa sedikit lebih rendah dari seharusnya). Dicatat sebagai utang
  teknis D7.
- Aturan penggabungan bersifat monotonik, jadi **penghapusan tidak menyebar**:
  menekan "Reset Semua Progres" di satu perangkat tidak menghapus data di
  perangkat lain, dan progres akan kembali saat sinkronisasi berikutnya. Untuk
  benar-benar memulai dari nol, kode sinkron harus dibuat ulang.
