// =============================================================
//  DigiDes — aplikasi utama (SPA, hash routing)
//  © Serenity Creativa 2026
// =============================================================
import { APP, IG_GRAPH } from './config.js';
import * as F from './firebase.js';
import {
  FIELDS, GROUPS, DEFAULT_MASTER, MASTER_EXTRA_LABELS, AGE_GROUPS, ageGroup,
  mapHeaders, ageFromDate, parseAlamat, canonical, slugify, normKey,
} from './fields.js';
import {
  esc, $, $$, norm, debounce, todayISO, toDate, fmtDate, fmtRp, fmtNum, waNumber, waLink, waShareLink,
  normalizePhone, waFormat, toast, modal, confirmDialog, promptDialog, attachAutocomplete,
  downloadBlob, copyText, compressImage, authErrorMessage,
} from './ui.js';
import { bindWilayahChain } from './wilayah.js';
import { exportExcel, exportPdf, getXLSX } from './exporter.js';

// ---------------------------------------------------------------- ikon
const I = {
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
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

// ---------------------------------------------------------------- state
const state = {
  route: null, view: '', authReady: false, user: null, isAdmin: false,
  config: {}, stats: {}, warga: [], wargaReady: false, dusun: [], master: {}, masterReady: false,
  info: [], ig: [], adminUnsubs: [], infoUnsub: null,
  filters: { q: '', dusun: '', field: '', value: '', jk: '', page: 1, per: 25, sort: 'nama' },
  selected: new Set(), deferredPrompt: null, swReg: null,
};
const root = document.getElementById('app');
const C = (p) => F.doc(F.db, ...p.split('/'));
const desaName = () => state.config.namaDesa || 'Desa Digital';
const desaJenis = () => state.config.jenisDesa || 'Desa';
const instansi = () => {
  const w = state.config.wilayah || {};
  return [`${desaJenis()} ${desaName()}`, w.kecamatan && `Kec. ${w.kecamatan}`, w.kabupaten, w.provinsi].filter(Boolean).join(', ');
};
const appLink = (hash = '') => location.origin + location.pathname + (hash ? '#' + hash : '');
const clean = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) if (v !== undefined) r[k] = v; return r; };

// ---------------------------------------------------------------- field helpers
function customFields() {
  return Object.values(state.master).filter((m) => m.custom)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((m) => ({ key: m.key, label: m.label, group: 'tambahan', type: 'select', master: m.key, aliases: [normKey(m.label)] }));
}
const allFields = () => [...FIELDS, ...customFields()];
const fieldByKey = (k) => allFields().find((f) => f.key === k);
const masterItems = (k) => state.master[k]?.items || DEFAULT_MASTER[k] || [];
const masterLabel = (k) => state.master[k]?.label || fieldByKey(k)?.label || MASTER_EXTRA_LABELS[k] || k;
function categoryFields() {
  return [
    { key: 'dusun', label: 'Dusun' },
    { key: 'kelompokUmur', label: 'Kelompok Umur' },
    ...allFields().filter((f) => f.type === 'select'),
  ];
}
function valueOf(w, key) {
  if (key === 'kelompokUmur') return ageGroup(w.umur);
  return w[key] ?? '';
}
function displayValue(w, key) {
  const v = valueOf(w, key);
  if (key === 'pendapatan') return fmtRp(v);
  if (key === 'tglLahir' || key === 'tglPeristiwa') return v ? fmtDate(v) : '';
  return v;
}
const isAktif = (w) => !['kematian', 'pindah keluar'].includes(norm(w.peristiwa));

// ---------------------------------------------------------------- boot
function boot() {
  F.onSnapshot(C('config/app'), (s) => { state.config = s.data() || {}; applyBranding(); softRerender(['public', 'dash', 'shell']); }, (e) => console.warn('config', e));
  F.onSnapshot(C('config/stats'), (s) => { state.stats = s.data() || {}; softRerender(['public']); }, () => {});
  F.onSnapshot(F.collection(F.db, 'instagram'), (s) => {
    state.ig = s.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
    softRerender(['public', 'instagram']);
  }, () => {});
  subscribeInfo(false);

  F.onAuthStateChanged(F.auth, async (user) => {
    state.user = user;
    if (user) {
      const ok = await ensureAdmin(user);
      state.isAdmin = ok;
      if (ok) startAdmin();
      else { await F.signOut(F.auth); toast('Akun ini tidak memiliki akses admin.', 'error'); }
    } else {
      state.isAdmin = false; stopAdmin();
    }
    state.authReady = true;
    render();
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.deferredPrompt = e; $$('[data-install]').forEach((b) => b.hidden = false); });
  window.addEventListener('appinstalled', () => { state.deferredPrompt = null; $$('[data-install]').forEach((b) => b.hidden = true); toast('Aplikasi berhasil dipasang', 'success'); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-install]');
    if (b && state.deferredPrompt) { state.deferredPrompt.prompt(); state.deferredPrompt.userChoice.finally(() => { state.deferredPrompt = null; }); }
  });
  render();
  registerSW();
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    state.swReg = reg;
    const notify = (w) => toast(`Versi baru tersedia.`, 'info', { duration: 15000, action: { label: 'Muat ulang', onClick: () => w.postMessage('skipWaiting') } });
    if (reg.waiting && navigator.serviceWorker.controller) notify(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) notify(w); });
    });
  }).catch((e) => console.warn('SW', e));
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}

function applyBranding() {
  document.title = state.route?.parts[0] === 'admin' ? `Admin — ${desaName()} | ${APP.name}` : `${desaJenis()} ${desaName()} | ${APP.name}`;
}

function subscribeInfo(all) {
  state.infoUnsub?.();
  const q = all ? F.collection(F.db, 'informasi') : F.query(F.collection(F.db, 'informasi'), F.where('published', '==', true));
  state.infoUnsub = F.onSnapshot(q, (s) => {
    state.info = s.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
    softRerender(['public', 'informasi', 'dash', 'broadcast']);
  }, (e) => console.warn('info', e));
}

async function ensureAdmin(user) {
  try {
    await F.setDoc(C(`admins/${user.uid}`), { email: user.email, lastLogin: F.serverTimestamp() }, { merge: true });
  } catch (e) { /* bukan admin bootstrap; cek dokumen */ }
  try {
    const s = await F.getDoc(C(`admins/${user.uid}`));
    if (!s.exists()) return false;
  } catch { return false; }
  // Sinkronkan email admin (setelah ganti email terverifikasi)
  try {
    const cfg = (await F.getDoc(C('config/app'))).data() || {};
    if (cfg.adminEmail !== user.email || cfg.pendingEmail) {
      await F.setDoc(C('config/app'), { adminEmail: user.email, pendingEmail: F.deleteField() }, { merge: true });
    }
  } catch (e) { console.warn(e); }
  return true;
}

function startAdmin() {
  stopAdmin();
  const u = state.adminUnsubs;
  u.push(F.onSnapshot(F.collection(F.db, 'warga'), (s) => {
    state.warga = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    state.wargaReady = true;
    softRerender(['dash', 'warga', 'dusun', 'laporan', 'broadcast']);
    updatePublicStats();
  }, (e) => toast('Gagal memuat data warga: ' + e.message, 'error')));
  u.push(F.onSnapshot(F.collection(F.db, 'dusun'), (s) => {
    state.dusun = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.nama).localeCompare(String(b.nama)));
    softRerender(['dash', 'warga', 'dusun', 'laporan', 'broadcast']);
    updatePublicStats();
  }));
  let seeded = false;
  u.push(F.onSnapshot(F.collection(F.db, 'master'), (s) => {
    const m = {}; s.docs.forEach((d) => { m[d.id] = { key: d.id, ...d.data() }; });
    state.master = m; state.masterReady = true;
    if (!seeded && !s.metadata.fromCache) { seeded = true; seedMaster(m); }
    softRerender(['master']);
  }));
  subscribeInfo(true);
  setTimeout(() => autoSyncInstagram(), 4000);
}
function stopAdmin() {
  state.adminUnsubs.forEach((f) => f()); state.adminUnsubs = [];
  state.warga = []; state.dusun = []; state.master = {}; state.wargaReady = false; state.masterReady = false;
  state.selected.clear();
  subscribeInfo(false);
}

async function seedMaster(existing) {
  const keys = [...FIELDS.filter((f) => f.type === 'select').map((f) => f.key), 'kategoriInfo'];
  const missing = keys.filter((k) => !existing[k]);
  if (!missing.length) return;
  const b = F.writeBatch(F.db);
  missing.forEach((k, i) => {
    const f = FIELDS.find((x) => x.key === k);
    b.set(C(`master/${k}`), { label: f?.label || MASTER_EXTRA_LABELS[k] || k, items: DEFAULT_MASTER[k] || [], builtin: true, group: f?.group || 'lainnya', order: i });
  });
  try { await b.commit(); } catch (e) { console.warn('seed master', e); }
}

const updatePublicStats = debounce(async () => {
  if (!state.isAdmin || !state.wargaReady) return;
  const aktif = state.warga.filter(isAktif);
  const s = {
    penduduk: aktif.length,
    kk: aktif.filter((w) => norm(w.shdk) === 'kepala keluarga').length,
    laki: aktif.filter((w) => norm(w.jk).startsWith('l')).length,
    perempuan: aktif.filter((w) => norm(w.jk).startsWith('p')).length,
    dusun: state.dusun.length,
  };
  const prev = state.stats || {};
  if (['penduduk', 'kk', 'laki', 'perempuan', 'dusun'].every((k) => prev[k] === s[k])) return;
  try { await F.setDoc(C('config/stats'), { ...s, updatedAt: F.serverTimestamp() }); } catch (e) { console.warn(e); }
}, 3000);

// ---------------------------------------------------------------- router
function parseRoute() {
  const hash = location.hash.slice(1) || '/';
  const [path, qs] = hash.split('?');
  return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs || '') };
}
function softRerender(tags) {
  if (!state.view || !tags.includes(state.view)) {
    if (tags.includes('shell') && root.dataset.shell === 'admin') updateShellBrand();
    return;
  }
  if (document.activeElement && root.contains(document.activeElement) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && state.view !== 'public') return;
  if (state._rerenderLock) return;
  render(true);
}
function render(soft = false) {
  const r = parseRoute(); state.route = r;
  document.body.classList.remove('nav-open');
  applyBranding();
  const p0 = r.parts[0];
  if (p0 === 'admin') {
    if (!state.authReady) { root.dataset.shell = ''; root.innerHTML = splash(); return; }
    if (!state.isAdmin) { location.replace('#/login'); return; }
    return renderAdmin(r, soft);
  }
  if (p0 === 'login') {
    if (state.isAdmin) { location.replace('#/admin'); return; }
    return renderLogin();
  }
  return renderPublic(r, soft);
}
const splash = () => `<div class="splash"><div class="logo-mark big">${logoImg()}</div><div class="spinner"></div></div>`;
const logoImg = () => state.config.logo ? `<img src="${esc(state.config.logo)}" alt="">` : `<img src="icons/icon-192.png" alt="">`;

// ================================================================ PUBLIK
function renderPublic(r, soft) {
  state.view = 'public';
  const y = soft ? window.scrollY : 0;
  let content;
  if (r.parts[0] === 'informasi' && r.parts[1]) content = pubInfoDetail(r.parts[1]);
  else if (r.parts[0] === 'informasi') content = pubInfoList(r.query.get('k') || '');
  else if (r.parts[0] === 'highlight') content = pubHighlight(true);
  else content = pubHome();
  const active = r.parts[0] || '';
  root.dataset.shell = 'public';
  root.innerHTML = `
  <header class="pub-header">
    <div class="pub-header-inner">
      <a class="brand" href="#/"><span class="logo-mark">${logoImg()}</span><span class="brand-text"><b>${esc(desaJenis())} ${esc(desaName())}</b><small>${esc(state.config.tagline || 'Sistem Informasi Desa Digital')}</small></span></a>
      <nav class="pub-nav">
        <a href="#/" class="${active === '' ? 'active' : ''}">Beranda</a>
        <a href="#/highlight" class="${active === 'highlight' ? 'active' : ''}">Highlight</a>
        <a href="#/informasi" class="${active === 'informasi' ? 'active' : ''}">Informasi</a>
        <a href="${state.isAdmin ? '#/admin' : '#/login'}" class="btn btn-sm btn-primary">${ic('lock')} ${state.isAdmin ? 'Dasbor' : 'Admin'}</a>
      </nav>
    </div>
  </header>
  <main class="pub-main">${content}</main>
  ${pubFooter()}`;
  bindPublic();
  if (soft) window.scrollTo(0, y); else window.scrollTo(0, 0);
}

function pubFooter() {
  const c = state.config;
  return `<footer class="pub-footer"><div class="pub-footer-inner">
    <div><b>${esc(desaJenis())} ${esc(desaName())}</b><p class="muted">${esc([c.alamatKantor, instansi()].filter(Boolean).join(' — '))}</p>
      ${c.telepon ? `<p><a href="${esc(waLink(c.telepon))}" target="_blank" rel="noopener">${ic('wa')} ${esc(c.telepon)}</a></p>` : ''}
      ${c.emailDesa ? `<p class="muted">${esc(c.emailDesa)}</p>` : ''}</div>
    <div class="footer-right"><button class="btn btn-sm btn-ghost" data-install hidden>${ic('phone')} Pasang Aplikasi</button>
      <p class="muted small">${APP.name} v${APP.version} • ${APP.copyright}</p></div>
  </div></footer>`;
}

function pubHome() {
  const s = state.stats || {};
  const now = todayISO();
  const agenda = state.info.filter((i) => i.tanggalAcara && i.tanggalAcara >= now).sort((a, b) => a.tanggalAcara.localeCompare(b.tanggalAcara)).slice(0, 4);
  const latest = state.info.slice(0, 6);
  const w = state.config.wilayah || {};
  return `
  <section class="hero">
    <div class="hero-text">
      <span class="eyebrow">${esc([w.kecamatan && 'Kec. ' + w.kecamatan, w.kabupaten, w.provinsi].filter(Boolean).join(' · ') || 'Portal Resmi')}</span>
      <h1>Selamat datang di ${esc(desaJenis())} ${esc(desaName())}</h1>
      <p>${esc(state.config.deskripsi || 'Informasi kegiatan, pengumuman, dan layanan desa dalam satu genggaman. Pasang aplikasi ini di ponsel Anda untuk akses cepat.')}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#/informasi">${ic('mega')} Papan Informasi</a>
        ${state.config.igUsername ? `<a class="btn btn-ghost" href="https://instagram.com/${esc(state.config.igUsername)}" target="_blank" rel="noopener">${ic('ig')} @${esc(state.config.igUsername)}</a>` : ''}
        <button class="btn btn-ghost" data-install hidden>${ic('phone')} Pasang Aplikasi</button>
      </div>
    </div>
    <div class="hero-stats">
      ${[['Penduduk', s.penduduk], ['Kepala Keluarga', s.kk], ['Laki-laki', s.laki], ['Perempuan', s.perempuan], ['Dusun', s.dusun]].map(([l, v]) => `<div class="hstat"><b>${v != null ? fmtNum(v) : '–'}</b><span>${l}</span></div>`).join('')}
    </div>
  </section>
  ${pubHighlight(false)}
  ${agenda.length ? `<section class="section"><div class="section-head"><h2>${ic('cal')} Agenda Terdekat</h2></div>
    <div class="agenda">${agenda.map((a) => { const d = toDate(a.tanggalAcara); return `<a class="agenda-item" href="#/informasi/${a.id}"><div class="agenda-date"><b>${d.getDate()}</b><span>${d.toLocaleString('id-ID', { month: 'short' })}</span></div><div><h4>${esc(a.judul)}</h4><p class="muted small">${esc([a.waktu, a.lokasi].filter(Boolean).join(' • '))}</p></div></a>`; }).join('')}</div></section>` : ''}
  <section class="section"><div class="section-head"><h2>${ic('mega')} Papan Informasi</h2><a href="#/informasi" class="link">Lihat semua →</a></div>
    ${latest.length ? `<div class="cards">${latest.map(infoCard).join('')}</div>` : emptyBox('Belum ada informasi yang diterbitkan.')}
  </section>`;
}

