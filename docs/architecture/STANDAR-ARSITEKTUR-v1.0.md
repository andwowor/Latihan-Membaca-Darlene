# Standar Arsitektur Perangkat Lunak / Software Architecture Standard
**Versi 1.0 — Andre S. Wowor**
Berlaku untuk semua proyek pribadi & bisnis / Applies to all personal & business projects

---

## 0. Cara Pakai / How to Use

Dokumen ini adalah **konstitusi teknis**: setiap proyek baru menyalin dokumen ini ke `docs/architecture/`, lalu mengisi bagian yang spesifik proyek (§2 Langkah 1 dan §7 Templat).
*This document is a technical constitution: every new project copies it into `docs/architecture/`, then fills in the project-specific parts (§2 Step 1 and §7 Templates).*

Aturan emas / Golden rule:
> Arsitektur tidak "benar" karena mengikuti tren, tetapi karena **dapat dijustifikasi terhadap kebutuhan kualitas** dan **terdokumentasi secara formal**.
> *An architecture is not "correct" because it follows a trend, but because it is justifiable against quality requirements and formally documented.*

---

## 1. Prinsip Dasar (Setiap Prinsip Punya Rujukan) / Core Principles (Each One Cited)

| # | Prinsip / Principle | Rujukan / Source |
|---|---|---|
| P1 | **Information hiding** — modul disembunyikan berdasarkan *keputusan desain yang mungkin berubah*, bukan berdasarkan urutan alur program. / Modules hide design decisions likely to change, not flowchart steps. | Parnas (1972), *CACM* 15(12) |
| P2 | **Low coupling, high cohesion** — ketergantungan antarmodul seminimal mungkin; isi satu modul harus satu tujuan. / Minimize inter-module dependency; maximize intra-module purpose. | Stevens, Myers & Constantine (1974), *IBM Systems Journal* |
| P3 | **Arsitektur digerakkan atribut kualitas**, bukan fitur. / Architecture is driven by quality attributes, not features. | Bass, Clements & Kazman (2021); ISO/IEC 25010:2023 |
| P4 | **Deskripsi arsitektur harus eksplisit** — stakeholder → concern → viewpoint → view. / Architecture description must be explicit. | ISO/IEC/IEEE 42010:2022 |
| P5 | **Substitutability** — subtipe harus bisa menggantikan supertipe tanpa merusak perilaku. / Subtypes must be substitutable. | Liskov & Wing (1994), *ACM TOPLAS* 16(6) |
| P6 | **Open–Closed** — terbuka untuk ekstensi, tertutup untuk modifikasi. / Open for extension, closed for modification. | Meyer (1988), *OOSC* |
| P7 | **Pilih *style* sebelum pilih framework.** / Choose the architectural style before the framework. | Garlan & Shaw (1994); Perry & Wolf (1992) |
| P8 | **Hukum Conway** — struktur sistem meniru struktur komunikasi pembuatnya. Karena kamu solo/tim kecil → **modular monolith**, bukan microservices. / Conway's Law: solo or small team ⇒ modular monolith, not microservices. | Conway (1968), *Datamation* |
| P9 | **Perangkat lunak pasti berubah** — desain harus mengasumsikan evolusi & pertumbuhan kompleksitas. / Software must evolve; complexity grows unless actively reduced. | Lehman (1980), *Proc. IEEE* 68(9) |
| P10 | **Setiap keputusan sulit-dibalik wajib dicatat** sebagai ADR. / Every hard-to-reverse decision is recorded as an ADR. | Nygard (2011) — praktisi/practitioner |
| P11 | **Evaluasi arsitektur sebelum dibangun** (trade-off, risk, sensitivity point). / Evaluate the architecture before building. | Kazman et al. (1998), ATAM/SEI |

⚠️ **Catatan kejujuran akademik / Academic honesty note:**
*Clean Architecture* (Martin, 2017), *Hexagonal/Ports & Adapters* (Cockburn, 2005), *Onion Architecture* (Palermo, 2008) adalah **literatur praktisi, bukan peer-reviewed**. Untuk skripsi/tesis/paper, **kutip akar akademiknya**: Parnas (1972) untuk modularitas, Dijkstra (1968) untuk *layering*, Jacobson (1992) untuk pemisahan entity–boundary–control.
*These are practitioner sources — cite their academic roots in any formal paper.*

