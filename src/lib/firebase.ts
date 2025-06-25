
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
// AppCheck is temporarily commented out to simplify debugging the core connection.
// import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// --- ROBUST DIAGNOSTIC LOGGING ---
console.log("\n\n\n");
console.log("====================================================");
console.log("[Firebase Setup] INITIALIZING FIREBASE CONNECTION...");
console.log("====================================================");
console.log("[Firebase Setup] Reading configuration from environment variables (.env.local):");
console.log("----------------------------------------------------");
Object.entries(firebaseConfig).forEach(([key, value]) => {
    console.log(`[Firebase Setup] ${key}: ${value ? `'${value}'` : '>> UNDEFINED <<'}`);
});
console.log("----------------------------------------------------");
// --- END LOGGING ---


let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
// let appCheckInstance: AppCheck | undefined;
let isFirebaseInitialized = false;

const isConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YOUR');

if (isConfigValid) {
  console.log("[Firebase Setup] Core config values basic check PASSED.");
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log("[Firebase Setup] Firebase app initialized SUCCESSFULLY.");
    } else {
      app = getApps()[0];
      console.log("[Firebase Setup] Existing Firebase app instance retrieved.");
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseInitialized = true;
    console.log("[Firebase Setup] Auth, Firestore, and Storage services attached SUCCESSFULLY.");

  } catch (e) {
      console.error("[Firebase Setup] CRITICAL ERROR during Firebase initialization, even with seemingly valid config:", e);
  }

} else {
    console.error("\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!!! [Firebase Setup] FIREBASE CONFIG IS INVALID !!!!");
    console.error("!!!! Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_... values are correct.");
    console.error("!!!! After fixing, YOU MUST RESTART the development server.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n");
}


export { app, auth, db, storage, isFirebaseInitialized };
