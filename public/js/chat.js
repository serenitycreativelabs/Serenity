// =============================================================
//  Serenity — Chat Staf privat (v2.8)
//  • Hanya untuk akun staf: Kepala Dusun, Pengelola Lembaga, Admin, dan Super Admin
//  • Setiap percakapan berisi tepat 2 orang. Firestore Rules mengunci isi percakapan
//    hanya untuk kedua anggotanya — staf lain (termasuk Super Admin) tidak bisa membacanya dari chat
//  • Pesan bersifat permanen (tidak bisa diubah atau dihapus) dan setiap pesan tercatat di Audit Log
//    (Audit Log hanya bisa dibuka Super Admin)
//  • Identitas Super Admin tetap tersembunyi: tampil sebagai "Super Admin" tanpa nama/email asli
//  Hemat kuota: 1 listener daftar percakapan + 1 listener percakapan yang sedang dibuka saja.
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import * as F from './firebase.js';
import { state, C, ic, logAudit, ROLE_LABEL, myDusun, isPengelola } from './core.js';
import { esc, $, $$, toast, toDate, norm, humanErr } from './ui.js';

const MAX_LEN = 2000, PAGE = 60, DIR_TTL = 10 * 60e3;
const S = {
  on: false, me: '', unsubChats: null, unsubMsgs: null, chats: new Map(), staf: new Map(), stafAt: 0,
  open: false, view: 'list', cid: '', other: '', limit: PAGE, msgs: [], q: '', first: true, draft: {}, lastSeen: {},
};
const root = () => document.getElementById('chat-root');
const cidOf = (a, b) => [a, b].sort().join('_');
const otherOf = (cid) => cid.split('_').find((x) => x !== S.me) || '';
const unreadOf = (c) => Number(c?.unread?.[S.me] || 0);
const totalUnread = () => [...S.chats.values()].reduce((n, c) => n + unreadOf(c), 0);

// ---------------------------------------------------------------- identitas di direktori staf
function myEntry() {
  const r = state.role;
  if (r === 'superadmin') return { nama: 'Super Admin', role: r, jabatan: '', pengelola: false, aktif: true };
  const nama = String(state.profile?.nama || '').trim() || String(state.user?.email || '').split('@')[0] || ROLE_LABEL[r] || 'Staf';
  const jabatan = String(state.profile?.jabatan || (r === 'kadus' ? `Kepala Dusun ${myDusun()}` : isPengelola() ? 'Pengelola Lembaga' : '')).trim();
  return { nama: nama.slice(0, 120), role: r, jabatan: jabatan.slice(0, 160), pengelola: r === 'admin' && isPengelola(), aktif: true };
}
async function publishMe() {
  const e = myEntry(); const sig = JSON.stringify([S.me, e]);
  try { const o = JSON.parse(localStorage.getItem('dd:stafSig') || 'null'); if (o && o.sig === sig && Date.now() - o.t < 7 * 864e5) return; } catch { /* */ }
  try { await F.setDoc(C(`staf/${S.me}`), { ...e, at: F.serverTimestamp() }); localStorage.setItem('dd:stafSig', JSON.stringify({ sig, t: Date.now() })); }
  catch (x) { console.warn('staf', x.code || x); }
}
async function loadStaf(force = false) {
  if (!force && Date.now() - S.stafAt < DIR_TTL && S.staf.size) return;
  try {
    const s = await F.getDocs(F.query(F.collection(F.db, 'staf'), F.limit(300)));
    S.staf = new Map(s.docs.map((d) => [d.id, { id: d.id, ...d.data() }])); S.stafAt = Date.now();
  } catch (e) { console.warn('staf', e.code || e); }
}
const person = (uid) => S.staf.get(uid) || { id: uid, nama: 'Staf', role: '', jabatan: '' };
const nameOf = (uid) => (person(uid).role === 'superadmin' ? 'Super Admin' : person(uid).nama || 'Staf');
function roleText(p) {
  if (p.role === 'superadmin') return 'Super Admin';
  if (p.role === 'kadus') return p.jabatan || 'Kepala Dusun';
  if (p.pengelola) return p.jabatan && p.jabatan !== 'Pengelola Lembaga' ? `Pengelola · ${p.jabatan}` : 'Pengelola Lembaga';
  return p.jabatan ? `Admin · ${p.jabatan}` : 'Admin';
}
const initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
const avatar = (uid, cls = '') => { const p = person(uid); return `<span class="ct-av ${cls}" data-role="${esc(p.pengelola ? 'pengelola' : p.role || '')}" aria-hidden="true">${esc(initials(nameOf(uid)))}</span>`; };

