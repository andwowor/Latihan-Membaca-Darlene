/**
 * Bank kata untuk latihan membaca Darlene (K2, 5 tahun).
 * Materi dicampur: Bahasa Indonesia + Bahasa Inggris.
 *
 * Format ringkas dipakai supaya datanya gampang dibaca & ditambah:
 *   Indonesia : 'kata|emoji|su-ku-ka-ta|arti inggris|kategori'
 *   Inggris   : 'word|emoji|arti indonesia|kategori'
 */

const ID_RAW = [
  // benda sehari-hari
  'bola|⚽|bo-la|ball|benda',
  'buku|📚|bu-ku|book|benda',
  'balon|🎈|ba-lon|balloon|benda',
  'topi|🎩|to-pi|hat|benda',
  'baju|👕|ba-ju|shirt|benda',
  'sepatu|👟|se-pa-tu|shoes|benda',
  'tas|🎒|tas|bag|benda',
  'pensil|✏️|pen-sil|pencil|benda',
  'jam|⏰|jam|clock|benda',
  'kunci|🔑|kun-ci|key|benda',
  'pintu|🚪|pin-tu|door|benda',
  'kursi|🪑|kur-si|chair|benda',
  'lampu|💡|lam-pu|lamp|benda',
  'payung|☂️|pa-yung|umbrella|benda',
  'kado|🎁|ka-do|gift|benda',
  'gitar|🎸|gi-tar|guitar|benda',
  // makanan
  'susu|🥛|su-su|milk|makanan',
  'roti|🍞|ro-ti|bread|makanan',
  'nasi|🍚|na-si|rice|makanan',
  'telur|🥚|te-lur|egg|makanan',
  'apel|🍎|a-pel|apple|makanan',
  'pisang|🍌|pi-sang|banana|makanan',
  'jeruk|🍊|je-ruk|orange|makanan',
  'anggur|🍇|ang-gur|grapes|makanan',
  'kue|🍰|ku-e|cake|makanan',
  'permen|🍬|per-men|candy|makanan',
  'madu|🍯|ma-du|honey|makanan',
  'keju|🧀|ke-ju|cheese|makanan',
  // anggota tubuh
  'mata|👁️|ma-ta|eye|tubuh',
  'kaki|🦶|ka-ki|foot|tubuh',
  'tangan|✋|ta-ngan|hand|tubuh',
  'hidung|👃|hi-dung|nose|tubuh',
  'mulut|👄|mu-lut|mouth|tubuh',
  'telinga|👂|te-li-nga|ear|tubuh',
  'gigi|🦷|gi-gi|tooth|tubuh',
  // keluarga
  'ibu|👩|i-bu|mother|keluarga',
  'ayah|👨|a-yah|father|keluarga',
  'adik|👶|a-dik|little sibling|keluarga',
  'kakak|🧒|ka-kak|big sibling|keluarga',
  'nenek|👵|ne-nek|grandma|keluarga',
  'kakek|👴|ka-kek|grandpa|keluarga',
  // hewan
  'kucing|🐱|ku-cing|cat|hewan',
  'anjing|🐶|an-jing|dog|hewan',
  'ikan|🐟|i-kan|fish|hewan',
  'burung|🐦|bu-rung|bird|hewan',
  'sapi|🐄|sa-pi|cow|hewan',
  'ayam|🐔|a-yam|chicken|hewan',
  'bebek|🦆|be-bek|duck|hewan',
  'kuda|🐴|ku-da|horse|hewan',
  'kelinci|🐰|ke-lin-ci|rabbit|hewan',
  'gajah|🐘|ga-jah|elephant|hewan',
  'monyet|🐵|mo-nyet|monkey|hewan',
  'katak|🐸|ka-tak|frog|hewan',
  'lebah|🐝|le-bah|bee|hewan',
  'semut|🐜|se-mut|ant|hewan',
  'ular|🐍|u-lar|snake|hewan',
  'singa|🦁|si-nga|lion|hewan',
  // alam
  'matahari|☀️|ma-ta-ha-ri|sun|alam',
  'bulan|🌙|bu-lan|moon|alam',
  'bintang|⭐|bin-tang|star|alam',
  'awan|☁️|a-wan|cloud|alam',
  'hujan|🌧️|hu-jan|rain|alam',
  'api|🔥|a-pi|fire|alam',
  'air|💧|a-ir|water|alam',
  'gunung|⛰️|gu-nung|mountain|alam',
  'laut|🌊|la-ut|sea|alam',
  'bunga|🌸|bu-nga|flower|alam',
  'pohon|🌳|po-hon|tree|alam',
  'daun|🍃|da-un|leaf|alam',
  // tempat & kendaraan
  'rumah|🏠|ru-mah|house|kendaraan',
  'mobil|🚗|mo-bil|car|kendaraan',
  'sepeda|🚲|se-pe-da|bicycle|kendaraan',
  'kapal|🚢|ka-pal|ship|kendaraan',
  'bus|🚌|bus|bus|kendaraan',
  'kereta|🚂|ke-re-ta|train|kendaraan',
  'pesawat|✈️|pe-sa-wat|airplane|kendaraan',
  // warna
  'merah|🔴|me-rah|red|warna',
  'biru|🔵|bi-ru|blue|warna',
  'kuning|🟡|ku-ning|yellow|warna',
  'hijau|🟢|hi-jau|green|warna',
  'hitam|⚫|hi-tam|black|warna',
  'putih|⚪|pu-tih|white|warna',
  'ungu|🟣|u-ngu|purple|warna',
];

