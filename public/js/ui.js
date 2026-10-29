// Utilitas UI: escape, toast, modal, autocomplete, WhatsApp, gambar, dll.
import { track } from './usage.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function debounce(fn, ms = 200) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export const todayISO = () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v === 'object' && 'seconds' in v) return new Date(v.seconds * 1000);
  const s = String(v);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
export function fmtDate(v, withTime = false) {
  const d = toDate(v); if (!d) return '';
  let s = `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  if (withTime) s += `, ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
  return s;
}
export const fmtRp = (n) => (n === '' || n == null || Number.isNaN(Number(n))) ? '' : 'Rp ' + Number(n).toLocaleString('id-ID');
export const fmtNum = (n) => Number(n || 0).toLocaleString('id-ID');

// ---------- WhatsApp ----------
export function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d.length >= 10 ? d : '';
}
export function waLink(phone, text = '') {
  const n = waNumber(phone);
  const t = text ? `?text=${encodeURIComponent(text)}` : '';
  return n ? `https://wa.me/${n}${t}` : '';
}
export const waShareLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export function normalizePhone(v) {
  let d = String(v ?? '').replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (!d) return '';
  if (d.startsWith('62')) d = '0' + d.slice(2);
  else if (d.startsWith('8')) d = '0' + d;
  return d;
}
// Format gaya WhatsApp → HTML (*tebal* _miring_ ~coret~)
export function waFormat(text) {
  return esc(text)
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>');
}

// ---------- Teks teknis disembunyikan dari selain Super Admin ----------
// Nama layanan di balik layar (Firebase, Firestore, GitHub) dan pesan galat berbahasa Inggris diganti
// kalimat umum berbahasa Indonesia. Hanya tampilan — konfigurasi tidak diubah sama sekali.
let superCheck = () => false;
export const setViewerCheck = (fn) => { superCheck = fn; };
export const viewerIsSuper = () => { try { return !!superCheck(); } catch { return false; } };
const ERR_MAP = [
  [/missing or insufficient permissions\.?|permission[-_ ]denied/gi, 'Akses ditolak oleh sistem keamanan.'],
  [/quota exceeded\.?|resource[-_ ]exhausted/gi, 'Kuota layanan harian sedang penuh, coba lagi nanti.'],
  [/failed to get document because the client is offline\.?|client is offline|network[-_ ]request[-_ ]failed|unavailable|failed to fetch/gi, 'Koneksi ke server terputus, periksa internet Anda.'],
  [/the query requires an index[^.]*\.?|failed[-_ ]precondition/gi, 'Server sedang menyiapkan data, coba lagi beberapa menit lagi.'],
  [/no document to update[^.]*\.?|not[-_ ]found/gi, 'Data tidak ditemukan.'],
  [/deadline[-_ ]exceeded/gi, 'Server terlalu lama merespons.'],
  [/invalid[-_ ]argument/gi, 'Data yang dikirim tidak valid.'],
  [/unauthenticated/gi, 'Sesi login berakhir, silakan masuk lagi.'],
];
const TECH_WORDS = [
  [/firebase\s*authentication/gi, 'sistem login'], [/firebase\s*console/gi, 'panel pengelola sistem'], [/firebase\s*hosting/gi, 'server hosting'],
  [/firebase\s*storage/gi, 'penyimpanan berkas'], [/(cloud\s*)?firestore\s*rules/gi, 'aturan keamanan'], [/cloud\s*firestore|firestore/gi, 'basis data'],
  [/github\s*actions/gi, 'layanan otomatis'], [/github\s*pages/gi, 'hosting cadangan'], [/github/gi, 'repositori'], [/firebaseerror:?\s*/gi, ''], [/\bfirebase\b:?/gi, 'server'],
  [/\((auth|firestore|storage|app-check)\/[\w-]+\)\.?/gi, ''],
];
export function publicText(s) {
  let t = String(s ?? '');
  if (viewerIsSuper()) return t;
  for (const [re, r] of ERR_MAP) t = t.replace(re, r);
  for (const [re, r] of TECH_WORDS) t = t.replace(re, r);
  return t.replace(/\s{2,}/g, ' ').replace(/(Akses ditolak oleh sistem keamanan\.)\s*\1/g, '$1').trim();
}
export const humanErr = (e) => publicText(e?.message || e || 'Terjadi kesalahan.');

