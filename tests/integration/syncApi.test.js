/**
 * Test integrasi API sinkronisasi (sisi server) beserta adapter D1-nya.
 * Memakai D1 tiruan sehingga tidak perlu jaringan maupun basis data sungguhan.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleApiRequest, hashSyncCode, looksLikeProfile, MAX_PAYLOAD_BYTES,
} from '../../src/adapters/inbound/workerHttp.js';
import { createD1ProfileStore } from '../../src/adapters/outbound/d1ProfileStore.js';
import { createProfile, registerLessonCompletion } from '../../src/domain/profile.js';

const NOW = Date.parse('2026-08-26T08:00:00Z');
const CODE = 'XK4M-7QPZ-R2TW-9HDF';

/** D1 tiruan secukupnya: SELECT mengembalikan baris, INSERT menimpanya. */
function createFakeD1() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              return sql.includes('SELECT') ? rows.get(args[0]) || null : null;
            },
            async run() {
              const [codeHash, payload, updatedAt] = args;
              const previous = rows.get(codeHash);
              rows.set(codeHash, {
                payload,
                updated_at: updatedAt,
                revision: (previous?.revision || 0) + 1,
              });
              return { success: true };
            },
          };
        },
      };
    },
  };
}

const apiRequest = (method, { code = CODE, body } = {}) => new Request(
  'https://contoh.workers.dev/api/progress',
  {
    method,
    headers: code ? { 'X-Sync-Code': code } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  },
);

function createContext(database = createFakeD1()) {
  return { database, store: createD1ProfileStore(database), now: () => NOW };
}

function lessonProfile(lessonId, mistakes = 0) {
  return registerLessonCompletion(createProfile({ now: NOW }), {
    lessonId, mistakes, correctCount: 8 - mistakes, now: NOW, todayKey: '2026-08-26',
  }).profile;
}

/* --------------------------------- hash --------------------------------- */

test('hash kode sinkron deterministik dan tidak memuat kodenya', async () => {
  const first = await hashSyncCode('XK4M7QPZR2TW9HDF');
  const second = await hashSyncCode('XK4M7QPZR2TW9HDF');
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.notEqual(first, await hashSyncCode('XK4M7QPZR2TW9HDG'));
});

/* ------------------------------- validasi ------------------------------- */

test('permintaan tanpa kode dilayani sebagai profil keluarga', async () => {
  const context = createContext();
  // tanpa header: profil keluarga (ADR-0009)
  await handleApiRequest(
    apiRequest('PUT', { code: '', body: { profile: lessonProfile('u1-l1') } }),
    context,
  );
  const response = await handleApiRequest(apiRequest('GET', { code: '' }), context);
  assert.equal(response.status, 200);

  const { profile } = await response.json();
  assert.equal(profile.lessons['u1-l1'].stars, 3);
});

test('dua perangkat tanpa kode berbagi profil keluarga yang sama', async () => {
  const context = createContext();
  await handleApiRequest(
    apiRequest('PUT', { code: '', body: { profile: lessonProfile('u1-l1') } }),
    context,
  );
  const kedua = await handleApiRequest(
    apiRequest('PUT', { code: '', body: { profile: lessonProfile('u1-l2', 2) } }),
    context,
  );

  const { profile } = await kedua.json();
  assert.equal(profile.lessons['u1-l1'].stars, 3, 'progres perangkat pertama ikut terbawa');
  assert.equal(profile.lessons['u1-l2'].stars, 2);
  assert.equal(context.database.rows.size, 1, 'hanya satu baris untuk seisi keluarga');
});

test('profil keluarga tetap disimpan di bawah hash, bukan nama apa adanya', async () => {
  const context = createContext();
  await handleApiRequest(
    apiRequest('PUT', { code: '', body: { profile: lessonProfile('u1-l1') } }),
    context,
  );
  const [kunci] = [...context.database.rows.keys()];
  assert.match(kunci, /^[0-9a-f]{64}$/);
  assert.equal(kunci.includes('KELUARGA'), false);
});

test('kode yang dikirim tetap dihormati dan terpisah dari profil keluarga', async () => {
  const context = createContext();
  await handleApiRequest(
    apiRequest('PUT', { code: '', body: { profile: lessonProfile('u1-l1') } }),
    context,
  );
  const terpisah = await handleApiRequest(apiRequest('GET'), context);
  assert.equal(terpisah.status, 404, 'kode khusus punya baris sendiri');
});

test('kode yang tidak sah tetap ditolak bila header dikirim', async () => {
  const response = await handleApiRequest(
    apiRequest('GET', { code: 'bukan kode sah' }),
    createContext(),
  );
  assert.equal(response.status, 400);
});

test('kode boleh diketik dengan huruf kecil dan tanpa tanda hubung', async () => {
  const context = createContext();
  await handleApiRequest(apiRequest('PUT', { body: { profile: lessonProfile('u1-l1') } }), context);
  const response = await handleApiRequest(
    apiRequest('GET', { code: 'xk4m7qpzr2tw9hdf' }),
    context,
  );
  assert.equal(response.status, 200, 'kode yang sama dalam bentuk lain harus dikenali');
});

