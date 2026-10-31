// =============================================================
//  Serenity — aplikasi utama (SPA, hash routing)
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import { APP, IG_GRAPH } from './config.js';
import {
  FIELDS, GROUPS, DEFAULT_MASTER, MASTER_EXTRA_LABELS, AGE_GROUPS, ageGroup,
  mapHeaders, ageFromDate, parseAlamat, canonical, slugify, normKey,
} from './fields.js';
import {
  esc, $, $$, norm, debounce, todayISO, toDate, fmtDate, fmtRp, fmtNum, waNumber, waLink, waShareLink,
  normalizePhone, waFormat, toast, modal, confirmDialog, promptDialog, attachAutocomplete,
  copyText, compressImage, authErrorMessage, parseNum, fmtThousand, bindThousands, setViewerCheck, humanErr, startAutoHints,
} from './ui.js';
import { bindWilayahChain } from './wilayah.js';
import { exportExcel, exportPdf, getXLSX } from './exporter.js';
import {
  F, ic, state, C, clean, desaName, desaJenis, jenisLabel, instansi, appLink, emptyBox, loadingBox, batchWrite,
  isSuper, isKadus, myDusun, avatar, penulisNow, penulisLabel, confirmDelete, can, ROLE_LABEL, logAudit, diff, requirePassword, insightsFromStats, pct, loginFailed,
  cfgUpdate, isPengelola, hasGreen,
  PERMS,
} from './core.js';
import * as Sync from './sync.js';
import { mountChat, unmountChat } from './chat.js';
import { setMarqueeTitle } from './title.js';
import { navIndex, navSearchHtml, bindNavSearch, viewViewAs, viewAsBar, startReadOnly, stopReadOnly } from './navtools.js';
import { readerPage, readMins } from './reader.js';
import { recordVisit, startPresence, stopPresence, mountVisitorWidget, unmountVisitorWidget, startUsageFlush, flushUsage } from './analytics.js';
import { lembagaNewsPanel, startNewsScroller, viewWidget, widgetCfg } from './widgets.js';
import { viewMonitor } from './monitor.js';
import { scanIcons } from './motion.js';
import { badgeRow } from './badges.js';
import { viewTampilan, viewLatar } from './tampilan.js';
import { richRender, bindRich, htmlToWa, plainText, mediaEmbed, mediaThumb, parseMediaLines, mediaLinesText, FONTS, fontOptions, loadAllFonts } from './rich.js';
import { applyTheme, applyIcon, applyBackground, ordered, makeSortable, guard, setupExitGuards, startTicker, tickerStyle, isLite, litePref, setLitePref } from './layout.js';
import { KATEGORI, renderLembagaPublic, bindLembagaPublic, renderDokumenPublic, bindDokumenPublic, viewLembagaAdmin, viewDokumenAdmin, lembagaOf } from './lembaga.js';
import { PAGES, pageLabel, renderPubPage, renderInfografis, renderDataPortal, statHref, dataPortalCards, donut, bindDataPortal, sholatPanel, kegiatanPanel, startPublicTickers, viewProfilAdmin, viewKegiatanAdmin, sholatSettingsForm, renderKegiatanPublic } from './cms.js';
import { viewAdmins, viewAudit, viewCadangan, openSuperLogin, checkBackupReminder } from './security.js';

const root = document.getElementById('app');

// ---------------------------------------------------------------- field helpers
// Kelompok formulir yang sah untuk kategori dropdown (bisa dipindah di Data Master)
const FORM_GROUPS = GROUPS.map((g) => g.id);
function customFields() {
  return Object.values(state.master).filter((m) => m.custom && !m.deleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((m) => ({ key: m.key, label: m.label, group: FORM_GROUPS.includes(m.group) ? m.group : 'tambahan', type: 'select', master: m.key, aliases: [normKey(m.label)] }));
}
// Kolom bawaan: kategori dropdown yang dihapus (disembunyikan) di Data Master tidak tampil di formulir;
// kategori yang dipindah kelompok mengikuti kelompok barunya
function builtinFields() {
  return FIELDS.filter((f) => !(f.type === 'select' && state.master[f.key]?.deleted))
    .map((f) => { const g = f.type === 'select' ? state.master[f.key]?.group : ''; return g && g !== f.group && FORM_GROUPS.includes(g) ? { ...f, group: g } : f; });
}
const allFields = () => [...builtinFields(), ...customFields()];
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
// Konsol browser: pesan teknis hanya ditampilkan untuk Super Admin (dan di komputer pengembang)
function quietConsole() {
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  const orig = {}; ['log', 'info', 'warn', 'debug', 'error'].forEach((k) => { orig[k] = console[k].bind(console); console[k] = (...a) => { if (isSuper()) orig[k](...a); }; });
}
function boot() {
  setViewerCheck(() => isSuper());
  quietConsole();
  startAutoHints();
  if (F.configError) { renderConfigError(); return; }
  // v2.4: semua data publik lewat Sinkron Bertahap → kunjungan berikutnya hanya membaca yang berubah
  Sync.startPublic();
  Sync.watch({ id: 'config:app', scope: 'pub', doc: 'config/app', onData: (d) => { state.config = d || {}; state.cfgLoaded = true; applyTheme(state.config.tema, { fromServer: true }); applyIcon(state.config.ikon, state.config.namaDesa ? `${desaJenis()} ${desaName()}` : ''); applyBranding(); saveBrandCache(); if (cfgWaiting) { cfgWaiting = false; render(); return; } softRerender(['public', 'dash', 'shell']); if (state.view !== 'public') applyBackground(null); } });
  Sync.watch({ id: 'config:stats', scope: 'pub', doc: 'config/stats', onData: (d) => { state.stats = d || {}; softRerender(['public']); } });
  Sync.watch({ id: 'instagram', scope: 'pub', col: 'instagram', limit: 150, onData: (list) => {
    state.ig = list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
    softRerender(['public', 'instagram']);
  } });
  Sync.watch({ id: 'halaman', scope: 'pub', col: 'halaman', limit: 50, onData: (list) => { const h = {}; list.forEach(({ id, ...d }) => { h[id] = d; }); state.halaman = h; softRerender(['public']); } });
  Sync.watch({ id: 'kegiatan', scope: 'pub', col: 'kegiatan', limit: 150, onData: (list) => {
    state.kegiatan = list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.nama).localeCompare(String(b.nama)));
    softRerender(['public', 'kegiatan']);
  } });
  startUsageFlush(() => state.isAdmin);
  subscribeInfo(false);
  subscribeLembaga(false);

  F.onAuthStateChanged(F.auth, async (user) => {
    state.user = user;
    if (user) {
      const u = await ensureUser(user);
      if (u && u.active !== false) {
        state.isAdmin = true; state.profile = u; state.role = u.role; state.perms = u.perms || {};
        startAdmin();
        if (sessionStorage.getItem('dd:justLogin')) {
          const fails = Number(localStorage.getItem('dd:fails') || 0);
          sessionStorage.removeItem('dd:justLogin'); localStorage.removeItem('dd:fails');
          logAudit('auth', 'login', `Login sebagai ${ROLE_LABEL[u.role] || u.role}`, { detail: fails ? `${fails} percobaan login gagal sebelumnya di perangkat ini` : '' });
        }
      } else {
        state.isAdmin = false;
        await F.signOut(F.auth);
        toast(u?.active === false ? 'Akun Anda dinonaktifkan oleh Super Admin.' : 'Akun ini belum didaftarkan oleh Super Admin.', 'error', { duration: 8000 });
      }
    } else {
      state.isAdmin = false; state.profile = null; state.role = ''; state.perms = {}; stopAdmin();
    }
    state.authReady = true;
    render();
  });

  window.addEventListener('hashchange', onHashChange);
  setupExitGuards();
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.deferredPrompt = e; $$('[data-install]').forEach((b) => b.hidden = false); });
  window.addEventListener('appinstalled', () => { state.deferredPrompt = null; $$('[data-install]').forEach((b) => b.hidden = true); toast('Aplikasi berhasil dipasang', 'success'); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-install], [data-install-menu]');
    if (b && state.deferredPrompt) { state.deferredPrompt.prompt(); state.deferredPrompt.userChoice.finally(() => { state.deferredPrompt = null; }); }
    else if (b?.hasAttribute('data-install-menu')) installHelp();
  });
  // Klik 5x pada tulisan copyright → login Super Admin
  let clicks = [];
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-copyright]')) return;
    const now = Date.now(); clicks = clicks.filter((t) => now - t < 3000); clicks.push(now);
    if (clicks.length >= 5) { clicks = []; if (state.isAdmin && isSuper()) location.hash = '#/admin'; else openSuperLogin(); }
  });
  setupIdleLogout();
  render();
  registerSW();
}

