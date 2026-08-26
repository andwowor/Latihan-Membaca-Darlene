/**
 * ADAPTER (outbound, sisi server) — penyimpanan profil tersinkron di D1.
 * Satu-satunya berkas yang mengetahui skema tabel.
 */

/**
 * @param {object} database binding D1 dari Worker
 */
export function createD1ProfileStore(database) {
  return {
    /**
     * Ambil profil milik sebuah hash kode.
     * @param {string} codeHash
     * @returns {Promise<{profile: object, updatedAt: number, revision: number}|null>}
     */
    async load(codeHash) {
      const row = await database
        .prepare('SELECT payload, updated_at, revision FROM profiles WHERE code_hash = ?')
        .bind(codeHash)
        .first();
      if (!row) return null;
      try {
        return {
          profile: JSON.parse(row.payload),
          updatedAt: row.updated_at,
          revision: row.revision,
        };
      } catch {
        // Baris rusak diperlakukan seolah belum ada, agar kiriman berikutnya menimpanya.
        return null;
      }
    },

    /**
     * Simpan profil gabungan.
     * @param {string} codeHash
     * @param {object} profile
     * @param {number} updatedAt
     * @returns {Promise<{updatedAt: number}>}
     */
    async save(codeHash, profile, updatedAt) {
      await database
        .prepare(`INSERT INTO profiles (code_hash, payload, updated_at, revision)
                  VALUES (?, ?, ?, 1)
                  ON CONFLICT (code_hash) DO UPDATE SET
                    payload = excluded.payload,
                    updated_at = excluded.updated_at,
                    revision = profiles.revision + 1`)
        .bind(codeHash, JSON.stringify(profile), updatedAt)
        .run();
      return { updatedAt };
    },
  };
}
