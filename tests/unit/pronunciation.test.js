/**
 * Pelafalan Bahasa Indonesia untuk mesin suara asing.
 *
 * Bug yang melatarbelakangi berkas ini: pada perangkat tanpa suara Bahasa
 * Indonesia, "ba-bi-bu-be-bo" terdengar "ba-bi-bu-bi-bo" dan "ca-ci-cu-ce-co"
 * terdengar "ka-ci-cu-ce-ko" — aturan ejaan Inggris yang terbawa.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  syllabifyIndonesian, respellSyllable, respellIndonesian, letterName,
  INDONESIAN_LETTER_NAMES,
} from '../../src/domain/pronunciation.js';
import { WORD_LIST, LETTERS, SYLLABLE_FAMILIES } from '../../src/domain/vocabulary.js';

/* --------------------------- pemenggalan suku kata --------------------------- */

test('pemenggalan cocok dengan seluruh data suku kata di kamus', () => {
  const indonesian = WORD_LIST.filter((word) => word.lang === 'id');
  const berbeda = indonesian.filter(
    (word) => syllabifyIndonesian(word.text).join('-') !== word.syllables.join('-'),
  );
  assert.deepEqual(
    berbeda.map((word) => `${word.text}: ${syllabifyIndonesian(word.text).join('-')} != ${word.syllables.join('-')}`),
    [],
  );
});

test('gugus ng dan ny tidak pernah dipecah', () => {
  assert.deepEqual(syllabifyIndonesian('tangan'), ['ta', 'ngan']);
  assert.deepEqual(syllabifyIndonesian('bunga'), ['bu', 'nga']);
  assert.deepEqual(syllabifyIndonesian('monyet'), ['mo', 'nyet']);
  assert.deepEqual(syllabifyIndonesian('ungu'), ['u', 'ngu']);
});

test('diftong hanya berlaku di akhir kata', () => {
  assert.deepEqual(syllabifyIndonesian('hijau'), ['hi', 'jau']);
  assert.deepEqual(syllabifyIndonesian('pantai'), ['pan', 'tai']);
  assert.deepEqual(syllabifyIndonesian('laut'), ['la', 'ut']);
  assert.deepEqual(syllabifyIndonesian('air'), ['a', 'ir']);
  assert.deepEqual(syllabifyIndonesian('daun'), ['da', 'un']);
});

test('kata satu suku kata dan masukan kosong aman', () => {
  assert.deepEqual(syllabifyIndonesian('bus'), ['bus']);
  assert.deepEqual(syllabifyIndonesian('jam'), ['jam']);
  assert.deepEqual(syllabifyIndonesian(''), []);
});

/* ----------------------------- ejaan ulang bunyi ---------------------------- */

test('regresi: "be" tidak boleh terbaca "bi"', () => {
  assert.equal(respellSyllable('be'), 'beh');
  assert.notEqual(respellSyllable('be'), respellSyllable('bi'));
});

test('regresi: "ca" dan "co" tidak boleh terbaca "ka" dan "ko"', () => {
  assert.equal(respellSyllable('ca'), 'chah');
  assert.equal(respellSyllable('co'), 'choh');
  assert.equal(respellSyllable('ci'), 'chee');
});

test('seluruh keluarga suku kata menghasilkan lima bunyi yang berbeda', () => {
  SYLLABLE_FAMILIES.forEach((family) => {
    const bunyi = family.syllables.map(respellSyllable);
    assert.equal(new Set(bunyi).size, 5, `bunyi kembar pada keluarga ${family.consonant}: ${bunyi}`);
  });
});

test('vokal Indonesia dieja ulang secara konsisten', () => {
  assert.equal(respellSyllable('ba'), 'bah');
  assert.equal(respellSyllable('bi'), 'bee');
  assert.equal(respellSyllable('bu'), 'boo');
  assert.equal(respellSyllable('bo'), 'boh');
});

test('konsonan penutup suku kata dipertahankan', () => {
  assert.equal(respellSyllable('bek'), 'behk');
  assert.equal(respellSyllable('ngan'), 'ngahn');
});

test('kata utuh dieja ulang per suku kata', () => {
  assert.equal(respellIndonesian('kucing'), 'koo-cheeng');
  assert.equal(respellIndonesian('meja'), 'meh-jah');
  assert.equal(respellIndonesian('matahari'), 'mah-tah-hah-ree');
  assert.equal(respellIndonesian('hijau'), 'hee-jow');
});

test('kalimat dieja ulang tanpa merusak tanda baca', () => {
  assert.equal(respellIndonesian('Aku suka susu.'), 'ah-koo soo-kah soo-soo.');
  assert.match(respellIndonesian('Ini bola merah.'), /\.$/);
});

test('setiap kata Indonesia menghasilkan ejaan ulang yang tidak kosong', () => {
  WORD_LIST.filter((word) => word.lang === 'id').forEach((word) => {
    const respelled = respellIndonesian(word.text);
    assert.ok(respelled.length > 0, `${word.text} tidak menghasilkan apa pun`);
    assert.match(respelled, /^[a-z-]+$/, `${word.text} -> ${respelled}`);
  });
});

/* --------------------------------- huruf ---------------------------------- */

test('nama huruf memakai abjad Indonesia, bukan Inggris', () => {
  assert.equal(letterName('B'), 'be');
  assert.equal(letterName('C'), 'ce');
  assert.equal(letterName('G'), 'ge');
  assert.equal(letterName('W'), 'we');
  assert.equal(letterName('Z'), 'zet');
});

test('nama huruf untuk suara asing dieja ulang', () => {
  assert.equal(letterName('C', { foreignVoice: true }), 'cheh');
  assert.equal(letterName('B', { foreignVoice: true }), 'beh');
  assert.equal(letterName('Q', { foreignVoice: true }), 'kee');
});

test('seluruh huruf A sampai Z punya nama Indonesia', () => {
  LETTERS.forEach((letter) => {
    assert.ok(INDONESIAN_LETTER_NAMES[letter.letter], `huruf ${letter.letter} tanpa nama`);
    assert.ok(letterName(letter.letter, { foreignVoice: true }).length > 0);
  });
});

test('masukan yang bukan huruf dikembalikan apa adanya', () => {
  assert.equal(letterName('#'), '#');
});
