// Tema & warna (Super Admin), mode Gelap/Terang (semua pengunjung), tata letak panel yang bisa digeser
// (Super Admin), penjaga isian belum disimpan, konfirmasi keluar, dan running text dinamis.
// © Serenity Creativa 2026
import { esc, $, $$, toast, confirmDialog } from './ui.js';

// ---------------------------------------------------------------- tema
export const THEME_PRESETS = {
  teal: { label: 'Teal Gampong', brand: '#0f766e', accent: '#b45309' },
  biru: { label: 'Biru Laut', brand: '#1d4ed8', accent: '#ea580c' },
  hijau: { label: 'Hijau Sawah', brand: '#15803d', accent: '#a16207' },
  marun: { label: 'Merah Marun', brand: '#9f1239', accent: '#b45309' },
  ungu: { label: 'Ungu Senja', brand: '#6d28d9', accent: '#db2777' },
  cokelat: { label: 'Cokelat Meunasah', brand: '#92400e', accent: '#0f766e' },
  grafit: { label: 'Grafit Netral', brand: '#334155', accent: '#0891b2' },
};
export const MODELS = {
  klasik: { label: 'Klasik — panel jadwal sholat & kegiatan di kiri-kanan layar', icon: '▥' },
  kartu: { label: 'Kartu Modern — panel melayang, sudut membulat, latar lembut', icon: '▦' },
  fokus: { label: 'Fokus — konten selebar layar, panel samping pindah ke bawah', icon: '▭' },
  majalah: { label: 'Majalah — berita utama ditonjolkan dengan gambar besar', icon: '▤' },
};
export const FONT_PAIRS = {
  modern: { label: 'Modern (Inter + Jakarta Sans)' },
  klasik: { label: 'Klasik (Lora untuk judul)' },
  ramah: { label: 'Ramah (Nunito)' },
};
export const RADII = { tegas: { label: 'Tegas', v: '6px' }, sedang: { label: 'Sedang', v: '12px' }, bulat: { label: 'Bulat', v: '18px' } };
export const DEFAULT_TEMA = { preset: 'teal', brand: '', accent: '', model: 'klasik', font: 'modern', radius: 'sedang', mode: 'auto', toggle: true };

let currentTema = { ...DEFAULT_TEMA };
const mq = matchMedia('(prefers-color-scheme: dark)');
const readPref = () => { try { return localStorage.getItem('dd:theme') || ''; } catch { return ''; } };
export function resolvedMode() {
  const pref = currentTema.toggle !== false ? readPref() : '';
  const m = pref || currentTema.mode || 'auto';
  return m === 'auto' ? (mq.matches ? 'dark' : 'light') : m;
}
export function applyTheme(tema) {
  currentTema = { ...DEFAULT_TEMA, ...(tema || {}) };
  const p = THEME_PRESETS[currentTema.preset] || THEME_PRESETS.teal;
  const html = document.documentElement;
  html.style.setProperty('--brand', currentTema.brand || p.brand);
  html.style.setProperty('--brand-accent', currentTema.accent || p.accent);
  html.style.setProperty('--radius', (RADII[currentTema.radius] || RADII.sedang).v);
  html.style.setProperty('--radius-sm', `calc(${(RADII[currentTema.radius] || RADII.sedang).v} * .66)`);
  html.dataset.model = currentTema.model; html.dataset.font = currentTema.font;
  html.dataset.theme = resolvedMode();
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', html.dataset.theme === 'dark' ? '#0f1419' : '#ffffff');
  $$('[data-theme-toggle]').forEach((b) => { b.hidden = currentTema.toggle === false; b.innerHTML = themeIcon(); b.title = html.dataset.theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'; });
}
mq.addEventListener?.('change', () => applyTheme(currentTema));
export const themeIcon = () => (document.documentElement.dataset.theme === 'dark'
  ? '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
  : '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>');
export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('dd:theme', next); } catch { /* */ }
  applyTheme(currentTema);
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-theme-toggle]')) toggleTheme(); });

// ---------------------------------------------------------------- urutan tata letak
// Urutkan daftar kunci sesuai urutan tersimpan; kunci baru ditambahkan di akhir
export function ordered(keys, saved) {
  if (!Array.isArray(saved) || !saved.length) return keys;
  return [...saved.filter((k) => keys.includes(k)), ...keys.filter((k) => !saved.includes(k))];
}

