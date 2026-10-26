// CONTOH konfigurasi Firebase untuk UJI LOKAL saja.
// 1. Salin berkas ini menjadi: public/js/firebase-config.local.js
// 2. Isi nilai dari Firebase Console → Project settings → Your apps → SDK setup and configuration
// 3. JANGAN commit firebase-config.local.js (sudah ada di .gitignore).
// Saat di-deploy ke Firebase Hosting, berkas ini tidak diperlukan: konfigurasi dibaca dari /__/firebase/init.json

export default {
  apiKey: 'ISI_API_KEY_ANDA',
  authDomain: 'digides-8423e.firebaseapp.com',
  projectId: 'digides-8423e',
  storageBucket: 'digides-8423e.firebasestorage.app',
  messagingSenderId: '518136495130',
  appId: 'ISI_APP_ID_ANDA',
};
