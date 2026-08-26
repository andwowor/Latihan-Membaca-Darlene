# View Proses / Process View (Kruchten 4+1)

Menjawab kepentingan: *apa yang terjadi, dalam urutan apa, saat sistem dipakai.*

Aplikasi ini berjalan **satu utas** di peramban. Tidak ada proses latar,
tidak ada pekerjaan terjadwal, tidak ada antrean. Yang perlu didokumentasikan
adalah tiga alur runtime berikut.

## 1. Menjalani satu pelajaran

Sejak versi 1.2.0 pelajaran dimulai dengan **kartu perkenalan**, bukan langsung
soal, supaya anak tidak ditanya kata yang belum ia ketahui artinya.

```mermaid
stateDiagram-v2
  [*] --> Perkenalan: materi baru / belum kuat
  [*] --> Soal: semua materi sudah dikuasai
  Perkenalan --> Perkenalan: "Aku sudah tahu"
  Perkenalan --> Soal: kartu terakhir
  Soal --> Soal: jawab lalu lanjut
  Soal --> Hasil: soal ke-8 selesai
  Hasil --> [*]
```

Soal hanya boleh menyangkut materi yang baru diperkenalkan atau yang sudah
dikenal anak — dijaga oleh `coveredItemIds()` di lapisan domain.

## 2. Menjawab satu soal

```mermaid
sequenceDiagram
  autonumber
  participant Anak as 👧 Darlene
  participant View as ui/lessonView
  participant Sess as application/LessonSession
  participant Dom as domain (grading, profile)
  participant Prof as application/ProfileService
  participant Repo as adapters/localStorage
  participant Snd as adapters/WebAudio + WebSpeech

  Anak->>View: ketuk pilihan jawaban
  View->>Sess: answer(response)
  Sess->>Dom: isAnswerCorrect(question, response)
  Dom-->>Sess: benar / salah
  Sess->>Prof: apply(registerAnswer)
  Prof->>Dom: registerAnswer(profile, ...) → profil baru
  Prof->>Dom: grantNewAchievements(profil baru)
  Prof->>Repo: save(profil)
  Prof-->>Sess: achievement baru (bila ada)
  Sess-->>View: {correct, xpGained, unlocked}
  View->>Snd: mainkan efek + ucapkan kata
  View-->>Anak: panel umpan balik + tombol Lanjut
```

Catatan penting: **penyimpanan terjadi setiap jawaban**, bukan di akhir pelajaran.
Aplikasi yang tertutup di tengah jalan tidak menghilangkan progres.

## 3. Menyelesaikan pelajaran

```mermaid
sequenceDiagram
  autonumber
  participant View as ui/lessonView
  participant Sess as application/LessonSession
  participant Dom as domain (scoring, streak, medals, achievements)
  participant Prof as application/ProfileService

  View->>Sess: next() pada soal terakhir
  Sess->>Prof: apply(registerLessonCompletion)
  Prof->>Dom: starsForMistakes + lessonCompletionXp
  Prof->>Dom: advanceStreak(todayKey)
  Prof->>Dom: grantNewAchievements (cek medali, XP, streak, kata dikuasai)
  Prof-->>Sess: {stars, xpBonus, streak, unlocked, leveledUp}
  Sess-->>View: hasil pelajaran
  View-->>View: konfeti, bintang, notifikasi lencana
```

## 3b. Pergantian hari (misi & streak)

Tidak ada penjadwal. Pergantian hari dievaluasi **saat aplikasi dipakai**
(`rollToDay` dipanggil ketika profil dimuat dan pada setiap perubahan):

```mermaid
stateDiagram-v2
  [*] --> Dibuka
  Dibuka --> HariSama: daily.day == hari ini
  Dibuka --> HariBaru: daily.day != hari ini
  HariBaru --> Arsipkan: simpan capaian kemarin ke history
  Arsipkan --> UndiMisi: missionsForDay(hari ini) — berbenih tanggal
  UndiMisi --> HariSama
  HariSama --> [*]
```

Karena undian misi berbenih tanggal (`seededRandom("darlene-YYYY-MM-DD")`),
misi hari itu tetap sama walau aplikasi ditutup dan dibuka berkali-kali,
dan tidak perlu disimpan di server.

## 4. Sinkronisasi antar perangkat

Sinkronisasi tidak pernah menghalangi anak belajar: seluruhnya berjalan di latar
belakang, dan kegagalan hanya dicatat untuk ditampilkan ke orang tua.

```mermaid
sequenceDiagram
  autonumber
  participant HP as 📱 Perangkat
  participant Sync as application/SyncService
  participant API as Worker /api/progress
  participant Dom as domain/merge.js
  participant D1 as D1 profiles

  Note over Sync: dipicu 6 detik setelah progres berubah,<br/>atau saat aplikasi dibuka
  Sync->>Sync: buang kode sinkron dari salinan yang dikirim
  Sync->>API: PUT profil (header X-Sync-Code)
  API->>API: hash SHA-256 kode
  API->>D1: ambil profil tersimpan
  API->>Dom: mergeProfiles(tersimpan, kiriman)
  API->>D1: simpan hasil gabungan
  API-->>Sync: profil gabungan
  Sync->>HP: adopsi hasil, pasang kembali pengaturan perangkat ini
```

Tiga hal yang dijaga di alur ini:

1. **Kode sinkron tidak pernah ikut terkirim** — ia kredensial, bukan data.
2. **Pengaturan suara tidak ikut digabung** — suara yang terpasang berbeda
   di tiap perangkat.
3. **Perubahan akibat sinkronisasi tidak memicu sinkronisasi lagi** — kalau
   tidak dijaga, adopsi hasil gabungan akan memicu gelung tanpa akhir.

## 5. Pembukaan kunci audio (khusus iOS)

Safari iOS melarang memutar audio sebelum ada sentuhan pengguna. Karena itu
`ui/App.js` memasang satu pendengar `pointerdown`/`keydown` yang memanggil
`container.unlockAudio()` sekali, lalu melepas dirinya sendiri.
Tanpa langkah ini, soal "dengarkan lalu pilih" akan bisu di iPhone.