const EN_RAW = [
  // animals
  'cat|🐱|kucing|animal', 'dog|🐶|anjing|animal', 'pig|🐷|babi|animal',
  'cow|🐄|sapi|animal', 'hen|🐔|ayam|animal', 'fox|🦊|rubah|animal',
  'bee|🐝|lebah|animal', 'ant|🐜|semut|animal', 'fish|🐟|ikan|animal',
  'bird|🐦|burung|animal', 'duck|🦆|bebek|animal', 'frog|🐸|katak|animal',
  'lion|🦁|singa|animal', 'bear|🐻|beruang|animal', 'horse|🐴|kuda|animal',
  'rabbit|🐰|kelinci|animal', 'monkey|🐵|monyet|animal', 'snake|🐍|ular|animal',
  // food
  'milk|🥛|susu|food', 'bread|🍞|roti|food', 'rice|🍚|nasi|food',
  'egg|🥚|telur|food', 'apple|🍎|apel|food', 'banana|🍌|pisang|food',
  'orange|🍊|jeruk|food', 'cake|🍰|kue|food', 'candy|🍬|permen|food',
  'honey|🍯|madu|food', 'cheese|🧀|keju|food',
  // body
  'eye|👁️|mata|body', 'hand|✋|tangan|body', 'foot|🦶|kaki|body',
  'nose|👃|hidung|body', 'mouth|👄|mulut|body', 'ear|👂|telinga|body',
  'tooth|🦷|gigi|body',
  // family
  'mom|👩|ibu|family', 'dad|👨|ayah|family', 'baby|👶|adik bayi|family',
  'boy|🧒|anak laki-laki|family', 'girl|👧|anak perempuan|family',
  // things
  'ball|⚽|bola|thing', 'book|📚|buku|thing', 'cup|☕|cangkir|thing',
  'bed|🛏️|tempat tidur|thing', 'box|📦|kotak|thing', 'hat|🎩|topi|thing',
  'bag|🎒|tas|thing', 'pen|🖊️|pulpen|thing', 'key|🔑|kunci|thing',
  'door|🚪|pintu|thing', 'clock|⏰|jam|thing', 'lamp|💡|lampu|thing',
  'gift|🎁|kado|thing', 'kite|🪁|layang-layang|thing',
  // nature
  'sun|☀️|matahari|nature', 'moon|🌙|bulan|nature', 'star|⭐|bintang|nature',
  'cloud|☁️|awan|nature', 'rain|🌧️|hujan|nature', 'fire|🔥|api|nature',
  'water|💧|air|nature', 'tree|🌳|pohon|nature', 'leaf|🍃|daun|nature',
  'flower|🌸|bunga|nature', 'sea|🌊|laut|nature',
  // vehicles
  'car|🚗|mobil|vehicle', 'bus|🚌|bus|vehicle', 'train|🚂|kereta|vehicle',
  'plane|✈️|pesawat|vehicle', 'bike|🚲|sepeda|vehicle', 'boat|⛵|perahu|vehicle',
  'house|🏠|rumah|vehicle',
  // colors
  'red|🔴|merah|color', 'blue|🔵|biru|color', 'yellow|🟡|kuning|color',
  'green|🟢|hijau|color', 'black|⚫|hitam|color', 'white|⚪|putih|color',
  'purple|🟣|ungu|color', 'pink|🩷|merah muda|color',
];