// ---------- Toast ----------
export function toast(msg, type = 'info', opts = {}) {
  msg = publicText(msg);
  let wrap = $('#toasts');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toasts'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${esc(msg)}</span>`;
  if (opts.action) {
    const b = document.createElement('button');
    b.className = 'toast-action'; b.textContent = opts.action.label;
    b.onclick = () => { opts.action.onClick(); el.remove(); };
    el.appendChild(b);
  }
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, opts.duration || (type === 'error' ? 6000 : 3500));
}

// ---------- Modal ----------
export function modal({ title = '', body = '', footer = '', size = 'md', onClose, guard = true } = {}) {
  const el = document.createElement('div');
  el.className = 'modal-backdrop';
  el.innerHTML = `<div class="modal modal-${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Tutup">&times;</button></div>
    <div class="modal-body">${body}</div>
    ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
  </div>`;
  document.body.appendChild(el);
  document.body.classList.add('no-scroll');
  let dirty = false, closed = false;
  if (guard) {
    const mark = (e) => { if (!e.target.closest('[data-noguard]') && e.isTrusted !== false) { dirty = true; el.dataset.dirty = '1'; } };
    el.addEventListener('input', mark); el.addEventListener('change', mark);
  }
  // Tutup paksa (dipanggil kode setelah simpan berhasil)
  const close = () => {
    if (closed) return; closed = true;
    el.remove();
    if (!$('.modal-backdrop')) document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  // Tutup oleh pengguna (✕, Batal, Esc, klik di luar) → konfirmasi bila ada isian belum disimpan
  const requestClose = async () => {
    if (dirty && !(await confirmDialog('Perubahan yang Anda isi belum disimpan. Tutup tanpa menyimpan?', { title: 'Belum disimpan', okText: 'Tutup tanpa simpan', danger: true }))) return;
    close();
  };
  const isTop = () => { const all = document.querySelectorAll('.modal-backdrop'); return all[all.length - 1] === el; };
  const onKey = (e) => { if (e.key === 'Escape' && isTop()) requestClose(); };
  document.addEventListener('keydown', onKey);
  el.addEventListener('mousedown', (e) => { if (e.target === el) requestClose(); });
  el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) requestClose(); });
  requestAnimationFrame(() => el.classList.add('show'));
  return { el, close, requestClose, isDirty: () => dirty, markClean: () => { dirty = false; delete el.dataset.dirty; } };
}

export function confirmDialog(message, { title = 'Konfirmasi', okText = 'Ya, lanjutkan', danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal({
      title, size: 'sm', guard: false,
      body: `<p>${esc(message)}</p>`,
      footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(okText)}</button>`,
      onClose: () => { if (!done) resolve(false); },
    });
    m.el.querySelector('[data-ok]').onclick = () => { done = true; m.close(); resolve(true); };
  });
}

export function promptDialog(title, label, value = '', { placeholder = '', okText = 'Simpan' } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal({
      title, size: 'sm', guard: false,
      body: `<label class="field"><span>${esc(label)}</span><input id="pd-in" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`,
      footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-ok>${esc(okText)}</button>`,
      onClose: () => { if (!done) resolve(null); },
    });
    const inp = m.el.querySelector('#pd-in'); inp.focus(); inp.select();
    const ok = () => { done = true; const v = inp.value.trim(); m.close(); resolve(v); };
    m.el.querySelector('[data-ok]').onclick = ok;
    inp.onkeydown = (e) => { if (e.key === 'Enter') ok(); };
  });
}

