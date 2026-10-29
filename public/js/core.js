// Inti bersama: state, ikon, izin akses (Super Admin / Admin), audit log, konfirmasi password
import { APP } from './config.js';
import * as F from './firebase.js';
import { esc, norm, modal, confirmDialog, authErrorMessage, fmtNum } from './ui.js';
export { F };

// ---------------------------------------------------------------- ikon
export const I = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  map: '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z"/><path d="M9 3v15M15 6v15"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  ig: '<rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  cog: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  wa: '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-4.7A8.5 8.5 0 1 1 20.5 11.6z"/><path d="M8.8 8.7c.2-.5.5-.6.8-.6h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .5-.1.6l-.5.6c-.1.2-.1.4 0 .6.6 1 1.4 1.8 2.5 2.4.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.3.3.6-.1.9-.9 1.6-1.8 1.7-1.5.2-3.4-.6-5.1-2.3-1.7-1.6-2.5-3.5-2.3-4.9z" fill="currentColor" stroke="none"/>',
  pin: '<path d="M12 17v5M5 17h14l-2-4V5h1V3H6v2h1v8z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  loc: '<path d="M12 22s-8-6-8-12a8 8 0 0 1 16 0c0 6-8 12-8 12z"/><circle cx="12" cy="10" r="3"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  log: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  repeat: '<path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="m21 15-5-5L5 21"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  news: '<path d="M4 4h13v16H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v10a2 2 0 0 1-2 2"/><path d="M8 8h5M8 12h5M8 16h3"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.1 9.1 0 0 1-3.9-.9L3 20.5l1.5-4.4A8 8 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/><path d="M8 10.5h8M8 14h5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
};
export const ic = (n, cls = '') => `<svg class="ic ${cls}" data-i="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

// ---------------------------------------------------------------- state
export const state = {
  route: null, view: '', authReady: false, user: null, isAdmin: false, profile: null, role: '', perms: {},
  config: {}, authCfg: {}, stats: {}, warga: [], wargaReady: false, dusun: [], master: {}, masterReady: false,
  info: [], ig: [], halaman: {}, kegiatan: [], lembaga: [], lembagaReady: false, dokumen: [], layoutEdit: null, adminUnsubs: [], infoUnsub: null,
  filters: { q: '', dusun: '', field: '', value: '', jk: '', page: 1, per: 25, sort: 'nama' },
  selected: new Set(), deferredPrompt: null, swReg: null, timers: [],
};

export const C = (p) => F.doc(F.db, ...p.split('/'));
export const clean = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) if (v !== undefined) r[k] = v; return r; };
// Bila nama desa belum diatur, tampilkan nama aplikasi saja (hindari "Desa Desa Digital")
export const desaName = () => state.config.namaDesa || APP.name;
export const desaJenis = () => (state.config.namaDesa ? state.config.jenisDesa || 'Desa' : '');
export const jenisLabel = () => state.config.jenisDesa || 'Desa';
export const instansi = () => {
  const w = state.config.wilayah || {};
  return [`${desaJenis()} ${desaName()}`.trim(), w.kecamatan && `Kec. ${w.kecamatan}`, w.kabupaten, w.provinsi].filter(Boolean).join(', ');
};
export const appLink = (hash = '') => location.origin + location.pathname + (hash ? '#' + hash : '');
export const emptyBox = (t) => `<div class="empty">${esc(t)}</div>`;
export const loadingBox = () => '<div class="skeleton" aria-busy="true" aria-label="Memuat data"><div class="sk-row"><div class="sk tall"></div><div class="sk tall"></div><div class="sk tall"></div><div class="sk tall"></div></div><div class="sk w60"></div><div class="sk"></div><div class="sk"></div><div class="sk w40"></div><div class="sk"></div></div>';
export const superEmail = () => (state.authCfg.superEmail || APP.superAdminEmail).toLowerCase();

// Ubah dokumen config/app (updateDoc agar kunci bertingkat bisa dikosongkan; buat bila belum ada)
export async function cfgUpdate(obj) {
  try { await F.updateDoc(C('config/app'), obj); } catch (e) { if (/no document|not-found|NOT_FOUND/i.test(e.code || e.message)) await F.setDoc(C('config/app'), obj, { merge: true }); else throw e; }
}

export async function batchWrite(ops, onProgress) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = F.writeBatch(F.db);
    ops.slice(i, i + 400).forEach(([t, ref, data, opt]) => { if (t === 'delete') b.delete(ref); else if (t === 'update') b.update(ref, data); else b.set(ref, data, opt || {}); });
    await b.commit();
    onProgress?.(Math.min(i + 400, ops.length), ops.length);
  }
}

// ---------------------------------------------------------------- hak akses
export const PERMS = [
  ['warga', 'Lihat data warga', 'Data Warga'],
  ['wargaEdit', 'Tambah & ubah data warga', 'Data Warga'],
  ['wargaDelete', 'Hapus data warga', 'Data Warga'],
  ['import', 'Import dari Excel', 'Data Warga'],
  ['export', 'Ekspor PDF / Excel & laporan', 'Data Warga'],
  ['dusun', 'Kelola dusun & kepala dusun', 'Data Warga'],
  ['master', 'Kelola Data Master dropdown', 'Data Warga'],
  ['informasi', 'Tulis & terbitkan papan informasi', 'Publikasi'],
  ['broadcast', 'Kirim pesan WhatsApp ke warga', 'Publikasi'],
  ['instagram', 'Kelola highlight Instagram', 'Publikasi'],
  ['profil', 'Kelola halaman Profil Gampong', 'Publikasi'],
  ['kegiatan', 'Kelola kegiatan rutin', 'Publikasi'],
  ['pengaturan', 'Ubah pengaturan desa, jadwal sholat & running text', 'Sistem'],
  ['kelolaKadus', 'Buat & kelola akun login Kepala Dusun', 'Sistem'],
  ['latar', 'Ubah latar belakang website (foto / video dari URL)', 'Sistem'],
  ['lembaga', 'Kelola Lembaga Gampong (pengurus, anggota, murid/santri, berita, galeri)', 'Kelembagaan'],
  ['dokumen', 'Kelola Dokumen Publik (RPJMG, APBG, Reusam, dll.)', 'Kelembagaan'],
];
// Hak akses yang boleh diberikan kepada akun Kepala Dusun (hanya untuk dusunnya sendiri)
export const KADUS_PERMS = [
  ['warga', 'Lihat data warga dusunnya'],
  ['wargaEdit', 'Tambah & ubah warga dusunnya'],
  ['wargaDelete', 'Hapus warga dusunnya'],
  ['export', 'Ekspor PDF / Excel data dusunnya'],
  ['broadcast', 'Kirim WhatsApp ke warga dusunnya'],
];
export const KADUS_DEFAULT = ['warga', 'wargaEdit', 'export', 'broadcast'];
export const PERM_PRESETS = {
  operator: { label: 'Operator Data', perms: ['warga', 'wargaEdit', 'import', 'export', 'dusun', 'master'] },
  humas: { label: 'Humas / Informasi', perms: ['informasi', 'broadcast', 'instagram', 'profil', 'kegiatan'] },
  viewer: { label: 'Hanya Lihat', perms: ['warga', 'export'] },
  penuh: { label: 'Admin Penuh', perms: PERMS.map((p) => p[0]) },
};
export const isSuper = () => state.role === 'superadmin';
export const isKadus = () => state.role === 'kadus';
// Admin bercentang hijau (Perangkat Gampong) — diberikan Super Admin; membuka menu Admin › Manajemen Akun
export const hasGreen = () => state.role === 'admin' && (state.profile?.badges || []).some((b) => (typeof b === 'string' ? b : b?.id) === 'verified-green');
export const myDusun = () => (isKadus() ? state.profile?.dusun || '' : '');
export const can = (p) => {
  if (isSuper()) return true;
  if (isKadus() && !KADUS_PERMS.some(([k]) => k === p)) return false;
  return !!state.perms?.[p];
};
export const ROLE_LABEL = { superadmin: 'Super Admin', admin: 'Admin', kadus: 'Kepala Dusun' };
// Pengelola lembaga tertentu (diangkat Super Admin) — kategori Pemerintahan tidak bisa didelegasikan
export const LEMBAGA_DELEGASI = ['adat', 'lkg', 'ekonomi', 'pendidikan'];
export const myLembagaIds = () => (state.role === 'admin' && Array.isArray(state.profile?.lembagaIds) ? state.profile.lembagaIds : []);
export const isPengelola = () => myLembagaIds().length > 0;
export const canLembaga = (id, kategori) => can('lembaga') || (myLembagaIds().includes(id) && (!kategori || LEMBAGA_DELEGASI.includes(kategori)));
// Avatar: foto profil atau inisial nama
export function avatar(u, size = '') {
  const nama = u?.nama || u?.email || '?';
  return u?.foto ? `<span class="avatar ${size}"><img src="${esc(u.foto)}" alt=""></span>` : `<span class="avatar ${size}">${esc(String(nama).trim().slice(0, 1).toUpperCase())}</span>`;
}
// Label penulis untuk tanda "Diterbitkan oleh"
// Nama penerbit tanpa pengulangan: "Super Admin Saiful", bukan "Super Admin Super Admin"
export function penulisLabel(p) {
  if (!p) return '';
  const role = ROLE_LABEL[p.role] || '';
  const nama = String(p.nama || '').trim();
  if (!nama || nama.includes('@')) return role || nama;
  if (!role) return nama;
  const n = norm(nama), r = norm(role);
  return n === r || n.startsWith(r) || n.endsWith(r) || r.includes(n) ? nama : `${role} ${nama}`;
}
export const penulisNow = () => clean({ uid: state.user?.uid, nama: state.profile?.nama || state.user?.email || '', role: state.role, jabatan: state.profile?.jabatan || (isKadus() ? `Kepala Dusun ${myDusun()}` : ''), foto: state.profile?.foto || '', badges: Array.isArray(state.profile?.badges) && state.profile.badges.length ? state.profile.badges.slice(0, 12) : undefined });

// ---------------------------------------------------------------- audit log
const SESSION_ID = Math.random().toString(36).slice(2, 10);
function deviceInfo() {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Lainnya';
  const br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Lainnya';
  const pwa = matchMedia('(display-mode: standalone)').matches ? ' (aplikasi PWA)' : '';
  return `${br} • ${os}${pwa} • ${screen.width}×${screen.height}`;
}
export const AUDIT_CATS = {
  auth: 'Login & Akun', warga: 'Data Warga', import: 'Import', export: 'Ekspor', dusun: 'Dusun', master: 'Data Master',
  informasi: 'Informasi', broadcast: 'WhatsApp', instagram: 'Instagram', profil: 'Profil Gampong', kegiatan: 'Kegiatan Rutin',
  pengaturan: 'Pengaturan', latar: 'Latar Belakang', admin: 'Manajemen Akun', lembaga: 'Lembaga Gampong', dokumen: 'Dokumen Publik', tampilan: 'Tampilan & Tema', cadangan: 'Cadangan & Pemulihan', akses: 'Akses Data', sistem: 'Sistem & Widget', chat: 'Chat Staf',
};
// Catat aktivitas. cat = kategori; action = kode singkat; label = kalimat yang mudah dibaca
export function logAudit(cat, action, label, extra = {}) {
  if (!state.user || !state.isAdmin) return Promise.resolve();
  const data = clean({
    at: F.serverTimestamp(), uid: state.user.uid, email: state.user.email || '', nama: state.profile?.nama || '',
    role: state.role || '', cat, action, label: String(label || action).slice(0, 300),
    target: extra.target ? String(extra.target).slice(0, 200) : undefined,
    targetId: extra.targetId, count: extra.count,
    changes: extra.changes && Object.keys(extra.changes).length ? extra.changes : undefined,
    detail: extra.detail ? String(extra.detail).slice(0, cat === 'chat' ? 2600 : 1000) : undefined,
    // v2.9 riwayat chat: penerima pesan (agar Super Admin dapat membaca percakapan utuh di Audit Log)
    to: cat === 'chat' && extra.to ? String(extra.to).slice(0, 128) : undefined,
    toNama: cat === 'chat' && extra.toNama ? String(extra.toNama).slice(0, 160) : undefined,
    device: deviceInfo(), session: SESSION_ID, path: location.hash.slice(0, 120),
  });
  return F.addDoc(F.collection(F.db, 'audit'), data).catch((e) => console.warn('audit', e));
}
// Hitung perbedaan field (untuk audit perubahan data)
export function diff(oldObj = {}, newObj = {}, labelOf = (k) => k) {
  const out = {};
  const keys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  for (const k of keys) {
    if (['createdAt', 'updatedAt', 'id', 'gambar', 'foto', 'logo'].includes(k) || k.endsWith('Id')) continue;
    if (!(k in newObj)) continue;
    const a = oldObj?.[k] ?? '', b = newObj?.[k] ?? '';
    if (typeof a === 'object' || typeof b === 'object') { if (JSON.stringify(a) !== JSON.stringify(b)) out[labelOf(k)] = ['(diubah)', '(diubah)']; continue; }
    if (String(a) !== String(b)) out[labelOf(k)] = [String(a).slice(0, 120), String(b).slice(0, 120)];
  }
  return out;
}

export function loginFailed() {
  const n = Number(localStorage.getItem('dd:fails') || 0) + 1;
  localStorage.setItem('dd:fails', String(n));
  if (n % 5 === 0) localStorage.setItem('dd:lockUntil', String(Date.now() + 5 * 60e3)); // jeda 5 menit tiap 5x gagal
}

// ---------------------------------------------------------------- konfirmasi password
export function requirePassword(reason = 'Untuk melanjutkan, masukkan password Anda.') {
  return new Promise((resolve) => {
    let done = false;
    const m = modal({
      title: 'Konfirmasi Password', size: 'sm', guard: false,
      body: `<form id="rp-f"><p class="muted small">${esc(reason)}</p>
        <label class="field"><span>Password akun ${esc(state.user?.email || '')}</span><input type="password" id="rp-pw" autocomplete="current-password" required></label>
        <p class="err" id="rp-err"></p></form>`,
      footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="rp-ok">Konfirmasi</button>',
      onClose: () => { if (!done) resolve(false); },
    });
    const inp = m.el.querySelector('#rp-pw'); inp.focus();
    const go = async (e) => {
      e?.preventDefault();
      const btn = m.el.querySelector('#rp-ok'); btn.disabled = true;
      try {
        await F.reauthenticateWithCredential(F.auth.currentUser, F.EmailAuthProvider.credential(F.auth.currentUser.email, inp.value));
        done = true; m.close(); resolve(true);
      } catch (err) {
        m.el.querySelector('#rp-err').textContent = authErrorMessage(err);
        logAudit('auth', 'password_konfirmasi_gagal', 'Konfirmasi password gagal', { detail: reason });
        btn.disabled = false; inp.select();
      }
    };
    m.el.querySelector('#rp-ok').onclick = go;
    m.el.querySelector('#rp-f').onsubmit = go;
  });
}

// Setiap penghapusan data: konfirmasi + wajib password
export async function confirmDelete(message, reason) {
  if (!await confirmDialog(message, { danger: true, okText: 'Hapus', title: 'Hapus data' })) return false;
  return requirePassword(reason || `Konfirmasi penghapusan: ${String(message).replace(/\?$/, '')}.`);
}

// ---------------------------------------------------------------- statistik & insight
export const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
export const pctStr = (a, b) => String(pct(a, b)).replace('.', ',');
export function insightsFromStats(s) {
  const out = [];
  if (!s || !s.penduduk) return out;
  if (s.rasioJK) out.push({ icon: 'users', text: `Rasio jenis kelamin ${s.rasioJK} — ada ${s.rasioJK} laki-laki untuk setiap 100 perempuan.` });
  if (s.produktif != null) out.push({ icon: 'chart', text: `${pctStr(s.produktif, s.penduduk)}% penduduk berada di usia produktif (15–64 tahun).` });
  if (s.rasioKetergantungan != null) out.push({ icon: 'bulb', text: `Rasio ketergantungan ${s.rasioKetergantungan}: setiap 100 penduduk usia produktif menanggung ${s.rasioKetergantungan} penduduk usia anak & lansia.` });
  if (s.lansia) out.push({ icon: 'users', text: `${fmtNum(s.lansia)} lansia (60+) atau ${pctStr(s.lansia, s.penduduk)}% penduduk — perlu perhatian layanan kesehatan & posyandu lansia.` });
  if (s.balita) out.push({ icon: 'users', text: `${fmtNum(s.balita)} balita (0–5 tahun) — sasaran posyandu & pencegahan stunting.` });
  if (s.rataKeluarga) out.push({ icon: 'home', text: `Rata-rata ${String(s.rataKeluarga).replace('.', ',')} jiwa per Kepala Keluarga.` });
  if (s.dusunTerbesar) out.push({ icon: 'map', text: `Dusun dengan penduduk terbanyak: ${s.dusunTerbesar}.` });
  return out;
}
