/**
 * Efek visual: konfeti dan notifikasi mengambang.
 * Murni presentasi; dipanggil oleh view setelah use case selesai.
 */
import { el } from '../dom.js';

const CONFETTI_COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#22c55e', '#0ea5e9', '#fbbf24'];
const CONFETTI_DURATION_MS = 2600;

/**
 * Hujan konfeti di atas layar.
 * @param {HTMLCanvasElement} canvas
 * @param {number} [pieceCount]
 */
export function burstConfetti(canvas, pieceCount = 90) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth * devicePixelRatio;
  const height = canvas.height = canvas.offsetHeight * devicePixelRatio;
  canvas.classList.add('confetti--on');

  const pieces = Array.from({ length: pieceCount }, () => ({
    x: Math.random() * width,
    y: -Math.random() * height * 0.4,
    size: (6 + Math.random() * 8) * devicePixelRatio,
    speedY: (2.4 + Math.random() * 3.4) * devicePixelRatio,
    drift: (Math.random() - 0.5) * 2.4 * devicePixelRatio,
    spin: (Math.random() - 0.5) * 0.28,
    angle: Math.random() * Math.PI,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));

  const startedAt = performance.now();
  function frame(timestamp) {
    const elapsed = timestamp - startedAt;
    context.clearRect(0, 0, width, height);
    pieces.forEach((piece) => {
      piece.y += piece.speedY;
      piece.x += piece.drift;
      piece.angle += piece.spin;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.angle);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.62);
      context.restore();
    });
    if (elapsed < CONFETTI_DURATION_MS) {
      requestAnimationFrame(frame);
    } else {
      context.clearRect(0, 0, width, height);
      canvas.classList.remove('confetti--on');
    }
  }
  requestAnimationFrame(frame);
}

/**
 * Tampilkan pesan singkat di atas layar.
 * @param {HTMLElement} host
 * @param {string} message
 * @param {{tone?: 'default'|'gold', durationMs?: number}} [options]
 */
export function showToast(host, message, options = {}) {
  if (!host) return;
  const { tone = 'default', durationMs = 2600 } = options;
  const toast = el('div', {
    class: `toast${tone === 'gold' ? ' toast--gold' : ''}`,
    text: message,
  });
  host.append(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity .3s ease, transform .3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-12px)';
    setTimeout(() => toast.remove(), 320);
  }, durationMs);
}
