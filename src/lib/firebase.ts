
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const criticalConfigKeys: (keyof typeof firebaseConfigValues)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
let isConfigValid = true;
const missingOrInvalidKeys: string[] = [];

for (const key of criticalConfigKeys) {
  const value = firebaseConfigValues[key];
  if (!value || value.trim() === "" || value.includes("YOUR_") || value.includes("your_") || value.startsWith("[") || value.startsWith("Firebase")) {
    isConfigValid = false;
    missingOrInvalidKeys.push(key);
  }
}

if (!isConfigValid) {
  const errorMessage = `
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!! FIREBASE INITIALIZATION CRITICAL ERROR !!!
------------------------------------------------------------------------------
The following Firebase environment variables in '.env.local' are missing,
empty, or still set to placeholder values:
${missingOrInvalidKeys.map(k => `  - NEXT_PUBLIC_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join('\n')}

Please take the following steps:
1. Ensure your '.env.local' file is in the ROOT directory of your project.
2. Open '.env.local' and verify that ALL 'NEXT_PUBLIC_FIREBASE_...'
   variables are filled with the CORRECT, ACTUAL values from your
   Firebase project console (Project settings > General > Your apps > Config).
3. After saving changes to '.env.local', you MUST RESTART your
   Next.js development server (Ctrl+C in the terminal, then 'npm run dev').

Firebase cannot connect without the correct configuration.
The application will now halt.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`;
  console.error(errorMessage);
  throw new Error(`Firebase configuration error: Missing or placeholder values for ${missingOrInvalidKeys.join(', ')}. Check server logs and .env.local.`);
} else {
  console.log("[Firebase Setup] Firebase core config values check passed. Values:", firebaseConfigValues);
}

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfigValues as any);
    console.log("[Firebase Setup] Firebase App initialized successfully.");
  } catch (e: any) {
    console.error("[Firebase Setup] CRITICAL: Firebase initializeApp(config) FAILED:", e.message, e);
    throw e;
  }
} else {
  app = getApps()[0];
  console.log("[Firebase Setup] Existing Firebase App instance retrieved.");
}

let appCheckInstance: AppCheck | undefined;
if (typeof window !== "undefined") {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  console.log(`[Firebase App Check] NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY from .env.local: '${recaptchaSiteKey}'`);

  if (recaptchaSiteKey && recaptchaSiteKey.trim() !== "" && !recaptchaSiteKey.includes("your_actual_recaptcha_v3_site_key_here") && !recaptchaSiteKey.startsWith("PASTE") && !recaptchaSiteKey.startsWith("YOUR")) {
    console.log("[Firebase App Check] Valid reCAPTCHA v3 site key found. Attempting to initialize App Check...");
    try {
      // Ensure that 'self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;' is not set in production.
      // It's for debugging App Check in non-localhost environments if you don't have reCAPTCHA setup yet.
      // (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NODE_ENV === 'development' ? true : undefined; // Example for debug token

      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[Firebase App Check] Firebase App Check initialized successfully with reCAPTCHA v3. App Check instance:", appCheckInstance);
    } catch (e: any) {
      console.error("[Firebase App Check] Firebase App Check initialization FAILED. Error Name:", e.name, "Message:", e.message, "Stack:", e.stack);
      console.error("[Firebase App Check] THIS IS LIKELY THE CAUSE OF AUTH ERRORS if App Check is enforced in Firebase console.");
    }
  } else {
    if (!recaptchaSiteKey || recaptchaSiteKey.trim() === "") {
        console.warn("[Firebase App Check] App Check NOT initialized: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is MISSING or EMPTY in .env.local.");
    } else {
        console.warn(`[Firebase App Check] App Check NOT initialized: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY ('${recaptchaSiteKey}') appears to be a PLACEHOLDER value.`);
    }
    console.warn("[Firebase App Check] If App Check (e.g., for Authentication) is ENFORCED in your Firebase project console, auth operations WILL LIKELY FAIL with errors like 'authInstance._getRecaptchaConfig is not a function' or similar network errors.");
    console.warn("[Firebase App Check] To fix: 1. Get a reCAPTCHA v3 Site Key. 2. Set NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY in .env.local. 3. Configure App Check in Firebase console with this key and ENFORCE for services.");
  }
} else {
    console.log("[Firebase App Check] Not in browser environment, skipping App Check initialization.");
}

let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  auth = getAuth(app);
  console.log("[Firebase Setup] Firebase Auth service initialized successfully. Auth instance:", auth);
  if(appCheckInstance) {
    console.log("[Firebase Setup] App Check was initialized, Auth instance should be App Check-aware.");
  } else if (typeof window !== 'undefined') {
    console.warn("[Firebase Setup] Auth service initialized, but App Check was NOT. Potential issues if App Check is enforced.");
  }
} catch (e: any) {
    const errorMsg = `[Firebase Setup] CRITICAL: Failed to initialize Firebase Auth service: ${e.message}. This usually means your Firebase project configuration is incorrect or the Auth service is not enabled. The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

try {
  db = getFirestore(app);
  console.log("[Firebase Setup] Firestore service initialized successfully.");
} catch (e: any) {
    const errorMsg = `[Firebase Setup] CRITICAL: Failed to initialize Firestore service: ${e.message}. This usually means your Firebase project configuration (especially 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' in .env.local) is incorrect or the project doesn't exist. The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

try {
  storage = getStorage(app);
  console.log("[Firebase Setup] Firebase Storage service initialized successfully.");
} catch (e: any) {
    const errorMsg = `[Firebase Setup] CRITICAL: Failed to initialize Firebase Storage service: ${e.message}. Check Firebase project setup (especially 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'). The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

export { app, auth, db, storage, appCheckInstance };