// ---------- Autocomplete (saran saat mengetik) ----------
// source: array string | {label, id?, sub?} | fungsi async yang mengembalikan array itu
export function attachAutocomplete(input, { source, max = 30, smallList = 8, onSelect, emptyHint = '' } = {}) {
  if (input._ac) return input._ac;
  const wrap = document.createElement('div');
  wrap.className = 'ac-wrap';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  const list = document.createElement('div');
  list.className = 'ac-list'; list.setAttribute('role', 'listbox');
  wrap.appendChild(list);
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('role', 'combobox');

  let items = [], active = -1, seq = 0, isOpen = false, floating = false;
  // v2.4: bila kolom berada di dalam wadah yang memotong isi (tabel bergulir, dialog, panel), daftar saran
  // "melayang" di atas halaman (dipindah ke <body>, posisi tetap) sehingga tidak tertutup / terpotong.
  const clipped = () => { for (let el = wrap.parentElement; el && el !== document.body; el = el.parentElement) { const cs = getComputedStyle(el); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) return true; } return false; };
  const place = () => {
    if (!floating) return;
    const r = input.getBoundingClientRect(); const vh = window.innerHeight; const below = vh - r.bottom; const h = Math.min(280, list.scrollHeight || 280);
    const up = below < h + 12 && r.top > below;
    Object.assign(list.style, { left: `${Math.max(6, Math.min(r.left, window.innerWidth - Math.max(r.width, 260) - 6))}px`, width: `${Math.max(r.width, 260)}px`, top: up ? 'auto' : `${r.bottom + 4}px`, bottom: up ? `${vh - r.top + 4}px` : 'auto' });
  };
  const float = (on) => {
    if (on === floating) return;
    floating = on;
    if (on) { list.classList.add('ac-float'); document.body.appendChild(list); place(); window.addEventListener('scroll', place, true); window.addEventListener('resize', place); }
    else { list.classList.remove('ac-float'); Object.assign(list.style, { left: '', width: '', top: '', bottom: '' }); wrap.appendChild(list); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); }
  };
  const load = async () => {
    const s = typeof source === 'function' ? await source() : source;
    return (s || []).map((x) => (typeof x === 'string' ? { label: x } : x));
  };
  const hl = (label, q) => {
    if (!q) return esc(label);
    const i = label.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(label);
    return esc(label.slice(0, i)) + '<mark>' + esc(label.slice(i, i + q.length)) + '</mark>' + esc(label.slice(i + q.length));
  };
  const close = () => { list.classList.remove('open'); isOpen = false; active = -1; float(false); };
  const paint = () => {
    $$('.ac-item', list).forEach((el, i) => el.classList.toggle('active', i === active));
    list.querySelector('.ac-item.active')?.scrollIntoView({ block: 'nearest' });
  };

  async function update(fromFocus = false) {
    const my = ++seq;
    const raw = input.value.trim();
    const q = norm(raw);
    let all;
    try { list.innerHTML = '<div class="ac-empty">Memuat…</div>'; if (fromFocus || q) { if (input.isConnected && clipped()) float(true); list.classList.add('open'); place(); } all = await load(); }
    catch { all = []; }
    if (my !== seq) return;
    let res = [];
    let html = '';
    if (!q) {
      if (!all.length) { html = emptyHint ? `<div class="ac-empty">${esc(emptyHint)}</div>` : ''; }
      else if (all.length <= smallList) res = all;
      else html = `<div class="ac-empty">Ketik untuk mencari dari ${all.length.toLocaleString('id-ID')} pilihan…</div>`;
    } else {
      const starts = [], words = [], contains = [];
      for (const it of all) {
        const l = norm(it.label);
        if (l.startsWith(q)) starts.push(it);
        else if (l.split(/[\s/(),.-]+/).some((w) => w.startsWith(q))) words.push(it);
        else if (l.includes(q) || (it.sub && norm(it.sub).includes(q))) contains.push(it);
      }
      res = [...starts, ...words, ...contains];
      if (!res.length) html = `<div class="ac-empty">Tidak ada yang cocok — “${esc(raw)}” tetap bisa dipakai sebagai nilai baru.</div>`;
    }
    items = res.slice(0, max);
    active = items.length && q ? 0 : -1;
    if (items.length) {
      html = items.map((it, i) => `<div class="ac-item${i === active ? ' active' : ''}" data-i="${i}" role="option"><span>${hl(it.label, raw)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</div>`).join('');
      if (res.length > items.length) html += `<div class="ac-more">+${res.length - items.length} lainnya — ketik lebih spesifik</div>`;
    }
    list.innerHTML = html;
    if (html && input.isConnected) { if (clipped()) float(true); list.classList.add('open'); isOpen = true; place(); } else close();
  }
  const debounced = debounce(() => update(false), 90);
  function choose(i) {
    const it = items[i]; if (!it) return;
    input.value = it.label;
    input.dataset.id = it.id ?? '';
    close();
    input.dispatchEvent(new Event('change', { bubbles: true }));
    onSelect?.(it);
  }
  input.addEventListener('input', () => { input.dataset.id = ''; debounced(); });
  input.addEventListener('focus', () => update(true));
  input.addEventListener('blur', () => setTimeout(close, 150));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen) { update(true); return; } active = Math.min(active + 1, items.length - 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); paint(); }
    else if (e.key === 'Enter' && isOpen && active >= 0) { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') close();
    else if (e.key === 'Tab' && isOpen && active >= 0 && input.value.trim()) choose(active);
  });
  list.addEventListener('mousedown', (e) => {
    const el = e.target.closest('.ac-item');
    e.preventDefault();
    if (el) choose(+el.dataset.i);
  });
  input._ac = { refresh: () => update(false), close };
  return input._ac;
}