function renderConfigError() {
  const host = location.hostname;
  // Pengunjung umum: pesan netral tanpa detail teknis. Detail hanya di komputer pengembang atau dengan ?setup
  const dev = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(host) || /[?&#]setup\b/.test(location.search + location.hash);
  if (!dev) {
    root.innerHTML = `<div class="login-page"><div class="login-card"><div class="logo-mark big">${appIconImg()}</div><h1>Website belum dapat dimuat</h1><p class="muted">Koneksi ke server sedang bermasalah atau website sedang dalam pemeliharaan. Silakan muat ulang beberapa saat lagi.</p><button class="btn btn-primary btn-block" id="cfg-retry">${ic('refresh')} Muat ulang</button><p class="muted small center" data-copyright>${esc(APP.credit)}</p></div></div>`;
    $('#cfg-retry').onclick = () => location.reload();
    return;
  }
  const where = location.protocol === 'file:' ? 'file' : /^(localhost|127\.0\.0\.1)$/.test(host) ? 'local' : /github\.io$/.test(host) ? 'pages' : /\.(web\.app|firebaseapp\.com)$/.test(host) ? 'firebase' : 'other';
  const steps = {
    firebase: `<li>Situs ini di Firebase Hosting tetapi konfigurasi tidak terbaca. Buka <b>GitHub → Actions</b> dan pastikan workflow <b>Deploy ke Firebase</b> berstatus hijau (berhasil).</li><li>Pastikan aplikasi Web sudah terdaftar: Firebase Console → ⚙ Project settings → <b>Your apps</b> → harus ada aplikasi Web. Jika belum ada, klik ikon <code>&lt;/&gt;</code> untuk menambahkannya, lalu deploy ulang.</li>`,
    pages: `<li>Anda membuka aplikasi dari <b>GitHub Pages</b>, yang tidak menyediakan konfigurasi Firebase. Buka alamat resmi <a href="https://${esc(APP.firebaseProjectId)}.web.app">https://${esc(APP.firebaseProjectId)}.web.app</a> (setelah workflow <b>Deploy ke Firebase</b> berhasil).</li><li>Atau tetap pakai GitHub Pages: tambahkan secret <code>FIREBASE_WEB_CONFIG</code> lalu aktifkan workflow <b>Deploy ke GitHub Pages</b> (lihat README).</li>`,
    local: `<li>Untuk uji di komputer: salin <code>public/js/firebase-config.example.js</code> menjadi <code>public/js/firebase-config.local.js</code> lalu isi nilainya, atau gunakan tombol <b>Tempel konfigurasi</b> di bawah.</li>`,
    file: `<li>File dibuka dengan dobel-klik. Jalankan lewat server: <code>npx serve public</code>, lalu buka <code>http://localhost:3000</code>.</li>`,
    other: `<li>Hosting ini bukan Firebase Hosting. Deploy dulu ke Firebase (workflow <b>Deploy ke Firebase</b>) agar konfigurasi bisa diambil dari <code>${esc(APP.firebaseProjectId)}.web.app</code>, atau buat berkas <code>js/firebase-config.local.js</code> saat proses deploy.</li>`,
  }[where];
  root.innerHTML = `<div class="login-page"><div class="login-card" style="width:min(640px,100%);text-align:left">
    <div class="logo-mark big"><img src="icons/icon-192.png" alt=""></div>
    <h1 style="text-align:center">Konfigurasi Firebase belum tersedia</h1>
    <p class="muted">API key sengaja tidak disimpan di kode sumber (agar tidak bocor di GitHub). Aplikasi mencoba mengambilnya dari sumber berikut:</p>
    <ul class="small" style="margin:0;padding-left:1.2em">${F.configAttempts.map((a) => `<li>${a.ok ? '✅' : '❌'} <code>${esc(a.src)}</code> — ${esc(a.why || 'berhasil')}</li>`).join('')}</ul>
    <h3 style="margin-top:12px">Cara memperbaiki</h3><ol class="small" style="padding-left:1.2em">${steps}</ol>
    <details class="fieldset"><summary>Tempel konfigurasi sementara di browser ini</summary><div class="pad">
      <p class="small muted">Ambil dari Firebase Console → ⚙ Project settings → Your apps → <b>SDK setup and configuration → Config</b>. Tempel objek <code>firebaseConfig</code> (boleh berikut teks <code>const firebaseConfig =</code>). Hanya tersimpan di browser ini, tidak dikirim ke GitHub.</p>
      <textarea id="cfg-paste" rows="8" placeholder='{ apiKey: "...", authDomain: "...", projectId: "digides-8423e", ... }'></textarea>
      <p class="err" id="cfg-err"></p>
      <button class="btn btn-primary" id="cfg-save">Simpan & muat ulang</button>
    </div></details>
    <div class="row-gap"><button class="btn btn-ghost" id="cfg-retry">${ic('refresh')} Coba lagi</button>${localStorage.getItem('dd:fbcfg') ? '<button class="btn btn-ghost" id="cfg-clear">Hapus konfigurasi tersimpan</button>' : ''}</div>
    <p class="muted small center" data-copyright>${APP.name} v${APP.version} • ${esc(APP.credit)}</p></div></div>`;
  $('#cfg-retry').onclick = () => location.reload();
  $('#cfg-clear')?.addEventListener('click', () => { localStorage.removeItem('dd:fbcfg'); location.reload(); });
  $('#cfg-save').onclick = () => {
    const raw = $('#cfg-paste').value;
    const body = (raw.match(/\{[\s\S]*\}/) || [''])[0];
    const obj = {};
    for (const m of body.matchAll(/["']?(\w+)["']?\s*:\s*["']([^"']+)["']/g)) obj[m[1]] = m[2];
    if (!obj.apiKey || !obj.projectId || !obj.appId) { $('#cfg-err').textContent = 'Konfigurasi tidak lengkap — harus ada apiKey, projectId, dan appId.'; return; }
    localStorage.setItem('dd:fbcfg', JSON.stringify(obj));
    location.reload();
  };
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    if (!reg) return;
    state.swReg = reg;
    const notify = (w) => toast('Versi baru tersedia.', 'info', { duration: 15000, action: { label: 'Muat ulang', onClick: () => w.postMessage('skipWaiting') } });
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
  // v3.0.0: judul tab statis — hanya nama gampong (mis. "Deah Glumpang")
  setMarqueeTitle(state.config.namaDesa ? desaName() : APP.owner);
}

function subscribeInfo(all) {
  state.infoUnsub?.();
  state.infoUnsub = Sync.watch({
    id: all ? 'informasi:all' : 'informasi:pub', scope: all ? 'adm' : 'pub', col: 'informasi',
    base: all ? [] : [F.where('published', '==', true)], limit: all ? 0 : 150,
    onData: (list) => {
      state.info = list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
      softRerender(['public', 'informasi', 'dash', 'broadcast']);
    },
    onError: (e) => console.warn('info', e),
  });
}
const pubInfo = () => state.info.filter((i) => i.published);

// Lembaga & dokumen publik (publik: hanya yang ditampilkan; admin: semua)
function subscribeLembaga(all) {
  (state.lembagaUnsubs || []).forEach((f) => f()); state.lembagaUnsubs = [];
  const pub = all ? [] : [F.where('published', '==', true)];
  state.lembagaUnsubs.push(Sync.watch({ id: all ? 'lembaga:all' : 'lembaga:pub', scope: all ? 'adm' : 'pub', col: 'lembaga', base: pub, limit: all ? 0 : 150, onData: (list) => { state.lembaga = list; state.lembagaReady = true; softRerender(['public', 'lembaga', 'shell']); }, onError: (e) => console.warn('lembaga', e) }));
  state.lembagaUnsubs.push(Sync.watch({ id: all ? 'dokumen:all' : 'dokumen:pub', scope: all ? 'adm' : 'pub', col: 'dokumen', base: pub, limit: all ? 0 : 200, onData: (list) => { state.dokumen = list; softRerender(['public', 'dokumen']); }, onError: (e) => console.warn('dokumen', e) }));
}

// Profil pengguna di koleksi users/{uid}. Super Admin utama dibuat otomatis saat login pertama.
async function ensureUser(user) {
  const ref = C(`users/${user.uid}`);
  let snap;
  try { snap = await F.getDoc(ref); } catch { return null; }
  if (!snap.exists()) {
    if (norm(user.email) !== norm(APP.superAdminEmail)) return null;
    try {
      await F.setDoc(ref, { email: user.email, nama: 'Super Admin', role: 'superadmin', active: true, perms: {}, createdAt: F.serverTimestamp(), createdBy: 'bootstrap' });
      snap = await F.getDoc(ref);
    } catch (e) { console.warn('bootstrap super', e); return null; }
  }
  const u = snap.data();
  if (u.active === false) return u;
  try { await F.updateDoc(ref, { lastLogin: F.serverTimestamp(), email: user.email }); } catch { /* abaikan */ }
  if (u.role === 'superadmin') {
    try {
      const a = (await F.getDoc(C('config/auth'))).data() || {};
      if (norm(a.superEmail) !== norm(user.email) || a.pendingEmail) await F.setDoc(C('config/auth'), { superEmail: user.email, pendingEmail: F.deleteField() }, { merge: true });
    } catch (e) { console.warn(e); }
  }
  return { ...u, email: user.email };
}

// Sidik hak akses yang stabil: peran + izin aktif + lembaga + jenis badge (diurutkan, tanpa field lain)
const badgeIds = (bs) => (Array.isArray(bs) ? bs : []).map((b) => (typeof b === 'string' ? b : b?.id)).filter(Boolean).sort();
function accessKey(p, role, perms) {
  const on = Object.keys(perms || {}).filter((k) => perms[k] === true).sort();
  return JSON.stringify([role || '', on, [...(p?.lembagaIds || [])].sort(), badgeIds(p?.badges), p?.dusun || '']);
}
function accessDiff(oldP, oldPerms, oldRole, d) {
  const out = []; const lbl = Object.fromEntries((PERMS || []).map(([k, l]) => [k, l]));
  if (oldRole !== d.role) out.push(`peran menjadi ${ROLE_LABEL[d.role] || d.role}`);
  const a = new Set(Object.keys(oldPerms || {}).filter((k) => oldPerms[k] === true)), b = new Set(Object.keys(d.perms || {}).filter((k) => d.perms[k] === true));
  const add = [...b].filter((k) => !a.has(k)).map((k) => lbl[k] || k), rem = [...a].filter((k) => !b.has(k)).map((k) => lbl[k] || k);
  if (add.length) out.push(`ditambah ${add.join(', ')}`); if (rem.length) out.push(`dicabut ${rem.join(', ')}`);
  const ba = badgeIds(oldP?.badges), bb = badgeIds(d.badges);
  if (bb.includes('verified-green') && !ba.includes('verified-green')) out.push('mendapat Centang Hijau');
  if (!bb.includes('verified-green') && ba.includes('verified-green')) out.push('Centang Hijau dicabut');
  if (JSON.stringify([...(oldP?.lembagaIds || [])].sort()) !== JSON.stringify([...(d.lembagaIds || [])].sort())) out.push('lembaga yang dikelola diperbarui');
  return out.slice(0, 3).join('; ');
}
// ---------------------------------------------------------------- Mode "Lihat Sebagai" (khusus Super Admin, hanya pratinjau)
function enterViewAs(u) {
  if (!u || !isSuper() || state.viewAs) return;
  logAudit('akses', 'lihat_sebagai', `Mulai mode Lihat Sebagai ${u.nama || u.email} (${ROLE_LABEL[u.role] || u.role})`, { target: u.email, targetId: u.uid });
  state.viewAs = { u: { uid: u.uid, nama: u.nama, email: u.email, role: u.role, dusun: u.dusun, perms: u.perms, lembagaIds: u.lembagaIds, jabatan: u.jabatan, badges: u.badges }, orig: { role: state.role, perms: state.perms, profile: state.profile } };
  startReadOnly();
  state.role = u.role; state.perms = u.perms || {}; state.profile = { ...u, email: u.email };
  toast(`Melihat sebagai ${u.nama || u.email} — hanya pratinjau`, 'info');
  root.dataset.shell = ''; startAdmin();
  if (location.hash === '#/admin') render(); else location.hash = '#/admin';
}
function exitViewAs() {
  const v = state.viewAs; if (!v) return;
  stopReadOnly();
  state.role = v.orig.role; state.perms = v.orig.perms; state.profile = v.orig.profile; state.viewAs = null;
  logAudit('akses', 'lihat_sebagai_selesai', `Selesai mode Lihat Sebagai ${v.u.nama || v.u.email}`, { target: v.u.email, targetId: v.u.uid });
  root.dataset.shell = ''; startAdmin();
  if (location.hash === '#/admin/viewas') render(); else location.hash = '#/admin/viewas';
}

let adminGen = 0;
function startAdmin() {
  stopAdmin();
  const gen = adminGen;
  const u = state.adminUnsubs;
  // Profil terbaru (hak akses bisa diubah Super Admin sewaktu-waktu)
  u.push(F.onSnapshot(C(`users/${state.user.uid}`), (s) => {
    const d = s.data();
    if (!d || d.active === false) { toast('Akses Anda telah dicabut.', 'error'); doLogout('akses_dicabut'); return; }
    if (state.viewAs) { state.viewAs.orig.profile = { ...d, email: state.user.email }; return; } // sedang pratinjau peran lain
    // v2.9.1: bandingkan HANYA isi hak akses secara kanonik (urutan field dari server bisa berbeda-beda,
    // sehingga perbandingan teks mentah dulu sering salah mendeteksi "berubah" — terutama akun ber-badge)
    const before = accessKey(state.profile, state.role, state.perms), after = accessKey(d, d.role, d.perms);
    const what = before !== after ? accessDiff(state.profile, state.perms, state.role, d) : '';
    state.profile = { ...d, email: state.user.email }; state.role = d.role; state.perms = d.perms || {};
    if (before !== after) {
      toast(`Hak akses Anda baru saja diubah oleh Super Admin${what ? ': ' + what : ''}. Menu disesuaikan otomatis.`, 'info', { duration: 7000 });
      root.dataset.shell = ''; startAdmin(); render();
    }
  }, () => {}));
  if (!state.viewAs) mountChat();
  F.getDoc(C('config/auth')).then((s) => { state.authCfg = s.data() || {}; }).catch(() => {});
  if (!can('warga')) state.wargaReady = true;
  Sync.startAdmin(state.user.uid).then(() => {
    if (gen !== adminGen || !state.isAdmin) return;
    if (can('warga')) {
      // Kepala Dusun hanya memuat warga dusunnya sendiri (juga dikunci oleh Firestore Rules)
      u.push(Sync.watch({ id: isKadus() ? `warga:${slugify(myDusun())}` : 'warga', scope: 'adm', col: 'warga', base: isKadus() ? [F.where('dusun', '==', myDusun())] : [],
        onData: (list) => { state.warga = list; state.wargaReady = true; softRerender(['dash', 'warga', 'dusun', 'laporan', 'broadcast']); updatePublicStats(); },
        onError: (e) => { state.wargaReady = true; toast('Gagal memuat data warga: ' + e.message, 'error'); } }));
    }
    u.push(Sync.watch({ id: 'dusun', scope: 'adm', col: 'dusun', onData: (list) => {
      state.dusun = list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.nama).localeCompare(String(b.nama)));
      softRerender(['dash', 'warga', 'dusun', 'laporan', 'broadcast']); updatePublicStats();
    } }));
    let seeded = false;
    u.push(Sync.watch({ id: 'master', scope: 'adm', col: 'master', onData: (list, info) => {
      const m = {}; list.forEach(({ id, ...d }) => { m[id] = { key: id, ...d }; });
      state.master = m; state.masterReady = true;
      if (!seeded && info.fromServer && can('master')) { seeded = true; seedMaster(m); }
      softRerender(['master']);
    } }));
    subscribeInfo(true);
    if (can('lembaga') || can('dokumen') || isPengelola()) subscribeLembaga(true);
    if (isSuper()) { Sync.ensureMeta(); setTimeout(() => checkBackupReminder(), 1500); }
  });
  setTimeout(() => { if (can('instagram')) autoSyncInstagram(); }, 4000);
}
function stopAdmin() {
  adminGen++;
  unmountChat();
  state.adminUnsubs.forEach((f) => f()); state.adminUnsubs = [];
  Sync.stopAdmin();
  state.warga = []; state.dusun = []; state.master = {}; state.wargaReady = false; state.masterReady = false;
  state.selected.clear();
  subscribeInfo(false);
  subscribeLembaga(false);
}

async function doLogout(reason = 'logout') {
  const labels = { logout: 'Logout', idle: 'Logout otomatis (tidak ada aktivitas)', akses_dicabut: 'Logout paksa (akses dicabut)' };
  try { await logAudit('auth', reason, labels[reason] || reason); } catch { /* */ }
  try { await flushUsage(true); } catch { /* */ }
  await Sync.stopAdmin({ forget: true }).catch(() => {});
  stopAdmin();
  await F.signOut(F.auth).catch(() => {});
  await F.wipeLocalCache();
  location.hash = '#/login';
  location.reload();
}
function setupIdleLogout() {
  let last = Date.now();
  const bump = () => { last = Date.now(); };
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
  setInterval(() => {
    if (!state.isAdmin) return;
    const mins = Number(state.config.idleMinutes || APP.idleMinutesDefault);
    if (mins > 0 && Date.now() - last > mins * 60e3) { toast('Sesi berakhir karena tidak ada aktivitas.', 'info'); doLogout('idle'); }
  }, 30e3);
}

async function seedMaster(existing) {
  const keys = [...FIELDS.filter((f) => f.type === 'select').map((f) => f.key), 'kategoriInfo', 'kategoriKegiatan'];
  const missing = keys.filter((k) => !existing[k]);
  if (!missing.length) return;
  const b = F.writeBatch(F.db);
  missing.forEach((k, i) => {
    const f = FIELDS.find((x) => x.key === k);
    b.set(C(`master/${k}`), { label: f?.label || MASTER_EXTRA_LABELS[k] || k, items: DEFAULT_MASTER[k] || [], builtin: true, group: f?.group || 'lainnya', order: i });
  });
  try { await b.commit(); } catch (e) { console.warn('seed master', e); }
}

// ---- Statistik publik (agregat, tanpa data pribadi) untuk halaman Infografis
const DEFAULT_INFOGRAFIS = ['kelompokUmur', 'jk', 'dusun', 'agama', 'pendidikan', 'pekerjaan', 'statusKawin', 'sektor'];
const PYR = [[0, 4], [5, 9], [10, 14], [15, 19], [20, 24], [25, 29], [30, 34], [35, 39], [40, 44], [45, 49], [50, 54], [55, 59], [60, 64], [65, 69], [70, 74], [75, 200]];
function computePublicStats() {
  const aktif = state.warga.filter(isAktif);
  const t = aktif.length;
  const L = (w) => norm(w.jk).startsWith('l'), P = (w) => norm(w.jk).startsWith('p');
  const ages = aktif.map((w) => Number(w.umur)).filter((n) => !Number.isNaN(n) && n >= 0);
  const kk = aktif.filter((w) => norm(w.shdk) === 'kepala keluarga').length;
  const anak = ages.filter((a) => a < 15).length, produktif = ages.filter((a) => a >= 15 && a <= 64).length, tua = ages.filter((a) => a >= 65).length;
  const laki = aktif.filter(L).length, perempuan = aktif.filter(P).length;
  const ig = state.config.infografis || {};
  const cats = ig.cats || DEFAULT_INFOGRAFIS;
  const min = Number(ig.min ?? 3);
  const breakdown = {};
  for (const k of cats) {
    let rows = countBy(aktif, k).filter(([v]) => v !== '(Kosong)');
    if (k === 'kelompokUmur') rows.sort((a, b) => AGE_GROUPS.findIndex((g) => g[2] === a[0]) - AGE_GROUPS.findIndex((g) => g[2] === b[0]));
    if (min > 1) {
      const small = rows.filter(([, n]) => n < min);
      rows = rows.filter(([, n]) => n >= min);
      if (small.length) rows.push([`Lainnya (kurang dari ${min})`, small.reduce((a, [, n]) => a + n, 0)]);
    }
    breakdown[k] = rows.slice(0, 25).map(([v, n]) => ({ v: String(v), n }));
  }
  const dusunRows = countBy(aktif, 'dusun').filter(([v]) => v !== '(Kosong)');
  // v3.0.0: rincian per jenis kelamin & per dusun untuk kartu statistik publik (nilai < min disamarkan → null)
  const hide = (n) => (n > 0 && min > 1 && n < min ? null : n);
  const age = (w) => Number(w.umur); const okAge = (w) => w.umur !== '' && w.umur != null && !Number.isNaN(age(w));
  const METRIC = { penduduk: () => true, kk: (w) => norm(w.shdk) === 'kepala keluarga', produktif: (w) => okAge(w) && age(w) >= 15 && age(w) <= 64, lansia: (w) => okAge(w) && age(w) >= 60, balita: (w) => okAge(w) && age(w) <= 5 };
  const dNames = [...state.dusun.map((d) => d.nama), ...dusunRows.map(([v]) => v)].filter((v, i, a) => v && a.indexOf(v) === i);
  const rinci = {};
  for (const [k, fn] of Object.entries(METRIC)) {
    const set = aktif.filter(fn);
    rinci[k] = { l: hide(set.filter(L).length), p: hide(set.filter(P).length), d: dNames.map((d) => { const x = set.filter((w) => w.dusun === d); return { d, l: hide(x.filter(L).length), p: hide(x.filter(P).length) }; }) };
  }
  const perDusun = dNames.map((d) => { const x = aktif.filter((w) => w.dusun === d); return { d, n: x.length, l: hide(x.filter(L).length), p: hide(x.filter(P).length), kk: hide(x.filter(METRIC.kk).length) }; });
  return {
    rinci, perDusun, minPrivasi: min,
    penduduk: t, kk, laki, perempuan, dusun: state.dusun.length,
    rataKeluarga: kk ? Math.round((t / kk) * 10) / 10 : 0,
    rasioJK: perempuan ? Math.round((laki / perempuan) * 100) : 0,
    produktif, anak, tua,
    rasioKetergantungan: produktif ? Math.round(((anak + tua) / produktif) * 100) : 0,
    lansia: ages.filter((a) => a >= 60).length, balita: ages.filter((a) => a <= 5).length,
    dusunTerbesar: dusunRows[0] ? `${dusunRows[0][0]} (${dusunRows[0][1]} jiwa)` : '',
    piramida: PYR.map(([a, b]) => ({ g: b >= 200 ? `${a}+` : `${a}–${b}`, l: aktif.filter((w) => L(w) && Number(w.umur) >= a && Number(w.umur) <= b).length, p: aktif.filter((w) => P(w) && Number(w.umur) >= a && Number(w.umur) <= b).length })),
    breakdown, cats,
  };
}
const updatePublicStats = debounce(async () => {
  if (!state.isAdmin || !can('warga') || !state.wargaReady || isKadus()) return;
  const s = computePublicStats();
  const prev = { ...state.stats }; delete prev.updatedAt;
  if (JSON.stringify(prev) === JSON.stringify(s)) return;
  try { await F.setDoc(C('config/stats'), { ...s, updatedAt: F.serverTimestamp() }); } catch (e) { console.warn(e); }
}, 1200);

// ---------------------------------------------------------------- router
function parseRoute() {
  const hash = location.hash.slice(1) || '/';
  const [path, qs] = hash.split('?');
  return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs || '') };
}
function softRerender(tags) {
  if (state.layoutEdit) return;
  if (!state.view || !tags.includes(state.view)) {
    if (tags.includes('shell') && root.dataset.shell === 'admin') updateShellBrand();
    return;
  }
  if (document.activeElement && root.contains(document.activeElement) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && state.view !== 'public') return;
  if ($('.modal-backdrop')) return;
  render(true);
}
function routeBar() {
  let b = document.getElementById('route-bar');
  if (!b) { b = document.createElement('div'); b.id = 'route-bar'; b.className = 'route-bar'; document.body.appendChild(b); }
  b.style.transition = 'none'; b.style.opacity = '1'; b.style.width = '0';
  requestAnimationFrame(() => { b.style.transition = ''; b.style.width = '75%'; setTimeout(() => { b.style.width = '100%'; setTimeout(() => { b.style.opacity = '0'; }, 250); }, 180); });
}
// Penjaga navigasi: isian halaman yang belum disimpan
let lastHash = location.hash, skipGuard = false;
async function onHashChange() {
  if (skipGuard) { skipGuard = false; return; }
  if (guard.dirty && location.hash !== lastHash) {
    const target = location.hash;
    skipGuard = true; history.replaceState(history.state, '', lastHash || '#/');
    const ok = await confirmDialog('Perubahan yang Anda isi belum disimpan. Tinggalkan halaman ini tanpa menyimpan?', { title: 'Belum disimpan', okText: 'Tinggalkan', danger: true });
    skipGuard = false;
    if (!ok) return;
    guard.dirty = false; history.replaceState(history.state, '', target); lastHash = target; render(); return;
  }
  lastHash = location.hash;
  render();
}
// Tampilan pertama menunggu pengaturan tema termuat (dari perangkat ±50 ms, atau server) maks. 2,5 detik
let cfgWaiting = false;
setTimeout(() => { if (cfgWaiting) { cfgWaiting = false; state.cfgLoaded = true; render(); } }, 2500);
function render(soft = false) {
  if (F.configError) return;
  if (!state.cfgLoaded) { cfgWaiting = true; return; }
  if (!soft) { guard.dirty = false; lastHash = location.hash; }
  if (!soft) routeBar();
  const r = parseRoute(); state.route = r;
  if (!soft) document.body.classList.remove('nav-open', 'pubnav-open'); // pembaruan data di latar tidak menutup menu yang sedang dibuka
  state.timers.forEach(clearInterval); state.timers = [];
  applyBranding();
  const p0 = r.parts[0];
  requestAnimationFrame(() => requestAnimationFrame(scanIcons));
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
// v2.9.2: layar memuat & halaman galat memakai ikon aplikasi TERBARU (disimpan di perangkat agar langsung tampil
// sebelum pengaturan termuat), bukan ikon bawaan lama
const brandCache = () => { try { return JSON.parse(localStorage.getItem('dd:brand') || 'null') || {}; } catch { return {}; } };
function saveBrandCache() {
  try {
    const c = state.config; const small = (u) => (u && u.length < 250000 ? u : '');
    localStorage.setItem('dd:brand', JSON.stringify({ icon: small(c.ikon?.src), logo: small(c.logo), nama: c.namaDesa ? `${desaJenis()} ${desaName()}`.trim() : '' }));
  } catch { /* */ }
}
const appIconSrc = () => state.config.ikon?.src || state.config.logo || brandCache().icon || brandCache().logo || 'icons/icon-192.png';
const appIconImg = () => { const s = appIconSrc(); return `<img src="${esc(s)}" alt=""${s.startsWith('icons/') ? '' : ' data-logo'}>`; };
const splash = (msg = 'Memuat portal data…') => `<div class="splash"><div class="splash-logo"><span class="ring"></span><span class="ring r2"></span><div class="logo-mark big">${appIconImg()}</div></div><b class="splash-title">${esc(state.config.namaDesa ? `${desaJenis()} ${desaName()}` : brandCache().nama || APP.name)}</b><div class="splash-bar"><span></span></div><small class="muted">${esc(msg)}</small></div>`;
const logoImg = () => state.config.logo ? `<img src="${esc(state.config.logo)}" alt="" data-logo>` : `<img src="icons/icon-192.png" alt="">`;

// ================================================================ PUBLIK
function renderPublic(r, soft) {
  state.view = 'public';
  const y = soft ? window.scrollY : 0;
  const p0 = r.parts[0] || '';
  if (p0 === 'profil' && r.parts[1] === 'lembaga') { location.replace('#/lembaga'); return; }
  let content;
  if (p0 === 'informasi' && r.parts[1]) content = pubInfoDetail(r.parts[1]);
  else if (p0 === 'informasi') content = pubInfoList(r.query.get('k') || '');
  else if (p0 === 'highlight') content = pubHighlight(true);
  else if (p0 === 'profil') content = renderPubPage(r.parts[1] || 'profil');
  else if (p0 === 'infografis') content = renderInfografis();
  else if (p0 === 'data') content = renderDataPortal(r.parts[1] || '', r.parts[2] || '');
  else if (p0 === 'lembaga') content = renderLembagaPublic(r.parts);
  else if (p0 === 'dokumen') content = renderDokumenPublic();
  else if (p0 === 'kegiatan') content = renderKegiatanPublic(r.parts[1] || '');
  else content = pubHome();
  root.dataset.shell = 'public';
  const rt = state.config.runningText || {};
  const ticker = rt.aktif && String(rt.teks || '').trim();
  document.body.classList.toggle('has-ticker', !!ticker);
  const lay = state.config.layout || {};
  const editing = state.layoutEdit === 'public';
  const sideKeys = { sholat: () => sholatPanel(), docs: () => docsPanel(), agenda: () => agendaPanel(), kegiatan: () => kegiatanPanel('hari'), lnews: () => lembagaNewsPanel(), kglain: () => kegiatanPanel('lain') };
  const { leftKeys, rightKeys } = sideLayout(lay, editing || widgetCfg().berita.aktif);
  const side = (keys) => keys.map((k) => { const h = sideKeys[k](); return h ? `<div class="side-block" data-key="${k}">${h}</div>` : ''; }).join('');
  const showVisits = p0 === '' && widgetCfg().analitik.aktif;
  const openDd = soft ? [...document.querySelectorAll('.pub-nav .dropdown')].findIndex((d) => d.classList.contains('open')) : -1;
  root.innerHTML = `
  <header class="pub-header">
    <div class="pub-header-inner">
      <a class="brand" href="#/"><span class="logo-mark">${logoImg()}</span><span class="brand-text"><b>${esc(`${desaJenis()} ${desaName()}`.trim())}</b><small>${esc(state.config.tagline || 'Portal Data & Informasi Publik')}</small></span></a>
      <div class="hdr-tools"><button class="icon-btn theme-btn" data-theme-toggle aria-label="Mode gelap/terang"></button><button class="icon-btn pubnav-toggle" id="pubnav-toggle" aria-label="Menu">${ic('menu')}</button></div>
      <nav class="pub-nav" id="pub-nav">
        <a href="#/" class="${p0 === '' ? 'active' : ''}">Beranda</a>
        <a href="#/informasi" class="${p0 === 'informasi' ? 'active' : ''}">Informasi</a>
        <div class="dropdown ${p0 === 'profil' ? 'active' : ''}">
          <button class="dropdown-btn" aria-haspopup="true" aria-expanded="false">Profil ${esc(jenisLabel())} ${ic('chev')}</button>
          <div class="dropdown-menu">${PAGES.filter((p) => p.key !== 'lembaga').map((p) => `<a href="#/profil/${p.key}" class="${p0 === 'profil' && (r.parts[1] || 'profil') === p.key ? 'active' : ''}">${ic(p.icon)} ${esc(pageLabel(p))}</a>`).join('')}</div>
        </div>
        <div class="dropdown ${p0 === 'lembaga' || p0 === 'dokumen' ? 'active' : ''}">
          <button class="dropdown-btn" aria-haspopup="true" aria-expanded="false">Lembaga ${ic('chev')}</button>
          <div class="dropdown-menu wide">${KATEGORI.map((k) => `<a href="#/lembaga/k/${k.key}">${ic(k.icon)} <span><b>${esc(k.short)}</b><small>${esc(k.desc)}</small></span></a>`).join('')}<a href="#/lembaga">${ic('shield')} <span><b>Semua Lembaga</b></span></a><a href="#/dokumen" class="${p0 === 'dokumen' ? 'active' : ''}">${ic('file')} <span><b>Dokumen Publik</b><small>RPJMG, APBG, Reusam, peraturan</small></span></a></div>
        </div>
        <a href="#/data" class="${p0 === 'data' || p0 === 'infografis' ? 'active' : ''}">Data Publik</a>
        <a href="#/highlight" class="${p0 === 'highlight' ? 'active' : ''}">Galeri</a>
        <a href="${state.isAdmin ? '#/admin' : '#/login'}" class="btn btn-sm btn-primary">${ic('lock')} ${state.isAdmin ? 'Dasbor' : 'Masuk'}</a>
        <div class="pn-extra">${menuExtras()}</div>
      </nav>
    </div>
  </header>
  <div class="pub-frame ${p0 === '' ? 'is-home' : ''} ${leftKeys.length || editing ? '' : 'no-left'} ${rightKeys.length || editing ? '' : 'no-right'}">
    <aside class="side side-left" data-sort="sideLeft" aria-label="Panel kiri">${side(leftKeys)}</aside>
    <main class="pub-main">${content}<div class="m-credit"><span class="copyright" data-copyright>${esc(APP.credit)}</span><small>${APP.name} ${APP.versionLabel}</small></div></main>
    <aside class="side side-right" data-sort="sideRight" aria-label="Panel kanan">${side(rightKeys)}</aside>
  </div>
  <div class="mnav-scrim" id="mnav-scrim"></div>
  <nav class="mnav" aria-label="Navigasi cepat">
    <a href="#/" class="${p0 === '' ? 'on' : ''}">${ic('home')}<span>Beranda</span></a>
    <a href="#/informasi" class="${p0 === 'informasi' ? 'on' : ''}">${ic('mega')}<span>Info</span></a>
    <a href="#/lembaga" class="${p0 === 'lembaga' || p0 === 'dokumen' ? 'on' : ''}">${ic('shield')}<span>Lembaga</span></a>
    <a href="#/data" class="${p0 === 'data' || p0 === 'infografis' ? 'on' : ''}">${ic('chart')}<span>Data</span></a>
    <button type="button" id="mnav-menu" class="${p0 === 'profil' || p0 === 'highlight' ? 'on' : ''}" aria-label="Menu lainnya">${ic('menu')}<span>Menu</span></button>
  </nav>
  ${pubFooter(ticker, rt, showVisits, isSuper() && p0 === '' && !editing ? layoutBar('public') : '')}
  ${isSuper() && p0 === '' && editing ? layoutBar('public') : ''}`;
  applyTheme(state.config.tema);
  applyBackground(state.config.latar, { isHome: p0 === '' });
  bindPublic();
  mountVisitorWidget(showVisits && !isPhone() ? $('#vis-widget') : null); // v3.0.0: di HP footer (teks berjalan & statistik) dimatikan
  if (!soft && !pubStarted) { pubStarted = true; recordVisit(); startPresence(); }
  if (openDd >= 0) { const d = $$('.pub-nav .dropdown')[openDd]; d?.classList.add('open'); d?.querySelector('.dropdown-btn')?.setAttribute('aria-expanded', 'true'); }
  if (editing) enableLayoutEdit('public');
  if (soft) window.scrollTo(0, y); else window.scrollTo(0, 0);
}

// Susunan panel samping. Panel baru "Berita Lembaga" (v2.4) otomatis ditempatkan tepat di bawah Kegiatan Rutin.
const SIDE_ALL = ['sholat', 'docs', 'agenda', 'kegiatan', 'lnews', 'kglain'];
let pubStarted = false;
function sideLayout(lay, withNews) {
  const all = SIDE_ALL.filter((k) => k !== 'lnews' || withNews);
  const right = Array.isArray(lay.sideRight) ? lay.sideRight.filter((k) => all.includes(k)) : ['kegiatan'];
  const left = Array.isArray(lay.sideLeft) ? lay.sideLeft.filter((k) => all.includes(k) && !right.includes(k)) : [];
  if (withNews && !right.includes('lnews') && !left.includes('lnews')) {
    const t = left.includes('kegiatan') ? left : right; const i = t.indexOf('kegiatan');
    t.splice(i >= 0 ? i + 1 : t.length, 0, 'lnews');
  }
  // v2.9.9: "Kegiatan Lainnya" blok tersendiri — bawaan: Kegiatan Rutin → Berita Lembaga → Kegiatan Lainnya
  if (!right.includes('kglain') && !left.includes('kglain')) {
    const t = left.includes('kegiatan') ? left : right; const ref = t.includes('lnews') ? 'lnews' : 'kegiatan'; const i = t.indexOf(ref);
    t.splice(i >= 0 ? i + 1 : t.length, 0, 'kglain');
  }
  // v2.9.12: Dokumen Terbaru → Agenda Terdekat tepat di bawah Jadwal Sholat (sisi yang sama dengan Jadwal Sholat)
  if (!right.includes('sholat') && !left.includes('sholat')) left.unshift('sholat');
  for (const [k, after] of [['docs', 'sholat'], ['agenda', 'docs']]) {
    if (right.includes(k) || left.includes(k)) continue;
    const t = right.includes('sholat') ? right : left; const i = t.indexOf(after);
    if (i >= 0) t.splice(i + 1, 0, k); else if (t === left) t.splice(left.includes('sholat') ? left.indexOf('sholat') + 1 : 0, 0, k);
  }
  const leftKeys = ordered(all.filter((k) => !right.includes(k)), left);
  return { leftKeys, rightKeys: right };
}

// Footer satu baris (v2.9.11): kiri = titik pengunjung online + running text, kanan = info footer.
// Di HP/tablet bagian kanan disembunyikan (kredit tampil di bawah konten), baris kiri tetap di atas navigasi bawah.
function pubFooter(ticker, rt = {}, showVisits = false, layBtn = '') {
  const items = ticker ? String(rt.teks).split('\n').map((t) => t.trim()).filter(Boolean) : [];
  const speed = { lambat: 35, normal: 60, cepat: 100 }[rt.kecepatan] || 60;
  const bg = rt.bg ? `--tk:${esc(rt.bg)}` : ''; // warna latar pilihan → dipakai semi-transparan oleh CSS
  return `<footer class="pub-foot ft2 ${items.length ? 'has-tk' : 'no-tk'} ${showVisits ? 'has-vis' : ''} ${layBtn ? 'has-lay' : ''}">
    <div class="foot-line">
    <div class="foot-start">
    ${showVisits ? '<div id="vis-widget" class="vis-widget" aria-live="polite"></div>' : ''}${layBtn}
    ${items.length ? `<div class="ticker" role="marquee" aria-label="Pengumuman berjalan" style="${bg}"><span class="ticker-label">${ic('mega')} ${esc(rt.label || 'Info')}</span><div class="ticker-track"><div class="ticker-move" data-speed="${speed}" style="${tickerStyle(rt)}">${items.map((t) => `<span>${esc(t)}</span><i>•</i>`).join('')}</div></div></div>` : ''}
    </div>
    <div class="foot-end">
      <button class="link-btn" data-install hidden>${ic('phone')} Pasang aplikasi</button>
      ${state.config.telepon ? `<a href="${esc(waLink(state.config.telepon))}" target="_blank" rel="noopener">${ic('wa')} ${esc(state.config.telepon)}</a>` : ''}
      <span class="foot-ver" title="${esc(APP.buildLabel)}">${APP.name} ${APP.versionLabel}</span>
      <span class="copyright" data-copyright title="${esc(APP.credit)}">${esc(APP.credit)}</span>
    </div>
    </div>
  </footer>`;
}

// ---- Tata letak (khusus Super Admin)
function layoutBar(scope) {
  if (state.layoutEdit === scope) return `<div class="layout-bar editing"><span>${ic('grid')} <b>Mode atur tata letak</b> — seret tombol <b>⠿ Geser</b> pada panel untuk memindahkan posisinya.</span><button class="btn btn-sm btn-ghost" data-lay="reset">Kembalikan bawaan</button><button class="btn btn-sm btn-ghost" data-lay="cancel">Batal</button><button class="btn btn-sm btn-primary" data-lay="save">${ic('check')} Simpan tata letak</button></div>`;
  return `<button class="layout-fab" data-lay="start" title="Atur tata letak panel (Super Admin)" aria-label="Atur tata letak panel">${ic('grid')}</button>`;
}
let layoutPending = null, layoutStop = null;
function enableLayoutEdit(scope) {
  layoutStop?.(); layoutPending = {};
  const stops = [];
  if (scope === 'public') {
    const home = $('.home-sections'); if (home) stops.push(makeSortable([home], { onChange: (o) => Object.assign(layoutPending, o) }));
    stops.push(makeSortable([$('.side-left'), $('.side-right')], { onChange: (o) => Object.assign(layoutPending, o) }));
  } else {
    const d = $('.dash-grid'); if (d) stops.push(makeSortable([d], { onChange: (o) => Object.assign(layoutPending, o) }));
  }
  layoutStop = () => stops.forEach((f) => f());
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-lay]'); if (!b || !isSuper()) return;
  const act = b.dataset.lay; const scope = root.dataset.shell === 'admin' ? 'dash' : 'public';
  if (act === 'start') { state.layoutEdit = scope; render(true); return; }
  if (act === 'cancel') { state.layoutEdit = null; layoutStop?.(); layoutStop = null; render(true); return; }
  if (act === 'reset') {
    if (!await confirmDialog('Kembalikan susunan panel ke bawaan?', { okText: 'Kembalikan' })) return;
    const lay = { ...(state.config.layout || {}) };
    if (scope === 'public') { delete lay.home; delete lay.sideLeft; delete lay.sideRight; } else delete lay.dash;
    await cfgUpdate({ layout: lay }); state.config.layout = lay;
    logAudit('tampilan', 'layout_reset', `Mengembalikan tata letak ${scope === 'public' ? 'beranda publik' : 'dasbor'} ke bawaan`);
    state.layoutEdit = null; layoutStop?.(); render(true); toast('Tata letak dikembalikan', 'success'); return;
  }
  if (act === 'save') {
    const lay = { ...(state.config.layout || {}), ...layoutPending };
    try {
      await cfgUpdate({ layout: lay }); state.config.layout = lay;
      logAudit('tampilan', 'layout', `Mengubah tata letak ${scope === 'public' ? 'beranda publik' : 'dasbor'}`, { detail: JSON.stringify(layoutPending) });
      toast('Tata letak disimpan', 'success');
    } catch (err) { toast('Gagal: ' + err.message, 'error'); return; }
    state.layoutEdit = null; layoutStop?.(); layoutStop = null; render(true);
  }
});

const HERO_DESC_DEFAULT = 'Data kependudukan terbuka, informasi kegiatan, dan layanan gampong dalam satu tempat — mudah diakses warga kapan saja.';
// v2.9.12: Agenda Terdekat & Dokumen Terbaru sebagai panel samping ringkas (di bawah Jadwal Sholat)
const homeAgenda = () => { const now = todayISO(); return pubInfo().filter((i) => i.tanggalAcara && i.tanggalAcara >= now).sort((a, b) => a.tanggalAcara.localeCompare(b.tanggalAcara)).slice(0, 4); };
const homeDocs = () => [...state.dokumen].filter((d) => d.published !== false).sort((a, b) => String(b.tahun || '').localeCompare(String(a.tahun || ''))).slice(0, 4);
const spHead = (icon, title, sub, href, more) => `<div class="sp-head">${ic(icon)}<div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${href ? `<a class="sp-more" href="${href}" title="${esc(more)}" aria-label="${esc(more)}">${ic('chev')}</a>` : ''}</div>`;
function docsPanel() {
  const docs = homeDocs(); if (!docs.length) return '';
  return `<div class="side-panel sp-mini sp-docs">${spHead('file', 'Dokumen Terbaru', `${docs.length} dokumen publik`, '#/dokumen', 'Semua dokumen')}
    <div class="spm-list">${docs.map((d) => `<a href="#/dokumen" class="spm-row" title="${esc(d.judul)}">${ic('file')}<span><b>${esc(d.judul)}</b><small>${esc([d.jenis, d.tahun].filter(Boolean).join(' · '))}</small></span></a>`).join('')}</div></div>`;
}
function agendaPanel() {
  const ag = homeAgenda();
  return `<div class="side-panel sp-mini sp-agenda">${spHead('cal', 'Agenda Terdekat', ag.length ? `${ag.length} acara mendatang` : '', ag.length ? '#/informasi' : '', 'Semua informasi')}
    ${ag.length ? `<div class="spm-list">${ag.map((a) => { const d = toDate(a.tanggalAcara); return `<a class="spm-row spm-ag" href="#/informasi/${esc(a.id)}" title="${esc(a.judul)}"><span class="spm-date"><b>${d.getDate()}</b><small>${esc(d.toLocaleString('id-ID', { month: 'short' }))}</small></span><span><b>${esc(a.judul)}</b><small>${esc([a.waktu, a.lokasi].filter(Boolean).join(' • ') || fmtDate(a.tanggalAcara))}</small></span></a>`; }).join('')}</div>` : '<p class="muted small spm-empty">Belum ada agenda terdekat.</p>'}</div>`;
}
const newsMini = (i) => { const th = infoThumb(i); return `<a class="news-mini" href="#/informasi/${esc(i.id)}">${th ? `<span class="nm-img"><img loading="lazy" src="${esc(th)}" alt="" onerror="this.parentNode.classList.add('nm-noimg');this.remove()"></span>` : `<span class="nm-img nm-noimg">${ic('mega')}</span>`}<span class="nm-txt"><small><b>${esc(i.kategori || 'Informasi')}</b> · ${esc(fmtDate(i.createdAt))}</small><strong>${esc(i.judul)}</strong></span></a>`; };

