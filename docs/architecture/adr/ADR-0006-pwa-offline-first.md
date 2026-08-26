# ADR-0006: PWA offline-first dengan service worker precache

Tanggal   : 2026-08-25
Status    : Accepted

## Konteks / Context

Aplikasi harus bisa dipasang lewat Safari iOS dan Chrome (QAS-02) serta tetap
berfungsi penuh tanpa internet (QAS-03) — misalnya di perjalanan. Isi aplikasi
kecil (± 60 berkas, di bawah 500 KB) dan seluruhnya statis.

## Keputusan / Decision

Kami akan memakai service worker dengan strategi:

- **Navigasi** (membuka aplikasi): *network-first*, jatuh ke cache saat offline —
  supaya versi baru langsung dipakai ketika daring.
- **Aset** (JS, CSS, ikon): *stale-while-revalidate* — tampil seketika dari cache
  lalu diperbarui diam-diam.
- **Precache** seluruh berkas saat instalasi; daftar berkas dan nomor versi
  disuntikkan otomatis oleh `scripts/build.mjs` sehingga tidak pernah kedaluwarsa
  karena lupa diperbarui manual.

## Alternatif yang ditolak / Rejected alternatives

- **Tanpa service worker.** Gagal memenuhi QAS-03 dan membuat pengalaman terpasang
  terasa seperti situs biasa.
- **Workbox.** Matang dan lengkap, tetapi menambah dependensi dan langkah build
  untuk kebutuhan yang cukup dilayani ± 60 baris (bertentangan dengan ADR-0004).
- **Cache-first untuk navigasi.** Paling cepat, tetapi pengguna bisa terjebak di
  versi lama tanpa cara jelas untuk menyegarkan.

## Konsekuensi / Consequences

**Positif**
- Aplikasi terpasang membuka seketika dan berfungsi penuh offline.
- Versi baru tersebar sendiri saat perangkat daring; pengguna diberi tahu lewat
  notifikasi kecil bila pembaruan sudah siap.

**Negatif / utang teknis**
- Nomor versi (`APP_VERSION` di `config/environment.js`) harus dinaikkan setiap
  rilis agar cache lama dibuang. Tercatat di checklist rilis pada runbook.
- Pengujian perilaku offline harus dilakukan manual di peramban.

---

## Catatan pelaksanaan — 2026-08-26

Strategi *stale-while-revalidate* untuk aset punya akibat yang tidak diperhitungkan
saat ADR ini ditulis: **pembukaan pertama sesudah pembaruan masih menjalankan
program versi sebelumnya.** Berkas baru diunduh di latar belakang dan baru
terpakai pada pembukaan berikutnya.

Untuk aplikasi biasa itu sekadar keterlambatan satu putaran. Di sini akibatnya
lebih serius: orang tua melaporkan sebuah bunyi yang salah, perbaikannya
diterbitkan, orang tua membuka aplikasi — dan mendengar bunyi salah yang sama.
Dari sisi mereka, perbaikannya tampak tidak pernah datang. Itu benar-benar
terjadi, dua kali, sebelum sebabnya ketahuan dari jejak versi di D1.

Strategi cache **tidak diubah** — ia tetap tepat untuk tujuannya. Yang
ditambahkan adalah penyelesaiannya: begitu service worker baru mengambil alih
halaman, halaman memuat ulang dirinya sekali, sehingga program baru benar-benar
berjalan pada pembukaan yang sama. Dua penjagaan menyertainya:

- **Tidak pada pemasangan pertama.** Halaman yang belum pernah dikendalikan
  service worker tidak perlu dimuat ulang.
- **Tidak di tengah pelajaran.** Memuat ulang saat anak sedang menjawab akan
  membuang pekerjaannya; dalam keadaan itu pesan lama tetap dipakai dan
  pembaruan menunggu.

Diuji di peramban sungguhan dengan dua build berbeda: perangkat di 1.4.0,
1.5.0 diterbitkan, aplikasi dibuka **sekali** → versi 1.5.0 berjalan, dengan
tepat satu kali muat ulang dan tidak ada gelung.

Pelajarannya: **strategi cache adalah keputusan tentang bagaimana perbaikan
sampai ke pengguna, bukan sekadar tentang kecepatan memuat.** ADR ini semula
hanya menimbang kecepatan dan ketersediaan offline.
