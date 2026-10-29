// Super Admin: login khusus, manajemen admin, audit log, cadangan & pemulihan (restore JSON)
import { APP } from './config.js';
import { F, ic, state, C, clean, emptyBox, loadingBox, batchWrite, PERMS, PERM_PRESETS, KADUS_PERMS, KADUS_DEFAULT, isSuper, can, hasGreen, avatar, ROLE_LABEL, AUDIT_CATS, logAudit, requirePassword, superEmail, loginFailed } from './core.js';
import * as Sync from './sync.js';
import { track } from './usage.js';
import { esc, $, $$, norm, debounce, toDate, fmtDate, fmtNum, todayISO, toast, modal, confirmDialog, promptDialog, downloadBlob, authErrorMessage } from './ui.js';
import { exportExcel, exportPdf } from './exporter.js';
import { badgeRow, badgeDialog, normBadges, BADGES } from './badges.js';
import { KATEGORI } from './lembaga.js';
import { LEMBAGA_DELEGASI } from './core.js';

// ---------------------------------------------------------------- login Super Admin (cukup password)
export function openSuperLogin() {
  const m = modal({
    title: 'Login Super Admin', size: 'sm', guard: false,
    body: `<form id="sa-f" class="form-stack"><p class="muted small">${ic('shield')} Akses khusus Super Admin. Cukup masukkan password.</p>
      <label class="field"><span>Password Super Admin</span><input type="password" id="sa-pw" autocomplete="current-password" required></label>
      <p class="err" id="sa-err"></p></form>`,
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="sa-ok">' + ic('lock') + ' Masuk</button>',
  });
  const inp = $('#sa-pw', m.el); inp.focus();
  const go = async (e) => {
    e?.preventDefault();
    const lock = Number(localStorage.getItem('dd:lockUntil') || 0);
    if (Date.now() < lock) { $('#sa-err', m.el).textContent = `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((lock - Date.now()) / 60000)} menit.`; return; }
    const btn = $('#sa-ok', m.el); btn.disabled = true;
    // v2.4: config/auth tidak lagi didengarkan terus-menerus oleh pengunjung (hemat read) — diambil saat dibutuhkan
    if (!state.authCfg.superEmail) { try { state.authCfg = (await F.getDoc(C('config/auth'))).data() || {}; } catch { /* */ } }
    const emails = [...new Set([state.authCfg.superEmail, state.authCfg.pendingEmail, APP.superAdminEmail].filter(Boolean))];
    let err = null;
    sessionStorage.setItem('dd:justLogin', '1');
    const lw = Sync.beginLogin(inp.value);
    for (const em of emails) {
      try { const cred = await F.signInWithEmailAndPassword(F.auth, em, inp.value); lw.done(cred.user.uid); err = null; break; }
      catch (x) { err = x; if (!['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(x.code)) break; }
    }
    if (err) {
      lw.fail();
      sessionStorage.removeItem('dd:justLogin'); loginFailed();
      $('#sa-err', m.el).textContent = authErrorMessage(err); btn.disabled = false; inp.select(); return;
    }
    m.close(); location.hash = '#/admin';
  };
  $('#sa-ok', m.el).onclick = go;
  $('#sa-f', m.el).onsubmit = go;
}

// ---------------------------------------------------------------- Manajemen Akun (Admin & Kepala Dusun)
let usersCache = [];
export function viewAdmins(main, r) {
  state.view = 'form';
  main.innerHTML = loadingBox();
  // Super Admin melihat semua akun. Admin bercentang hijau melihat akun Admin & Kepala Dusun —
  // akun Super Admin TIDAK PERNAH terlihat oleh siapa pun selain Super Admin (dikunci juga oleh Firestore Rules).
  const col = F.collection(F.db, 'users');
  const qs = isSuper() ? [col] : [F.query(col, F.where('role', '==', 'admin')), F.query(col, F.where('role', '==', 'kadus'))];
  Promise.all(qs.map((q) => F.getDocs(q))).then((snaps) => {
    const order = { superadmin: 0, admin: 1, kadus: 2 };
    usersCache = snaps.flatMap((s) => s.docs).map((d) => ({ uid: d.id, ...d.data() })).filter((u) => isSuper() || u.role !== 'superadmin').sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9) || String(a.dusun || '').localeCompare(String(b.dusun || '')) || String(a.nama).localeCompare(String(b.nama)));
    drawAdmins(main);
    const pre = r?.query?.get('kadus');
    if (pre) { history.replaceState(null, '', '#/admin/admin'); if (isSuper() || can('kelolaKadus')) adminForm(null, main, { role: 'kadus', dusun: pre }); }
  }).catch((e) => { main.innerHTML = emptyBox('Gagal memuat daftar akun: ' + e.message); });
}
function drawAdmins(main) {
  const permLabel = (u) => {
    if (u.role === 'superadmin') return 'Semua akses';
    const list = u.role === 'kadus' ? KADUS_PERMS : PERMS;
    const lg = (u.lembagaIds || []).map((id) => state.lembaga.find((l) => l.id === id)).filter(Boolean).map((l) => `Pengelola ${l.singkatan || l.nama}`);
    return [...list.filter(([k]) => u.perms?.[k]).map((p) => p[1]), ...lg].join(', ') || 'Belum ada akses';
  };
  const editable = (u) => u.uid !== state.user.uid && u.role !== 'superadmin' && (isSuper() || (u.role === 'kadus' && can('kelolaKadus')));
  const canKadus = isSuper() || can('kelolaKadus');
  const nAdmin = usersCache.filter((u) => u.role === 'admin').length, nKadus = usersCache.filter((u) => u.role === 'kadus').length;
  main.innerHTML = `<div class="callout">${ic('shield')}<div><b>${isSuper() ? 'Akun Admin & Kepala Dusun' : 'Admin › Manajemen Akun'}</b><p>${isSuper() ? 'Hanya Super Admin yang dapat mendaftarkan & mengubah akun Admin. Menu ini juga terbuka bagi admin yang Anda beri badge <b>Centang Hijau — Perangkat Gampong</b>.' : `Anda dapat melihat daftar akun Admin & Kepala Dusun karena memiliki badge Centang Hijau — Perangkat Gampong.${can('kelolaKadus') ? ' Anda juga dapat membuat & mengelola akun Kepala Dusun.' : ' Perubahan akun hanya dapat dilakukan Super Admin.'}`} Semua perubahan tercatat di Audit Log.</p></div></div>
  <div class="toolbar toolbar-actions">
    ${isSuper() ? `<button class="btn btn-primary" id="usr-new">${ic('plus')} Tambah Admin</button>` : ''}
    ${canKadus ? `<button class="btn ${isSuper() ? 'btn-ghost' : 'btn-primary'}" id="usr-kadus">${ic('map')} Tambah Akun Kepala Dusun</button>` : ''}
    <span class="muted small">${isSuper() ? `${nAdmin} admin · ` : ''}${nKadus} kepala dusun</span>
  </div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Pengguna</th><th>Peran</th><th>Hak akses</th><th>Status</th><th>Login terakhir</th><th class="actions-col">Aksi</th></tr></thead>
  <tbody>${usersCache.map((u) => `<tr>
    <td><div class="user-cell">${avatar(u)}<div><b>${esc(u.nama || '-')}</b>${badgeRow(u.badges, 6)}${u.uid === state.user.uid ? ' <span class="badge">Anda</span>' : ''}<br><small class="muted">${esc(u.email)}</small></div></div></td>
    <td><span class="badge ${u.role === 'superadmin' ? 'badge-warn' : u.role === 'kadus' ? 'badge-ok' : ''}">${esc(ROLE_LABEL[u.role] || u.role)}</span>${u.role === 'kadus' ? `<br><small class="muted">Dusun ${esc(u.dusun || '-')}</small>` : ''}</td>
    <td class="small" style="max-width:340px;white-space:normal">${esc(permLabel(u))}</td>
    <td><span class="badge ${u.active === false ? 'badge-muted' : 'badge-ok'}">${u.active === false ? 'Nonaktif' : 'Aktif'}</span></td>
    <td class="small">${esc(fmtDate(u.lastLogin, true) || '-')}</td>
    <td class="actions-col">${isSuper() ? `<button class="icon-btn" data-bdg="${u.uid}" title="Atur badge">${ic('star')}</button>` : ''}${editable(u) ? `<button class="icon-btn" data-ed="${u.uid}" title="Atur hak akses">${ic('edit')}</button><button class="icon-btn" data-rs="${u.uid}" title="Kirim reset password">${ic('lock')}</button><button class="icon-btn ${u.active === false ? '' : 'danger'}" data-tg="${u.uid}" title="${u.active === false ? 'Aktifkan' : 'Nonaktifkan'}">${ic(u.active === false ? 'check' : 'out')}</button><button class="icon-btn danger" data-rm="${u.uid}" title="Hapus akses">${ic('trash')}</button>` : ''}</td>
  </tr>`).join('')}${usersCache.some((u) => u.role !== 'superadmin') ? '' : `<tr><td colspan="6"><div class="empty">Belum ada akun. Klik <b>Tambah Admin</b> atau <b>Tambah Akun Kepala Dusun</b>.</div></td></tr>`}</tbody></table></div>`;
  $('#usr-new')?.addEventListener('click', () => adminForm(null, main, { role: 'admin' }));
  $('#usr-kadus')?.addEventListener('click', () => adminForm(null, main, { role: 'kadus' }));
  $$('[data-ed]', main).forEach((b) => b.onclick = () => adminForm(usersCache.find((u) => u.uid === b.dataset.ed), main));
  $$('[data-bdg]', main).forEach((b) => b.onclick = async () => {
    const u = usersCache.find((x) => x.uid === b.dataset.bdg);
    const next = await badgeDialog(u); if (!next) return;
    try {
      await F.updateDoc(C(`users/${u.uid}`), { badges: next, updatedAt: F.serverTimestamp(), updatedBy: state.user.email });
      const before = normBadges(u.badges).map((x) => x.id), after = next.map((x) => x.id);
      const added = after.filter((x) => !before.includes(x)).map((x) => BADGES[x].label), removed = before.filter((x) => !after.includes(x)).map((x) => BADGES[x].label);
      logAudit('admin', 'badge', `Mengubah badge ${u.email}`, { target: u.email, targetId: u.uid, detail: [added.length && `Ditambah: ${added.join(', ')}`, removed.length && `Dicabut: ${removed.join(', ')}`].filter(Boolean).join(' • ') });
      toast('Badge disimpan', 'success'); viewAdmins(main);
    } catch (e) { toast('Gagal: ' + e.message, 'error'); }
  });
  $$('[data-rs]', main).forEach((b) => b.onclick = async () => {
    const u = usersCache.find((x) => x.uid === b.dataset.rs);
    try { await F.sendPasswordResetEmail(F.auth, u.email); logAudit('admin', 'reset_password', `Mengirim tautan reset password ke ${u.email}`, { target: u.email, targetId: u.uid }); toast(`Tautan reset password dikirim ke ${u.email}`, 'success'); }
    catch (e) { toast(authErrorMessage(e), 'error'); }
  });
  $$('[data-tg]', main).forEach((b) => b.onclick = async () => {
    const u = usersCache.find((x) => x.uid === b.dataset.tg); const act = u.active === false;
    if (!await confirmDialog(`${act ? 'Aktifkan' : 'Nonaktifkan'} akun ${u.email}?${act ? '' : ' Pengguna akan langsung dikeluarkan dari dashboard.'}`, { danger: !act, okText: act ? 'Aktifkan' : 'Nonaktifkan' })) return;
    await F.updateDoc(C(`users/${u.uid}`), { active: act, updatedAt: F.serverTimestamp(), updatedBy: state.user.email });
    logAudit('admin', act ? 'aktifkan' : 'nonaktifkan', `${act ? 'Mengaktifkan' : 'Menonaktifkan'} ${ROLE_LABEL[u.role]} ${u.email}`, { target: u.email, targetId: u.uid });
    viewAdmins(main);
  });
  $$('[data-rm]', main).forEach((b) => b.onclick = async () => {
    const u = usersCache.find((x) => x.uid === b.dataset.rm);
    if (!await confirmDialog(`Hapus akses dashboard untuk ${u.email}? Akun login tetap ada di Firebase Authentication namun tidak bisa masuk dashboard.`, { danger: true, okText: 'Hapus akses' })) return;
    if (!await requirePassword(`Menghapus akses ${ROLE_LABEL[u.role]} ${u.email}.`)) return;
    await F.deleteDoc(C(`users/${u.uid}`));
    logAudit('admin', 'hapus', `Menghapus akses ${ROLE_LABEL[u.role]} ${u.email}`, { target: u.email, targetId: u.uid });
    toast('Akses dihapus', 'success'); viewAdmins(main);
  });
}
function adminForm(u, main, preset = {}) {
  const role = u?.role || preset.role || 'admin';
  if (role === 'admin' && !isSuper()) return toast('Hanya Super Admin yang dapat mengelola akun Admin', 'error');
  const isK = role === 'kadus';
  const list = isK ? KADUS_PERMS.map(([k, l]) => [k, l, 'Kepala Dusun']) : PERMS;
  const perms = u?.perms || (isK ? Object.fromEntries(KADUS_DEFAULT.map((k) => [k, true])) : {});
  const groups = [...new Set(list.map((p) => p[2]))];
  const dsn = u?.dusun || preset.dusun || '';
  const dRec = state.dusun.find((d) => d.nama === dsn);
  const m = modal({
    title: u ? `Hak Akses — ${u.email}` : isK ? 'Buat Akun Kepala Dusun' : 'Daftarkan Admin Baru', size: 'lg',
    body: `<form id="usr-form" class="form-grid">
      ${isK ? `<label class="field span-2"><span>Dusun yang dikelola *</span><select name="dusun" required><option value="">— pilih dusun —</option>${state.dusun.map((d) => `<option ${d.nama === dsn ? 'selected' : ''}>${esc(d.nama)}</option>`).join('')}</select></label>` : ''}
      <label class="field"><span>Nama lengkap *</span><input name="nama" required value="${esc(u?.nama || (isK ? dRec?.kepalaNama || '' : ''))}"></label>
      ${isK ? `<label class="field"><span>No. HP / WhatsApp</span><input name="hp" type="tel" value="${esc(u?.hp || dRec?.kepalaHp || '')}" placeholder="08…"></label>` : `<label class="field"><span>Jabatan</span><input name="jabatan" value="${esc(u?.jabatan || '')}" placeholder="mis. Operator Gampong"></label>`}
      ${u ? '' : `<label class="field"><span>Email login *</span><input name="email" type="email" required></label>
      <label class="field"><span>Password awal * (min. 8, huruf & angka)</span><div class="input-group"><input name="pw" type="text" required minlength="8"><button type="button" class="btn btn-ghost" id="usr-gen">Acak</button></div></label>`}
      ${isK ? '' : `<div class="field span-2"><span>Template hak akses</span><div class="chips">${Object.entries(PERM_PRESETS).map(([k, p]) => `<button type="button" class="chip" data-preset="${k}">${esc(p.label)}</button>`).join('')}<button type="button" class="chip" data-preset="none">Kosongkan</button></div></div>`}
      ${!isK && isSuper() ? `<div class="field span-2"><span>Pengelola lembaga (opsional) — admin hanya dapat mengubah lembaga yang dicentang, tanpa hak akses lain</span><div class="col-picker">${KATEGORI.filter((k) => LEMBAGA_DELEGASI.includes(k.key)).map((k) => `<div><b>${esc(k.short)}</b>${state.lembaga.filter((l) => l.kategori === k.key).map((l) => `<label class="check"><input type="checkbox" name="lg" value="${esc(l.id)}" ${(u?.lembagaIds || preset.lembagaIds || []).includes(l.id) ? 'checked' : ''}> ${esc(l.singkatan || l.nama)}</label>`).join('') || '<small class="muted">Belum ada lembaga</small>'}</div>`).join('')}</div></div>` : ''}
      <div class="span-2 col-picker">${groups.map((g) => `<div><b>${esc(g)}</b>${list.filter((p) => p[2] === g).map(([k, l]) => `<label class="check"><input type="checkbox" name="perm" value="${k}" ${perms[k] ? 'checked' : ''}> ${esc(l)}</label>`).join('')}</div>`).join('')}</div>
      <p class="muted small span-2">${isK ? 'Kepala Dusun hanya dapat melihat & mengelola warga di dusunnya sendiri. Batasan ini dikunci oleh Firestore Rules.' : 'Fitur khusus Super Admin (Audit Log, Cadangan & Pemulihan, akun Admin) tidak dapat diberikan ke admin.'}</p>
    </form>`,
    footer: `<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" id="usr-ok">${u ? 'Simpan' : 'Daftarkan'}</button>`,
  });
  const f = $('#usr-form', m.el);
  f.elements.dusun?.addEventListener('change', () => { const d = state.dusun.find((x) => x.nama === f.elements.dusun.value); if (d && !f.elements.nama.value) f.elements.nama.value = d.kepalaNama || ''; if (d && !f.elements.hp.value) f.elements.hp.value = d.kepalaHp || ''; });
  $$('[data-preset]', m.el).forEach((b) => b.onclick = () => { const p = PERM_PRESETS[b.dataset.preset]?.perms || []; $$('input[name=perm]', f).forEach((c) => c.checked = p.includes(c.value)); });
  $('#usr-gen', m.el)?.addEventListener('click', () => { const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const arr = crypto.getRandomValues(new Uint32Array(12)); f.elements.pw.value = Array.from(arr, (n) => a[n % a.length]).join('') + '7'; });
  $('#usr-ok', m.el).onclick = async () => {
    const nama = f.elements.nama.value.trim();
    const dusun = isK ? f.elements.dusun.value : '';
    const newPerms = Object.fromEntries(list.map(([k]) => [k, $$('input[name=perm]', f).some((c) => c.checked && c.value === k)]));
    if (!nama) return toast('Nama wajib diisi', 'error');
    if (isK && !dusun) return toast('Pilih dusun yang dikelola', 'error');
    const btn = $('#usr-ok', m.el);
    const lembagaIds = !isK && isSuper() ? $$('input[name=lg]:checked', f).map((c) => c.value) : undefined;
    const base = { nama, perms: newPerms, ...(lembagaIds ? { lembagaIds } : {}), ...(isK ? { dusun, dusunId: state.dusun.find((d) => d.nama === dusun)?.id || '', hp: f.elements.hp.value.trim(), jabatan: `Kepala Dusun ${dusun}` } : { jabatan: f.elements.jabatan.value.trim() }) };
    try {
      if (u) {
        btn.disabled = true;
        await F.updateDoc(C(`users/${u.uid}`), { ...base, updatedAt: F.serverTimestamp(), updatedBy: state.user.email });
        const changes = {}; list.forEach(([k, l]) => { if (!!perms[k] !== newPerms[k]) changes[l] = [perms[k] ? 'Ya' : 'Tidak', newPerms[k] ? 'Ya' : 'Tidak']; });
        if (isK && u.dusun !== dusun) changes.Dusun = [u.dusun || '', dusun];
        logAudit('admin', 'ubah_akses', `Mengubah hak akses ${ROLE_LABEL[role]} ${u.email}`, { target: u.email, targetId: u.uid, changes });
      } else {
        const email = f.elements.email.value.trim().toLowerCase(), pw = f.elements.pw.value;
        if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Email tidak valid', 'error');
        if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return toast('Password minimal 8 karakter, berisi huruf & angka', 'error');
        if (norm(email) === norm(superEmail())) return toast('Email ini milik Super Admin', 'error');
        if (!await requirePassword(`Mendaftarkan ${ROLE_LABEL[role]} baru ${email}.`)) return;
        btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span> Mendaftarkan…';
        const uid = await F.createAuthUser(email, pw);
        await F.setDoc(C(`users/${uid}`), { email, ...base, role, active: true, createdAt: F.serverTimestamp(), createdBy: state.user.email });
        logAudit('admin', 'daftar', `Mendaftarkan ${ROLE_LABEL[role]} baru ${email}${isK ? ` (Dusun ${dusun})` : ''}`, { target: email, targetId: uid, detail: 'Hak akses: ' + list.filter(([k]) => newPerms[k]).map((p) => p[1]).join(', ') });
        modal({ title: `${ROLE_LABEL[role]} terdaftar`, size: 'sm', body: `<p>Sampaikan data login ini kepada <b>${esc(nama)}</b> secara pribadi:</p><dl class="detail"><dt>Alamat</dt><dd>${esc(location.origin + location.pathname)}#/login</dd><dt>Email</dt><dd>${esc(email)}</dd><dt>Password</dt><dd><code>${esc(pw)}</code></dd>${isK ? `<dt>Dusun</dt><dd>${esc(dusun)}</dd>` : ''}</dl><p class="muted small">Minta pengguna segera mengganti password di menu Pengaturan → Akun Saya.</p>`, footer: '<button class="btn btn-primary" data-close>Selesai</button>' });
      }
      m.close(); viewAdmins(main);
    } catch (e) {
      btn.disabled = false; btn.textContent = u ? 'Simpan' : 'Daftarkan';
      toast(e.code === 'auth/email-already-in-use' ? 'Email sudah terdaftar di Firebase Authentication. Gunakan email lain, atau hapus akunnya di Firebase Console lalu daftarkan ulang.' : e.code === 'auth/admin-restricted-operation' || e.code === 'auth/operation-not-allowed' ? 'Pendaftaran akun dimatikan di Firebase Console (Authentication → Settings → User actions → Enable create). Aktifkan agar bisa mendaftarkan akun.' : 'Gagal: ' + (e.message || e), 'error', { duration: 10000 });
    }
  };
}

// ---------------------------------------------------------------- Audit Log
const auditState = { rows: [], last: null, done: false, f: { q: '', user: '', cat: '', from: '', to: '' } };
export function viewAudit(main) {
  state.view = 'form';
  main.innerHTML = loadingBox();
  auditState.rows = []; auditState.last = null; auditState.done = false;
  loadAudit().then(() => drawAudit(main)).catch((e) => { main.innerHTML = emptyBox('Gagal memuat audit log: ' + e.message); });
}
async function loadAudit() {
  const parts = [F.collection(F.db, 'audit'), F.orderBy('at', 'desc')];
  if (auditState.last) parts.push(F.startAfter(auditState.last));
  parts.push(F.limit(500));
  const s = await F.getDocs(F.query(...parts));
  auditState.rows.push(...s.docs.map((d) => ({ id: d.id, ...d.data() })));
  auditState.last = s.docs[s.docs.length - 1] || auditState.last;
  if (s.docs.length < 500) auditState.done = true;
}
function filteredAudit() {
  const f = auditState.f; const q = norm(f.q);
  const from = f.from ? new Date(f.from + 'T00:00:00').getTime() : 0, to = f.to ? new Date(f.to + 'T23:59:59').getTime() : Infinity;
  return auditState.rows.filter((r) => {
    const t = toDate(r.at)?.getTime() || 0;
    if (t < from || t > to) return false;
    if (f.user && r.email !== f.user) return false;
    if (f.cat && r.cat !== f.cat) return false;
    if (q && !norm([r.label, r.target, r.detail, r.email, r.nama, r.action].join(' ')).includes(q)) return false;
    return true;
  });
}
function drawAudit(main) {
  const users = [...new Set(auditState.rows.map((r) => r.email).filter(Boolean))];
  const f = auditState.f;
  const day = Date.now() - 864e5, week = Date.now() - 7 * 864e5;
  const r24 = auditState.rows.filter((r) => (toDate(r.at)?.getTime() || 0) > day);
  const logins = auditState.rows.filter((r) => r.action === 'login' && (toDate(r.at)?.getTime() || 0) > week).length;
  const fails = auditState.rows.filter((r) => /gagal|ditolak/.test(r.action) && (toDate(r.at)?.getTime() || 0) > week).length;
  const exp = auditState.rows.filter((r) => r.cat === 'export' && (toDate(r.at)?.getTime() || 0) > week).length;
  main.innerHTML = `
  <div class="stat-grid">
    <div class="stat"><span class="stat-ic">${ic('log')}</span><div><span class="stat-label">Aktivitas 24 jam</span><b class="stat-val">${fmtNum(r24.length)}</b><small class="muted">${fmtNum(auditState.rows.length)} catatan dimuat</small></div></div>
    <div class="stat"><span class="stat-ic">${ic('lock')}</span><div><span class="stat-label">Login 7 hari</span><b class="stat-val">${fmtNum(logins)}</b><small class="muted">${users.length} pengguna aktif tercatat</small></div></div>
    <div class="stat"><span class="stat-ic">${ic('shield')}</span><div><span class="stat-label">Gagal / ditolak 7 hari</span><b class="stat-val">${fmtNum(fails)}</b><small class="muted">password salah, akses ditolak</small></div></div>
    <div class="stat"><span class="stat-ic">${ic('download')}</span><div><span class="stat-label">Ekspor data 7 hari</span><b class="stat-val">${fmtNum(exp)}</b><small class="muted">PDF & Excel</small></div></div>
  </div>
  <div class="toolbar">
    <div class="search">${ic('search')}<input id="au-q" placeholder="Cari aktivitas, nama warga, email…" value="${esc(f.q)}"></div>
    <select id="au-user"><option value="">Semua pengguna</option>${users.map((u) => `<option ${f.user === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
    <select id="au-cat"><option value="">Semua kategori</option>${Object.entries(AUDIT_CATS).map(([k, l]) => `<option value="${k}" ${f.cat === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
    <input type="date" id="au-from" value="${esc(f.from)}" title="Dari tanggal"><input type="date" id="au-to" value="${esc(f.to)}" title="Sampai tanggal">
  </div>
  <div class="toolbar toolbar-actions"><button class="btn btn-ghost btn-sm" id="au-ref">${ic('refresh')} Muat ulang</button><button class="btn btn-ghost btn-sm" id="au-xls">${ic('download')} Excel</button><button class="btn btn-ghost btn-sm" id="au-pdf">${ic('file')} PDF</button><span class="spacer"></span><span class="muted small" id="au-count"></span></div>
  <div id="au-table"></div>
  ${auditState.done ? '' : '<div class="pager"><button class="btn btn-ghost btn-sm" id="au-more">Muat 500 catatan berikutnya</button></div>'}
  <p class="muted small">Audit log bersifat permanen: tidak dapat diubah atau dihapus oleh siapa pun dari aplikasi (dikunci oleh Firestore Rules).</p>`;
  const draw = () => {
    const rows = filteredAudit();
    $('#au-count').textContent = `${fmtNum(rows.length)} aktivitas`;
    $('#au-table').innerHTML = `<div class="table-wrap"><table class="table audit"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Kategori</th><th>Aktivitas</th><th>Perangkat</th></tr></thead><tbody>${rows.slice(0, 600).map((r) => `<tr data-au="${r.id}" class="${/gagal|ditolak|hapus|nonaktif|pulih|kosongkan/.test(r.action) ? 'au-warn' : ''}">
      <td class="small nowrap">${esc(fmtDate(r.at, true))}</td>
      <td class="small"><b>${esc(r.nama || '-')}</b><br><span class="muted">${esc(r.email)}</span> <span class="badge ${r.role === 'superadmin' ? 'badge-warn' : ''}">${esc(ROLE_LABEL[r.role] || r.role || '')}</span></td>
      <td><span class="badge badge-muted">${esc(AUDIT_CATS[r.cat] || r.cat)}</span></td>
      <td>${esc(r.label)}${r.target ? `<br><small class="muted">${esc(String(r.target).slice(0, 120))}</small>` : ''}${r.changes ? `<br><small class="muted">${Object.keys(r.changes).length} perubahan field</small>` : ''}</td>
      <td class="small muted">${esc(r.device || '')}</td></tr>`).join('') || `<tr><td colspan="5">${emptyBox('Tidak ada aktivitas sesuai saringan')}</td></tr>`}</tbody></table></div>${rows.length > 600 ? '<p class="muted small">Menampilkan 600 teratas — persempit saringan atau ekspor untuk semua.</p>' : ''}`;
    $$('[data-au]').forEach((tr) => tr.onclick = () => auditDetail(auditState.rows.find((x) => x.id === tr.dataset.au)));
  };
  const upd = (k, v) => { f[k] = v; draw(); };
  $('#au-q').oninput = debounce((e) => upd('q', e.target.value), 200);
  $('#au-user').onchange = (e) => upd('user', e.target.value);
  $('#au-cat').onchange = (e) => upd('cat', e.target.value);
  $('#au-from').onchange = (e) => upd('from', e.target.value);
  $('#au-to').onchange = (e) => upd('to', e.target.value);
  $('#au-ref').onclick = () => viewAudit(main);
  $('#au-more')?.addEventListener('click', async () => { await loadAudit(); drawAudit(main); });
  const head = ['Waktu', 'Nama', 'Email', 'Peran', 'Kategori', 'Aktivitas', 'Objek', 'Rincian', 'Perubahan', 'Perangkat', 'Sesi'];
  const body = () => filteredAudit().map((r) => [fmtDate(r.at, true), r.nama || '', r.email || '', ROLE_LABEL[r.role] || r.role || '', AUDIT_CATS[r.cat] || r.cat, r.label, r.target || '', r.detail || '', r.changes ? Object.entries(r.changes).map(([k, [a, b]]) => `${k}: ${a} → ${b}`).join('; ') : '', r.device || '', r.session || '']);
  $('#au-xls').onclick = () => { logAudit('export', 'audit_xls', 'Mengekspor audit log (Excel)'); exportExcel(`Audit_Log_${todayISO()}`, [{ name: 'Audit Log', title: 'Audit Log Aktivitas', head, body: body() }]); };
  $('#au-pdf').onclick = () => { logAudit('export', 'audit_pdf', 'Mengekspor audit log (PDF)'); exportPdf({ filename: `Audit_Log_${todayISO()}`, title: 'Audit Log Aktivitas', subtitle: `${filteredAudit().length} aktivitas`, sections: [{ head: ['Waktu', 'Pengguna', 'Kategori', 'Aktivitas', 'Objek', 'Perangkat'], body: filteredAudit().map((r) => [fmtDate(r.at, true), `${r.nama || ''} (${r.email})`, AUDIT_CATS[r.cat] || r.cat, r.label, String(r.target || '').slice(0, 80), r.device || '']) }] }); };
  draw();
}
function auditDetail(r) {
  if (!r) return;
  modal({
    title: 'Detail Aktivitas', size: 'lg',
    body: `<dl class="detail"><dt>Waktu</dt><dd>${esc(fmtDate(r.at, true))}</dd><dt>Pengguna</dt><dd>${esc(r.nama || '')} — ${esc(r.email)} (${esc(ROLE_LABEL[r.role] || r.role || '')})</dd><dt>Kategori</dt><dd>${esc(AUDIT_CATS[r.cat] || r.cat)}</dd><dt>Kode aksi</dt><dd><code>${esc(r.action)}</code></dd><dt>Aktivitas</dt><dd>${esc(r.label)}</dd>${r.target ? `<dt>Objek</dt><dd>${esc(r.target)}</dd>` : ''}${r.count != null ? `<dt>Jumlah</dt><dd>${esc(r.count)}</dd>` : ''}${r.detail ? `<dt>Rincian</dt><dd style="white-space:pre-wrap">${esc(r.detail)}</dd>` : ''}<dt>Perangkat</dt><dd>${esc(r.device || '')}</dd><dt>Halaman</dt><dd><code>${esc(r.path || '')}</code></dd><dt>ID sesi</dt><dd><code>${esc(r.session || '')}</code></dd><dt>ID log</dt><dd><code>${esc(r.id)}</code></dd></dl>
      ${r.changes ? `<h4 class="detail-h">Perubahan Data</h4><div class="table-wrap"><table class="table small"><thead><tr><th>Field</th><th>Sebelum</th><th>Sesudah</th></tr></thead><tbody>${Object.entries(r.changes).map(([k, [a, b]]) => `<tr><td>${esc(k)}</td><td class="diff-old">${esc(a)}</td><td class="diff-new">${esc(b)}</td></tr>`).join('')}</tbody></table></div>` : ''}`,
  });
}

// ---------------------------------------------------------------- Cadangan & Pemulihan
// v2.4: cadangan benar-benar LENGKAP — dari data dasbor sampai audit log.
// (Bug v2.3: koleksi config dibaca dengan "list" yang ditolak Rules sehingga cadangan selalu gagal.)
const BACKUP_COLS = ['warga', 'dusun', 'master', 'informasi', 'instagram', 'halaman', 'kegiatan', 'lembaga', 'lembagaPrivate', 'dokumen', 'users', 'private', 'sistem', 'usage', 'hapus'];
const BACKUP_DOCS = { config: ['app', 'stats', 'auth'], meta: ['pub', 'adm'], analytics: ['summary'] };
// Koleksi yang hanya diarsipkan (tidak dapat dipulihkan karena dikunci Rules: hanya-tambah / penghitung)
const ARCHIVE_ONLY = ['audit', 'usage', 'analytics', 'hapus', 'meta'];
const COL_LABEL = { warga: 'Data warga', dusun: 'Dusun & kepala dusun', master: 'Data master dropdown', informasi: 'Papan informasi', instagram: 'Postingan Instagram', halaman: 'Halaman Profil Gampong', kegiatan: 'Kegiatan rutin', lembaga: 'Lembaga gampong (profil, pengurus, berita, galeri)', lembagaPrivate: 'Anggota & murid/santri lembaga', dokumen: 'Dokumen publik', users: 'Akun & hak akses', private: 'Token integrasi (Instagram)', sistem: 'Pengaturan sistem', usage: 'Riwayat pemakaian Firestore', hapus: 'Catatan sinkron hapus', config: 'Pengaturan desa, statistik & tema', meta: 'Versi sinkron', analytics: 'Analitik kunjungan', audit: 'Audit log' };
const sistemRef = () => C('sistem/backup');
async function readAll(col, onProg) {
  if (col === 'audit') {
    const out = []; let last = null;
    for (;;) {
      const parts = [F.collection(F.db, 'audit'), F.orderBy('at', 'desc')]; if (last) parts.push(F.startAfter(last)); parts.push(F.limit(1000));
      const s = await F.getDocs(F.query(...parts));
      out.push(...s.docs.map((d) => ({ id: d.id, ...d.data() }))); onProg?.(out.length);
      if (s.docs.length < 1000) break; last = s.docs[s.docs.length - 1];
    }
    return out;
  }
  const s = await F.getDocs(F.collection(F.db, col));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function makeBackup(onStep) {
  const dump = { app: APP.name, version: APP.version, build: APP.build, format: 'serenity-backup-v3', exportedAt: new Date().toISOString(), exportedBy: state.user.email, credit: APP.exportCredit, counts: {}, skipped: {} };
  const all = [...BACKUP_COLS, ...Object.keys(BACKUP_DOCS), 'audit'];
  let i = 0;
  for (const col of all) {
    onStep?.(col, ++i, all.length);
    try {
      if (BACKUP_DOCS[col]) {
        dump[col] = [];
        for (const id of BACKUP_DOCS[col]) { const s = await F.getDoc(C(`${col}/${id}`)); if (s.exists()) dump[col].push({ id, ...s.data() }); }
      } else dump[col] = await readAll(col, (n) => onStep?.(col, i, all.length, n));
      dump.counts[col] = dump[col].length;
    } catch (e) { dump[col] = []; dump.skipped[col] = e.code || e.message; }
  }
  return dump;
}
export function viewCadangan(main) {
  state.view = 'form';
  main.innerHTML = loadingBox();
  F.getDoc(sistemRef()).then((s) => s.data() || {}).catch(() => ({})).then((info) => drawCadangan(main, info));
}
function drawCadangan(main, info) {
  const last = toDate(info.lastAt);
  const days = last ? Math.floor((Date.now() - last.getTime()) / 864e5) : null;
  main.innerHTML = `
  <div class="callout ${days == null || days > 31 ? '' : 'ok'}">${ic(days == null || days > 31 ? 'bell' : 'check')}<div><b>${last ? `Cadangan terakhir: ${esc(fmtDate(last, true))}` : 'Belum pernah mencadangkan dari aplikasi'}</b><p>${last ? `${days === 0 ? 'Hari ini' : `${days} hari lalu`} oleh ${esc(info.lastBy || '-')} • ${fmtNum(info.lastDocs || 0)} dokumen.` : 'Unduh cadangan sekarang dan simpan di tempat aman.'} Pengingat otomatis muncul setiap <b>tanggal 29</b> (Februari non-kabisat: tanggal 28).</p></div></div>
  <div class="panel-grid two">
    <div class="panel"><h3>${ic('download')} Unduh Cadangan Lengkap</h3>
      <p class="muted small">Seluruh isi website dalam satu berkas JSON: data warga, dusun, data master, informasi, Instagram, profil gampong, kegiatan, <b>lembaga beserta anggota & murid/santri</b>, dokumen publik, <b>akun & hak akses</b>, pengaturan, tema, statistik, analitik, sampai <b>audit log</b>. Berkas berisi data pribadi warga — simpan di tempat aman.</p>
      <button class="btn btn-primary" id="bk">${ic('download')} Unduh Cadangan JSON</button><div id="bk-prog"></div></div>
    <div class="panel"><h3>${ic('upload')} Pulihkan dari Cadangan</h3>
      <p class="muted small">Upload berkas JSON hasil “Unduh Cadangan”. Anda dapat memilih koleksi yang dipulihkan dan cara pemulihannya. Audit log & riwayat pemakaian hanya diarsipkan (tidak ditimpa).</p>
      <label class="dropzone" id="rs-dz"><input type="file" id="rs-file" accept=".json,application/json" hidden>${ic('upload')}<b>Pilih berkas cadangan (.json)</b><span class="muted small">Tidak ada yang ditulis sebelum Anda mengonfirmasi.</span></label>
      <div id="rs-step"></div></div>
  </div>
  <div class="panel"><h3>${ic('bell')} Pengingat Cadangan Bulanan</h3>
    <label class="check"><input type="checkbox" id="bk-rem" ${info.pengingat === false ? '' : 'checked'}> Ingatkan Super Admin untuk mencadangkan data setiap tanggal 29</label>
    <div class="row-gap"><button class="btn btn-ghost btn-sm" id="bk-notif">${ic('bell')} ${'Notification' in window && Notification.permission === 'granted' ? 'Notifikasi browser aktif' : 'Izinkan notifikasi browser'}</button><button class="btn btn-ghost btn-sm" id="bk-test">Coba tampilkan pengingat</button></div>
    <p class="muted small">Pengingat tampil sebagai jendela pemberitahuan, notifikasi browser (bila diizinkan), dan titik merah pada menu Cadangan & Pemulihan. Hanya Super Admin yang menerimanya.</p></div>
  <div class="panel"><h3 class="danger-text">${ic('trash')} Zona Berbahaya</h3>
    <p class="muted small">Menghapus seluruh data warga secara permanen. Unduh cadangan terlebih dahulu.</p>
    <button class="btn btn-danger btn-ghost" id="wipe">${ic('trash')} Hapus semua data warga</button><div id="wipe-res"></div></div>`;
  $('#bk').onclick = async (e) => {
    const b = e.currentTarget; b.disabled = true; const prog = $('#bk-prog');
    prog.innerHTML = '<div class="progress"><span style="width:0%"></span></div><p class="muted small" id="bk-t">Menyiapkan…</p>';
    try {
      const dump = await makeBackup((col, i, n, docs) => { $('.progress span', prog).style.width = `${(i / n) * 100}%`; $('#bk-t').textContent = `Mencadangkan ${COL_LABEL[col] || col}${docs ? ` (${fmtNum(docs)})` : ''}… ${i}/${n}`; });
      const total = Object.values(dump.counts).reduce((a, n) => a + n, 0);
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `cadangan-serenity-${todayISO()}.json`);
      logAudit('cadangan', 'unduh', 'Mengunduh cadangan data lengkap (JSON)', { count: total, detail: Object.entries(dump.counts).map(([c, n]) => `${c}: ${n}`).join(', ').slice(0, 900) });
      const meta = { lastAt: F.serverTimestamp(), lastBy: state.user.email, lastDocs: total, lastSize: blob.size };
      await F.setDoc(sistemRef(), meta, { merge: true }).catch(() => {});
      const sk = Object.keys(dump.skipped);
      prog.innerHTML = `<div class="callout ${sk.length ? '' : 'ok'}">${ic(sk.length ? 'bulb' : 'check')}<div><b>Cadangan berhasil diunduh</b><p>${fmtNum(total)} dokumen dari ${Object.keys(dump.counts).length} koleksi • ${(blob.size / 1048576).toFixed(2).replace('.', ',')} MB.${sk.length ? ` Dilewati (tidak ada izin/indeks): ${esc(sk.join(', '))}.` : ''}</p></div></div>`;
      $('#nav-dot-cadangan')?.setAttribute('hidden', '');
      toast('Cadangan lengkap berhasil diunduh', 'success');
    } catch (err) { prog.innerHTML = `<p class="err">Gagal membuat cadangan: ${esc(err.message)}</p>`; toast('Gagal membuat cadangan: ' + err.message, 'error'); }
    b.disabled = false;
  };
  $('#bk-rem').onchange = async (e) => { try { await F.setDoc(sistemRef(), { pengingat: e.target.checked }, { merge: true }); logAudit('cadangan', 'pengingat', `${e.target.checked ? 'Mengaktifkan' : 'Menonaktifkan'} pengingat cadangan bulanan`); toast('Pengaturan pengingat disimpan', 'success'); } catch (err) { toast(err.message, 'error'); } };
  $('#bk-notif').onclick = async () => { if (!('Notification' in window)) return toast('Browser ini tidak mendukung notifikasi', 'error'); const p = await Notification.requestPermission(); toast(p === 'granted' ? 'Notifikasi browser diizinkan' : 'Notifikasi tidak diizinkan', p === 'granted' ? 'success' : 'info'); };
  $('#bk-test').onclick = () => showBackupReminder(info, true);
  const dz = $('#rs-dz'), fi = $('#rs-file');
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) readBackup(e.dataTransfer.files[0]); });
  fi.onchange = () => fi.files[0] && readBackup(fi.files[0]);
  $('#wipe').onclick = async () => {
    const n = state.warga.length;
    if (!n) return toast('Tidak ada data warga untuk dihapus', 'info');
    const t = await promptDialog('Hapus semua data warga', `Ketik HAPUS untuk menghapus ${n} data warga secara permanen`, '', { okText: 'Lanjut' });
    if (t !== 'HAPUS') { if (t != null) toast('Dibatalkan — teks konfirmasi tidak sesuai', 'info'); return; }
    if (!await requirePassword(`Menghapus permanen ${n} data warga.`)) return;
    const res = $('#wipe-res'); res.innerHTML = '<div class="progress"><span style="width:0%"></span></div><p class="muted small" id="wp-t">Menghapus…</p>';
    try {
      await batchWrite(state.warga.map((w) => ['delete', C(`warga/${w.id}`)]), (d, tot) => { $('.progress span', res).style.width = `${(d / tot) * 100}%`; $('#wp-t').textContent = `${fmtNum(d)} / ${fmtNum(tot)} data dihapus`; });
      logAudit('cadangan', 'kosongkan_warga', `Menghapus SEMUA data warga (${n})`, { count: n });
      res.innerHTML = `<div class="callout ok">${ic('check')}<div><b>Berhasil — semua data warga telah dihapus</b><p>${fmtNum(n)} data warga dihapus permanen pada ${esc(fmtDate(new Date(), true))}. Aktivitas ini tercatat di Audit Log.</p></div></div>`;
      toast(`Berhasil: ${fmtNum(n)} data warga dihapus`, 'success', { duration: 8000 });
      modal({ title: 'Penghapusan selesai', size: 'sm', guard: false, body: `<div class="callout ok">${ic('check')}<div><b>Semua data warga berhasil dihapus</b><p>${fmtNum(n)} data warga telah dihapus secara permanen. Untuk mengembalikan, gunakan “Pulihkan dari Cadangan”.</p></div></div>`, footer: '<button class="btn btn-primary" data-close>Selesai</button>' });
    } catch (e) { res.innerHTML = `<p class="err">Gagal menghapus: ${esc(e.message)}</p>`; toast(e.message, 'error'); }
  };
}

// ---------------------------------------------------------------- Pengingat cadangan tanggal 29 (khusus Super Admin)
const reminderDay = (d) => (d.getMonth() === 1 && new Date(d.getFullYear(), 2, 0).getDate() < 29 ? 28 : 29);
export async function checkBackupReminder() {
  if (!isSuper()) return;
  let info = {};
  try { info = (await F.getDoc(sistemRef())).data() || {}; } catch { return; }
  if (info.pengingat === false) return;
  const now = new Date(Date.now() + (7 * 60 + new Date().getTimezoneOffset()) * 60e3); // waktu WIB
  const isDay = now.getDate() === reminderDay(now);
  const last = toDate(info.lastAt);
  const doneToday = last && new Date(last.getTime() + (7 * 60 + new Date().getTimezoneOffset()) * 60e3).toDateString() === now.toDateString();
  const overdue = !last || Date.now() - last.getTime() > 35 * 864e5;
  if ((isDay && !doneToday) || overdue) document.getElementById('nav-dot-cadangan')?.removeAttribute('hidden');
  if (!isDay || doneToday) return;
  const k = `dd:bkrem:${now.toDateString()}`;
  try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch { /* */ }
  showBackupReminder(info);
}
function showBackupReminder(info, test = false) {
  const last = toDate(info.lastAt);
  const msg = `Hari ini tanggal ${reminderDay(new Date())} — waktunya mencadangkan seluruh data website.${last ? ` Cadangan terakhir ${fmtDate(last, true)}.` : ' Belum ada cadangan yang tercatat.'}`;
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const opt = { body: msg, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'serenity-backup', requireInteraction: true };
      if (state.swReg?.showNotification) state.swReg.showNotification('Pengingat Cadangan Data', opt); else new Notification('Pengingat Cadangan Data', opt);
    }
  } catch { /* */ }
  const m = modal({ title: 'Pengingat Cadangan Data', size: 'sm', guard: false,
    body: `<div class="reminder">${ic('bell')}<div><b>Waktunya mencadangkan data${test ? ' (uji coba)' : ''}</b><p>${esc(msg)}</p><p class="muted small">Cadangan berisi seluruh isi website dari dasbor hingga audit log. Simpan berkas di tempat aman (misalnya Google Drive pribadi).</p></div></div>`,
    footer: '<button class="btn btn-ghost" data-close>Ingatkan nanti</button><button class="btn btn-primary" id="rem-go">Buka Cadangan & Pemulihan</button>' });
  $('#rem-go', m.el).onclick = () => { m.close(); location.hash = '#/admin/cadangan'; };
  if (!test) logAudit('cadangan', 'pengingat_tampil', 'Pengingat cadangan bulanan ditampilkan');
}
// Ubah {seconds, nanoseconds} (hasil JSON dari Timestamp) kembali menjadi Timestamp Firestore
function revive(v) {
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.includes('seconds') && keys.includes('nanoseconds') && keys.length <= 3) return new F.Timestamp(Number(v.seconds), Number(v.nanoseconds));
    const o = {}; for (const [k, x] of Object.entries(v)) o[k] = revive(x); return o;
  }
  return v;
}
async function readBackup(file) {
  const step = $('#rs-step');
  let data;
  try { data = JSON.parse(await file.text()); } catch { step.innerHTML = `<p class="err">Berkas bukan JSON yang valid.</p>`; return; }
  track('ul', 1, 'cadangan');
  const cols = [...BACKUP_COLS, ...Object.keys(BACKUP_DOCS), 'audit'].filter((c) => Array.isArray(data[c]) && data[c].length);
  if (!cols.length) { step.innerHTML = `<p class="err">Berkas ini bukan cadangan Serenity (tidak ada koleksi yang dikenali).</p>`; return; }
  const bad = cols.flatMap((c) => data[c].filter((d) => !d || typeof d.id !== 'string' || !d.id || d.id.includes('/')).map(() => c));
  step.innerHTML = `<div class="callout small-callout">${ic('file')}<div><b>${esc(file.name)}</b><p class="small">Dibuat ${esc(data.exportedAt ? fmtDate(data.exportedAt, true) : '-')} • ${esc(data.app || '')} v${esc(data.version || '?')}${data.exportedBy ? ' • oleh ' + esc(data.exportedBy) : ''}</p></div></div>
    ${bad.length ? `<p class="err">${bad.length} dokumen tanpa ID yang valid akan dilewati.</p>` : ''}
    <div class="col-picker" style="max-height:none">${cols.map((c) => ARCHIVE_ONLY.includes(c) ? `<label class="check muted"><input type="checkbox" disabled> ${esc(COL_LABEL[c] || c)} <span class="small">(${fmtNum(data[c].length)} — arsip, tidak dipulihkan)</span></label>` : `<label class="check"><input type="checkbox" name="rc" value="${c}" ${!['config', 'users', 'private', 'sistem'].includes(c) ? 'checked' : ''}> ${esc(COL_LABEL[c] || c)} <span class="muted small">(${fmtNum(data[c].length)} dokumen)</span></label>`).join('')}</div>
    <div class="field"><span>Mode pemulihan</span>
      <label class="check"><input type="radio" name="rm" value="merge" checked> <b>Gabungkan</b> — tambah & timpa dokumen ber-ID sama, data lain tetap ada</label>
      <label class="check"><input type="radio" name="rm" value="replace"> <b>Ganti total</b> — kosongkan koleksi terpilih lalu isi dari cadangan</label></div>
    <button class="btn btn-primary" id="rs-go">${ic('upload')} Pulihkan</button><div id="rs-prog"></div>`;
  $('#rs-go').onclick = async () => {
    const sel = $$('input[name=rc]:checked', step).map((x) => x.value);
    const mode = $('input[name=rm]:checked', step).value;
    if (!sel.length) return toast('Pilih minimal satu koleksi', 'error');
    const total = sel.reduce((a, c) => a + data[c].length, 0);
    if (!await confirmDialog(`${mode === 'replace' ? 'GANTI TOTAL' : 'Gabungkan'} ${fmtNum(total)} dokumen ke: ${sel.map((c) => COL_LABEL[c] || c).join(', ')}?${mode === 'replace' ? ' Data yang ada sekarang di koleksi tersebut akan dihapus.' : ''}`, { danger: mode === 'replace', okText: 'Lanjutkan' })) return;
    if (!await requirePassword(`Memulihkan ${fmtNum(total)} dokumen dari cadangan.`)) return;
    const prog = $('#rs-prog'); const btn = $('#rs-go'); btn.disabled = true;
    prog.innerHTML = '<div class="progress"><span style="width:0%"></span></div><p class="muted small" id="rs-t">Menyiapkan…</p>';
    try {
      const ops = [];
      for (const c of sel) {
        if (mode === 'replace' && !BACKUP_DOCS[c] && c !== 'users') {
          const s = await F.getDocs(F.collection(F.db, c));
          const keep = new Set(data[c].map((d) => d.id));
          s.docs.filter((d) => !keep.has(d.id)).forEach((d) => ops.push(['delete', F.doc(F.db, c, d.id)]));
        }
        for (const d of data[c]) {
          if (!d || typeof d.id !== 'string' || !d.id || d.id.includes('/')) continue;
          if (BACKUP_DOCS[c] && !BACKUP_DOCS[c].includes(d.id)) continue;
          // Akun Super Admin & akun sendiri tidak ditimpa (dikunci Rules)
          if (c === 'users' && (d.role === 'superadmin' || d.id === state.user.uid)) continue;
          const { id, ...rest } = d;
          ops.push(['set', F.doc(F.db, c, id), clean(revive(rest)), BACKUP_DOCS[c] || c === 'users' ? { merge: true } : {}]);
        }
      }
      await batchWrite(ops, (n, t) => { $('.progress span', prog).style.width = `${(n / t) * 100}%`; $('#rs-t').textContent = `${fmtNum(n)} / ${fmtNum(t)} operasi`; });
      logAudit('cadangan', 'pulihkan', `Memulihkan data dari cadangan “${file.name}” (${mode === 'replace' ? 'ganti total' : 'gabungkan'})`, { count: total, detail: sel.map((c) => `${c}: ${data[c].length}`).join(', ') });
      prog.innerHTML = `<div class="callout ok">${ic('check')}<div><b>Pemulihan selesai</b><p>${fmtNum(total)} dokumen dipulihkan.</p></div></div>`;
      toast('Pemulihan selesai', 'success');
    } catch (e) {
      logAudit('cadangan', 'pulihkan_gagal', `Pemulihan dari “${file.name}” gagal`, { detail: e.message });
      prog.innerHTML = `<p class="err">Gagal: ${esc(e.message)}</p>`; btn.disabled = false;
    }
  };
}