// Ganti seluruh nilai field di config/app (bukan digabung), buat dokumen bila belum ada
const HOME_KEYS = ['hero', 'berita', 'layanan', 'galeri', 'insight', 'viz', 'data'];
function pubHome() {
  const s = state.stats || {};
  const now = todayISO();
  const info = pubInfo();
  const latest = info.slice(0, 8); // 1 utama + 4 ringkas di sampingnya + 3 kartu di bawah
  const w = state.config.wilayah || {};
  const ins = insightsFromStats(s).slice(0, 4);
  const jk = [{ v: 'Laki-laki', n: s.laki || 0 }, { v: 'Perempuan', n: s.perempuan || 0 }];
  const pyr = s.piramida || [];
  const peak = Math.max(1, ...pyr.map((x) => Math.max(x.l, x.p)));
  const tiles = [['Penduduk', s.penduduk, 'jiwa', 'users'], ['Kepala Keluarga', s.kk, s.rataKeluarga ? `${String(s.rataKeluarga).replace('.', ',')} jiwa/KK` : 'KK', 'home'], ['Laki-laki', s.laki, s.penduduk ? `${pct(s.laki, s.penduduk).toString().replace('.', ',')}%` : '', 'users'], ['Perempuan', s.perempuan, s.penduduk ? `${pct(s.perempuan, s.penduduk).toString().replace('.', ',')}%` : '', 'users'], ['Usia Produktif', s.produktif, '15–64 tahun', 'chart'], ['Dusun', s.dusun, 'wilayah', 'map']];
  const blocks = {
    hero: `<section class="hero">
      <div class="hero-text">
        <span class="eyebrow">${ic('loc')} ${esc([w.kecamatan && 'Kec. ' + w.kecamatan, w.kabupaten, w.provinsi].filter(Boolean).join(' · ') || 'Portal Data Publik')}</span>
        <h1>Portal Data & Informasi<br>${esc(`${desaJenis()} ${desaName()}`.trim())}</h1>
        <div class="hero-desc rich">${state.config.deskripsi ? richRender(state.config.deskripsi) : esc(HERO_DESC_DEFAULT)}</div>
        <div class="hero-actions" data-hl-btns>
          <a class="btn btn-primary" href="#/informasi" title="Informasi Terbaru">${ic('mega')} Informasi<span class="xw"> Terbaru</span></a>
          <a class="btn btn-ghost" href="#/data" title="Jelajahi Data">${ic('chart')} <span class="xw">Jelajahi </span>Data</a>
          <a class="btn btn-ghost" href="#/dokumen" title="Dokumen Publik">${ic('file')} Dokumen<span class="xw"> Publik</span></a>
        </div>
      </div>
      <div class="hero-tiles" data-hl-group>${tiles.map(([l, v, sub, i], n) => `<a class="tile${n ? '' : ' hl'}" href="${statHref({ Penduduk: 'penduduk', 'Kepala Keluarga': 'kk', 'Laki-laki': 'laki', Perempuan: 'perempuan', 'Usia Produktif': 'produktif', Dusun: 'dusun' }[l] || 'penduduk')}"><span class="tile-ic">${ic(i)}</span><b>${v != null ? fmtNum(v) : '–'}</b><span>${esc(l)}</span><small>${esc(sub)}</small></a>`).join('')}</div>
    </section>`,
    berita: `<section class="section news-wide"><div class="section-head"><h2>${ic('mega')} Informasi & Berita Terbaru</h2><a href="#/informasi" class="link">Lihat semua →</a></div>
      ${latest.length ? `<div class="news-top ${latest.length > 1 ? '' : 'solo'}"><div class="cards news-cards news-lead">${infoCard(latest[0], true)}</div>
        ${latest.length > 1 ? `<div class="news-side" aria-label="Informasi lainnya">${latest.slice(1, 5).map(newsMini).join('')}</div>` : ''}</div>
        ${latest.length > 5 ? `<div class="cards news-cards news-rest">${latest.slice(5).map((x) => infoCard(x)).join('')}</div><div class="news-side news-more-m">${latest.slice(5).map(newsMini).join('')}</div>` : ''}` : emptyBox('Belum ada informasi yang diterbitkan.')}
    </section>`,
    layanan: `<section class="section"><div class="section-head"><h2>${ic('shield')} Layanan & Kelembagaan</h2><a href="#/lembaga" class="link">Semua lembaga →</a></div>
      <div class="svc-grid">
        ${PAGES.filter((p) => ['layanan', 'struktur', 'visimisi', 'apbdes', 'potensi', 'kontak'].includes(p.key)).map((p) => `<a class="svc" href="#/profil/${p.key}">${ic(p.icon)}<span>${esc(pageLabel(p))}</span></a>`).join('')}
        ${KATEGORI.map((k) => `<a class="svc svc-alt" href="#/lembaga/k/${k.key}">${ic(k.icon)}<span>${esc(k.short)}<small>${lembagaOf(k.key).filter((l) => l.published !== false).length} lembaga</small></span></a>`).join('')}
      </div></section>`,
    galeri: pubHighlight(false),
    insight: ins.length ? `<section class="section"><div class="section-head"><h2>${ic('bulb')} Insight Penduduk</h2><a href="#/infografis" class="link">Infografis →</a></div>
      <div class="insight-list">${ins.map((x) => `<div class="insight">${ic(x.icon)}<p>${esc(x.text)}</p></div>`).join('')}</div></section>` : '',
    viz: s.penduduk ? `<section class="section">
      <div class="section-head"><h2>${ic('chart')} Visualisasi Demografi</h2><a href="#/infografis" class="link">Infografis lengkap →</a></div>
      <div class="viz-grid">
        <div class="panel viz"><h3>Jenis Kelamin</h3>${donut(jk, { size: 170, center: fmtNum(s.penduduk), sub: 'jiwa' })}</div>
        <div class="panel viz viz-wide"><h3>Piramida Penduduk</h3>${pyr.length ? `<div class="pyramid compact"><div class="pyr-head"><span>Laki-laki</span><span></span><span>Perempuan</span></div>${[...pyr].reverse().map((x) => `<div class="pyr-row"><span class="pyr-l"><i style="width:${(x.l / peak) * 100}%"></i><b>${x.l}</b></span><span class="pyr-g">${esc(x.g)}</span><span class="pyr-p"><i style="width:${(x.p / peak) * 100}%"></i><b>${x.p}</b></span></div>`).join('')}</div>` : emptyBox('Belum ada data')}</div>
        ${(s.breakdown?.dusun || []).length ? `<div class="panel viz"><h3>Penduduk per Dusun</h3>${donut(s.breakdown.dusun, { size: 170, center: String(s.breakdown.dusun.length), sub: 'dusun' })}</div>` : ''}
      </div></section>` : '',
    data: s.penduduk ? `<section class="section"><div class="section-head"><h2>${ic('db')} Data Publik</h2><span class="muted small">Klik kartu untuk melihat rincian</span></div>${dataPortalCards()}</section>` : '',
  };
  const keys = ordered(HOME_KEYS, state.config.layout?.home);
  return `<div class="home-sections" data-sort="home">${keys.map((k) => blocks[k] || state.layoutEdit === 'public' ? `<div class="home-block" data-key="${k}">${blocks[k] || `<div class="empty small">Panel “${k}” kosong (belum ada data)</div>`}</div>` : '').join('')}</div>`;
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

// Tanda "Diterbitkan oleh …" (tanpa nama berulang)
function penulisSign(i, full = false) {
  const p = i.penulis; if (!p || !p.nama) return '';
  const ttl = penulisLabel(p); const ed = i.diubahOleh ? penulisLabel(i.diubahOleh) : '';
  return `<div class="byline">${avatar(p, 'sm')}<span>Diterbitkan oleh <b>${esc(ttl)}</b>${badgeRow(p.badges, full ? 8 : 3)}${full && p.jabatan && !ttl.includes(p.jabatan) ? ` <small class="muted">· ${esc(p.jabatan)}</small>` : ''}${full && ed && ed !== ttl ? `<br><small class="muted">Diperbarui oleh ${esc(ed)}</small>` : ''}</span></div>`;
}
const infoThumb = (i) => i.gambar || (i.media || []).map((m) => mediaThumb(m.url)).find(Boolean) || '';
const hasVideo = (i) => (i.media || []).some((m) => /youtu|drive\.google|\.mp4/i.test(m.url));
// v2.9.13: tombol Sunting di kartu & halaman baca — hanya untuk staf yang berhak mengelola Papan Informasi
const infoEditBtn = (i, sm = false) => (state.user && can('informasi') ? `<a class="btn ${sm ? 'btn-sm ' : ''}btn-ghost btn-edit" href="#/admin/informasi?edit=${esc(i.id)}" title="Sunting informasi ini (staf)">${ic('edit')} Sunting</a>` : '');
function infoCard(i, featured = false) {
  const th = infoThumb(i); const txt = plainText(i.isi).replace(/\s+/g, ' ').trim();
  return `<article class="info-card ${featured ? 'featured' : ''}">
    ${th ? `<a href="#/informasi/${i.id}" class="info-img"><img loading="lazy" src="${esc(th)}" alt="" onerror="this.closest('.info-img')?.remove()">${hasVideo(i) ? '<span class="play">▶</span>' : ''}</a>` : ''}
    <div class="info-body">
      <div class="info-meta"><span class="badge">${esc(i.kategori || 'Informasi')}</span>${i.pinned ? `<span class="badge badge-warn">${ic('pin')} Disematkan</span>` : ''}</div>
      <h3><a href="#/informasi/${i.id}">${esc(i.judul)}</a></h3>
      <p class="muted small">${esc(fmtDate(i.createdAt))}${i.tanggalAcara ? ` • Acara: ${esc(fmtDate(i.tanggalAcara))}` : ''}</p>
      <p class="excerpt">${esc(txt.slice(0, featured ? 260 : 150))}${txt.length > (featured ? 260 : 150) ? '…' : ''}</p>
      ${penulisSign(i)}
      <div class="info-actions"><a class="btn btn-sm btn-ghost" href="#/informasi/${i.id}">Baca</a>
      <a class="btn btn-sm btn-wa" href="${esc(waShareLink(infoMessage(i)))}" target="_blank" rel="noopener">${ic('wa')} Bagikan</a>${infoEditBtn(i, true)}</div>
    </div></article>`;
}
function infoMessage(i, withLink = true) {
  const parts = [`*${String(i.kategori || 'INFORMASI').toUpperCase()} — ${desaJenis().toUpperCase()} ${desaName().toUpperCase()}*`, '', `*${i.judul}*`];
  if (i.tanggalAcara) parts.push(`📅 ${fmtDate(i.tanggalAcara)}${i.waktu ? ' • ' + i.waktu : ''}`);
  if (i.lokasi) parts.push(`📍 ${i.lokasi}`);
  parts.push('', htmlToWa(i.isi || ''));
  const vids = (i.media || []).filter((m) => /youtu/i.test(m.url));
  if (vids.length) parts.push('', ...vids.map((m) => `▶ ${m.judul ? m.judul + ': ' : ''}${m.url}`));
  if (i.penulis?.nama) parts.push('', `_Diterbitkan oleh ${penulisLabel(i.penulis)}_`);
  if (withLink && i.id) parts.push('', `Selengkapnya: ${appLink('/informasi/' + i.id)}`);
  if (state.config.waFooter) parts.push('', state.config.waFooter);
  return parts.join('\n');
}
function pubInfoList(kat) {
  const all = pubInfo();
  const kats = [...new Set(all.map((i) => i.kategori).filter(Boolean))];
  const list = kat ? all.filter((i) => i.kategori === kat) : all;
  return `<section class="section"><div class="section-head"><h2>${ic('mega')} Papan Informasi</h2></div>
    <div class="chips"><a class="chip ${!kat ? 'active' : ''}" href="#/informasi">Semua</a>${kats.map((k) => `<a class="chip ${k === kat ? 'active' : ''}" href="#/informasi?k=${encodeURIComponent(k)}">${esc(k)}</a>`).join('')}</div>
    ${list.length ? `<div class="cards">${list.map(infoCard).join('')}</div>` : emptyBox('Belum ada informasi.')}
  </section>`;
}
function pubInfoDetail(id) {
  const i = pubInfo().find((x) => x.id === id);
  if (!i) {
    // Mungkin belum termuat; ambil langsung
    F.getDoc(C(`informasi/${id}`)).then((s) => {
      if (s.exists() && s.data().published && !state.info.find((x) => x.id === id)) { state.info.push({ id, ...s.data() }); render(true); }
    }).catch(() => {});
    return `<section class="section narrow">${emptyBox('Memuat informasi… Jika tidak muncul, informasi mungkin sudah dihapus.')}</section>`;
  }
  const ev = [i.tanggalAcara && { icon: 'cal', text: fmtDate(i.tanggalAcara) + (i.waktu ? ' • ' + i.waktu : '') }, i.lokasi && { icon: 'loc', text: i.lokasi }];
  const share = waShareLink(infoMessage(i));
  return readerPage({
    back: { href: '#/informasi', label: 'Papan Informasi' },
    badges: `<span class="badge">${esc(i.kategori || 'Informasi')}</span>${i.pinned ? `<span class="badge badge-warn">${ic('pin')} Disematkan</span>` : ''}`,
    title: i.judul, date: fmtDate(i.createdAt, true), mins: readMins(plainText(i.isi)), byline: penulisSign(i, true), author: i.penulis?.nama ? penulisLabel(i.penulis) : '',
    event: ev, cover: i.gambar, body: `<div class="article-body rich">${richRender(i.isi)}</div>`,
    media: (i.media || []).length ? i.media.map(mediaEmbed).join('') : '',
    actions: `<a class="btn btn-wa" href="${esc(share)}" target="_blank" rel="noopener">${ic('wa')} Bagikan ke WhatsApp</a><button class="btn btn-ghost" data-copy-link="${esc(appLink('/informasi/' + i.id))}">${ic('copy')} Salin tautan</button>${infoEditBtn(i)}`,
    share: { href: share, label: 'Bagikan ke WhatsApp' },
    othersTitle: 'Informasi lainnya', others: pubInfo().filter((x) => x.id !== i.id).slice(0, 4).map((x) => ({ href: `#/informasi/${x.id}`, title: x.judul, sub: [x.kategori, fmtDate(x.createdAt)].filter(Boolean).join(' · ') })),
  });
}

let kgDelegated = false;
function bindPublic() {
  $$('[data-copy-link]').forEach((b) => b.onclick = () => copyText(b.dataset.copyLink));
  if (state.deferredPrompt) $$('[data-install]').forEach((b) => b.hidden = false);
  $('#pubnav-toggle')?.addEventListener('click', () => document.body.classList.toggle('pubnav-open'));
  $('#mnav-menu')?.addEventListener('click', () => document.body.classList.toggle('pubnav-open'));
  // baris kegiatan rutin bisa diklik → halaman detail
  if (!kgDelegated) { kgDelegated = true; const go = (e) => { const el = e.target.closest?.('.kg-list [data-link]'); if (!el || e.target.closest('a')) return; if (e.type === 'keydown' && e.key !== 'Enter') return; location.hash = el.dataset.link; }; document.addEventListener('click', go); document.addEventListener('keydown', go); }
  $('#mnav-scrim')?.addEventListener('click', () => document.body.classList.remove('pubnav-open'));
  // Dropdown: di desktop terbuka saat diarahkan & TIDAK langsung tertutup ketika kursor pindah ke submenu
  const hoverable = () => matchMedia('(hover: hover) and (min-width: 861px)').matches;
  $$('.dropdown').forEach((dd) => {
    const btn = dd.querySelector('.dropdown-btn');
    let t = 0;
    const setOpen = (o) => { clearTimeout(t); if (o) $$('.dropdown.open').forEach((x) => { if (x !== dd) { x.classList.remove('open'); x.querySelector('.dropdown-btn')?.setAttribute('aria-expanded', 'false'); } }); dd.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); };
    dd.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && hoverable()) setOpen(true); });
    dd.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && hoverable()) { clearTimeout(t); t = setTimeout(() => setOpen(false), 400); } });
    btn.onclick = (e) => { e.stopPropagation(); setOpen(hoverable() ? true : !dd.classList.contains('open')); };
    dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setOpen(false); btn.focus(); } });
    dd.querySelectorAll('.dropdown-menu a').forEach((a) => a.addEventListener('click', () => { setOpen(false); document.body.classList.remove('pubnav-open'); }));
  });
  document.addEventListener('click', closeDropdowns);
  bindDataPortal();
  bindLembagaPublic();
  bindDokumenPublic();
  startPublicTickers();
  if (!isPhone()) startTicker();
  startNewsScroller();
}
function closeDropdowns(e) { if (!e.target.closest('.dropdown')) $$('.dropdown.open').forEach((x) => x.classList.remove('open')); }

// ================================================================ LOGIN (Admin: email + password)
function renderLogin() {
  state.view = 'login'; unmountVisitorWidget();
  root.dataset.shell = 'login';
  root.innerHTML = `<div class="login-page">
    <form class="login-card" id="login-form">
      <div class="logo-mark big">${logoImg()}</div>
      <h1>Masuk Admin</h1>
      <p class="muted">${esc(desaJenis())} ${esc(desaName())}</p>
      <label class="field"><span>Email</span><input type="email" id="em" autocomplete="username" required placeholder="email@contoh.com"></label>
      <label class="field"><span>Password</span>
        <div class="input-group"><input type="password" id="pw" autocomplete="current-password" required placeholder="Password">
        <button type="button" class="btn btn-ghost" id="pw-toggle" aria-label="Tampilkan password">${ic('eye')}</button></div></label>
      <button class="btn btn-primary btn-block" id="login-btn">${ic('lock')} Masuk</button>
      <p class="err" id="login-err" role="alert"></p>
      <div class="login-links"><a href="#" id="forgot">Lupa password?</a><a href="#/">← Ke beranda</a></div>
      <p class="muted small center">Akun admin hanya dapat dibuat oleh Super Admin.</p>
      <p class="muted small center"><span>${APP.name} v${APP.version}</span> • <span class="copyright" data-copyright>${esc(APP.credit)}</span></p>
    </form></div>`;
  $('#pw-toggle').onclick = () => { const p = $('#pw'); p.type = p.type === 'password' ? 'text' : 'password'; };
  $('#forgot').onclick = async (e) => {
    e.preventDefault();
    const em = $('#em').value.trim();
    if (!em) { $('#login-err').textContent = 'Isi email terlebih dahulu, lalu klik "Lupa password?".'; return; }
    try { await F.sendPasswordResetEmail(F.auth, em); toast('Jika email terdaftar, tautan reset password telah dikirim.', 'success'); }
    catch (err) { toast(authErrorMessage(err), 'error'); }
  };
  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('#login-btn'), errEl = $('#login-err');
    const lock = Number(localStorage.getItem('dd:lockUntil') || 0);
    if (Date.now() < lock) { errEl.textContent = `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((lock - Date.now()) / 60000)} menit.`; return; }
    btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span> Memeriksa…'; errEl.textContent = '';
    const lw = Sync.beginLogin($('#pw').value);
    try {
      sessionStorage.setItem('dd:justLogin', '1');
      const cred = await F.signInWithEmailAndPassword(F.auth, $('#em').value.trim(), $('#pw').value);
      lw.done(cred.user.uid);
      location.hash = '#/admin';
    } catch (err) {
      lw.fail();
      sessionStorage.removeItem('dd:justLogin');
      loginFailed();
      errEl.textContent = authErrorMessage(err).replace('Password salah.', 'Email atau password salah.');
      btn.disabled = false; btn.innerHTML = `${ic('lock')} Masuk`;
    }
  };
}

