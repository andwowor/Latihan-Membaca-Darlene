# View Proses / Process View (Kruchten 4+1)

Menjawab kepentingan: *apa yang terjadi, dalam urutan apa, saat sistem dipakai.*

Aplikasi ini berjalan **satu utas** di peramban. Tidak ada proses latar,
tidak ada pekerjaan terjadwal, tidak ada antrean. Yang perlu didokumentasikan
adalah tiga alur runtime berikut.

## 1. Menjawab satu soal

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

## 2. Menyelesaikan pelajaran

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

## 3. Pergantian hari (misi & streak)

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

## 4. Pembukaan kunci audio (khusus iOS)

Safari iOS melarang memutar audio sebelum ada sentuhan pengguna. Karena itu
`ui/App.js` memasang satu pendengar `pointerdown`/`keydown` yang memanggil
`container.unlockAudio()` sekali, lalu melepas dirinya sendiri.
Tanpa langkah ini, soal "dengarkan lalu pilih" akan bisu di iPhone.
