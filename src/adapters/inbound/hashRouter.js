/**
 * ADAPTER (inbound) — router berbasis hash URL.
 *
 * Keputusan yang disembunyikan: cara navigasi antar layar. Hash dipilih agar
 * aplikasi tetap jalan sebagai berkas statis tanpa aturan rewrite di server,
 * termasuk saat dipasang sebagai aplikasi di layar utama.
 */

/**
 * @param {{onNavigate: (route: {name: string, params: Array<string>}) => void,
 *          defaultRoute?: string}} options
 */
export function createHashRouter({ onNavigate, defaultRoute = 'belajar' }) {
  function parse() {
    const raw = (globalThis.location?.hash || '').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean);
    return { name: parts[0] || defaultRoute, params: parts.slice(1) };
  }

  function handleChange() {
    onNavigate(parse());
  }

  return {
    current: parse,

    /** Pindah layar; menulis hash sehingga tombol "kembali" ikut bekerja. */
    go(name, ...params) {
      const target = `#/${[name, ...params].join('/')}`;
      if (globalThis.location.hash === target) handleChange();
      else globalThis.location.hash = target;
    },

    back() {
      globalThis.history.back();
    },

    start() {
      globalThis.addEventListener('hashchange', handleChange);
      handleChange();
    },
  };
}