// ================================================================ ADMIN SHELL
// Menu admin dikelompokkan: [kunci, label, ikon, izin, grup]
const NAV = [
  ['dashboard', 'Dasbor', 'grid', null, 'Utama'],
  ['warga', 'Data Warga', 'users', 'warga', 'Kependudukan'], ['import', 'Import Excel', 'upload', 'import', 'Kependudukan'],
  ['dusun', 'Dusun & Kadus', 'map', 'dusun', 'Kependudukan'], ['master', 'Data Master', 'db', 'master', 'Kependudukan'], ['laporan', 'Laporan & Ekspor', 'chart', 'export', 'Kependudukan'],
  ['lembaga', 'Lembaga Gampong', 'shield', 'lembagaAny', 'Kelembagaan'],
  // v2.9.12: urutan Publikasi — Profil Gampong → Papan Informasi → Dokumen Publik → Kegiatan Rutin → Kirim WhatsApp → Instagram
  ['profil', 'Profil Gampong', 'book', 'profil', 'Publikasi'], ['informasi', 'Papan Informasi', 'mega', 'informasi', 'Publikasi'],
  ['dokumen', 'Dokumen Publik', 'file', 'dokumen', 'Publikasi'], ['kegiatan', 'Kegiatan Rutin', 'repeat', 'kegiatan', 'Publikasi'],
  ['broadcast', 'Kirim WhatsApp', 'wa', 'broadcast', 'Publikasi'], ['instagram', 'Instagram', 'ig', 'instagram', 'Publikasi'],
  ['pengaturan', 'Pengaturan', 'cog', null, 'Sistem'], ['tampilan', 'Tampilan & Tema', 'eye', 'super', 'Sistem'], ['latar', 'Latar Belakang', 'image', 'latar', 'Sistem'],
  ['widget', 'Widget Beranda', 'news', 'super', 'Sistem'], ['monitor', 'Monitor & Analitik', 'activity', 'super', 'Sistem'],
  ['admin', 'Manajemen Akun', 'lock', 'akun', 'Admin'],
  ['viewas', 'Lihat Sebagai', 'eye', 'super', 'Super Admin'], ['audit', 'Audit Log', 'log', 'super', 'Super Admin'], ['cadangan', 'Cadangan & Pemulihan', 'archive', 'super', 'Super Admin'],
];
const NAV_GROUPS = ['Utama', 'Kependudukan', 'Kelembagaan', 'Publikasi', 'Sistem', 'Admin', 'Super Admin'];
// Admin › Manajemen Akun: Super Admin, atau admin yang diberi badge Centang Hijau — Perangkat Gampong
const navAllowed = ([, , , p]) => !p || (p === 'super' ? isSuper() : p === 'akun' ? (isSuper() || hasGreen()) : p === 'lembagaAny' ? (can('lembaga') || isPengelola()) : can(p));
function updateShellBrand() {
  const b = $('#shell-brand'); if (b) b.innerHTML = `<span class="logo-mark">${logoImg()}</span><span class="brand-text"><b>${esc(desaName())}</b><small>${APP.name} v${APP.version}</small></span>`;
}
function renderAdmin(r, soft) {
  const sec = r.parts[1] || 'dashboard';
  unmountVisitorWidget(); stopPresence(); pubStarted = false;
  if (root.dataset.shell !== 'admin') {
    root.dataset.shell = 'admin';
    const items = NAV.filter(navAllowed);
    const link = ([k, l, i]) => `<a href="#/admin/${k}" data-nav="${k}">${ic(i)}<span>${l}</span>${k === 'cadangan' ? '<i class="nav-dot" id="nav-dot-cadangan" hidden title="Waktunya mencadangkan data"></i>' : ''}</a>${k === 'lembaga' && can('lembaga') ? `<div class="nav-sub">${KATEGORI.map((c) => `<a href="#/admin/lembaga/k/${c.key}" data-nav="lembaga/k/${c.key}">${esc(c.short)}</a>`).join('')}<a href="#/admin/lembaga/berita" data-nav="lembaga/berita">Berita & Kegiatan</a></div>` : k === 'lembaga' && isPengelola() ? `<div class="nav-sub"><a href="#/admin/lembaga/berita" data-nav="lembaga/berita">Berita & Kegiatan</a></div>` : ''}`;
    const navHtml = NAV_GROUPS.map((g) => { const its = items.filter((n) => n[4] === g); return its.length ? `${g === 'Utama' ? '' : `<small class="nav-group">${g}</small>`}${its.map(link).join('')}${g === 'Utama' ? navSearchHtml() : ''}` : ''; }).join('');
    root.innerHTML = `<div class="admin">
      <aside class="sidebar">
        <a class="brand" id="shell-brand" href="#/admin"></a>
        <a class="me" href="#/admin/pengaturan" title="Profil saya">${avatar(state.profile)}<div><b>${esc(state.profile?.nama || '')}</b>${badgeRow(state.profile?.badges, 4, false)}<small><span class="badge ${isSuper() ? 'badge-warn' : isKadus() ? 'badge-ok' : ''}">${esc(isPengelola() && !Object.values(state.perms || {}).some(Boolean) ? 'Pengelola Lembaga' : ROLE_LABEL[state.role] || state.role)}${isKadus() ? ' · ' + esc(myDusun()) : ''}</span></small></div></a>
        <nav class="side-nav">${navHtml}</nav>
        <div class="side-foot">
          <a href="#/" target="_blank">${ic('ext')}<span>Lihat Situs Publik</span></a>
          ${menuExtras(true)}
          <button id="logout">${ic('out')}<span>Keluar</span></button>
          <p class="muted small copyright" data-copyright>${esc(APP.credit)}</p>
        </div>
      </aside>
      <div class="admin-body">
        <header class="topbar"><button class="icon-btn" id="nav-toggle" aria-label="Menu">${ic('menu')}</button><h2 id="page-title"></h2><div class="topbar-right"><button class="icon-btn lite-btn" data-lite-toggle aria-label="Mode ringan"></button><button class="icon-btn theme-btn" data-theme-toggle aria-label="Mode gelap/terang"></button><button class="btn btn-sm btn-ghost" data-install hidden>${ic('phone')} Pasang</button><span class="muted small hide-sm">${esc(state.user?.email || '')}</span></div></header>
        <main class="admin-main" id="admin-main"></main>
        <footer class="admin-footer"><span title="${esc(APP.buildLabel)}">${APP.name} v${APP.version} • Build ${APP.build} • ${APP.revision}</span> • <span class="copyright" data-copyright>${esc(APP.credit)}</span></footer>
      </div>
      <div class="nav-scrim" id="nav-scrim"></div>
    </div>`;
    $('#nav-toggle').onclick = () => document.body.classList.toggle('nav-open');
    $('#nav-scrim').onclick = () => document.body.classList.remove('nav-open');
    $('#logout').onclick = async () => { if (await confirmDialog('Keluar dari akun admin? Data yang tersimpan sementara di perangkat ini akan dihapus.', { okText: 'Keluar' })) doLogout('logout'); };
    if (state.deferredPrompt) $$('[data-install]').forEach((b) => b.hidden = false);
    bindNavSearch(() => navIndex({ NAV, navAllowed, KATEGORI, lembagaKat: (k) => KATEGORI.find((c) => c.key === k)?.short || '' }));
  }
  updateShellBrand();
  // pita mode "Lihat Sebagai"
  document.body.classList.toggle('viewas', !!state.viewAs);
  $('#viewas-bar')?.remove();
  if (state.viewAs) { $('.admin-body')?.insertAdjacentHTML('afterbegin', viewAsBar()); $('#viewas-exit').onclick = exitViewAs; }
  const navKey = sec === 'lembaga' && r.parts[2] === 'k' ? `lembaga/k/${r.parts[3]}` : sec === 'lembaga' && r.parts[2] === 'berita' ? 'lembaga/berita' : sec;
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === navKey || (sec === 'lembaga' && a.dataset.nav === 'lembaga' && navKey === 'lembaga')));
  applyTheme(state.config.tema);
  applyBackground(null);
  const item = NAV.find((n) => n[0] === sec);
  $('#page-title').textContent = item ? item[1] : 'Admin';
  const main = $('#admin-main');
  if (!soft) main.removeAttribute('data-guard');
  const y = soft ? window.scrollY : 0;
  if (item && !navAllowed(item)) {
    state.view = 'denied';
    main.innerHTML = `<div class="callout">${ic('lock')}<div><b>Akses ditolak</b><p>Menu ini tidak termasuk hak akses Anda. Hubungi Super Admin.</p></div></div>`;
    logAudit('akses', 'akses_ditolak', `Mencoba membuka menu ${item[1]} tanpa izin`);
    return;
  }
  const views = {
    dashboard: viewDashboard, warga: viewWarga, import: viewImport, dusun: viewDusun, master: viewMaster, laporan: viewLaporan,
    informasi: viewInformasi, broadcast: viewBroadcast, instagram: viewInstagram, pengaturan: viewPengaturan,
    profil: viewProfilAdmin, kegiatan: viewKegiatanAdmin, admin: viewAdmins, audit: viewAudit, cadangan: viewCadangan, latar: viewLatar,
    lembaga: viewLembagaAdmin, dokumen: viewDokumenAdmin, tampilan: viewTampilan, widget: viewWidget, monitor: viewMonitor,
    viewas: (m) => viewViewAs(m, { enter: enterViewAs }),
  };
  if (sec !== 'dashboard' && state.layoutEdit === 'dash') { state.layoutEdit = null; layoutStop?.(); }
  (views[sec] || viewDashboard)(main, r);
  if (!soft && ['warga', 'laporan'].includes(sec)) logOnce(`akses_${sec}`, () => logAudit('akses', `buka_${sec}`, `Membuka menu ${item[1]}`));
  if (soft) window.scrollTo(0, y); else window.scrollTo(0, 0);
}
const _logged = new Set();
function logOnce(key, fn) { if (_logged.has(key)) return; _logged.add(key); fn(); }

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
function adminInsights(all) {
  const aktif = all.filter(isAktif); const t = aktif.length; const out = [];
  if (!t) return out;
  const d12 = aktif.filter((w) => /desil [12]\b/i.test(w.desil || ''));
  const d12no = d12.filter((w) => !w.bansos || norm(w.bansos) === 'tidak menerima');
  if (d12no.length) out.push({ tone: 'warn', icon: 'bulb', text: `${d12no.length} warga Desil 1–2 (miskin) belum menerima bansos — potensi exclusion error, perlu diverifikasi.`, link: '#/admin/laporan' });
  const d6 = aktif.filter((w) => /desil 6/i.test(w.desil || '') && w.bansos && norm(w.bansos) !== 'tidak menerima');
  if (d6.length) out.push({ tone: 'warn', icon: 'bulb', text: `${d6.length} warga Desil 6+ (mampu) tercatat menerima bansos — potensi inclusion error.` });
  const noBpjs = aktif.filter((w) => /belum terdaftar|tidak aktif/i.test(w.bpjs || ''));
  if (noBpjs.length) out.push({ tone: noBpjs.length / t > 0.2 ? 'warn' : '', icon: 'shield', text: `${noBpjs.length} warga (${String(pct(noBpjs.length, t)).replace('.', ',')}%) belum terdaftar / tidak aktif BPJS Kesehatan.`, link: filterLink('bpjs', 'Belum Terdaftar') });
  const lansiaNo = noBpjs.filter((w) => Number(w.umur) >= 60);
  if (lansiaNo.length) out.push({ tone: 'warn', icon: 'users', text: `${lansiaNo.length} lansia (60+) tanpa jaminan kesehatan aktif — prioritas pendaftaran PBI.` });
  const gizi = aktif.filter((w) => /kurang|buruk|stunting/i.test(w.gizi || ''));
  if (gizi.length) out.push({ tone: 'warn', icon: 'users', text: `${gizi.length} warga berstatus gizi kurang/buruk/stunting.` });
  const dis = aktif.filter((w) => w.disabilitas && norm(w.disabilitas) !== 'tidak ada');
  if (dis.length) out.push({ icon: 'users', text: `${dis.length} penyandang disabilitas tercatat — pastikan masuk sasaran program inklusi.` });
  const listrik = aktif.filter((w) => /450|tidak ada listrik|non-pln/i.test(w.listrik || ''));
  if (listrik.length) out.push({ icon: 'bulb', text: `${listrik.length} warga dengan daya listrik ≤450 VA / tanpa PLN.` });
  return out;
}
function dataQuality(all) {
  const out = [];
  const nikCount = new Map(); all.forEach((w) => { if (w.nik) nikCount.set(w.nik, (nikCount.get(w.nik) || 0) + 1); });
  const dup = [...nikCount.values()].filter((n) => n > 1).length;
  const q = [
    [all.filter((w) => !w.nik).length, 'warga tanpa NIK'],
    [all.filter((w) => w.nik && !/^\d{16}$/.test(w.nik)).length, 'NIK tidak 16 digit'],
    [dup, 'NIK ganda (terdaftar lebih dari sekali)'],
    [all.filter((w) => !w.tglLahir).length, 'tanggal lahir kosong'],
    [all.filter((w) => !waNumber(w.noHp)).length, 'tanpa nomor HP/WhatsApp valid'],
    [all.filter((w) => !w.dusun).length, 'belum dikelompokkan ke dusun', '#/admin/warga?dusun=__none'],
  ];
  const kkMap = new Map(); all.filter(isAktif).forEach((w) => { if (w.noKk) { const g = kkMap.get(w.noKk) || []; g.push(w); kkMap.set(w.noKk, g); } });
  const noHead = [...kkMap.values()].filter((g) => !g.some((w) => norm(w.shdk) === 'kepala keluarga')).length;
  q.push([noHead, 'No. KK tanpa anggota berstatus Kepala Keluarga']);
  for (const [n, label, link] of q) if (n) out.push({ n, label, link });
  return out;
}
function viewDashboard(main) {
  state.view = 'dash';
  if (!can('warga')) {
    main.innerHTML = `<div class="callout">${ic('shield')}<div><b>Selamat datang, ${esc(state.profile?.nama || '')}</b><p>Anda masuk sebagai ${esc(ROLE_LABEL[state.role])}. Menu yang tersedia sesuai hak akses yang diberikan Super Admin.</p></div></div>
    <div class="quick">${NAV.filter(navAllowed).filter((n) => n[0] !== 'dashboard').map(([k, l, i]) => `<a class="btn btn-ghost" href="#/admin/${k}">${ic(i)} ${l}</a>`).join('')}</div>`;
    return;
  }
  if (!state.wargaReady) { main.innerHTML = loadingBox(); return; }
  const all = state.warga; const aktif = all.filter(isAktif);
  if (isKadus()) $('#page-title').textContent = `Dasbor Dusun ${myDusun()}`;
  const kk = aktif.filter((w) => norm(w.shdk) === 'kepala keluarga').length;
  const l = aktif.filter((w) => norm(w.jk).startsWith('l')).length;
  const p = aktif.filter((w) => norm(w.jk).startsWith('p')).length;
  const bansos = aktif.filter((w) => w.bansos && norm(w.bansos) !== 'tidak menerima').length;
  const noHp = aktif.filter((w) => waNumber(w.noHp)).length;
  const t = aktif.length;
  const ins = [...insightsFromStats(computePublicStats()).map((x) => ({ ...x, tone: '' })), ...adminInsights(all)];
  const dq = dataQuality(all);
  const P = {
    stats: ['span-full', `<div class="stat-grid">
      ${statCard('Penduduk Aktif', t, `${fmtNum(all.length)} total tercatat`, 'users', '#/admin/warga?s=aktif')}
      ${statCard('Kepala Keluarga', kk, kk ? `rata-rata ${(t / kk).toFixed(1).replace('.', ',')} jiwa/KK` : 'berdasarkan SHDK', 'home', '#/admin/warga?s=kk')}
      ${statCard('Laki-laki', l, t ? `${Math.round(l / t * 100)}% penduduk aktif` : '', 'users', '#/admin/warga?s=laki')}
      ${statCard('Perempuan', p, t ? `${Math.round(p / t * 100)}% penduduk aktif` : '', 'users', '#/admin/warga?s=perempuan')}
      ${statCard('Penerima Bansos', bansos, t ? `${Math.round(bansos / t * 100)}% penduduk aktif` : '', 'db', '#/admin/warga?s=penerima')}
      ${isKadus() ? '' : statCard('Dusun', state.dusun.length, `${state.dusun.filter((d) => d.kepalaNama).length} punya kepala dusun`, 'map', can('dusun') ? '#/admin/dusun' : '')}
      ${statCard('Terhubung WhatsApp', noHp, t ? `${Math.round(noHp / t * 100)}% punya nomor HP` : '', 'wa', '#/admin/warga?s=adaHp')}
      ${!isKadus() && (can('lembaga') || isSuper()) ? statCard('Lembaga Gampong', state.lembaga.length, `${state.lembaga.reduce((a, x) => a + (x.pengurus?.length || 0), 0)} pengurus tercatat`, 'shield', '#/admin/lembaga') : ''}
      ${!isKadus() && can('dokumen') ? statCard('Dokumen Publik', state.dokumen.length, `${state.dokumen.filter((d) => d.published !== false).length} tampil di publik`, 'file', '#/admin/dokumen') : ''}
    </div>`],
    quick: ['span-full', `<div class="quick">
      ${can('wargaEdit') ? `<a class="btn btn-primary" href="#/admin/warga/baru">${ic('plus')} Tambah Warga</a>` : ''}
      ${can('import') ? `<a class="btn btn-ghost" href="#/admin/import">${ic('upload')} Import Excel</a>` : ''}
      ${can('informasi') ? `<a class="btn btn-ghost" href="#/admin/informasi?baru=1">${ic('mega')} Tulis Informasi</a>` : ''}
      ${can('dokumen') && !isKadus() ? `<a class="btn btn-ghost" href="#/admin/dokumen">${ic('file')} Dokumen Publik</a>` : ''}
      ${can('export') ? `<a class="btn btn-ghost" href="#/admin/laporan">${ic('download')} Ekspor Laporan</a>` : ''}
    </div>`],
    insight: ['span-2', all.length ? `<div class="panel"><h3>${ic('bulb')} Insight Penduduk</h3><div class="insight-list">${ins.map((x) => `<div class="insight ${x.tone === 'warn' ? 'warn' : ''}" ${x.link ? `data-link="${esc(x.link)}"` : ''}>${ic(x.icon)}<p>${esc(x.text)}</p></div>`).join('') || emptyBox('Belum cukup data')}</div></div>` : ''],
    kualitas: ['', all.length ? `<div class="panel"><h3>${ic('check')} Kualitas Data</h3>${dq.length ? `<div class="dq">${dq.map((d) => `<div class="dq-row" ${d.link ? `data-link="${esc(d.link)}"` : ''}><b>${fmtNum(d.n)}</b><span>${esc(d.label)}</span></div>`).join('')}</div><p class="muted small">Lengkapi data agar laporan dan penyaluran bantuan lebih akurat.</p>` : `<div class="callout ok">${ic('check')}<div><b>Data lengkap</b><p>Tidak ditemukan masalah kualitas data.</p></div></div>`}</div>` : ''],
    dusun: ['', `<div class="panel"><h3>Penduduk per Dusun</h3>${bars(countBy(aktif, 'dusun'), t, { max: 12, link: (k) => filterLink('dusun', k) })}</div>`],
    umur: ['', `<div class="panel"><h3>Kelompok Umur</h3>${bars(AGE_GROUPS.map((g) => [g[2], aktif.filter((w) => ageGroup(w.umur) === g[2]).length]).filter((e) => e[1]), t, { link: (k) => filterLink('kelompokUmur', k) })}</div>`],
    bansos: ['', `<div class="panel"><h3>Penerimaan Bansos</h3>${bars(countBy(aktif, 'bansos'), t, { link: (k) => filterLink('bansos', k) })}</div>`],
    desil: ['', `<div class="panel"><h3>Desil Kesejahteraan</h3>${bars(countBy(aktif, 'desil'), t, { link: (k) => filterLink('desil', k) })}</div>`],
    bpjs: ['', `<div class="panel"><h3>Status BPJS</h3>${bars(countBy(aktif, 'bpjs'), t, { link: (k) => filterLink('bpjs', k) })}</div>`],
    sektor: ['', `<div class="panel"><h3>Sektor Utama</h3>${bars(countBy(aktif, 'sektor'), t, { link: (k) => filterLink('sektor', k) })}</div>`],
    peristiwa: ['', `<div class="panel"><h3>Peristiwa Kependudukan</h3>${bars(countBy(all, 'peristiwa'), all.length, { link: (k) => filterLink('peristiwa', k) })}</div>`],
    info: ['', `<div class="panel"><h3>Informasi Terbaru</h3>${state.info.slice(0, 5).map((i) => `<div class="mini-row"><span>${esc(i.judul)}</span><span class="badge ${i.published ? '' : 'badge-muted'}">${i.published ? 'Terbit' : 'Draf'}</span></div>`).join('') || emptyBox('Belum ada informasi')}</div>`],
  };
  const keys = ordered(Object.keys(P), state.config.layout?.dash);
  main.innerHTML = `
  ${!all.length ? `<div class="callout">${ic('upload')}<div><b>Mulai isi data warga</b><p>Import dari Excel atau tambahkan secara manual.</p></div>${can('import') ? '<a class="btn btn-primary" href="#/admin/import">Import Excel</a>' : ''}${can('wargaEdit') ? '<a class="btn btn-ghost" href="#/admin/warga/baru">Input Manual</a>' : ''}</div>` : ''}
  <div class="dash-grid" data-sort="dash">${keys.filter((k) => P[k][1]).map((k) => `<div class="dash-block ${P[k][0]}" data-key="${k}">${P[k][1]}</div>`).join('')}</div>
  ${isSuper() ? layoutBar('dash') : ''}`;
  if (state.layoutEdit === 'dash') enableLayoutEdit('dash');
  $$('[data-link]', main).forEach((el) => el.onclick = () => { location.hash = el.dataset.link; });
}
const statCard = (label, value, sub, icon, link) => `<${link ? `a href="${esc(link)}"` : 'div'} class="stat ${link ? 'stat-link' : ''}"><span class="stat-ic">${ic(icon)}</span><div><span class="stat-label">${esc(label)}</span><b class="stat-val">${typeof value === 'number' ? fmtNum(value) : esc(value)}</b><small class="muted">${esc(sub)}</small></div>${link ? `<span class="stat-go">${ic('chev')}</span>` : ''}</${link ? 'a' : 'div'}>`;
const SPECIAL = { aktif: 'Penduduk aktif', kk: 'Kepala keluarga', laki: 'Laki-laki', perempuan: 'Perempuan', penerima: 'Penerima bansos', adaHp: 'Punya nomor WhatsApp', tanpaHp: 'Tanpa nomor HP' };
const specialMatch = (w, k) => ({
  aktif: () => isAktif(w), kk: () => isAktif(w) && norm(w.shdk) === 'kepala keluarga', laki: () => isAktif(w) && norm(w.jk).startsWith('l'), perempuan: () => isAktif(w) && norm(w.jk).startsWith('p'),
  penerima: () => isAktif(w) && w.bansos && norm(w.bansos) !== 'tidak menerima', adaHp: () => isAktif(w) && !!waNumber(w.noHp), tanpaHp: () => !waNumber(w.noHp),
}[k] || (() => true))();

// ---------------------------------------------------------------- Data Warga
function filterWarga(list, f) {
  if (f.special) list = list.filter((w) => specialMatch(w, f.special));
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
  if (isKadus()) return `<option value="${esc(myDusun())}" selected>${esc(myDusun())}</option>`;
  return `${all ? '<option value="">Semua dusun</option>' : ''}${state.dusun.map((d) => `<option ${sel === d.nama ? 'selected' : ''} value="${esc(d.nama)}">${esc(d.nama)}</option>`).join('')}${none ? `<option value="__none" ${sel === '__none' ? 'selected' : ''}>(Tanpa dusun)</option>` : ''}`;
}