// Geser-tempel (pointer events: mouse, sentuh, pena) dengan animasi FLIP yang halus
export function makeSortable(containers, { onChange } = {}) {
  const items = () => containers.flatMap((c) => [...c.children].filter((x) => x.dataset.key));
  containers.forEach((c) => c.classList.add('sorting'));
  items().forEach((it) => {
    if (it.querySelector(':scope > .sort-handle')) return;
    const h = document.createElement('button'); h.type = 'button'; h.className = 'sort-handle'; h.innerHTML = '⠿ <span>Geser</span>'; h.title = 'Seret untuk memindahkan panel';
    it.prepend(h); it.classList.add('sort-item');
  });
  let drag = null;
  const flip = (fn) => {
    const els = items(); const first = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
    fn();
    for (const e of items()) {
      const a = first.get(e); if (!a || e === drag?.item) continue; const b = e.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top; if (!dx && !dy) continue;
      e.style.transition = 'none'; e.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => { e.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)'; e.style.transform = ''; });
    }
  };
  const onDown = (e) => {
    const h = e.target.closest('.sort-handle'); if (!h || e.button > 0) return;
    const item = h.closest('.sort-item'); if (!containers.some((c) => c.contains(item))) return;
    e.preventDefault();
    const r = item.getBoundingClientRect();
    const ghost = item.cloneNode(true); ghost.classList.add('sort-ghost');
    Object.assign(ghost.style, { width: `${r.width}px`, height: `${r.height}px`, left: `${r.left}px`, top: `${r.top}px` });
    document.body.appendChild(ghost); item.classList.add('sort-placeholder');
    drag = { item, ghost, dx: e.clientX - r.left, dy: e.clientY - r.top, last: 0 };
    document.body.classList.add('is-dragging');
    h.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag) return;
    drag.ghost.style.left = `${e.clientX - drag.dx}px`; drag.ghost.style.top = `${e.clientY - drag.dy}px`;
    // gulir otomatis di dekat tepi layar
    if (e.clientY < 70) window.scrollBy(0, -14); else if (e.clientY > innerHeight - 70) window.scrollBy(0, 14);
    const now = performance.now(); if (now - drag.last < 40) return; drag.last = now;
    const under = document.elementsFromPoint(e.clientX, e.clientY);
    // hanya panel dalam grup yang sama (beranda ≠ panel samping)
    const target = under.find((el) => el.classList?.contains('sort-item') && el !== drag.item && !el.classList.contains('sort-ghost') && containers.includes(el.parentElement));
    if (target) {
      const tr = target.getBoundingClientRect();
      const sameRow = Math.abs(tr.top - drag.item.getBoundingClientRect().top) < 8 && tr.width < target.parentElement.clientWidth * 0.9;
      const after = sameRow ? e.clientX > tr.left + tr.width / 2 : e.clientY > tr.top + tr.height / 2;
      const ref = after ? target.nextSibling : target;
      if (ref !== drag.item && drag.item.nextSibling !== ref) flip(() => target.parentElement.insertBefore(drag.item, ref));
      return;
    }
    const cont = under.find((el) => containers.includes(el));
    if (cont && !cont.contains(drag.item)) flip(() => cont.appendChild(drag.item));
  };
  const onUp = () => {
    if (!drag) return;
    const r = drag.item.getBoundingClientRect(); const g = drag.ghost;
    g.style.transition = 'left .18s ease, top .18s ease, opacity .18s'; g.style.left = `${r.left}px`; g.style.top = `${r.top}px`; g.style.opacity = '0';
    setTimeout(() => g.remove(), 190);
    drag.item.classList.remove('sort-placeholder'); document.body.classList.remove('is-dragging');
    drag = null;
    onChange?.(Object.fromEntries(containers.map((c) => [c.dataset.sort, [...c.children].filter((x) => x.dataset.key).map((x) => x.dataset.key)])));
  };
  document.addEventListener('pointerdown', onDown);
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
  return () => {
    document.removeEventListener('pointerdown', onDown); document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp);
    containers.forEach((c) => c.classList.remove('sorting'));
    items().forEach((it) => { it.classList.remove('sort-item'); it.querySelector(':scope > .sort-handle')?.remove(); });
  };
}

