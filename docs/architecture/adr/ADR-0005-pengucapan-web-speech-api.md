# ADR-0005: Pengucapan kata memakai Web Speech API bawaan perangkat

Tanggal   : 2026-08-25
Status    : Accepted

## Konteks / Context

Latihan membaca untuk anak yang belum lancar membaca memerlukan contoh bunyi:
soal "dengarkan lalu pilih kata", "eja huruf", dan pengucapan setelah menjawab.
Materi mencakup dua bahasa (Indonesia dan Inggris) dan ± 190 kata serta 20
kalimat — terlalu banyak untuk direkam manual, dan akan terus bertambah.

## Keputusan / Decision

Kami akan memakai **Web Speech API (`speechSynthesis`)** bawaan peramban, di balik
port `SpeechPort`, dengan pemilihan suara per bahasa (`id-ID`, `en-US`) yang bisa
diatur orang tua. Perangkat tanpa Web Speech mendapat `nullSpeechAdapter`
sehingga aplikasi tetap berfungsi penuh, hanya tanpa suara.

## Alternatif yang ditolak / Rejected alternatives

- **Berkas audio rekaman.** Kualitas terbaik dan pasti konsisten, tetapi menambah
  ratusan berkas ke muatan offline dan membuat penambahan kata jadi mahal
  (bertentangan dengan QAS-04 dan QAS-06).
- **TTS awan (mis. Google/Azure).** Kualitas bagus, tetapi memerlukan kunci API,
  panggilan jaringan saat belajar, dan biaya — bertentangan dengan QAS-03 dan QAS-07.

## Konsekuensi / Consequences

**Positif**
- Nol biaya, nol berkas tambahan, bekerja offline, mendukung dua bahasa.
- Menambah kata baru otomatis ikut terucapkan.

**Negatif / utang teknis**
- Kualitas dan ketersediaan suara berbeda-beda antarperangkat; sebagian Android
  tidak memiliki suara Bahasa Indonesia. Mitigasi: pemilih suara + petunjuk di
  Area Orang Tua + aplikasi tetap bisa dipakai tanpa suara.
- iOS mewajibkan sentuhan pengguna sebelum suara pertama. Mitigasi: `unlockAudio()`
  dipanggil pada sentuhan pertama (lihat `02-views/process.md` §4).
- Bila kelak kualitas suara dianggap kurang, cukup tambah adapter baru
  (mis. berkas rekaman untuk kata inti) tanpa mengubah domain.
