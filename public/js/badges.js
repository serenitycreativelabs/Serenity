// Badge pengguna — hanya Super Admin yang dapat memberikan/mencabut badge.
// Ikon dibuat sendiri (generik), BUKAN logo merek, agar aman dipakai publik.
// Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
import { esc, $, $$, toast, modal, viewerIsSuper } from './ui.js';

// ---- glyph SVG generik (viewBox 24)
const G = {
  seal: '<path fill="currentColor" d="M12 1.6l2.5 1.9 3.1-.3 1 3 2.6 1.8-1 3 1 3-2.6 1.8-1 3-3.1-.3L12 22.4l-2.5-1.9-3.1.3-1-3-2.6-1.8 1-3-1-3 2.6-1.8 1-3 3.1.3z"/><path d="M8.3 12.3l2.5 2.5 4.9-5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/>',
  shield: '<path d="M12 21s7-3.5 7-9V5.5L12 3 5 5.5V12c0 5.5 7 9 7 9z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  brush: '<path d="M14 4l6 6-8 8H6v-6z"/><path d="M4 20l2-2"/>',
  game: '<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="11" r=".9" fill="currentColor"/><circle cx="18" cy="13" r=".9" fill="currentColor"/>',
  rocket: '<path d="M12 3c4 2 6 6 6 10l-3 3H9l-3-3c0-4 2-8 6-10z"/><circle cx="12" cy="10" r="2"/><path d="M9 16l-2 4M15 16l2 4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8"/>',
  building: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"/>',
  branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10c0 4-6 3-11 7"/>',
  layers: '<path d="M4 15v4h16v-4"/><path d="M8 15h8M8.5 11.5l7.8 1.6M9.8 7.5l7.3 3.4M12.4 4l6 5"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
  photo: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".9" fill="currentColor"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  play: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>',
  note: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',
  phone: '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-4.7A8.5 8.5 0 1 1 20.5 11.6z"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  headset: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="7.5" r="1" fill="currentColor"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z"/>',
  cert: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 9h10M7 12h6"/><circle cx="16" cy="17" r="3"/><path d="M14.5 19.5L14 23l2-1 2 1-.5-3.5"/>',
  medal: '<path d="M7 3h10l-3 6H10z"/><circle cx="12" cy="15" r="6"/><path d="M12 12v6M9.5 15h5"/>',
  hand: '<path d="M7 12V6a1.5 1.5 0 0 1 3 0v5M10 11V4.5a1.5 1.5 0 0 1 3 0V11M13 11V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 14a1.5 1.5 0 0 1 2.4-1.8L7 13"/>',
  sprout: '<path d="M12 21v-9M12 12C12 7 8 5 4 5c0 5 3 7 8 7zM12 14c0-4 3-6 8-6 0 4-3 6-8 6z"/>',
};

