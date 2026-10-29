// =============================================================
//  Serenity — Judul tab browser berjalan (marquee) v2.9
//  Teks judul bergerak perlahan dari kanan ke kiri di tab browser desktop, ponsel, tablet,
//  dan di bilah judul jendela aplikasi (PWA). Ringan: hanya mengganti document.title.
//  • Saat tab tidak sedang dilihat, browser memperlambat timer (±1×/detik) — judul tetap bergerak,
//    hanya lebih lambat, dan otomatis normal kembali saat tab dibuka.
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
const GAP = '      •      ';
const STEP_MS = 280;            // kecepatan: 1 karakter tiap 280 ms (perlahan & mudah dibaca)
const PAUSE_MS = 1800;          // jeda di awal setiap putaran agar awal judul terbaca utuh
let base = '', chars = [], pos = 0, timer = 0, pauseUntil = 0, last = '';

export function setMarqueeTitle(text) {
  text = String(text || '').replace(/\s+/g, ' ').trim();
  if (!text || text === base) return;
  base = text; chars = Array.from(text + GAP); pos = 0; pauseUntil = Date.now() + PAUSE_MS;
  paint(); start();
}
function paint() {
  if (!chars.length) return;
  const t = chars.slice(pos).concat(chars.slice(0, pos)).join('');
  if (t !== last) { last = t; document.title = t; }
}
function tick() {
  if (Date.now() < pauseUntil) return;
  pos = (pos + 1) % chars.length;
  if (pos === 0) pauseUntil = Date.now() + PAUSE_MS;
  paint();
}
function start() {
  if (timer) return;
  timer = setInterval(tick, STEP_MS);
  // Kembali ke awal judul saat tab dibuka lagi agar langsung terbaca
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { pos = 0; pauseUntil = Date.now() + PAUSE_MS; paint(); } });
  // Saat dibagikan/di-bookmark, browser membaca judul utuh
  addEventListener('beforeprint', () => { document.title = base; });
}
export const marqueeBase = () => base;
