# ADR-0003: Hosting di Cloudflare Workers (static assets) via GitHub Actions

Tanggal   : 2026-08-25
Status    : Accepted

## Konteks / Context

Aplikasi harus dapat dipasang sebagai PWA, yang mensyaratkan HTTPS. Pemilik
sistem sudah memakai Cloudflare dan GitHub sebagai perkakas SaaS standar
(Standar §6). Artefak yang dihasilkan sepenuhnya statis: HTML, CSS, JS, ikon.

## Keputusan / Decision

Kami akan menayangkan folder `dist/` sebagai **Cloudflare Workers Static Assets**
(`wrangler.jsonc`, `assets.directory = ./dist`,
`not_found_handling = single-page-application`), dan mengunggahnya otomatis lewat
GitHub Actions (`cloudflare/wrangler-action`) setiap kali `main` berubah.
Kredensial disimpan sebagai GitHub Secrets, tidak pernah di dalam kode.

## Alternatif yang ditolak / Rejected alternatives

- **Cloudflare Pages (integrasi Git).** Sama baiknya dan bahkan lebih sedikit
  langkah; tetap didokumentasikan di runbook sebagai jalur alternatif. Tidak
  dipilih sebagai jalur utama karena Workers Static Assets adalah arah resmi
  Cloudflare saat ini dan memberi satu berkas konfigurasi yang ikut di-versi.
- **GitHub Pages.** Gratis dan sederhana, tetapi menambah platform ketiga
  sementara Cloudflare sudah dipakai.
- **VPS / server sendiri.** Berlebihan untuk berkas statis; menambah beban rawat.

## Konsekuensi / Consequences

**Positif**
- HTTPS, CDN global, dan biaya nol pada paket gratis.
- Konfigurasi deploy ikut ter-versi bersama kode.
- Fork tanpa rahasia tetap lulus CI (langkah deploy dilewati, bukan gagal).

**Negatif / utang teknis**
- Terikat pada perkakas `wrangler`; migrasi ke penyedia lain berarti mengganti
  satu berkas konfigurasi dan satu workflow (murah, tetapi bukan nol).
