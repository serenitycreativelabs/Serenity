/* Serenity Service Worker — Powered by Serenity Creativa Labs. © 2026 All Rights Reserved */
const VERSION = '2.9.0';
const SHELL = `serenity-shell-v${VERSION}`;
const RUNTIME = `serenity-runtime-v${VERSION}`;
const SHELL_FILES = [
  './', './index.html', './login.html', './manifest.webmanifest', './css/app.css',
  './js/app.js', './js/config.js', './js/firebase.js', './js/fields.js', './js/ui.js', './js/wilayah.js', './js/exporter.js',
  './js/core.js', './js/cms.js', './js/security.js', './js/praytimes.js', './js/firebase-config.js', './js/rich.js', './js/layout.js', './js/lembaga.js', './js/badges.js', './js/tampilan.js',
  './js/usage.js', './js/sync.js', './js/analytics.js', './js/widgets.js', './js/monitor.js', './js/motion.js', './js/chat.js', './js/title.js', './js/reader.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon.svg',
];
// Pustaka & data yang aman di-cache (Firebase SDK, SheetJS, jsPDF, font, data wilayah)
const CACHEABLE_HOSTS = ['www.gstatic.com', 'cdn.sheetjs.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'api.fontshare.com', 'cdn.fontshare.com', 'www.emsifa.com', 'ibnux.github.io'];
// Jangan pernah di-cache (API dinamis & autentikasi)
const BYPASS = ['/__/auth/', 'firebase-config.local.js', 'firestore.googleapis.com', 'firebaseappcheck.googleapis.com', 'recaptcha', 'www.google.com', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'graph.instagram.com', 'firebaseinstallations.googleapis.com', 'wa.me'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => (k.startsWith('digides-') || k.startsWith('serenity-')) && ![SHELL, RUNTIME].includes(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });
// Klik notifikasi (mis. pengingat cadangan tanggal 29) → buka halaman Cadangan & Pemulihan
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const chat = e.notification.data && e.notification.data.chat;
  // Notifikasi chat: fokuskan tab yang sudah terbuka lalu buka percakapannya (tanpa pindah halaman)
  if (chat) {
    e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => { const c = cs.find((x) => x.url.startsWith(self.registration.scope)); if (c) { c.postMessage({ type: 'open-chat', chat }); return c.focus(); } return self.clients.openWindow(new URL('./#/admin', self.registration.scope).href); }));
    return;
  }
  const url = new URL('./#/admin/cadangan', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => { const c = cs.find((x) => x.url.startsWith(self.registration.scope)); if (c) { c.navigate(url); return c.focus(); } return self.clients.openWindow(url); }));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (BYPASS.some((h) => url.hostname.includes(h) || url.pathname.includes(h))) return;

  // Navigasi: network-first, fallback ke shell (offline)
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(SHELL).then((c) => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }

  // Berkas aplikasi sendiri: stale-while-revalidate
  if (url.origin === self.location.origin) {
    e.respondWith(caches.open(SHELL).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  // CDN & data wilayah: cache-first
  if (CACHEABLE_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(RUNTIME).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok || r.type === 'opaque') c.put(req, r.clone());
      return r;
    }));
    return;
  }

  // Gambar Instagram CDN: network-first, fallback cache
  if (req.destination === 'image') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(RUNTIME).then((c) => c.put(req, copy)); return r; })
      .catch(() => caches.match(req)));
  }
});
