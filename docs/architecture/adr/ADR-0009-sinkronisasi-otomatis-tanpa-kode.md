# ADR-0009: Sinkronisasi otomatis tanpa kode, satu profil per keluarga

Tanggal   : 2026-08-26
Status    : Accepted
Terkait   : menggantikan mekanisme identitas pada ADR-0008; mengubah QAS-07 lagi

## Konteks / Context

ADR-0008 memakai **kode sinkron** yang diketik ulang di perangkat kedua.
Percobaan pertama di dunia nyata langsung menunjukkan kelemahannya: pada
perangkat kedua tertekan "Buat Kode Baru", bukan "Pakai Kode Ini", sehingga
lahir dua profil terpisah yang tidak akan pernah bertemu — persis kegagalan
yang paling mahal, karena baru ketahuan setelah anak terlanjur belajar di
kedua perangkat.

Pemilik sistem menyatakan sinkronisasi harus berjalan **otomatis, tanpa kode**.

Kenyataan yang membentuk keputusan ini:

- Aplikasi ini melayani **satu anak dalam satu keluarga**. Tidak ada kebutuhan
  memisahkan banyak pengguna.
- Alamatnya tidak dipublikasikan dan tidak tercantum di mana pun.
- Data yang tersimpan hanyalah progres membaca dan nama panggilan. Tidak ada
  kontak, foto, lokasi, tanggal lahir, maupun data lain yang bisa dipakai
  mengidentifikasi anak di luar konteks aplikasi ini.
- Aturan penggabungan bersifat monotonik (ADR-0008): data hanya bisa bertambah,
  tidak bisa dihapus lewat sinkronisasi.

## Keputusan / Decision

Kami akan **menghapus kode sinkron dari alur pemakaian**. Server menyimpan
**satu profil keluarga** pada kunci tetap yang ditentukan di sisi Worker; klien
tidak mengirim identitas apa pun. Setiap perangkat yang membuka aplikasi
otomatis menarik dan mengirim progres ke profil yang sama, tanpa langkah
persiapan sekali pun.

Sinkronisasi **menyala secara bawaan**, dan tetap bisa dimatikan per perangkat
di Area Orang Tua.

Kemampuan berbasis kode **tetap ada di Worker** (header `X-Sync-Code` masih
dihormati bila dikirim) sehingga pemisahan profil dapat dihidupkan kembali
tanpa membongkar apa pun — misalnya bila kelak ada adik yang ikut memakai.

## Alternatif yang ditolak / Rejected alternatives

- **Mempertahankan kode dengan perbaikan tampilan** (konfirmasi saat membuat
  kode kedua, peringatan bila progres yang ditarik kosong). Menutup gejalanya,
  bukan penyebabnya: selama ada dua tombol yang mirip, salah tekan akan
  terulang, dan akibatnya baru terasa belakangan.
- **Tautan atau kode QR untuk memindahkan kode.** Lebih mudah daripada
  mengetik, tetapi tetap menyisakan langkah persiapan dan tetap bisa gagal
  bila perangkat kedua dibuka lewat jalan lain.
- **Akun dengan kata sandi, atau Cloudflare Access.** Memberi perlindungan
  sungguhan, tetapi memaksa layar masuk pada aplikasi yang dipakai anak
  5 tahun, dan menambah data pribadi yang justru ingin kami hindari.
  Tetap dicatat sebagai jalan keluar bila kelak dibutuhkan: Cloudflare Access
  dapat dipasang di depan Worker tanpa mengubah kode aplikasi.
- **Rahasia bersama yang ditanam di dalam berkas JavaScript klien.** Terlihat
  seperti pengamanan, padahal siapa pun yang membuka kode sumber halaman bisa
  membacanya. Ditolak karena memberi rasa aman palsu tanpa menambah keamanan
  nyata.

## Konsekuensi / Consequences

**Positif**
- Tidak ada langkah persiapan sama sekali: pasang aplikasi, progres langsung
  mengikuti. Kelas kesalahan "dua profil terpisah" hilang sepenuhnya.
- Satu tombol dan satu pilihan lebih sedikit di Area Orang Tua.
- Kode yang sudah teruji tidak dibuang: jalur berbasis kode tetap ada di
  Worker beserta test-nya.

**Negatif / utang teknis**
- **QAS-07 berubah lagi.** Kini tidak ada pengendalian akses sama sekali pada
  API sinkronisasi: siapa pun yang mengetahui alamat Worker dapat membaca dan
  menambah progres. Perlindungan yang tersisa ada tiga, dan semuanya harus
  disebut apa adanya: alamat yang tidak dipublikasikan, isi data yang tidak
  sensitif, dan sifat monotonik penggabungan yang membuat data tidak bisa
  dihapus dari luar. Yang mungkin dilakukan penyusup hanyalah menambah angka —
  mengganggu, tidak merusak.
- Profil lama yang terlanjur tersimpan di bawah kode-kode sebelumnya menjadi
  yatim. Perangkat yang membawa progres akan mengirim ulang isinya ke profil
  keluarga pada sinkronisasi pertama, jadi tidak ada yang hilang; baris lama
  perlu dihapus manual sekali (lihat `docs/runbook.md`).
- Sinkronisasi yang menyala secara bawaan berarti aplikasi melakukan permintaan
  jaringan di latar belakang tanpa diminta. Mengerjakan pelajaran tetap tidak
  pernah membutuhkan jaringan, dan kegagalan tetap senyap — dicatat sebagai
  status di Area Orang Tua, tidak pernah menghalangi anak belajar.
