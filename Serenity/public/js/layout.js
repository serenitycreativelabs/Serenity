// Tema & warna (Super Admin), mode Gelap/Terang (semua pengunjung), tata letak panel yang bisa digeser
// (Super Admin), penjaga isian belum disimpan, konfirmasi keluar, dan running text dinamis.
// Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
import { esc, $, $$, confirmDialog } from './ui.js';

// ---------------------------------------------------------------- tema
// Warna tema. bg/surface = nuansa latar mode terang; bgDark/surfaceDark = nuansa mode gelap (opsional)
export const THEME_PRESETS = {
  teal: { label: 'Teal Gampong', group: 'Klasik', brand: '#0f766e', accent: '#b45309' },
  biru: { label: 'Biru Laut', group: 'Klasik', brand: '#1d4ed8', accent: '#ea580c' },
  hijau: { label: 'Hijau Sawah', group: 'Klasik', brand: '#15803d', accent: '#a16207' },
  marun: { label: 'Merah Marun', group: 'Klasik', brand: '#9f1239', accent: '#b45309' },
  ungu: { label: 'Ungu Senja', group: 'Klasik', brand: '#6d28d9', accent: '#db2777' },
  cokelat: { label: 'Cokelat Meunasah', group: 'Klasik', brand: '#92400e', accent: '#0f766e' },
  grafit: { label: 'Grafit Netral', group: 'Klasik', brand: '#334155', accent: '#0891b2' },
  terracotta: { label: 'Earthy & Terracotta', desc: 'Hangat & natural', group: 'Hangat & Lembut', brand: '#b4532a', accent: '#6b7f3a', bg: '#f7f0e8', surface: '#fffbf6', line: '#ecdccb', bgDark: '#16110e', surfaceDark: '#201915' },
  creamy: { label: 'Warm Neutral / Creamy', desc: 'Minimalis & bersih', group: 'Hangat & Lembut', brand: '#8b6b4e', accent: '#c4975f', bg: '#faf6f0', surface: '#fffdf9', line: '#ece3d6', bgDark: '#15130f', surfaceDark: '#1f1c17' },
  autumn: { label: 'Warm Autumn / Golden Hour', desc: 'Klasik & elegan', group: 'Hangat & Lembut', brand: '#a8571c', accent: '#c9932a', bg: '#fbf3e6', surface: '#fffaf2', line: '#efdcc0', bgDark: '#17110b', surfaceDark: '#221a12' },
  sage: { label: 'Sage & Olive Warm', desc: 'Segar tapi tetap hangat', group: 'Hangat & Lembut', brand: '#5d7a4f', accent: '#b0813f', bg: '#f3f4ec', surface: '#fcfcf7', line: '#dfe3d2', bgDark: '#10140f', surfaceDark: '#191e17' },
  calm: { label: 'Soft Calm', desc: 'Clean, calm & modern', group: 'Hangat & Lembut', brand: '#557a95', accent: '#c48b86', bg: '#f4f6f8', surface: '#ffffff', line: '#e2e7ec', bgDark: '#0f1317', surfaceDark: '#171d23' },
  lavender: { label: 'Lavender Mist', desc: 'Lembut & menenangkan', group: 'Hangat & Lembut', brand: '#6f62a8', accent: '#d08c60', bg: '#f6f4fa', surface: '#fefdff', line: '#e6e1f0', bgDark: '#121019', surfaceDark: '#1b1824' },
};
export const MODELS = {
  klasik: { label: 'Klasik — panel jadwal sholat & kegiatan di kiri-kanan layar', icon: '▥' },
  kartu: { label: 'Kartu Modern — panel melayang, sudut membulat, latar lembut', icon: '▦' },
  fokus: { label: 'Fokus — konten selebar layar, panel samping pindah ke bawah', icon: '▭' },
  majalah: { label: 'Majalah — berita utama ditonjolkan dengan gambar besar', icon: '▤' },
};
// Efek visual (ringan: blur hanya pada header, footer, panel samping & dialog; latar beranimasi memakai GPU)
export const EFFECTS = {
  solid: { label: 'Solid & Bersih', desc: 'Tanpa efek, paling ringan' },
  glass: { label: 'Glassy', desc: 'Panel kaca bening (glassmorphism)' },
  aurora: { label: 'Blurry Aurora', desc: 'Latar gradien blur yang bergerak lembut' },
};
// Pasangan huruf. gf = parameter Google Fonts (dimuat hanya saat dipakai)
export const FONT_PAIRS = {
  modern: { label: 'Modern — Inter + Plus Jakarta Sans', font: "'Inter'", head: "'Plus Jakarta Sans'", gf: '' },
  tech: { label: 'Tech — Inter + JetBrains Mono', font: "'Inter'", head: "'Inter'", mono: "'JetBrains Mono'", gf: 'family=JetBrains+Mono:wght@400;500;600;700' },
  grotesk: { label: 'Grotesk — Space Grotesk + Inter', font: "'Inter'", head: "'Space Grotesk'", mono: "'JetBrains Mono'", gf: 'family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;600' },
  poppins: { label: 'Poppins — geometris & populer', font: "'Poppins'", head: "'Poppins'", gf: 'family=Poppins:wght@400;500;600;700;800' },
  manrope: { label: 'Manrope — modern & rapi', font: "'Manrope'", head: "'Manrope'", gf: 'family=Manrope:wght@400;500;600;700;800' },
  dmsans: { label: 'DM Sans — bersih & ringan', font: "'DM Sans'", head: "'DM Sans'", gf: 'family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800' },
  outfit: { label: 'Outfit — ramping & segar', font: "'Inter'", head: "'Outfit'", gf: 'family=Outfit:wght@500;600;700;800' },
  sora: { label: 'Sora — futuristik', font: "'Inter'", head: "'Sora'", gf: 'family=Sora:wght@500;600;700;800' },
  figtree: { label: 'Figtree — ramah & jelas', font: "'Figtree'", head: "'Figtree'", gf: 'family=Figtree:wght@400;500;600;700;800' },
  urbanist: { label: 'Urbanist — elegan modern', font: "'Inter'", head: "'Urbanist'", gf: 'family=Urbanist:wght@500;600;700;800' },
  lexend: { label: 'Lexend — mudah dibaca', font: "'Lexend'", head: "'Lexend'", gf: 'family=Lexend:wght@400;500;600;700' },
  elegan: { label: 'Elegan — Playfair Display + Inter', font: "'Inter'", head: "'Playfair Display'", gf: 'family=Playfair+Display:wght@600;700;800' },
  klasik: { label: 'Klasik — Lora untuk judul', font: "'Inter'", head: "'Lora'", gf: '' },
  ramah: { label: 'Ramah — Nunito', font: "'Nunito'", head: "'Nunito'", gf: '' },
};
export const RADII = { tegas: { label: 'Tegas', v: '6px' }, sedang: { label: 'Sedang', v: '12px' }, bulat: { label: 'Bulat', v: '18px' }, kapsul: { label: 'Ekstra bulat', v: '24px' } };
export const STYLE_PRESETS = {
  darkglass: { label: 'Dark Glass Modern', desc: 'Mode gelap + glassmorphism + Inter & JetBrains Mono', tema: { preset: 'grafit', efek: 'glass', font: 'tech', mode: 'dark', radius: 'bulat', model: 'kartu' } },
  glassy: { label: 'Glassy Terang', desc: 'Kaca bening di atas latar lembut', tema: { preset: 'calm', efek: 'glass', font: 'manrope', mode: 'light', radius: 'bulat', model: 'kartu' } },
  aurora: { label: 'Aurora Dinamis', desc: 'Latar blur bergerak, tipografi Sora', tema: { preset: 'lavender', efek: 'aurora', font: 'sora', mode: 'auto', radius: 'bulat', model: 'klasik' } },
  hangat: { label: 'Terracotta Hangat', desc: 'Palet earthy, huruf Outfit', tema: { preset: 'terracotta', efek: 'solid', font: 'outfit', mode: 'light', radius: 'sedang', model: 'klasik' } },
  golden: { label: 'Golden Hour', desc: 'Warm autumn, judul Playfair', tema: { preset: 'autumn', efek: 'solid', font: 'elegan', mode: 'light', radius: 'sedang', model: 'majalah' } },
};
export const DEFAULT_TEMA = { preset: 'teal', brand: '', accent: '', model: 'klasik', efek: 'solid', font: 'modern', radius: 'sedang', mode: 'auto', toggle: true };