---

## 2. Alur Kerja Wajib / Mandatory Workflow

Urutan ini tidak boleh dilompati. / Do not skip steps.

**Langkah 1 — Tulis Quality Attribute Scenarios (QAS).**
Format enam bagian (Bass et al.): *source – stimulus – artifact – environment – response – response measure*. Minimal 5 skenario. Ini adalah "spesifikasi" arsitektur.
*Write at least 5 six-part quality attribute scenarios. This is the architecture's real specification.*

**Langkah 2 — Pilih *architectural style*** dari §3 berdasarkan QAS, bukan berdasarkan tutorial YouTube.
*Select the style from §3 based on the QAS.*

**Langkah 3 — Dekomposisi modul menurut Parnas.**
Tanya: *"Keputusan apa yang paling mungkin berubah?"* → jadikan itu satu modul dengan antarmuka stabil. Contoh Co Clean: "format screenshot", "ID sheet bulanan", "provider WhatsApp" — semuanya keputusan volatil ⇒ wajib disembunyikan di balik *port*.
*Ask which decisions are most likely to change; hide each behind a stable interface.*

**Langkah 4 — Tetapkan lapisan + aturan dependensi** (§4). Dependensi hanya boleh mengarah ke dalam.
*Define layers and the inward-only dependency rule.*

**Langkah 5 — Dokumentasikan** dengan minimal 3 view (ISO 42010 / Kruchten 4+1): *logical*, *deployment*, *process*. Notasi praktis: diagram C4 level 1–2.
*Document with at least three views.*

**Langkah 6 — Tulis ADR** untuk setiap keputusan struktural (§7).

**Langkah 7 — Review gaya ATAM ringan**: daftar *trade-off point*, *sensitivity point*, dan risiko. Cukup 1 halaman untuk proyek kecil.
*Run a lightweight ATAM-style review — one page is enough for a small project.*

---

## 3. Katalog Style & Kapan Dipakai / Style Catalogue and When to Use

| Style | Sumber akademik / Academic source | Pakai bila / Use when |
|---|---|---|
| **Layered** | Dijkstra (1968); Garlan & Shaw (1994) | Default untuk aplikasi bisnis & dashboard |
| **Ports & Adapters** (akar: Parnas 1972, Jacobson 1992) | Parnas (1972) | Ada banyak integrasi eksternal (Sheets, Zapier, WhatsApp, bank) |
| **Pipe-and-Filter** | Garlan & Shaw (1994) | Pipeline data/ETL, transformasi bertahap |
| **Event-driven / Publish-Subscribe** | Garlan & Shaw (1994); Perry & Wolf (1992) | Cron & webhook memicu proses asinkron |
| **Client–Server** | Garlan & Shaw (1994) | Dashboard web + API |
| **Microservices** | Newman (2021) — praktisi | ⛔ Hindari untuk tim 1–3 orang (Hukum Conway) |

**Default resmi untuk semua proyekmu / Official default for all your projects:**
**Modular Monolith = Layered + Ports & Adapters + Event-driven pada batas otomasi.**
Alasan: satu pengembang, banyak integrasi eksternal, kebutuhan *maintainability* dan *modifiability* jauh di atas *scalability*.
*Reason: single developer, many external integrations, maintainability outweighs scalability.*

---

## 4. Struktur Folder Siap Pakai / Ready-to-Use Folder Structure

### 4.1 Struktur Referensi (bahasa-agnostik) / Reference Structure (language-agnostic)