/** Sight words: dibaca hafalan, tidak digambarkan dengan emoji. */
const SIGHT_RAW = [
  'the|itu', 'and|dan', 'is|adalah', 'it|itu', 'in|di dalam', 'on|di atas',
  'my|milikku', 'we|kami', 'you|kamu', 'see|melihat', 'go|pergi',
  'like|suka', 'look|lihat', 'can|bisa', 'big|besar', 'little|kecil',
  'come|datang', 'play|bermain', 'run|lari', 'jump|lompat', 'yes|ya',
  'up|naik', 'down|turun', 'am|adalah', 'he|dia', 'she|dia',
];

function buildId(raw) {
  const [text, emoji, syl, tr, cat] = raw.split('|');
  return {
    id: `id-${text}`,
    text,
    lang: 'id',
    emoji,
    syllables: syl.split('-'),
    translation: tr,
    category: cat,
  };
}

function buildEn(raw) {
  const [text, emoji, tr, cat] = raw.split('|');
  return {
    id: `en-${text}`,
    text,
    lang: 'en',
    emoji,
    syllables: null,
    translation: tr,
    category: cat,
  };
}

function buildSight(raw) {
  const [text, tr] = raw.split('|');
  return {
    id: `en-${text}`,
    text,
    lang: 'en',
    emoji: '🔤',
    syllables: null,
    translation: tr,
    category: 'sight',
    sight: true,
  };
}

export const WORD_LIST = [
  ...ID_RAW.map(buildId),
  ...EN_RAW.map(buildEn),
  ...SIGHT_RAW.map(buildSight),
];

export const WORDS = Object.fromEntries(WORD_LIST.map((w) => [w.id, w]));

export function getWord(id) {
  return WORDS[id];
}

export function wordsByCategory(lang, category) {
  return WORD_LIST.filter((w) => w.lang === lang && w.category === category);
}

/** Kata bergambar saja (untuk soal tebak gambar). */
export const PICTURE_WORDS = WORD_LIST.filter((w) => !w.sight);

/** Huruf A-Z beserta contoh kata Indonesia & Inggris. */
export const LETTERS = [
  ['A', 'apel', '🍎', 'ant', '🐜'],
  ['B', 'bola', '⚽', 'bee', '🐝'],
  ['C', 'cangkir', '☕', 'cat', '🐱'],
  ['D', 'daun', '🍃', 'dog', '🐶'],
  ['E', 'es', '🧊', 'egg', '🥚'],
  ['F', 'foto', '📷', 'fish', '🐟'],
  ['G', 'gajah', '🐘', 'gift', '🎁'],
  ['H', 'hujan', '🌧️', 'hat', '🎩'],
  ['I', 'ikan', '🐟', 'ice', '🧊'],
  ['J', 'jeruk', '🍊', 'jump', '🤸'],
  ['K', 'kucing', '🐱', 'key', '🔑'],
  ['L', 'lampu', '💡', 'lion', '🦁'],
  ['M', 'mata', '👁️', 'moon', '🌙'],
  ['N', 'nasi', '🍚', 'nose', '👃'],
  ['O', 'obat', '💊', 'orange', '🍊'],
  ['P', 'pisang', '🍌', 'pen', '🖊️'],
  ['Q', 'quran', '📖', 'queen', '👸'],
  ['R', 'rumah', '🏠', 'rain', '🌧️'],
  ['S', 'susu', '🥛', 'sun', '☀️'],
  ['T', 'topi', '🎩', 'tree', '🌳'],
  ['U', 'ular', '🐍', 'umbrella', '☂️'],
  ['V', 'vas', '🏺', 'van', '🚐'],
  ['W', 'wortel', '🥕', 'water', '💧'],
  ['X', 'xilofon', '🎹', 'box', '📦'],
  ['Y', 'yoyo', '🪀', 'yellow', '🟡'],
  ['Z', 'zebra', '🦓', 'zoo', '🦁'],
].map(([letter, idWord, idEmoji, enWord, enEmoji]) => ({
  id: `letter-${letter}`,
  letter,
  idWord,
  idEmoji,
  enWord,
  enEmoji,
}));

