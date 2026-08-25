import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORD_LIST, WORDS, LETTERS, SYLLABLE_FAMILIES, SENTENCES, PICTURE_WORDS, wordsByCategory,
} from '../../src/domain/vocabulary.js';

test('bank kata berisi materi dua bahasa dalam jumlah memadai', () => {
  const indonesian = WORD_LIST.filter((word) => word.lang === 'id');
  const english = WORD_LIST.filter((word) => word.lang === 'en');
  assert.ok(indonesian.length >= 60, `kata Indonesia: ${indonesian.length}`);
  assert.ok(english.length >= 60, `kata Inggris: ${english.length}`);
});

test('setiap kata punya id unik dan bidang yang lengkap', () => {
  const ids = WORD_LIST.map((word) => word.id);
  assert.equal(new Set(ids).size, ids.length, 'ada id kembar');
  WORD_LIST.forEach((word) => {
    assert.ok(word.text, `${word.id} teks`);
    assert.ok(word.emoji, `${word.id} emoji`);
    assert.ok(word.translation, `${word.id} terjemahan`);
    assert.ok(word.category, `${word.id} kategori`);
    assert.ok(['id', 'en'].includes(word.lang), `${word.id} bahasa`);
  });
});

test('teks kata tidak kembar dalam satu bahasa', () => {
  ['id', 'en'].forEach((language) => {
    const texts = WORD_LIST.filter((word) => word.lang === language).map((word) => word.text);
    assert.equal(new Set(texts).size, texts.length, `kata kembar pada bahasa ${language}`);
  });
});

test('suku kata Bahasa Indonesia menyusun kembali katanya', () => {
  WORD_LIST.filter((word) => word.lang === 'id').forEach((word) => {
    assert.ok(Array.isArray(word.syllables), `${word.id} tidak punya suku kata`);
    assert.equal(word.syllables.join(''), word.text, `suku kata ${word.text} tidak cocok`);
  });
});

test('sight word ditandai dan tidak masuk daftar kata bergambar', () => {
  const sight = WORD_LIST.filter((word) => word.sight);
  assert.ok(sight.length >= 20);
  sight.forEach((word) => assert.equal(word.lang, 'en'));
  assert.equal(PICTURE_WORDS.some((word) => word.sight), false);
});

test('huruf A sampai Z lengkap dengan contoh dua bahasa', () => {
  assert.equal(LETTERS.length, 26);
  LETTERS.forEach((letter) => {
    assert.equal(
      letter.idWord[0].toLowerCase(), letter.letter.toLowerCase(),
      `contoh Indonesia huruf ${letter.letter}`,
    );
    assert.ok(letter.enWord && letter.enEmoji, `contoh Inggris huruf ${letter.letter}`);
  });
});

test('keluarga suku kata memakai lima vokal', () => {
  SYLLABLE_FAMILIES.forEach((family) => {
    assert.deepEqual(
      family.syllables,
      ['a', 'i', 'u', 'e', 'o'].map((vowel) => family.consonant + vowel),
    );
  });
});

test('kalimat tersedia untuk kedua bahasa dan punya gambar', () => {
  ['id', 'en'].forEach((language) => {
    const list = SENTENCES.filter((sentence) => sentence.lang === language);
    assert.ok(list.length >= 8, `kalimat ${language}: ${list.length}`);
    list.forEach((sentence) => {
      assert.ok(sentence.emoji, `${sentence.id} emoji`);
      assert.ok(sentence.text.split(' ').length >= 3, `${sentence.id} terlalu pendek`);
    });
  });
});

test('pencarian kata berdasarkan kategori bekerja', () => {
  assert.ok(wordsByCategory('id', 'hewan').length >= 10);
  assert.ok(WORDS['id-bola']);
  assert.equal(WORDS['id-bola'].translation, 'ball');
});
