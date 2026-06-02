// ============================================================
// firebase_options.dart — Buruan Sae 2.0 Mobile
//
// FILE INI ADALAH PLACEHOLDER.
// Ganti isinya dengan menjalankan perintah berikut di folder mobile/:
//
//   dart pub global activate flutterfire_cli
//   flutterfire configure --project=NAMA_PROJECT_FIREBASE_ANDA
//
// File ini akan di-overwrite otomatis oleh flutterfire configure.
// ============================================================

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions tidak mendukung platform ini: $defaultTargetPlatform\n'
          'Jalankan: flutterfire configure',
        );
    }
  }

  // ── Ganti nilai di bawah dengan output dari: flutterfire configure ──────────
  // Ambil dari: Firebase Console → Project Settings → General → Your apps

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'GANTI_ANDROID_API_KEY',
    appId: 'GANTI_ANDROID_APP_ID',           // format: 1:xxxx:android:xxxx
    messagingSenderId: 'GANTI_SENDER_ID',
    projectId: 'GANTI_PROJECT_ID',
    storageBucket: 'GANTI_PROJECT_ID.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'GANTI_IOS_API_KEY',
    appId: 'GANTI_IOS_APP_ID',               // format: 1:xxxx:ios:xxxx
    messagingSenderId: 'GANTI_SENDER_ID',
    projectId: 'GANTI_PROJECT_ID',
    storageBucket: 'GANTI_PROJECT_ID.appspot.com',
    iosBundleId: 'com.buruansae.app',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'GANTI_MACOS_API_KEY',
    appId: 'GANTI_MACOS_APP_ID',
    messagingSenderId: 'GANTI_SENDER_ID',
    projectId: 'GANTI_PROJECT_ID',
    storageBucket: 'GANTI_PROJECT_ID.appspot.com',
    iosBundleId: 'com.buruansae.app',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'GANTI_WEB_API_KEY',
    appId: 'GANTI_WEB_APP_ID',
    messagingSenderId: 'GANTI_SENDER_ID',
    projectId: 'GANTI_PROJECT_ID',
    storageBucket: 'GANTI_PROJECT_ID.appspot.com',
    authDomain: 'GANTI_PROJECT_ID.firebaseapp.com',
  );
}
