// v3.1.2 — Salin cuplikan tampilan terbaru (tema + nama gampong) dari config/app.brandSnap ke public/brand.js.
// brand.js dimuat paling awal oleh index.html, sehingga pengunjung yang BARU PERTAMA KALI membuka website
// langsung melihat warna tema, logo & nama gampong yang benar di layar memuat (bukan tampilan bawaan).
// Cuplikan ditulis otomatis oleh perangkat Super Admin setiap kali tema/nama berubah.
import fs from 'fs';
import admin from 'firebase-admin';

const OUT = 'public/brand.js';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.log('Secret FIREBASE_SERVICE_ACCOUNT belum diatur — lewati.'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const snap = await admin.firestore().doc('config/app').get();
const c = snap.exists ? snap.data() : {};
const b = c.brandSnap || {};
const okUrl = (u) => typeof u === 'string' && /^(data:image\/(png|jpeg|webp|gif|svg\+xml);base64,|https:\/\/)/.test(u) && u.length < 60000;
const out = {
  nama: typeof b.nama === 'string' && b.nama ? b.nama.slice(0, 120) : 'Gampong Deah Glumpang',
  icon: okUrl(b.icon) ? b.icon : '',
  tema: b.tema && typeof b.tema === 'object' ? b.tema : null,
  at: Number(b.at) || 0,
};
// "<" di-escape agar isi tidak bisa menutup tag <script>
const body = JSON.stringify(out).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
const js = `/* Dibuat otomatis oleh scripts/sync-brand.mjs — jangan diedit manual. */\nwindow.__ddBrand=${body};\n`;
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (prev === js) { console.log('brand.js sudah terbaru.'); process.exit(0); }
fs.writeFileSync(OUT, js);
console.log(`brand.js diperbarui (nama: ${out.nama}, tema: ${out.tema ? 'ada' : 'bawaan'}).`);