// ---- katalog: id → { label, cat, glyph, color, url? (boleh ditautkan), seal? (centang) }
export const BADGE_CATS = {
  verif: 'Centang Verifikasi',
  peran: 'Peran & Pencapaian',
  sosial: 'Media Sosial & Komunitas (dengan tautan profil)',
  sertif: 'Sertifikasi Digital (dengan tautan verifikasi)',
};
export const BADGES = {
  'verified-blue': { label: 'Terverifikasi (Centang Biru)', cat: 'verif', glyph: 'seal', color: '#1d9bf0', seal: true },
  'verified-gold': { label: 'Centang Emas — Pengelola Utama', cat: 'verif', glyph: 'seal', color: '#d4a017', seal: true },
  'verified-green': { label: 'Centang Hijau — Perangkat Gampong', cat: 'verif', glyph: 'seal', color: '#16a34a', seal: true },
  'verified-gray': { label: 'Centang Abu — Akun Lembaga', cat: 'verif', glyph: 'seal', color: '#64748b', seal: true },
  'verified-purple': { label: 'Centang Ungu — Mitra / Kolaborator', cat: 'verif', glyph: 'seal', color: '#7c3aed', seal: true },

  developer: { label: 'Developer', cat: 'peran', glyph: 'code', color: '#0f172a' },
  founder: { label: 'Pendiri / Inisiator', cat: 'peran', glyph: 'crown', color: '#b45309' },
  moderator: { label: 'Moderator', cat: 'peran', glyph: 'shield', color: '#2563eb' },
  editor: { label: 'Editor Konten', cat: 'peran', glyph: 'pen', color: '#0891b2' },
  kontributor: { label: 'Kontributor', cat: 'peran', glyph: 'star', color: '#f59e0b' },
  topkontributor: { label: 'Top Kontributor', cat: 'peran', glyph: 'trophy', color: '#ca8a04' },
  relawan: { label: 'Relawan Gampong', cat: 'peran', glyph: 'heart', color: '#e11d48' },
  perangkat: { label: 'Perangkat Gampong', cat: 'peran', glyph: 'building', color: '#15803d' },
  pengajar: { label: 'Pengajar / Ustadz', cat: 'peran', glyph: 'book', color: '#7c3aed' },
  mentor: { label: 'Mentor', cat: 'peran', glyph: 'cap', color: '#4f46e5' },
  kreator: { label: 'Kreator Konten', cat: 'peran', glyph: 'video', color: '#db2777' },
  fotografer: { label: 'Fotografer', cat: 'peran', glyph: 'camera', color: '#475569' },
  desainer: { label: 'Desainer', cat: 'peran', glyph: 'brush', color: '#c026d3' },
  gamer: { label: 'Gamer', cat: 'peran', glyph: 'game', color: '#16a34a' },
  earlysupporter: { label: 'Pendukung Awal', cat: 'peran', glyph: 'rocket', color: '#ea580c' },
  penggerak: { label: 'Penggerak Komunitas', cat: 'peran', glyph: 'hand', color: '#0d9488' },
  umkm: { label: 'Pelaku UMKM', cat: 'peran', glyph: 'sprout', color: '#65a30d' },

  github: { label: 'GitHub', cat: 'sosial', glyph: 'branch', color: '#24292f', url: true },
  gitlab: { label: 'GitLab', cat: 'sosial', glyph: 'branch', color: '#e24329', url: true },
  stackoverflow: { label: 'Stack Overflow', cat: 'sosial', glyph: 'layers', color: '#f48024', url: true },
  linkedin: { label: 'LinkedIn', cat: 'sosial', glyph: 'brief', color: '#0a66c2', url: true },
  instagram: { label: 'Instagram', cat: 'sosial', glyph: 'photo', color: '#d6249f', url: true },
  facebook: { label: 'Facebook', cat: 'sosial', glyph: 'chat', color: '#1877f2', url: true },
  youtube: { label: 'YouTube', cat: 'sosial', glyph: 'play', color: '#ff0000', url: true },
  tiktok: { label: 'TikTok', cat: 'sosial', glyph: 'note', color: '#111111', url: true },
  x: { label: 'X (Twitter)', cat: 'sosial', glyph: 'at', color: '#111111', url: true },
  whatsapp: { label: 'WhatsApp / Saluran', cat: 'sosial', glyph: 'phone', color: '#25d366', url: true },
  telegram: { label: 'Telegram', cat: 'sosial', glyph: 'send', color: '#229ed9', url: true },
  discord: { label: 'Discord', cat: 'sosial', glyph: 'headset', color: '#5865f2', url: true },
  website: { label: 'Website Pribadi', cat: 'sosial', glyph: 'globe', color: '#0f766e', url: true },
  behance: { label: 'Behance / Dribbble', cat: 'sosial', glyph: 'palette', color: '#1769ff', url: true },
  kaggle: { label: 'Kaggle', cat: 'sosial', glyph: 'chart', color: '#20beff', url: true },
  medium: { label: 'Medium / Blog', cat: 'sosial', glyph: 'pen', color: '#111111', url: true },

  credly: { label: 'Credly (Digital Badge)', cat: 'sertif', glyph: 'award', color: '#ff6b00', url: true },
  coursera: { label: 'Coursera Certificate', cat: 'sertif', glyph: 'cert', color: '#0056d2', url: true },
  gcloud: { label: 'Google Cloud Certified', cat: 'sertif', glyph: 'cloud', color: '#4285f4', url: true },
  googlecareer: { label: 'Google Career Certificate', cat: 'sertif', glyph: 'cert', color: '#34a853', url: true },
  aws: { label: 'AWS Certified', cat: 'sertif', glyph: 'cloud', color: '#ff9900', url: true },
  microsoft: { label: 'Microsoft Certified', cat: 'sertif', glyph: 'medal', color: '#0078d4', url: true },
  cisco: { label: 'Cisco (CCNA / NetAcad)', cat: 'sertif', glyph: 'award', color: '#049fd9', url: true },
  dicoding: { label: 'Dicoding Academy', cat: 'sertif', glyph: 'cert', color: '#2d3e50', url: true },
  digitalent: { label: 'Digital Talent Scholarship', cat: 'sertif', glyph: 'medal', color: '#c2410c', url: true },
  bnsp: { label: 'Sertifikasi Kompetensi BNSP', cat: 'sertif', glyph: 'award', color: '#b91c1c', url: true },
  hackerrank: { label: 'HackerRank', cat: 'sertif', glyph: 'code', color: '#16a34a', url: true },
  freecodecamp: { label: 'freeCodeCamp', cat: 'sertif', glyph: 'cert', color: '#0a0a23', url: true },
  linkedinlearning: { label: 'LinkedIn Learning', cat: 'sertif', glyph: 'cap', color: '#0a66c2', url: true },
};
const safe = (u) => { try { const x = new URL(String(u || '').trim()); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
// Normalisasi daftar badge tersimpan → hanya id yang dikenal, maksimal 30
export const normBadges = (arr) => (Array.isArray(arr) ? arr : []).map((b) => (typeof b === 'string' ? { id: b } : b)).filter((b) => b && BADGES[b.id]).slice(0, 30);
const svg = (g, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${G[g] || G.star}</svg>`;
export function badgeIcon(b, links = true) {
  const d = BADGES[b.id]; if (!d) return '';
  const tag = links && d.url && safe(b.url) ? 'a' : 'span';
  const href = tag === 'a' ? ` href="${esc(safe(b.url))}" target="_blank" rel="noopener nofollow ugc"` : '';
  const lbl = !viewerIsSuper() && /git(hub|lab)/i.test(d.label) ? 'Profil Developer' : d.label;
  const title = esc(lbl + (b.note ? ` — ${b.note}` : ''));
  return `<${tag} class="ubadge ${d.seal ? 'seal' : ''}" style="--bc:${d.color}" title="${title}" aria-label="${title}"${href}>${svg(d.glyph)}</${tag}>`;
}
// Deretan ikon badge (centang tampil lebih dulu). max = batas yang ditampilkan; links=false bila berada di dalam <a>
export function badgeRow(list, max = 6, links = true) {
  const bs = normBadges(list).sort((a, b) => (BADGES[b.id].seal ? 1 : 0) - (BADGES[a.id].seal ? 1 : 0));
  if (!bs.length) return '';
  const extra = bs.length > max ? `<span class="ubadge" style="--bc:var(--muted)" title="${bs.slice(max).map((b) => esc(BADGES[b.id].label)).join(', ')}">+${bs.length - max}</span>` : '';
  return `<span class="ubadges">${bs.slice(0, max).map((b) => badgeIcon(b, links)).join('')}${extra}</span>`;
}
export const badgePills = (list) => normBadges(list).map((b) => `<span class="ubadge-pill">${badgeIcon(b)} ${esc(BADGES[b.id].label)}</span>`).join('');

// Dialog pemilih badge (Super Admin). Resolve dengan daftar badge baru, atau null bila batal.
export function badgeDialog(user) {
  return new Promise((resolve) => {
    const cur = Object.fromEntries(normBadges(user.badges).map((b) => [b.id, b]));
    let done = false;
    const m = modal({
      title: `Badge — ${user.nama || user.email}`, size: 'lg',
      body: `<form id="bp-f" class="badge-picker">
        <p class="muted small">Badge tampil di samping nama pengguna (dasbor, daftar akun, dan tanda “Diterbitkan oleh” pada informasi). Badge berlogo merek tidak dipakai — ikon dibuat generik agar aman untuk publik. Tautan wajib diawali <code>https://</code>.</p>
        ${Object.entries(BADGE_CATS).map(([c, cl]) => `<fieldset><legend>${esc(cl)}</legend><div class="bp-grid">${Object.entries(BADGES).filter(([, d]) => d.cat === c).map(([id, d]) => `<label class="bp-item"><input type="checkbox" name="b" value="${id}" ${cur[id] ? 'checked' : ''}>${badgeIcon({ id })}<span>${esc(d.label)}</span>${d.url ? `<input type="url" data-url="${id}" placeholder="https://… (profil / verifikasi)" value="${esc(cur[id]?.url || '')}">` : ''}</label>`).join('')}</div></fieldset>`).join('')}
        <p class="muted small" id="bp-count"></p></form>`,
      footer: '<button class="btn btn-ghost" type="button" id="bp-clear">Kosongkan</button><span class="spacer"></span><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="bp-ok">Simpan badge</button>',
      onClose: () => { if (!done) resolve(null); },
    });
    const f = $('#bp-f', m.el);
    const count = () => { const n = $$('input[name=b]:checked', f).length; $('#bp-count', m.el).textContent = `${n} badge dipilih (maks. 30)`; };
    f.addEventListener('change', count); count();
    $('#bp-clear', m.el).onclick = () => { $$('input[name=b]', f).forEach((c) => { c.checked = false; }); count(); };
    $('#bp-ok', m.el).onclick = () => {
      const out = [];
      for (const c of $$('input[name=b]:checked', f)) {
        const id = c.value; const d = BADGES[id]; const b = { id };
        if (d.url) { const raw = $(`[data-url="${id}"]`, f)?.value.trim(); if (raw) { const u = safe(raw); if (!u) { toast(`Tautan ${d.label} harus diawali https://`, 'error'); return; } b.url = u; } }
        out.push(b);
      }
      if (out.length > 30) return toast('Maksimal 30 badge per pengguna', 'error');
      done = true; m.close(); resolve(out);
    };
  });
}
