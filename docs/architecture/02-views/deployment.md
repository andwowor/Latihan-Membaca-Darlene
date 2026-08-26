# View Deployment / Deployment View (Kruchten 4+1)

Menjawab kepentingan: *di mana perangkat lunak ini berjalan, bagaimana ia sampai
ke sana, dan apa yang bisa gagal.*

## 1. Topologi

```mermaid
flowchart LR
  Dev["💻 Laptop pengembang<br/>npm run dev"] -->|git push| GH
  GH["🐙 GitHub<br/>repo + Actions"]
  GH -->|CI: test + lint + build| GH
  GH -->|wrangler deploy| CF
  CF["☁️ Cloudflare Workers<br/>Static Assets (dist/) + /api/progress"]
  CF --> D1[("D1: baca-yuk-darlene-progres<br/>tabel profiles")]
  CF -->|HTTPS, kunjungan pertama| Device
  Device["📱 Perangkat Darlene<br/>PWA terpasang"]
  Device --> SW["Service worker cache<br/>(seluruh aplikasi)"]
  Device --> LS[("localStorage<br/>progres belajar")]
  Device --> TTS["Mesin suara bawaan OS"]
```

## 2. Artefak yang Dikirim

`npm run build` menghasilkan `dist/`:

| Isi | Asal | Catatan |
|---|---|---|
| `index.html`, `css/`, `icons/`, `manifest.webmanifest` | `public/` | disalin apa adanya |
| `src/**/*.js` | `src/` | ES module asli, tanpa bundler |
| `sw.js` | `public/sw.js` + suntikan | versi & daftar precache diisi saat build |
| Worker `/api/progress` | `src/adapters/inbound/workerHttp.js` | dibundel wrangler; **tidak** ikut disajikan sebagai aset statis |

Tidak ada langkah transpilasi, tidak ada `node_modules` di produksi,
tidak ada rahasia di dalam artefak.

## 3. Lingkungan

| Lingkungan | Cara jalan | URL |
|---|---|---|
| Lokal | `npm run dev` (server statis Node) | `http://localhost:4173` |
| Pratinjau PR | Cloudflare preview (opsional, bila memakai Pages) | URL pratinjau |
| Produksi | `wrangler deploy` lewat GitHub Actions | `https://baca-yuk-darlene.<akun>.workers.dev` atau domain khusus |

## 4. Kredensial

Hanya dua, dan keduanya **hanya** hidup sebagai GitHub Secrets
(`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). Aplikasi yang berjalan tidak
membutuhkan kredensial apa pun. `.env.example` sengaja kosong nilainya.

## 5. Mode Kegagalan & Dampaknya

| Kegagalan | Dampak pada Darlene | Pemulihan |
|---|---|---|
| Cloudflare tidak bisa dijangkau | Tidak ada — service worker melayani dari cache | otomatis |
| Deploy gagal di CI | Versi lama tetap tayang | perbaiki lalu push ulang |
| `localStorage` penuh/diblokir | Progres tidak tersimpan, aplikasi tetap jalan | mode penyamaran → pakai jendela biasa |
| Sinkronisasi gagal (jaringan/API) | Tidak ada — belajar tetap jalan dari data lokal; status kegagalan tampil di Area Orang Tua | otomatis dicoba lagi pada perubahan berikutnya |
| D1 tidak terikat ke Worker | API menjawab 503 dan sinkronisasi dilaporkan gagal | periksa `d1_databases` di `wrangler.jsonc`, deploy ulang |
| Perangkat tidak punya suara Bahasa Indonesia | Soal tetap bisa dikerjakan tanpa suara | pasang suara Indonesia di setelan OS |
| Perangkat hilang / diganti | Progres hilang bila tidak dicadangkan | pulihkan dari berkas cadangan `.json` |

Rincian tindakan ada di `docs/runbook.md`.
