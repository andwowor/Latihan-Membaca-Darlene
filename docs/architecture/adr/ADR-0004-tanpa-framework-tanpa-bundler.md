# ADR-0004: Tanpa framework UI dan tanpa bundler

Tanggal   : 2026-08-25
Status    : Accepted

## Konteks / Context

Antarmuka aplikasi ini sederhana: lima tab, satu layar soal, beberapa daftar.
Kebutuhan performa (QAS-06) menuntut muatan awal kecil dan waktu siap di bawah
satu detik. Pemilik sistem merawat proyek ini sendirian, mungkin dengan jeda
berbulan-bulan, sehingga rantai perkakas yang cepat usang adalah risiko nyata.

## Keputusan / Decision

Kami akan memakai **ES module asli di peramban tanpa framework dan tanpa bundler**.
Proses build hanya menyalin berkas dan menyuntikkan daftar precache ke service
worker (`scripts/build.mjs`, ± 90 baris, tanpa dependensi). Repositori tidak
memiliki dependensi runtime maupun dependensi build.

## Alternatif yang ditolak / Rejected alternatives

- **React + Vite.** Ergonomis, tetapi menambah ratusan paket, `node_modules`
  ratusan megabyte, dan keharusan memperbarui rantai perkakas hanya agar proyek
  tetap bisa dibangun setahun kemudian. Manfaatnya kecil untuk UI sesederhana ini.
- **Web Components / Lit.** Lebih ringan dari React, tetapi tetap satu dependensi
  dan satu lapisan abstraksi tambahan tanpa kebutuhan yang mendesak.
- **TypeScript.** Sangat berguna, tetapi mewajibkan langkah kompilasi. Sebagai
  gantinya kami memakai JSDoc pada seluruh kontrak port dan fungsi publik,
  sehingga editor tetap memberi bantuan tipe.

## Konsekuensi / Consequences

**Positif**
- `git clone` lalu `npm run dev` langsung jalan; tidak ada `npm install`.
- Muatan awal kecil; tidak ada kode framework yang tidak terpakai.
- Test berjalan dengan runner bawaan Node (`node --test`), tanpa Jest/Vitest.

**Negatif / utang teknis**
- Tidak ada pemeriksaan tipe statis yang menggagalkan build. Mitigasi: JSDoc,
  lint, dan 121 test otomatis.
- Manipulasi DOM ditulis tangan lewat pembantu `ui/dom.js`. Bila layar bertambah
  jauh lebih banyak, keputusan ini layak ditinjau ulang lewat ADR baru.
