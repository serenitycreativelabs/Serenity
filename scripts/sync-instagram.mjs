// Sinkron Instagram → Firestore (dijalankan oleh GitHub Actions).
// Token diambil dari dokumen Firestore private/instagram (diisi admin di aplikasi) atau secret IG_TOKEN.
// v2.4.1: hemat kuota — hanya menulis bila ada postingan baru/berubah, dan tidak menggagalkan
//         workflow saat kuota harian Firestore habis (RESOURCE_EXHAUSTED); dicoba lagi pada jadwal berikutnya.
// v2.4: menandai syncAt & menaikkan versi meta/pub agar pengunjung ikut menerima perubahan (delta sync)
// Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
import admin from 'firebase-admin';
import crypto from 'node:crypto';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.log('FIREBASE_SERVICE_ACCOUNT belum diatur — lewati.'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore();
const G = 'https://graph.instagram.com';
const TS = () => admin.firestore.FieldValue.serverTimestamp();

const isQuota = (e) => e?.code === 8 || /RESOURCE_EXHAUSTED|quota/i.test(String(e?.message || e));

async function main() {
  const privRef = db.doc('private/instagram');
  const priv = (await privRef.get()).data() || {};
  let token = priv.token || process.env.IG_TOKEN;
  if (!token) { console.log('Token Instagram belum diatur — lewati.'); return; }

  const updated = priv.tokenUpdatedAt?.toDate?.()?.getTime() || 0;
  if (Date.now() - updated > 7 * 864e5) {
    const r = await fetch(`${G}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`).then((x) => x.json()).catch(() => ({}));
    if (r.access_token) {
      token = r.access_token;
      await privRef.set({ token, tokenUpdatedAt: TS(), expiresIn: r.expires_in || null }, { merge: true });
      console.log('Token diperpanjang.');
    }
  }

  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username';
  const res = await fetch(`${G}/me/media?fields=${fields}&limit=50&access_token=${encodeURIComponent(token)}`).then((x) => x.json());
  if (res.error) { console.error('Instagram API error:', res.error.message); process.exitCode = 1; return; }
  const posts = res.data || [];

  // Hanya menulis bila daftar postingan berubah (URL media Instagram berganti berkala, jadi diabaikan dari sidik)
  const hash = crypto.createHash('sha256').update(JSON.stringify(posts.map((p) => [p.id, p.caption || '', p.media_type, p.permalink, p.timestamp]))).digest('hex');
  const stale = Date.now() - (priv.lastSyncAt?.toDate?.()?.getTime() || 0) > 24 * 3600e3; // segarkan URL media sekali sehari
  if (priv.lastHash === hash && !stale) { console.log(`Tidak ada perubahan (${posts.length} postingan) — tidak ada yang ditulis.`); return; }

  const known = new Set(priv.lastIds || []);
  const changed = stale ? posts : posts.filter((p) => !known.has(p.id) || priv.lastHash !== hash);
  const batch = db.batch();
  for (const p of changed) {
    batch.set(db.doc(`instagram/${p.id}`), {
      caption: p.caption || '', mediaType: p.media_type, mediaUrl: p.media_url || '', thumbnail: p.thumbnail_url || '',
      permalink: p.permalink, timestamp: p.timestamp, username: p.username || '', source: 'api',
      syncedAt: TS(), syncAt: TS(),
    }, { merge: true });
  }
  batch.set(db.doc('config/app'), { igLastSync: TS() }, { merge: true });
  batch.set(db.doc('meta/pub'), { instagram: TS(), cfg_app: TS() }, { merge: true });
  batch.set(privRef, { lastHash: hash, lastIds: posts.map((p) => p.id), lastSyncAt: TS() }, { merge: true });
  await batch.commit();
  console.log(`${changed.length} dari ${posts.length} postingan disinkronkan.`);
}

try { await main(); }
catch (e) {
  if (isQuota(e)) {
    console.warn('⚠ Kuota harian Firestore habis (RESOURCE_EXHAUSTED). Sinkron dilewati dan akan dicoba lagi pada jadwal berikutnya.');
    console.warn('  Kuota gratis direset setiap pukul 00.00 waktu Pasifik (± 14.00/15.00 WIB). Cek: Firebase Console → Firestore → Usage.');
    process.exit(0);
  }
  console.error(e); process.exit(1);
}