/** Keluarga suku kata Bahasa Indonesia (ba-bi-bu-be-bo, dst). */
export const SYLLABLE_FAMILIES = [
  'b', 'c', 'd', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w', 'y',
].map((c) => ({
  id: `syl-${c}`,
  consonant: c,
  syllables: ['a', 'i', 'u', 'e', 'o'].map((v) => c + v),
}));

/** Kalimat pendek untuk tahap akhir. */
export const SENTENCES = [
  { id: 's-id-1', lang: 'id', text: 'Ini bola merah.', emoji: '⚽' },
  { id: 's-id-2', lang: 'id', text: 'Itu kucing lucu.', emoji: '🐱' },
  { id: 's-id-3', lang: 'id', text: 'Aku suka susu.', emoji: '🥛' },
  { id: 's-id-4', lang: 'id', text: 'Ibu makan roti.', emoji: '🍞' },
  { id: 's-id-5', lang: 'id', text: 'Ayah baca buku.', emoji: '📚' },
  { id: 's-id-6', lang: 'id', text: 'Adik minum susu.', emoji: '👶' },
  { id: 's-id-7', lang: 'id', text: 'Kakak main bola.', emoji: '🧒' },
  { id: 's-id-8', lang: 'id', text: 'Burung itu kecil.', emoji: '🐦' },
  { id: 's-id-9', lang: 'id', text: 'Bunga itu cantik.', emoji: '🌸' },
  { id: 's-id-10', lang: 'id', text: 'Kucing tidur di kursi.', emoji: '😺' },
  { id: 's-en-1', lang: 'en', text: 'I see a cat.', emoji: '🐱' },
  { id: 's-en-2', lang: 'en', text: 'The sun is big.', emoji: '☀️' },
  { id: 's-en-3', lang: 'en', text: 'I like milk.', emoji: '🥛' },
  { id: 's-en-4', lang: 'en', text: 'The dog can run.', emoji: '🐶' },
  { id: 's-en-5', lang: 'en', text: 'I can jump.', emoji: '🤸' },
  { id: 's-en-6', lang: 'en', text: 'We play ball.', emoji: '⚽' },
  { id: 's-en-7', lang: 'en', text: 'It is a red hat.', emoji: '🎩' },
  { id: 's-en-8', lang: 'en', text: 'My mom is happy.', emoji: '👩' },
  { id: 's-en-9', lang: 'en', text: 'Look at the moon.', emoji: '🌙' },
  { id: 's-en-10', lang: 'en', text: 'The little bird can fly.', emoji: '🐦' },
];

export const SENTENCE_MAP = Object.fromEntries(SENTENCES.map((s) => [s.id, s]));

/* ------------------------------------------------------------------ */
/* Cerita — tahap menuju tujuan akhir                                  */
/* ------------------------------------------------------------------ */

/**
 * Kata sambung yang boleh dipakai cerita di luar kosakata & kalimat yang
 * sudah diajarkan. Sengaja sedikit: tujuan akhir menuntut teks lebih
 * PANJANG, bukan lebih SULIT — tiap baris tetap kalimat pendek dari kata
 * yang sudah dikenal, dijaga oleh test.
 */
export const STORY_CONNECTORS = { id: ['dan', 'ke', 'mau', 'ada'], en: [] };

/**
 * Cerita bertingkat: 2 baris ➜ 3 baris ➜ 4 baris ➜ ujian (≥ 4 baris).
 * Cerita ujian (`exam: true`) adalah tujuan akhir aplikasi ini:
 * 2 paragraf Indonesia + 2 paragraf Inggris, masing-masing minimal 4 baris.
 */
