# ADR-0001: Memakai modular monolith (Layered + Ports & Adapters)

Tanggal   : 2026-08-25
Status    : Accepted

## Konteks / Context

Sistem dibangun dan dirawat oleh satu orang. Kebutuhan mutu tertinggi adalah
*modifiability* (materi belajar akan sering ditambah) dan *usability* untuk anak
5 tahun; *scalability* praktis tidak relevan karena penggunanya satu anak.
Terdapat beberapa titik sentuh eksternal yang berpotensi berubah: penyimpanan
progres, mesin pengucapan kata, efek suara, dan platform hosting.

## Keputusan / Decision

Kami akan memakai **modular monolith** dengan gaya **Layered + Ports & Adapters**
sesuai default resmi Standar Arsitektur §3, dengan lapisan
`domain → application → ports → adapters`, ditambah `ui/`, `config/`, dan `shared/`.
Aturan dependensi hanya boleh mengarah ke dalam dan **ditegakkan otomatis** lewat
aturan ESLint (`no-restricted-imports`, `no-restricted-globals`,
`no-restricted-properties`) yang dijalankan di CI.

## Alternatif yang ditolak / Rejected alternatives

- **Satu berkas JavaScript besar.** Paling cepat ditulis, tetapi setiap penambahan
  materi berisiko merusak aturan permainan; tidak ada tempat alami untuk test.
- **Microservices / backend terpisah.** Ditolak karena Hukum Conway (Conway, 1968):
  tim satu orang tidak akan mampu merawat batas layanan; juga menambah biaya dan
  titik gagal untuk kebutuhan yang bisa dipenuhi berkas statis.
- **Framework SPA (React/Vue) dengan struktur berbasis komponen saja.** Ditolak
  karena struktur folder berbasis komponen tidak menyembunyikan keputusan volatil;
  lihat ADR-0004.

## Konsekuensi / Consequences

**Positif**
- Menambah 20 kata cukup menyentuh satu berkas (QAS-04 terpenuhi).
- Mengganti penyimpanan lokal ke awan cukup satu adapter baru (QAS-05 terpenuhi).
- Aturan permainan bisa diuji tanpa peramban; suite selesai di bawah 5 detik.

**Negatif / utang teknis**
- Berkas lebih banyak untuk aplikasi yang secara fitur tergolong kecil.
- Perlu disiplin: godaan menaruh aturan bisnis di dalam view selalu ada.
  Mitigasi: aturan lint per-lapisan + checklist pra-merge Standar §9.