// Muat huruf Google Fonts sesuai kebutuhan (tidak membebani halaman bila tidak dipakai)
export function ensureFonts(keys) {
  for (const k of keys) {
    const fp = FONT_PAIRS[k]; if (!fp?.gf || document.getElementById(`gf-${k}`)) continue;
    const l = document.createElement('link'); l.id = `gf-${k}`; l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?${fp.gf}&display=swap`; document.head.appendChild(l);
  }
}

let currentTema = { ...DEFAULT_TEMA };
const mq = matchMedia('(prefers-color-scheme: dark)');
const readPref = () => { try { return localStorage.getItem('dd:theme') || ''; } catch { return ''; } };
export function resolvedMode() {
  const pref = currentTema.toggle !== false ? readPref() : '';
  const m = pref || currentTema.mode || 'auto';
  return m === 'auto' ? (mq.matches ? 'dark' : 'light') : m;
}
const setVar = (html, k, v) => { if (v) html.style.setProperty(k, v); else html.style.removeProperty(k); };
export function applyTheme(tema) {
  currentTema = { ...DEFAULT_TEMA, ...(tema || {}) };
  const p = THEME_PRESETS[currentTema.preset] || THEME_PRESETS.teal;
  const html = document.documentElement;
  html.style.setProperty('--brand', currentTema.brand || p.brand);
  html.style.setProperty('--brand-accent', currentTema.accent || p.accent);
  setVar(html, '--bg-light', p.bg); setVar(html, '--surface-light', p.surface); setVar(html, '--line-light', p.line);
  setVar(html, '--bg-dark', p.bgDark); setVar(html, '--surface-dark', p.surfaceDark);
  const r = (RADII[currentTema.radius] || RADII.sedang).v;
  html.style.setProperty('--radius', r); html.style.setProperty('--radius-sm', `calc(${r} * .66)`);
  const fp = FONT_PAIRS[currentTema.font] || FONT_PAIRS.modern;
  ensureFonts([currentTema.font]);
  html.style.setProperty('--font', `${fp.font}, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);
  html.style.setProperty('--font-head', `${fp.head}, ${fp.font}, system-ui, sans-serif`);
  html.style.setProperty('--font-mono', fp.mono ? `${fp.mono}, ui-monospace, SFMono-Regular, Menlo, monospace` : 'var(--font-head)');
  html.dataset.model = MODELS[currentTema.model] ? currentTema.model : 'klasik';
  html.dataset.font = currentTema.font; html.dataset.efek = EFFECTS[currentTema.efek] ? currentTema.efek : 'solid';
  html.dataset.mono = fp.mono ? '1' : '';
  html.dataset.theme = resolvedMode();
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', html.dataset.theme === 'dark' ? (p.bgDark || '#0f1419') : (p.surface || '#ffffff'));
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

// ---------------------------------------------------------------- ikon aplikasi (tab browser & layar utama)
const DEFAULT_ICONS = { svg: 'icons/favicon.svg', png: 'icons/icon-192.png', apple: 'icons/apple-touch-icon.png' };
let iconKey = null, manifestUrl = '';
export function applyIcon(ikon, appName = '') {
  const src = ikon?.src && (ikon.src.startsWith('data:image/') || /^https:\/\//.test(ikon.src)) ? ikon.src : '';
  const key = src ? src.length + src.slice(-40) : '';
  if (key === iconKey) return; iconKey = key;
  try { if (src && src.length < 250000) localStorage.setItem('dd:icon', src); else localStorage.removeItem('dd:icon'); } catch { /* */ }
  const head = document.head;
  head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]').forEach((el) => el.remove());
  const add = (rel, href, type = '', sizes = '') => { const el = document.createElement('link'); el.rel = rel; el.href = href; if (type) el.type = type; if (sizes) el.setAttribute('sizes', sizes); head.appendChild(el); };
  if (src) { add('icon', src); add('apple-touch-icon', src); }
  else { add('icon', DEFAULT_ICONS.svg, 'image/svg+xml'); add('icon', DEFAULT_ICONS.png, 'image/png', '192x192'); add('apple-touch-icon', DEFAULT_ICONS.apple); }
  // Manifest dinamis agar ikon "Pasang aplikasi" ikut berubah
  const man = head.querySelector('link[rel="manifest"]');
  if (!man) return;
  if (manifestUrl) { URL.revokeObjectURL(manifestUrl); manifestUrl = ''; }
  if (!src) { man.href = 'manifest.webmanifest'; return; }
  fetch('manifest.webmanifest').then((r) => r.json()).then((m) => {
    const base = new URL('./', location.href).href;
    const abs = (u) => new URL(u, base).href;
    const icons = [{ src, sizes: '512x512', type: 'image/png', purpose: 'any' }, { src, sizes: '192x192', type: 'image/png', purpose: 'any' }];
    const out = { ...m, name: appName ? `${appName} — ${m.name.split(' — ')[1] || ''}`.trim() : m.name, id: abs(m.id || './'), start_url: abs(m.start_url || './'), scope: abs(m.scope || './'), icons,
      shortcuts: (m.shortcuts || []).map((s) => ({ ...s, url: abs(s.url), icons: [{ src, sizes: '192x192' }] })) };
    manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/manifest+json' }));
    man.href = manifestUrl;
  }).catch(() => {});
}
// Olah gambar unggahan menjadi ikon PNG persegi (default 256 px) — bisa diberi latar & sudut membulat
export async function makeIconPng(fileOrUrl, { size = 256, bg = '', rounded = true, padding = 0 } = {}) {
  const img = await new Promise((res, rej) => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => res(im); im.onerror = () => rej(new Error('Gambar tidak bisa dibaca (pastikan file gambar / URL bisa diakses publik).'));
    im.src = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  });
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const rad = rounded ? size * 0.22 : 0;
  x.beginPath(); x.roundRect ? x.roundRect(0, 0, size, size, rad) : x.rect(0, 0, size, size); x.closePath(); x.clip();
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, size, size); }
  const inner = size - padding * 2; const sc = Math.max(inner / img.width, inner / img.height);
  const w = img.width * sc, h = img.height * sc;
  x.drawImage(img, padding + (inner - w) / 2, padding + (inner - h) / 2, w, h);
  return c.toDataURL('image/png');
}