test('metode selain GET dan PUT ditolak', async () => {
  const response = await handleApiRequest(apiRequest('DELETE'), createContext());
  assert.equal(response.status, 405);
});

test('isi yang bukan JSON ditolak', async () => {
  const request = new Request('https://contoh.workers.dev/api/progress', {
    method: 'PUT',
    headers: { 'X-Sync-Code': CODE },
    body: 'bukan json',
  });
  const response = await handleApiRequest(request, createContext());
  assert.equal(response.status, 400);
});

test('kiriman yang bukan profil ditolak', async () => {
  const response = await handleApiRequest(
    apiRequest('PUT', { body: { profile: { apa: 'ini' } } }),
    createContext(),
  );
  assert.equal(response.status, 422);
});

test('kiriman berukuran berlebihan ditolak', async () => {
  const bloated = { ...lessonProfile('u1-l1'), sampah: 'x'.repeat(MAX_PAYLOAD_BYTES) };
  const response = await handleApiRequest(
    apiRequest('PUT', { body: { profile: bloated } }),
    createContext(),
  );
  assert.equal(response.status, 413);
});

test('penjaga bentuk profil menolak nilai yang tidak lengkap', () => {
  assert.equal(looksLikeProfile(null), false);
  assert.equal(looksLikeProfile({ experiencePoints: 1 }), false);
  assert.equal(looksLikeProfile({ experiencePoints: 1, schemaVersion: 1, lessons: {}, words: {} }), true);
});

/* --------------------------------- alur --------------------------------- */

test('kode yang belum punya data menjawab 404', async () => {
  const response = await handleApiRequest(apiRequest('GET'), createContext());
  assert.equal(response.status, 404);
});

test('kirim lalu ambil mengembalikan progres yang sama', async () => {
  const context = createContext();
  const profile = lessonProfile('u1-l1');
  const put = await handleApiRequest(apiRequest('PUT', { body: { profile } }), context);
  assert.equal(put.status, 200);

  const get = await handleApiRequest(apiRequest('GET'), context);
  const body = await get.json();
  assert.equal(body.profile.experiencePoints, profile.experiencePoints);
  assert.equal(body.updatedAt, NOW);
});

test('dua perangkat digabung di server, bukan saling menimpa', async () => {
  const context = createContext();
  await handleApiRequest(apiRequest('PUT', { body: { profile: lessonProfile('u1-l1') } }), context);
  const second = await handleApiRequest(
    apiRequest('PUT', { body: { profile: lessonProfile('u1-l2', 2) } }),
    context,
  );

  const { profile } = await second.json();
  assert.equal(profile.lessons['u1-l1'].stars, 3, 'pelajaran perangkat pertama tetap ada');
  assert.equal(profile.lessons['u1-l2'].stars, 2, 'pelajaran perangkat kedua ikut masuk');
});

test('mengirim profil yang lebih miskin tidak menghapus capaian di server', async () => {
  const context = createContext();
  await handleApiRequest(apiRequest('PUT', { body: { profile: lessonProfile('u1-l1') } }), context);
  const response = await handleApiRequest(
    apiRequest('PUT', { body: { profile: createProfile({ now: NOW }) } }),
    context,
  );

  const { profile } = await response.json();
  assert.equal(profile.lessons['u1-l1'].stars, 3);
  assert.ok(profile.experiencePoints > 0);
});

test('kode berbeda menyimpan profil yang terpisah', async () => {
  const context = createContext();
  await handleApiRequest(apiRequest('PUT', { body: { profile: lessonProfile('u1-l1') } }), context);
  const other = await handleApiRequest(
    apiRequest('GET', { code: 'AAAA-BBBB-CCCC-DDDD' }),
    context,
  );
  assert.equal(other.status, 404);
});

test('yang tersimpan di basis data adalah hash kode, bukan kodenya', async () => {
  const context = createContext();
  await handleApiRequest(apiRequest('PUT', { body: { profile: lessonProfile('u1-l1') } }), context);
  const keys = [...context.database.rows.keys()];
  assert.equal(keys.length, 1);
  assert.match(keys[0], /^[0-9a-f]{64}$/);
  assert.equal(keys[0].includes('XK4M'), false);
});

test('baris yang rusak diperlakukan seolah belum ada', async () => {
  const database = createFakeD1();
  const store = createD1ProfileStore(database);
  const codeHash = await hashSyncCode('XK4M7QPZR2TW9HDF');
  database.rows.set(codeHash, { payload: '{rusak', updated_at: NOW, revision: 1 });
  assert.equal(await store.load(codeHash), null);
});

test('jawaban API tidak boleh disimpan di cache peramban', async () => {
  const context = createContext();
  const response = await handleApiRequest(apiRequest('GET'), context);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
});