export const STORIES = [
  // ---- Indonesia: 2 baris ----
  { id: 'st-id-1', lang: 'id', title: 'Kucing Lucu', emoji: '🐱', lines: ['Ini kucing lucu.', 'Kucing suka susu.'] },
  { id: 'st-id-2', lang: 'id', title: 'Bola Merah', emoji: '⚽', lines: ['Itu bola merah.', 'Adik main bola.'] },
  { id: 'st-id-3', lang: 'id', title: 'Ibu dan Roti', emoji: '🍞', lines: ['Ibu ada di rumah.', 'Ibu makan roti.'] },
  { id: 'st-id-4', lang: 'id', title: 'Bintang Kecil', emoji: '⭐', lines: ['Aku suka bintang.', 'Bintang itu kecil.'] },
  // ---- Indonesia: 3 baris ----
  { id: 'st-id-5', lang: 'id', title: 'Main di Rumah', emoji: '🏠', lines: ['Aku main di rumah.', 'Adik main bola.', 'Kakak baca buku.'] },
  { id: 'st-id-6', lang: 'id', title: 'Susu dan Roti', emoji: '🥛', lines: ['Ibu minum susu.', 'Ayah makan roti.', 'Aku suka kue.'] },
  { id: 'st-id-7', lang: 'id', title: 'Burung di Pohon', emoji: '🐦', lines: ['Itu burung kecil.', 'Burung ada di pohon.', 'Aku suka burung.'] },
  // ---- Indonesia: 4 baris ----
  { id: 'st-id-8', lang: 'id', title: 'Kucing Tidur', emoji: '😺', lines: ['Ini kucing kecil.', 'Kucing main bola.', 'Kucing minum susu.', 'Kucing tidur di kursi.'] },
  { id: 'st-id-9', lang: 'id', title: 'Hujan', emoji: '🌧️', lines: ['Ada hujan di gunung.', 'Aku ada di rumah.', 'Ibu ada di rumah.', 'Aku suka hujan.'] },
  // ---- Indonesia: ujian (tujuan akhir) ----
  { id: 'st-id-u1', lang: 'id', exam: true, title: 'Rumah Ibu', emoji: '🏡', lines: ['Ini rumah ibu.', 'Ayah baca buku.', 'Kakak main gitar.', 'Adik minum susu.', 'Aku makan pisang.'] },
  { id: 'st-id-u2', lang: 'id', exam: true, title: 'Ke Laut', emoji: '🌊', lines: ['Aku mau ke laut.', 'Ayah ada di kapal.', 'Ada ikan di laut.', 'Matahari itu merah.', 'Aku suka laut.'] },

  // ---- Inggris: 2 baris ----
  { id: 'st-en-1', lang: 'en', title: 'The Cat', emoji: '🐱', lines: ['I see a cat.', 'The cat is big.'] },
  { id: 'st-en-2', lang: 'en', title: 'My Ball', emoji: '⚽', lines: ['It is my ball.', 'I can play ball.'] },
  { id: 'st-en-3', lang: 'en', title: 'The Sun', emoji: '☀️', lines: ['The sun is up.', 'The sun is big.'] },
  { id: 'st-en-4', lang: 'en', title: 'My Dog', emoji: '🐶', lines: ['My dog can run.', 'I like my dog.'] },
  // ---- Inggris: 3 baris ----
  { id: 'st-en-5', lang: 'en', title: 'The Bird', emoji: '🐦', lines: ['I see a bird.', 'The bird is little.', 'It can fly.'] },
  { id: 'st-en-6', lang: 'en', title: 'Milk and Bread', emoji: '🥛', lines: ['I like milk.', 'I like bread.', 'Mom is happy.'] },
  { id: 'st-en-7', lang: 'en', title: 'We Play', emoji: '🤸', lines: ['We play ball.', 'We can run.', 'We can jump.'] },
  // ---- Inggris: 4 baris ----
  { id: 'st-en-8', lang: 'en', title: 'My Cat', emoji: '😺', lines: ['I see my cat.', 'The cat is little.', 'The cat can jump.', 'I like my cat.'] },
  { id: 'st-en-9', lang: 'en', title: 'Look Up', emoji: '🌙', lines: ['Look at the moon.', 'I see a star.', 'The moon is big.', 'The star is little.'] },
  // ---- Inggris: ujian (tujuan akhir) ----
  { id: 'st-en-u1', lang: 'en', exam: true, title: 'My House', emoji: '🏡', lines: ['I see my house.', 'My mom is happy.', 'My dad can run.', 'The baby is little.', 'We play ball.'] },
  { id: 'st-en-u2', lang: 'en', exam: true, title: 'Cat and Dog', emoji: '🐾', lines: ['I see a cat.', 'I see a dog.', 'The cat can jump.', 'The dog can run.', 'I am happy.'] },
];

export const STORY_MAP = Object.fromEntries(STORIES.map((story) => [story.id, story]));
