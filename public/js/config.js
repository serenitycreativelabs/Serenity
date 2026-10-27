// =============================================================
//  DigiDes — Sistem Informasi Desa Digital
//  Konfigurasi aplikasi (TIDAK berisi API key — aman di GitHub)
//  © Serenity Creativa 2026
// =============================================================
//
//  Konfigurasi Firebase (apiKey, projectId, dst.) TIDAK disimpan di repositori.
//  • Di Firebase Hosting, konfigurasi diambil otomatis dari /__/firebase/init.json
//  • Untuk uji lokal, salin js/firebase-config.example.js → js/firebase-config.local.js
//    (berkas .local.js sudah masuk .gitignore sehingga tidak ikut ter-commit)

export const APP = {
  name: 'DigiDes',
  fullName: 'DigiDes — Sistem Informasi Desa Digital',
  version: '2.2.0',
  build: '2026.10.27',
  copyright: '© Serenity Creativa 2026',

  // ID proyek Firebase (BUKAN rahasia). Dipakai untuk mengambil konfigurasi dari situs
  // Firebase Hosting bila aplikasi dibuka di hosting lain (GitHub Pages, domain sendiri, localhost).
  firebaseProjectId: 'digides-8423e',
  // Opsional: alamat Firebase Hosting kustom, mis. 'https://gampong-anda.id'
  firebaseHostingUrl: '',

  // Super Admin utama (login cukup password: klik 5x pada tulisan copyright)
  superAdminEmail: 'serenityxcreative@gmail.com',

  // Firebase App Check (reCAPTCHA v3) — melindungi dari bot & pencurian kuota.
  // Isi dengan SITE KEY reCAPTCHA v3 (berawalan 6L…, bukan rahasia). Kosongkan untuk menonaktifkan.
  appCheckSiteKey: '',

  // Logout otomatis bila tidak ada aktivitas (menit). Bisa diubah Super Admin di Pengaturan.
  idleMinutesDefault: 30,
};

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
export const IG_GRAPH = 'https://graph.instagram.com';
