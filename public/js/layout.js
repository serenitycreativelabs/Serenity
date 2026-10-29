// Tema & warna (Super Admin), mode Gelap/Terang (semua pengunjung), tata letak panel yang bisa digeser
// (Super Admin), penjaga isian belum disimpan, konfirmasi keluar, dan running text dinamis.
// Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
import { esc, $, $$, confirmDialog } from './ui.js';
import { applyFx } from './motion.js';

// ---------------------------------------------------------------- tema
// Warna tema. bg/surface = nuansa latar mode terang; bgDark/surfaceDark = nuansa mode gelap (opsional)
export const THEME_PRESETS = {
  genz: { label: 'Gen Z Electric', desc: 'Ungu listrik × pink neon', group: 'Gen Z', brand: '#7c3aed', accent: '#ec4899', bg: '#f8f5ff', surface: '#ffffff', line: '#e9e1fb', bgDark: '#0b0912', surfaceDark: '#15111f' },
  acid: { label: 'Acid Lime', desc: 'Indigo × hijau limau', group: 'Gen Z', brand: '#4f46e5', accent: '#65a30d', bg: '#f6f7ff', surface: '#ffffff', line: '#e2e5fb', bgDark: '#0a0b14', surfaceDark: '#131520' },
  sunset: { label: 'Sunset Pop', desc: 'Oranye × magenta', group: 'Gen Z', brand: '#ea580c', accent: '#db2777', bg: '#fff7f2', surface: '#ffffff', line: '#fde3d4', bgDark: '#140c0a', surfaceDark: '#1f1410' },
  ocean: { label: 'Cyber Ocean', desc: 'Biru elektrik × toska', group: 'Gen Z', brand: '#2563eb', accent: '#0891b2', bg: '#f3f8ff', surface: '#ffffff', line: '#dbe7fb', bgDark: '#070c16', surfaceDark: '#0f1724' },
  macos: { label: 'macOS Aqua', desc: 'Biru sistem Apple', group: 'macOS', brand: '#007aff', accent: '#ff9500', bg: '#f5f5f7', surface: '#ffffff', line: '#e3e3e8', bgDark: '#1c1c1e', surfaceDark: '#2c2c2e' },
  macgraphite: { label: 'macOS Graphite', desc: 'Abu grafit elegan', group: 'macOS', brand: '#636366', accent: '#0a84ff', bg: '#f2f2f4', surface: '#ffffff', line: '#e0e0e5', bgDark: '#1a1a1c', surfaceDark: '#2a2a2d' },
  macpurple: { label: 'macOS Purple', desc: 'Ungu aksen Apple', group: 'macOS', brand: '#af52de', accent: '#ff2d55', bg: '#f6f4f8', surface: '#ffffff', line: '#e6e1ec', bgDark: '#1c1a1f', surfaceDark: '#2c2930' },
  macgreen: { label: 'macOS Green', desc: 'Hijau sistem Apple', group: 'macOS', brand: '#28a745', accent: '#007aff', bg: '#f3f6f4', surface: '#ffffff', line: '#dfe7e2', bgDark: '#181c19', surfaceDark: '#272c28' },
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
// v2.9: model tampilan baca (Papan Informasi, Berita Lembaga, Kegiatan Rutin) — dipilih Super Admin
export const READ_MODELS = {
  kartu: { label: 'A · Kartu Baca', desc: 'Satu kartu rapi mengikuti warna tema, sampul tipis, tombol di bilah bawah' },
  kertas: { label: 'B · Lembar Kertas', desc: 'Ala koran/majalah: kertas krem lembut, judul di tengah, huruf serif, huruf awal besar' },
  duakolom: { label: 'C · Dua Kolom', desc: 'Kartu tulisan + panel info & tulisan lainnya di samping (otomatis satu kolom di layar sempit)' },
};
export const EFFECTS = {
  solid: { label: 'Solid & Bersih', desc: 'Tanpa efek, paling ringan' },
  glass: { label: 'Glassy', desc: 'Panel kaca bening (glassmorphism)' },
  aurora: { label: 'Blurry Aurora', desc: 'Latar gradien blur yang bergerak lembut' },
  genz: { label: 'Gen Z Vibrant', desc: 'Gradasi neon, blob bergerak, judul tebal, kartu “sticker”' },
  macos: { label: 'macOS', desc: 'Jendela & menu bar ala Mac, vibrancy, dock di ponsel' },
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
// ---------------------------------------------------------------- pustaka huruf (Super Admin)
// src: g = Google Fonts, fs = Fontshare (gratis), sys = huruf sistem (tanpa unduhan).
// Huruf komersial (Proxima Nova, Butler, Perpetua, dll.) memakai huruf terpasang di perangkat bila ada,
// dan otomatis memakai pengganti gratis yang paling mirip bila tidak ada.
export const FONT_CATS = { sans: 'Sans-serif modern', display: 'Display & judul', serif: 'Serif / elegan', mono: 'Monospace', sys: 'Huruf sistem & klasik' };
export const FONT_LIST = {
  sf: { label: 'SF Pro (Apple System)', fam: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter'", cat: 'sans', src: 'g', q: 'family=Inter:wght@400;500;600;700;800', note: 'huruf Apple — pengganti di Windows/Android: Inter' },
  jakarta: { label: 'Plus Jakarta Sans', fam: "'Plus Jakarta Sans'", cat: 'sans', src: 'g', q: 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  inter: { label: 'Inter', fam: "'Inter'", cat: 'sans', src: 'g', q: 'family=Inter:wght@400;500;600;700;800' },
  satoshi: { label: 'Satoshi', fam: "'Satoshi'", cat: 'sans', src: 'fs', q: 'satoshi@400,500,700,900' },
  outfit: { label: 'Outfit', fam: "'Outfit'", cat: 'sans', src: 'g', q: 'family=Outfit:wght@400;500;600;700;800' },
  generalsans: { label: 'General Sans', fam: "'General Sans'", cat: 'sans', src: 'fs', q: 'general-sans@400,500,600,700' },
  sora: { label: 'Sora', fam: "'Sora'", cat: 'sans', src: 'g', q: 'family=Sora:wght@400;500;600;700;800' },
  spacegrotesk: { label: 'Space Grotesk', fam: "'Space Grotesk'", cat: 'sans', src: 'g', q: 'family=Space+Grotesk:wght@400;500;600;700' },
  lexend: { label: 'Lexend', fam: "'Lexend'", cat: 'sans', src: 'g', q: 'family=Lexend:wght@400;500;600;700;800' },
  opensans: { label: 'Open Sans', fam: "'Open Sans'", cat: 'sans', src: 'g', q: 'family=Open+Sans:wght@400;500;600;700;800' },
  poppins: { label: 'Poppins', fam: "'Poppins'", cat: 'sans', src: 'g', q: 'family=Poppins:wght@400;500;600;700;800' },
  lato: { label: 'Lato', fam: "'Lato'", cat: 'sans', src: 'g', q: 'family=Lato:wght@400;700;900' },
  roboto: { label: 'Roboto', fam: "'Roboto'", cat: 'sans', src: 'g', q: 'family=Roboto:wght@400;500;700;900' },
  montserrat: { label: 'Montserrat', fam: "'Montserrat'", cat: 'sans', src: 'g', q: 'family=Montserrat:wght@400;500;600;700;800' },
  raleway: { label: 'Raleway', fam: "'Raleway'", cat: 'sans', src: 'g', q: 'family=Raleway:wght@400;500;600;700;800' },
  nunito: { label: 'Nunito', fam: "'Nunito'", cat: 'sans', src: 'g', q: 'family=Nunito:wght@400;600;700;800' },
  proxima: { label: 'Proxima Nova', fam: "'Proxima Nova', 'Montserrat'", cat: 'sans', src: 'g', q: 'family=Montserrat:wght@400;500;600;700;800', note: 'komersial — pengganti: Montserrat' },
  clash: { label: 'Clash Display', fam: "'Clash Display'", cat: 'display', src: 'fs', q: 'clash-display@400,500,600,700' },
  cabinet: { label: 'Cabinet Grotesk', fam: "'Cabinet Grotesk'", cat: 'display', src: 'fs', q: 'cabinet-grotesk@400,500,700,800,900' },
  syne: { label: 'Syne', fam: "'Syne'", cat: 'display', src: 'g', q: 'family=Syne:wght@400;500;600;700;800' },
  bebas: { label: 'Bebas Neue', fam: "'Bebas Neue'", cat: 'display', src: 'g', q: 'family=Bebas+Neue', note: 'huruf kapital, cocok untuk judul' },
  playfair: { label: 'Playfair Display', fam: "'Playfair Display'", cat: 'serif', src: 'g', q: 'family=Playfair+Display:wght@400;600;700;800' },
  cinzel: { label: 'Cinzel', fam: "'Cinzel'", cat: 'serif', src: 'g', q: 'family=Cinzel:wght@400;600;700;800' },
  fraunces: { label: 'Fraunces', fam: "'Fraunces'", cat: 'serif', src: 'g', q: 'family=Fraunces:wght@400;600;700;800' },
  instrument: { label: 'Instrument Serif', fam: "'Instrument Serif'", cat: 'serif', src: 'g', q: 'family=Instrument+Serif:ital@0;1' },
  merriweather: { label: 'Merriweather', fam: "'Merriweather'", cat: 'serif', src: 'g', q: 'family=Merriweather:wght@400;700;900' },
  garamond: { label: 'Garamond', fam: "'Garamond', 'EB Garamond'", cat: 'serif', src: 'g', q: 'family=EB+Garamond:wght@400;500;600;700;800' },
  butler: { label: 'Butler', fam: "'Butler', 'Playfair Display'", cat: 'serif', src: 'g', q: 'family=Playfair+Display:wght@400;600;700;800', note: 'tidak tersedia di CDN — pengganti: Playfair Display' },
  perpetua: { label: 'Perpetua', fam: "'Perpetua', 'Cormorant Garamond'", cat: 'serif', src: 'g', q: 'family=Cormorant+Garamond:wght@400;500;600;700', note: 'komersial — pengganti: Cormorant Garamond' },
  lucida: { label: 'Lucida Bright', fam: "'Lucida Bright', 'Libre Baskerville'", cat: 'serif', src: 'g', q: 'family=Libre+Baskerville:wght@400;700', note: 'huruf sistem — pengganti: Libre Baskerville' },
  jetbrains: { label: 'JetBrains Mono', fam: "'JetBrains Mono'", cat: 'mono', src: 'g', q: 'family=JetBrains+Mono:wght@400;500;600;700' },
  spacemono: { label: 'Space Mono', fam: "'Space Mono'", cat: 'mono', src: 'g', q: 'family=Space+Mono:wght@400;700' },
  courier: { label: 'Courier', fam: "'Courier New', Courier", cat: 'mono', src: 'sys' },
  helvetica: { label: 'Helvetica', fam: "Helvetica, 'Helvetica Neue', Arial", cat: 'sys', src: 'sys' },
  arial: { label: 'Arial', fam: 'Arial, Helvetica', cat: 'sys', src: 'sys' },
  verdana: { label: 'Verdana', fam: 'Verdana, Geneva', cat: 'sys', src: 'sys' },
  geneva: { label: 'Geneva', fam: 'Geneva, Verdana', cat: 'sys', src: 'sys' },
  times: { label: 'Times New Roman', fam: "'Times New Roman', Times", cat: 'sys', src: 'sys' },
  cambria: { label: 'Cambria', fam: "Cambria, 'Caladea'", cat: 'sys', src: 'g', q: 'family=Caladea:wght@400;700', note: 'pengganti di HP/Mac: Caladea' },
};
const GENERIC = { sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', display: 'system-ui, sans-serif', serif: 'Georgia, "Times New Roman", serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace', sys: 'system-ui, sans-serif' };
export const fontStack = (id) => { const f = FONT_LIST[id]; return f ? `${f.fam}, ${GENERIC[f.cat] || GENERIC.sans}` : ''; };
export const fontUrl = (id) => {
  const f = FONT_LIST[id]; if (!f?.q) return '';
  return f.src === 'fs' ? `https://api.fontshare.com/v2/css?f[]=${f.q}&display=swap` : `https://fonts.googleapis.com/css2?${f.q}&display=swap`;
};
export function ensureFontIds(ids) {
  for (const id of ids) {
    const u = fontUrl(id); if (!u || document.getElementById(`ff-${id}`)) continue;
    const l = document.createElement('link'); l.id = `ff-${id}`; l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l);
  }
}

export const RADII = { tegas: { label: 'Tegas', v: '6px' }, sedang: { label: 'Sedang', v: '12px' }, bulat: { label: 'Bulat', v: '18px' }, kapsul: { label: 'Ekstra bulat', v: '24px' } };
export const STYLE_PRESETS = {
  darkglass: { label: 'Dark Glass Modern', desc: 'Mode gelap + glassmorphism + Inter & JetBrains Mono', tema: { preset: 'grafit', efek: 'glass', font: 'tech', mode: 'dark', radius: 'bulat', model: 'kartu' } },
  glassy: { label: 'Glassy Terang', desc: 'Kaca bening di atas latar lembut', tema: { preset: 'calm', efek: 'glass', font: 'manrope', mode: 'light', radius: 'bulat', model: 'kartu' } },
  aurora: { label: 'Aurora Dinamis', desc: 'Latar blur bergerak, tipografi Sora', tema: { preset: 'lavender', efek: 'aurora', font: 'sora', mode: 'auto', radius: 'bulat', model: 'klasik' } },
  hangat: { label: 'Terracotta Hangat', desc: 'Palet earthy, huruf Outfit', tema: { preset: 'terracotta', efek: 'solid', font: 'outfit', mode: 'light', radius: 'sedang', model: 'klasik' } },
  golden: { label: 'Golden Hour', desc: 'Warm autumn, judul Playfair', tema: { preset: 'autumn', efek: 'solid', font: 'elegan', mode: 'light', radius: 'sedang', model: 'majalah' } },
  genz: { label: 'Gen Z Vibrant', desc: 'Neon ungu-pink, Clash Display + Satoshi', badge: 'BARU', tema: { preset: 'genz', efek: 'genz', font: 'modern', fHead: 'clash', fBody: 'satoshi', mode: 'auto', radius: 'kapsul', model: 'kartu', fx: { cursor: 'dotring', ikon: 'sedang', click: 'sparkle', magnetic: true } } },
  macos: { label: 'macOS Sonoma', desc: 'Jendela kaca, menu bar & dock — terang', badge: 'BARU', tema: { preset: 'macos', efek: 'macos', font: 'modern', fHead: 'sf', fBody: 'sf', mode: 'light', radius: 'sedang', model: 'kartu', fx: { cursor: 'off', ikon: 'halus', click: 'off' } } },
  macosdark: { label: 'macOS Dark', desc: 'Mode gelap ala Mac, aksen biru', badge: 'BARU', tema: { preset: 'macos', efek: 'macos', font: 'modern', fHead: 'sf', fBody: 'sf', mode: 'dark', radius: 'sedang', model: 'kartu', fx: { cursor: 'off', ikon: 'halus', click: 'off' } } },
  genznight: { label: 'Gen Z Neon Night', desc: 'Mode gelap bercahaya, Cabinet Grotesk', badge: 'BARU', tema: { preset: 'genz', efek: 'genz', font: 'modern', fHead: 'cabinet', fBody: 'generalsans', mode: 'dark', radius: 'kapsul', model: 'kartu', fx: { cursor: 'glow', ikon: 'ramai', click: 'ripple', magnetic: true } } },
  genzacid: { label: 'Gen Z Acid', desc: 'Indigo × lime, Syne + Space Grotesk', badge: 'BARU', tema: { preset: 'acid', efek: 'genz', font: 'modern', fHead: 'syne', fBody: 'spacegrotesk', mode: 'light', radius: 'kapsul', model: 'kartu', fx: { cursor: 'trail', ikon: 'sedang', click: 'confetti', magnetic: true } } },
  genzsunset: { label: 'Gen Z Sunset', desc: 'Oranye-magenta, Bebas Neue + Outfit', badge: 'BARU', tema: { preset: 'sunset', efek: 'genz', font: 'modern', fHead: 'bebas', fBody: 'outfit', mode: 'light', radius: 'bulat', model: 'kartu', fx: { cursor: 'blob', ikon: 'sedang', click: 'sparkle', magnetic: true } } },
};
export const DEFAULT_TEMA = { preset: 'teal', brand: '', accent: '', model: 'klasik', efek: 'solid', font: 'modern', fHead: '', fBody: '', radius: 'sedang', mode: 'auto', toggle: true, baca: 'kartu' };

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
// v2.4.2: tema terakhir dari Super Admin diingat di perangkat agar TIDAK pernah tampil warna bawaan/lama
// sesaat sebelum pengaturan termuat. Dipanggil tanpa argumen → pakai tema tersimpan.
const savedTema = () => { try { return JSON.parse(localStorage.getItem('dd:tema') || 'null'); } catch { return null; } };
export function applyTheme(tema, { fromServer = false } = {}) {
  if (tema === undefined || tema === null) tema = fromServer ? {} : savedTema() || {};
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
  // Huruf kustom per bagian (teks & judul) dari pustaka huruf — menimpa pasangan huruf bila dipilih
  const fB = FONT_LIST[currentTema.fBody] ? currentTema.fBody : '', fH = FONT_LIST[currentTema.fHead] ? currentTema.fHead : '';
  ensureFontIds([fB, fH].filter(Boolean));
  html.style.setProperty('--font', fB ? fontStack(fB) : `${fp.font}, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);
  html.style.setProperty('--font-head', fH ? fontStack(fH) : `${fp.head}, ${fp.font}, system-ui, sans-serif`);
  html.style.setProperty('--font-mono', fp.mono ? `${fp.mono}, ui-monospace, SFMono-Regular, Menlo, monospace` : 'var(--font-head)');
  html.dataset.fh = fH; // mis. Bebas Neue (kapital) butuh penyesuaian kecil di CSS
  applyFx(currentTema.fx, document.getElementById('app')?.dataset.shell || '');
  html.dataset.model = MODELS[currentTema.model] ? currentTema.model : 'klasik';
  html.dataset.font = currentTema.font; html.dataset.efek = EFFECTS[currentTema.efek] ? currentTema.efek : 'solid';
  html.dataset.mono = fp.mono ? '1' : '';
  html.dataset.baca = READ_MODELS[currentTema.baca] ? currentTema.baca : 'kartu';
  html.dataset.theme = resolvedMode();
  // Warna dasar halaman ditempel langsung di <html> → tidak ada kilatan layar putih saat memuat (desktop, ponsel, PWA)
  const pageBg = html.dataset.theme === 'dark' ? (p.bgDark || '#0d1117') : (p.bg || '#f5f6f8');
  html.style.backgroundColor = pageBg; html.style.colorScheme = html.dataset.theme;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', html.dataset.theme === 'dark' ? (p.bgDark || '#0f1419') : (p.surface || '#ffffff'));
  // Simpan cuplikan tema yang sudah diterapkan → dipakai skrip awal di index.html (sebelum JavaScript utama berjalan)
  if (fromServer) {
    try {
      localStorage.setItem('dd:tema', JSON.stringify(tema || {}));
      localStorage.setItem('dd:temaSnap', JSON.stringify({ css: html.style.cssText.replace(/(color-scheme|background-color)[^;]*;?/g, ''), ds: { model: html.dataset.model, font: html.dataset.font, efek: html.dataset.efek, mono: html.dataset.mono, fh: html.dataset.fh, ican: html.dataset.ican, baca: html.dataset.baca }, bgL: p.bg || '#f5f6f8', bgD: p.bgDark || '#0d1117', metaL: p.surface || '#ffffff', metaD: p.bgDark || '#0f1419', mode: currentTema.mode || 'auto', toggle: currentTema.toggle !== false, links: [fp.gf ? `https://fonts.googleapis.com/css2?${fp.gf}&display=swap` : '', fontUrl(fB), fontUrl(fH)].filter(Boolean), meta: document.querySelector('meta[name=theme-color]')?.getAttribute('content') || '' }));
    } catch { /* */ }
  }
  refreshManifest();
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
const DEFAULT_ICONS = { svg: 'icons/favicon.svg', png: 'icons/icon-192.png', apple: 'icons/apple-touch-icon.png', maskable: 'icons/maskable-512.png' };
let iconKey = null, manifestUrl = '', iconState = { src: '', maskable: '', appName: '' }, manT = 0;
export function applyIcon(ikon, appName = '') {
  const ok = (u) => u && (u.startsWith('data:image/') || /^https:\/\//.test(u));
  const src = ok(ikon?.src) ? ikon.src : ''; const maskable = ok(ikon?.maskable) ? ikon.maskable : '';
  iconState = { src, maskable, appName: appName || iconState.appName };
  const key = src ? src.length + src.slice(-40) : '';
  if (key !== iconKey) {
    iconKey = key;
    try { if (src && src.length < 250000) localStorage.setItem('dd:icon', src); else localStorage.removeItem('dd:icon'); } catch { /* */ }
    const head = document.head;
    head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]').forEach((el) => el.remove());
    const add = (rel, href, type = '', sizes = '') => { const el = document.createElement('link'); el.rel = rel; el.href = href; if (type) el.type = type; if (sizes) el.setAttribute('sizes', sizes); head.appendChild(el); };
    // PNG transparan dipakai apa adanya di tab browser (tanpa latar putih). Ikon layar utama iOS memakai versi berlatar warna tema.
    if (src) { add('icon', src, 'image/png'); add('apple-touch-icon', maskable || src); }
    else { add('icon', DEFAULT_ICONS.svg, 'image/svg+xml'); add('icon', DEFAULT_ICONS.png, 'image/png', '192x192'); add('apple-touch-icon', DEFAULT_ICONS.apple); }
  }
  refreshManifest();
}
// Manifest dinamis: ikon kustom + warna latar/tema mengikuti tema website → layar pembuka PWA tidak putih
export function refreshManifest() {
  clearTimeout(manT);
  manT = setTimeout(() => {
    const man = document.head.querySelector('link[rel="manifest"]'); if (!man) return;
    const html = document.documentElement; const cs = getComputedStyle(html);
    const bg = html.style.backgroundColor || cs.getPropertyValue('--bg').trim() || '#f5f6f8';
    const theme = document.querySelector('meta[name=theme-color]')?.getAttribute('content') || cs.getPropertyValue('--brand').trim();
    const { src, maskable, appName } = iconState;
    fetch('manifest.webmanifest').then((r) => r.json()).then((m) => {
      const base = new URL('./', location.href).href; const abs = (u) => new URL(u, base).href;
      const icons = src
        ? [{ src, sizes: '512x512', type: 'image/png', purpose: 'any' }, { src, sizes: '192x192', type: 'image/png', purpose: 'any' }, ...(maskable ? [{ src: maskable, sizes: '512x512', type: 'image/png', purpose: 'maskable' }] : [])]
        : (m.icons || []).map((i) => ({ ...i, src: abs(i.src) }));
      const sc = src ? [{ src: maskable || src, sizes: '192x192' }] : null;
      const out = { ...m, name: appName ? `Portal Resmi Pemerintah ${appName}` : m.name, short_name: appName ? appName.replace(/^(Gampong|Desa|Kelurahan|Nagari)\s+/i, '') : m.short_name, id: abs(m.id || './'), start_url: abs(m.start_url || './'), scope: abs(m.scope || './'), icons,
        background_color: bg, theme_color: bg || theme || m.theme_color,
        shortcuts: (m.shortcuts || []).map((s) => ({ ...s, url: abs(s.url), icons: sc || (s.icons || []).map((i) => ({ ...i, src: abs(i.src) })) })) };
      if (manifestUrl) URL.revokeObjectURL(manifestUrl);
      manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/manifest+json' }));
      man.href = manifestUrl;
    }).catch(() => {});
  }, 300);
}
// Olah gambar unggahan menjadi ikon PNG persegi (default 256 px).
// fit 'contain' = logo utuh tanpa terpotong (bagian kosong tetap TRANSPARAN), 'cover' = isi penuh (tepi terpotong)
export async function makeIconPng(fileOrUrl, { size = 256, bg = '', rounded = true, padding = 0, fit = 'contain' } = {}) {
  const img = await new Promise((res, rej) => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => res(im); im.onerror = () => rej(new Error('Gambar tidak bisa dibaca (pastikan file gambar / URL bisa diakses publik).'));
    im.src = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  });
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.clearRect(0, 0, size, size);
  const rad = rounded ? size * 0.22 : 0;
  if (bg) { x.save(); x.beginPath(); x.roundRect ? x.roundRect(0, 0, size, size, rad) : x.rect(0, 0, size, size); x.closePath(); x.clip(); x.fillStyle = bg; x.fillRect(0, 0, size, size); x.restore(); }
  const inner = size - padding * 2;
  const sc = fit === 'cover' ? Math.max(inner / img.width, inner / img.height) : Math.min(inner / img.width, inner / img.height);
  const w = img.width * sc, h = img.height * sc;
  x.save();
  if (rounded && (bg || fit === 'cover')) { x.beginPath(); x.roundRect ? x.roundRect(0, 0, size, size, rad) : x.rect(0, 0, size, size); x.closePath(); x.clip(); }
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, padding + (inner - w) / 2, padding + (inner - h) / 2, w, h);
  x.restore();
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
  if (!on) { if (layer) { clearInterval(ytLoopT); try { ytPlayer?.destroy?.(); } catch { /* */ } ytPlayer = null; layer.remove(); } bgKey = ''; return; }
  if (layer && key === bgKey) return; bgKey = key;
  layer?.remove(); layer = document.createElement('div'); layer.id = 'bg-layer'; layer.setAttribute('aria-hidden', 'true');
  const kind = latar.jenis && latar.jenis !== 'auto' ? latar.jenis : backgroundKind(latar.url);
  // v2.9.2: video tetap berjalan di semua perangkat; gambar diam hanya bila perangkat memakai mode Hemat Data
  const saveData = !!navigator.connection?.saveData;
  const lite = latar.hemat !== false && saveData;
  const blur = Math.min(20, Math.max(0, Number(latar.blur) || 0));
  const style = blur ? `filter:blur(${blur}px);transform:scale(1.06)` : '';
  let media = '';
  if (kind === 'youtube' && ytId(latar.url)) {
    const id = ytId(latar.url);
    // Gambar sampul tampil lebih dulu; video muncul halus setelah BENAR-BENAR berputar → tidak ada tombol play,
    // judul, atau logo YouTube yang terlihat. Bisu, tanpa kontrol, berulang terus.
    media = `<img class="bg-yt-poster" src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'" alt="" style="${style}">${lite ? '' : `<div class="bg-yt" style="${style}"><div id="bg-yt-player"></div></div>`}`;
  } else if (kind === 'video') {
    media = lite && latar.poster ? `<img src="${esc(latar.poster)}" alt="" style="${style}">` : `<video src="${esc(latar.url)}" ${latar.poster ? `poster="${esc(latar.poster)}"` : ''} autoplay muted loop playsinline preload="metadata" style="${style}"></video>`;
  } else media = `<img src="${esc(driveImg(latar.url))}" alt="" style="${style}" decoding="async">`;
  const ov = Math.min(95, Math.max(0, Number(latar.overlay ?? 55)));
  layer.innerHTML = `${media}<span class="bg-ov" style="opacity:${ov / 100}"></span>`;
  document.body.prepend(layer);
  if (kind === 'youtube' && ytId(latar.url) && !lite) startYtBackground(layer, ytId(latar.url), latar.hemat !== false);
  if (kind === 'video') { const v = layer.querySelector('video'); v?.play?.().catch(() => retryOnGesture(() => v.play())); }
}

// ---------------------------------------------------------------- video YouTube latar (IFrame API)
let ytApi = null, ytPlayer = null, ytFit = null, ytLoopT = 0;
function loadYtApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApi) return ytApi;
  ytApi = new Promise((res, rej) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { try { prev?.(); } catch { /* */ } res(window.YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = () => { ytApi = null; rej(new Error('YouTube tidak dapat dimuat')); };
    document.head.appendChild(s);
  });
  return ytApi;
}
function retryOnGesture(fn) {
  const go = () => { try { fn(); } catch { /* */ } };
  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach((ev) => addEventListener(ev, go, { once: true, passive: true, capture: true }));
}
// Profil kualitas per perangkat (YouTube memilih resolusi dari UKURAN pemutar × kepadatan layar & kecepatan internet):
//  • Desktop / laptop / PWA desktop → pemutar 1920×1080 → 1080p (60 fps bila videonya diunggah 1080p60)
//  • Tablet & ponsel → pemutar 1280×720 → 720p: tajam di layar kecil, ±2–3× lebih hemat kuota
//  • Mode Hemat Data di perangkat → gambar sampul saja
const ytProfile = () => {
  const touch = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  const small = Math.max(screen.width || innerWidth, screen.height || innerHeight) < 1100; // ponsel (laptop 1366×768 tetap 1080p)
  return touch || small || innerWidth < 1024 ? { w: 1280, q: 'hd720', label: '720p' } : { w: 1920, q: 'hd1080', label: '1080p' };
};
const QUALITY_RANK = ['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440', 'hd2160', 'highres'];
// Pemutar dirender pada ukuran tata letak profil (mis. 1920 px) lalu diperkecil/diperbesar secara visual agar
// menutupi layar, plus zoom 12% agar tepi judul/logo YouTube terpotong keluar layar.
function fitYt(wrap, prof) {
  const vw = innerWidth, vh = innerHeight;
  const coverW = Math.max(vw, vh * 16 / 9);
  const W = prof.w, H = W * 9 / 16;
  const scale = (coverW / W) * 1.12;
  wrap.style.width = `${W}px`; wrap.style.height = `${H}px`;
  wrap.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
async function startYtBackground(layer, id, saver) {
  const wrap = layer.querySelector('.bg-yt'); if (!wrap) return;
  ytPlayer?.destroy?.(); ytPlayer = null;
  const prof = saver ? ytProfile() : { w: 1920, q: 'hd1080', label: '1080p' }; // Mode hemat mati → 1080p di semua perangkat
  if (ytFit) removeEventListener('resize', ytFit);
  ytFit = () => fitYt(wrap, prof); ytFit(); addEventListener('resize', ytFit, { passive: true });
  let YT; try { YT = await loadYtApi(); } catch { return; } // tetap tampil gambar sampul
  if (!layer.isConnected) return;
  // Video hanya ditampilkan saat BENAR-BENAR berputar mulus ≥ 3 detik (tombol kontrol YouTube otomatis hilang
  // ±3 detik setelah putar) dan kualitas sudah mencapai target. Saat buffering/berhenti → kembali ke gambar sampul,
  // sehingga tombol putar/jeda/sebelumnya/berikutnya tidak pernah terlihat.
  let revealT = 0, playingSince = 0; clearInterval(ytLoopT);
  const hide = () => { clearTimeout(revealT); wrap.classList.remove('on'); };
  const tryReveal = (p, tries = 0) => {
    clearTimeout(revealT);
    revealT = setTimeout(() => {
      try {
        if (p.getPlayerState?.() !== 1) return;
        const q = p.getPlaybackQuality?.() || '';
        const okQ = !q || q === 'unknown' || QUALITY_RANK.indexOf(q) >= QUALITY_RANK.indexOf(prof.q);
        const t = (performance.now() - playingSince) / 1000;
        if ((t >= 3 && okQ) || t >= 9) { wrap.classList.add('on'); wrap.dataset.q = q; return; }
      } catch { /* */ }
      if (tries < 30) tryReveal(p, tries + 1);
    }, 400);
  };
  ytPlayer = new YT.Player('bg-yt-player', {
    host: 'https://www.youtube-nocookie.com', videoId: id, width: '100%', height: '100%',
    // TANPA playlist/loop bawaan (mode playlist memunculkan tombol sebelumnya/berikutnya) — pengulangan diatur sendiri
    playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1, rel: 0, cc_load_policy: 0, enablejsapi: 1, origin: location.origin, vq: prof.q },
    events: {
      onReady: (e) => {
        const p = e.target;
        try { p.mute(); p.setVolume?.(0); p.setPlaybackQuality?.(prof.q); p.playVideo(); } catch { /* */ }
        const f = p.getIframe?.(); if (f) { f.setAttribute('tabindex', '-1'); f.setAttribute('aria-hidden', 'true'); f.setAttribute('allow', 'autoplay; encrypted-media'); f.title = ''; }
        setTimeout(() => { try { if (p.getPlayerState?.() !== 1) { p.mute(); p.playVideo(); retryOnGesture(() => { p.mute(); p.playVideo(); }); } } catch { /* */ } }, 1500);
        // Ulang mulus: kembali ke awal ±0,6 detik sebelum selesai → layar akhir/video terkait YouTube tidak muncul
        clearInterval(ytLoopT);
        ytLoopT = setInterval(() => { try { const d = p.getDuration?.() || 0, c = p.getCurrentTime?.() || 0; if (d > 2 && c > d - 0.6) p.seekTo(0, true); } catch { /* */ } }, 250);
      },
      onPlaybackQualityChange: (e) => { if (wrap.classList.contains('on')) wrap.dataset.q = e.data; },
      onStateChange: (e) => {
        const S = YT.PlayerState, p = e.target;
        if (e.data === S.PLAYING) {
          try { p.setPlaybackQuality?.(prof.q); } catch { /* */ }
          if (!wrap.classList.contains('on')) { playingSince = performance.now(); tryReveal(p); }
        } else if (e.data === S.BUFFERING || e.data === S.PAUSED || e.data === S.CUED || e.data === -1) {
          // tombol YouTube muncul pada keadaan ini → sembunyikan video sebentar (sampul tetap tampil)
          if (!(e.data === S.BUFFERING && wrap.classList.contains('on') && performance.now() - playingSince < 800)) hide();
          if (e.data === S.PAUSED && !document.hidden) { try { p.playVideo(); } catch { /* */ } }
        } else if (e.data === S.ENDED) { hide(); try { p.seekTo(0, true); p.playVideo(); } catch { /* */ } }
      },
      onError: () => { clearInterval(ytLoopT); wrap.remove(); },
    },
  });
}
document.addEventListener('visibilitychange', () => { try { if (!document.hidden && ytPlayer?.getPlayerState?.() !== 1) ytPlayer?.playVideo?.(); } catch { /* */ } });

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