function viewWarga(main, r) {
  if (r.parts[2] === 'baru') return viewWargaForm(main, null);
  if (r.parts[2] === 'edit') return viewWargaForm(main, r.parts[3]);
  state.view = 'warga';
  const f = state.filters;
  if (r.query.has('field')) { f.field = r.query.get('field'); f.value = r.query.get('value') ?? ''; f.page = 1; if (f.field === 'dusun') { f.dusun = f.value && f.value !== '(Kosong)' ? f.value : '__none'; f.field = ''; f.value = ''; } history.replaceState(null, '', '#/admin/warga'); }
  if (r.query.has('dusun')) { f.dusun = r.query.get('dusun'); f.page = 1; history.replaceState(null, '', '#/admin/warga'); }
  if (r.query.has('s')) { Object.assign(f, { special: r.query.get('s'), q: '', field: '', value: '', jk: '', page: 1 }); history.replaceState(null, '', '#/admin/warga'); }
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
    ${can('wargaEdit') ? `<a class="btn btn-primary" href="#/admin/warga/baru">${ic('plus')} Tambah Warga</a>` : ''}
    ${can('wargaEdit') ? `<button class="btn btn-ghost" id="w-kk" title="Tambah satu keluarga sekaligus dari foto Kartu Keluarga (OCR di perangkat)">${ic('image')} Scan KK</button>` : ''}
    ${can('import') ? `<a class="btn btn-ghost" href="#/admin/import">${ic('upload')} Import</a>` : ''}
    ${can('export') ? `<button class="btn btn-ghost" id="w-export">${ic('download')} Ekspor</button>` : ''}
    ${can('broadcast') ? `<button class="btn btn-wa" id="w-wa">${ic('wa')} Kirim WA</button>` : ''}
    <span class="spacer"></span>
    <select id="w-sort"><option value="nama">Urut: Nama</option><option value="dusun">Urut: Dusun</option><option value="umur">Urut: Umur</option><option value="terbaru">Urut: Terbaru</option></select>
    <select id="w-per"><option>25</option><option>50</option><option>100</option><option>250</option></select>
  </div>
  ${f.special ? `<div class="filter-chip">Saringan: <b>${esc(SPECIAL[f.special] || f.special)}</b> <button class="icon-btn" id="w-special" title="Hapus saringan">✕</button></div>` : ''}
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
  $('#w-reset').onclick = () => { Object.assign(f, { q: '', dusun: '', field: '', value: '', jk: '', special: '', page: 1 }); render(); };
  $('#w-special')?.addEventListener('click', () => { f.special = ''; f.page = 1; render(); });
  $('#w-kk')?.addEventListener('click', () => openKkScan());
  $('#w-export')?.addEventListener('click', () => exportWargaDialog(currentList(), filterTitle(), { filter: filterLine(), cols: filterCols(), pairs: filterSummary() }));
  $('#w-wa')?.addEventListener('click', () => { const ids = state.selected.size ? [...state.selected] : currentList().map((w) => w.id); sessionStorage.setItem('bc:ids', JSON.stringify(ids)); location.hash = '#/admin/broadcast?target=ids'; });
  drawTable();
}
function currentList() { return sortWarga(filterWarga(state.warga, state.filters), state.filters.sort); }
// Ringkasan SELURUH filter (termasuk yang bernilai "semua") agar hasil ekspor rapi & jelas
function filterSummary() {
  const f = state.filters; const out = [];
  if (f.special) out.push(['Saringan', SPECIAL[f.special] || f.special]);
  out.push(['Dusun', isKadus() ? myDusun() : !f.dusun ? 'Semua dusun' : f.dusun === '__none' ? 'Tanpa dusun' : f.dusun]);
  out.push(['Jenis kelamin', !f.jk ? 'L & P' : f.jk === 'l' ? 'Laki-laki' : 'Perempuan']);
  if (f.field) out.push([categoryFields().find((c) => c.key === f.field)?.label || f.field, f.value || 'Semua']);
  if (f.q) out.push(['Pencarian', `“${f.q}”`]);
  return out;
}
const filterLine = () => filterSummary().map(([k, v]) => (['Dusun', 'Jenis kelamin'].includes(k) || k === 'Saringan' ? v : `${k}: ${v}`)).join(', ');
// Kolom yang otomatis disertakan sesuai filter
function filterCols() {
  const f = state.filters; const c = [];
  if (!f.dusun || f.dusun === '__none') c.push('dusun');
  if (f.jk || f.special === 'laki' || f.special === 'perempuan') c.push('jk');
  if (f.field && fieldByKey(f.field)) c.push(f.field);
  if (f.special === 'kk') c.push('shdk');
  if (f.special === 'penerima') c.push('bansos');
  return c;
}
function filterTitle() {
  return `Data Warga — ${filterLine()}`;
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
      <td class="actions-col"><button class="icon-btn" data-view="${w.id}" title="Lihat">${ic('eye')}</button>${can('wargaEdit') ? `<a class="icon-btn" href="#/admin/warga/edit/${w.id}" title="Ubah">${ic('edit')}</a>` : ''}${can('wargaDelete') ? `<button class="icon-btn danger" data-del="${w.id}" title="Hapus">${ic('trash')}</button>` : ''}</td>
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
  el.innerHTML = `<b>${n} warga dipilih</b>${can('export') ? `<button class="btn btn-sm btn-ghost" id="b-export">${ic('download')} Ekspor</button>` : ''}${can('wargaEdit') && !isKadus() ? `<button class="btn btn-sm btn-ghost" id="b-dusun">${ic('map')} Pindah dusun</button>` : ''}${can('wargaDelete') ? `<button class="btn btn-sm btn-danger" id="b-del">${ic('trash')} Hapus</button>` : ''}<button class="btn btn-sm btn-ghost" id="b-clear">Batal pilih</button>`;
  if (!n) return;
  const sel = () => state.warga.filter((w) => state.selected.has(w.id));
  $('#b-export')?.addEventListener('click', () => exportWargaDialog(sortWarga(sel(), state.filters.sort), `Data Warga Terpilih (${n})`, { filter: `${n} warga dipilih manual · ${filterLine()}`, cols: filterCols() }));
  $('#b-del')?.addEventListener('click', () => deleteWarga([...state.selected]));
  $('#b-clear').onclick = () => { state.selected.clear(); drawTable(); };
  if ($('#b-dusun')) $('#b-dusun').onclick = () => {
    const m = modal({ title: 'Pindahkan ke dusun', size: 'sm', body: `<label class="field"><span>Dusun tujuan</span><select id="mv-d">${dusunOptions('', { all: false, none: false })}<option value="">(Kosongkan)</option></select></label>`, footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="mv-ok">Pindahkan</button>' });
    $('#mv-ok', m.el).onclick = async () => {
      const d = $('#mv-d', m.el).value; m.close();
      await batchWrite([...state.selected].map((id) => ['update', C(`warga/${id}`), { dusun: d, updatedAt: F.serverTimestamp() }]));
      logAudit('warga', 'pindah_dusun_massal', `Memindahkan ${n} warga ke dusun ${d || '(kosong)'}`, { count: n, detail: sel().map((w) => w.nama).slice(0, 50).join(', ') });
      toast(`${n} warga dipindahkan`, 'success'); state.selected.clear(); drawTable();
    };
  };
}
async function deleteWarga(ids) {
  const names = ids.length === 1 ? `“${state.warga.find((w) => w.id === ids[0])?.nama || ''}”` : `${ids.length} warga`;
  if (!await confirmDelete(`Hapus data ${names}? Tindakan ini tidak dapat dibatalkan.`)) return;
  const recs = state.warga.filter((w) => ids.includes(w.id));
  try {
    await batchWrite(ids.map((id) => ['delete', C(`warga/${id}`)])); ids.forEach((id) => state.selected.delete(id));
    logAudit('warga', 'hapus', ids.length === 1 ? `Menghapus data warga ${recs[0]?.nama || ''}` : `Menghapus ${ids.length} data warga`, { count: ids.length, target: recs.map((w) => `${w.nama} (${w.nik || '-'})`).slice(0, 40).join(', '), targetId: ids.length === 1 ? ids[0] : undefined });
    toast('Data dihapus', 'success');
  }
  catch (e) { toast('Gagal menghapus: ' + e.message, 'error'); }
}
function showWargaDetail(id) {
  const w = state.warga.find((x) => x.id === id); if (!w) return;
  logAudit('akses', 'lihat_detail', `Melihat detail warga ${w.nama}`, { target: `${w.nama} (${w.nik || '-'})`, targetId: w.id });
  const keluarga = w.noKk ? state.warga.filter((x) => x.noKk === w.noKk && x.id !== w.id) : [];
  const groups = GROUPS.map((g) => {
    const fs = allFields().filter((f) => f.group === g.id && w[f.key] !== undefined && w[f.key] !== '');
    if (!fs.length) return '';
    return `<h4 class="detail-h">${esc(g.label)}</h4><dl class="detail">${fs.map((f) => `<dt>${esc(f.label)}</dt><dd>${f.type === 'phone' && waNumber(w[f.key]) ? `<a class="wa-link" target="_blank" rel="noopener" href="${esc(waLink(w[f.key]))}">${ic('wa')} ${esc(w[f.key])}</a>` : esc(displayValue(w, f.key))}</dd>`).join('')}</dl>`;
  }).join('');
  const m = modal({
    title: w.nama || 'Detail Warga', size: 'lg',
    body: (groups || emptyBox('Data kosong')) + (keluarga.length ? `<h4 class="detail-h">Anggota Keluarga (No. KK ${esc(w.noKk)})</h4><div class="fam">${keluarga.map((k) => `<button class="fam-item" data-fam="${k.id}"><b>${esc(k.nama)}</b><small>${esc([k.shdk, k.umur !== '' && k.umur != null ? k.umur + ' th' : '', k.jk].filter(Boolean).join(' • '))}</small></button>`).join('')}</div>` : ''),
    footer: `${waNumber(w.noHp) ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(waLink(w.noHp, `Assalamu'alaikum ${w.nama}, `))}">${ic('wa')} Chat WhatsApp</a>` : ''}<span class="spacer"></span>${can('export') ? `<button class="btn btn-ghost" id="d-pdf">${ic('download')} PDF</button>` : ''}${can('wargaEdit') ? `<a class="btn btn-primary" href="#/admin/warga/edit/${w.id}">${ic('edit')} Ubah</a>` : ''}`,
  });
  m.el.querySelector('a[href^="#/admin/warga/edit"]')?.addEventListener('click', () => m.close());
  $$('[data-fam]', m.el).forEach((b) => b.onclick = () => { m.close(); showWargaDetail(b.dataset.fam); });
  if ($('#d-pdf', m.el)) $('#d-pdf', m.el).onclick = () => (logAudit('export', 'biodata_pdf', `Mengekspor biodata ${w.nama} (PDF)`, { target: w.nama, targetId: w.id }), exportPdf({
    filename: `Biodata_${w.nama}`, title: `Biodata Warga — ${w.nama}`, orientation: 'portrait', meta: { instansi: instansi() },
    sections: GROUPS.map((g) => ({ heading: g.label, head: ['Data', 'Keterangan'], body: allFields().filter((f) => f.group === g.id).map((f) => [f.label, String(displayValue(w, f.key) ?? '')]) })),
  }).catch((e) => toast(e.message, 'error')));
}

// ---- form warga
function fieldInput(f, rec) {
  const id = 'f_' + f.key; const v = esc(rec?.[f.key] ?? '');
  const base = `id="${id}" name="${f.key}"`;
  switch (f.type) {
    case 'textarea': return `<textarea ${base} rows="2">${v}</textarea>`;
    case 'date': return `<input type="date" ${base} value="${v}">`;
    case 'number': return f.key === 'umur' ? `<input type="number" ${base} value="${v}" placeholder="Otomatis dari tgl lahir" min="0" max="150">` : `<input ${base} value="${esc(fmtThousand(rec?.[f.key]))}" data-num placeholder="0">`;
    case 'nik': return `<input ${base} value="${v}" inputmode="numeric" maxlength="16" placeholder="16 digit angka">`;
    case 'phone': return `<div class="input-group"><input type="tel" ${base} value="${v}" placeholder="08xxxxxxxxxx" inputmode="tel"><a class="btn btn-wa" id="wa-test" target="_blank" rel="noopener" title="Buka WhatsApp">${ic('wa')}</a></div>`;
    case 'wilayah': return `<input ${base} value="${v}" data-id="${esc(rec?.[f.key + 'Id'] || '')}" placeholder="Ketik nama ${esc(f.label.toLowerCase())}…">`;
    case 'dusun': return isKadus() ? `<input ${base} value="${esc(myDusun())}" readonly title="Kepala Dusun hanya dapat mengelola warga dusunnya">` : `<input ${base} value="${v}" placeholder="Ketik nama dusun…">`;
    case 'select': return `<input ${base} value="${v}" data-master="${f.master}" placeholder="Ketik untuk mencari…">`;
    default: return `<input ${base} value="${v}">`;
  }
}
// isi formulir warga dari hasil OCR (kolom pilihan disesuaikan Data Master, wilayah huruf kapital awal)
function applyOcrVals(form, vals, keep = 6000) {
  const tc = (x) => x.toLowerCase().replace(/(^|[\s(/-])\S/g, (c) => c.toUpperCase());
  for (const [k, v] of Object.entries(vals)) {
    const el = form.elements[k]; if (!el || (isKadus() && k === 'dusun')) continue;
    const f = fieldByKey(k);
    el.value = f?.type === 'select' ? canonical(k, v, masterItems(f.master)) : f?.type === 'wilayah' ? tc(v) : v;
    if (f?.type === 'wilayah') el.dataset.id = '';
    el.closest('details')?.setAttribute('open', '');
    el.closest('.field')?.classList.add('ocr-filled');
    el.dispatchEvent(new Event('change', { bubbles: true })); // (tanpa event "input" agar daftar pilihan tidak terbuka semua)
  }
  form.dataset.dirty = '1';
  setTimeout(() => $$('.ocr-filled', form).forEach((x) => x.classList.remove('ocr-filled')), keep);
}
function viewWargaForm(main, id) {
  state.view = 'form';
  if (!can('wargaEdit')) { main.innerHTML = `<div class="callout">${ic('lock')}<div><b>Akses ditolak</b><p>Anda tidak memiliki izin menambah/mengubah data warga.</p></div></div>`; return; }
  const rec = id ? state.warga.find((w) => w.id === id) : null;
  if (id && !rec) { main.innerHTML = state.wargaReady ? emptyBox('Data warga tidak ditemukan.') : loadingBox(); if (!state.wargaReady) state.view = 'warga'; return; }
  $('#page-title').textContent = rec ? 'Ubah Data Warga' : 'Tambah Warga';
  const init = rec || (() => {
    const w = state.config.wilayah || {};
    return { provinsi: w.provinsi, provinsiId: w.provinsiId, kabupaten: w.kabupaten, kabupatenId: w.kabupatenId, kecamatan: w.kecamatan, kecamatanId: w.kecamatanId, kelurahan: w.kelurahan || state.config.namaDesa, kelurahanId: w.kelurahanId, dusun: state.filters.dusun && state.filters.dusun !== '__none' ? state.filters.dusun : '' };
  })();
  const fields = allFields();
  main.innerHTML = `<form id="wf" class="form-page" novalidate data-guard>
    <div class="ocr-cta"><button type="button" class="btn btn-primary btn-sm" id="wf-ocr">${ic('image')} Isi otomatis dari foto KTP</button><small class="muted">Foto KTP dibaca di perangkat ini (tidak dikirim ke mana pun), lalu kolom terisi — tinggal diperiksa.</small></div>
    <p class="muted small">Kolom bertanda * wajib diisi. Pilihan dropdown muncul saat Anda mengetik; nilai baru otomatis ditambahkan ke Data Master.</p>
    ${GROUPS.map((g) => {
      const fs = fields.filter((f) => f.group === g.id);
      if (!fs.length) return '';
      return `<details class="fieldset" ${(isLite() ? g.id === 'dasar' : ['dasar', 'wilayah'].includes(g.id) || rec) ? 'open' : ''}><summary>${esc(g.label)}</summary><div class="form-grid">
        ${fs.map((f) => `<label class="field ${f.type === 'textarea' || f.key === 'alamat' ? 'span-2' : ''}"><span>${esc(f.label)}${f.required ? ' *' : ''}</span>${fieldInput(f, init)}</label>`).join('')}
      </div></details>`;
    }).join('')}
    <div class="sticky-actions"><a class="btn btn-ghost" href="#/admin/warga">Batal</a>${rec && can('wargaDelete') ? `<button type="button" class="btn btn-danger btn-ghost" id="wf-del">${ic('trash')} Hapus</button>` : ''}<span class="spacer"></span>
      ${!rec ? '<button type="submit" class="btn btn-ghost" data-again="1">Simpan & Tambah Lagi</button>' : ''}<button type="submit" class="btn btn-primary">${ic('check')} Simpan</button></div>
  </form>`;
  const form = $('#wf');
  // dropdown master
  $$('input[data-master]', form).forEach((inp) => attachAutocomplete(inp, { source: () => masterItems(inp.dataset.master) }));
  // dusun
  bindThousands(form);
  const dIn = $('#f_dusun', form);
  if (!isKadus()) attachAutocomplete(dIn, { source: () => state.dusun.map((d) => ({ label: d.nama, sub: d.kepalaNama ? 'Kadus: ' + d.kepalaNama : '' })), smallList: 12 });
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
  // OCR KTP → isi formulir
  $('#wf-ocr', form).onclick = async () => {
    const OCR = await import('./ocr.js');
    const current = Object.fromEntries(['nik', 'nama', 'tempatLahir', 'tglLahir', 'jk', 'golDarah', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'agama', 'statusKawin', 'pekerjaan'].map((k) => [k, form.elements[k]?.value || '']));
    OCR.ocrKtpDialog({ master: masterItems, current,
      existing: (nik) => state.warga.find((x) => x.nik === nik && x.id !== rec?.id) || null,
      onExisting: (w, patch) => { // NIK sudah terdaftar → buka data tersimpan (opsional dengan kolom yang diperbarui)
        try { sessionStorage.setItem('dd:ocrPatch', JSON.stringify({ id: w.id, patch, at: Date.now() })); } catch { /* */ }
        form.removeAttribute('data-guard'); delete form.dataset.dirty; location.hash = `#/admin/warga/edit/${w.id}`;
      },
      onApply: (vals) => applyOcrVals(form, vals) });
  };
  // NIK diketik manual & sudah terdaftar → peringatan yang sama
  const nikIn = $('#f_nik', form);
  nikIn?.addEventListener('change', () => {
    $('.nik-dup', form)?.remove(); const v = nikIn.value.trim(); if (!/^\d{16}$/.test(v)) return;
    const w = state.warga.find((x) => x.nik === v && x.id !== rec?.id); if (!w) return;
    nikIn.closest('.field').insertAdjacentHTML('beforeend', `<div class="nik-dup">${ic('bell')}<span><b>Data sudah tersedia, Silahkan cek kembali untuk penyesuaian.</b> NIK ini milik <b>${esc(w.nama || '-')}</b>${w.dusun ? ` (Dusun ${esc(w.dusun)})` : ''}.</span><a class="btn btn-sm btn-ghost" href="#/admin/warga/edit/${w.id}">${ic('edit')} Buka & perbarui</a></div>`);
  });
  // datang dari scan KTP dengan NIK yang sudah terdaftar → kolom yang dipilih langsung diisi untuk diperbarui
  if (rec) {
    let pend = null; try { pend = JSON.parse(sessionStorage.getItem('dd:ocrPatch') || 'null'); } catch { /* */ }
    if (pend && pend.id === rec.id && Date.now() - pend.at < 120000) {
      sessionStorage.removeItem('dd:ocrPatch');
      const n = Object.keys(pend.patch || {}).length;
      form.insertAdjacentHTML('afterbegin', `<div class="callout ocr-upd">${ic('bell')}<div><b>Data sudah tersedia, Silahkan cek kembali untuk penyesuaian.</b><p>${n ? `${n} kolom diperbarui dari hasil scan KTP (disorot). Periksa lalu klik <b>Simpan</b> untuk menyimpan perubahan.` : 'Ini data tersimpan untuk NIK tersebut. Ubah bila perlu, lalu klik Simpan.'}</p></div></div>`);
      if (n) applyOcrVals(form, pend.patch, 12000);
    }
  }
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
      if (f.type === 'number') v = parseNum(v);
      else if (f.type === 'phone') v = normalizePhone(v);
      else if (f.type === 'select') v = canonical(f.key, v, masterItems(f.master));
      data[f.key] = v;
      if (f.type === 'wilayah') data[f.key + 'Id'] = el.dataset.id || '';
    }
    if (data.tglLahir) { const a = ageFromDate(data.tglLahir); if (a !== '') data.umur = a; }
    if (isKadus()) data.dusun = myDusun();
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
      if (!isKadus()) await ensureDusun([data.dusun]);
      if (rec) {
        await F.updateDoc(C(`warga/${rec.id}`), { ...clean(data), updatedAt: F.serverTimestamp() });
        const ch = diff(rec, data, (k) => fieldByKey(k)?.label || k);
        logAudit('warga', 'ubah', `Mengubah data warga ${data.nama}`, { target: `${data.nama} (${data.nik || '-'})`, targetId: rec.id, changes: ch, count: Object.keys(ch).length });
      } else {
        const ref = await F.addDoc(F.collection(F.db, 'warga'), { ...clean(data), createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp(), createdBy: state.user.email });
        logAudit('warga', 'tambah', `Menambah warga baru ${data.nama}`, { target: `${data.nama} (${data.nik || '-'})`, targetId: ref.id });
      }
      toast(`Data ${data.nama} tersimpan`, 'success');
      if (again && !rec) { viewWargaForm(main, null); window.scrollTo(0, 0); }
      else location.hash = '#/admin/warga';
    } catch (err) { toast('Gagal menyimpan: ' + err.message, 'error'); }
  };
}
// ---- Scan Kartu Keluarga (OCR di perangkat) → tambah anggota keluarga sekaligus
async function openKkScan() {
  const OCR = await import('./ocr.js');
  const w = state.config.wilayah || {};
  const dusunHtml = isKadus() ? `<input data-kk-dusun value="${esc(myDusun())}" readonly>` : `<select data-kk-dusun><option value="">— pilih dusun —</option>${state.dusun.map((d) => `<option ${state.filters?.dusun === d.nama ? 'selected' : ''}>${esc(d.nama)}</option>`).join('')}</select>`;
  OCR.ocrKkDialog({ master: masterItems, dusunHtml, existingNik: (nik) => state.warga.find((x) => x.nik === nik), onSave: async ({ header, rows, updates = [] }) => {
    if (rows.length && !header.dusun && !isKadus()) throw new Error('Pilih dusun terlebih dahulu');
    // data yang sudah tersedia & dipilih "Perbarui data" → hanya kolom yang dicentang yang diubah
    if (updates.length) {
      const fix = (k, v) => (['jk', 'agama', 'pendidikan', 'pekerjaan', 'statusKawin', 'shdk'].includes(k) ? canonical(k, v, masterItems(fieldByKey(k)?.master || k)) : v);
      const ups = updates.map((u) => { const ch = Object.fromEntries(Object.entries(u.changes).map(([k, v]) => [k, fix(k, v)])); if (isKadus()) delete ch.dusun; if (ch.tglLahir) { const a = ageFromDate(ch.tglLahir); if (a !== '') ch.umur = a; } return { ...u, changes: ch }; });
      await addNewMasterValues(ups.map((u) => u.changes));
      await batchWrite(ups.map((u) => ['update', C(`warga/${u.id}`), { ...clean(u.changes), updatedAt: F.serverTimestamp() }]));
      ups.forEach((u) => { const old = state.warga.find((x) => x.id === u.id) || {}; logAudit('warga', 'ubah', `Memperbarui data warga ${u.nama} dari scan Kartu Keluarga`, { target: `${u.nama} (${old.nik || '-'})`, targetId: u.id, changes: diff(old, { ...old, ...u.changes }, (k) => fieldByKey(k)?.label || k), count: Object.keys(u.changes).length }); });
    }
    if (!rows.length) { toast(`${updates.length} data warga diperbarui`, 'success'); return; }
    const base = { noKk: header.noKk, alamat: header.alamat, rt: header.rt, rw: header.rw, dusun: isKadus() ? myDusun() : header.dusun, provinsi: w.provinsi || '', provinsiId: w.provinsiId || '', kabupaten: w.kabupaten || '', kabupatenId: w.kabupatenId || '', kecamatan: w.kecamatan || '', kecamatanId: w.kecamatanId || '', kelurahan: w.kelurahan || state.config.namaDesa || '', kelurahanId: w.kelurahanId || '' };
    const records = rows.map((r) => { const d = { ...base, ...r }; for (const k of ['jk', 'agama', 'pendidikan', 'pekerjaan', 'statusKawin', 'shdk']) if (d[k]) d[k] = canonical(k, d[k], masterItems(fieldByKey(k)?.master || k)); if (d.tglLahir) { const a = ageFromDate(d.tglLahir); if (a !== '') d.umur = a; } return d; });
    const dup = records.find((r) => r.nik && state.warga.some((x) => x.nik === r.nik)); if (dup) throw new Error(`NIK ${dup.nik} (${dup.nama}) sudah terdaftar`);
    await addNewMasterValues(records);
    if (!isKadus()) await ensureDusun([base.dusun]);
    await batchWrite(records.map((r) => ['set', F.doc(F.collection(F.db, 'warga')), { ...clean(r), createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp(), createdBy: state.user.email, sumber: 'ocr-kk' }]));
    logAudit('warga', 'tambah_ocr_kk', `Menambah ${records.length} warga dari scan Kartu Keluarga ${header.noKk || ''}`.trim(), { count: records.length, target: header.noKk || '', detail: records.map((r) => r.nama).join(', ').slice(0, 300) });
    toast(`${records.length} anggota keluarga ditambahkan${updates.length ? ` · ${updates.length} data diperbarui` : ''}`, 'success');
  } });
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
function exportWargaDialog(list, title, opt = {}) {
  const fields = allFields().filter((f) => !['provinsiId'].includes(f.key));
  const preCols = [...new Set([...COL_PRESETS.ringkas, ...(opt.cols || [])])];
  const m = modal({
    title: 'Ekspor Data Warga', size: 'lg',
    body: `<p class="muted">${fmtNum(list.length)} warga akan diekspor — sama persis dengan hasil saringan di layar.</p>
      ${opt.pairs?.length ? `<div class="filter-sum">${opt.pairs.map(([k, v]) => `<span><small>${esc(k)}</small><b>${esc(v)}</b></span>`).join('')}</div>` : opt.filter ? `<p class="small"><b>Filter:</b> ${esc(opt.filter)}</p>` : ''}
      <label class="field"><span>Judul laporan</span><input id="ex-title" value="${esc(title)}"></label>
      <div class="field"><span>Kolom</span><div class="chips">${Object.keys(COL_PRESETS).map((k) => `<button type="button" class="chip" data-preset="${k}">${({ ringkas: 'Ringkas', kependudukan: 'Kependudukan', sosek: 'Sosial Ekonomi', kesehatan: 'Kesehatan', sektoral: 'Sektoral', peristiwa: 'Peristiwa' })[k]}</button>`).join('')}<button type="button" class="chip" data-preset="all">Lengkap (semua)</button></div></div>
      <div class="col-picker">${GROUPS.map((g) => { const fs = fields.filter((f) => f.group === g.id); return fs.length ? `<div><b>${esc(g.label)}</b>${fs.map((f) => `<label class="check"><input type="checkbox" value="${f.key}" ${preCols.includes(f.key) ? 'checked' : ''}> ${esc(f.label)}${(opt.cols || []).includes(f.key) ? ' <span class="badge">filter</span>' : ''}</label>`).join('')}</div>` : ''; }).join('')}</div>
      <label class="check"><input type="checkbox" id="ex-group"> Kelompokkan per dusun (lembar / bagian terpisah per dusun, dengan kepala dusun)</label>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-ghost" id="ex-pdf">${ic('file')} PDF</button><button class="btn btn-primary" id="ex-xls">${ic('download')} Excel</button>`,
  });
  const boxes = () => $$('.col-picker input', m.el);
  $$('[data-preset]', m.el).forEach((b) => b.onclick = () => { const p = b.dataset.preset; boxes().forEach((c) => c.checked = p === 'all' || COL_PRESETS[p].includes(c.value) || (opt.cols || []).includes(c.value)); });
  const go = async (fmt) => {
    const cols = boxes().filter((c) => c.checked).map((c) => c.value);
    if (!cols.length) return toast('Pilih minimal satu kolom', 'error');
    const btn = $(fmt === 'pdf' ? '#ex-pdf' : '#ex-xls', m.el); btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span> Menyiapkan…';
    try { await exportWarga({ list, cols, title: $('#ex-title', m.el).value || title, group: $('#ex-group', m.el).checked, fmt, filter: opt.filter }); m.close(); }
    catch (e) { toast('Ekspor gagal: ' + e.message, 'error'); btn.disabled = false; btn.textContent = fmt.toUpperCase(); }
  };
  $('#ex-pdf', m.el).onclick = () => go('pdf');
  $('#ex-xls', m.el).onclick = () => go('xls');
}
async function exportWarga({ list, cols, title, group, fmt, filter }) {
  logAudit('export', `warga_${fmt}`, `Mengekspor ${title} (${fmt === 'pdf' ? 'PDF' : 'Excel'})`, { count: list.length, detail: `${filter ? `Filter: ${filter}. ` : ''}Kolom: ${cols.map((k) => fieldByKey(k)?.label || k).join(', ')}${group ? ' • per dusun' : ''}` });
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
    await exportExcel(title, sheets, { instansi: instansi(), filter: filter ? `Filter: ${filter} • ${fmtNum(list.length)} warga` : `${fmtNum(list.length)} warga` });
  } else {
    const sections = group
      ? groups.map((g) => ({ heading: `Dusun ${g.name} — ${g.list.length} warga`, sub: g.kadus?.kepalaNama ? `Kepala Dusun: ${g.kadus.kepalaNama}${g.kadus.kepalaHp ? ' • ' + g.kadus.kepalaHp : ''}` : '', head, body: g.list.map((w, i) => row(w, i, true)) }))
      : [{ head, body: list.map((w, i) => row(w, i, true)) }];
    await exportPdf({ filename: title, title, subtitle: `${fmtNum(list.length)} warga`, sections, orientation: cols.length > 6 ? 'landscape' : 'portrait', meta: { instansi: instansi(), filter: filter ? `Filter: ${filter}` : '' } });
  }
  toast('Berkas ekspor diunduh', 'success');
}

