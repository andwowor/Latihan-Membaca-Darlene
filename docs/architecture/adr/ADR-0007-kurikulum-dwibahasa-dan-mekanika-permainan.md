# ADR-0007: Kurikulum dwibahasa dicampur, dengan mekanika permainan tanpa hukuman

Tanggal   : 2026-08-25
Status    : Accepted

## Konteks / Context

Permintaan pemilik sistem: materi membaca **mencampur Bahasa Indonesia dan
Bahasa Inggris**, dengan mekanika bergaya Duolingo (XP, medali, misi harian,
poin prestasi) untuk anak 5 tahun kelas K2. Duolingo sendiri memakai sistem
"nyawa" (hearts) yang menghentikan pelajaran saat pengguna terlalu banyak salah.

## Keputusan / Decision

1. **Pencampuran bahasa dilakukan pada tingkat unit dan pelajaran**, bukan
   dipisah menjadi dua kurikulum: unit tema (tubuh, hewan, alam, kendaraan)
   menyelang-nyelingkan kata Indonesia dan Inggris dalam satu pelajaran, sementara
   unit dasar (huruf, suku kata) dan unit sight words tetap fokus satu bahasa.
2. **Tidak ada mekanisme kalah.** Kesalahan hanya mengurangi bintang
   (3 → 2 → 1, tidak pernah 0) dan menurunkan skor penguasaan kata; pelajaran
   selalu bisa diselesaikan. Anak selalu pulang membawa sesuatu.
3. **Soal "baca keras-keras" dinilai sendiri** oleh anak/orang tua, dan dibatasi
   maksimal 2 soal per pelajaran.

## Alternatif yang ditolak / Rejected alternatives

- **Dua kurikulum terpisah (ID dan EN).** Lebih rapi secara struktur, tetapi
  bertentangan dengan permintaan "materi dicampur" dan membuat anak harus memilih
  jalur — keputusan yang tidak pantas dibebankan ke anak 5 tahun.
- **Sistem hearts ala Duolingo.** Terbukti memotivasi orang dewasa, tetapi
  menghentikan anak di tengah pelajaran berisiko membuat latihan membaca terasa
  seperti hukuman.
- **Pengenalan suara (speech recognition) untuk menilai bacaan.** Menggiurkan,
  tetapi akurasinya buruk untuk suara anak-anak dan tidak tersedia offline di iOS;
  hasil negatif palsu akan sangat mengecilkan hati.

## Konsekuensi / Consequences

**Positif**
- Kedua bahasa dilatih setiap hari tanpa menambah beban navigasi.
- Anak tidak pernah "kalah"; motivasi datang dari bintang, medali, dan misi.

**Negatif / utang teknis**
- Penilaian mandiri pada soal baca-keras tidak bisa dipercaya sepenuhnya sebagai
  ukuran kemampuan. Mitigasi: metrik tersebut dipisah di Area Orang Tua dan tidak
  dipakai sebagai satu-satunya penentu penguasaan kata.
- Belum ada pengaturan untuk membatasi materi hanya satu bahasa bila kelak
  dibutuhkan; penambahannya kecil (penyaring di `curriculum.js`).