```
project-root/
├── docs/
│   ├── architecture/
│   │   ├── 00-overview.md            # konteks & stakeholder (ISO 42010)
│   │   ├── 01-quality-attributes.md  # QAS 6-bagian (Bass et al.)
│   │   ├── 02-views/                 # logical / deployment / process (Kruchten 4+1)
│   │   │   ├── logical.md
│   │   │   ├── deployment.md
│   │   │   └── process.md
│   │   ├── 03-evaluation.md          # trade-off & risiko (ATAM ringan)
│   │   └── adr/
│   │       ├── ADR-0001-pilih-modular-monolith.md
│   │       └── ADR-0002-....md
│   └── runbook.md                    # cara operasikan & pulihkan sistem
├── src/
│   ├── domain/         # ENTITAS + ATURAN BISNIS MURNI. Tidak impor apa pun dari luar.
│   ├── application/    # use case / orkestrasi. Hanya impor domain + ports.
│   ├── ports/          # KONTRAK (interface): inbound & outbound
│   ├── adapters/
│   │   ├── inbound/    # http handler, cron trigger, webhook, CLI, UI controller
│   │   └── outbound/   # google sheets, database, API bank, WhatsApp, storage
│   ├── config/         # composition root: baca env, rakit dependensi (wiring)
│   └── shared/         # utilitas murni: tanggal, uang, validasi. TANPA aturan bisnis.
├── tests/
│   ├── unit/           # domain + application (paling banyak)
│   ├── integration/    # adapters (sedang)
│   └── e2e/            # alur penuh (paling sedikit)
├── scripts/            # tugas sekali jalan / migrasi
├── .env.example        # TIDAK PERNAH berisi kredensial asli
├── .gitignore
└── README.md
```

**Aturan dependensi (tidak bisa dinegosiasi) / Dependency rule (non-negotiable):**

```
adapters ──▶ ports ──▶ application ──▶ domain
                                        ▲
                        domain tidak menunjuk ke mana pun
                        domain points to nothing
```

Uji cepat: buka file mana pun di `src/domain/`. Jika ada `import` berisi nama library, framework, atau nama vendor (google, zapier, cloudflare) → **arsitektur sudah rusak**.
*Quick test: any vendor or framework import inside `src/domain/` means the architecture is already broken.*

### 4.2 Varian A — Web App / Dashboard (Cloudflare Workers + Pages)

```
src/
├── domain/           # perhitungan kas, saldo, rekonsiliasi
├── application/      # useCaseRekonsiliasiHarian.ts
├── ports/            # LedgerRepository.ts, NotificationSender.ts
├── adapters/
│   ├── inbound/      # worker-http.ts, worker-cron.ts
│   └── outbound/     # sheetsRepository.ts, d1Repository.ts, whatsappSender.ts
├── config/           # env.ts, container.ts
└── ui/               # halaman statis Pages (presentasi saja, tanpa aturan bisnis)
```

### 4.3 Varian B — Google Apps Script (file datar / flat namespace)

Apps Script tidak punya folder, jadi **prefix nama file menggantikan folder** — prinsip Parnas tetap berlaku.
*Apps Script has no folders, so filename prefixes replace them; Parnas still applies.*

```
00_config.gs          # konstanta, ID sheet, composition root
10_domain_kas.gs      # aturan bisnis murni, tanpa SpreadsheetApp
11_domain_saldo.gs
20_app_rekonsiliasi.gs
30_port_ledger.gs     # kontrak: simpan(), ambil()
40_adapter_sheets.gs  # SATU-SATUNYA file yang boleh memanggil SpreadsheetApp
41_adapter_gmail.gs
90_triggers.gs        # entry point time-driven
99_tests.gs
```

---

## 5. Aturan yang Tidak Boleh Dilanggar / Non-Negotiable Rules

1. `domain/` tidak mengimpor framework, SDK, atau vendor apa pun. *(P1, P2)*
2. Tidak ada aturan bisnis di dalam handler HTTP, trigger, atau komponen UI. *(P2)*
3. Setiap sistem eksternal diakses **hanya** lewat satu adapter di balik satu port. *(P1, P7)*
4. Kredensial hanya lewat environment variable / secret manager — tidak pernah di kode atau di Git. *(ISO 25010: Security)*
5. Satu modul = satu keputusan yang disembunyikan. Jika sulit dinamai, dekomposisinya salah. *(P1)*
6. Fungsi dengan *cyclomatic complexity* > 10 wajib dipecah. *(McCabe, 1976)*
7. Keputusan yang mahal dibalik ⇒ wajib ADR sebelum kode ditulis. *(P10)*
8. Setiap perbaikan bug wajib didahului satu test yang gagal. *(Beck, 2002; bukti empiris: Nagappan et al., 2008)*
9. Utang teknis dicatat eksplisit di `docs/architecture/03-evaluation.md`, tidak disimpan di kepala. *(Cunningham, 1992; Kruchten et al., 2012)*
10. README wajib bisa membawa orang asing dari nol sampai jalan dalam 10 menit.