// ---------- Lain-lain ----------
const _scripts = {};
export function loadScript(src) {
  if (!_scripts[src]) {
    _scripts[src] = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = res; s.onerror = () => { delete _scripts[src]; rej(new Error('Gagal memuat ' + src)); };
      document.head.appendChild(s);
    });
  }
  return _scripts[src];
}

export function downloadBlob(blob, filename) {
  track('dl', 1, 'unduhan');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('Teks disalin', 'success'); }
  catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Teks disalin', 'success'); }
}

// Kompres gambar ke dataURL JPEG agar muat di dokumen Firestore (tanpa Storage berbayar)
export function compressImage(file, maxW = 1100, quality = 0.72) {
  track('ul', 1, 'gambar');
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      let q = quality, out = c.toDataURL('image/jpeg', q);
      while (out.length > 700_000 && q > 0.35) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Berkas bukan gambar yang valid')); };
    img.src = url;
  });
}

export function authErrorMessage(e) {
  const c = e?.code || '';
  const map = {
    'auth/invalid-credential': 'Password salah.',
    'auth/wrong-password': 'Password salah.',
    'auth/invalid-login-credentials': 'Password salah.',
    'auth/user-not-found': 'Akun belum terdaftar. Hubungi Super Admin.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
    'auth/network-request-failed': 'Tidak ada koneksi internet.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/requires-recent-login': 'Sesi sudah lama. Silakan keluar lalu masuk kembali.',
    'auth/email-already-in-use': 'Email tersebut sudah dipakai akun lain.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/operation-not-allowed': 'Metode login belum diaktifkan oleh pengelola sistem.',
    'auth/user-disabled': 'Akun ini dinonaktifkan.',
  };
  return map[c] || humanErr(e);
}

// ---------- Angka dengan pemisah ribuan otomatis (1.250.000) ----------
export const parseNum = (v) => {
  const s = String(v ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return s === '' || s === '-' ? '' : Number(s);
};
export const fmtThousand = (v) => {
  if (v === '' || v == null) return '';
  const n = typeof v === 'number' ? v : parseNum(v);
  if (n === '' || Number.isNaN(n)) return '';
  const [i, d] = String(Math.abs(n)).split('.');
  return (n < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '');
};
// Memasang format otomatis pada <input>; posisi kursor dijaga saat mengetik
export function attachThousands(input) {
  if (input._thousands) return;
  input._thousands = true;
  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('autocomplete', 'off');
  if (input.value) input.value = fmtThousand(input.value);
  input.addEventListener('input', () => {
    const pos = input.selectionStart ?? input.value.length;
    const digitsBefore = input.value.slice(0, pos).replace(/\D/g, '').length;
    const raw = input.value.replace(/[^\d,]/g, '');
    const [i, d] = raw.split(',');
    const formatted = (i || '').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d !== undefined ? ',' + d.slice(0, 2) : '');
    input.value = formatted;
    let p = 0, seen = 0;
    while (p < formatted.length && seen < digitsBefore) { if (/\d/.test(formatted[p])) seen++; p++; }
    try { input.setSelectionRange(p, p); } catch { /* */ }
  });
}
// Pasang ke semua input bertanda data-num di dalam elemen
export const bindThousands = (rootEl) => rootEl.querySelectorAll('input[data-num]').forEach(attachThousands);