// ---------------------------------------------------------------- Import Excel
function viewImport(main) {
  state.view = 'form';
  main.innerHTML = `
  <div class="panel">
    <h3>${ic('upload')} Import Data Warga dari Excel</h3>
    <p class="callout small-callout">${ic('lock')} Demi keamanan, setiap proses import wajib dikonfirmasi dengan password akun Anda dan tercatat di audit log.</p>
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
  importFileName = '';
  $('#imp-tpl').onclick = downloadTemplate;
}
async function downloadTemplate() {
  logAudit('export', 'template', 'Mengunduh template import Excel');
  try {
    const fields = allFields();
    const ex = { idWarga: 'WRG-0001', nik: '1101010101900001', noKk: '1101010101900099', nama: 'Contoh Nama Warga', jk: 'Laki-laki', tempatLahir: 'Banda Aceh', tglLahir: '1990-01-01', agama: 'Islam', shdk: 'Kepala Keluarga', statusKawin: 'Kawin', noHp: '081234567890', dusun: 'Dusun Contoh', rt: '01', rw: '01', alamat: 'Dusun Contoh, RT 01/RW 01' };
    const pilihan = fields.filter((f) => f.type === 'select');
    const maxLen = Math.max(...pilihan.map((f) => masterItems(f.master).length));
    const pilihanBody = Array.from({ length: maxLen }, (_, i) => pilihan.map((f) => masterItems(f.master)[i] || ''));
    await exportExcel('Template_Import_Data_Warga', [
      { name: 'Data Warga', head: fields.map((f) => f.label), body: [fields.map((f) => ex[f.key] ?? '')] },
      { name: 'Pilihan Dropdown', head: pilihan.map((f) => f.label), body: pilihanBody },
      { name: 'Petunjuk', head: ['Petunjuk Pengisian'], body: [['1. Isi data mulai baris ke-2 pada lembar "Data Warga". Hapus baris contoh.'], ['2. NIK & No KK 16 digit. Format kolom sebagai Teks agar angka tidak berubah.'], ['3. Tanggal format YYYY-MM-DD (contoh 1990-01-31) atau DD/MM/YYYY.'], ['4. Untuk kolom pilihan, gunakan nilai pada lembar "Pilihan Dropdown". Nilai baru akan ditambahkan ke Data Master.'], ['5. Jenis Kelamin boleh diisi L / P.'], [`${APP.exportCredit}`]] },
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
let importFileName = '';
async function handleImportFile(file) {
  importFileName = file.name;
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
    const nikCol = cur.map.indexOf('nik');
    if (nikCol >= 0) {
      const risky = dataRows.filter((r) => typeof r[nikCol] === 'number' && r[nikCol] > Number.MAX_SAFE_INTEGER).length;
      if (risky) $('#imp-prev').insertAdjacentHTML('beforebegin', `<div class="callout">${ic('bulb')}<div><b>${risky} NIK tersimpan sebagai angka di Excel</b><p>Angka 16 digit di atas 9.007.199.254.740.991 bisa berubah digit terakhirnya. Format kolom NIK sebagai <i>Teks</i> di Excel lalu upload ulang agar akurat.</p></div></div>`);
    }
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
  if (!await requirePassword(`Import ${records.length} data warga dari “${importFileName}”. Masukkan password Anda untuk melanjutkan.`)) { toast('Import dibatalkan', 'info'); return; }
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
    logAudit('import', 'import_excel', `Import Excel “${importFileName}”: ${created} baru, ${updated} diperbarui`, { count: records.length, target: importFileName, detail: `${created} warga baru, ${updated} diperbarui, ${nd} dusun baru, ${nm} nilai master baru. Opsi: perbarui NIK=${upd}, master=${addM}, dusun=${addD}` });
    prog.innerHTML = `<div class="callout ok">${ic('check')}<div><b>Import selesai</b><p>${created} warga baru, ${updated} diperbarui${nd ? `, ${nd} dusun baru` : ''}${nm ? `, ${nm} nilai master baru` : ''}.</p></div><a class="btn btn-primary" href="#/admin/warga">Lihat Data Warga</a></div>`;
    toast('Import selesai', 'success');
  } catch (e) {
    logAudit('import', 'import_gagal', `Import Excel “${importFileName}” gagal`, { detail: e.message });
    prog.innerHTML = `<p class="err">Import gagal: ${esc(humanErr(e))}</p>`; go.disabled = false;
  }
}

// ---------------------------------------------------------------- Dusun
function viewDusun(main) {
  state.view = 'dusun';
  if (!state.wargaReady) { main.innerHTML = loadingBox(); return; }
  const tanpa = state.warga.filter((w) => !w.dusun).length;
  main.innerHTML = `<div class="toolbar toolbar-actions"><button class="btn btn-primary" id="d-add">${ic('plus')} Tambah Dusun</button>${can('export') ? `<button class="btn btn-ghost" id="d-exp">${ic('download')} Ekspor Daftar Dusun & Kadus</button>` : ''}${can('broadcast') ? `<button class="btn btn-wa" id="d-wa">${ic('wa')} Kirim WA ke Semua Kadus</button>` : ''}</div>
  ${tanpa ? `<div class="callout">${ic('users')}<div><b>${tanpa} warga belum punya dusun</b><p>Kelompokkan dengan memilih warga lalu “Pindah dusun”.</p></div><a class="btn btn-ghost" href="#/admin/warga?dusun=__none">Lihat</a></div>` : ''}
  <div class="dusun-grid">${state.dusun.map((d) => {
    const ws = state.warga.filter((w) => w.dusun === d.nama); const ak = ws.filter(isAktif);
    return `<div class="dusun-card">
      <div class="dusun-head"><h3>Dusun ${esc(d.nama)}</h3><div><button class="icon-btn" data-edit="${d.id}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-del="${d.id}" title="Hapus">${ic('trash')}</button></div></div>
      <div class="kadus">${d.kepalaNama ? `<span class="muted small">Kepala Dusun</span><b>${esc(d.kepalaNama)}</b>${waNumber(d.kepalaHp) ? `<a class="wa-link" target="_blank" rel="noopener" href="${esc(waLink(d.kepalaHp, `Assalamu'alaikum Bapak/Ibu ${d.kepalaNama}, `))}">${ic('wa')} ${esc(d.kepalaHp)}</a>` : ''}` : '<span class="muted">Kepala dusun belum diisi</span>'}</div>
      <div class="dusun-stats"><span><b>${ak.length}</b> jiwa</span><span><b>${ak.filter((w) => norm(w.shdk) === 'kepala keluarga').length}</b> KK</span><span><b>${ak.filter((w) => norm(w.jk).startsWith('l')).length}</b> L</span><span><b>${ak.filter((w) => norm(w.jk).startsWith('p')).length}</b> P</span></div>
      ${d.keterangan ? `<div class="muted small rich">${richRender(d.keterangan)}</div>` : ''}
      <div class="dusun-actions">${can('warga') ? `<a class="btn btn-sm btn-ghost" href="#/admin/warga?dusun=${encodeURIComponent(d.nama)}">${ic('users')} Warga</a>` : ''}${can('export') ? `<button class="btn btn-sm btn-ghost" data-xls="${d.id}">Excel</button><button class="btn btn-sm btn-ghost" data-pdf="${d.id}">PDF</button>` : ''}${can('broadcast') ? `<button class="btn btn-sm btn-wa" data-wa="${esc(d.nama)}">${ic('wa')} WA Warga</button>` : ''}${isSuper() || (hasGreen() && can('kelolaKadus')) ? `<a class="btn btn-sm btn-ghost" href="#/admin/admin?kadus=${encodeURIComponent(d.nama)}">${ic('lock')} Akun Kadus</a>` : ''}</div>
    </div>`;
  }).join('') || emptyBox('Belum ada dusun. Tambahkan dusun atau import data warga.')}</div>`;
  $('#d-add').onclick = () => dusunForm(null);
  $$('[data-edit]', main).forEach((b) => b.onclick = () => dusunForm(state.dusun.find((d) => d.id === b.dataset.edit)));
  $$('[data-del]', main).forEach((b) => b.onclick = async () => {
    const d = state.dusun.find((x) => x.id === b.dataset.del); const n = state.warga.filter((w) => w.dusun === d.nama).length;
    if (!await confirmDelete(`Hapus Dusun ${d.nama}?${n ? ` ${n} warga di dusun ini akan menjadi “tanpa dusun”.` : ''}`)) return;
    await batchWrite([['delete', C(`dusun/${d.id}`)], ...state.warga.filter((w) => w.dusun === d.nama).map((w) => ['update', C(`warga/${w.id}`), { dusun: '' }])]);
    logAudit('dusun', 'hapus', `Menghapus Dusun ${d.nama}`, { target: d.nama, count: n });
    toast('Dusun dihapus', 'success');
  });
  const dusunList = (id) => { const d = state.dusun.find((x) => x.id === id); return [d, sortWarga(state.warga.filter((w) => w.dusun === d.nama), 'nama')]; };
  $$('[data-xls]', main).forEach((b) => b.onclick = () => { const [d, l] = dusunList(b.dataset.xls); exportWarga({ list: l, cols: COL_PRESETS.ringkas, title: `Data Warga Dusun ${d.nama}`, group: true, fmt: 'xls' }).catch((e) => toast(e.message, 'error')); });
  $$('[data-pdf]', main).forEach((b) => b.onclick = () => { const [d, l] = dusunList(b.dataset.pdf); exportWarga({ list: l, cols: COL_PRESETS.ringkas, title: `Data Warga Dusun ${d.nama}`, group: true, fmt: 'pdf' }).catch((e) => toast(e.message, 'error')); });
  $$('[data-wa]', main).forEach((b) => b.onclick = () => { location.hash = `#/admin/broadcast?target=dusun&dusun=${encodeURIComponent(b.dataset.wa)}`; });
  $('#d-wa')?.addEventListener('click', () => { location.hash = '#/admin/broadcast?target=kadus'; });
  if ($('#d-exp')) $('#d-exp').onclick = async () => {
    const head = ['No', 'Dusun', 'Kepala Dusun', 'No. HP Kadus', 'Jiwa', 'KK', 'L', 'P', 'Keterangan'];
    const body = state.dusun.map((d, i) => { const ak = state.warga.filter((w) => w.dusun === d.nama && isAktif(w)); return [i + 1, d.nama, d.kepalaNama || '', d.kepalaHp || '', ak.length, ak.filter((w) => norm(w.shdk) === 'kepala keluarga').length, ak.filter((w) => norm(w.jk).startsWith('l')).length, ak.filter((w) => norm(w.jk).startsWith('p')).length, d.keterangan || '']; });
    const m = modal({ title: 'Ekspor Daftar Dusun', size: 'sm', body: '<p>Pilih format berkas.</p>', footer: `<button class="btn btn-ghost" id="dx-pdf">PDF</button><button class="btn btn-primary" id="dx-xls">Excel</button>` });
    $('#dx-pdf', m.el).onclick = () => { m.close(); logAudit('export', 'dusun_pdf', 'Mengekspor daftar dusun & kadus (PDF)'); exportPdf({ filename: 'Daftar_Dusun_Kadus', title: 'Daftar Dusun & Kepala Dusun', sections: [{ head, body }], orientation: 'portrait', meta: { instansi: instansi() } }); };
    $('#dx-xls', m.el).onclick = () => { m.close(); logAudit('export', 'dusun_xls', 'Mengekspor daftar dusun & kadus (Excel)'); exportExcel('Daftar_Dusun_Kadus', [{ name: 'Dusun', title: 'Daftar Dusun & Kepala Dusun', head, body }], { instansi: instansi() }); };
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
      <label class="field span-2"><span>Keterangan</span><textarea name="keterangan" rows="3" data-rich>${esc(d?.keterangan || '')}</textarea></label>
    </form>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="df-ok">Simpan</button>`,
  });
  const form = $('#df', m.el); bindRich(form);
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
      logAudit('dusun', d ? 'ubah' : 'tambah', d ? `Mengubah Dusun ${nama}` : `Menambah Dusun ${nama}`, { target: nama, changes: d ? diff(d, data, (k) => ({ nama: 'Nama', kepalaNama: 'Kepala Dusun', kepalaHp: 'HP Kadus', keterangan: 'Keterangan', urutan: 'Urutan' }[k] || k)) : undefined });
      m.close(); toast('Dusun tersimpan', 'success');
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
}

// ---------------------------------------------------------------- Data Master
let masterSel = 'jk';
// Kategori yang tidak boleh dihapus karena dipakai perhitungan inti (KK, jenis kelamin, kategori informasi/kegiatan)
const MASTER_LOCKED = ['jk', 'shdk', 'kategoriInfo', 'kategoriKegiatan'];
const MASTER_GROUPS = [...GROUPS.map((g) => ({ id: g.id, label: g.id === 'tambahan' ? 'Data Tambahan (kustom)' : g.label })), { id: 'info', label: 'Publikasi' }];
// Daftar seluruh kategori dropdown beserta kelompok & urutan efektif (bisa diubah Super Admin / admin Data Master)
function masterCategories() {
  const extras = [{ key: 'kategoriInfo', label: MASTER_EXTRA_LABELS.kategoriInfo }, { key: 'kategoriKegiatan', label: MASTER_EXTRA_LABELS.kategoriKegiatan }, ...(state.master.jenisDokumen ? [{ key: 'jenisDokumen', label: 'Jenis Dokumen Publik' }] : [])];
  const list = [
    ...FIELDS.filter((f) => f.type === 'select').map((f, i) => ({ key: f.key, label: f.label, defGroup: f.group, defOrder: i, builtin: true })),
    ...extras.map((x, i) => ({ ...x, defGroup: 'info', defOrder: 100 + i, builtin: true, info: true })),
    ...Object.values(state.master).filter((m) => m.custom).map((m, i) => ({ key: m.key, label: m.label, defGroup: 'tambahan', defOrder: 200 + i, custom: true })),
  ];
  return list.map((c) => {
    const m = state.master[c.key] || {};
    const valid = c.info ? ['info'] : FORM_GROUPS;
    return { ...c, group: valid.includes(m.group) ? m.group : c.defGroup, order: Number.isFinite(m.order) ? m.order : c.defOrder, deleted: !!m.deleted, locked: MASTER_LOCKED.includes(c.key) };
  });
}
function viewMaster(main) {
  state.view = 'master';
  if (!state.masterReady) { main.innerHTML = loadingBox(); return; }
  const cats = masterCategories();
  const live = cats.filter((c) => !c.deleted);
  if (!live.find((c) => c.key === masterSel)) masterSel = live[0]?.key || 'jk';
  const groups = MASTER_GROUPS.map((g) => ({ ...g, items: live.filter((c) => c.group === g.id).sort((a, b) => a.order - b.order || a.defOrder - b.defOrder) }));
  const flat = groups.flatMap((g) => g.items.map((c) => ({ ...c, g: g.id })));
  const sel = cats.find((c) => c.key === masterSel);
  const items = masterItems(masterSel);
  const usage = (v) => state.warga.filter((w) => norm(w[masterSel]) === norm(v)).length;
  const hidden = cats.filter((c) => c.deleted);
  main.innerHTML = `<div class="master">
    <aside class="master-side">
      <div class="search">${ic('search')}<input id="ms-q" placeholder="Cari kategori…"></div>
      <p class="muted tiny ms-tip">Gunakan ▲ ▼ untuk menggeser kategori. Menggeser melewati batas kelompok akan memindahkannya ke kelompok di atas/bawahnya (ikut berpindah bagian di formulir warga).</p>
      ${groups.map((g) => (g.items.length || g.id === 'tambahan' ? `<div class="ms-group" data-g="${g.id}"><small>${esc(g.label)}</small>${g.items.map((c) => {
        const idx = flat.findIndex((x) => x.key === c.key);
        const upOk = idx > 0 && (!c.info || flat[idx - 1].info); const dnOk = idx < flat.length - 1 && (!c.info || flat[idx + 1]?.info) && !(flat[idx + 1]?.info && !c.info);
        return `<div class="ms-cat ${c.key === masterSel ? 'active' : ''}"><button data-k="${c.key}" class="${c.key === masterSel ? 'active' : ''}">${esc(masterLabel(c.key))}${c.custom ? ' <em class="ms-kustom">kustom</em>' : ''}<span>${masterItems(c.key).length}</span></button><span class="ms-move"><button class="icon-btn" data-mv="up" data-key="${c.key}" title="Geser ke atas" ${upOk ? '' : 'disabled'}>▲</button><button class="icon-btn" data-mv="down" data-key="${c.key}" title="Geser ke bawah" ${dnOk ? '' : 'disabled'}>▼</button></span></div>`;
      }).join('') || '<p class="muted small">Belum ada</p>'}${g.id === 'tambahan' ? `<button class="btn btn-sm btn-ghost" id="ms-newcat">${ic('plus')} Kategori Baru</button>` : ''}</div>` : '')).join('')}
      ${hidden.length ? `<div class="ms-group ms-hidden"><small>Kategori terhapus (${hidden.length})</small>${hidden.map((c) => `<div class="ms-cat"><span class="muted small">${esc(masterLabel(c.key))}</span><button class="btn btn-sm btn-ghost" data-restore="${c.key}">${ic('refresh')} Pulihkan</button></div>`).join('')}</div>` : ''}
    </aside>
    <section class="panel master-main">
      <div class="master-head"><div><h3>${esc(masterLabel(masterSel))}</h3><p class="muted small">${items.length} pilihan • kelompok <b>${esc(MASTER_GROUPS.find((g) => g.id === sel?.group)?.label || '-')}</b>${sel?.custom ? ' • kategori kustom' : ' • kategori bawaan'}</p></div>
        <div class="row-gap">${sel && !sel.info ? `<label class="ms-groupsel"><span class="muted small">Pindah ke</span><select id="ms-group">${MASTER_GROUPS.filter((g) => g.id !== 'info').map((g) => `<option value="${g.id}" ${g.id === sel.group ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}</select></label>` : ''}${sel?.custom ? `<button class="btn btn-sm btn-ghost" id="ms-rencat">${ic('edit')} Ganti nama</button>` : ''}${sel && !sel.locked ? `<button class="btn btn-sm btn-danger btn-ghost" id="ms-delcat">${ic('trash')} Hapus kategori</button>` : ''}<button class="btn btn-sm btn-ghost" id="ms-sort">Urutkan A–Z</button></div></div>
      <form id="ms-add" class="input-group"><input id="ms-new" placeholder="Tambah pilihan baru… (pisahkan dengan ; untuk banyak sekaligus)"><button class="btn btn-primary">${ic('plus')} Tambah</button></form>
      <div class="search">${ic('search')}<input id="ms-filter" placeholder="Cari di daftar…"></div>
      <ul class="ms-items">${items.map((v, i) => `<li data-v="${esc(v)}"><span class="ms-order"><button class="icon-btn" data-up="${i}" title="Naik" ${i === 0 ? 'disabled' : ''}>↑</button></span><span class="ms-val">${esc(v)}</span>${!sel?.info ? `<span class="muted small">${usage(v)} warga</span>` : ''}<button class="icon-btn" data-ren="${i}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-rm="${i}" title="Hapus">${ic('trash')}</button></li>`).join('') || `<li>${emptyBox('Belum ada pilihan')}</li>`}</ul>
    </section></div>`;
  const ref = C(`master/${masterSel}`);
  const save = (arr, label) => F.setDoc(ref, { items: arr, label: masterLabel(masterSel) }, { merge: true }).then(() => logAudit('master', 'ubah', `${label} — kategori ${masterLabel(masterSel)}`, { target: masterLabel(masterSel) })).catch((e) => toast(e.message, 'error'));
  // Simpan susunan (kelompok + urutan) untuk semua kategori yang posisinya berubah — dalam satu batch
  const saveLayout = async (nextFlat, label) => {
    const ops = []; const counter = {};
    for (const c of nextFlat) {
      const order = (counter[c.g] = (counter[c.g] ?? -1) + 1);
      const m = state.master[c.key] || {};
      if (m.group !== c.g || m.order !== order) {
        ops.push(['set', C(`master/${c.key}`), { group: c.g, order, ...(state.master[c.key] ? {} : { label: c.label, items: masterItems(c.key), builtin: !!c.builtin }) }, { merge: true }]);
        state.master[c.key] = { key: c.key, ...m, group: c.g, order, ...(m.items ? {} : { items: masterItems(c.key) }) };
      }
    }
    if (!ops.length) return;
    viewMaster(main);
    try { await batchWrite(ops); logAudit('master', 'susun', label, { count: ops.length }); }
    catch (e) { toast('Gagal menyimpan susunan: ' + e.message, 'error'); }
  };
  $$('[data-k]', main).forEach((b) => b.onclick = () => { masterSel = b.dataset.k; viewMaster(main); });
  $$('[data-mv]', main).forEach((b) => b.onclick = () => {
    const i = flat.findIndex((x) => x.key === b.dataset.key); const c = flat[i]; const up = b.dataset.mv === 'up';
    const nb = flat[up ? i - 1 : i + 1]; if (!nb) return;
    const next = flat.map((x) => ({ ...x }));
    if (nb.g === c.g) { [next[i], next[up ? i - 1 : i + 1]] = [next[up ? i - 1 : i + 1], next[i]]; }
    else { next[i].g = nb.g; } // melewati batas kelompok → pindah ke kelompok tetangga (di ujungnya)
    // kelompok kosong di antara: lompat satu kelompok sekaligus
    const toGroup = next[i].g;
    saveLayout(next, `Menggeser kategori “${masterLabel(c.key)}” ${up ? 'ke atas' : 'ke bawah'}${toGroup !== c.g ? ` → kelompok ${MASTER_GROUPS.find((g) => g.id === toGroup)?.label}` : ''}`);
  });
  $('#ms-group')?.addEventListener('change', (e) => {
    const g = e.target.value; const next = flat.filter((x) => x.key !== masterSel).map((x) => ({ ...x }));
    const lastIdx = next.map((x) => x.g).lastIndexOf(g);
    const order = MASTER_GROUPS.map((x) => x.id);
    const pos = lastIdx >= 0 ? lastIdx + 1 : next.findIndex((x) => order.indexOf(x.g) > order.indexOf(g));
    next.splice(pos < 0 ? next.length : pos, 0, { ...sel, g });
    saveLayout(next, `Memindahkan kategori “${masterLabel(masterSel)}” ke kelompok ${MASTER_GROUPS.find((x) => x.id === g)?.label}`);
  });
  $('#ms-q').oninput = (e) => { const q = norm(e.target.value); $$('.ms-cat', main).forEach((b) => b.hidden = q && !norm(b.textContent).includes(q)); };
  $('#ms-filter').oninput = (e) => { const q = norm(e.target.value); $$('.ms-items li[data-v]', main).forEach((li) => li.hidden = q && !norm(li.dataset.v).includes(q)); };
  $('#ms-add').onsubmit = (e) => {
    e.preventDefault();
    const vals = $('#ms-new').value.split(';').map((x) => x.trim()).filter(Boolean);
    const have = new Set(items.map(norm)); const add = vals.filter((v) => !have.has(norm(v)));
    if (!add.length) return toast(vals.length ? 'Pilihan sudah ada' : 'Isi nama pilihan', 'error');
    save([...items, ...add], `Menambah pilihan: ${add.join(', ')}`).then(() => toast(`${add.length} pilihan ditambahkan`, 'success'));
  };
  $('#ms-sort').onclick = () => save([...items].sort((a, b) => a.localeCompare(b, 'id', { numeric: true })), 'Mengurutkan pilihan A–Z');
  $$('[data-up]', main).forEach((b) => b.onclick = () => { const i = +b.dataset.up; const a = [...items];[a[i - 1], a[i]] = [a[i], a[i - 1]]; save(a, `Mengubah urutan “${items[i]}”`); });
  $$('[data-rm]', main).forEach((b) => b.onclick = async () => {
    const v = items[+b.dataset.rm]; const u = usage(v);
    if (!await confirmDelete(`Hapus pilihan “${v}”?${u ? ` (${u} warga masih memakai nilai ini; data warga tidak diubah)` : ''}`)) return;
    save(items.filter((x) => x !== v), `Menghapus pilihan “${v}”`);
  });
  $$('[data-ren]', main).forEach((b) => b.onclick = async () => {
    const old = items[+b.dataset.ren]; const nv = await promptDialog('Ubah pilihan', 'Nama pilihan', old); if (!nv || nv === old) return;
    await save(items.map((x) => (x === old ? nv : x)), `Mengubah pilihan “${old}” → “${nv}”`);
    const affected = state.warga.filter((w) => w[masterSel] === old);
    if (affected.length && await confirmDialog(`Perbarui juga ${affected.length} data warga dari “${old}” menjadi “${nv}”?`, { okText: 'Perbarui' })) {
      await batchWrite(affected.map((w) => ['update', C(`warga/${w.id}`), { [masterSel]: nv, updatedAt: F.serverTimestamp() }])); logAudit('warga', 'ubah_massal', `Memperbarui ${affected.length} warga: ${masterLabel(masterSel)} “${old}” → “${nv}”`, { count: affected.length }); toast('Data warga diperbarui', 'success');
    }
    if (masterSel === 'kategoriInfo') { const inf = state.info.filter((i) => i.kategori === old); if (inf.length) await batchWrite(inf.map((i) => ['update', C(`informasi/${i.id}`), { kategori: nv }])); }
  });
  $('#ms-newcat')?.addEventListener('click', async () => {
    const label = await promptDialog('Kategori Dropdown Baru', 'Nama kategori (akan muncul sebagai kolom baru di formulir warga)', '', { placeholder: 'mis. Status Kepemilikan Ternak' });
    if (!label) return;
    const key = 'x_' + slugify(label).replace(/-/g, '_');
    if (state.master[key] && !state.master[key].deleted) return toast('Kategori sudah ada', 'error');
    if (fieldByKey(key)) return toast('Kategori sudah ada', 'error');
    try {
      const order = live.filter((c) => c.group === 'tambahan').length;
      await F.setDoc(C(`master/${key}`), { label, items: [], custom: true, group: 'tambahan', order });
      state.master[key] = { key, label, items: [], custom: true, group: 'tambahan', order };
      logAudit('master', 'kategori_baru', `Membuat kategori dropdown baru “${label}”`, { target: label });
      masterSel = key; viewMaster(main); toast('Kategori dibuat — silakan tambah pilihannya', 'success');
    } catch (e) { toast('Gagal membuat kategori: ' + e.message, 'error'); }
  });
  $('#ms-rencat')?.addEventListener('click', async () => {
    const l = await promptDialog('Ganti nama kategori', 'Nama kategori', masterLabel(masterSel)); if (!l) return;
    try { await F.updateDoc(ref, { label: l }); state.master[masterSel] = { ...state.master[masterSel], label: l }; logAudit('master', 'ganti_nama', `Mengganti nama kategori menjadi “${l}”`); viewMaster(main); toast('Nama kategori diganti', 'success'); }
    catch (e) { toast('Gagal: ' + e.message, 'error'); }
  });
  // PERBAIKAN v2.4: kategori benar-benar terhapus (sebelumnya ditolak Rules tanpa pesan)
  $('#ms-delcat')?.addEventListener('click', async () => {
    const key = masterSel; const label = masterLabel(key); const isCustom = !!sel?.custom;
    const used = state.warga.filter((w) => w[key] !== undefined && w[key] !== '').length;
    if (!await confirmDelete(`Hapus kategori “${label}”${isCustom ? ' beserta semua pilihannya' : ''}? ${isCustom ? 'Kolom ini hilang dari formulir warga.' : 'Kategori bawaan disembunyikan dari formulir & daftar (dapat dipulihkan kapan saja).'}${used ? ` Nilai yang sudah tersimpan pada ${used} data warga tetap ada.` : ''}`)) return;
    try {
      if (isCustom) await F.deleteDoc(C(`master/${key}`));
      else await F.setDoc(C(`master/${key}`), { deleted: true, label, items: masterItems(key) }, { merge: true });
      if (isCustom) delete state.master[key]; else state.master[key] = { key, ...(state.master[key] || {}), deleted: true };
      logAudit('master', 'hapus_kategori', `Menghapus kategori “${label}”${isCustom ? '' : ' (bawaan, disembunyikan)'}`, { target: label });
      masterSel = 'jk'; viewMaster(main); toast(`Kategori “${label}” dihapus`, 'success');
    } catch (e) { toast('Gagal menghapus kategori: ' + e.message, 'error'); }
  });
  $$('[data-restore]', main).forEach((b) => b.onclick = async () => {
    const key = b.dataset.restore;
    try { await F.setDoc(C(`master/${key}`), { deleted: false }, { merge: true }); state.master[key] = { ...state.master[key], deleted: false }; logAudit('master', 'pulihkan_kategori', `Memulihkan kategori “${masterLabel(key)}”`); masterSel = key; viewMaster(main); toast('Kategori dipulihkan', 'success'); }
    catch (e) { toast('Gagal: ' + e.message, 'error'); }
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
  $('#lp-pdf').onclick = () => { const r = build(); if (!r.length) return toast('Pilih kategori', 'error'); logAudit('export', 'rekap_pdf', `Mengekspor rekap kategori (PDF): ${r.map((t) => t.label).join(', ')}`, { detail: scopeLabel() }); exportPdf({ filename: 'Rekap_Kategori_Penduduk', title: 'Rekapitulasi Penduduk per Kategori', subtitle: scopeLabel(), sections: r.map((t) => ({ heading: t.label, head: t.head, body: t.body })), orientation: r.some((t) => t.head.length > 7) ? 'landscape' : 'portrait', meta: { instansi: instansi() } }).catch((e) => toast(e.message, 'error')); };
  $('#lp-xls').onclick = () => { const r = build(); if (!r.length) return toast('Pilih kategori', 'error'); logAudit('export', 'rekap_xls', `Mengekspor rekap kategori (Excel): ${r.map((t) => t.label).join(', ')}`, { detail: scopeLabel() }); exportExcel('Rekap_Kategori_Penduduk', r.map((t) => ({ name: t.label, title: `Rekap ${t.label} — ${scopeLabel()}`, head: t.head, body: t.body })), { instansi: instansi() }).catch((e) => toast(e.message, 'error')); };

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
    exportWargaDialog(exList(), t, { filter: [d ? (d === '__none' ? 'Tanpa dusun' : `Dusun ${d}`) : 'Semua dusun', k && v ? `${cats.find((c) => c.key === k).label}: ${v}` : 'Semua kategori'].join(', '), cols: [...(!d ? ['dusun'] : []), ...(k && fieldByKey(k) ? [k] : [])] });
  };
  $('#ex-all').onclick = () => exportWargaDialog(sortWarga(state.warga, 'dusun'), 'Data Seluruh Warga per Dusun', { filter: 'Semua dusun, semua kategori', cols: ['dusun'] });
}

// ---------------------------------------------------------------- Papan Informasi
function viewInformasi(main, r) {
  state.view = 'informasi';
  main.innerHTML = `<div class="toolbar toolbar-actions"><button class="btn btn-primary" id="i-new">${ic('plus')} Tulis Informasi</button><button class="btn btn-ghost" id="i-cat">${ic('filters')} Kelola Kategori <span class="badge">${masterItems('kategoriInfo').length}</span></button><a class="btn btn-ghost" href="#/informasi" target="_blank">${ic('ext')} Lihat halaman publik</a></div>
  <div class="info-admin">${state.info.map((i) => `<div class="info-row">
    ${infoThumb(i) ? `<img src="${esc(infoThumb(i))}" alt="">` : `<div class="info-ph">${ic('mega')}</div>`}
    <div class="info-row-main"><div class="info-meta"><span class="badge">${esc(i.kategori || '-')}</span><span class="badge ${i.published ? 'badge-ok' : 'badge-muted'}">${i.published ? 'Terbit' : 'Draf'}</span>${i.pinned ? `<span class="badge badge-warn">${ic('pin')} Disematkan</span>` : ''}${i.broadcastCount ? `<span class="badge">${ic('wa')} ${i.broadcastCount} terkirim</span>` : ''}</div>
      <h4>${esc(i.judul)}</h4><p class="muted small">${esc(fmtDate(i.createdAt, true))}${i.tanggalAcara ? ' • Acara ' + esc(fmtDate(i.tanggalAcara)) : ''}${i.penulis?.nama ? ` • oleh ${esc(penulisLabel(i.penulis))}` : ''}${i.media?.length ? ` • ${i.media.length} media` : ''}</p></div>
    <div class="info-row-actions">${can('broadcast') ? '' : '<!--'}<button class="btn btn-sm btn-wa" data-bc="${i.id}">${ic('wa')} Sebarkan</button>${can('broadcast') ? '' : '-->'}<button class="icon-btn" data-copy="${i.id}" title="Salin teks WA">${ic('copy')}</button><button class="icon-btn" data-pin="${i.id}" title="Sematkan">${ic('pin')}</button><button class="icon-btn" data-ed="${i.id}" title="Ubah">${ic('edit')}</button><button class="icon-btn danger" data-del="${i.id}" title="Hapus">${ic('trash')}</button></div>
  </div>`).join('') || emptyBox('Belum ada informasi. Tulis pengumuman, berita kegiatan, atau acara desa pertama Anda.')}</div>`;
  $('#i-new').onclick = () => infoForm(null);
  $('#i-cat').onclick = () => infoCatManager();
  $$('[data-ed]', main).forEach((b) => b.onclick = () => infoForm(state.info.find((i) => i.id === b.dataset.ed)));
  $$('[data-bc]', main).forEach((b) => b.onclick = () => { location.hash = `#/admin/broadcast?info=${b.dataset.bc}`; });
  $$('[data-copy]', main).forEach((b) => b.onclick = () => copyText(infoMessage(state.info.find((i) => i.id === b.dataset.copy))));
  $$('[data-pin]', main).forEach((b) => b.onclick = () => { const i = state.info.find((x) => x.id === b.dataset.pin); F.updateDoc(C(`informasi/${i.id}`), { pinned: !i.pinned }); logAudit('informasi', i.pinned ? 'lepas_sematan' : 'sematkan', `${i.pinned ? 'Melepas sematan' : 'Menyematkan'} informasi “${i.judul}”`, { targetId: i.id }); });
  $$('[data-del]', main).forEach((b) => b.onclick = async () => { const i = state.info.find((x) => x.id === b.dataset.del); if (await confirmDelete(`Hapus “${i.judul}”?`)) { await F.deleteDoc(C(`informasi/${i.id}`)); logAudit('informasi', 'hapus', `Menghapus informasi “${i.judul}”`, { targetId: i.id }); toast('Informasi dihapus', 'success'); } });
  if (r.query.get('baru')) { history.replaceState(null, '', '#/admin/informasi'); infoForm(null); }
  // dari tombol "Sunting" di beranda / halaman baca
  const eid = r.query.get('edit');
  if (eid) { const it = state.info.find((x) => x.id === eid); if (it) { history.replaceState(null, '', '#/admin/informasi'); if (!document.querySelector('#if')) infoForm(it); } }
}

// ---------------------------------------------------------------- Kategori Papan Informasi (tambah / ubah nama / hapus)
const INFO_CAT_SARAN = ['Pengumuman', 'Berita', 'Berita Kegiatan', 'Acara Desa', 'Undangan', 'Gotong Royong', 'Musyawarah', 'Kesehatan', 'Posyandu', 'Pendidikan', 'Keagamaan', 'Sosial', 'Bantuan Sosial', 'Ekonomi & UMKM', 'Pertanian & Perikanan', 'Pembangunan', 'Pemerintahan', 'Keuangan Gampong', 'Layanan Administrasi', 'Lingkungan & Kebersihan', 'Keamanan & Ketertiban', 'Kebencanaan', 'Pemuda & Olahraga', 'Budaya & Adat', 'Pariwisata', 'Prestasi', 'Lowongan & Peluang', 'Lainnya'];
async function saveInfoCats(items, note) {
  const uniq = []; for (const x of items.map((s) => String(s).trim()).filter(Boolean)) if (!uniq.some((u) => norm(u) === norm(x))) uniq.push(x);
  await F.setDoc(C('master/kategoriInfo'), { items: uniq.slice(0, 200), label: MASTER_EXTRA_LABELS.kategoriInfo }, { merge: true });
  state.master.kategoriInfo = { ...(state.master.kategoriInfo || {}), items: uniq.slice(0, 200) };
  logAudit('informasi', 'kategori', note);
  return uniq;
}
function infoCatManager() {
  const m = modal({ title: 'Kelola Kategori Papan Informasi', size: 'lg', body: '<div id="icm"></div>', footer: '<button class="btn btn-primary" data-close>Selesai</button>' });
  const box = $('#icm', m.el);
  const used = (c) => state.info.filter((i) => norm(i.kategori || '') === norm(c));
  const paint = () => {
    const items = masterItems('kategoriInfo');
    const orphan = [...new Set(state.info.map((i) => i.kategori).filter((k) => k && !items.some((x) => norm(x) === norm(k))))];
    const saran = INFO_CAT_SARAN.filter((s) => !items.some((x) => norm(x) === norm(s)));
    box.innerHTML = `<p class="muted small">Kategori dipakai untuk mengelompokkan berita di Papan Informasi dan ditampilkan sebagai label pada kartu berita. Perubahan langsung berlaku untuk semua admin.</p>
      <form class="icm-add" id="icm-add"><input id="icm-new" maxlength="40" placeholder="Nama kategori baru, mis. Posyandu" aria-label="Nama kategori baru" autocomplete="off"><button class="btn btn-primary btn-sm">${ic('plus')} Tambah</button></form>
      <div class="icm-list">${items.map((c, n) => { const u = used(c); const pub = u.filter((x) => x.published).length; return `<div class="icm-row"><span class="icm-name">${esc(c)}</span><span class="badge ${u.length ? '' : 'badge-muted'}">${u.length ? `${u.length} berita${u.length - pub ? ` · ${u.length - pub} draf` : ''}` : 'belum dipakai'}</span><span class="icm-act"><button class="icon-btn" data-icm-ren="${n}" title="Ubah nama">${ic('edit')}</button><button class="icon-btn danger" data-icm-del="${n}" title="Hapus kategori">${ic('trash')}</button></span></div>`; }).join('') || emptyBox('Belum ada kategori.')}</div>
      ${orphan.length ? `<div class="callout small-callout">${ic('bulb')}<div><p class="small">Ada berita dengan kategori yang tidak ada di daftar: ${orphan.map((o) => `<b>${esc(o)}</b>`).join(', ')}. <button class="link-btn" id="icm-orphan">Masukkan ke daftar</button></p></div></div>` : ''}
      ${saran.length ? `<div class="icm-saran"><div><b>Saran kategori</b> <small class="muted">— klik untuk menambahkan</small></div><div class="chips">${saran.map((s) => `<button class="chip" data-icm-saran="${esc(s)}">＋ ${esc(s)}</button>`).join('')}</div><button class="btn btn-ghost btn-sm" id="icm-all">${ic('plus')} Tambahkan semua saran (${saran.length})</button></div>` : ''}`;
    $('#icm-add', box).onsubmit = async (e) => {
      e.preventDefault(); const v = $('#icm-new', box).value.trim().replace(/\s+/g, ' ');
      if (!v) return; if (items.some((x) => norm(x) === norm(v))) return toast(`Kategori “${v}” sudah ada`, 'error');
      try { await saveInfoCats([...items, v], `Menambah kategori informasi “${v}”`); toast('Kategori ditambahkan', 'success'); paint(); } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    };
    $$('[data-icm-saran]', box).forEach((b) => b.onclick = async () => { try { await saveInfoCats([...items, b.dataset.icmSaran], `Menambah kategori informasi “${b.dataset.icmSaran}”`); paint(); } catch (err) { toast('Gagal: ' + err.message, 'error'); } });
    $('#icm-all', box)?.addEventListener('click', async () => { try { await saveInfoCats([...items.filter((x) => norm(x) !== 'lainnya'), ...saran, 'Lainnya'], `Menambah ${saran.length} kategori informasi dari saran`); toast(`${saran.length} kategori ditambahkan`, 'success'); paint(); } catch (err) { toast('Gagal: ' + err.message, 'error'); } });
    $('#icm-orphan', box)?.addEventListener('click', async () => { try { await saveInfoCats([...items, ...orphan], `Memasukkan ${orphan.length} kategori lama ke daftar`); paint(); } catch (err) { toast('Gagal: ' + err.message, 'error'); } });
    $$('[data-icm-ren]', box).forEach((b) => b.onclick = async () => {
      const old = items[+b.dataset.icmRen]; const nv = (await promptDialog('Ubah nama kategori', 'Nama baru', old))?.trim(); if (!nv || nv === old) return;
      if (items.some((x) => x !== old && norm(x) === norm(nv))) return toast(`Kategori “${nv}” sudah ada`, 'error');
      const u = used(old);
      try {
        await saveInfoCats(items.map((x) => (x === old ? nv : x)), `Mengubah nama kategori informasi “${old}” → “${nv}”${u.length ? ` (${u.length} berita ikut diperbarui)` : ''}`);
        if (u.length) await batchWrite(u.map((i) => ['update', C(`informasi/${i.id}`), { kategori: nv }]));
        toast(u.length ? `Kategori diubah · ${u.length} berita diperbarui` : 'Kategori diubah', 'success'); paint();
      } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    });
    $$('[data-icm-del]', box).forEach((b) => b.onclick = () => deleteInfoCat(items[+b.dataset.icmDel], items, paint));
  };
  paint();
}
async function deleteInfoCat(cat, items, done) {
  const u = state.info.filter((i) => norm(i.kategori || '') === norm(cat));
  const others = items.filter((x) => x !== cat);
  if (!u.length) {
    if (!await confirmDelete(`Hapus kategori “${cat}”? Kategori ini belum dipakai oleh berita mana pun.`, `Konfirmasi penghapusan kategori “${cat}”.`)) return;
    try { await saveInfoCats(others, `Menghapus kategori informasi “${cat}” (tidak dipakai)`); toast('Kategori dihapus', 'success'); done(); } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    return;
  }
  if (!others.length) return toast('Tidak bisa menghapus satu-satunya kategori. Tambahkan kategori lain terlebih dahulu.', 'error');
  const pub = u.filter((x) => x.published).length, pin = u.filter((x) => x.pinned).length;
  const target0 = others.find((x) => norm(x) === 'lainnya') || others[0];
  const m = modal({
    title: 'Hapus kategori — PERINGATAN PENTING', size: 'md',
    body: `<div class="icm-warn">
      <div class="icm-warn-head">${ic('bell')}<div><b>Kategori “${esc(cat)}” masih dipakai oleh ${u.length} berita.</b><span>${pub} terbit${u.length - pub ? ` · ${u.length - pub} draf` : ''}${pin ? ` · ${pin} disematkan` : ''}</span></div></div>
      <ul class="icm-warn-list">
        <li>Kategori akan <b>dihapus permanen</b> dari daftar pilihan semua admin.</li>
        <li>Semua <b>${u.length} berita</b> di bawah ini <b>wajib dipindahkan</b> ke kategori lain — label pada kartu berita di halaman publik akan langsung berubah.</li>
        <li>Pesan WhatsApp yang <b>sudah terkirim</b> tidak berubah (tetap memakai kategori lama).</li>
        <li>Tindakan ini tercatat di Audit Log dan <b>tidak bisa dibatalkan</b> otomatis.</li>
      </ul>
      <div class="icm-affected"><b>Berita yang terdampak:</b><ol>${u.slice(0, 8).map((i) => `<li>${esc(i.judul)} <small class="muted">${i.published ? 'terbit' : 'draf'} · ${esc(fmtDate(i.createdAt))}</small></li>`).join('')}</ol>${u.length > 8 ? `<small class="muted">…dan ${u.length - 8} berita lainnya</small>` : ''}</div>
      <label class="field"><span>Pindahkan ${u.length} berita ke kategori</span><select id="icm-target">${others.map((x) => `<option ${x === target0 ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label class="field"><span>Ketik <b>${esc(cat)}</b> untuk konfirmasi</span><input id="icm-type" autocomplete="off" placeholder="${esc(cat)}"></label>
      <label class="check"><input type="checkbox" id="icm-ok"> Saya mengerti bahwa ${u.length} berita akan dipindahkan dan kategori “${esc(cat)}” dihapus permanen.</label>
    </div>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" id="icm-go" disabled>${ic('trash')} Pindahkan & hapus kategori</button>`,
  });
  const go = $('#icm-go', m.el); const chk = () => { go.disabled = !($('#icm-ok', m.el).checked && $('#icm-type', m.el).value.trim() === cat); };
  $('#icm-ok', m.el).onchange = chk; $('#icm-type', m.el).oninput = chk;
  go.onclick = async () => {
    const target = $('#icm-target', m.el).value;
    if (!await requirePassword(`Konfirmasi: hapus kategori “${cat}” dan pindahkan ${u.length} berita ke “${target}”.`)) return;
    go.disabled = true;
    try {
      await batchWrite(u.map((i) => ['update', C(`informasi/${i.id}`), { kategori: target }]));
      await saveInfoCats(others, `Menghapus kategori informasi “${cat}” — ${u.length} berita dipindahkan ke “${target}”`);
      m.close(); toast(`Kategori “${cat}” dihapus · ${u.length} berita dipindahkan ke “${target}”`, 'success'); done();
    } catch (err) { go.disabled = false; toast('Gagal: ' + err.message, 'error'); }
  };
}
const infoCatOptions = (cur) => { const items = masterItems('kategoriInfo'); const all = cur && !items.some((x) => norm(x) === norm(cur)) ? [cur, ...items] : items; return all.map((x) => `<option ${norm(x) === norm(cur || '') ? 'selected' : ''}>${esc(x)}</option>`).join('') + '<option value="__new">＋ Kategori baru…</option>'; };
function infoForm(i) {
  let gambar = i?.gambar || '';
  const m = modal({
    title: i ? 'Ubah Informasi' : 'Tulis Informasi', size: 'lg',
    body: `<form id="if" class="form-grid">
      <label class="field span-2"><span>Judul *</span><input name="judul" required value="${esc(i?.judul || '')}" placeholder="mis. Gotong Royong Bersih Gampong"></label>
      <label class="field"><span>Kategori</span><select name="kategori">${infoCatOptions(i?.kategori || masterItems('kategoriInfo')[0] || 'Pengumuman')}</select></label>
      <label class="field"><span>Tanggal Acara (opsional)</span><input type="date" name="tanggalAcara" value="${esc(i?.tanggalAcara || '')}"></label>
      <label class="field"><span>Waktu</span><input name="waktu" value="${esc(i?.waktu || '')}" placeholder="mis. 08.00 WIB – selesai"></label>
      <label class="field"><span>Lokasi</span><input name="lokasi" value="${esc(i?.lokasi || '')}" placeholder="mis. Meunasah / Balai Desa"></label>
      <label class="field span-2"><span>Isi * <small class="muted">— atur font, ukuran, warna, tebal & miring; format otomatis dikonversi saat dikirim ke WhatsApp</small></span><textarea name="isi" rows="9" required data-rich>${esc(i?.isi || '')}</textarea></label>
      <label class="field span-2"><span>Foto & video dari URL <small class="muted">— satu per baris, boleh ditambah “| keterangan”. YouTube, Google Drive, atau link gambar</small></span><textarea name="media" rows="3" placeholder="https://youtu.be/xxxxxxxxxxx | Video kegiatan&#10;https://drive.google.com/file/d/…/view | Dokumentasi&#10;https://contoh.com/foto.jpg">${esc(mediaLinesText(i?.media))}</textarea></label>
      <div class="span-2 media-edit" id="if-media-prev"></div>
      <div class="field span-2"><span>Gambar sampul (opsional)</span><div class="img-pick"><div id="if-prev">${gambar ? `<img src="${esc(gambar)}" alt="">` : ''}</div><label class="btn btn-ghost btn-sm">${ic('upload')} Pilih gambar<input type="file" accept="image/*" id="if-img" hidden></label><button type="button" class="btn btn-ghost btn-sm" id="if-noimg" ${gambar ? '' : 'hidden'}>Hapus gambar</button></div><small class="muted">Gambar dikompres otomatis dan disimpan di basis data website.</small></div>
      <label class="check"><input type="checkbox" name="published" ${i ? (i.published ? 'checked' : '') : 'checked'}> Terbitkan di halaman publik</label>
      <label class="check"><input type="checkbox" name="pinned" ${i?.pinned ? 'checked' : ''}> Sematkan di atas</label>
    </form>
    <details class="fieldset"><summary>Pratinjau pesan WhatsApp</summary><div class="wa-preview" id="if-wa"></div></details>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-ghost" id="if-save">Simpan</button>${can('broadcast') ? `<button class="btn btn-wa" id="if-bc">${ic('wa')} Simpan & Sebarkan</button>` : ''}`,
  });
  const form = $('#if', m.el);
  bindRich(form);
  // kategori: pilih dari daftar, atau "＋ Kategori baru…"
  let lastCat = form.elements.kategori.value;
  form.elements.kategori.onchange = async (e) => {
    if (e.target.value !== '__new') { lastCat = e.target.value; return; }
    const v = (await promptDialog('Kategori baru', 'Nama kategori', '', { placeholder: 'mis. Posyandu', okText: 'Tambah' }))?.trim();
    if (v) { try { if (!masterItems('kategoriInfo').some((x) => norm(x) === norm(v))) await saveInfoCats([...masterItems('kategoriInfo'), v], `Menambah kategori informasi “${v}”`); lastCat = masterItems('kategoriInfo').find((x) => norm(x) === norm(v)) || v; } catch (err) { toast('Gagal: ' + err.message, 'error'); } }
    e.target.innerHTML = infoCatOptions(lastCat); e.target.value = lastCat;
  };
  // Foto & video dari URL: setiap tautan tampil sebagai kartu dengan tombol Hapus
  const mediaPrev = () => {
    const list = parseMediaLines(form.elements.media.value);
    $('#if-media-prev', m.el).innerHTML = list.length ? `<div class="me-head"><b>${list.length} foto/video terpasang</b><button type="button" class="btn btn-ghost btn-sm danger-text" data-me-all>${ic('trash')} Hapus semua</button></div><div class="me-grid">${list.map((x, n) => `<div class="me-item"><div class="me-prev">${mediaEmbed(x)}</div><div class="me-bar"><small title="${esc(x.url)}">${esc(x.judul || x.url)}</small><button type="button" class="btn btn-sm btn-danger" data-me-del="${n}" title="Hapus foto/video ini">${ic('trash')} Hapus</button></div></div>`).join('')}</div>` : '';
  };
  $('#if-media-prev', m.el).addEventListener('click', (e) => {
    const del = e.target.closest('[data-me-del]'); const all = e.target.closest('[data-me-all]'); if (!del && !all) return;
    const list = parseMediaLines(form.elements.media.value);
    form.elements.media.value = all ? '' : mediaLinesText(list.filter((_, n) => n !== +del.dataset.meDel));
    form.elements.media.dispatchEvent(new Event('input', { bubbles: true })); mediaPrev();
    toast(all ? 'Semua foto/video dilepas — klik Simpan untuk menerapkan' : 'Foto/video dilepas — klik Simpan untuk menerapkan', 'info');
  });
  form.elements.media.addEventListener('input', debounce(mediaPrev, 400)); mediaPrev();
  const collect = () => ({ judul: form.elements.judul.value.trim(), kategori: form.elements.kategori.value.trim(), tanggalAcara: form.elements.tanggalAcara.value, waktu: form.elements.waktu.value.trim(), lokasi: form.elements.lokasi.value.trim(), isi: form.elements.isi.value.trim(), media: parseMediaLines(form.elements.media.value), gambar, published: form.elements.published.checked, pinned: form.elements.pinned.checked });
  const prev = () => { $('#if-wa', m.el).innerHTML = waFormat(infoMessage({ ...collect(), penulis: i?.penulis || penulisNow(), id: i?.id || 'ID' })); };
  form.addEventListener('input', debounce(prev, 200)); prev();
  $('#if-img', m.el).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { gambar = await compressImage(f); $('#if-prev', m.el).innerHTML = `<img src="${gambar}" alt="">`; $('#if-noimg', m.el).hidden = false; }
    catch (err) { toast(err.message, 'error'); }
  };
  $('#if-noimg', m.el).onclick = () => { gambar = ''; $('#if-prev', m.el).innerHTML = ''; $('#if-noimg', m.el).hidden = true; };
  const save = async (thenBc) => {
    const d = collect();
    if (!d.judul || !plainText(d.isi).trim()) return toast('Judul dan isi wajib diisi', 'error');
    try {
      if (d.kategori === '__new') d.kategori = lastCat;
      if (d.kategori && !masterItems('kategoriInfo').some((x) => norm(x) === norm(d.kategori))) await F.setDoc(C('master/kategoriInfo'), { items: F.arrayUnion(d.kategori), label: MASTER_EXTRA_LABELS.kategoriInfo }, { merge: true });
      let id = i?.id;
      if (i) { await F.updateDoc(C(`informasi/${id}`), { ...d, diubahOleh: penulisNow(), updatedAt: F.serverTimestamp() }); logAudit('informasi', 'ubah', `Mengubah informasi “${d.judul}”`, { targetId: id, changes: diff(i, d, (k) => ({ judul: 'Judul', isi: 'Isi', kategori: 'Kategori', published: 'Terbit', pinned: 'Sematkan', tanggalAcara: 'Tanggal acara', waktu: 'Waktu', lokasi: 'Lokasi' }[k] || k)) }); }
      else { const ref = await F.addDoc(F.collection(F.db, 'informasi'), { ...d, penulis: penulisNow(), createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp(), createdBy: state.user.email }); id = ref.id; logAudit('informasi', 'tambah', `${d.published ? 'Menerbitkan' : 'Membuat draf'} informasi “${d.judul}”`, { targetId: id }); }
      m.close(); toast('Informasi tersimpan', 'success');
      if (thenBc) location.hash = `#/admin/broadcast?info=${id}`;
    } catch (err) { toast('Gagal menyimpan: ' + err.message, 'error'); }
  };
  $('#if-save', m.el).onclick = () => save(false);
  $('#if-bc', m.el)?.addEventListener('click', () => save(true));
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
          <option value="all">${isKadus() ? `Semua warga Dusun ${esc(myDusun())}` : 'Semua warga aktif'}</option><option value="kk">Kepala keluarga saja</option>${isKadus() ? '' : '<option value="dusun">Warga satu dusun</option><option value="kadus">Semua kepala dusun</option>'}${ids ? `<option value="ids">Warga terpilih / hasil saringan (${ids.size})</option>` : ''}
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
    $$('[data-send]').forEach((a) => a.addEventListener('click', () => { const rc = list.find((x) => x.id === a.dataset.send); bcState.sent.add(a.dataset.send); markInfo(); logBc(rc); setTimeout(draw, 50); }));
    $('#bc-share').href = waShareLink(bcState.msg.replace(/\{nama\}/g, 'Bapak/Ibu').replace(/\{dusun\}/g, ''));
    $('#bc-prev').innerHTML = waFormat(personal(list[0] || { nama: 'Bapak/Ibu', dusun: '' }));
  };
  const logBc = (rc) => logAudit('broadcast', 'kirim_wa', `Membuka pesan WhatsApp untuk ${rc?.nama || '-'}${info ? ` — “${info.judul}”` : ''}`, { target: `${rc?.nama || ''} (${rc?.noHp || ''})`, targetId: info?.id, detail: bcState.msg.slice(0, 300) });
  const markInfo = debounce(() => { if (info) F.updateDoc(C(`informasi/${info.id}`), { broadcastCount: bcState.sent.size, lastBroadcast: F.serverTimestamp() }).catch(() => {}); }, 1500);
  $('#bc-target').value = bcState.target;
  $('#bc-target').onchange = (e) => { bcState.target = e.target.value; $('#bc-dusun-wrap').hidden = bcState.target !== 'dusun'; if (bcState.target === 'dusun' && !bcState.dusun) bcState.dusun = state.dusun[0]?.nama || ''; draw(); };
  $('#bc-dusun').onchange = (e) => { bcState.dusun = e.target.value; draw(); };
  msgEl.addEventListener('input', debounce(() => { bcState.msg = msgEl.value; draw(); }, 250));
  $('#bc-copy').onclick = () => { copyText(bcState.msg); logAudit('broadcast', 'salin_pesan', 'Menyalin pesan WhatsApp untuk disebarkan'); };
  $('#bc-share').addEventListener('click', () => logAudit('broadcast', 'bagikan_grup', 'Membagikan pesan ke grup/kontak WhatsApp', { targetId: info?.id }));
  $('#bc-reset').onclick = () => { bcState.sent.clear(); draw(); };
  $('#bc-next').onclick = () => {
    const nx = recipients().find((x) => !bcState.sent.has(x.id));
    if (!nx) return toast('Semua penerima sudah dibuka', 'success');
    bcState.sent.add(nx.id); markInfo(); logBc(nx); window.open(waLink(nx.noHp, personal(nx)), '_blank', 'noopener'); draw();
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
  logAudit('instagram', 'sinkron', `Sinkronisasi Instagram: ${posts.length} postingan${silent ? ' (otomatis)' : ''}`, { count: posts.length });
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
    <p class="muted">Postingan yang diunggah admin ke Instagram desa otomatis tampil di halaman <b>Highlight</b> situs ini. Sinkronisasi berjalan otomatis saat admin membuka dasbor (setiap 3 jam)${isSuper() ? ' dan — bila GitHub Actions diaktifkan — setiap 6 jam di server' : ' dan secara berkala di server'}.</p>
    <form id="ig-form" class="form-grid">
      <label class="field"><span>Username Instagram</span><div class="input-group"><span class="addon">@</span><input name="username" value="${esc(state.config.igUsername || '')}" placeholder="namadesa"></div></label>
      <label class="field" title="Access Token (Instagram API with Instagram Login)"><span>Access Token</span><input name="token" type="password" placeholder="IGAA… (kosongkan bila tidak diubah)" autocomplete="off"></label>
      <div class="ig-actions"><button type="button" class="btn btn-primary" id="ig-save">${ic('check')} Simpan</button><button type="button" class="btn btn-ghost" id="ig-sync">${ic('refresh')} Sinkronkan</button></div>
      <p class="muted small span-2 ig-last">${ic('cal')} Sinkron terakhir: <b>${esc(fmtDate(state.config.igLastSync, true) || 'belum pernah')}</b></p>
    </form>
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
      logAudit('instagram', 'pengaturan', `Mengubah pengaturan Instagram${t ? ' (token baru)' : ''}`, { detail: `@${u}` });
      toast('Pengaturan Instagram disimpan', 'success');
      if (t) await syncInstagram();
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  };
  $('#ig-sync').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; try { await syncInstagram(); } catch (err) { toast('Sinkronisasi gagal: ' + err.message, 'error'); } b.disabled = false; };
  $$('[data-hide]', main).forEach((b) => b.onclick = () => { const p = state.ig.find((x) => x.id === b.dataset.hide); F.updateDoc(C(`instagram/${p.id}`), { hidden: !p.hidden }); logAudit('instagram', p.hidden ? 'tampilkan' : 'sembunyikan', `${p.hidden ? 'Menampilkan' : 'Menyembunyikan'} postingan Instagram`, { target: (p.caption || p.permalink || '').slice(0, 80) }); });
  $$('[data-pin]', main).forEach((b) => b.onclick = () => { const p = state.ig.find((x) => x.id === b.dataset.pin); F.updateDoc(C(`instagram/${p.id}`), { pinned: !p.pinned }); logAudit('instagram', 'sematkan', `${p.pinned ? 'Melepas sematan' : 'Menyematkan'} postingan Instagram`, { target: (p.caption || '').slice(0, 80) }); });
  $$('[data-del]', main).forEach((b) => b.onclick = async () => { if (await confirmDelete('Hapus postingan ini dari situs? (Tidak menghapus di Instagram. Postingan dari API akan muncul lagi saat sinkronisasi; gunakan “sembunyikan” untuk menyembunyikan permanen.)')) { F.deleteDoc(C(`instagram/${b.dataset.del}`)); logAudit('instagram', 'hapus', 'Menghapus postingan Instagram dari situs'); } });
  $('#ig-manual').onclick = () => {
    let img = '';
    const m = modal({ title: 'Tambah Postingan Manual', body: `<div class="form-grid"><label class="field span-2"><span>Tautan postingan Instagram *</span><input id="mp-link" placeholder="https://www.instagram.com/p/…"></label><label class="field span-2"><span>Keterangan</span><textarea id="mp-cap" rows="3"></textarea></label><div class="field span-2"><span>Gambar *</span><div class="img-pick"><div id="mp-prev"></div><label class="btn btn-ghost btn-sm">${ic('upload')} Pilih gambar<input type="file" accept="image/*" id="mp-img" hidden></label></div></div></div>`, footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="mp-ok">Simpan</button>' });
    $('#mp-img', m.el).onchange = async (e) => { try { img = await compressImage(e.target.files[0], 900); $('#mp-prev', m.el).innerHTML = `<img src="${img}" alt="">`; } catch (err) { toast(err.message, 'error'); } };
    $('#mp-ok', m.el).onclick = async () => {
      const link = $('#mp-link', m.el).value.trim();
      if (!/^https:\/\/(www\.)?instagram\.com\//.test(link) || !img) return toast('Isi tautan Instagram yang valid dan pilih gambar', 'error');
      await F.addDoc(F.collection(F.db, 'instagram'), { permalink: link, caption: $('#mp-cap', m.el).value.trim(), mediaUrl: img, mediaType: 'IMAGE', timestamp: new Date().toISOString(), source: 'manual' });
      logAudit('instagram', 'tambah_manual', 'Menambah postingan Instagram manual', { target: link });
      m.close(); toast('Postingan ditambahkan', 'success');
    };
  };
}


// ---------------------------------------------------------------- Pengaturan
function viewPengaturan(main) {
  state.view = 'form';
  main.setAttribute('data-guard', '');
  const c = state.config; const w = c.wilayah || {};
  const ig = c.infografis || {};
  const igCats = ig.cats || DEFAULT_INFOGRAFIS;
  main.innerHTML = `
  ${can('pengaturan') ? `<div class="panel hd-panel" id="hd-panel"><h3>${ic('edit')} Teks Kartu Beranda</h3>
    <p class="muted small">Tulisan di bawah judul <b>“Portal Data &amp; Informasi ${esc(`${desaJenis()} ${desaName()}`.trim())}”</b> pada kartu paling atas beranda. Bisa ditebalkan, dimiringkan, diberi warna/huruf, atau tautan.</p>
    <div class="hd-prev" aria-label="Pratinjau kartu beranda"><span class="eyebrow">${ic('loc')} Pratinjau</span><b class="hd-title">Portal Data &amp; Informasi<br>${esc(`${desaJenis()} ${desaName()}`.trim())}</b><div class="hero-desc rich" id="hd-prev-desc"></div></div>
    <label class="field"><span>Isi tulisan</span><textarea id="hd-text" rows="3" data-rich>${esc(c.deskripsi || '')}</textarea></label>
    <p class="muted tiny">Saran: 1–2 kalimat singkat. Di HP ditampilkan maksimal 2 baris (sisanya dipotong “…”). Kosongkan untuk memakai tulisan bawaan.</p>
    <div class="row-gap"><button class="btn btn-primary" id="hd-save">${ic('check')} Simpan Teks Beranda</button><button class="btn btn-ghost" id="hd-reset" type="button">Pakai tulisan bawaan</button></div>
  </div>` : ''}
  ${can('pengaturan') ? `<div class="panel"><h3>${ic('home')} Profil ${esc(jenisLabel())}</h3>
    <form id="pf" class="form-grid">
      <label class="field"><span>Sebutan</span><select name="jenisDesa">${['Desa', 'Gampong', 'Kelurahan', 'Nagari', 'Kampung', 'Pekon', 'Lembang', 'Negeri'].map((j) => `<option ${jenisLabel() === j ? 'selected' : ''}>${j}</option>`).join('')}</select></label>
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
      <label class="field span-2"><span>Penutup pesan WhatsApp</span><input name="waFooter" value="${esc(c.waFooter || '')}" placeholder="mis. Hormat kami, Pemerintah Gampong …"></label>
      <div class="field span-2"><span>Logo desa</span><div class="img-pick"><div id="logo-prev">${c.logo ? `<img src="${esc(c.logo)}" alt="">` : ''}</div><label class="btn btn-ghost btn-sm">${ic('upload')} Pilih logo<input type="file" accept="image/*" id="logo-in" hidden></label><button type="button" class="btn btn-ghost btn-sm" id="logo-rm">Hapus logo</button></div></div>
    </form>
    <div class="row-gap"><button class="btn btn-primary" id="pf-save">${ic('check')} Simpan Profil</button></div>
  </div>
  <div class="panel-grid two">
    <div class="panel"><h3>${ic('moon')} Jadwal Sholat (panel beranda)</h3><div id="sholat-settings"></div></div>
    <div class="panel"><h3>${ic('chart')} Infografis Publik</h3>
      <p class="muted small">Pilih kategori yang boleh ditampilkan di halaman publik <b>Infografis</b>. Hanya angka agregat yang dipublikasikan — tidak ada nama, NIK, atau data pribadi.</p>
      <div class="chips" id="ig-cats">${categoryFields().map((f) => `<label class="chip-check"><input type="checkbox" value="${f.key}" ${igCats.includes(f.key) ? 'checked' : ''}><span>${esc(f.label)}</span></label>`).join('')}</div>
      <label class="field"><span>Sembunyikan nilai dengan jumlah kurang dari (perlindungan privasi)</span><input type="number" id="ig-min" min="1" max="20" value="${esc(ig.min ?? 3)}"></label>
      <p class="muted small">Kategori sensitif seperti penyakit, disabilitas, bansos, dan desil sebaiknya tidak dipublikasikan.</p>
      <button class="btn btn-primary" id="ig-save">Simpan</button></div>
  </div>
  <div class="panel"><h3>${ic('mega')} Running Text (footer halaman publik)</h3>
    <div class="form-grid">
      <label class="check"><input type="checkbox" id="rt-on" ${c.runningText?.aktif ? 'checked' : ''}> Tampilkan running text</label>
      <label class="field"><span>Label</span><input id="rt-label" value="${esc(c.runningText?.label || 'Info')}" maxlength="20"></label>
      <label class="field"><span>Kecepatan</span><select id="rt-speed">${[['lambat', 'Lambat'], ['normal', 'Normal'], ['cepat', 'Cepat']].map(([v, l]) => `<option value="${v}" ${(c.runningText?.kecepatan || 'normal') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="field span-2"><span>Teks (satu pengumuman per baris)</span><textarea id="rt-text" rows="4" maxlength="1500" placeholder="Pembayaran PBB dibuka setiap Senin–Kamis di kantor Keuchik.&#10;Posyandu balita setiap tanggal 10.">${esc(c.runningText?.teks || '')}</textarea></label>
      <label class="field"><span>Pilihan font</span><select id="rt-font" title="${FONTS.length - 1} huruf">${fontOptions(c.runningText?.font || '')}</select></label>
      <label class="field"><span>Ukuran font</span><select id="rt-size">${[['', 'Normal'], ['0.8rem', 'Kecil'], ['0.95rem', 'Sedang'], ['1.05rem', 'Besar'], ['1.2rem', 'Sangat besar']].map(([v, l]) => `<option value="${v}" ${(c.runningText?.size || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="field"><span>Warna teks</span><input type="color" id="rt-color" value="${esc(c.runningText?.color || '#ffffff')}"></label>
      <label class="field"><span>Warna latar</span><div class="input-group"><input type="color" id="rt-bg" value="${esc(c.runningText?.bg || '#0f766e')}"><button type="button" class="btn btn-ghost btn-sm" id="rt-bg-reset" title="Ikuti warna tema">Ikuti tema</button></div></label>
      <label class="check"><input type="checkbox" id="rt-bold" ${c.runningText?.bold ? 'checked' : ''}> <b>Tebal</b></label>
      <label class="check"><input type="checkbox" id="rt-italic" ${c.runningText?.italic ? 'checked' : ''}> <i>Miring</i></label>
    </div>
    <div class="ticker-preview" id="rt-prev"></div>
    <button class="btn btn-primary" id="rt-save">Simpan Running Text</button>
  </div>` : ''}
  <div class="panel-grid two">
    <div class="panel"><h3>${ic('users')} Akun Saya</h3>
      <div class="profile-card">${avatar(state.profile, 'xl')}<div><b>${esc(state.profile?.nama || '-')}</b><small class="muted">${esc(state.user?.email || '')}</small><span class="badge ${isSuper() ? 'badge-warn' : isKadus() ? 'badge-ok' : ''}">${esc(ROLE_LABEL[state.role] || state.role)}${isKadus() ? ' · Dusun ' + esc(myDusun()) : ''}</span>
        <div class="row-gap"><label class="btn btn-ghost btn-sm">${ic('upload')} Ganti foto profil<input type="file" accept="image/*" id="av-in" hidden></label>${state.profile?.foto ? '<button class="btn btn-ghost btn-sm" id="av-rm">Hapus foto</button>' : ''}</div></div></div>
      <form id="nmf" class="input-group"><input name="nama" value="${esc(state.profile?.nama || '')}" placeholder="Nama tampilan"><button class="btn btn-ghost">Simpan nama</button></form>
      <h4 class="detail-h">Ubah Password</h4>
      <form id="pwf" class="form-stack">
        <label class="field"><span>Password saat ini</span><input type="password" name="cur" autocomplete="current-password" required></label>
        <label class="field"><span>Password baru (min. 8 karakter, kombinasi huruf & angka)</span><input type="password" name="nw" autocomplete="new-password" minlength="8" required></label>
        <label class="field"><span>Ulangi password baru</span><input type="password" name="nw2" autocomplete="new-password" required></label>
        <button class="btn btn-primary">Ubah Password</button>
      </form></div>
    <div class="panel"><h3>${ic('send')} Ubah Email Login</h3>
      <p class="muted small">Tautan verifikasi dikirim ke email baru. Setelah diklik, login memakai email baru dengan password yang sama.${isSuper() ? ' Untuk Super Admin, login tetap cukup dengan password (klik 5× tulisan copyright).' : ''}</p>
      ${isSuper() && state.authCfg.pendingEmail ? `<p class="callout small-callout">Menunggu verifikasi: <b>${esc(state.authCfg.pendingEmail)}</b></p>` : ''}
      <form id="emf" class="form-stack">
        <label class="field"><span>Email baru</span><input type="email" name="email" required></label>
        <label class="field"><span>Password saat ini</span><input type="password" name="cur" autocomplete="current-password" required></label>
        <button class="btn btn-primary">Kirim Verifikasi</button>
      </form>
      ${isSuper() ? `<h4 class="detail-h">${ic('shield')} Keamanan Sesi</h4>
      <label class="field"><span>Logout otomatis setelah tidak aktif (menit, 0 = nonaktif)</span><div class="input-group"><input type="number" id="idle-min" min="0" max="480" value="${esc(c.idleMinutes ?? APP.idleMinutesDefault)}"><button class="btn btn-ghost" id="idle-save">Simpan</button></div></label>` : ''}
    </div>
  </div>
  <div class="panel"><h3>Tentang Aplikasi</h3>
    <dl class="detail"><dt>Aplikasi</dt><dd>${APP.fullName}</dd><dt>Versi</dt><dd>${esc(APP.buildLabel)}</dd><dt>Hak cipta</dt><dd>${esc(APP.credit)}</dd>${isSuper() ? `<dt>Database</dt><dd>Firebase Firestore${F.firebaseConfig?.projectId ? ' • ' + esc(F.firebaseConfig.projectId) : ''}</dd><dt>Perlindungan bot</dt><dd>${APP.appCheckSiteKey ? 'App Check (reCAPTCHA v3) aktif' : 'App Check belum diaktifkan — lihat SECURITY.md'}</dd><dt>PWA</dt><dd>${navigator.serviceWorker?.controller ? 'Aktif — bisa dipakai offline' : 'Siap dipasang'}</dd>` : ''}<dt>Hak cipta</dt><dd>${APP.credit}</dd></dl>
    <button class="btn btn-ghost btn-sm" id="chk-upd">${ic('refresh')} Periksa pembaruan</button></div>`;

  if (can('pengaturan')) {
    // Teks kartu beranda (deskripsi di bawah judul "Portal Data & Informasi …")
    const hp = $('#hd-panel'); bindRich(hp);
    const hdVal = () => $('#hd-text').value.trim();
    const hdPrev = () => { const v = hdVal(); $('#hd-prev-desc').innerHTML = v ? richRender(v) : esc(HERO_DESC_DEFAULT); };
    hdPrev(); hp.addEventListener('input', hdPrev); hp.addEventListener('change', hdPrev);
    $('#hd-reset').onclick = () => { const ed = hp.querySelector('[contenteditable]'); if (ed) ed.innerHTML = ''; $('#hd-text').value = ''; hdPrev(); toast('Tulisan bawaan dipakai — klik Simpan untuk menerapkan', 'info'); };
    $('#hd-save').onclick = async () => {
      const v = hdVal(); if (plainText(v).length > 600) return toast('Tulisan terlalu panjang (maks. 600 karakter)', 'error');
      try { await F.setDoc(C('config/app'), { deskripsi: v }, { merge: true }); logAudit('pengaturan', 'teks_beranda', 'Mengubah teks kartu beranda', { changes: diff({ deskripsi: c.deskripsi || '' }, { deskripsi: v }) }); toast('Teks beranda disimpan', 'success'); }
      catch (e) { toast('Gagal: ' + e.message, 'error'); }
    };
    const pf = $('#pf'); bindRich(pf);
    const wil = [0, 1, 2, 3].map((i) => $('#pw_' + i));
    bindWilayahChain(wil);
    let logo = c.logo || '';
    $('#logo-in').onchange = async (e) => { try { logo = await compressImage(e.target.files[0], 256, 0.85); $('#logo-prev').innerHTML = `<img src="${logo}" alt="">`; } catch (err) { toast(err.message, 'error'); } };
    $('#logo-rm').onclick = () => { logo = ''; $('#logo-prev').innerHTML = ''; };
    $('#pf-save').onclick = async () => {
      const d = Object.fromEntries(['jenisDesa', 'namaDesa', 'kepalaDesa', 'telepon', 'emailDesa', 'tagline', 'alamatKantor', 'waFooter'].map((k) => [k, pf.elements[k].value.trim()]));
      if (!d.namaDesa) return toast('Nama desa wajib diisi', 'error');
      d.telepon = normalizePhone(d.telepon);
      d.wilayah = { provinsi: wil[0].value.trim(), provinsiId: wil[0].dataset.id || '', kabupaten: wil[1].value.trim(), kabupatenId: wil[1].dataset.id || '', kecamatan: wil[2].value.trim(), kecamatanId: wil[2].dataset.id || '', kelurahan: wil[3].value.trim(), kelurahanId: wil[3].dataset.id || '' };
      d.logo = logo;
      try {
        const ch = diff(c, d);
        await F.setDoc(C('config/app'), d, { merge: true });
        logAudit('pengaturan', 'profil_desa', 'Mengubah profil desa', { changes: ch });
        toast('Profil desa disimpan', 'success');
      } catch (e) { toast('Gagal: ' + e.message, 'error'); }
    };
    sholatSettingsForm($('#sholat-settings'));
    let rtBg = c.runningText?.bg || '';
    const rtRead = () => ({ aktif: $('#rt-on').checked, label: $('#rt-label').value.trim() || 'Info', kecepatan: $('#rt-speed').value, teks: $('#rt-text').value.trim().slice(0, 1500), font: $('#rt-font').value, size: $('#rt-size').value, color: $('#rt-color').value, bg: rtBg, bold: $('#rt-bold').checked, italic: $('#rt-italic').checked });
    const rtPrev = () => { const rt = rtRead(); $('#rt-prev').innerHTML = `<div class="ticker" style="${rt.bg ? `--tk:${esc(rt.bg)}` : ''}"><span class="ticker-label">${ic('mega')} ${esc(rt.label)}</span><div class="ticker-track"><div class="ticker-move" style="${tickerStyle(rt)}">${(rt.teks || 'Contoh teks berjalan').split('\n').filter(Boolean).map((t) => `<span>${esc(t)}</span><i>•</i>`).join('')}</div></div></div>`; };
    $('#rt-bg').oninput = (e) => { rtBg = e.target.value; rtPrev(); };
    $('#rt-bg-reset').onclick = () => { rtBg = ''; rtPrev(); };
    $('#rt-font').addEventListener('focus', loadAllFonts, { once: true }); $('#rt-font').addEventListener('pointerdown', loadAllFonts, { once: true });
    ['#rt-label', '#rt-text', '#rt-font', '#rt-size', '#rt-color', '#rt-bold', '#rt-italic'].forEach((id) => $(id).addEventListener('input', debounce(rtPrev, 150)));
    rtPrev();
    $('#rt-save').onclick = async () => {
      const rt = rtRead();
      await F.setDoc(C('config/app'), { runningText: rt }, { merge: true });
      logAudit('pengaturan', 'running_text', `${rt.aktif ? 'Mengaktifkan' : 'Menonaktifkan'} running text`, { detail: rt.teks.slice(0, 300) });
      toast('Running text disimpan', 'success');
    };
    $('#ig-save').onclick = async () => {
      const cats = $$('#ig-cats input:checked').map((x) => x.value);
      const min = Math.max(1, Number($('#ig-min').value) || 3);
      await F.setDoc(C('config/app'), { infografis: { cats, min } }, { merge: true });
      logAudit('pengaturan', 'infografis', 'Mengubah kategori infografis publik', { detail: cats.join(', ') + ` (min ${min})` });
      toast('Pengaturan infografis disimpan', 'success');
      setTimeout(() => updatePublicStats(), 500);
    };
  }
  $('#av-in').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const foto = await compressImage(f, 192, 0.8);
      await F.updateDoc(C(`users/${state.user.uid}`), { foto });
      state.profile = { ...state.profile, foto }; logAudit('auth', 'ubah_foto', 'Mengganti foto profil');
      toast('Foto profil diperbarui', 'success'); root.dataset.shell = ''; render();
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
  };
  $('#av-rm')?.addEventListener('click', async () => { await F.updateDoc(C(`users/${state.user.uid}`), { foto: '' }); state.profile = { ...state.profile, foto: '' }; logAudit('auth', 'hapus_foto', 'Menghapus foto profil'); root.dataset.shell = ''; render(); });
  $('#nmf').onsubmit = async (e) => {
    e.preventDefault(); const nama = e.target.elements.nama.value.trim(); if (!nama) return;
    try { await F.updateDoc(C(`users/${state.user.uid}`), { nama }); logAudit('auth', 'ubah_nama', `Mengubah nama tampilan menjadi ${nama}`); toast('Nama disimpan', 'success'); }
    catch (err) { toast(err.message, 'error'); }
  };
  const reauth = (pw) => F.reauthenticateWithCredential(F.auth.currentUser, F.EmailAuthProvider.credential(F.auth.currentUser.email, pw));
  $('#pwf').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target; const nw = f.elements.nw.value;
    if (nw.length < 8 || !/[a-zA-Z]/.test(nw) || !/\d/.test(nw)) return toast('Password baru minimal 8 karakter dan mengandung huruf serta angka', 'error');
    if (nw !== f.elements.nw2.value) return toast('Konfirmasi password tidak sama', 'error');
    try { await reauth(f.elements.cur.value); await F.updatePassword(F.auth.currentUser, nw); Sync.rekey(nw); f.reset(); logAudit('auth', 'ubah_password', 'Mengubah password'); toast('Password berhasil diubah', 'success'); }
    catch (err) { logAudit('auth', 'ubah_password_gagal', 'Gagal mengubah password', { detail: err.code }); toast(authErrorMessage(err), 'error'); }
  };
  $('#emf').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target; const em = f.elements.email.value.trim();
    if (norm(em) === norm(F.auth.currentUser.email)) return toast('Email baru sama dengan email saat ini', 'error');
    try {
      await reauth(f.elements.cur.value);
      await F.verifyBeforeUpdateEmail(F.auth.currentUser, em);
      if (isSuper()) await F.setDoc(C('config/auth'), { pendingEmail: em }, { merge: true });
      logAudit('auth', 'ubah_email', `Meminta perubahan email ke ${em}`);
      f.reset(); toast(`Tautan verifikasi dikirim ke ${em}.`, 'success', { duration: 9000 });
    } catch (err) { toast(authErrorMessage(err), 'error'); }
  };
  $('#idle-save')?.addEventListener('click', async () => {
    const v = Math.max(0, Number($('#idle-min').value) || 0);
    await F.setDoc(C('config/app'), { idleMinutes: v }, { merge: true });
    logAudit('pengaturan', 'idle', `Mengatur logout otomatis ${v} menit`); toast('Disimpan', 'success');
  });
  $('#chk-upd').onclick = async () => { if (!state.swReg) return toast('Service worker belum aktif', 'error'); await state.swReg.update(); toast(state.swReg.waiting ? 'Pembaruan tersedia' : `Anda memakai versi terbaru (v${APP.version})`, 'info'); };
}

// ---------------------------------------------------------------- Tampilan & Tema (khusus Super Admin)
boot();

// ---------------------------------------------------------------- v2.9.19 tombol Mode ringan (per perangkat)
const LITE_LBL = { auto: 'Otomatis', on: 'Selalu ringan', off: 'Tampilan penuh' };
function paintLite() {
  const on = isLite();
  document.querySelectorAll('[data-lite-toggle]').forEach((b) => { b.classList.toggle('on', on); b.innerHTML = ic('activity'); b.title = `Mode ringan ${on ? 'aktif' : 'nonaktif'} (${LITE_LBL[litePref()]}) — ketuk untuk ${on ? 'mematikan' : 'mengaktifkan'}`; });
  document.querySelectorAll('[data-lite-switch]').forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); const st = b.querySelector('.sw-state'); if (st) st.textContent = on ? 'Aktif' : 'Nonaktif'; });
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-lite-toggle], [data-lite-switch]')) return;
  const next = isLite() ? 'off' : 'on'; // sekali tekan → tersimpan permanen di perangkat ini sampai diubah lagi
  setLitePref(next); paintLite(); applyBackground(state.view === 'public' ? state.config.latar : null, { isHome: (location.hash || '#/') === '#/' });
  toast(`Mode ringan: ${LITE_LBL[next]}${isLite() ? ' — efek berat dimatikan di perangkat ini' : ' — semua efek tampil'}`, 'info');
});
new MutationObserver(() => { if (document.querySelector('[data-lite-toggle]:not([title]), [data-lite-switch]:not([aria-checked])')) paintLite(); }).observe(document.body, { childList: true, subtree: true });

// ---------------------------------------------------------------- v3.0.0 tombol "← Kembali" di halaman publik
// Kembali ke halaman sebelumnya di dalam website; bila halaman dibuka langsung (tanpa riwayat) → ikuti tautannya.
let inAppNav = 0; addEventListener('hashchange', () => { inAppNav++; });
document.addEventListener('click', (e) => { const a = e.target.closest('a[data-goback]'); if (!a || e.ctrlKey || e.metaKey) return; if (inAppNav > 0) { e.preventDefault(); history.back(); } });

// v3.0.0: sorotan mengikuti kursor — kartu/tombol yang ditunjuk ikut berwarna, lalu kembali ke bawaan saat kursor keluar
document.addEventListener('mouseover', (e) => {
  const t = e.target.closest?.('[data-hl-group] > .tile'); if (t && !t.classList.contains('hl')) { t.parentElement.querySelectorAll('.tile.hl').forEach((x) => x.classList.remove('hl')); t.classList.add('hl'); }
  const b = e.target.closest?.('[data-hl-btns] > .btn'); if (b && !b.classList.contains('btn-primary')) { b.parentElement.querySelectorAll('.btn').forEach((x) => { x.classList.toggle('btn-primary', x === b); x.classList.toggle('btn-ghost', x !== b); }); }
});
document.addEventListener('mouseout', (e) => {
  const g = e.target.closest?.('[data-hl-group]'); if (g && !g.contains(e.relatedTarget)) g.querySelectorAll('.tile').forEach((x, i) => x.classList.toggle('hl', i === 0));
  const h = e.target.closest?.('[data-hl-btns]'); if (h && !h.contains(e.relatedTarget)) h.querySelectorAll('.btn').forEach((x, i) => { x.classList.toggle('btn-primary', i === 0); x.classList.toggle('btn-ghost', i !== 0); });
});

function isPhone() { return matchMedia('(max-width: 860px)').matches; }

// ---------------------------------------------------------------- v3.0.0 menu: Pasang Aplikasi & Mode Ringan, info pertama kali
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function menuExtras(admin = false) {
  return `${standalone() ? '' : `<button type="button" class="menu-x" data-install-menu>${ic('phone')}<span>Pasang Aplikasi</span></button>`}
    <button type="button" class="menu-x lite-sw" data-lite-switch role="switch">${ic('activity')}<span>Mode Ringan${admin ? '' : '<small>Lebih hemat & lancar di HP</small>'}</span><i class="sw"><b class="sw-state"></b></i></button>`;
}
function installHelp() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  modal({ title: 'Pasang Aplikasi', size: 'sm', body: `<p>Pasang website ini sebagai aplikasi di layar utama HP — terbuka lebih cepat, layar penuh, tanpa perlu mengetik alamat.</p>
    ${ios ? `<ol class="steps-ol"><li>Buka website ini di <b>Safari</b>.</li><li>Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas).</li><li>Pilih <b>Tambahkan ke Layar Utama</b>, lalu <b>Tambah</b>.</li></ol>`
      : `<ol class="steps-ol"><li>Buka website ini di <b>Chrome</b>.</li><li>Ketuk menu <b>⋮</b> di kanan atas.</li><li>Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</li></ol>`}
    <p class="muted small">Bila tombol pasang otomatis tersedia di browser Anda, jendela pemasangan akan langsung muncul saat menu ini diketuk.</p>`,
    footer: '<button class="btn btn-primary" data-close>Mengerti</button>' });
}
// Info Mode Ringan untuk pengunjung pertama di HP
function liteIntro() {
  try { if (localStorage.getItem('dd:liteInfo')) return; } catch { return; }
  if (!isPhone() || state.view !== 'public' || document.querySelector('.modal-backdrop')) return;
  try { localStorage.setItem('dd:liteInfo', '1'); } catch { /* */ }
  const on = isLite();
  const m = modal({ title: 'Mode Ringan', size: 'sm', body: `<div class="lite-intro">${ic('activity')}<div>
      <p><b>Mode Ringan ${on ? 'sudah aktif' : 'tersedia'} di HP Anda.</b> Efek visual yang berat (kaca buram, video latar, animasi) dimatikan agar website lebih <b>lancar, hemat baterai & kuota</b>. Isi dan tampilan tetap sama.</p>
      <p>Untuk menyalakan/mematikan kapan saja: ketuk <b>☰ Menu</b> di bilah bawah → <b>Mode Ringan</b>. Pilihan Anda tersimpan di HP ini.</p></div></div>`,
    footer: `<button class="btn btn-ghost" data-lite-intro-toggle>${on ? 'Matikan' : 'Aktifkan'}</button><button class="btn btn-primary" data-close>Mengerti</button>` });
  m.el.querySelector('[data-lite-intro-toggle]').onclick = () => { setLitePref(on ? 'off' : 'on'); paintLite(); applyBackground(state.config.latar, { isHome: (location.hash || '#/') === '#/' }); m.close(); toast(`Mode Ringan ${on ? 'dimatikan' : 'diaktifkan'} — ubah lagi lewat ☰ Menu`, 'info'); };
}
setTimeout(function tryIntro(n = 0) { if (state.view === 'public' && state.cfgLoaded) liteIntro(); else if (n < 20) setTimeout(() => tryIntro(n + 1), 1000); }, 1800);

// ---------------------------------------------------------------- v3.0.0 tabel admin → kartu rapi di HP
// Label kolom diambil otomatis dari judul tabel; tampilan kartu hanya aktif di layar ≤ 680px (CSS).
let ctT = 0; const cardTables = () => { if (!ctT) ctT = setTimeout(() => { ctT = 0; cardTablesRun(); }, 120); };
const cardTablesRun = () => {
  const root = document.getElementById('admin-main'); if (!root) return;
  root.querySelectorAll('table.table').forEach((tb) => {
    if (tb.closest('.rows-table, .ocr-table, .kl-table, [data-nocard]') || tb.classList.contains('rows-table')) return;
    const heads = [...tb.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    if (!heads.length) return;
    tb.classList.add('mcard');
    const mainIdx = heads.findIndex((h) => /^(nama|judul|pengguna|dokumen|aktivitas|akun|lembaga|kategori|waktu)/i.test(h));
    tb.querySelectorAll('tbody > tr').forEach((tr) => {
      if (tr.dataset.mc) return; tr.dataset.mc = '1';
      [...tr.children].forEach((td, i) => {
        if (td.colSpan > 1) { td.classList.add('mc-full'); return; }
        const h = heads[i] || '';
        if (!td.hasAttribute('data-l')) td.setAttribute('data-l', h);
        if (i === mainIdx) td.classList.add('mc-main');
        else if (!h && td.querySelector('input[type=checkbox]')) td.classList.add('mc-chk');
        else if (!h || td.classList.contains('actions-col')) td.classList.add('mc-act');
      });
    });
  });
};
new MutationObserver(cardTables).observe(document.body, { childList: true, subtree: true });
