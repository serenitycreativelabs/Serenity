// =============================================================
//  Serenity — Animasi Kursor & Ikon (diatur Super Admin di Tampilan & Tema)
//  • Kursor: Dot + Ring, Glow/Spotlight, Jejak (trail), Magnetic, efek klik Ripple/Sparkle
//  • Ikon: animasi saat diarahkan, muncul saat digulir, dan gerak halus terus-menerus
//  Ringan: satu requestAnimationFrame yang berhenti sendiri saat kursor diam, hanya transform/opacity
//  (GPU), tanpa pustaka. Mati otomatis di layar sentuh & bila perangkat meminta "kurangi gerakan".
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
export const CURSORS = {
  off: { label: 'Mati', desc: 'Kursor biasa' },
  dotring: { label: 'Dot + Ring', desc: 'Titik & lingkaran yang mengikuti, membesar di tombol' },
  glow: { label: 'Glow Spotlight', desc: 'Cahaya lembut warna tema mengikuti kursor' },
  trail: { label: 'Jejak Neon', desc: 'Partikel gradasi mengekor di belakang kursor' },
  blob: { label: 'Blob Cair', desc: 'Gumpalan lentur yang meregang saat bergerak cepat' },
};
export const CLICKS = { off: 'Tanpa efek', ripple: 'Ripple (gelombang)', sparkle: 'Sparkle (percikan)', confetti: 'Konfeti mini' };
export const ICON_LEVELS = { off: 'Mati', halus: 'Halus — bergerak saat diarahkan', sedang: 'Sedang — + muncul saat digulir', ramai: 'Ramai — + gerak halus terus-menerus' };
export const FX_DEFAULT = { cursor: 'off', size: 1, magnetic: true, hideNative: true, click: 'ripple', ikon: 'halus', scope: 'publik' };

const html = document.documentElement;
// v2.7: laptop layar sentuh / perangkat hibrida juga dihitung (any-pointer), bukan hanya pointer utama
const fine = () => matchMedia('(any-pointer: fine)').matches || matchMedia('(pointer: fine)').matches;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOVER_SEL = 'a, button, [role=button], summary, label, select, .chip, .tile, .svc, .portal-card, .info-card, .lg-card, .ln-item, .agenda-item, .doc-card, .ig-card, [data-link]';
const TEXT_SEL = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]), textarea, [contenteditable=true]';
const MAG_SEL = '.btn, .icon-btn, .chip, .vw-pill, .theme-btn, .layout-fab';

let cfg = { ...FX_DEFAULT }, layer = null, raf = 0, io = null;
const P = { x: -100, y: -100, tx: -100, ty: -100, rx: -100, ry: -100, vx: 0, vy: 0, last: 0, shown: false, hover: false, text: false, down: false, mag: null };
const trail = [];
let cvs = null, ctx = null, dpr = 1;

export function applyFx(fx, shell = '') {
  cfg = { ...FX_DEFAULT, ...(fx || {}) };
  const inScope = cfg.scope === 'semua' || shell !== 'admin';
  const icons = inScope && !reduced() ? cfg.ikon : 'off';
  html.dataset.ican = icons === 'off' ? '' : icons;
  // Kursor tetap aktif walau Windows/macOS menyalakan "kurangi animasi" (banyak laptop mengaktifkannya
  // otomatis demi performa) — gerak kursor bukan animasi besar. Jejak & efek klik tetap mengikuti setelan itu.
  const cur = inScope && fine() && CURSORS[cfg.cursor] && cfg.cursor !== 'off' ? (reduced() && cfg.cursor === 'trail' ? 'dotring' : cfg.cursor) : '';
  html.dataset.cursor = cur;
  html.dataset.cursorHide = cur && cfg.hideNative && cur !== 'glow' ? '1' : '';
  html.style.setProperty('--cur-scale', String(Math.max(0.6, Math.min(1.8, Number(cfg.size) || 1))));
  if (cur || (inScope && fine() && cfg.click !== 'off' && !reduced())) mount(); else unmount();
  setupIconObserver(icons === 'sedang' || icons === 'ramai');
}

