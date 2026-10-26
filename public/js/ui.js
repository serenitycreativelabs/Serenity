// Utilitas UI: escape, toast, modal, autocomplete, WhatsApp, gambar, dll.

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

// ---------- Toast ----------
export function toast(msg, type = 'info', opts = {}) {
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
export function modal({ title = '', body = '', footer = '', size = 'md', onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'modal-backdrop';
  el.innerHTML = `<div class="modal modal-${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Tutup">&times;</button></div>
    <div class="modal-body">${body}</div>
    ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
  </div>`;
  document.body.appendChild(el);
  document.body.classList.add('no-scroll');
  const close = () => {
    el.remove();
    if (!$('.modal-backdrop')) document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  el.addEventListener('mousedown', (e) => { if (e.target === el) close(); });
  el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  requestAnimationFrame(() => el.classList.add('show'));
  return { el, close };
}

export function confirmDialog(message, { title = 'Konfirmasi', okText = 'Ya, lanjutkan', danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal({
      title, size: 'sm',
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
      title, size: 'sm',
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

  let items = [], active = -1, seq = 0, isOpen = false;
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
  const close = () => { list.classList.remove('open'); isOpen = false; active = -1; };
  const paint = () => {
    $$('.ac-item', list).forEach((el, i) => el.classList.toggle('active', i === active));
    list.querySelector('.ac-item.active')?.scrollIntoView({ block: 'nearest' });
  };

  async function update(fromFocus = false) {
    const my = ++seq;
    const raw = input.value.trim();
    const q = norm(raw);
    let all;
    try { list.innerHTML = '<div class="ac-empty">Memuat…</div>'; if (fromFocus || q) list.classList.add('open'); all = await load(); }
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
    if (html) { list.classList.add('open'); isOpen = true; } else close();
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
    'auth/user-not-found': 'Akun admin belum dibuat di Firebase Authentication.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
    'auth/network-request-failed': 'Tidak ada koneksi internet.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/requires-recent-login': 'Sesi sudah lama. Silakan keluar lalu masuk kembali.',
    'auth/email-already-in-use': 'Email tersebut sudah dipakai akun lain.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/operation-not-allowed': 'Metode login Email/Password belum diaktifkan di Firebase Console.',
  };
  return map[c] || (e?.message || 'Terjadi kesalahan.');
}