---

## 6. Konvensi Kode & Metrik Kualitas / Code Conventions and Quality Metrics

| Aspek | Aturan | Rujukan |
|---|---|---|
| Penamaan | Nama penuh & deskriptif, hindari singkatan. Nama panjang terbukti mempercepat pemahaman. | Lawrie et al. (2006), ICPC |
| Gaya identifier | Konsisten satu gaya per bahasa (`camelCase` JS/TS, `snake_case` Python). | Binkley et al. (2009), ICPC |
| Kompleksitas | Cyclomatic complexity ≤ 10 per fungsi | McCabe (1976) |
| Metrik OO | Pantau WMC, DIT, CBO, LCOM bila memakai OOP | Chidamber & Kemerer (1994) |
| Testing | Piramida: unit ≫ integration ≫ e2e; domain wajib 100% teruji | Beck (2002); Nagappan et al. (2008) |
| Review | Checklist §9 sebelum merge | Fagan (1976), *IBM Systems Journal* |

### Tooling SaaS-first (siap pakai, tanpa self-host)

| Kebutuhan | Pilihan SaaS |
|---|---|
| Repo + ADR + CI | **GitHub** (repo privat + GitHub Actions) |
| Metrik kompleksitas & code smell otomatis | **SonarCloud** atau **Codacy** |
| Diagram arsitektur C4 | **Structurizr Cloud**, alternatif: **Lucidchart** / **Miro** |
| Hosting dashboard | **Cloudflare Pages + Workers** (sudah kamu pilih) |
| Monitoring error produksi | **Sentry** |
| Dokumentasi terbaca tim/klien | **Notion** (mirror dari `docs/`) |

---

## 7. Templat / Templates

### 7.1 Quality Attribute Scenario

```
ID           : QAS-01
Atribut      : Modifiability (ISO/IEC 25010)
Source       : Pemilik sistem
Stimulus     : Provider WhatsApp diganti
Artifact     : Modul notifikasi
Environment  : Waktu desain, sistem berjalan normal
Response     : Ganti satu adapter outbound
Response Msr : < 4 jam kerja, 0 perubahan di domain/ dan application/
```

### 7.2 ADR (format Nygard)

```
# ADR-0001: <Judul keputusan>
Tanggal   : YYYY-MM-DD
Status    : Proposed | Accepted | Superseded by ADR-XXXX

## Konteks / Context
Fakta dan batasan yang berlaku. Netral, tanpa opini.

## Keputusan / Decision
"Kami akan ..."

## Alternatif yang ditolak / Rejected alternatives
Opsi lain + alasan penolakan.

## Konsekuensi / Consequences
Positif, negatif, dan utang teknis yang muncul.
```

### 7.3 Kerangka README

`Tujuan → Arsitektur singkat (1 diagram) → Prasyarat → Instalasi → Menjalankan → Test → Deploy → Runbook → Lisensi`

---

## 8. Daftar Referensi Lengkap / Full Reference List

### A. Standar internasional / International standards
- ISO/IEC/IEEE 42010:2022. *Software, systems and enterprise — Architecture description.* Geneva: ISO.
- ISO/IEC 25010:2023. *Systems and software engineering — SQuaRE — Product quality model.* Geneva: ISO.
- ISO/IEC/IEEE 12207:2017. *Software life cycle processes.* Geneva: ISO.

