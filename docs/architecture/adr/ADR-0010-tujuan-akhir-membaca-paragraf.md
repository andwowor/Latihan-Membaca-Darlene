# ADR-0010: Tujuan akhir — membaca 2 paragraf per bahasa, tanpa menaikkan kesulitan

- Status: diterima
- Tanggal: 2026-08-27
- Pengambil keputusan: Andre S. Wowor (orang tua), asisten pengembang

## Konteks / Context

Orang tua menetapkan ukuran keberhasilan aplikasi secara eksplisit: Darlene
dinyatakan berhasil bila **mampu membaca 2 paragraf Bahasa Indonesia dan
2 paragraf Bahasa Inggris, masing-masing minimal 4 baris**. Dua batasan
menyertainya, keduanya juga eksplisit:

1. Desain kurikulum yang ada **sudah tepat** — tingkat kesulitannya pas dan
   **tidak boleh dinaikkan**.
2. Tujuan akhir itu harus benar-benar terdesain, bukan sekadar tersirat.

Kurikulum saat itu berpuncak pada kalimat tunggal 3–6 kata (unit Baca
Kalimat). Tidak ada satu pun tempat anak membaca teks bersambung, dan tidak
ada definisi "selesai" selain menamatkan semua pelajaran.

## Keputusan / Decision

**Panjang teks naik; kesulitan per kalimat tidak.** Itu prinsip utamanya,
dan ia ditegakkan oleh test, bukan niat baik:

- Setiap kata dalam cerita wajib berasal dari kosakata yang sudah diajarkan,
  kalimat latihan yang sudah ada, atau daftar kata sambung kecil yang
  eksplisit (`STORY_CONNECTORS`). Test menolak kata baru.
- Setiap baris tetap kalimat pendek (≤ 6 kata, seperti unit Baca Kalimat).

Dua unit baru berdiri **setelah** Baca Kalimat, tanpa menyentuh unit lama:

- **u12 Baca Cerita** (Indonesia) dan **u13 Story Time** (Inggris), naik
  setapak demi setapak: cerita 2 baris ➜ 3 baris ➜ 4 baris ➜
  **🎓 Ujian Membaca**.
- Pelajaran ujian berisi persis tujuan akhirnya: 2 cerita `exam` per bahasa,
  masing-masing 5 baris. Anak membacanya keras-keras; **orang tua yang
  menilai**, karena membaca nyaring hanya bisa dinilai telinga manusia
  (konsisten dengan T6). Urutan tipe soal pada pelajaran ujian dipilih agar
  soal baca-nyaring jatuh pada kedua cerita.
- Tujuan tampil sebagai kartu **🎯 Tujuan Akhir** di Area Orang Tua, dihitung
  murni dari status pelajaran ujian (`domain/goal.js`) — bukan dari XP.
- Dua lencana baru: *Pembaca Cerita* dan *Juara Membaca* (🎓, 200 poin).

Dua jenis soal baru: `story-line` (dengarkan satu baris, temukan barisnya di
dalam cerita — melatih mengikuti teks baris demi baris) dan `story-read`
(baca seluruh cerita, dinilai orang tua, terhitung soal baca-sendiri yang
dibatasi 2 per pelajaran).

## Alternatif yang ditolak / Rejected alternatives

- **Memperpanjang kalimat di unit lama** — ditolak tegas oleh orang tua:
  kesulitan tidak boleh naik.
- **Paragraf dengan kosakata baru yang lebih kaya** — sama: itu menaikkan
  kesulitan. Paragraf yang "membosankan" karena kata-katanya akrab justru
  tepat untuk pembaca pemula; keakraban itulah yang membuat anak lancar.
- **Menilai bacaan dengan pengenalan suara** — teknologi pengenalan suara
  anak 5 tahun dua bahasa tidak andal dan menuntut izin mikrofon; telinga
  orang tua lebih tepercaya (ADR-0005, T6).

## Konsekuensi / Consequences

**Positif**
- "Selesai" kini punya arti yang bisa ditunjuk: dua Ujian Membaca lulus.
- 54 pelajaran (semula 46); unit lama tidak berubah satu huruf pun.
- Invarian lama tetap berlaku di materi baru: tidak ada soal sebelum
  materinya diperkenalkan, soal baca-sendiri dibatasi, penggabungan profil
  monoton.

**Negatif / catatan**
- Soal `story-line` pada cerita 2 baris hanya punya 2 opsi — invarian
  "selalu 4 opsi" dilonggarkan khusus tipe itu, dengan alasan tercatat di
  test-nya: pengecohnya memang baris cerita itu sendiri.
- Pelajaran cerita berisi 2–4 materi, di bawah `MIN_ITEMS_PER_LESSON`; sah
  karena pengecoh datang dari dalam cerita, juga tercatat di test.
- Penilaian ujian subjektif (orang tua). Itu disengaja dan sudah menjadi
  pola sejak T6; ujian bisa diulang kapan pun lewat "Ulangi untuk 3 Bintang".
