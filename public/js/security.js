// Super Admin: login khusus, manajemen admin, audit log, cadangan & pemulihan (restore JSON)
import { APP } from './config.js';
import { F, ic, state, C, clean, emptyBox, loadingBox, batchWrite, PERMS, PERM_PRESETS, KADUS_PERMS, KADUS_DEFAULT, isSuper, can, avatar, ROLE_LABEL, AUDIT_CATS, logAudit, requirePassword, superEmail, loginFailed } from './core.js';
import { esc, $, $$, norm, debounce, toDate, fmtDate, fmtNum, todayISO, toast, modal, confirmDialog, promptDialog, downloadBlob, authErrorMessage } from './ui.js';
import { exportExcel, exportPdf } from './exporter.js';

// ---------------------------------------------------------------- login Super Admin (cukup password)
export function openSuperLogin() {
  const m = modal({
    title: 'Login Super Admin', size: 'sm',
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
    const emails = [...new Set([state.authCfg.superEmail, state.authCfg.pendingEmail, APP.superAdminEmail].filter(Boolean))];
    let err = null;
    sessionStorage.setItem('dd:justLogin', '1');
    for (const em of emails) {
      try { await F.signInWithEmailAndPassword(F.auth, em, inp.value); err = null; break; }
      catch (x) { err = x; if (!['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(x.code)) break; }
    }
    if (err) {
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
const canKadusMgmt = () => isSuper() || can('kelolaKadus');
export function viewAdmins(main, r) {
  state.view = 'form';
  main.innerHTML = loadingBox();
  const q = isSuper() ? F.collection(F.db, 'users') : F.query(F.collection(F.db, 'users'), F.where('role', '==', 'kadus'));
  F.getDocs(q).then((s) => {
    const order = { superadmin: 0, admin: 1, kadus: 2 };
    usersCache = s.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9) || String(a.dusun || '').localeCompare(String(b.dusun || '')) || String(a.nama).localeCompare(String(b.nama)));
    drawAdmins(main);
    const pre = r?.query?.get('kadus');
    if (pre) { history.replaceState(null, '', '#/admin/admin'); adminForm(null, main, { role: 'kadus', dusun: pre }); }
  }).catch((e) => { main.innerHTML = emptyBox('Gagal memuat daftar akun: ' + e.message); });
}
function drawAdmins(main) {
  const permLabel = (u) => {
    if (u.role === 'superadmin') return 'Semua akses';
    const list = u.role === 'kadus' ? KADUS_PERMS : PERMS;
    return list.filter(([k]) => u.perms?.[k]).map((p) => p[1]).join(', ') || 'Belum ada akses';
  };
  const editable = (u) => u.uid !== state.user.uid && u.role !== 'superadmin' && (isSuper() || u.role === 'kadus');
  const nAdmin = usersCache.filter((u) => u.role === 'admin').length, nKadus = usersCache.filter((u) => u.role === 'kadus').length;
  main.innerHTML = `<div class="callout">${ic('shield')}<div><b>${isSuper() ? 'Akun Admin & Kepala Dusun' : 'Akun Kepala Dusun'}</b><p>${isSuper() ? 'Hanya Super Admin yang dapat mendaftarkan Admin. Admin yang diberi izin “Kelola akun Kepala Dusun” dapat membuat akun Kadus.' : 'Buat akun login untuk Kepala Dusun. Kadus hanya dapat mengakses data warga di dusunnya sendiri.'} Semua perubahan tercatat di Audit Log.</p></div></div>
  <div class="toolbar toolbar-actions">
    ${isSuper() ? `<button class="btn btn-primary" id="usr-new">${ic('plus')} Tambah Admin</button>` : ''}
    <button class="btn ${isSuper() ? 'btn-ghost' : 'btn-primary'}" id="usr-kadus">${ic('map')} Tambah Akun Kepala Dusun</button>
    <span class="muted small">${isSuper() ? `${nAdmin} admin · ` : ''}${nKadus} kepala dusun</span>
  </div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Pengguna</th><th>Peran</th><th>Hak akses</th><th>Status</th><th>Login terakhir</th><th class="actions-col">Aksi</th></tr></thead>
  <tbody>${usersCache.map((u) => `<tr>
    <td><div class="user-cell">${avatar(u)}<div><b>${esc(u.nama || '-')}</b>${u.uid === state.user.uid ? ' <span class="badge">Anda</span>' : ''}<br><small class="muted">${esc(u.email)}</small></div></div></td>
    <td><span class="badge ${u.role === 'superadmin' ? 'badge-warn' : u.role === 'kadus' ? 'badge-ok' : ''}">${esc(ROLE_LABEL[u.role] || u.role)}</span>${u.role === 'kadus' ? `<br><small class="muted">Dusun ${esc(u.dusun || '-')}</small>` : ''}</td>
    <td class="small" style="max-width:340px;white-space:normal">${esc(permLabel(u))}</td>
    <td><span class="badge ${u.active === false ? 'badge-muted' : 'badge-ok'}">${u.active === false ? 'Nonaktif' : 'Aktif'}</span></td>
    <td class="small">${esc(fmtDate(u.lastLogin, true) || '-')}</td>
    <td class="actions-col">${editable(u) ? `<button class="icon-btn" data-ed="${u.uid}" title="Atur hak akses">${ic('edit')}</button><button class="icon-btn" data-rs="${u.uid}" title="Kirim reset password">${ic('lock')}</button><button class="icon-btn ${u.active === false ? '' : 'danger'}" data-tg="${u.uid}" title="${u.active === false ? 'Aktifkan' : 'Nonaktifkan'}">${ic(u.active === false ? 'check' : 'out')}</button><button class="icon-btn danger" data-rm="${u.uid}" title="Hapus akses">${ic('trash')}</button>` : ''}</td>
  </tr>`).join('')}${usersCache.some((u) => u.role !== 'superadmin') ? '' : `<tr><td colspan="6"><div class="empty">Belum ada akun. Klik <b>Tambah Admin</b> atau <b>Tambah Akun Kepala Dusun</b>.</div></td></tr>`}</tbody></table></div>`;
  $('#usr-new')?.addEventListener('click', () => adminForm(null, main, { role: 'admin' }));
  $('#usr-kadus').onclick = () => adminForm(null, main, { role: 'kadus' });
  $$('[data-ed]', main).forEach((b) => b.onclick = () => adminForm(usersCache.find((u) => u.uid === b.dataset.ed), main));
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
    const base = { nama, perms: newPerms, ...(isK ? { dusun, dusunId: state.dusun.find((d) => d.nama === dusun)?.id || '', hp: f.elements.hp.value.trim(), jabatan: `Kepala Dusun ${dusun}` } : { jabatan: f.elements.jabatan.value.trim() }) };
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
const BACKUP_COLS = ['warga', 'dusun', 'master', 'informasi', 'instagram', 'halaman', 'kegiatan'];
const COL_LABEL = { warga: 'Data warga', dusun: 'Dusun', master: 'Data master', informasi: 'Papan informasi', instagram: 'Postingan Instagram', halaman: 'Halaman Profil Gampong', kegiatan: 'Kegiatan rutin', config: 'Pengaturan desa' };
export function viewCadangan(main) {
  state.view = 'form';
  main.innerHTML = `
  <div class="panel-grid two">
    <div class="panel"><h3>${ic('download')} Unduh Cadangan</h3>
      <p class="muted small">Seluruh data (warga, dusun, master, informasi, Instagram, halaman profil, kegiatan, pengaturan) dalam satu berkas JSON. Simpan di tempat aman — berkas berisi data pribadi warga.</p>
      <button class="btn btn-primary" id="bk">${ic('download')} Unduh Cadangan JSON</button></div>
    <div class="panel"><h3>${ic('upload')} Pulihkan dari Cadangan</h3>
      <p class="muted small">Upload berkas JSON hasil “Unduh Cadangan”. Anda dapat memilih koleksi yang dipulihkan dan cara pemulihannya.</p>
      <label class="dropzone" id="rs-dz"><input type="file" id="rs-file" accept=".json,application/json" hidden>${ic('upload')}<b>Pilih berkas cadangan (.json)</b><span class="muted small">Tidak ada yang ditulis sebelum Anda mengonfirmasi.</span></label>
      <div id="rs-step"></div></div>
  </div>
  <div class="panel"><h3 class="danger-text">${ic('trash')} Zona Berbahaya</h3>
    <p class="muted small">Menghapus seluruh data warga secara permanen. Unduh cadangan terlebih dahulu.</p>
    <button class="btn btn-danger btn-ghost" id="wipe">${ic('trash')} Hapus semua data warga</button></div>`;
  $('#bk').onclick = async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try {
      const dump = { app: APP.name, version: APP.version, format: 'digides-backup-v2', exportedAt: new Date().toISOString(), exportedBy: state.user.email };
      for (const col of [...BACKUP_COLS, 'config']) {
        const s = await F.getDocs(F.collection(F.db, col));
        dump[col] = s.docs.filter((d) => col !== 'config' || ['app'].includes(d.id)).map((d) => ({ id: d.id, ...d.data() }));
      }
      downloadBlob(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }), `cadangan-digides-${todayISO()}.json`);
      logAudit('cadangan', 'unduh', 'Mengunduh cadangan data lengkap (JSON)', { count: dump.warga.length, detail: BACKUP_COLS.map((c) => `${c}: ${dump[c].length}`).join(', ') });
    } catch (err) { toast('Gagal membuat cadangan: ' + err.message, 'error'); }
    b.disabled = false;
  };
  const dz = $('#rs-dz'), fi = $('#rs-file');
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) readBackup(e.dataTransfer.files[0]); });
  fi.onchange = () => fi.files[0] && readBackup(fi.files[0]);
  $('#wipe').onclick = async () => {
    const t = await promptDialog('Hapus semua data warga', `Ketik HAPUS untuk menghapus ${state.warga.length} data warga secara permanen`, '', { okText: 'Lanjut' });
    if (t !== 'HAPUS') return;
    if (!await requirePassword(`Menghapus permanen ${state.warga.length} data warga.`)) return;
    try {
      const n = state.warga.length;
      await batchWrite(state.warga.map((w) => ['delete', C(`warga/${w.id}`)]));
      logAudit('cadangan', 'kosongkan_warga', `Menghapus SEMUA data warga (${n})`, { count: n });
      toast('Semua data warga dihapus', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };
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
  const cols = [...BACKUP_COLS, 'config'].filter((c) => Array.isArray(data[c]));
  if (!cols.length) { step.innerHTML = `<p class="err">Berkas ini bukan cadangan DigiDes (tidak ada koleksi yang dikenali).</p>`; return; }
  const bad = cols.flatMap((c) => data[c].filter((d) => !d || typeof d.id !== 'string' || !d.id || d.id.includes('/')).map(() => c));
  step.innerHTML = `<div class="callout small-callout">${ic('file')}<div><b>${esc(file.name)}</b><p class="small">Dibuat ${esc(data.exportedAt ? fmtDate(data.exportedAt, true) : '-')} • ${esc(data.app || '')} v${esc(data.version || '?')}${data.exportedBy ? ' • oleh ' + esc(data.exportedBy) : ''}</p></div></div>
    ${bad.length ? `<p class="err">${bad.length} dokumen tanpa ID yang valid akan dilewati.</p>` : ''}
    <div class="col-picker" style="max-height:none">${cols.map((c) => `<label class="check"><input type="checkbox" name="rc" value="${c}" ${c !== 'config' ? 'checked' : ''}> ${esc(COL_LABEL[c] || c)} <span class="muted small">(${fmtNum(data[c].length)} dokumen)</span></label>`).join('')}</div>
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
        if (mode === 'replace' && c !== 'config') {
          const s = await F.getDocs(F.collection(F.db, c));
          const keep = new Set(data[c].map((d) => d.id));
          s.docs.filter((d) => !keep.has(d.id)).forEach((d) => ops.push(['delete', F.doc(F.db, c, d.id)]));
        }
        for (const d of data[c]) {
          if (!d || typeof d.id !== 'string' || !d.id || d.id.includes('/')) continue;
          if (c === 'config' && d.id !== 'app') continue;
          const { id, ...rest } = d;
          ops.push(['set', F.doc(F.db, c, id), clean(revive(rest)), c === 'config' ? { merge: true } : {}]);
        }
      }
      await batchWrite(ops, (n, t) => { $('.progress span', prog).style.width = `${(n / t) * 100}%`; $('#rs-t').textContent = `${fmtNum(n)} / ${fmtNum(t)} operasi`; });
      logAudit('cadangan', 'pulihkan', `Memulihkan data dari cadangan “${file.name}” (${mode === 'replace' ? 'ganti total' : 'gabungkan'})`, { count: total, detail: sel.map((c) => `${c}: ${data[c].length}`).join(', ') });
      prog.innerHTML = `<div class="callout ok">${ic('check')}<div><b>Pemulihan selesai</b><p>${fmtNum(total)} dokumen dipulihkan.</p></div></div>`;
    } catch (e) {
      logAudit('cadangan', 'pulihkan_gagal', `Pemulihan dari “${file.name}” gagal`, { detail: e.message });
      prog.innerHTML = `<p class="err">Gagal: ${esc(e.message)}</p>`; btn.disabled = false;
    }
  };
}