function igPostCard(p) {
  const img = p.mediaType === 'VIDEO' ? (p.thumbnail || p.mediaUrl) : (p.mediaUrl || p.thumbnail);
  return `<a class="ig-card" href="${esc(p.permalink || '#')}" target="_blank" rel="noopener" title="Buka di Instagram">
    ${img ? `<img loading="lazy" src="${esc(img)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ig-ph',textContent:'Lihat di Instagram'}))">` : '<div class="ig-ph">Lihat di Instagram</div>'}
    ${p.mediaType === 'VIDEO' ? '<span class="ig-badge">▶ Video</span>' : p.mediaType === 'CAROUSEL_ALBUM' ? '<span class="ig-badge">▣ Album</span>' : ''}
    <div class="ig-cap"><p>${esc((p.caption || '').slice(0, 140))}${(p.caption || '').length > 140 ? '…' : ''}</p><small>${esc(fmtDate(p.timestamp))}</small></div>
  </a>`;
}
function pubHighlight(full) {
  const posts = state.ig.filter((p) => !p.hidden);
  const list = full ? posts : posts.slice(0, 8);
  const head = `<div class="section-head"><h2>${ic('ig')} Highlight Instagram</h2>${!full && posts.length > 8 ? '<a href="#/highlight" class="link">Lihat semua →</a>' : ''}${state.config.igUsername ? `<a class="link" href="https://instagram.com/${esc(state.config.igUsername)}" target="_blank" rel="noopener">@${esc(state.config.igUsername)}</a>` : ''}</div>`;
  if (!posts.length) return full ? `<section class="section">${head}${emptyBox('Belum ada postingan Instagram yang ditampilkan.')}</section>` : '';
  return `<section class="section">${head}<div class="ig-grid">${list.map(igPostCard).join('')}</div></section>`;
}

function infoCard(i) {
  return `<article class="info-card">
    ${i.gambar ? `<a href="#/informasi/${i.id}" class="info-img"><img loading="lazy" src="${esc(i.gambar)}" alt=""></a>` : ''}
    <div class="info-body">
      <div class="info-meta"><span class="badge">${esc(i.kategori || 'Informasi')}</span>${i.pinned ? `<span class="badge badge-warn">${ic('pin')} Disematkan</span>` : ''}</div>
      <h3><a href="#/informasi/${i.id}">${esc(i.judul)}</a></h3>
      <p class="muted small">${esc(fmtDate(i.createdAt))}${i.tanggalAcara ? ` • Acara: ${esc(fmtDate(i.tanggalAcara))}` : ''}</p>
      <p class="excerpt">${esc(String(i.isi || '').replace(/[*_~]/g, '').slice(0, 160))}${String(i.isi || '').length > 160 ? '…' : ''}</p>
      <div class="info-actions"><a class="btn btn-sm btn-ghost" href="#/informasi/${i.id}">Baca</a>
      <a class="btn btn-sm btn-wa" href="${esc(waShareLink(infoMessage(i)))}" target="_blank" rel="noopener">${ic('wa')} Bagikan</a></div>
    </div></article>`;
}
function infoMessage(i, withLink = true) {
  const parts = [`*${String(i.kategori || 'INFORMASI').toUpperCase()} — ${desaJenis().toUpperCase()} ${desaName().toUpperCase()}*`, '', `*${i.judul}*`];
  if (i.tanggalAcara) parts.push(`📅 ${fmtDate(i.tanggalAcara)}${i.waktu ? ' • ' + i.waktu : ''}`);
  if (i.lokasi) parts.push(`📍 ${i.lokasi}`);
  parts.push('', i.isi || '');
  if (withLink && i.id) parts.push('', `Selengkapnya: ${appLink('/informasi/' + i.id)}`);
  if (state.config.waFooter) parts.push('', state.config.waFooter);
  return parts.join('\n');
}
function pubInfoList(kat) {
  const kats = [...new Set(state.info.map((i) => i.kategori).filter(Boolean))];
  const list = kat ? state.info.filter((i) => i.kategori === kat) : state.info;
  return `<section class="section"><div class="section-head"><h2>${ic('mega')} Papan Informasi</h2></div>
    <div class="chips"><a class="chip ${!kat ? 'active' : ''}" href="#/informasi">Semua</a>${kats.map((k) => `<a class="chip ${k === kat ? 'active' : ''}" href="#/informasi?k=${encodeURIComponent(k)}">${esc(k)}</a>`).join('')}</div>
    ${list.length ? `<div class="cards">${list.map(infoCard).join('')}</div>` : emptyBox('Belum ada informasi.')}
  </section>`;
}
function pubInfoDetail(id) {
  const i = state.info.find((x) => x.id === id);
  if (!i) {
    // Mungkin belum termuat; ambil langsung
    F.getDoc(C(`informasi/${id}`)).then((s) => {
      if (s.exists() && !state.info.find((x) => x.id === id)) { state.info.push({ id, ...s.data() }); render(true); }
    }).catch(() => {});
    return `<section class="section narrow">${emptyBox('Memuat informasi… Jika tidak muncul, informasi mungkin sudah dihapus.')}</section>`;
  }
  return `<article class="section narrow article">
    <a href="#/informasi" class="link">← Kembali</a>
    <div class="info-meta"><span class="badge">${esc(i.kategori || 'Informasi')}</span></div>
    <h1>${esc(i.judul)}</h1>
    <p class="muted">Diterbitkan ${esc(fmtDate(i.createdAt, true))}</p>
    ${(i.tanggalAcara || i.lokasi) ? `<div class="event-box">${i.tanggalAcara ? `<span>${ic('cal')} ${esc(fmtDate(i.tanggalAcara))}${i.waktu ? ' • ' + esc(i.waktu) : ''}</span>` : ''}${i.lokasi ? `<span>${ic('loc')} ${esc(i.lokasi)}</span>` : ''}</div>` : ''}
    ${i.gambar ? `<img class="article-img" src="${esc(i.gambar)}" alt="">` : ''}
    <div class="article-body">${waFormat(i.isi)}</div>
    <div class="info-actions">
      <a class="btn btn-wa" href="${esc(waShareLink(infoMessage(i)))}" target="_blank" rel="noopener">${ic('wa')} Bagikan ke WhatsApp</a>
      <button class="btn btn-ghost" data-copy-link="${esc(appLink('/informasi/' + i.id))}">${ic('copy')} Salin tautan</button>
    </div>
  </article>`;
}
function bindPublic() {
  $$('[data-copy-link]').forEach((b) => b.onclick = () => copyText(b.dataset.copyLink));
  if (state.deferredPrompt) $$('[data-install]').forEach((b) => b.hidden = false);
}
const emptyBox = (t) => `<div class="empty">${esc(t)}</div>`;

// ================================================================ LOGIN
function maskEmail(e) {
  const [u, d] = String(e).split('@'); if (!d) return e;
  return u.slice(0, 2) + '•'.repeat(Math.max(3, u.length - 2)) + '@' + d;
}
function renderLogin() {
  state.view = 'login';
  root.dataset.shell = 'login';
  const email = state.config.adminEmail || APP.defaultAdminEmail;
  root.innerHTML = `<div class="login-page">
    <form class="login-card" id="login-form">
      <div class="logo-mark big">${logoImg()}</div>
      <h1>Masuk Admin</h1>
      <p class="muted">${esc(desaJenis())} ${esc(desaName())}<br><small>${esc(maskEmail(email))}</small></p>
      <label class="field"><span>Password</span>
        <div class="input-group"><input type="password" id="pw" autocomplete="current-password" required autofocus placeholder="Masukkan password admin">
        <button type="button" class="btn btn-ghost" id="pw-toggle" aria-label="Tampilkan password">${ic('eye')}</button></div></label>
      <button class="btn btn-primary btn-block" id="login-btn">${ic('lock')} Masuk</button>
      <p class="err" id="login-err" role="alert"></p>
      <div class="login-links"><a href="#" id="forgot">Lupa password?</a><a href="#/">← Ke beranda</a></div>
      <p class="muted small center">${APP.name} v${APP.version} • ${APP.copyright}</p>
    </form></div>`;
  $('#pw-toggle').onclick = () => { const p = $('#pw'); p.type = p.type === 'password' ? 'text' : 'password'; };
  $('#forgot').onclick = async (e) => {
    e.preventDefault();
    try { await F.sendPasswordResetEmail(F.auth, email); toast(`Tautan reset password dikirim ke ${maskEmail(email)}`, 'success'); }
    catch (err) { toast(authErrorMessage(err), 'error'); }
  };
  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    const pw = $('#pw').value; const btn = $('#login-btn'); const errEl = $('#login-err');
    btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span> Memeriksa…'; errEl.textContent = '';
    const emails = [...new Set([state.config.adminEmail, state.config.pendingEmail, APP.defaultAdminEmail].filter(Boolean))];
    let lastErr;
    for (const em of emails) {
      try { await F.signInWithEmailAndPassword(F.auth, em, pw); lastErr = null; break; }
      catch (err) { lastErr = err; if (!['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials', 'auth/user-disabled'].includes(err.code)) break; }
    }
    if (lastErr) { errEl.textContent = authErrorMessage(lastErr); btn.disabled = false; btn.innerHTML = `${ic('lock')} Masuk`; return; }
    location.hash = '#/admin';
  };
}

// ================================================================ ADMIN SHELL
const NAV = [
  ['dashboard', 'Dasbor', 'grid'], ['warga', 'Data Warga', 'users'], ['import', 'Import Excel', 'upload'],
  ['dusun', 'Dusun & Kadus', 'map'], ['master', 'Data Master', 'db'], ['laporan', 'Laporan & Ekspor', 'chart'],
  ['informasi', 'Papan Informasi', 'mega'], ['broadcast', 'Kirim WhatsApp', 'wa'], ['instagram', 'Instagram', 'ig'],
  ['pengaturan', 'Pengaturan', 'cog'],
];
function updateShellBrand() {
  const b = $('#shell-brand'); if (b) b.innerHTML = `<span class="logo-mark">${logoImg()}</span><span class="brand-text"><b>${esc(desaName())}</b><small>${APP.name} v${APP.version}</small></span>`;
}
function renderAdmin(r, soft) {
  const sec = r.parts[1] || 'dashboard';
  if (root.dataset.shell !== 'admin') {
    root.dataset.shell = 'admin';
    root.innerHTML = `<div class="admin">
      <aside class="sidebar">
        <a class="brand" id="shell-brand" href="#/admin"></a>
        <nav class="side-nav">${NAV.map(([k, l, i]) => `<a href="#/admin/${k}" data-nav="${k}">${ic(i)}<span>${l}</span></a>`).join('')}</nav>
        <div class="side-foot">
          <a href="#/" target="_blank">${ic('ext')}<span>Lihat Situs Publik</span></a>
          <button id="logout">${ic('out')}<span>Keluar</span></button>
          <p class="muted small">${APP.copyright}</p>
        </div>
      </aside>
      <div class="admin-body">
        <header class="topbar"><button class="icon-btn" id="nav-toggle" aria-label="Menu">${ic('menu')}</button><h2 id="page-title"></h2><div class="topbar-right"><button class="btn btn-sm btn-ghost" data-install hidden>${ic('phone')} Pasang</button><span class="muted small hide-sm">${esc(state.user?.email || '')}</span></div></header>
        <main class="admin-main" id="admin-main"></main>
        <footer class="admin-footer">${APP.name} v${APP.version} (build ${APP.build}) • ${APP.copyright}</footer>
      </div>
      <div class="nav-scrim" id="nav-scrim"></div>
    </div>`;
    $('#nav-toggle').onclick = () => document.body.classList.toggle('nav-open');
    $('#nav-scrim').onclick = () => document.body.classList.remove('nav-open');
    $('#logout').onclick = async () => { if (await confirmDialog('Keluar dari akun admin?', { okText: 'Keluar' })) { await F.signOut(F.auth); location.hash = '#/login'; } };
    if (state.deferredPrompt) $$('[data-install]').forEach((b) => b.hidden = false);
  }
  updateShellBrand();
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === sec));
  const item = NAV.find((n) => n[0] === sec);
  $('#page-title').textContent = item ? item[1] : 'Admin';
  const main = $('#admin-main');
  const y = soft ? window.scrollY : 0;
  const views = { dashboard: viewDashboard, warga: viewWarga, import: viewImport, dusun: viewDusun, master: viewMaster, laporan: viewLaporan, informasi: viewInformasi, broadcast: viewBroadcast, instagram: viewInstagram, pengaturan: viewPengaturan };
  (views[sec] || viewDashboard)(main, r);
  if (soft) window.scrollTo(0, y); else window.scrollTo(0, 0);
}
const loadingBox = () => '<div class="empty"><span class="spinner"></span> Memuat data…</div>';

