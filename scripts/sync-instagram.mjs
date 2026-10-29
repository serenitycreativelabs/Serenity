// Sinkron Instagram → Firestore (dijalankan oleh GitHub Actions).
// Token diambil dari dokumen Firestore private/instagram (diisi admin di aplikasi) atau secret IG_TOKEN.
// v2.4: menandai syncAt & menaikkan versi meta/pub agar pengunjung ikut menerima perubahan (delta sync)
// Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
import admin from 'firebase-admin';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.log('FIREBASE_SERVICE_ACCOUNT belum diatur — lewati.'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore();
const G = 'https://graph.instagram.com';

const privRef = db.doc('private/instagram');
const priv = (await privRef.get()).data() || {};
let token = priv.token || process.env.IG_TOKEN;
if (!token) { console.log('Token Instagram belum diatur — lewati.'); process.exit(0); }

const updated = priv.tokenUpdatedAt?.toDate?.()?.getTime() || 0;
if (Date.now() - updated > 7 * 864e5) {
  const r = await fetch(`${G}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`).then((x) => x.json()).catch(() => ({}));
  if (r.access_token) {
    token = r.access_token;
    await privRef.set({ token, tokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(), expiresIn: r.expires_in || null }, { merge: true });
    console.log('Token diperpanjang.');
  }
}

const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username';
const res = await fetch(`${G}/me/media?fields=${fields}&limit=50&access_token=${encodeURIComponent(token)}`).then((x) => x.json());
if (res.error) { console.error('Instagram API error:', res.error.message); process.exit(1); }

const posts = res.data || [];
const batch = db.batch();
for (const p of posts) {
  batch.set(db.doc(`instagram/${p.id}`), {
    caption: p.caption || '', mediaType: p.media_type, mediaUrl: p.media_url || '', thumbnail: p.thumbnail_url || '',
    permalink: p.permalink, timestamp: p.timestamp, username: p.username || '', source: 'api',
    syncedAt: admin.firestore.FieldValue.serverTimestamp(), syncAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}
batch.set(db.doc('config/app'), { igLastSync: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
batch.set(db.doc('meta/pub'), { instagram: admin.firestore.FieldValue.serverTimestamp(), cfg_app: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
await batch.commit();
console.log(`${posts.length} postingan disinkronkan.`);