// ---------------------------------------------------------------- waktu & teks
function timeShort(v) {
  const d = toDate(v); if (!d) return '';
  const now = new Date(); const same = d.toDateString() === now.toDateString();
  const y = new Date(now - 864e5).toDateString() === d.toDateString();
  return same ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : y ? 'Kemarin' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
const hhmm = (v) => { const d = toDate(v); return d ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''; };
function dayLabel(d) {
  const t = new Date(); if (d.toDateString() === t.toDateString()) return 'Hari ini';
  if (new Date(t - 864e5).toDateString() === d.toDateString()) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function msgHtml(t) {
  return esc(t).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`).replace(/\n/g, '<br>');
}

// ---------------------------------------------------------------- pasang / lepas
export function mountChat() {
  if (!state.user || !state.isAdmin || !['superadmin', 'admin', 'kadus'].includes(state.role)) return;
  if (S.on && S.me === state.user.uid) return;
  unmountChat();
  S.on = true; S.me = state.user.uid; S.first = true; S.chats.clear();
  const el = document.createElement('div'); el.id = 'chat-root';
  el.innerHTML = `<div class="chat-pops" aria-live="polite"></div>
    <section class="chat-panel" role="dialog" aria-label="Chat staf" hidden></section>
    <button type="button" class="chat-fab" aria-label="Buka chat staf" title="Chat staf (privat)">${ic('chat')}<span class="chat-badge" hidden>0</span></button>`;
  document.body.appendChild(el);
  el.querySelector('.chat-fab').onclick = () => (S.open ? closePanel() : openPanel());
  document.addEventListener('keydown', onKey);
  publishMe();
  loadStaf().then(() => { paintFab(); if (S.open) paint(); });
  S.unsubChats = F.onSnapshot(F.query(F.collection(F.db, 'chats'), F.where('members', 'array-contains', S.me), F.limit(200)), (s) => {
    const prev = new Map(S.chats); S.chats = new Map(s.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
    if (!S.first) for (const [id, c] of S.chats) {
      const before = unreadOf(prev.get(id)); const now = unreadOf(c);
      if (now > before && c.last?.from && c.last.from !== S.me && !(S.open && S.view === 'chat' && S.cid === id && !document.hidden)) notifyIncoming(id, c);
    }
    S.first = false;
    const unknown = [...S.chats.keys()].some((id) => !S.staf.has(otherOf(id)));
    if (unknown) loadStaf(true).then(() => { paintFab(); if (S.open) paint(); });
    paintFab(); if (S.open) { if (S.view === 'list') paintList(); else { paintHeadOnly(); markRead(); } }
  }, (e) => console.warn('chat', e.code || e));
}
export function unmountChat() {
  S.unsubChats?.(); S.unsubMsgs?.(); S.unsubChats = S.unsubMsgs = null;
  S.on = false; S.open = false; S.view = 'list'; S.cid = ''; S.chats.clear(); S.staf.clear(); S.stafAt = 0; S.msgs = [];
  document.removeEventListener('keydown', onKey);
  root()?.remove();
  try { navigator.clearAppBadge?.(); } catch { /* */ }
}
const onKey = (e) => { if (e.key === 'Escape' && S.open && !document.querySelector('.modal-backdrop')) closePanel(); };

// ---------------------------------------------------------------- tombol & lencana
function paintFab() {
  const r = root(); if (!r) return;
  const n = totalUnread(); const b = r.querySelector('.chat-badge');
  b.hidden = !n; b.textContent = n > 99 ? '99+' : String(n);
  r.querySelector('.chat-fab').classList.toggle('has-unread', !!n);
  r.querySelector('.chat-fab').setAttribute('aria-label', n ? `Buka chat staf — ${n} pesan belum dibaca` : 'Buka chat staf');
  try { n ? navigator.setAppBadge?.(n) : navigator.clearAppBadge?.(); } catch { /* */ }
}
export const openChatWith = (uid) => { openPanel(); if (uid && uid !== S.me) openConv(cidOf(S.me, uid)); };
function openPanel() {
  const r = root(); if (!r) return;
  S.open = true; r.classList.add('open'); r.querySelector('.chat-panel').hidden = false;
  r.querySelector('.chat-fab').setAttribute('aria-expanded', 'true');
  loadStaf().then(() => S.open && S.view === 'list' && paintList());
  paint();
}
function closePanel() {
  const r = root(); if (!r) return;
  saveDraft();
  S.open = false; r.classList.remove('open'); r.querySelector('.chat-panel').hidden = true;
  r.querySelector('.chat-fab').setAttribute('aria-expanded', 'false');
  S.unsubMsgs?.(); S.unsubMsgs = null; S.view = 'list'; S.cid = '';
}
const paint = () => (S.view === 'chat' && S.cid ? paintConv() : paintList());

// ---------------------------------------------------------------- daftar percakapan & kontak
function paintList() {
  const panel = root()?.querySelector('.chat-panel'); if (!panel) return;
  const keepFocus = document.activeElement?.id === 'ct-q';
  const q = norm(S.q);
  const match = (uid) => !q || norm(`${nameOf(uid)} ${roleText(person(uid))}`).includes(q);
  const convs = [...S.chats.values()].filter((c) => match(otherOf(c.id)))
    .sort((a, b) => (toDate(b.updatedAt)?.getTime() || 0) - (toDate(a.updatedAt)?.getTime() || 0));
  const inConv = new Set([...S.chats.keys()].map(otherOf));
  const order = { superadmin: 0, admin: 1, kadus: 2 };
  const others = [...S.staf.values()].filter((p) => p.id !== S.me && p.aktif !== false && !inConv.has(p.id) && match(p.id))
    .sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9) || String(a.nama).localeCompare(String(b.nama), 'id'));
  const notifBtn = 'Notification' in window && Notification.permission === 'default'
    ? `<button type="button" class="icon-btn ct-notif" title="Aktifkan notifikasi pesan di perangkat ini" aria-label="Aktifkan notifikasi">${ic('bell')}</button>` : '';
  panel.innerHTML = `<header class="ct-head"><div class="ct-title"><b>Pesan</b><small>${ic('lock')} Privat — hanya Anda &amp; lawan bicara</small></div>
      ${notifBtn}<button type="button" class="icon-btn ct-close" aria-label="Tutup chat">${ic('x')}</button></header>
    <div class="ct-search">${ic('search')}<input id="ct-q" type="search" value="${esc(S.q)}" placeholder="Cari nama atau jabatan staf…" autocomplete="off" aria-label="Cari staf"></div>
    <div class="ct-scroll">
      ${convs.length ? `<p class="ct-sec">Percakapan</p>${convs.map((c) => {
        const o = otherOf(c.id); const n = unreadOf(c); const mine = c.last?.from === S.me;
        const seen = mine && !Number(c.unread?.[o] || 0);
        return `<button type="button" class="ct-row${n ? ' unread' : ''}" data-cid="${esc(c.id)}">${avatar(o)}
          <span class="ct-main"><span class="ct-top"><b>${esc(nameOf(o))}</b><time>${esc(timeShort(c.updatedAt))}</time></span>
          <span class="ct-sub">${mine ? `<i class="ct-tick${seen ? ' seen' : ''}" title="${seen ? 'Sudah dibaca' : 'Terkirim'}">${ic('check')}</i>Anda: ` : ''}${esc(String(c.last?.text || '').replace(/\s+/g, ' ').slice(0, 80))}</span></span>
          ${n ? `<span class="ct-count">${n > 99 ? '99+' : n}</span>` : ''}</button>`;
      }).join('')}` : ''}
      <p class="ct-sec">${convs.length ? 'Staf lainnya' : 'Mulai percakapan'}</p>
      ${others.length ? others.map((p) => `<button type="button" class="ct-row" data-uid="${esc(p.id)}">${avatar(p.id)}
          <span class="ct-main"><span class="ct-top"><b>${esc(nameOf(p.id))}</b></span><span class="ct-sub">${esc(roleText(p))}</span></span>
          <span class="ct-go" aria-hidden="true">${ic('send')}</span></button>`).join('')
        : `<p class="ct-empty">${S.staf.size ? (q ? 'Tidak ada staf yang cocok.' : 'Semua staf sudah ada di daftar percakapan.') : 'Memuat daftar staf…<br><small>Staf baru muncul di sini setelah login pertama kali.</small>'}</p>`}
    </div>`;
  panel.querySelector('.ct-close').onclick = closePanel;
  panel.querySelector('.ct-notif')?.addEventListener('click', async () => { try { await Notification.requestPermission(); } catch { /* */ } paintList(); });
  const qi = panel.querySelector('#ct-q');
  qi.oninput = () => { S.q = qi.value; const pos = qi.selectionStart; paintList(); const n = $('#ct-q'); n?.focus(); try { n?.setSelectionRange(pos, pos); } catch { /* */ } };
  if (keepFocus) qi.focus();
  $$('[data-cid]', panel).forEach((b) => b.onclick = () => openConv(b.dataset.cid));
  $$('[data-uid]', panel).forEach((b) => b.onclick = () => openConv(cidOf(S.me, b.dataset.uid)));
}

// ---------------------------------------------------------------- percakapan
function openConv(cid) {
  saveDraft();
  S.view = 'chat'; S.cid = cid; S.other = otherOf(cid); S.limit = PAGE; S.msgs = [];
  paintConv(); listenMsgs(); markRead();
}
function listenMsgs() {
  S.unsubMsgs?.();
  const cid = S.cid;
  S.unsubMsgs = F.onSnapshot(F.query(F.collection(F.db, 'chats', cid, 'pesan'), F.orderBy('at', 'desc'), F.limit(S.limit)), (s) => {
    if (S.cid !== cid) return;
    S.msgs = s.docs.map((d) => ({ id: d.id, pending: !!d.metadata?.hasPendingWrites, ...d.data({ serverTimestamps: 'estimate' }) })).reverse();
    S.more = s.size >= S.limit;
    paintMsgs();
  }, (e) => { console.warn('pesan', e.code || e); const box = $('#ct-msgs'); if (box) box.innerHTML = `<p class="ct-empty">Percakapan tidak dapat dimuat. ${esc(humanErr(e))}</p>`; });
}
function paintHeadOnly() {
  const h = $('#ct-seen'); if (!h) return;
  const c = S.chats.get(S.cid); const last = S.msgs[S.msgs.length - 1];
  h.hidden = !(last && last.from === S.me && c && !Number(c.unread?.[S.other] || 0));
}
function paintConv() {
  const panel = root()?.querySelector('.chat-panel'); if (!panel) return;
  const o = S.other; const p = person(o);
  panel.innerHTML = `<header class="ct-head conv"><button type="button" class="icon-btn ct-back" aria-label="Kembali ke daftar pesan">${ic('back')}</button>
      ${avatar(o, 'sm')}<div class="ct-title"><b>${esc(nameOf(o))}</b><small>${esc(roleText(p))}</small></div>
      <button type="button" class="icon-btn ct-close" aria-label="Tutup chat">${ic('x')}</button></header>
    <div class="ct-scroll ct-msgs" id="ct-msgs"><p class="ct-empty">Memuat pesan…</p></div>
    <form class="ct-compose" id="ct-form" autocomplete="off">
      <textarea id="ct-text" rows="1" maxlength="${MAX_LEN}" placeholder="Tulis pesan untuk ${esc(nameOf(o))}…" title="Enter untuk kirim, Shift+Enter untuk baris baru" aria-label="Tulis pesan"></textarea>
      <button type="submit" class="ct-send" aria-label="Kirim pesan" disabled>${ic('send')}</button>
    </form>`;
  panel.querySelector('.ct-back').onclick = () => { saveDraft(); S.unsubMsgs?.(); S.unsubMsgs = null; S.view = 'list'; S.cid = ''; paintList(); };
  panel.querySelector('.ct-close').onclick = closePanel;
  const ta = panel.querySelector('#ct-text'), btn = panel.querySelector('.ct-send');
  ta.value = S.draft[S.cid] || '';
  const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; btn.disabled = !ta.value.trim(); };
  ta.oninput = fit; fit();
  ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); panel.querySelector('#ct-form').requestSubmit(); } };
  panel.querySelector('#ct-form').onsubmit = (e) => { e.preventDefault(); send(ta); };
  setTimeout(() => ta.focus(), 30);
}
function paintMsgs() {
  const box = $('#ct-msgs'); if (!box) return;
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80 || !box.dataset.ready;
  const prevH = box.scrollHeight, prevTop = box.scrollTop;
  let html = `<p class="ct-privacy">${ic('lock')} Percakapan ini privat antara Anda dan ${esc(nameOf(S.other))}. Pesan tersimpan permanen dan tidak dapat dihapus.</p>`;
  if (S.more) html += '<button type="button" class="btn btn-sm btn-ghost ct-more">Muat pesan sebelumnya</button>';
  if (!S.msgs.length) html += `<p class="ct-empty">Belum ada pesan. Sapa ${esc(nameOf(S.other))} lebih dulu 👋</p>`;
  let lastDay = '', lastFrom = '';
  for (const m of S.msgs) {
    const d = toDate(m.at) || new Date(); const dk = d.toDateString();
    if (dk !== lastDay) { html += `<div class="ct-day"><span>${esc(dayLabel(d))}</span></div>`; lastDay = dk; lastFrom = ''; }
    const mine = m.from === S.me;
    html += `<div class="ct-msg${mine ? ' me' : ''}${lastFrom === m.from ? ' cont' : ''}"><div class="ct-bub">${msgHtml(m.text)}<time>${m.pending ? 'mengirim…' : esc(hhmm(m.at))}</time></div></div>`;
    lastFrom = m.from;
  }
  html += '<p class="ct-seen" id="ct-seen" hidden>Dibaca</p>';
  box.innerHTML = html; box.dataset.ready = '1';
  box.querySelector('.ct-more')?.addEventListener('click', () => { S.limit += PAGE; box.dataset.keep = '1'; listenMsgs(); });
  if (box.dataset.keep) { box.scrollTop = box.scrollHeight - prevH + prevTop; delete box.dataset.keep; }
  else if (nearBottom) box.scrollTop = box.scrollHeight;
  paintHeadOnly();
}
function saveDraft() { const t = $('#ct-text'); if (t && S.cid) S.draft[S.cid] = t.value; }
async function markRead() {
  const c = S.chats.get(S.cid);
  if (!c || !unreadOf(c) || document.hidden || !S.open) return;
  try { await F.updateDoc(C(`chats/${S.cid}`), { [`unread.${S.me}`]: 0 }); } catch (e) { console.warn('dibaca', e.code || e); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.open && S.view === 'chat') markRead(); });

async function send(ta) {
  const text = ta.value.replace(/\s+$/, '').replace(/^\s*\n/, '');
  if (!text.trim()) return;
  if (text.length > MAX_LEN) { toast(`Pesan terlalu panjang (maks. ${MAX_LEN} karakter).`, 'error'); return; }
  const cid = S.cid, other = S.other, me = S.me;
  ta.value = ''; S.draft[cid] = ''; ta.dispatchEvent(new Event('input'));
  try {
    const b = F.writeBatch();
    b.set(F.doc(F.collection(F.db, 'chats', cid, 'pesan')), { from: me, text, at: F.serverTimestamp() });
    b.set(C(`chats/${cid}`), {
      members: cid.split('_'), last: { from: me, text: text.replace(/\s+/g, ' ').slice(0, 200), at: F.serverTimestamp() },
      unread: { [other]: F.increment(1), [me]: 0 }, updatedAt: F.serverTimestamp(),
    }, { merge: true });
    await b.commit();
    const to = person(other); const toLabel = to.role === 'superadmin' ? 'Super Admin' : `${roleText(to)} ${to.nama || ''}`.trim();
    logAudit('chat', 'kirim', `Pesan chat ke ${toLabel}`.slice(0, 300), { target: toLabel, targetId: cid, detail: text, to: other, toNama: toLabel });
  } catch (e) {
    ta.value = text; ta.dispatchEvent(new Event('input'));
    toast(/permission|insufficient/i.test(`${e.code} ${e.message}`) ? 'Pesan tidak terkirim: akun penerima tidak aktif atau akses Anda berubah.' : 'Pesan gagal dikirim: ' + humanErr(e), 'error');
  }
}

// ---------------------------------------------------------------- notifikasi pesan masuk (kanan bawah)
let ctx = null;
function ding() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') return;
    const o = ctx.createOscillator(), g = ctx.createGain(); const t = ctx.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.4);
  } catch { /* */ }
}
// AudioContext baru boleh berbunyi setelah ada interaksi pengguna
['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, () => { try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume?.(); } catch { /* */ } }, { once: true, capture: true }));

function notifyIncoming(cid, c) {
  const from = c.last.from; const name = nameOf(from); const text = String(c.last.text || '');
  ding();
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    const opts = { body: text.slice(0, 140), icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: `chat-${cid}`, renotify: true, data: { url: location.pathname + '#/admin' , chat: from } };
    (state.swReg?.showNotification ? state.swReg.showNotification(`Pesan dari ${name}`, opts) : Promise.reject()).catch(() => { try { new Notification(`Pesan dari ${name}`, opts); } catch { /* */ } });
  }
  const box = root()?.querySelector('.chat-pops'); if (!box) return;
  box.querySelector(`[data-pop="${CSS.escape(cid)}"]`)?.remove();
  const el = document.createElement('div'); el.className = 'chat-pop'; el.dataset.pop = cid; el.setAttribute('role', 'status');
  el.innerHTML = `${avatar(from)}<button type="button" class="cp-body"><b>${esc(name)}</b><small>${esc(roleText(person(from)))}</small><span>${esc(text.slice(0, 120))}</span></button>
    <button type="button" class="cp-x" aria-label="Tutup notifikasi">${ic('x')}</button>`;
  el.querySelector('.cp-body').onclick = () => { el.remove(); openPanel(); openConv(cid); };
  el.querySelector('.cp-x').onclick = () => el.remove();
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 8000);
}
// Klik notifikasi perangkat → buka chat dengan pengirimnya
navigator.serviceWorker?.addEventListener?.('message', (e) => { if (e.data?.type === 'open-chat' && e.data.chat && S.on) openChatWith(e.data.chat); });