// ---------- Keterangan otomatis untuk setiap kolom isian ----------
// Kolom yang belum punya petunjuk (placeholder) diberi petunjuk dari labelnya, agar tidak ada kolom kosong
// yang membingungkan. Kolom yang sudah punya petunjuk sendiri tidak diubah.
function hintLabel(el) {
  let t = '';
  const f = el.closest('.field, label, .map-item');
  if (f) { const sp = f.querySelector(':scope > span, :scope > b'); t = sp ? [...sp.childNodes].filter((n) => n.nodeType === 3 || n.nodeName === 'B').map((n) => n.textContent).join('').trim() : ''; }
  if (!t) { const td = el.closest('td'); const tb = el.closest('table'); if (td && tb) { const i = [...td.parentElement.children].indexOf(td); t = tb.querySelectorAll('thead th')[i]?.textContent.trim() || ''; } }
  if (!t) t = el.getAttribute('aria-label') || el.title || '';
  return t.replace(/[*:]/g, '').replace(/\s*[—(].*$/s, '').replace(/\s+/g, ' ').trim();
}
const SKIP = new Set(['hidden', 'checkbox', 'radio', 'range', 'color', 'file', 'submit', 'button', 'reset', 'image']);
export function autoHints(root = document) {
  root.querySelectorAll('input, textarea, select, .rte-area').forEach((el) => {
    if (el.classList?.contains('rte-area')) {
      if (!el.dataset.placeholder) { const lab = hintLabel(el.closest('.rte')?.querySelector('textarea') || el); el.dataset.placeholder = lab ? `Tulis ${lab.toLowerCase()} di sini…` : 'Tulis di sini…'; }
      return;
    }
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (SKIP.has(type) || el.dataset.hinted) return;
    el.dataset.hinted = '1';
    const lab = hintLabel(el); const L = lab.toLowerCase();
    if (el.tagName === 'SELECT' || type === 'date' || type === 'time' || type === 'datetime-local' || type === 'month') {
      if (!el.title) el.title = type === 'date' ? `Pilih tanggal${lab ? ` — ${lab}` : ''}` : lab ? `Pilih ${L}` : 'Pilih salah satu';
      return;
    }
    if (el.placeholder) { if (!el.title && lab) el.title = lab; return; }
    let ph;
    if (type === 'email' || /email/.test(L)) ph = 'contoh: nama@email.com';
    else if (type === 'password' || /password|sandi/.test(L)) ph = 'Masukkan password…';
    else if (type === 'tel' || /\b(hp|no\.? ?hp|whatsapp|telepon|wa)\b/.test(L)) ph = 'contoh: 0812 3456 7890';
    else if (type === 'url' || /\b(url|link|tautan)\b/.test(L)) ph = 'https://…';
    else if (/^(rt|rw)$/.test(L)) ph = 'contoh: 01';
    else if (/\btahun\b/.test(L)) ph = `contoh: ${new Date().getFullYear()}`;
    else if (/\burutan\b/.test(L)) ph = 'contoh: 1 (angka kecil tampil lebih dulu)';
    else if (type === 'number' || el.hasAttribute('data-num')) ph = 'Masukkan angka…';
    else if (/\b(cari|search)\b/.test(L) || type === 'search') ph = 'Ketik kata kunci…';
    else ph = lab ? `Isi ${L}…` : 'Ketik di sini…';
    el.placeholder = ph;
    if (!el.title && lab) el.title = lab;
  });
}
let hintObs = null;
export function startAutoHints() {
  if (hintObs || !('MutationObserver' in window)) return;
  let t = 0; const run = () => { clearTimeout(t); t = setTimeout(() => autoHints(document), 80); };
  hintObs = new MutationObserver(run); hintObs.observe(document.body, { childList: true, subtree: true }); run();
}
