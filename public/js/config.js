// =============================================================
//  Serenity — Sistem Informasi Desa Digital
//  Konfigurasi aplikasi (TIDAK berisi API key — aman di GitHub)
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
//
//  Konfigurasi Firebase (apiKey, projectId, dst.) TIDAK disimpan di repositori.
//  • Di Firebase Hosting, konfigurasi diambil otomatis dari /__/firebase/init.json
//  • Untuk uji lokal, salin js/firebase-config.example.js → js/firebase-config.local.js
//    (berkas .local.js sudah masuk .gitignore sehingga tidak ikut ter-commit)

export const APP = {
  name: 'Serenity',
  fullName: 'Serenity — Sistem Informasi Gampong Digital',
  version: '2.9.14',
  build: '2026.10.31',
  revision: 'R30',               // nomor revisi rilis (naik otomatis lewat scripts/bump-version.mjs)
  codename: 'Kirana',
  channel: 'Stable',
  owner: 'Deah Glumpang',
  copyright: 'Powered by Serenity Creativa Labs. © 2026 All Rights Reserved',
  get credit() { return `${this.owner} ◦ ${this.copyright}`; },
  // Kredit pada dokumen hasil ekspor PDF & Excel (tanpa nomor versi aplikasi)
  get exportCredit() { return `${this.owner} ${this.copyright}`; },
  get versionLabel() { return `v${this.version}`; },
  get buildLabel() { return `v${this.version} “${this.codename}” • Build ${this.build} • Rev ${this.revision} • ${this.channel}`; },

  // ID proyek Firebase (BUKAN rahasia). Dipakai untuk mengambil konfigurasi dari situs
  // Firebase Hosting bila aplikasi dibuka di hosting lain (GitHub Pages, domain sendiri, localhost).
  firebaseProjectId: 'digides-8423e',
  // Opsional: alamat Firebase Hosting kustom, mis. 'https://gampong-anda.id'
  firebaseHostingUrl: '',

  // Super Admin utama (login cukup password: klik 5x pada tulisan copyright)
  superAdminEmail: 'serenityxcreative@gmail.com',

  // Firebase App Check (reCAPTCHA v3) — melindungi dari bot & pencurian kuota.
  // Isi dengan SITE KEY reCAPTCHA v3 (berawalan 6L…, bukan rahasia). Kosongkan untuk menonaktifkan.
  appCheckSiteKey: '6Ld6VwIuAAAAADcRZAOAPvDjoFu1nUQgjaZ3mpCv',
     appCheckProvider: 'enterprise',
  // Logout otomatis bila tidak ada aktivitas (menit). Bisa diubah Super Admin di Pengaturan.
  idleMinutesDefault: 30,
};

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
export const IG_GRAPH = 'https://graph.instagram.com';
