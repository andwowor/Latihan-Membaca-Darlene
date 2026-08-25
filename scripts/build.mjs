#!/usr/bin/env node
/**
 * Membangun folder `dist/` yang siap diunggah ke Cloudflare.
 *
 * Tidak ada bundler: berkas disalin apa adanya karena aplikasi memakai
 * ES module asli (lihat docs/architecture/adr/ADR-0004). Skrip ini hanya:
 *   1. menyalin public/ ke dist/
 *   2. menyalin src/ ke dist/src/
 *   3. menyuntikkan versi + daftar precache ke service worker
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PUBLIC_DIR = join(ROOT, 'public');
const SRC_DIR = join(ROOT, 'src');

/** Berkas yang tidak perlu ikut ke dist. */
const SKIPPED = new Set(['.DS_Store']);

async function listFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    if (SKIPPED.has(entry.name)) return [];
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath, base);
    return [relative(base, fullPath).split('\\').join('/')];
  }));
  return files.flat();
}

async function readAppVersion() {
  const source = await readFile(join(SRC_DIR, 'config', 'environment.js'), 'utf8');
  return source.match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1] || '0.0.0';
}

async function buildServiceWorker(version) {
  const publicFiles = (await listFiles(PUBLIC_DIR)).filter((file) => file !== 'sw.js');
  const sourceFiles = (await listFiles(SRC_DIR))
    .filter((file) => file.endsWith('.js'))
    .map((file) => `src/${file}`);

  const precache = ['./', ...publicFiles, ...sourceFiles]
    .map((file) => (file === './' ? './' : `./${file}`));

  const template = await readFile(join(PUBLIC_DIR, 'sw.js'), 'utf8');
  const output = template
    .replace('__APP_VERSION__', version)
    .replace('__PRECACHE_MANIFEST__', JSON.stringify(precache, null, 2));

  await writeFile(join(DIST, 'sw.js'), output);
  return precache.length;
}

async function main() {
  if (!existsSync(PUBLIC_DIR) || !existsSync(SRC_DIR)) {
    throw new Error('Folder public/ atau src/ tidak ditemukan.');
  }
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  await cp(PUBLIC_DIR, DIST, { recursive: true });
  await cp(SRC_DIR, join(DIST, 'src'), { recursive: true });

  const version = await readAppVersion();
  const cachedCount = await buildServiceWorker(version);

  const total = (await listFiles(DIST)).length;
  console.log(`✅ dist/ siap — versi ${version}, ${total} berkas (${cachedCount} di-precache).`);
}

main().catch((error) => {
  console.error('❌ Build gagal:', error.message);
  process.exitCode = 1;
});
