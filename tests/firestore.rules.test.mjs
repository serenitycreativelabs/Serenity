// =============================================================
//  Serenity v3.0.1 — Uji otomatis Firestore Rules (Firebase Emulator)
//  Memastikan Kepala Dusun TIDAK bisa melihat, mengubah, memindah, atau menghapus warga dusun lain,
//  dan catatan hapus hanya bisa dibuat oleh yang berhak.
//  Jalankan: npx firebase-tools@13 emulators:exec --only firestore --project demo-serenity "node --test tests/"
//  (otomatis lewat GitHub Actions › "Uji Aturan Keamanan")
// =============================================================
import { test, before, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, serverTimestamp } from 'firebase/firestore';

let env;
const KADUS = { uid: 'k1', email: 'kadus@contoh.id' };
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-serenity', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/k1'), { email: KADUS.email, nama: 'Kadus Mawar', role: 'kadus', active: true, dusun: 'Mawar', perms: { warga: true, wargaEdit: true, wargaDelete: true } });
    await setDoc(doc(db, 'users/a1'), { email: 'op@contoh.id', nama: 'Operator', role: 'admin', active: true, perms: { warga: true, wargaEdit: true } });
    await setDoc(doc(db, 'warga/w1'), { nama: 'Warga Mawar', dusun: 'Mawar' });
    await setDoc(doc(db, 'warga/w2'), { nama: 'Warga Melati', dusun: 'Melati' });
    await setDoc(doc(db, 'warga/w3'), { nama: 'Warga Tanpa Dusun' });
  });
});
after(async () => { await env?.cleanup(); });
const kadus = () => env.authenticatedContext(KADUS.uid, { email: KADUS.email }).firestore();
const admin = () => env.authenticatedContext('a1', { email: 'op@contoh.id' }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

test('Kadus: boleh membaca warga dusunnya sendiri', async () => { await assertSucceeds(getDoc(doc(kadus(), 'warga/w1'))); });
test('Kadus: TIDAK boleh membaca warga dusun lain', async () => { await assertFails(getDoc(doc(kadus(), 'warga/w2'))); });
test('Kadus: TIDAK boleh membaca warga tanpa dusun', async () => { await assertFails(getDoc(doc(kadus(), 'warga/w3'))); });
test('Kadus: daftar warga wajib difilter dusunnya', async () => {
  await assertSucceeds(getDocs(query(collection(kadus(), 'warga'), where('dusun', '==', 'Mawar'))));
  await assertFails(getDocs(collection(kadus(), 'warga')));
  await assertFails(getDocs(query(collection(kadus(), 'warga'), where('dusun', '==', 'Melati'))));
});
test('Kadus: boleh mengubah warga dusunnya', async () => { await assertSucceeds(updateDoc(doc(kadus(), 'warga/w1'), { nama: 'Warga Mawar Baru', dusun: 'Mawar' })); });
test('Kadus: TIDAK boleh mengubah warga dusun lain', async () => { await assertFails(updateDoc(doc(kadus(), 'warga/w2'), { nama: 'Diubah', dusun: 'Melati' })); });
test('Kadus: TIDAK boleh memindah warga ke dusun lain', async () => { await assertFails(updateDoc(doc(kadus(), 'warga/w1'), { nama: 'Warga Mawar', dusun: 'Melati' })); });
test('Kadus: TIDAK boleh menambah warga ke dusun lain', async () => { await assertFails(setDoc(doc(kadus(), 'warga/w9'), { nama: 'Baru', dusun: 'Melati' })); });
test('Kadus: boleh menambah warga ke dusunnya', async () => { await assertSucceeds(setDoc(doc(kadus(), 'warga/w8'), { nama: 'Baru', dusun: 'Mawar' })); });
test('Kadus: TIDAK boleh menghapus warga dusun lain', async () => { await assertFails(deleteDoc(doc(kadus(), 'warga/w2'))); });
test('Kadus: boleh menghapus warga dusunnya', async () => { await assertSucceeds(deleteDoc(doc(kadus(), 'warga/w8'))); });
test('Kadus: TIDAK boleh menaikkan hak aksesnya sendiri', async () => {
  await assertFails(updateDoc(doc(kadus(), 'users/k1'), { role: 'admin' }));
  await assertFails(updateDoc(doc(kadus(), 'users/k1'), { perms: { warga: true, wargaEdit: true, wargaDelete: true, pengaturan: true } }));
  await assertFails(updateDoc(doc(kadus(), 'users/k1'), { dusun: 'Melati' }));
});
test('Catatan hapus: Kadus hanya untuk warga dusunnya', async () => {
  const col = collection(kadus(), 'hapus');
  await assertSucceeds(setDoc(doc(col), { c: 'warga', ids: ['w1'], at: serverTimestamp(), dusun: 'Mawar' }));
  await assertFails(setDoc(doc(col), { c: 'warga', ids: ['w2'], at: serverTimestamp() }));
  await assertFails(setDoc(doc(col), { c: 'warga', ids: ['w2'], at: serverTimestamp(), dusun: 'Melati' }));
  await assertFails(setDoc(doc(col), { c: 'informasi', ids: ['i1'], at: serverTimestamp(), dusun: 'Mawar' }));
});
test('Catatan hapus: admin tanpa hak hapus warga ditolak', async () => {
  await assertFails(setDoc(doc(collection(admin(), 'hapus')), { c: 'warga', ids: ['w2'], at: serverTimestamp() }));
});
test('Pengunjung tanpa login: tidak bisa membaca data warga', async () => {
  await assertFails(getDoc(doc(anon(), 'warga/w1')));
  await assertFails(getDocs(collection(anon(), 'warga')));
});