// ---------------------------------------------------------------- Dasbor
function countBy(list, key) {
  const m = new Map();
  for (const w of list) { const v = valueOf(w, key) || '(Kosong)'; m.set(v, (m.get(v) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
function bars(entries, total, { max = 8, link } = {}) {
  if (!entries.length) return emptyBox('Belum ada data');
  const top = entries.slice(0, max);
  const peak = Math.max(...top.map((e) => e[1]));
  return `<div class="bars">${top.map(([k, v]) => `<div class="bar-row" ${link ? `data-link="${esc(link(k))}"` : ''}><span class="bar-label" title="${esc(k)}">${esc(k)}</span><span class="bar-track"><span class="bar-fill" style="width:${(v / peak) * 100}%"></span></span><span class="bar-val">${fmtNum(v)}<small>${total ? Math.round((v / total) * 100) : 0}%</small></span></div>`).join('')}${entries.length > max ? `<p class="muted small">+${entries.length - max} kategori lain</p>` : ''}</div>`;
}
function filterLink(field, value) { return `#/admin/warga?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`; }
function viewDashboard(main) {
  state.view = 'dash';
  if (!state.wargaReady) { main.innerHTML = loadingBox(); return; }
  const all = state.warga; const aktif = all.filter(isAktif);
  const kk = aktif.filter((w) => norm(w.shdk) === 'kepala keluarga').length;
  const l = aktif.filter((w) => norm(w.jk).startsWith('l')).length;
  const p = aktif.filter((w) => norm(w.jk).startsWith('p')).length;
  const bansos = aktif.filter((w) => w.bansos && norm(w.bansos) !== 'tidak menerima').length;
  const noHp = aktif.filter((w) => waNumber(w.noHp)).length;
  const t = aktif.length;
  main.innerHTML = `
  ${!all.length ? `<div class="callout">${ic('upload')}<div><b>Mulai isi data warga</b><p>Import dari Excel atau tambahkan secara manual.</p></div><a class="btn btn-primary" href="#/admin/import">Import Excel</a><a class="btn btn-ghost" href="#/admin/warga/baru">Input Manual</a></div>` : ''}
  <div class="stat-grid">
    ${statCard('Penduduk Aktif', t, `${fmtNum(all.length)} total tercatat`, 'users')}
    ${statCard('Kepala Keluarga', kk, 'berdasarkan SHDK', 'home')}
    ${statCard('Laki-laki / Perempuan', `${fmtNum(l)} / ${fmtNum(p)}`, t ? `${Math.round(l / t * 100)}% : ${Math.round(p / t * 100)}%` : '', 'users')}
    ${statCard('Penerima Bansos', bansos, t ? `${Math.round(bansos / t * 100)}% penduduk aktif` : '', 'db')}
    ${statCard('Dusun', state.dusun.length, `${state.dusun.filter((d) => d.kepalaNama).length} punya kepala dusun`, 'map')}
    ${statCard('Terhubung WhatsApp', noHp, t ? `${Math.round(noHp / t * 100)}% punya nomor HP` : '', 'wa')}
  </div>
  <div class="quick">
    <a class="btn btn-primary" href="#/admin/warga/baru">${ic('plus')} Tambah Warga</a>
    <a class="btn btn-ghost" href="#/admin/import">${ic('upload')} Import Excel</a>
    <a class="btn btn-ghost" href="#/admin/informasi?baru=1">${ic('mega')} Tulis Informasi</a>
    <a class="btn btn-ghost" href="#/admin/laporan">${ic('download')} Ekspor Laporan</a>
  </div>
  <div class="panel-grid">
    <div class="panel"><h3>Penduduk per Dusun</h3>${bars(countBy(aktif, 'dusun'), t, { max: 12, link: (k) => filterLink('dusun', k) })}</div>
    <div class="panel"><h3>Kelompok Umur</h3>${bars(AGE_GROUPS.map((g) => [g[2], aktif.filter((w) => ageGroup(w.umur) === g[2]).length]).filter((e) => e[1]), t, { link: (k) => filterLink('kelompokUmur', k) })}</div>
    <div class="panel"><h3>Penerimaan Bansos</h3>${bars(countBy(aktif, 'bansos'), t, { link: (k) => filterLink('bansos', k) })}</div>
    <div class="panel"><h3>Desil Kesejahteraan</h3>${bars(countBy(aktif, 'desil'), t, { link: (k) => filterLink('desil', k) })}</div>
    <div class="panel"><h3>Status BPJS</h3>${bars(countBy(aktif, 'bpjs'), t, { link: (k) => filterLink('bpjs', k) })}</div>
    <div class="panel"><h3>Sektor Utama</h3>${bars(countBy(aktif, 'sektor'), t, { link: (k) => filterLink('sektor', k) })}</div>
    <div class="panel"><h3>Peristiwa Kependudukan</h3>${bars(countBy(all, 'peristiwa'), all.length, { link: (k) => filterLink('peristiwa', k) })}</div>
    <div class="panel"><h3>Informasi Terbaru</h3>${state.info.slice(0, 5).map((i) => `<div class="mini-row"><span>${esc(i.judul)}</span><span class="badge ${i.published ? '' : 'badge-muted'}">${i.published ? 'Terbit' : 'Draf'}</span></div>`).join('') || emptyBox('Belum ada informasi')}</div>
  </div>`;
  $$('[data-link]', main).forEach((el) => el.onclick = () => { location.hash = el.dataset.link; });
}
const statCard = (label, value, sub, icon) => `<div class="stat"><span class="stat-ic">${ic(icon)}</span><div><span class="stat-label">${esc(label)}</span><b class="stat-val">${typeof value === 'number' ? fmtNum(value) : esc(value)}</b><small class="muted">${esc(sub)}</small></div></div>`;

// ---------------------------------------------------------------- Data Warga
function filterWarga(list, f) {
  const q = norm(f.q);
  const fv = norm(f.value);
  const exact = !f.field || !f.value || f.value === '(Kosong)' || list.some((w) => norm(valueOf(w, f.field)) === fv);
  return list.filter((w) => {
    if (f.dusun && (f.dusun === '__none' ? w.dusun : w.dusun !== f.dusun)) return false;
    if (f.jk && !norm(w.jk).startsWith(f.jk)) return false;
    if (f.field && f.value) {
      const v = norm(valueOf(w, f.field));
      if (f.value === '(Kosong)' ? v !== '' : exact ? v !== fv : !v.includes(fv)) return false;
    }
    if (q && !norm([w.nama, w.nik, w.noKk, w.noHp, w.alamat, w.idWarga].join(' ')).includes(q)) return false;
    return true;
  });
}
function sortWarga(list, key) {
  const k = key || 'nama';
  return [...list].sort((a, b) => {
    if (k === 'umur') return (Number(a.umur) || 0) - (Number(b.umur) || 0);
    if (k === 'terbaru') return (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0);
    if (k === 'dusun') return String(a.dusun || '').localeCompare(String(b.dusun || '')) || String(a.nama || '').localeCompare(String(b.nama || ''));
    return String(a[k] || '').localeCompare(String(b[k] || ''), 'id');
  });
}
function dusunOptions(sel, { all = true, none = true } = {}) {
  return `${all ? '<option value="">Semua dusun</option>' : ''}${state.dusun.map((d) => `<option ${sel === d.nama ? 'selected' : ''} value="${esc(d.nama)}">${esc(d.nama)}</option>`).join('')}${none ? `<option value="__none" ${sel === '__none' ? 'selected' : ''}>(Tanpa dusun)</option>` : ''}`;
}

function viewWarga(main, r) {
  if (r.parts[2] === 'baru') return viewWargaForm(main, null);
  if (r.parts[2] === 'edit') return viewWargaForm(main, r.parts[3]);
  state.view = 'warga';
  const f = state.filters;
  if (r.query.has('field')) { f.field = r.query.get('field'); f.value = r.query.get('value') ?? ''; f.page = 1; if (f.field === 'dusun') { f.dusun = f.value && f.value !== '(Kosong)' ? f.value : '__none'; f.field = ''; f.value = ''; } history.replaceState(null, '', '#/admin/warga'); }
  if (r.query.has('dusun')) { f.dusun = r.query.get('dusun'); f.page = 1; history.replaceState(null, '', '#/admin/warga'); }
  if (!state.wargaReady) { main.innerHTML = loadingBox(); return; }
  const cats = categoryFields().filter((c) => c.key !== 'dusun');
  main.innerHTML = `
  <div class="toolbar">
    <div class="search">${ic('search')}<input id="w-q" placeholder="Cari nama, NIK, No KK, HP…" value="${esc(f.q)}"></div>
    <select id="w-dusun">${dusunOptions(f.dusun)}</select>
    <select id="w-jk"><option value="">L & P</option><option value="l" ${f.jk === 'l' ? 'selected' : ''}>Laki-laki</option><option value="p" ${f.jk === 'p' ? 'selected' : ''}>Perempuan</option></select>
    <select id="w-field"><option value="">Filter kategori…</option>${cats.map((c) => `<option value="${c.key}" ${f.field === c.key ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
    <div class="w-value-wrap" ${f.field ? '' : 'hidden'}><input id="w-value" placeholder="Ketik nilai…" value="${esc(f.value)}"></div>
    <button class="btn btn-ghost btn-sm" id="w-reset">Reset</button>
  </div>
  <div class="toolbar toolbar-actions">
    <a class="btn btn-primary" href="#/admin/warga/baru">${ic('plus')} Tambah Warga</a>
    <a class="btn btn-ghost" href="#/admin/import">${ic('upload')} Import</a>
    <button class="btn btn-ghost" id="w-export">${ic('download')} Ekspor</button>
    <button class="btn btn-wa" id="w-wa">${ic('wa')} Kirim WA</button>
    <span class="spacer"></span>
    <select id="w-sort"><option value="nama">Urut: Nama</option><option value="dusun">Urut: Dusun</option><option value="umur">Urut: Umur</option><option value="terbaru">Urut: Terbaru</option></select>
    <select id="w-per"><option>25</option><option>50</option><option>100</option><option>250</option></select>
  </div>
  <div id="w-bulk" class="bulk" hidden></div>
  <div id="w-table"></div>`;
  $('#w-sort').value = f.sort; $('#w-per').value = String(f.per);
  const vIn = $('#w-value');
  attachAutocomplete(vIn, {
    max: 40,
    source: () => {
      if (!f.field) return [];
      const present = countBy(state.warga, f.field).map(([k, c]) => ({ label: k === '(Kosong)' ? '' : k, sub: `${c} warga` })).filter((x) => x.label);
      const base = f.field === 'kelompokUmur' ? AGE_GROUPS.map((g) => g[2]) : masterItems(f.field);
      const seen = new Set(present.map((p) => norm(p.label)));
      return [...present, ...base.filter((b) => !seen.has(norm(b))).map((b) => ({ label: b, sub: '0 warga' }))];
    },
    onSelect: () => { f.value = vIn.value; f.page = 1; drawTable(); },
  });
  const upd = () => { f.page = 1; drawTable(); };
  $('#w-q').oninput = debounce((e) => { f.q = e.target.value; upd(); }, 200);
  $('#w-dusun').onchange = (e) => { f.dusun = e.target.value; upd(); };
  $('#w-jk').onchange = (e) => { f.jk = e.target.value; upd(); };
  $('#w-field').onchange = (e) => { f.field = e.target.value; f.value = ''; vIn.value = ''; $('.w-value-wrap').hidden = !f.field; upd(); if (f.field) vIn.focus(); };
  vIn.addEventListener('input', debounce(() => { f.value = vIn.value; upd(); }, 300));
  $('#w-sort').onchange = (e) => { f.sort = e.target.value; drawTable(); };
  $('#w-per').onchange = (e) => { f.per = Number(e.target.value); upd(); };
  $('#w-reset').onclick = () => { Object.assign(f, { q: '', dusun: '', field: '', value: '', jk: '', page: 1 }); render(); };
  $('#w-export').onclick = () => exportWargaDialog(currentList(), filterTitle());
  $('#w-wa').onclick = () => { const ids = state.selected.size ? [...state.selected] : currentList().map((w) => w.id); sessionStorage.setItem('bc:ids', JSON.stringify(ids)); location.hash = '#/admin/broadcast?target=ids'; };
  drawTable();
}
function currentList() { return sortWarga(filterWarga(state.warga, state.filters), state.filters.sort); }
function filterTitle() {
  const f = state.filters; const p = [];
  if (f.dusun) p.push(f.dusun === '__none' ? 'Tanpa Dusun' : 'Dusun ' + f.dusun);
  if (f.jk) p.push(f.jk === 'l' ? 'Laki-laki' : 'Perempuan');
  if (f.field) p.push(`${categoryFields().find((c) => c.key === f.field)?.label}: ${f.value || '(kosong)'}`);
  if (f.q) p.push(`Pencarian "${f.q}"`);
  return 'Data Warga' + (p.length ? ' — ' + p.join(', ') : '');
}
function drawTable() {
  const f = state.filters; const list = currentList();
  const pages = Math.max(1, Math.ceil(list.length / f.per)); f.page = Math.min(f.page, pages);
  const rows = list.slice((f.page - 1) * f.per, f.page * f.per);
  const box = $('#w-table'); if (!box) return;
  for (const id of [...state.selected]) if (!state.warga.find((w) => w.id === id)) state.selected.delete(id);
  box.innerHTML = `<p class="muted small">Menampilkan <b>${fmtNum(list.length)}</b> dari ${fmtNum(state.warga.length)} warga</p>
  <div class="table-wrap"><table class="table">
    <thead><tr><th class="chk"><input type="checkbox" id="chk-all" aria-label="Pilih semua di halaman"></th><th>Nama</th><th>L/P</th><th>Umur</th><th>Dusun</th><th>RT/RW</th><th>SHDK</th><th>No. HP</th><th class="actions-col">Aksi</th></tr></thead>
    <tbody>${rows.map((w) => `<tr>
      <td class="chk"><input type="checkbox" data-sel="${w.id}" ${state.selected.has(w.id) ? 'checked' : ''}></td>
      <td><a href="#" data-view="${w.id}" class="name-cell"><b>${esc(w.nama || '(tanpa nama)')}</b><small>${esc(w.nik || '')}</small></a></td>
      <td>${esc(norm(w.jk).startsWith('l') ? 'L' : norm(w.jk).startsWith('p') ? 'P' : '')}</td>
      <td>${esc(w.umur ?? '')}</td><td>${esc(w.dusun || '')}</td><td>${esc([w.rt, w.rw].filter(Boolean).join('/'))}</td><td>${esc(w.shdk || '')}</td>
      <td>${waNumber(w.noHp) ? `<a class="wa-link" href="${esc(waLink(w.noHp, `Assalamu'alaikum ${w.nama || ''}, `))}" target="_blank" rel="noopener">${ic('wa')} ${esc(w.noHp)}</a>` : `<span class="muted">${esc(w.noHp || '-')}</span>`}</td>
      <td class="actions-col"><button class="icon-btn" data-view="${w.id}" title="Lihat">${ic('eye')}</button><a class="icon-btn" href="#/admin/warga/edit/${w.id}" title="Ubah">${ic('edit')}</a><button class="icon-btn danger" data-del="${w.id}" title="Hapus">${ic('trash')}</button></td>
    </tr>`).join('') || `<tr><td colspan="9">${emptyBox('Tidak ada data yang cocok.')}</td></tr>`}</tbody></table></div>
  ${pages > 1 ? `<div class="pager"><button class="btn btn-sm btn-ghost" data-pg="${f.page - 1}" ${f.page <= 1 ? 'disabled' : ''}>‹ Sebelumnya</button><span>Halaman ${f.page} / ${pages}</span><button class="btn btn-sm btn-ghost" data-pg="${f.page + 1}" ${f.page >= pages ? 'disabled' : ''}>Berikutnya ›</button></div>` : ''}`;
  $$('[data-pg]', box).forEach((b) => b.onclick = () => { f.page = Number(b.dataset.pg); drawTable(); window.scrollTo(0, 0); });
  $$('[data-view]', box).forEach((b) => b.onclick = (e) => { e.preventDefault(); showWargaDetail(b.dataset.view); });
  $$('[data-del]', box).forEach((b) => b.onclick = () => deleteWarga([b.dataset.del]));
  $$('[data-sel]', box).forEach((c) => c.onchange = () => { c.checked ? state.selected.add(c.dataset.sel) : state.selected.delete(c.dataset.sel); drawBulk(); });
  $('#chk-all', box).onchange = (e) => { rows.forEach((w) => e.target.checked ? state.selected.add(w.id) : state.selected.delete(w.id)); drawTable(); };
  drawBulk();
}
function drawBulk() {
  const el = $('#w-bulk'); if (!el) return;
  const n = state.selected.size; el.hidden = !n;
  el.innerHTML = `<b>${n} warga dipilih</b><button class="btn btn-sm btn-ghost" id="b-export">${ic('download')} Ekspor</button><button class="btn btn-sm btn-ghost" id="b-dusun">${ic('map')} Pindah dusun</button><button class="btn btn-sm btn-danger" id="b-del">${ic('trash')} Hapus</button><button class="btn btn-sm btn-ghost" id="b-clear">Batal pilih</button>`;
  if (!n) return;
  const sel = () => state.warga.filter((w) => state.selected.has(w.id));
  $('#b-export').onclick = () => exportWargaDialog(sortWarga(sel(), state.filters.sort), `Data Warga Terpilih (${n})`);
  $('#b-del').onclick = () => deleteWarga([...state.selected]);
  $('#b-clear').onclick = () => { state.selected.clear(); drawTable(); };
  $('#b-dusun').onclick = () => {
    const m = modal({ title: 'Pindahkan ke dusun', size: 'sm', body: `<label class="field"><span>Dusun tujuan</span><select id="mv-d">${dusunOptions('', { all: false, none: false })}<option value="">(Kosongkan)</option></select></label>`, footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="mv-ok">Pindahkan</button>' });
    $('#mv-ok', m.el).onclick = async () => {
      const d = $('#mv-d', m.el).value; m.close();
      await batchWrite([...state.selected].map((id) => ['update', C(`warga/${id}`), { dusun: d, updatedAt: F.serverTimestamp() }]));
      toast(`${n} warga dipindahkan`, 'success'); state.selected.clear(); drawTable();
    };
  };
}
async function batchWrite(ops, onProgress) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = F.writeBatch(F.db);
    ops.slice(i, i + 400).forEach(([t, ref, data, opt]) => { if (t === 'delete') b.delete(ref); else if (t === 'update') b.update(ref, data); else b.set(ref, data, opt || {}); });
    await b.commit();
    onProgress?.(Math.min(i + 400, ops.length), ops.length);
  }
}
async function deleteWarga(ids) {
  const names = ids.length === 1 ? `“${state.warga.find((w) => w.id === ids[0])?.nama || ''}”` : `${ids.length} warga`;
  if (!await confirmDialog(`Hapus data ${names}? Tindakan ini tidak dapat dibatalkan.`, { danger: true, okText: 'Hapus' })) return;
  try { await batchWrite(ids.map((id) => ['delete', C(`warga/${id}`)])); ids.forEach((id) => state.selected.delete(id)); toast('Data dihapus', 'success'); }
  catch (e) { toast('Gagal menghapus: ' + e.message, 'error'); }
}
function showWargaDetail(id) {
  const w = state.warga.find((x) => x.id === id); if (!w) return;
  const groups = GROUPS.map((g) => {
    const fs = allFields().filter((f) => f.group === g.id && w[f.key] !== undefined && w[f.key] !== '');
    if (!fs.length) return '';
    return `<h4 class="detail-h">${esc(g.label)}</h4><dl class="detail">${fs.map((f) => `<dt>${esc(f.label)}</dt><dd>${f.type === 'phone' && waNumber(w[f.key]) ? `<a class="wa-link" target="_blank" rel="noopener" href="${esc(waLink(w[f.key]))}">${ic('wa')} ${esc(w[f.key])}</a>` : esc(displayValue(w, f.key))}</dd>`).join('')}</dl>`;
  }).join('');
  const m = modal({
    title: w.nama || 'Detail Warga', size: 'lg', body: groups || emptyBox('Data kosong'),
    footer: `${waNumber(w.noHp) ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(waLink(w.noHp, `Assalamu'alaikum ${w.nama}, `))}">${ic('wa')} Chat WhatsApp</a>` : ''}<span class="spacer"></span><button class="btn btn-ghost" id="d-pdf">${ic('download')} PDF</button><a class="btn btn-primary" href="#/admin/warga/edit/${w.id}">${ic('edit')} Ubah</a>`,
  });
  m.el.querySelector('a[href^="#/admin/warga/edit"]').addEventListener('click', () => m.close());
  $('#d-pdf', m.el).onclick = () => exportPdf({
    filename: `Biodata_${w.nama}`, title: `Biodata Warga — ${w.nama}`, orientation: 'portrait', meta: { instansi: instansi() },
    sections: GROUPS.map((g) => ({ heading: g.label, head: ['Data', 'Keterangan'], body: allFields().filter((f) => f.group === g.id).map((f) => [f.label, String(displayValue(w, f.key) ?? '')]) })),
  }).catch((e) => toast(e.message, 'error'));
}

// ---- form warga
function fieldInput(f, rec) {
  const id = 'f_' + f.key; const v = esc(rec?.[f.key] ?? '');
  const base = `id="${id}" name="${f.key}"`;
  switch (f.type) {
    case 'textarea': return `<textarea ${base} rows="2">${v}</textarea>`;
    case 'date': return `<input type="date" ${base} value="${v}">`;
    case 'number': return `<input type="number" ${base} value="${v}" ${f.key === 'umur' ? 'placeholder="Otomatis dari tgl lahir" min="0" max="150"' : 'min="0"'}>`;
    case 'nik': return `<input ${base} value="${v}" inputmode="numeric" maxlength="16" placeholder="16 digit angka">`;
    case 'phone': return `<div class="input-group"><input type="tel" ${base} value="${v}" placeholder="08xxxxxxxxxx" inputmode="tel"><a class="btn btn-wa" id="wa-test" target="_blank" rel="noopener" title="Buka WhatsApp">${ic('wa')}</a></div>`;
    case 'wilayah': return `<input ${base} value="${v}" data-id="${esc(rec?.[f.key + 'Id'] || '')}" placeholder="Ketik nama ${esc(f.label.toLowerCase())}…">`;
    case 'dusun': return `<input ${base} value="${v}" placeholder="Ketik nama dusun…">`;
    case 'select': return `<input ${base} value="${v}" data-master="${f.master}" placeholder="Ketik untuk mencari…">`;
    default: return `<input ${base} value="${v}">`;
  }
}
function viewWargaForm(main, id) {
  state.view = 'form';
  const rec = id ? state.warga.find((w) => w.id === id) : null;
  if (id && !rec) { main.innerHTML = state.wargaReady ? emptyBox('Data warga tidak ditemukan.') : loadingBox(); if (!state.wargaReady) state.view = 'warga'; return; }
  $('#page-title').textContent = rec ? 'Ubah Data Warga' : 'Tambah Warga';
  const init = rec || (() => {
    const w = state.config.wilayah || {};
    return { provinsi: w.provinsi, provinsiId: w.provinsiId, kabupaten: w.kabupaten, kabupatenId: w.kabupatenId, kecamatan: w.kecamatan, kecamatanId: w.kecamatanId, kelurahan: w.kelurahan || state.config.namaDesa, kelurahanId: w.kelurahanId, dusun: state.filters.dusun && state.filters.dusun !== '__none' ? state.filters.dusun : '' };
  })();
  const fields = allFields();
  main.innerHTML = `<form id="wf" class="form-page" novalidate>
    <p class="muted small">Kolom bertanda * wajib diisi. Pilihan dropdown muncul saat Anda mengetik; nilai baru otomatis ditambahkan ke Data Master.</p>
    ${GROUPS.map((g) => {
      const fs = fields.filter((f) => f.group === g.id);
      if (!fs.length) return '';
      return `<details class="fieldset" ${['dasar', 'wilayah'].includes(g.id) || rec ? 'open' : ''}><summary>${esc(g.label)}</summary><div class="form-grid">
        ${fs.map((f) => `<label class="field ${f.type === 'textarea' || f.key === 'alamat' ? 'span-2' : ''}"><span>${esc(f.label)}${f.required ? ' *' : ''}</span>${fieldInput(f, init)}</label>`).join('')}
      </div></details>`;
    }).join('')}
    <div class="sticky-actions"><a class="btn btn-ghost" href="#/admin/warga">Batal</a>${rec ? `<button type="button" class="btn btn-danger btn-ghost" id="wf-del">${ic('trash')} Hapus</button>` : ''}<span class="spacer"></span>
      ${!rec ? '<button type="submit" class="btn btn-ghost" data-again="1">Simpan & Tambah Lagi</button>' : ''}<button type="submit" class="btn btn-primary">${ic('check')} Simpan</button></div>
  </form>`;
  const form = $('#wf');
  // dropdown master
  $$('input[data-master]', form).forEach((inp) => attachAutocomplete(inp, { source: () => masterItems(inp.dataset.master) }));
  // dusun
  const dIn = $('#f_dusun', form);
  attachAutocomplete(dIn, { source: () => state.dusun.map((d) => ({ label: d.nama, sub: d.kepalaNama ? 'Kadus: ' + d.kepalaNama : '' })), smallList: 12 });
  // wilayah
  bindWilayahChain(['provinsi', 'kabupaten', 'kecamatan', 'kelurahan'].map((k) => $('#f_' + k, form)));
  // umur otomatis
  const tl = $('#f_tglLahir', form), um = $('#f_umur', form);
  tl.addEventListener('change', () => { const a = ageFromDate(tl.value); if (a !== '') um.value = a; });
  // tombol WA
  const hp = $('#f_noHp', form), wt = $('#wa-test', form);
  const syncWa = () => { const l = waLink(hp.value); wt.href = l || '#'; wt.classList.toggle('disabled', !l); };
  hp.addEventListener('input', syncWa); syncWa();
  // alamat → dusun/rt/rw jika kosong
  $('#f_alamat', form).addEventListener('change', (e) => {
    const p = parseAlamat(e.target.value);
    if (p.dusun && !dIn.value) dIn.value = p.dusun;
    if (p.rt && !$('#f_rt', form).value) $('#f_rt', form).value = p.rt;
    if (p.rw && !$('#f_rw', form).value) $('#f_rw', form).value = p.rw;
  });
  $('#wf-del', form)?.addEventListener('click', async () => { await deleteWarga([rec.id]); if (!state.warga.find((w) => w.id === rec.id)) location.hash = '#/admin/warga'; });

  let again = false;
  $$('[data-again]', form).forEach((b) => b.addEventListener('click', () => { again = true; }));
  $$('button[type=submit]:not([data-again])', form).forEach((b) => b.addEventListener('click', () => { again = false; }));
  form.onsubmit = async (e) => {
    e.preventDefault();
    $$('.field.invalid', form).forEach((x) => x.classList.remove('invalid'));
    const data = {};
    for (const f of fields) {
      const el = form.elements[f.key]; if (!el) continue;
      let v = el.value.trim();
      if (f.type === 'number') v = v === '' ? '' : Number(v);
      else if (f.type === 'phone') v = normalizePhone(v);
      else if (f.type === 'select') v = canonical(f.key, v, masterItems(f.master));
      data[f.key] = v;
      if (f.type === 'wilayah') data[f.key + 'Id'] = el.dataset.id || '';
    }
    if (data.tglLahir) { const a = ageFromDate(data.tglLahir); if (a !== '') data.umur = a; }
    const errs = [];
    if (!data.nama) errs.push(['nama', 'Nama wajib diisi']);
    if (data.nik && !/^\d{16}$/.test(data.nik)) errs.push(['nik', 'NIK harus 16 digit angka']);
    if (data.noKk && !/^\d{16}$/.test(data.noKk)) errs.push(['noKk', 'No. KK harus 16 digit angka']);
    if (data.nik && state.warga.some((w) => w.nik === data.nik && w.id !== rec?.id)) errs.push(['nik', 'NIK sudah terdaftar pada warga lain']);
    if (errs.length) {
      errs.forEach(([k]) => form.elements[k]?.closest('.field')?.classList.add('invalid'));
      const first = form.elements[errs[0][0]]; first?.closest('details')?.setAttribute('open', ''); first?.focus();
      toast(errs.map((x) => x[1]).join(' • '), 'error'); return;
    }
    try {
      await addNewMasterValues([data]);
      await ensureDusun([data.dusun]);
      if (rec) await F.updateDoc(C(`warga/${rec.id}`), { ...clean(data), updatedAt: F.serverTimestamp() });
      else await F.addDoc(F.collection(F.db, 'warga'), { ...clean(data), createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp() });
      toast(`Data ${data.nama} tersimpan`, 'success');
      if (again && !rec) { viewWargaForm(main, null); window.scrollTo(0, 0); }
      else location.hash = '#/admin/warga';
    } catch (err) { toast('Gagal menyimpan: ' + err.message, 'error'); }
  };
}
async function addNewMasterValues(records) {
  const add = {};
  for (const f of allFields().filter((x) => x.type === 'select')) {
    const items = masterItems(f.master); const have = new Set(items.map(norm));
    for (const r of records) {
      const v = r[f.key]; if (!v || have.has(norm(v))) continue;
      (add[f.master] ||= new Set()).add(v); have.add(norm(v));
    }
  }
  const ops = Object.entries(add).map(([k, set]) => ['set', C(`master/${k}`), { items: F.arrayUnion(...set), label: masterLabel(k) }, { merge: true }]);
  if (ops.length) await batchWrite(ops);
  return Object.values(add).reduce((n, s) => n + s.size, 0);
}
async function ensureDusun(names) {
  const have = new Set(state.dusun.map((d) => norm(d.nama)));
  const add = [...new Set(names.filter(Boolean))].filter((n) => !have.has(norm(n)));
  if (add.length) await batchWrite(add.map((n, i) => ['set', C(`dusun/${slugify(n)}`), { nama: n, urutan: state.dusun.length + i + 1, createdAt: F.serverTimestamp() }, { merge: true }]));
  return add.length;
}

// ---------------------------------------------------------------- Ekspor warga
const COL_PRESETS = {
  ringkas: ['nik', 'noKk', 'nama', 'jk', 'umur', 'shdk', 'dusun', 'rt', 'rw', 'noHp'],
  kependudukan: FIELDS.filter((f) => ['dasar', 'wilayah'].includes(f.group)).map((f) => f.key),
  sosek: ['nik', 'nama', 'dusun', 'pendapatan', 'desil', 'bansos', 'rumah', 'listrik', 'air', 'sanitasi'],
  kesehatan: ['nik', 'nama', 'umur', 'dusun', 'bpjs', 'faskes', 'penyakit', 'gizi', 'disabilitas', 'vaksin'],
  sektoral: ['nik', 'nama', 'dusun', 'sektor', 'profesi', 'luasLahan', 'kelompok', 'alat', 'skala'],
  peristiwa: ['nik', 'nama', 'dusun', 'peristiwa', 'tglPeristiwa', 'ketPeristiwa'],
};
function exportWargaDialog(list, title) {
  const fields = allFields().filter((f) => !['provinsiId'].includes(f.key));
  const m = modal({
    title: 'Ekspor Data Warga', size: 'lg',
    body: `<p class="muted">${fmtNum(list.length)} warga akan diekspor.</p>
      <label class="field"><span>Judul laporan</span><input id="ex-title" value="${esc(title)}"></label>
      <div class="field"><span>Kolom</span><div class="chips">${Object.keys(COL_PRESETS).map((k) => `<button type="button" class="chip" data-preset="${k}">${({ ringkas: 'Ringkas', kependudukan: 'Kependudukan', sosek: 'Sosial Ekonomi', kesehatan: 'Kesehatan', sektoral: 'Sektoral', peristiwa: 'Peristiwa' })[k]}</button>`).join('')}<button type="button" class="chip" data-preset="all">Lengkap (semua)</button></div></div>
      <div class="col-picker">${GROUPS.map((g) => { const fs = fields.filter((f) => f.group === g.id); return fs.length ? `<div><b>${esc(g.label)}</b>${fs.map((f) => `<label class="check"><input type="checkbox" value="${f.key}" ${COL_PRESETS.ringkas.includes(f.key) ? 'checked' : ''}> ${esc(f.label)}</label>`).join('')}</div>` : ''; }).join('')}</div>
      <label class="check"><input type="checkbox" id="ex-group"> Kelompokkan per dusun (lembar / bagian terpisah per dusun, dengan kepala dusun)</label>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-ghost" id="ex-pdf">${ic('file')} PDF</button><button class="btn btn-primary" id="ex-xls">${ic('download')} Excel</button>`,
  });
  const boxes = () => $$('.col-picker input', m.el);
  $$('[data-preset]', m.el).forEach((b) => b.onclick = () => { const p = b.dataset.preset; boxes().forEach((c) => c.checked = p === 'all' || COL_PRESETS[p].includes(c.value)); });
  const go = async (fmt) => {
    const cols = boxes().filter((c) => c.checked).map((c) => c.value);
    if (!cols.length) return toast('Pilih minimal satu kolom', 'error');
    const btn = $(fmt === 'pdf' ? '#ex-pdf' : '#ex-xls', m.el); btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span> Menyiapkan…';
    try { await exportWarga({ list, cols, title: $('#ex-title', m.el).value || title, group: $('#ex-group', m.el).checked, fmt }); m.close(); }
    catch (e) { toast('Ekspor gagal: ' + e.message, 'error'); btn.disabled = false; btn.textContent = fmt.toUpperCase(); }
  };
  $('#ex-pdf', m.el).onclick = () => go('pdf');
  $('#ex-xls', m.el).onclick = () => go('xls');
}
async function exportWarga({ list, cols, title, group, fmt }) {
  const head = ['No', ...cols.map((k) => fieldByKey(k)?.label || k)];
  const row = (w, i, forPdf) => [i + 1, ...cols.map((k) => (k === 'pendapatan' && !forPdf ? (w[k] === '' || w[k] == null ? '' : Number(w[k])) : (k === 'nik' || k === 'noKk' || k === 'noHp') ? String(w[k] || '') : String(displayValue(w, k) ?? '')))];
  const groups = [];
  if (group) {
    const names = [...state.dusun.map((d) => d.nama), ...new Set(list.map((w) => w.dusun).filter((n) => n && !state.dusun.find((d) => d.nama === n)))];
    for (const n of names) { const l = list.filter((w) => w.dusun === n); if (l.length) groups.push({ name: n, list: l, kadus: state.dusun.find((d) => d.nama === n) }); }
    const none = list.filter((w) => !w.dusun); if (none.length) groups.push({ name: 'Tanpa Dusun', list: none });
  }
  if (fmt === 'xls') {
    const sheets = [{ name: 'Semua', title, head, body: list.map((w, i) => row(w, i, false)) }];
    groups.forEach((g) => sheets.push({ name: g.name, title: `${title} — Dusun ${g.name}${g.kadus?.kepalaNama ? ` (Kadus: ${g.kadus.kepalaNama})` : ''}`, head, body: g.list.map((w, i) => row(w, i, false)) }));
    await exportExcel(title, sheets, { instansi: instansi() });
  } else {
    const sections = group
      ? groups.map((g) => ({ heading: `Dusun ${g.name} — ${g.list.length} warga`, sub: g.kadus?.kepalaNama ? `Kepala Dusun: ${g.kadus.kepalaNama}${g.kadus.kepalaHp ? ' • ' + g.kadus.kepalaHp : ''}` : '', head, body: g.list.map((w, i) => row(w, i, true)) }))
      : [{ head, body: list.map((w, i) => row(w, i, true)) }];
    await exportPdf({ filename: title, title, subtitle: `${fmtNum(list.length)} warga`, sections, orientation: cols.length > 6 ? 'landscape' : 'portrait', meta: { instansi: instansi() } });
  }
  toast('Berkas ekspor diunduh', 'success');
}

// ---------------------------------------------------------------- Import Excel
function viewImport(main) {
  state.view = 'form';
  main.innerHTML = `
  <div class="panel">
    <h3>${ic('upload')} Import Data Warga dari Excel</h3>
    <p class="muted">Format .xlsx, .xls, atau .csv. Baris judul (header) dideteksi otomatis — termasuk format “Data Master Kependudukan” 33 kolom. Kolom “Alamat Domisili” seperti <i>Dusun Cempaka, RT 02/RW 01</i> otomatis dipecah ke Dusun, RT, dan RW.</p>
    <label class="dropzone" id="dz"><input type="file" id="imp-file" accept=".xlsx,.xls,.csv" hidden>${ic('upload')}<b>Pilih atau seret berkas Excel ke sini</b><span class="muted small">Data diproses di perangkat Anda sebelum disimpan.</span></label>
    <div class="row-gap"><button class="btn btn-ghost btn-sm" id="imp-tpl">${ic('download')} Unduh Template Excel</button></div>
  </div>
  <div id="imp-step"></div>`;
  const fileIn = $('#imp-file'); const dz = $('#dz');
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) handleImportFile(e.dataTransfer.files[0]); });
  fileIn.onchange = () => fileIn.files[0] && handleImportFile(fileIn.files[0]);
  $('#imp-tpl').onclick = downloadTemplate;
}
async function downloadTemplate() {
  try {
    const fields = allFields();
    const ex = { idWarga: 'WRG-0001', nik: '1101010101900001', noKk: '1101010101900099', nama: 'Contoh Nama Warga', jk: 'Laki-laki', tempatLahir: 'Banda Aceh', tglLahir: '1990-01-01', agama: 'Islam', shdk: 'Kepala Keluarga', statusKawin: 'Kawin', noHp: '081234567890', dusun: 'Dusun Contoh', rt: '01', rw: '01', alamat: 'Dusun Contoh, RT 01/RW 01' };
    const pilihan = fields.filter((f) => f.type === 'select');
    const maxLen = Math.max(...pilihan.map((f) => masterItems(f.master).length));
    const pilihanBody = Array.from({ length: maxLen }, (_, i) => pilihan.map((f) => masterItems(f.master)[i] || ''));
    await exportExcel('Template_Import_Data_Warga', [
      { name: 'Data Warga', head: fields.map((f) => f.label), body: [fields.map((f) => ex[f.key] ?? '')] },
      { name: 'Pilihan Dropdown', head: pilihan.map((f) => f.label), body: pilihanBody },
      { name: 'Petunjuk', head: ['Petunjuk Pengisian'], body: [['1. Isi data mulai baris ke-2 pada lembar "Data Warga". Hapus baris contoh.'], ['2. NIK & No KK 16 digit. Format kolom sebagai Teks agar angka tidak berubah.'], ['3. Tanggal format YYYY-MM-DD (contoh 1990-01-31) atau DD/MM/YYYY.'], ['4. Untuk kolom pilihan, gunakan nilai pada lembar "Pilihan Dropdown". Nilai baru akan ditambahkan ke Data Master.'], ['5. Jenis Kelamin boleh diisi L / P.'], [`${APP.name} v${APP.version} ${APP.copyright}`]] },
    ]);
  } catch (e) { toast(e.message, 'error'); }
}
function cellToValue(f, raw, XLSX) {
  if (raw === null || raw === undefined) return '';
  if (f.type === 'date') {
    if (typeof raw === 'number') { const d = XLSX.SSF.parse_date_code(raw); return d ? `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : ''; }
    const s = String(raw).trim(); if (!s || s === '-') return '';
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return s;
  }
  if (f.type === 'nik') { if (typeof raw === 'number') return raw.toLocaleString('fullwide', { useGrouping: false }); return String(raw).replace(/\D/g, ''); }
  if (f.type === 'phone') return normalizePhone(typeof raw === 'number' ? raw.toLocaleString('fullwide', { useGrouping: false }) : raw);
  if (f.type === 'number') { if (typeof raw === 'number') return raw; const s = String(raw).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); return s === '' || s === '-' ? '' : (Number.isNaN(Number(s)) ? '' : Number(s)); }
  const s = String(raw).trim();
  return s === '-' ? '' : s;
}
async function handleImportFile(file) {
  const step = $('#imp-step');
  step.innerHTML = loadingBox();
  let XLSX, wb;
  try {
    XLSX = await getXLSX();
    wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  } catch (e) { step.innerHTML = emptyBox('Gagal membaca berkas: ' + e.message); return; }
  const fields = allFields();
  const analyses = wb.SheetNames.map((name) => {
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
    let best = { row: -1, score: 0, map: [] };
    for (let r = 0; r < Math.min(60, aoa.length); r++) {
      const map = mapHeaders(aoa[r].map((x) => String(x ?? '')), fields);
      const score = map.filter(Boolean).length + (map.includes('nama') ? 3 : 0);
      if (score > best.score) best = { row: r, score, map };
    }
    return { name, aoa, ...best };
  });
  let cur = analyses.reduce((a, b) => (b.score > a.score ? b : a), analyses[0]);
  if (!cur || cur.score < 2) { step.innerHTML = emptyBox('Tidak menemukan baris judul kolom yang dikenali (minimal kolom Nama).'); return; }

  const draw = () => {
    const headers = cur.aoa[cur.row] || [];
    const dataRows = cur.aoa.slice(cur.row + 1).filter((r) => r.some((c) => String(c).trim() !== ''));
    const validCount = buildRecords(dataRows).length;
    step.innerHTML = `<div class="panel">
      <h3>Pemetaan Kolom</h3>
      <div class="form-grid">
        <label class="field"><span>Lembar (sheet)</span><select id="imp-sheet">${analyses.map((a) => `<option ${a === cur ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
        <label class="field"><span>Baris judul kolom</span><input type="number" id="imp-row" min="1" value="${cur.row + 1}"></label>
      </div>
      <p class="muted small">${headers.filter((h) => String(h).trim()).length} kolom ditemukan, ${cur.map.filter(Boolean).length} dikenali otomatis. Periksa & ubah bila perlu.</p>
      <div class="map-grid">${headers.map((h, i) => String(h).trim() ? `<label class="map-item ${cur.map[i] ? 'ok' : ''}"><span title="${esc(h)}">${esc(h)}</span><select data-col="${i}"><option value="">— abaikan —</option>${fields.map((f) => `<option value="${f.key}" ${cur.map[i] === f.key ? 'selected' : ''}>${esc(f.label)}</option>`).join('')}</select></label>` : '').join('')}</div>
      <h3>Opsi</h3>
      <label class="check"><input type="checkbox" id="o-upd" checked> Jika NIK sudah ada, <b>perbarui</b> data tersebut (bukan duplikat)</label>
      <label class="check"><input type="checkbox" id="o-master" checked> Tambahkan nilai baru ke Data Master (dropdown)</label>
      <label class="check"><input type="checkbox" id="o-dusun" checked> Buat dusun otomatis dari kolom Dusun / Alamat</label>
      <label class="check"><input type="checkbox" id="o-wil" checked> Isi Provinsi s/d Kelurahan dengan wilayah desa jika kosong</label>
      <h3>Pratinjau (${fmtNum(validCount)} baris warga${dataRows.length > validCount ? `, ${dataRows.length - validCount} baris tanpa nama dilewati` : ''})</h3>
      <div id="imp-prev"></div>
      <div class="sticky-actions"><button class="btn btn-ghost" id="imp-cancel">Batal</button><span class="spacer"></span><button class="btn btn-primary" id="imp-go">${ic('upload')} Import ${fmtNum(validCount)} warga</button></div>
      <div id="imp-progress"></div>
    </div>`;
    const preview = () => {
      const recs = buildRecords(dataRows.slice(0, 8));
      const keys = [...new Set(cur.map.filter(Boolean)), ...(recs.some((r) => r.dusun) && !cur.map.includes('dusun') ? ['dusun'] : []), ...(recs.some((r) => r.rt) && !cur.map.includes('rt') ? ['rt', 'rw'] : [])];
      $('#imp-prev').innerHTML = `<div class="table-wrap"><table class="table small"><thead><tr>${keys.map((k) => `<th>${esc(fieldByKey(k)?.label || k)}</th>`).join('')}</tr></thead><tbody>${recs.map((r) => `<tr>${keys.map((k) => `<td>${esc(r[k] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    };
    $('#imp-sheet').onchange = (e) => { cur = analyses.find((a) => a.name === e.target.value); draw(); };
    $('#imp-row').onchange = (e) => { const r = Math.max(0, Number(e.target.value) - 1); cur = { ...cur, row: r, map: mapHeaders((cur.aoa[r] || []).map(String), fields) }; draw(); };
    $$('[data-col]').forEach((s) => s.onchange = () => {
      const i = Number(s.dataset.col); const k = s.value;
      if (k) cur.map = cur.map.map((x, j) => (x === k && j !== i ? null : x));
      cur.map[i] = k || null; draw();
    });
    $('#imp-cancel').onclick = () => { step.innerHTML = ''; $('#imp-file').value = ''; };
    $('#imp-go').onclick = () => runImport(buildRecords(dataRows));
    preview();
  };
  const buildRecords = (rows) => {
    const w = state.config.wilayah || {};
    const useWil = $('#o-wil') ? $('#o-wil').checked : true;
    return rows.map((r) => {
      const rec = {};
      cur.map.forEach((k, i) => {
        if (!k) return;
        const f = fieldByKey(k); let v = cellToValue(f, r[i], XLSX);
        if (f.type === 'select') v = canonical(k, v, masterItems(f.master));
        rec[k] = v;
      });
      if (rec.alamat) {
        const p = parseAlamat(rec.alamat);
        for (const k of ['dusun', 'rt', 'rw']) if (p[k] && !rec[k]) rec[k] = p[k];
      }
      if (rec.dusun) rec.dusun = String(rec.dusun).replace(/^dusun\s+/i, '').trim();
      if (rec.tglLahir && (rec.umur === '' || rec.umur === undefined)) { const a = ageFromDate(rec.tglLahir); if (a !== '') rec.umur = a; }
      if (useWil) for (const k of ['provinsi', 'kabupaten', 'kecamatan', 'kelurahan']) if (!rec[k] && w[k]) { rec[k] = w[k]; rec[k + 'Id'] = w[k + 'Id'] || ''; }
      return rec;
    }).filter((rec) => rec.nama && !/^(rata|total|jumlah)/i.test(rec.nama));
  };
  draw();
}
async function runImport(records) {
  const prog = $('#imp-progress'); const go = $('#imp-go');
  if (!records.length) return toast('Tidak ada baris bernama untuk diimport', 'error');
  const upd = $('#o-upd').checked, addM = $('#o-master').checked, addD = $('#o-dusun').checked;
  go.disabled = true;
  prog.innerHTML = '<div class="progress"><span style="width:0%"></span></div><p class="muted small" id="pg-t">Menyiapkan…</p>';
  try {
    let nm = 0, nd = 0;
    if (addM) nm = await addNewMasterValues(records);
    if (addD) nd = await ensureDusun(records.map((r) => r.dusun));
    const byNik = new Map(state.warga.filter((w) => w.nik).map((w) => [w.nik, w.id]));
    let created = 0, updated = 0;
    const ops = records.map((r) => {
      const existing = upd && r.nik ? byNik.get(r.nik) : null;
      if (existing) { updated++; return ['set', C(`warga/${existing}`), { ...clean(r), updatedAt: F.serverTimestamp() }, { merge: true }]; }
      created++;
      const ref = F.doc(F.collection(F.db, 'warga'));
      if (r.nik) byNik.set(r.nik, ref.id);
      return ['set', ref, { ...clean(r), createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp(), sumber: 'import' }];
    });
    await batchWrite(ops, (d, t) => { $('.progress span', prog).style.width = `${(d / t) * 100}%`; $('#pg-t').textContent = `${fmtNum(d)} / ${fmtNum(t)} baris tersimpan`; });
    prog.innerHTML = `<div class="callout ok">${ic('check')}<div><b>Import selesai</b><p>${created} warga baru, ${updated} diperbarui${nd ? `, ${nd} dusun baru` : ''}${nm ? `, ${nm} nilai master baru` : ''}.</p></div><a class="btn btn-primary" href="#/admin/warga">Lihat Data Warga</a></div>`;
    toast('Import selesai', 'success');
  } catch (e) {
    prog.innerHTML = `<p class="err">Import gagal: ${esc(e.message)}</p>`; go.disabled = false;
  }
}

// ---------------------------------------------------------------- Dusun
function viewDusun(main) {
  state.view = 'dusun';
  if (!state.wargaReady) { main.innerHTML = loadingBox(); return; }
  const tanpa = state.warga.filter((w) => !w.dusun).length;
  main.innerHTML = `<div class="toolbar toolbar-actions"><button class="btn btn-primary" id="d-add">${ic('plus')} Tambah Dusun</button><button class="btn btn-ghost" id="d-exp">${ic('download')} Ekspor Daftar Dusun & Kadus</button><button class="btn btn-wa" id="d-wa">${ic('wa')} Kirim WA ke Semua Kadus</button></div>
  ${tanpa ? `<div class="callout">${ic('users')}<div><b>${tanpa} warga belum punya dusun</b><p>Kelompokkan dengan memilih warga lalu “Pindah dusun”.</p></div><a class="btn btn-ghost" href="#/admin/warga?dusun=__none">Lihat</a></div>` : ''}
  <div class="dusun-grid">${state.dusun.map((d) => {
    const ws = state.warga.filter((w) => w.dusun === d.nama); const ak = ws.filter(isAktif);
    return `<div class="dusun-card">
      <div class="dusun-head"><h3>Dusun ${esc(d.nama)}</h3><div><button class="icon-btn" data-edit="${d.id}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-del="${d.id}" title="Hapus">${ic('trash')}</button></div></div>
      <div class="kadus">${d.kepalaNama ? `<span class="muted small">Kepala Dusun</span><b>${esc(d.kepalaNama)}</b>${waNumber(d.kepalaHp) ? `<a class="wa-link" target="_blank" rel="noopener" href="${esc(waLink(d.kepalaHp, `Assalamu'alaikum Bapak/Ibu ${d.kepalaNama}, `))}">${ic('wa')} ${esc(d.kepalaHp)}</a>` : ''}` : '<span class="muted">Kepala dusun belum diisi</span>'}</div>
      <div class="dusun-stats"><span><b>${ak.length}</b> jiwa</span><span><b>${ak.filter((w) => norm(w.shdk) === 'kepala keluarga').length}</b> KK</span><span><b>${ak.filter((w) => norm(w.jk).startsWith('l')).length}</b> L</span><span><b>${ak.filter((w) => norm(w.jk).startsWith('p')).length}</b> P</span></div>
      ${d.keterangan ? `<p class="muted small">${esc(d.keterangan)}</p>` : ''}
      <div class="dusun-actions"><a class="btn btn-sm btn-ghost" href="#/admin/warga?dusun=${encodeURIComponent(d.nama)}">${ic('users')} Warga</a><button class="btn btn-sm btn-ghost" data-xls="${d.id}">Excel</button><button class="btn btn-sm btn-ghost" data-pdf="${d.id}">PDF</button><button class="btn btn-sm btn-wa" data-wa="${esc(d.nama)}">${ic('wa')} WA Warga</button></div>
    </div>`;
  }).join('') || emptyBox('Belum ada dusun. Tambahkan dusun atau import data warga.')}</div>`;
  $('#d-add').onclick = () => dusunForm(null);
  $$('[data-edit]', main).forEach((b) => b.onclick = () => dusunForm(state.dusun.find((d) => d.id === b.dataset.edit)));
  $$('[data-del]', main).forEach((b) => b.onclick = async () => {
    const d = state.dusun.find((x) => x.id === b.dataset.del); const n = state.warga.filter((w) => w.dusun === d.nama).length;
    if (!await confirmDialog(`Hapus Dusun ${d.nama}?${n ? ` ${n} warga di dusun ini akan menjadi “tanpa dusun”.` : ''}`, { danger: true, okText: 'Hapus' })) return;
    await batchWrite([['delete', C(`dusun/${d.id}`)], ...state.warga.filter((w) => w.dusun === d.nama).map((w) => ['update', C(`warga/${w.id}`), { dusun: '' }])]);
    toast('Dusun dihapus', 'success');
  });
  const dusunList = (id) => { const d = state.dusun.find((x) => x.id === id); return [d, sortWarga(state.warga.filter((w) => w.dusun === d.nama), 'nama')]; };
  $$('[data-xls]', main).forEach((b) => b.onclick = () => { const [d, l] = dusunList(b.dataset.xls); exportWarga({ list: l, cols: COL_PRESETS.ringkas, title: `Data Warga Dusun ${d.nama}`, group: true, fmt: 'xls' }).catch((e) => toast(e.message, 'error')); });
  $$('[data-pdf]', main).forEach((b) => b.onclick = () => { const [d, l] = dusunList(b.dataset.pdf); exportWarga({ list: l, cols: COL_PRESETS.ringkas, title: `Data Warga Dusun ${d.nama}`, group: true, fmt: 'pdf' }).catch((e) => toast(e.message, 'error')); });
  $$('[data-wa]', main).forEach((b) => b.onclick = () => { location.hash = `#/admin/broadcast?target=dusun&dusun=${encodeURIComponent(b.dataset.wa)}`; });
  $('#d-wa').onclick = () => { location.hash = '#/admin/broadcast?target=kadus'; };
  $('#d-exp').onclick = async () => {
    const head = ['No', 'Dusun', 'Kepala Dusun', 'No. HP Kadus', 'Jiwa', 'KK', 'L', 'P', 'Keterangan'];
    const body = state.dusun.map((d, i) => { const ak = state.warga.filter((w) => w.dusun === d.nama && isAktif(w)); return [i + 1, d.nama, d.kepalaNama || '', d.kepalaHp || '', ak.length, ak.filter((w) => norm(w.shdk) === 'kepala keluarga').length, ak.filter((w) => norm(w.jk).startsWith('l')).length, ak.filter((w) => norm(w.jk).startsWith('p')).length, d.keterangan || '']; });
    const m = modal({ title: 'Ekspor Daftar Dusun', size: 'sm', body: '<p>Pilih format berkas.</p>', footer: `<button class="btn btn-ghost" id="dx-pdf">PDF</button><button class="btn btn-primary" id="dx-xls">Excel</button>` });
    $('#dx-pdf', m.el).onclick = () => { m.close(); exportPdf({ filename: 'Daftar_Dusun_Kadus', title: 'Daftar Dusun & Kepala Dusun', sections: [{ head, body }], orientation: 'portrait', meta: { instansi: instansi() } }); };
    $('#dx-xls', m.el).onclick = () => { m.close(); exportExcel('Daftar_Dusun_Kadus', [{ name: 'Dusun', title: 'Daftar Dusun & Kepala Dusun', head, body }], { instansi: instansi() }); };
  };
}
function dusunForm(d) {
  const m = modal({
    title: d ? `Ubah Dusun ${d.nama}` : 'Tambah Dusun',
    body: `<form id="df" class="form-grid">
      <label class="field span-2"><span>Nama Dusun *</span><input name="nama" required value="${esc(d?.nama || '')}" placeholder="mis. Cempaka (tanpa kata 'Dusun')"></label>
      <label class="field"><span>Kepala Dusun</span><input name="kepalaNama" value="${esc(d?.kepalaNama || '')}" placeholder="Ketik nama — saran dari data warga"></label>
      <label class="field"><span>No. HP Kepala Dusun</span><input name="kepalaHp" type="tel" value="${esc(d?.kepalaHp || '')}" placeholder="08xxxxxxxxxx"></label>
      <label class="field"><span>Urutan tampil</span><input name="urutan" type="number" value="${esc(d?.urutan ?? state.dusun.length + 1)}"></label>
      <label class="field span-2"><span>Keterangan</span><textarea name="keterangan" rows="2">${esc(d?.keterangan || '')}</textarea></label>
    </form>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="df-ok">Simpan</button>`,
  });
  const form = $('#df', m.el);
  attachAutocomplete(form.elements.kepalaNama, {
    source: () => state.warga.map((w) => ({ label: w.nama, sub: [w.dusun && 'Dusun ' + w.dusun, w.noHp].filter(Boolean).join(' • '), id: w.id })),
    onSelect: (it) => { const w = state.warga.find((x) => x.id === it.id); if (w?.noHp) form.elements.kepalaHp.value = w.noHp; if (w?.dusun && !form.elements.nama.value) form.elements.nama.value = w.dusun; form.elements.kepalaNama.dataset.wargaId = w?.id || ''; },
  });
  $('#df-ok', m.el).onclick = async () => {
    const nama = form.elements.nama.value.trim().replace(/^dusun\s+/i, '');
    if (!nama) return toast('Nama dusun wajib diisi', 'error');
    if (state.dusun.some((x) => norm(x.nama) === norm(nama) && x.id !== d?.id)) return toast('Nama dusun sudah ada', 'error');
    const data = { nama, kepalaNama: form.elements.kepalaNama.value.trim(), kepalaHp: normalizePhone(form.elements.kepalaHp.value), kepalaWargaId: form.elements.kepalaNama.dataset.wargaId || d?.kepalaWargaId || '', urutan: Number(form.elements.urutan.value) || 0, keterangan: form.elements.keterangan.value.trim(), updatedAt: F.serverTimestamp() };
    try {
      const ops = [];
      if (d) {
        ops.push(['update', C(`dusun/${d.id}`), data]);
        if (d.nama !== nama) state.warga.filter((w) => w.dusun === d.nama).forEach((w) => ops.push(['update', C(`warga/${w.id}`), { dusun: nama }]));
      } else ops.push(['set', C(`dusun/${slugify(nama)}`), { ...data, createdAt: F.serverTimestamp() }]);
      await batchWrite(ops);
      m.close(); toast('Dusun tersimpan', 'success');
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
}

// ---------------------------------------------------------------- Data Master
let masterSel = 'jk';
function viewMaster(main) {
  state.view = 'master';
  if (!state.masterReady) { main.innerHTML = loadingBox(); return; }
  const builtins = [...FIELDS.filter((f) => f.type === 'select').map((f) => ({ key: f.key, label: f.label, group: f.group })), { key: 'kategoriInfo', label: MASTER_EXTRA_LABELS.kategoriInfo, group: 'info' }];
  const customs = customFields();
  if (![...builtins, ...customs].find((c) => c.key === masterSel)) masterSel = 'jk';
  const groupLabel = (g) => GROUPS.find((x) => x.id === g)?.label || (g === 'info' ? 'Papan Informasi' : g);
  const sideGroups = [...new Set(builtins.map((b) => b.group))];
  const items = masterItems(masterSel);
  const usage = (v) => state.warga.filter((w) => norm(w[masterSel]) === norm(v)).length;
  main.innerHTML = `<div class="master">
    <aside class="master-side">
      <div class="search">${ic('search')}<input id="ms-q" placeholder="Cari kategori…"></div>
      ${sideGroups.map((g) => `<div class="ms-group"><small>${esc(groupLabel(g))}</small>${builtins.filter((b) => b.group === g).map((b) => `<button data-k="${b.key}" class="${b.key === masterSel ? 'active' : ''}">${esc(masterLabel(b.key))}<span>${masterItems(b.key).length}</span></button>`).join('')}</div>`).join('')}
      <div class="ms-group"><small>Kategori Kustom</small>${customs.map((b) => `<button data-k="${b.key}" class="${b.key === masterSel ? 'active' : ''}">${esc(b.label)}<span>${masterItems(b.key).length}</span></button>`).join('') || '<p class="muted small">Belum ada</p>'}
        <button class="btn btn-sm btn-ghost" id="ms-newcat">${ic('plus')} Kategori Baru</button></div>
    </aside>
    <section class="panel master-main">
      <div class="master-head"><div><h3>${esc(masterLabel(masterSel))}</h3><p class="muted small">${items.length} pilihan • tampil sebagai dropdown di formulir${state.master[masterSel]?.custom ? ' (bagian Data Tambahan)' : ''}</p></div>
        <div class="row-gap">${state.master[masterSel]?.custom ? `<button class="btn btn-sm btn-ghost" id="ms-rencat">${ic('edit')} Ganti nama</button><button class="btn btn-sm btn-danger btn-ghost" id="ms-delcat">${ic('trash')} Hapus kategori</button>` : ''}<button class="btn btn-sm btn-ghost" id="ms-sort">Urutkan A–Z</button></div></div>
      <form id="ms-add" class="input-group"><input id="ms-new" placeholder="Tambah pilihan baru… (pisahkan dengan ; untuk banyak sekaligus)"><button class="btn btn-primary">${ic('plus')} Tambah</button></form>
      <div class="search">${ic('search')}<input id="ms-filter" placeholder="Cari di daftar…"></div>
      <ul class="ms-items">${items.map((v, i) => `<li data-v="${esc(v)}"><span class="ms-order"><button class="icon-btn" data-up="${i}" title="Naik" ${i === 0 ? 'disabled' : ''}>↑</button></span><span class="ms-val">${esc(v)}</span>${masterSel !== 'kategoriInfo' ? `<span class="muted small">${usage(v)} warga</span>` : ''}<button class="icon-btn" data-ren="${i}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-rm="${i}" title="Hapus">${ic('trash')}</button></li>`).join('') || `<li>${emptyBox('Belum ada pilihan')}</li>`}</ul>
    </section></div>`;
  const ref = C(`master/${masterSel}`);
  const save = (arr) => F.setDoc(ref, { items: arr, label: masterLabel(masterSel) }, { merge: true }).catch((e) => toast(e.message, 'error'));
  $$('[data-k]', main).forEach((b) => b.onclick = () => { masterSel = b.dataset.k; viewMaster(main); });
  $('#ms-q').oninput = (e) => { const q = norm(e.target.value); $$('[data-k]', main).forEach((b) => b.hidden = q && !norm(b.textContent).includes(q)); };
  $('#ms-filter').oninput = (e) => { const q = norm(e.target.value); $$('.ms-items li[data-v]', main).forEach((li) => li.hidden = q && !norm(li.dataset.v).includes(q)); };
  $('#ms-add').onsubmit = (e) => {
    e.preventDefault();
    const vals = $('#ms-new').value.split(';').map((s) => s.trim()).filter(Boolean);
    const have = new Set(items.map(norm)); const add = vals.filter((v) => !have.has(norm(v)));
    if (!add.length) return toast(vals.length ? 'Pilihan sudah ada' : 'Isi nama pilihan', 'error');
    save([...items, ...add]).then(() => toast(`${add.length} pilihan ditambahkan`, 'success'));
  };
  $('#ms-sort').onclick = () => save([...items].sort((a, b) => a.localeCompare(b, 'id', { numeric: true })));
  $$('[data-up]', main).forEach((b) => b.onclick = () => { const i = +b.dataset.up; const a = [...items];[a[i - 1], a[i]] = [a[i], a[i - 1]]; save(a); });
  $$('[data-rm]', main).forEach((b) => b.onclick = async () => {
    const v = items[+b.dataset.rm]; const u = usage(v);
    if (!await confirmDialog(`Hapus pilihan “${v}”?${u ? ` (${u} warga masih memakai nilai ini; data warga tidak diubah)` : ''}`, { danger: true, okText: 'Hapus' })) return;
    save(items.filter((x) => x !== v));
  });
  $$('[data-ren]', main).forEach((b) => b.onclick = async () => {
    const old = items[+b.dataset.ren]; const nv = await promptDialog('Ubah pilihan', 'Nama pilihan', old); if (!nv || nv === old) return;
    await save(items.map((x) => (x === old ? nv : x)));
    const affected = state.warga.filter((w) => w[masterSel] === old);
    if (affected.length && await confirmDialog(`Perbarui juga ${affected.length} data warga dari “${old}” menjadi “${nv}”?`, { okText: 'Perbarui' })) {
      await batchWrite(affected.map((w) => ['update', C(`warga/${w.id}`), { [masterSel]: nv }])); toast('Data warga diperbarui', 'success');
    }
    if (masterSel === 'kategoriInfo') { const inf = state.info.filter((i) => i.kategori === old); if (inf.length) await batchWrite(inf.map((i) => ['update', C(`informasi/${i.id}`), { kategori: nv }])); }
  });
  $('#ms-newcat').onclick = async () => {
    const label = await promptDialog('Kategori Dropdown Baru', 'Nama kategori (akan muncul sebagai kolom baru di formulir warga)', '', { placeholder: 'mis. Status Kepemilikan Ternak' });
    if (!label) return;
    const key = 'x_' + slugify(label).replace(/-/g, '_');
    if (state.master[key] || fieldByKey(key)) return toast('Kategori sudah ada', 'error');
    await F.setDoc(C(`master/${key}`), { label, items: [], custom: true, group: 'tambahan', order: customs.length + 1 });
    masterSel = key; toast('Kategori dibuat — silakan tambah pilihannya', 'success');
  };
  $('#ms-rencat')?.addEventListener('click', async () => { const l = await promptDialog('Ganti nama kategori', 'Nama kategori', masterLabel(masterSel)); if (l) await F.updateDoc(ref, { label: l }); });
  $('#ms-delcat')?.addEventListener('click', async () => {
    if (!await confirmDialog(`Hapus kategori “${masterLabel(masterSel)}” beserta semua pilihannya? Nilai yang sudah tersimpan di data warga tetap ada.`, { danger: true, okText: 'Hapus' })) return;
    await F.deleteDoc(ref); masterSel = 'jk';
  });
}

// ---------------------------------------------------------------- Laporan & Ekspor
function rekap(list, key, byDusun) {
  const dusunNames = byDusun ? [...state.dusun.map((d) => d.nama), ...(list.some((w) => !w.dusun) ? [''] : [])] : [];
  const base = key === 'dusun' ? state.dusun.map((d) => d.nama) : key === 'kelompokUmur' ? AGE_GROUPS.map((g) => g[2]) : masterItems(fieldByKey(key)?.master || key);
  const present = countBy(list, key).map((e) => e[0]);
  const values = [...base, ...present.filter((p) => p !== '(Kosong)' && !base.some((b) => norm(b) === norm(p)))];
  if (present.includes('(Kosong)')) values.push('(Kosong)');
  const total = list.length;
  const head = ['No', categoryFields().find((c) => c.key === key)?.label || key, ...(byDusun ? dusunNames.map((d) => d || 'Tanpa Dusun') : []), 'Jumlah', '%'];
  const body = values.map((v, i) => {
    const match = (w) => (v === '(Kosong)' ? !valueOf(w, key) : norm(valueOf(w, key)) === norm(v));
    const n = list.filter(match).length;
    return [i + 1, v, ...(byDusun ? dusunNames.map((d) => list.filter((w) => (w.dusun || '') === d && match(w)).length) : []), n, total ? `${((n / total) * 100).toFixed(1)}%` : '0%'];
  });
  body.push(['', 'TOTAL', ...(byDusun ? dusunNames.map((d) => list.filter((w) => (w.dusun || '') === d).length) : []), total, '100%']);
  return { head, body };
}
function viewLaporan(main) {
  state.view = 'laporan';
  if (!state.wargaReady) { main.innerHTML = loadingBox(); return; }
  const cats = categoryFields();
  main.innerHTML = `
  <div class="panel"><h3>${ic('chart')} Rekap per Kategori</h3>
    <p class="muted">Pilih satu atau beberapa kategori, lalu ekspor rekap jumlah warga per nilai (opsional dirinci per dusun) ke PDF atau Excel.</p>
    <div class="form-grid">
      <label class="field"><span>Cakupan data</span><select id="lp-scope"><option value="aktif">Penduduk aktif (tanpa wafat & pindah keluar)</option><option value="all">Semua data tercatat</option></select></label>
      <label class="field"><span>Dusun</span><select id="lp-dusun">${dusunOptions('')}</select></label>
    </div>
    <div class="chips" id="lp-cats">${cats.map((c, i) => `<label class="chip-check"><input type="checkbox" value="${c.key}" ${i < 4 ? 'checked' : ''}><span>${esc(c.label)}</span></label>`).join('')}</div>
    <div class="row-gap"><button class="chip" id="lp-all">Pilih semua</button><button class="chip" id="lp-none">Kosongkan</button><label class="check"><input type="checkbox" id="lp-bydusun" checked> Rinci per dusun</label></div>
    <div class="row-gap"><button class="btn btn-ghost" id="lp-show">${ic('eye')} Tampilkan</button><button class="btn btn-ghost" id="lp-pdf">${ic('file')} Ekspor PDF</button><button class="btn btn-primary" id="lp-xls">${ic('download')} Ekspor Excel</button></div>
    <div id="lp-out"></div>
  </div>
  <div class="panel"><h3>${ic('users')} Ekspor Data Warga per Kategori</h3>
    <p class="muted">Saring data warga berdasarkan dusun dan kategori, lalu ekspor dalam format lengkap atau per modul.</p>
    <div class="form-grid">
      <label class="field"><span>Dusun</span><select id="ex-dusun">${dusunOptions('')}</select></label>
      <label class="field"><span>Kategori</span><select id="ex-field"><option value="">(Semua)</option>${cats.filter((c) => c.key !== 'dusun').map((c) => `<option value="${c.key}">${esc(c.label)}</option>`).join('')}</select></label>
      <label class="field"><span>Nilai</span><input id="ex-value" placeholder="Ketik nilai kategori…"></label>
    </div>
    <p class="muted small" id="ex-count"></p>
    <div class="row-gap"><button class="btn btn-primary" id="ex-go">${ic('download')} Pilih kolom & ekspor…</button><button class="btn btn-ghost" id="ex-all">Ekspor semua per dusun</button></div>
  </div>`;
  const listScope = () => {
    let l = $('#lp-scope').value === 'aktif' ? state.warga.filter(isAktif) : state.warga;
    const d = $('#lp-dusun').value; if (d) l = l.filter((w) => (d === '__none' ? !w.dusun : w.dusun === d));
    return l;
  };
  const selCats = () => $$('#lp-cats input:checked').map((c) => c.value);
  const build = () => { const l = listScope(); const by = $('#lp-bydusun').checked && !$('#lp-dusun').value; return selCats().map((k) => ({ key: k, label: cats.find((c) => c.key === k).label, ...rekap(l, k, by && k !== 'dusun') })); };
  const scopeLabel = () => `${$('#lp-scope').value === 'aktif' ? 'Penduduk aktif' : 'Semua data'}${$('#lp-dusun').value ? ' — ' + ($('#lp-dusun').value === '__none' ? 'Tanpa dusun' : 'Dusun ' + $('#lp-dusun').value) : ''}`;
  $('#lp-all').onclick = () => $$('#lp-cats input').forEach((c) => c.checked = true);
  $('#lp-none').onclick = () => $$('#lp-cats input').forEach((c) => c.checked = false);
  $('#lp-show').onclick = () => {
    const r = build(); if (!r.length) return toast('Pilih kategori', 'error');
    $('#lp-out').innerHTML = r.map((t) => `<h4 class="detail-h">${esc(t.label)}</h4><div class="table-wrap"><table class="table small"><thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.body.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('');
  };
  $('#lp-pdf').onclick = () => { const r = build(); if (!r.length) return toast('Pilih kategori', 'error'); exportPdf({ filename: 'Rekap_Kategori_Penduduk', title: 'Rekapitulasi Penduduk per Kategori', subtitle: scopeLabel(), sections: r.map((t) => ({ heading: t.label, head: t.head, body: t.body })), orientation: r.some((t) => t.head.length > 7) ? 'landscape' : 'portrait', meta: { instansi: instansi() } }).catch((e) => toast(e.message, 'error')); };
  $('#lp-xls').onclick = () => { const r = build(); if (!r.length) return toast('Pilih kategori', 'error'); exportExcel('Rekap_Kategori_Penduduk', r.map((t) => ({ name: t.label, title: `Rekap ${t.label} — ${scopeLabel()}`, head: t.head, body: t.body })), { instansi: instansi() }).catch((e) => toast(e.message, 'error')); };

  const exValue = $('#ex-value');
  attachAutocomplete(exValue, { source: () => { const k = $('#ex-field').value; if (!k) return []; return countBy(state.warga, k).filter((e) => e[0] !== '(Kosong)').map(([v, n]) => ({ label: v, sub: n + ' warga' })); }, onSelect: () => count() });
  const exList = () => {
    let l = state.warga; const d = $('#ex-dusun').value; const k = $('#ex-field').value; const v = exValue.value.trim();
    if (d) l = l.filter((w) => (d === '__none' ? !w.dusun : w.dusun === d));
    if (k && v) l = l.filter((w) => norm(valueOf(w, k)) === norm(v));
    return sortWarga(l, 'dusun');
  };
  const count = () => { $('#ex-count').textContent = `${fmtNum(exList().length)} warga sesuai saringan`; };
  ['#ex-dusun', '#ex-field'].forEach((s) => $(s).onchange = () => { if (s === '#ex-field') exValue.value = ''; count(); });
  exValue.addEventListener('input', debounce(count, 250)); count();
  $('#ex-go').onclick = () => {
    const k = $('#ex-field').value, v = exValue.value.trim(), d = $('#ex-dusun').value;
    const t = ['Data Warga', d && (d === '__none' ? 'Tanpa Dusun' : 'Dusun ' + d), k && v && `${cats.find((c) => c.key === k).label}: ${v}`].filter(Boolean).join(' — ');
    exportWargaDialog(exList(), t);
  };
  $('#ex-all').onclick = () => exportWargaDialog(sortWarga(state.warga, 'dusun'), 'Data Seluruh Warga per Dusun');
}

// ---------------------------------------------------------------- Papan Informasi
function viewInformasi(main, r) {
  state.view = 'informasi';
  main.innerHTML = `<div class="toolbar toolbar-actions"><button class="btn btn-primary" id="i-new">${ic('plus')} Tulis Informasi</button><a class="btn btn-ghost" href="#/informasi" target="_blank">${ic('ext')} Lihat halaman publik</a></div>
  <div class="info-admin">${state.info.map((i) => `<div class="info-row">
    ${i.gambar ? `<img src="${esc(i.gambar)}" alt="">` : `<div class="info-ph">${ic('mega')}</div>`}
    <div class="info-row-main"><div class="info-meta"><span class="badge">${esc(i.kategori || '-')}</span><span class="badge ${i.published ? 'badge-ok' : 'badge-muted'}">${i.published ? 'Terbit' : 'Draf'}</span>${i.pinned ? `<span class="badge badge-warn">${ic('pin')} Disematkan</span>` : ''}${i.broadcastCount ? `<span class="badge">${ic('wa')} ${i.broadcastCount} terkirim</span>` : ''}</div>
      <h4>${esc(i.judul)}</h4><p class="muted small">${esc(fmtDate(i.createdAt, true))}${i.tanggalAcara ? ' • Acara ' + esc(fmtDate(i.tanggalAcara)) : ''}</p></div>
    <div class="info-row-actions"><button class="btn btn-sm btn-wa" data-bc="${i.id}">${ic('wa')} Sebarkan</button><button class="icon-btn" data-copy="${i.id}" title="Salin teks WA">${ic('copy')}</button><button class="icon-btn" data-pin="${i.id}" title="Sematkan">${ic('pin')}</button><button class="icon-btn" data-ed="${i.id}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-del="${i.id}" title="Hapus">${ic('trash')}</button></div>
  </div>`).join('') || emptyBox('Belum ada informasi. Tulis pengumuman, berita kegiatan, atau acara desa pertama Anda.')}</div>`;
  $('#i-new').onclick = () => infoForm(null);
  $$('[data-ed]', main).forEach((b) => b.onclick = () => infoForm(state.info.find((i) => i.id === b.dataset.ed)));
  $$('[data-bc]', main).forEach((b) => b.onclick = () => { location.hash = `#/admin/broadcast?info=${b.dataset.bc}`; });
  $$('[data-copy]', main).forEach((b) => b.onclick = () => copyText(infoMessage(state.info.find((i) => i.id === b.dataset.copy))));
  $$('[data-pin]', main).forEach((b) => b.onclick = () => { const i = state.info.find((x) => x.id === b.dataset.pin); F.updateDoc(C(`informasi/${i.id}`), { pinned: !i.pinned }); });
  $$('[data-del]', main).forEach((b) => b.onclick = async () => { const i = state.info.find((x) => x.id === b.dataset.del); if (await confirmDialog(`Hapus “${i.judul}”?`, { danger: true, okText: 'Hapus' })) { await F.deleteDoc(C(`informasi/${i.id}`)); toast('Informasi dihapus', 'success'); } });
  if (r.query.get('baru')) { history.replaceState(null, '', '#/admin/informasi'); infoForm(null); }
}
function infoForm(i) {
  let gambar = i?.gambar || '';
  const m = modal({
    title: i ? 'Ubah Informasi' : 'Tulis Informasi', size: 'lg',
    body: `<form id="if" class="form-grid">
      <label class="field span-2"><span>Judul *</span><input name="judul" required value="${esc(i?.judul || '')}" placeholder="mis. Gotong Royong Bersih Gampong"></label>
      <label class="field"><span>Kategori</span><input name="kategori" value="${esc(i?.kategori || 'Pengumuman')}" placeholder="Ketik kategori…"></label>
      <label class="field"><span>Tanggal Acara (opsional)</span><input type="date" name="tanggalAcara" value="${esc(i?.tanggalAcara || '')}"></label>
      <label class="field"><span>Waktu</span><input name="waktu" value="${esc(i?.waktu || '')}" placeholder="mis. 08.00 WIB – selesai"></label>
      <label class="field"><span>Lokasi</span><input name="lokasi" value="${esc(i?.lokasi || '')}" placeholder="mis. Meunasah / Balai Desa"></label>
      <label class="field span-2"><span>Isi * <small class="muted">— format WhatsApp: *tebal*, _miring_, ~coret~</small></span><textarea name="isi" rows="9" required>${esc(i?.isi || '')}</textarea></label>
      <div class="field span-2"><span>Gambar (opsional)</span><div class="img-pick"><div id="if-prev">${gambar ? `<img src="${esc(gambar)}" alt="">` : ''}</div><label class="btn btn-ghost btn-sm">${ic('upload')} Pilih gambar<input type="file" accept="image/*" id="if-img" hidden></label><button type="button" class="btn btn-ghost btn-sm" id="if-noimg" ${gambar ? '' : 'hidden'}>Hapus gambar</button></div><small class="muted">Gambar dikompres otomatis dan disimpan di Firestore (tanpa Firebase Storage).</small></div>
      <label class="check"><input type="checkbox" name="published" ${i ? (i.published ? 'checked' : '') : 'checked'}> Terbitkan di halaman publik</label>
      <label class="check"><input type="checkbox" name="pinned" ${i?.pinned ? 'checked' : ''}> Sematkan di atas</label>
    </form>
    <details class="fieldset"><summary>Pratinjau pesan WhatsApp</summary><div class="wa-preview" id="if-wa"></div></details>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-ghost" id="if-save">Simpan</button><button class="btn btn-wa" id="if-bc">${ic('wa')} Simpan & Sebarkan</button>`,
  });
  const form = $('#if', m.el);
  attachAutocomplete(form.elements.kategori, { source: () => masterItems('kategoriInfo'), smallList: 12 });
  const collect = () => ({ judul: form.elements.judul.value.trim(), kategori: form.elements.kategori.value.trim(), tanggalAcara: form.elements.tanggalAcara.value, waktu: form.elements.waktu.value.trim(), lokasi: form.elements.lokasi.value.trim(), isi: form.elements.isi.value.trim(), gambar, published: form.elements.published.checked, pinned: form.elements.pinned.checked });
  const prev = () => { $('#if-wa', m.el).innerHTML = waFormat(infoMessage({ ...collect(), id: i?.id || 'ID' })); };
  form.addEventListener('input', debounce(prev, 200)); prev();
  $('#if-img', m.el).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { gambar = await compressImage(f); $('#if-prev', m.el).innerHTML = `<img src="${gambar}" alt="">`; $('#if-noimg', m.el).hidden = false; }
    catch (err) { toast(err.message, 'error'); }
  };
  $('#if-noimg', m.el).onclick = () => { gambar = ''; $('#if-prev', m.el).innerHTML = ''; $('#if-noimg', m.el).hidden = true; };
  const save = async (thenBc) => {
    const d = collect();
    if (!d.judul || !d.isi) return toast('Judul dan isi wajib diisi', 'error');
    try {
      if (d.kategori && !masterItems('kategoriInfo').some((x) => norm(x) === norm(d.kategori))) await F.setDoc(C('master/kategoriInfo'), { items: F.arrayUnion(d.kategori), label: MASTER_EXTRA_LABELS.kategoriInfo }, { merge: true });
      let id = i?.id;
      if (i) await F.updateDoc(C(`informasi/${id}`), { ...d, updatedAt: F.serverTimestamp() });
      else { const ref = await F.addDoc(F.collection(F.db, 'informasi'), { ...d, createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp() }); id = ref.id; }
      m.close(); toast('Informasi tersimpan', 'success');
      if (thenBc) location.hash = `#/admin/broadcast?info=${id}`;
    } catch (err) { toast('Gagal menyimpan: ' + err.message, 'error'); }
  };
  $('#if-save', m.el).onclick = () => save(false);
  $('#if-bc', m.el).onclick = () => save(true);
}

// ---------------------------------------------------------------- Broadcast WhatsApp
const bcState = { sent: new Set(), key: '' };
function viewBroadcast(main, r) {
  state.view = 'broadcast';
  if (!state.wargaReady) { main.innerHTML = loadingBox(); return; }
  const q = r.query;
  const info = q.get('info') ? state.info.find((x) => x.id === q.get('info')) : null;
  if (q.get('info') && !info) { main.innerHTML = loadingBox(); return; }
  const key = location.hash;
  if (bcState.key !== key) { bcState.key = key; bcState.sent = new Set(); bcState.msg = info ? infoMessage(info) : (bcState.msg || `Assalamu'alaikum {nama},\n\n`); bcState.target = q.get('target') || 'all'; bcState.dusun = q.get('dusun') || ''; }
  const ids = q.get('target') === 'ids' ? new Set(JSON.parse(sessionStorage.getItem('bc:ids') || '[]')) : null;
  const recipients = () => {
    let list;
    const t = bcState.target;
    if (t === 'kadus') list = state.dusun.filter((d) => d.kepalaHp).map((d) => ({ id: 'kadus-' + d.id, nama: d.kepalaNama || 'Kepala Dusun', noHp: d.kepalaHp, dusun: d.nama, role: 'Kadus' }));
    else {
      let w = state.warga.filter(isAktif);
      if (t === 'ids' && ids) w = state.warga.filter((x) => ids.has(x.id));
      if (t === 'dusun') w = w.filter((x) => x.dusun === bcState.dusun);
      if (t === 'kk') w = w.filter((x) => norm(x.shdk) === 'kepala keluarga');
      list = w.map((x) => ({ id: x.id, nama: x.nama, noHp: x.noHp, dusun: x.dusun }));
    }
    const seen = new Set();
    return list.filter((x) => { const n = waNumber(x.noHp); if (!n || seen.has(n)) return false; seen.add(n); return true; });
  };
  const personal = (rc) => bcState.msg.replace(/\{nama\}/g, rc.nama || '').replace(/\{dusun\}/g, rc.dusun || '');
  main.innerHTML = `<div class="bc">
    <div class="panel">
      <h3>${ic('wa')} Pesan WhatsApp ${info ? `— <span class="muted">${esc(info.judul)}</span>` : ''}</h3>
      <label class="field"><span>Isi pesan <small class="muted">— gunakan {nama} dan {dusun} untuk personalisasi</small></span><textarea id="bc-msg" rows="11">${esc(bcState.msg)}</textarea></label>
      <div class="row-gap"><button class="btn btn-ghost btn-sm" id="bc-copy">${ic('copy')} Salin pesan</button><a class="btn btn-ghost btn-sm" id="bc-share" target="_blank" rel="noopener">${ic('send')} Kirim ke Grup / Kontak lain</a></div>
      <details class="fieldset"><summary>Pratinjau</summary><div class="wa-preview" id="bc-prev"></div></details>
      <div class="callout small-callout">${ic('wa')}<div><p class="small">WhatsApp tidak mengizinkan pengiriman massal otomatis tanpa WhatsApp Business API berbayar. Di sini setiap pesan dibuka di WhatsApp dengan nomor & teks terisi — Anda cukup menekan <b>Kirim</b>. Untuk menjangkau banyak warga sekaligus, gunakan tombol <b>Kirim ke Grup</b> ke grup WhatsApp desa.</p></div></div>
    </div>
    <div class="panel">
      <h3>Penerima</h3>
      <div class="form-grid">
        <label class="field"><span>Kirim ke</span><select id="bc-target">
          <option value="all">Semua warga aktif</option><option value="kk">Kepala keluarga saja</option><option value="dusun">Warga satu dusun</option><option value="kadus">Semua kepala dusun</option>${ids ? `<option value="ids">Warga terpilih / hasil saringan (${ids.size})</option>` : ''}
        </select></label>
        <label class="field" id="bc-dusun-wrap" ${bcState.target === 'dusun' ? '' : 'hidden'}><span>Dusun</span><select id="bc-dusun">${dusunOptions(bcState.dusun, { all: false, none: false })}</select></label>
      </div>
      <div class="bc-progress" id="bc-progress"></div>
      <div class="row-gap"><button class="btn btn-wa" id="bc-next">${ic('wa')} Buka pesan berikutnya</button><button class="btn btn-ghost btn-sm" id="bc-reset">Ulangi dari awal</button></div>
      <ul class="bc-list" id="bc-list"></ul>
    </div></div>`;
  const msgEl = $('#bc-msg');
  const draw = () => {
    const list = recipients();
    const done = list.filter((x) => bcState.sent.has(x.id)).length;
    $('#bc-progress').innerHTML = `<div class="progress"><span style="width:${list.length ? (done / list.length) * 100 : 0}%"></span></div><p class="small muted">${done} dari ${list.length} penerima sudah dibuka • nomor ganda & tanpa HP dilewati</p>`;
    $('#bc-list').innerHTML = list.map((x) => `<li class="${bcState.sent.has(x.id) ? 'done' : ''}"><div><b>${esc(x.nama)}</b><small>${esc([x.role, x.dusun && 'Dusun ' + x.dusun, x.noHp].filter(Boolean).join(' • '))}</small></div><a class="btn btn-sm ${bcState.sent.has(x.id) ? 'btn-ghost' : 'btn-wa'}" data-send="${x.id}" href="${esc(waLink(x.noHp, personal(x)))}" target="_blank" rel="noopener">${bcState.sent.has(x.id) ? ic('check') + ' Terbuka' : ic('wa') + ' Kirim'}</a></li>`).join('') || `<li>${emptyBox('Tidak ada penerima dengan nomor HP.')}</li>`;
    $$('[data-send]').forEach((a) => a.addEventListener('click', () => { bcState.sent.add(a.dataset.send); markInfo(); setTimeout(draw, 50); }));
    $('#bc-share').href = waShareLink(bcState.msg.replace(/\{nama\}/g, 'Bapak/Ibu').replace(/\{dusun\}/g, ''));
    $('#bc-prev').innerHTML = waFormat(personal(list[0] || { nama: 'Bapak/Ibu', dusun: '' }));
  };
  const markInfo = debounce(() => { if (info) F.updateDoc(C(`informasi/${info.id}`), { broadcastCount: bcState.sent.size, lastBroadcast: F.serverTimestamp() }).catch(() => {}); }, 1500);
  $('#bc-target').value = bcState.target;
  $('#bc-target').onchange = (e) => { bcState.target = e.target.value; $('#bc-dusun-wrap').hidden = bcState.target !== 'dusun'; if (bcState.target === 'dusun' && !bcState.dusun) bcState.dusun = state.dusun[0]?.nama || ''; draw(); };
  $('#bc-dusun').onchange = (e) => { bcState.dusun = e.target.value; draw(); };
  msgEl.addEventListener('input', debounce(() => { bcState.msg = msgEl.value; draw(); }, 250));
  $('#bc-copy').onclick = () => copyText(bcState.msg);
  $('#bc-reset').onclick = () => { bcState.sent.clear(); draw(); };
  $('#bc-next').onclick = () => {
    const nx = recipients().find((x) => !bcState.sent.has(x.id));
    if (!nx) return toast('Semua penerima sudah dibuka', 'success');
    bcState.sent.add(nx.id); markInfo(); window.open(waLink(nx.noHp, personal(nx)), '_blank', 'noopener'); draw();
  };
  draw();
}

// ---------------------------------------------------------------- Instagram
async function syncInstagram({ silent = false } = {}) {
  const s = await F.getDoc(C('private/instagram'));
  let { token, tokenUpdatedAt } = s.data() || {};
  if (!token) { if (!silent) toast('Isi Access Token Instagram terlebih dahulu', 'error'); return 0; }
  // Perpanjang token (berlaku 60 hari) bila sudah > 7 hari
  const age = Date.now() - (toDate(tokenUpdatedAt)?.getTime() || 0);
  if (age > 7 * 864e5) {
    try {
      const rr = await fetch(`${IG_GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
      const j = await rr.json();
      if (j.access_token) { token = j.access_token; await F.setDoc(C('private/instagram'), { token, tokenUpdatedAt: F.serverTimestamp(), expiresIn: j.expires_in || null }, { merge: true }); }
    } catch (e) { console.warn('refresh token', e); }
  }
  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username';
  const res = await fetch(`${IG_GRAPH}/me/media?fields=${fields}&limit=50&access_token=${encodeURIComponent(token)}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'Token tidak valid');
  const posts = json.data || [];
  await batchWrite(posts.map((p) => ['set', C(`instagram/${p.id}`), clean({ caption: p.caption || '', mediaType: p.media_type, mediaUrl: p.media_url || '', thumbnail: p.thumbnail_url || '', permalink: p.permalink, timestamp: p.timestamp, username: p.username, source: 'api', syncedAt: F.serverTimestamp() }), { merge: true }]));
  const username = posts[0]?.username;
  await F.setDoc(C('config/app'), clean({ igLastSync: F.serverTimestamp(), igUsername: state.config.igUsername || username }), { merge: true });
  if (!silent) toast(`${posts.length} postingan Instagram disinkronkan`, 'success');
  return posts.length;
}
async function autoSyncInstagram() {
  if (!state.isAdmin) return;
  const last = toDate(state.config.igLastSync)?.getTime() || 0;
  if (Date.now() - last < 3 * 3600e3) return;
  try { await syncInstagram({ silent: true }); } catch (e) { console.warn('IG auto-sync', e); }
}
function viewInstagram(main) {
  state.view = 'instagram';
  main.innerHTML = `
  <div class="panel"><h3>${ic('ig')} Integrasi Instagram</h3>
    <p class="muted">Postingan yang diunggah admin ke Instagram desa otomatis tampil di halaman <b>Highlight</b> situs ini. Sinkronisasi berjalan otomatis saat admin membuka dasbor (setiap 3 jam) dan — bila GitHub Actions diaktifkan — setiap jam di server.</p>
    <form id="ig-form" class="form-grid">
      <label class="field"><span>Username Instagram</span><div class="input-group"><span class="addon">@</span><input name="username" value="${esc(state.config.igUsername || '')}" placeholder="namadesa"></div></label>
      <label class="field"><span>Access Token (Instagram API with Instagram Login)</span><input name="token" type="password" placeholder="IGAA… (kosongkan bila tidak diubah)" autocomplete="off"></label>
    </form>
    <div class="row-gap"><button class="btn btn-primary" id="ig-save">Simpan</button><button class="btn btn-ghost" id="ig-sync">${ic('refresh')} Sinkronkan sekarang</button><span class="muted small">Sinkron terakhir: ${esc(fmtDate(state.config.igLastSync, true) || 'belum pernah')}</span></div>
    <details class="fieldset"><summary>Cara mendapatkan Access Token</summary><ol class="steps small">
      <li>Ubah akun Instagram desa menjadi akun <b>Profesional</b> (Bisnis / Kreator).</li>
      <li>Buka <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener">developers.facebook.com/apps</a> → Buat Aplikasi → pilih kasus penggunaan <b>Instagram</b> (“Manage messaging & content on Instagram”).</li>
      <li>Di menu <b>Instagram → API setup with Instagram login</b>, tambahkan akun Instagram desa lalu klik <b>Generate token</b>.</li>
      <li>Salin token (berawalan <code>IG</code>) dan tempel di kolom di atas. Token berlaku 60 hari dan diperpanjang otomatis oleh aplikasi.</li>
    </ol></details>
  </div>
  <div class="panel"><div class="master-head"><h3>Postingan (${state.ig.length})</h3><button class="btn btn-ghost btn-sm" id="ig-manual">${ic('plus')} Tambah manual</button></div>
    <p class="muted small">Klik mata untuk menyembunyikan/menampilkan di highlight, pin untuk menyematkan di depan.</p>
    <div class="ig-grid admin">${state.ig.map((p) => `<div class="ig-admin ${p.hidden ? 'is-hidden' : ''}">${igPostCard(p)}<div class="ig-tools"><button class="icon-btn" data-hide="${p.id}" title="${p.hidden ? 'Tampilkan' : 'Sembunyikan'}">${ic('eye')}</button><button class="icon-btn ${p.pinned ? 'on' : ''}" data-pin="${p.id}" title="Sematkan">${ic('pin')}</button><button class="icon-btn danger" data-del="${p.id}" title="Hapus dari situs">${ic('trash')}</button></div></div>`).join('') || emptyBox('Belum ada postingan. Simpan token lalu klik Sinkronkan, atau tambah manual.')}</div>
  </div>`;
  $('#ig-save').onclick = async () => {
    const f = $('#ig-form'); const u = f.elements.username.value.trim().replace(/^@/, ''); const t = f.elements.token.value.trim();
    try {
      await F.setDoc(C('config/app'), { igUsername: u }, { merge: true });
      if (t) await F.setDoc(C('private/instagram'), { token: t, tokenUpdatedAt: F.serverTimestamp() }, { merge: true });
      toast('Pengaturan Instagram disimpan', 'success');
      if (t) await syncInstagram();
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
  $('#ig-sync').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; try { await syncInstagram(); } catch (err) { toast('Sinkronisasi gagal: ' + err.message, 'error'); } b.disabled = false; };
  $$('[data-hide]', main).forEach((b) => b.onclick = () => { const p = state.ig.find((x) => x.id === b.dataset.hide); F.updateDoc(C(`instagram/${p.id}`), { hidden: !p.hidden }); });
  $$('[data-pin]', main).forEach((b) => b.onclick = () => { const p = state.ig.find((x) => x.id === b.dataset.pin); F.updateDoc(C(`instagram/${p.id}`), { pinned: !p.pinned }); });
  $$('[data-del]', main).forEach((b) => b.onclick = async () => { if (await confirmDialog('Hapus postingan ini dari situs? (Tidak menghapus di Instagram. Postingan dari API akan muncul lagi saat sinkronisasi; gunakan “sembunyikan” untuk menyembunyikan permanen.)', { danger: true, okText: 'Hapus' })) F.deleteDoc(C(`instagram/${b.dataset.del}`)); });
  $('#ig-manual').onclick = () => {
    let img = '';
    const m = modal({ title: 'Tambah Postingan Manual', body: `<div class="form-grid"><label class="field span-2"><span>Tautan postingan Instagram *</span><input id="mp-link" placeholder="https://www.instagram.com/p/…"></label><label class="field span-2"><span>Keterangan</span><textarea id="mp-cap" rows="3"></textarea></label><div class="field span-2"><span>Gambar *</span><div class="img-pick"><div id="mp-prev"></div><label class="btn btn-ghost btn-sm">${ic('upload')} Pilih gambar<input type="file" accept="image/*" id="mp-img" hidden></label></div></div></div>`, footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="mp-ok">Simpan</button>' });
    $('#mp-img', m.el).onchange = async (e) => { try { img = await compressImage(e.target.files[0], 900); $('#mp-prev', m.el).innerHTML = `<img src="${img}" alt="">`; } catch (err) { toast(err.message, 'error'); } };
    $('#mp-ok', m.el).onclick = async () => {
      const link = $('#mp-link', m.el).value.trim();
      if (!/^https:\/\/(www\.)?instagram\.com\//.test(link) || !img) return toast('Isi tautan Instagram yang valid dan pilih gambar', 'error');
      await F.addDoc(F.collection(F.db, 'instagram'), { permalink: link, caption: $('#mp-cap', m.el).value.trim(), mediaUrl: img, mediaType: 'IMAGE', timestamp: new Date().toISOString(), source: 'manual' });
      m.close(); toast('Postingan ditambahkan', 'success');
    };
  };
}

// ---------------------------------------------------------------- Pengaturan
function viewPengaturan(main) {
  state.view = 'form';
  const c = state.config; const w = c.wilayah || {};
  main.innerHTML = `
  <div class="panel"><h3>${ic('home')} Profil Desa</h3>
    <form id="pf" class="form-grid">
      <label class="field"><span>Sebutan</span><select name="jenisDesa">${['Desa', 'Gampong', 'Kelurahan', 'Nagari', 'Kampung', 'Pekon', 'Lembang', 'Negeri'].map((j) => `<option ${desaJenis() === j ? 'selected' : ''}>${j}</option>`).join('')}</select></label>
      <label class="field"><span>Nama Desa / Gampong *</span><input name="namaDesa" value="${esc(c.namaDesa || '')}" placeholder="mis. Lampineung"></label>
      <label class="field"><span>Provinsi</span><input id="pw_0" value="${esc(w.provinsi || '')}" data-id="${esc(w.provinsiId || '')}" placeholder="Ketik provinsi…"></label>
      <label class="field"><span>Kabupaten / Kota</span><input id="pw_1" value="${esc(w.kabupaten || '')}" data-id="${esc(w.kabupatenId || '')}" placeholder="Ketik kabupaten/kota…"></label>
      <label class="field"><span>Kecamatan</span><input id="pw_2" value="${esc(w.kecamatan || '')}" data-id="${esc(w.kecamatanId || '')}" placeholder="Ketik kecamatan…"></label>
      <label class="field"><span>Kelurahan / Gampong</span><input id="pw_3" value="${esc(w.kelurahan || '')}" data-id="${esc(w.kelurahanId || '')}" placeholder="Ketik kelurahan/gampong…"></label>
      <label class="field"><span>Kepala Desa / Keuchik</span><input name="kepalaDesa" value="${esc(c.kepalaDesa || '')}"></label>
      <label class="field"><span>No. WhatsApp Kantor Desa</span><input name="telepon" type="tel" value="${esc(c.telepon || '')}"></label>
      <label class="field"><span>Email Desa</span><input name="emailDesa" type="email" value="${esc(c.emailDesa || '')}"></label>
      <label class="field"><span>Slogan / Tagline</span><input name="tagline" value="${esc(c.tagline || '')}"></label>
      <label class="field span-2"><span>Alamat Kantor</span><input name="alamatKantor" value="${esc(c.alamatKantor || '')}"></label>
      <label class="field span-2"><span>Deskripsi singkat (beranda)</span><textarea name="deskripsi" rows="2">${esc(c.deskripsi || '')}</textarea></label>
      <label class="field span-2"><span>Penutup pesan WhatsApp</span><input name="waFooter" value="${esc(c.waFooter || '')}" placeholder="mis. Hormat kami, Pemerintah Gampong …"></label>
      <div class="field span-2"><span>Logo desa</span><div class="img-pick"><div id="logo-prev">${c.logo ? `<img src="${esc(c.logo)}" alt="">` : ''}</div><label class="btn btn-ghost btn-sm">${ic('upload')} Pilih logo<input type="file" accept="image/*" id="logo-in" hidden></label><button type="button" class="btn btn-ghost btn-sm" id="logo-rm">Hapus logo</button></div></div>
    </form>
    <div class="row-gap"><button class="btn btn-primary" id="pf-save">${ic('check')} Simpan Profil</button></div>
  </div>
  <div class="panel-grid two">
    <div class="panel"><h3>${ic('lock')} Ubah Password</h3>
      <form id="pwf" class="form-stack">
        <label class="field"><span>Password saat ini</span><input type="password" name="cur" autocomplete="current-password" required></label>
        <label class="field"><span>Password baru</span><input type="password" name="nw" autocomplete="new-password" minlength="8" required></label>
        <label class="field"><span>Ulangi password baru</span><input type="password" name="nw2" autocomplete="new-password" required></label>
        <button class="btn btn-primary">Ubah Password</button>
      </form></div>
    <div class="panel"><h3>${ic('send')} Ubah Email Admin</h3>
      <p class="muted small">Email saat ini: <b>${esc(state.user?.email || '')}</b>. Tautan verifikasi akan dikirim ke email baru; setelah diklik, masuk kembali cukup dengan password yang sama.</p>
      ${c.pendingEmail ? `<p class="callout small-callout">Menunggu verifikasi: <b>${esc(c.pendingEmail)}</b></p>` : ''}
      <form id="emf" class="form-stack">
        <label class="field"><span>Email baru</span><input type="email" name="email" required></label>
        <label class="field"><span>Password saat ini</span><input type="password" name="cur" autocomplete="current-password" required></label>
        <button class="btn btn-primary">Kirim Verifikasi</button>
      </form></div>
  </div>
  <div class="panel-grid two">
    <div class="panel"><h3>${ic('db')} Cadangan Data</h3>
      <p class="muted small">Unduh seluruh data (warga, dusun, master, informasi) sebagai berkas JSON.</p>
      <div class="row-gap"><button class="btn btn-ghost" id="bk">${ic('download')} Unduh Cadangan JSON</button><button class="btn btn-ghost" id="bk-xls">${ic('download')} Seluruh Warga (Excel)</button></div>
      <h4 class="detail-h danger-text">Zona Berbahaya</h4>
      <button class="btn btn-danger btn-ghost" id="wipe">${ic('trash')} Hapus semua data warga</button></div>
    <div class="panel"><h3>Tentang Aplikasi</h3>
      <dl class="detail"><dt>Aplikasi</dt><dd>${APP.fullName}</dd><dt>Versi</dt><dd>v${APP.version} (build ${APP.build})</dd><dt>Database</dt><dd>Firebase Firestore • proyek digides-8423e</dd><dt>PWA</dt><dd>${navigator.serviceWorker?.controller ? 'Aktif — bisa dipakai offline' : 'Siap dipasang'}</dd><dt>Hak cipta</dt><dd>${APP.copyright}</dd></dl>
      <button class="btn btn-ghost btn-sm" id="chk-upd">${ic('refresh')} Periksa pembaruan</button></div>
  </div>`;
  const pf = $('#pf');
  const wil = [0, 1, 2, 3].map((i) => $('#pw_' + i));
  bindWilayahChain(wil);
  let logo = c.logo || '';
  $('#logo-in').onchange = async (e) => { try { logo = await compressImage(e.target.files[0], 256, 0.85); $('#logo-prev').innerHTML = `<img src="${logo}" alt="">`; } catch (err) { toast(err.message, 'error'); } };
  $('#logo-rm').onclick = () => { logo = ''; $('#logo-prev').innerHTML = ''; };
  $('#pf-save').onclick = async () => {
    const d = Object.fromEntries(['jenisDesa', 'namaDesa', 'kepalaDesa', 'telepon', 'emailDesa', 'tagline', 'alamatKantor', 'deskripsi', 'waFooter'].map((k) => [k, pf.elements[k].value.trim()]));
    if (!d.namaDesa) return toast('Nama desa wajib diisi', 'error');
    d.telepon = normalizePhone(d.telepon);
    d.wilayah = { provinsi: wil[0].value.trim(), provinsiId: wil[0].dataset.id || '', kabupaten: wil[1].value.trim(), kabupatenId: wil[1].dataset.id || '', kecamatan: wil[2].value.trim(), kecamatanId: wil[2].dataset.id || '', kelurahan: wil[3].value.trim(), kelurahanId: wil[3].dataset.id || '' };
    d.logo = logo;
    try { await F.setDoc(C('config/app'), d, { merge: true }); toast('Profil desa disimpan', 'success'); } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
  const reauth = (pw) => F.reauthenticateWithCredential(F.auth.currentUser, F.EmailAuthProvider.credential(F.auth.currentUser.email, pw));
  $('#pwf').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target;
    if (f.elements.nw.value.length < 8) return toast('Password baru minimal 8 karakter', 'error');
    if (f.elements.nw.value !== f.elements.nw2.value) return toast('Konfirmasi password tidak sama', 'error');
    try { await reauth(f.elements.cur.value); await F.updatePassword(F.auth.currentUser, f.elements.nw.value); f.reset(); toast('Password berhasil diubah', 'success'); }
    catch (err) { toast(authErrorMessage(err), 'error'); }
  };
  $('#emf').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target; const em = f.elements.email.value.trim();
    if (em === F.auth.currentUser.email) return toast('Email baru sama dengan email saat ini', 'error');
    try {
      await reauth(f.elements.cur.value);
      await F.verifyBeforeUpdateEmail(F.auth.currentUser, em);
      await F.setDoc(C('config/app'), { pendingEmail: em }, { merge: true });
      f.reset(); toast(`Tautan verifikasi dikirim ke ${em}. Buka email tersebut dan klik tautannya.`, 'success', { duration: 9000 });
    } catch (err) { toast(authErrorMessage(err), 'error'); }
  };
  $('#bk').onclick = async () => {
    const dump = { app: APP.name, version: APP.version, exportedAt: new Date().toISOString() };
    for (const col of ['warga', 'dusun', 'master', 'informasi', 'instagram', 'config']) {
      const s = await F.getDocs(F.collection(F.db, col)); dump[col] = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    downloadBlob(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }), `cadangan-digides-${todayISO()}.json`);
  };
  $('#bk-xls').onclick = () => exportWarga({ list: sortWarga(state.warga, 'dusun'), cols: allFields().map((f) => f.key), title: 'Data Lengkap Seluruh Warga', group: false, fmt: 'xls' }).catch((e) => toast(e.message, 'error'));
  $('#wipe').onclick = async () => {
    const t = await promptDialog('Hapus semua data warga', `Ketik HAPUS untuk menghapus ${state.warga.length} data warga secara permanen`, '', { okText: 'Hapus permanen' });
    if (t !== 'HAPUS') return;
    try { await batchWrite(state.warga.map((w) => ['delete', C(`warga/${w.id}`)])); toast('Semua data warga dihapus', 'success'); } catch (e) { toast(e.message, 'error'); }
  };
  $('#chk-upd').onclick = async () => { if (!state.swReg) return toast('Service worker belum aktif', 'error'); await state.swReg.update(); toast(state.swReg.waiting ? 'Pembaruan tersedia' : `Anda memakai versi terbaru (v${APP.version})`, 'info'); };
}

boot();
