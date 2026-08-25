# ADR-0002: Menyimpan progres di perangkat (localStorage), tanpa backend

Tanggal   : 2026-08-25
Status    : Accepted

## Konteks / Context

Progres belajar berisi data seorang anak berusia 5 tahun. Kebutuhan privasi
(QAS-07) menuntut data tidak keluar dari perangkat. Aplikasi juga harus tetap
berfungsi penuh tanpa internet (QAS-03). Pengguna hanya satu anak pada satu
perangkat utama; kebutuhan sinkronisasi antarperangkat belum ada.

## Keputusan / Decision

Kami akan menyimpan seluruh progres di `localStorage` perangkat, di balik port
`ProgressRepository`. Orang tua dapat mengekspor cadangan berupa berkas `.json`
dan memulihkannya di perangkat lain lewat Area Orang Tua. Tidak ada akun,
tidak ada basis data, tidak ada panggilan jaringan saat aplikasi berjalan.

## Alternatif yang ditolak / Rejected alternatives

- **Cloudflare D1 / KV dengan akun pengguna.** Memberi sinkronisasi, tetapi
  menambah backend, autentikasi, dan penyimpanan data anak di pihak ketiga —
  bertentangan dengan QAS-07 dan menambah kompleksitas besar untuk satu pengguna.
- **IndexedDB.** Lebih lapang dan asinkron, tetapi profil hanya berukuran
  puluhan kilobyte; API-nya jauh lebih rumit tanpa manfaat nyata di sini.
- **Cookie.** Terlalu kecil dan ikut terkirim ke server setiap permintaan.

## Konsekuensi / Consequences

**Positif**
- Nol biaya, nol permukaan serangan, nol kewajiban kepatuhan data anak.
- Membaca/menulis bersifat sinkron sehingga logika aplikasi tetap sederhana.

**Negatif / utang teknis**
- Progres hilang bila data situs dibersihkan atau perangkat diganti tanpa cadangan.
  Mitigasi: tombol cadangan/pemulihan + pengingat di Area Orang Tua.
- Belum ada sinkronisasi antarperangkat. Bila kelak dibutuhkan, cukup tambah
  adapter `d1ProgressRepository` (QAS-05); domain dan application tidak berubah.
- Safari dapat menghapus penyimpanan situs yang tidak dibuka selama 7 hari —
  risiko ini jauh berkurang setelah aplikasi **dipasang** ke layar utama.