// ---------------------------------------------------------------- penjaga isian halaman yang belum disimpan
export const guard = { dirty: false };
document.addEventListener('input', (e) => { if (e.isTrusted && e.target.closest('[data-guard]') && !e.target.closest('.modal-backdrop, [data-noguard]')) guard.dirty = true; }, true);
document.addEventListener('change', (e) => { if (e.isTrusted && e.target.closest('[data-guard]') && !e.target.closest('.modal-backdrop, [data-noguard]')) guard.dirty = true; }, true);
// Tombol simpan di dalam form yang dijaga → dianggap tersimpan
document.addEventListener('click', (e) => { const b = e.target.closest('[data-guard] .btn-primary, [data-guard] [data-save]'); if (b && !b.closest('.modal-backdrop')) setTimeout(() => { guard.dirty = false; }, 0); }, true);
document.addEventListener('submit', (e) => { if (e.target.closest('[data-guard]')) setTimeout(() => { guard.dirty = false; }, 0); }, true);
export const anyModalDirty = () => false; // modal punya penjaga sendiri (lihat ui.modal)

// ---------------------------------------------------------------- konfirmasi keluar (tombol Kembali & tutup tab)
export function setupExitGuards({ isAdmin }) {
  // Sentinel riwayat: tombol Kembali di halaman pertama memunculkan konfirmasi keluar
  if (!history.state || !history.state.dd) { history.replaceState({ dd: 'root' }, ''); history.pushState({ dd: 'app' }, ''); }
  let asking = false;
  window.addEventListener('popstate', async (e) => {
    if (e.state?.dd !== 'root' || asking) return;
    asking = true;
    const msg = guard.dirty ? 'Ada isian yang belum disimpan. Tetap keluar dari aplikasi?' : 'Keluar dari aplikasi / website ini?';
    const ok = await confirmDialog(msg, { title: 'Keluar', okText: 'Ya, keluar', danger: guard.dirty });
    asking = false;
    if (ok) { guard.dirty = false; history.back(); } else history.pushState({ dd: 'app' }, '');
  });
  // Tutup tab / muat ulang: browser menampilkan dialog bawaannya sendiri
  window.addEventListener('beforeunload', (e) => {
    const standalone = matchMedia('(display-mode: standalone)').matches;
    if (guard.dirty || document.querySelector('.modal-backdrop input, .modal-backdrop textarea') || isAdmin() || standalone) { e.preventDefault(); e.returnValue = ''; }
  });
}

// ---------------------------------------------------------------- running text dinamis (JavaScript, selalu bergerak)
let tickerRaf = 0;
export function startTicker() {
  cancelAnimationFrame(tickerRaf);
  const track = $('.ticker-track'); const move = $('.ticker-move'); if (!track || !move) return;
  const speed = Number(move.dataset.speed) || 60; // piksel per detik
  const base = move.innerHTML;
  // gandakan konten sampai cukup panjang untuk berputar mulus
  move.innerHTML = base; let guardN = 0;
  while (move.scrollWidth < track.clientWidth * 2 && guardN++ < 8) move.insertAdjacentHTML('beforeend', base);
  const loopW = move.scrollWidth / (guardN + 1) || move.scrollWidth;
  move.insertAdjacentHTML('beforeend', base);
  let x = track.clientWidth * 0.15, last = performance.now(), paused = false;
  track.onmouseenter = () => { paused = true; }; track.onmouseleave = () => { paused = false; };
  track.ontouchstart = () => { paused = true; }; track.ontouchend = () => { paused = false; };
  const step = (t) => {
    const dt = Math.min(64, t - last); last = t;
    if (!paused && !document.hidden) { x -= (speed * dt) / 1000; if (-x >= loopW) x += loopW; move.style.transform = `translate3d(${x}px,0,0)`; }
    tickerRaf = requestAnimationFrame(step);
  };
  tickerRaf = requestAnimationFrame(step);
}
export const tickerStyle = (rt = {}) => [
  rt.font ? `font-family:'${esc(rt.font)}'` : '', rt.size ? `font-size:${esc(rt.size)}` : '',
  rt.color ? `color:${esc(rt.color)}` : '', rt.bold ? 'font-weight:700' : '', rt.italic ? 'font-style:italic' : '',
].filter(Boolean).join(';');
