-- Skema penyimpanan sinkronisasi (lihat docs/architecture/adr/ADR-0008).
-- Kunci baris adalah HASH SHA-256 dari kode sinkron, bukan kodenya sendiri,
-- sehingga isi basis data tidak memuat kredensial untuk membuka dirinya.
CREATE TABLE IF NOT EXISTS profiles (
  code_hash  TEXT    PRIMARY KEY,
  payload    TEXT    NOT NULL,
  updated_at INTEGER NOT NULL,
  revision   INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles (updated_at);