// ---------------------------------------------------------------- kursor
function mount() {
  if (layer) { buildShapes(); return; }
  layer = document.createElement('div'); layer.id = 'fx-layer'; layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  buildShapes();
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('mouseout', onOut);
  window.addEventListener('resize', sizeCanvas);
}
function unmount() {
  if (!layer) return;
  cancelAnimationFrame(raf); raf = 0;
  window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp);
  document.removeEventListener('pointerover', onOver); document.removeEventListener('mouseout', onOut); window.removeEventListener('resize', sizeCanvas);
  releaseMag(); layer.remove(); layer = null; cvs = null; ctx = null; trail.length = 0;
}
function buildShapes() {
  const c = html.dataset.cursor;
  layer.dataset.kind = c;
  layer.innerHTML = c === 'dotring' ? '<i class="fx-dot"></i><i class="fx-ring"></i>'
    : c === 'glow' ? '<i class="fx-glow"></i><i class="fx-dot sm"></i>'
    : c === 'blob' ? '<i class="fx-blob"></i><i class="fx-dot sm"></i>'
    : c === 'trail' ? '<canvas class="fx-trail"></canvas><i class="fx-dot"></i>' : '';
  cvs = layer.querySelector('canvas'); ctx = cvs?.getContext('2d') || null; sizeCanvas();
}
function sizeCanvas() { if (!cvs) return; dpr = Math.min(2, window.devicePixelRatio || 1); cvs.width = innerWidth * dpr; cvs.height = innerHeight * dpr; }
function onMove(e) {
  if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
  P.tx = e.clientX; P.ty = e.clientY; P.last = performance.now();
  if (!P.shown) { P.shown = true; P.x = P.rx = P.tx; P.y = P.ry = P.ty; }
  if (layer && !layer.classList.contains('on')) layer.classList.add('on');
  if (html.dataset.cursor === 'trail') { trail.push({ x: P.tx, y: P.ty, t: P.last }); if (trail.length > 40) trail.shift(); }
  if (cfg.magnetic && P.mag) magnet(e);
  kick();
}
function onOver(e) {
  const t = e.target instanceof Element ? e.target : null;
  P.text = !!t?.closest(TEXT_SEL);
  P.hover = !P.text && !!t?.closest(HOVER_SEL);
  layer?.classList.toggle('hover', P.hover); layer?.classList.toggle('text', P.text);
  const m = cfg.magnetic && html.dataset.cursor ? t?.closest(MAG_SEL) : null;
  if (m !== P.mag) { releaseMag(); P.mag = m; }
}
function onDown(e) {
  if (e.pointerType === 'mouse') { P.down = true; layer?.classList.add('down'); }
  if (cfg.click !== 'off' && !reduced() && layer) burst(e.clientX, e.clientY);
}
function onUp() { P.down = false; layer?.classList.remove('down'); }
function onOut(e) { if (!e.relatedTarget) onLeave(); } // kursor keluar jendela
function onLeave() { P.shown = false; layer?.classList.remove('on'); releaseMag(); }
function magnet(e) {
  const r = P.mag.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const k = Math.min(1, 40 / Math.max(r.width, 40));
  P.mag.style.translate = `${(dx * 0.28 * k).toFixed(1)}px ${(dy * 0.35 * k).toFixed(1)}px`;
}
function releaseMag() { if (P.mag) { P.mag.style.translate = ''; P.mag = null; } }
function kick() { if (!raf) raf = requestAnimationFrame(tick); }
function tick(t) {
  raf = 0; if (!layer) return;
  const kind = html.dataset.cursor;
  P.x += (P.tx - P.x) * 0.55; P.y += (P.ty - P.y) * 0.55;
  const prx = P.rx, pry = P.ry;
  P.rx += (P.tx - P.rx) * 0.16; P.ry += (P.ty - P.ry) * 0.16;
  P.vx = P.rx - prx; P.vy = P.ry - pry;
  const dot = layer.querySelector('.fx-dot'); if (dot) dot.style.transform = `translate3d(${P.x}px,${P.y}px,0)`;
  if (kind === 'dotring') { const r = layer.querySelector('.fx-ring'); if (r) r.style.transform = `translate3d(${P.rx}px,${P.ry}px,0)`; }
  if (kind === 'glow') { const g = layer.querySelector('.fx-glow'); if (g) g.style.transform = `translate3d(${P.rx}px,${P.ry}px,0)`; }
  if (kind === 'blob') {
    const b = layer.querySelector('.fx-blob'); const sp = Math.min(60, Math.hypot(P.vx, P.vy)); const ang = Math.atan2(P.vy, P.vx);
    if (b) b.style.transform = `translate3d(${P.rx}px,${P.ry}px,0) rotate(${ang}rad) scale(${1 + sp / 70}, ${1 - sp / 160})`;
  }
  if (kind === 'trail' && ctx) drawTrail(t);
  const moving = Math.abs(P.tx - P.rx) + Math.abs(P.ty - P.ry) > 0.3 || (kind === 'trail' && trail.length);
  if (moving) kick();
}
function drawTrail(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
  while (trail.length && now - trail[0].t > 480) trail.shift();
  const cs = getComputedStyle(html); const c1 = cs.getPropertyValue('--brand').trim() || '#7c3aed', c2 = cs.getPropertyValue('--brand-accent').trim() || '#ec4899';
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1], b = trail[i]; const life = 1 - (now - b.t) / 480; if (life <= 0) continue;
    ctx.strokeStyle = i % 2 ? c1 : c2; ctx.globalAlpha = life * 0.75; ctx.lineWidth = 2 + life * 7 * (Number(cfg.size) || 1); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// efek klik
