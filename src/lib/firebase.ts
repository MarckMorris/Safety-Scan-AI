import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log the configuration being used - VERY IMPORTANT FOR DEBUGGING
console.log("[Firebase Setup] USING THE FOLLOWING FIREBASE CONFIGURATION:");
console.log("----------------------------------------------------");
Object.entries(firebaseConfigValues).forEach(([key, value]) => {
  console.log(`[Firebase Setup] ${key}: '${value}'`);
});
console.log("----------------------------------------------------");
console.log("[Firebase Setup] IF ANY OF THE ABOVE VALUES ARE UNDEFINED, EMPTY, OR PLACEHOLDERS (e.g., 'YOUR_API_KEY'), \n[Firebase Setup] PLEASE CHECK YOUR '.env.local' FILE AND RESTART THE SERVER.");


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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let appCheckInstance: AppCheck | undefined;

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
THE APPLICATION WILL NOT FUNCTION CORRECTLY.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`;
  console.error(errorMessage);
  // We are NOT throwing an error here to allow the server to start.
  // The app will fail at runtime when Firebase services (which will be null) are used.
} else {
  console.log("[Firebase Setup] Firebase core config values basic check passed (not empty, not obvious placeholders).");

  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfigValues as any);
      console.log("[Firebase Setup] Firebase App initialized successfully with the logged configuration.");
    } catch (e: any) {
      console.error("[Firebase Setup] CRITICAL: Firebase initializeApp(config) FAILED. This usually means the provided configuration is fundamentally incorrect (e.g., malformed project ID). Error:", e.message);
      app = null; // Ensure app is null on failure
    }
  } else {
    app = getApps()[0];
    console.log("[Firebase Setup] Existing Firebase App instance retrieved.");
  }

  // Initialize other services only if the app object is valid
  if (app) {
    try {
      auth = getAuth(app);
      console.log("[Firebase Setup] Firebase Auth service instance retrieved/initialized successfully.");
    } catch (e: any) {
        console.error(`[Firebase Setup] CRITICAL: Failed to initialize Firebase Auth service: ${e.message}.`);
        auth = null;
    }

    try {
      db = getFirestore(app);
      console.log("[Firebase Setup] Firestore service initialized successfully.");
    } catch (e: any) {
        console.error(`[Firebase Setup] CRITICAL: Failed to initialize Firestore service: ${e.message}.`);
        db = null;
    }

    try {
      storage = getStorage(app);
      console.log("[Firebase Setup] Firebase Storage service initialized successfully.");
    } catch (e: any) {
        console.error(`[Firebase Setup] CRITICAL: Failed to initialize Firebase Storage service: ${e.message}.`);
        storage = null;
    }
    
    // App Check Initialization
    if (typeof window !== "undefined") {
      const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
      console.log(`[Firebase App Check] NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY from .env.local: '${recaptchaSiteKey}'`);

      if (recaptchaSiteKey && recaptchaSiteKey.trim() !== "" && !recaptchaSiteKey.includes("your_actual_recaptcha_v3_site_key_here") && !recaptchaSiteKey.startsWith("PASTE") && !recaptchaSiteKey.startsWith("YOUR")) {
        console.log("[Firebase App Check] Valid reCAPTCHA v3 site key found. Attempting to initialize App Check...");
        try {
          appCheckInstance = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(recaptchaSiteKey),
            isTokenAutoRefreshEnabled: true,
          });
          console.log("[Firebase App Check] Firebase App Check initialized successfully with reCAPTCHA v3.");
        } catch (e: any) {
          console.error("[Firebase App Check] Firebase App Check initialization FAILED. Error:", e.message);
          console.error("[Firebase App Check] THIS IS LIKELY THE CAUSE OF AUTH ERRORS if App Check is enforced in Firebase console.");
        }
      } else {
          if (!recaptchaSiteKey || recaptchaSiteKey.trim() === "") {
              console.warn("[Firebase App Check] App Check NOT initialized: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is MISSING or EMPTY in .env.local.");
          } else {
              console.warn(`[Firebase App Check] App Check NOT initialized: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY ('${recaptchaSiteKey}') appears to be a PLACEHOLDER value.`);
          }
          console.warn("[Firebase App Check] If App Check is ENFORCED for Authentication in your Firebase project, auth operations WILL LIKELY FAIL.");
      }
    }
  }
}

export { app, auth, db, storage, appCheckInstance };