// ---------------------------------------------------------------- latar belakang website (foto / video dari URL)
// latar = { aktif, url, jenis:'auto'|'gambar'|'video'|'youtube', overlay:0-90, blur:0-20, cakupan:'semua'|'beranda', hemat:true }
export function backgroundKind(url = '') {
  if (/youtu\.?be/.test(url)) return 'youtube';
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)) return 'video';
  return 'gambar';
}
const ytId = (u) => (String(u).match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([\w-]{11})/) || [])[1] || '';
const driveImg = (u) => { const m = String(u).match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/); return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w1920` : u; };
let bgKey = '';
export function applyBackground(latar, { isHome = false } = {}) {
  const on = latar?.aktif && /^https:\/\//.test(latar.url || '') && (latar.cakupan !== 'beranda' || isHome);
  const key = on ? JSON.stringify(latar) : '';
  document.body.classList.toggle('has-bg', !!on);
  let layer = document.getElementById('bg-layer');
  if (!on) { layer?.remove(); bgKey = ''; return; }
  if (layer && key === bgKey) return; bgKey = key;
  layer?.remove(); layer = document.createElement('div'); layer.id = 'bg-layer'; layer.setAttribute('aria-hidden', 'true');
  const kind = latar.jenis && latar.jenis !== 'auto' ? latar.jenis : backgroundKind(latar.url);
  const saveData = navigator.connection?.saveData || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = latar.hemat !== false && (saveData || innerWidth < 700);
  const blur = Math.min(20, Math.max(0, Number(latar.blur) || 0));
  const style = blur ? `filter:blur(${blur}px);transform:scale(1.06)` : '';
  let media = '';
  if (kind === 'youtube' && ytId(latar.url)) {
    const id = ytId(latar.url);
    media = lite ? `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" style="${style}">`
      : `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3" allow="autoplay; encrypted-media" tabindex="-1" title="" style="${style}" loading="lazy"></iframe>`;
  } else if (kind === 'video') {
    media = lite && latar.poster ? `<img src="${esc(latar.poster)}" alt="" style="${style}">` : `<video src="${esc(latar.url)}" ${latar.poster ? `poster="${esc(latar.poster)}"` : ''} autoplay muted loop playsinline preload="metadata" style="${style}"></video>`;
  } else media = `<img src="${esc(driveImg(latar.url))}" alt="" style="${style}" decoding="async">`;
  const ov = Math.min(95, Math.max(0, Number(latar.overlay ?? 55)));
  layer.innerHTML = `${media}<span class="bg-ov" style="opacity:${ov / 100}"></span>`;
  document.body.prepend(layer);
}

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
export function setupExitGuards() {
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
  // Tutup tab / muat ulang: peringatan HANYA bila ada isian data yang belum disimpan
  window.addEventListener('beforeunload', (e) => {
    if (guard.dirty || document.querySelector('.modal-backdrop[data-dirty]')) { e.preventDefault(); e.returnValue = ''; }
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