### B. Makalah *peer-reviewed* fondasional / Seminal peer-reviewed papers
- Dijkstra, E. W. (1968). The structure of the "THE"-multiprogramming system. *Communications of the ACM*, 11(5), 341–346.
- Conway, M. E. (1968). How do committees invent? *Datamation*, 14(5), 28–31.
- Parnas, D. L. (1972). On the criteria to be used in decomposing systems into modules. *Communications of the ACM*, 15(12), 1053–1058.
- Stevens, W. P., Myers, G. J., & Constantine, L. L. (1974). Structured design. *IBM Systems Journal*, 13(2), 115–139.
- Fagan, M. E. (1976). Design and code inspections to reduce errors in program development. *IBM Systems Journal*, 15(3), 182–211.
- McCabe, T. J. (1976). A complexity measure. *IEEE Transactions on Software Engineering*, SE-2(4), 308–320.
- Lehman, M. M. (1980). Programs, life cycles, and laws of software evolution. *Proceedings of the IEEE*, 68(9), 1060–1076.
- Perry, D. E., & Wolf, A. L. (1992). Foundations for the study of software architecture. *ACM SIGSOFT Software Engineering Notes*, 17(4), 40–52.
- Chidamber, S. R., & Kemerer, C. F. (1994). A metrics suite for object oriented design. *IEEE Transactions on Software Engineering*, 20(6), 476–493.
- Liskov, B. H., & Wing, J. M. (1994). A behavioral notion of subtyping. *ACM TOPLAS*, 16(6), 1811–1841.
- Garlan, D., & Shaw, M. (1994). *An introduction to software architecture* (CMU-CS-94-166). Carnegie Mellon University.
- Kruchten, P. (1995). Architectural blueprints — the "4+1" view model of software architecture. *IEEE Software*, 12(6), 42–50.
- Kazman, R., Klein, M., Barbacci, M., Longstaff, T., Lipson, H., & Carriere, J. (1998). The architecture tradeoff analysis method. *Proc. ICECCS*, 68–78.
- Lawrie, D., Morrell, C., Feild, H., & Binkley, D. (2006). What's in a name? A study of identifiers. *Proc. ICPC*, 3–12.
- Nagappan, N., Maximilien, E. M., Bhat, T., & Williams, L. (2008). Realizing quality improvement through test driven development. *Empirical Software Engineering*, 13(3), 289–302.
- Binkley, D., Davis, M., Lawrie, D., & Morrell, C. (2009). To CamelCase or under_score. *Proc. ICPC*, 158–167.
- Kruchten, P., Nord, R. L., & Ozkaya, I. (2012). Technical debt: From metaphor to theory and practice. *IEEE Software*, 29(6), 18–21.

### C. Buku akademik / Academic books
- Meyer, B. (1997). *Object-oriented software construction* (2nd ed.). Prentice Hall.
- Jacobson, I. (1992). *Object-oriented software engineering: A use case driven approach.* Addison-Wesley.
- Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design patterns.* Addison-Wesley.
- Baldwin, C. Y., & Clark, K. B. (2000). *Design rules: The power of modularity.* MIT Press.
- Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4th ed.). Addison-Wesley.
- Clements, P., et al. (2010). *Documenting software architectures: Views and beyond* (2nd ed.). Addison-Wesley.

### D. Referensi praktisi (boleh dipakai, JANGAN dikutip sebagai sumber akademik utama)
*Practitioner sources — usable, but do not cite as primary academic evidence*
- Beck, K. (2002). *Test-driven development: By example.*
- Fowler, M. (2002). *Patterns of enterprise application architecture.*
- Evans, E. (2003). *Domain-driven design.*
- Cockburn, A. (2005). *Hexagonal architecture (ports & adapters).*
- Nygard, M. (2011). *Documenting architecture decisions.*
- Martin, R. C. (2017). *Clean architecture.*
- Newman, S. (2021). *Building microservices* (2nd ed.).

---

## 9. Checklist Verifikasi Sebelum Merge / Pre-Merge Verification Checklist

- [ ] QAS proyek sudah ditulis dan masih relevan
- [ ] Tidak ada import vendor/framework di `domain/`
- [ ] Setiap sistem eksternal punya tepat satu adapter di balik satu port
- [ ] Tidak ada aturan bisnis di handler / trigger / UI
- [ ] Cyclomatic complexity setiap fungsi ≤ 10
- [ ] Test unit domain lulus 100%
- [ ] ADR baru dibuat untuk setiap keputusan struktural
- [ ] Tidak ada kredensial di dalam kode atau riwayat Git
- [ ] README masih akurat
- [ ] Utang teknis baru dicatat di `03-evaluation.md`

---

*Dokumen ini adalah standar hidup — perbarui versinya lewat ADR, bukan lewat edit diam-diam.*
*This is a living standard — change it through an ADR, never through a silent edit.*