function burst(x, y) {
  const kind = cfg.click;
  if (kind === 'ripple') { const s = document.createElement('i'); s.className = 'fx-ripple'; s.style.left = `${x}px`; s.style.top = `${y}px`; layer.appendChild(s); setTimeout(() => s.remove(), 650); return; }
  const n = kind === 'confetti' ? 12 : 8;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'); s.className = kind === 'confetti' ? 'fx-confetti' : 'fx-spark';
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5; const dist = (kind === 'confetti' ? 46 : 30) + Math.random() * 18;
    s.style.left = `${x}px`; s.style.top = `${y}px`; s.style.setProperty('--dx', `${Math.cos(ang) * dist}px`); s.style.setProperty('--dy', `${Math.sin(ang) * dist + (kind === 'confetti' ? 14 : 0)}px`);
    s.style.setProperty('--rot', `${Math.random() * 360}deg`); if (i % 2) s.classList.add('alt');
    layer.appendChild(s); setTimeout(() => s.remove(), 760);
  }
}

// ---------------------------------------------------------------- ikon muncul saat digulir
const ICON_IN = '.tile-ic, .stat-ic, .svc > .ic, .pc-ic, .sp-head > .ic, .section-head h2 > .ic, .lg-logo, .doc-ic, .info-ph';
function setupIconObserver(on) {
  if (!on) { io?.disconnect(); io = null; return; }
  if (!('IntersectionObserver' in window)) return;
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('ic-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  scanIcons();
}
export function scanIcons() {
  if (!io) return;
  const vh = innerHeight;
  document.querySelectorAll(ICON_IN).forEach((el) => {
    if (el.classList.contains('ic-in') || el.dataset.icw) return;
    el.dataset.icw = '1';
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) el.classList.add('ic-in'); else io.observe(el); // yang sudah terlihat langsung muncul
  });
  // pengaman: jangan pernah ada ikon yang tertinggal tersembunyi
  clearTimeout(scanIcons.t); scanIcons.t = setTimeout(() => document.querySelectorAll('[data-icw]:not(.ic-in)').forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width || (r.bottom > 0 && r.top < innerHeight)) el.classList.add('ic-in'); }), 1800);
}
