
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
  console.log("[Firebase Setup] Firebase core config values basic check passed (not empty, not obvious placeholders).");
}

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfigValues as any); // Type assertion as a temporary measure if some optional keys are undefined
    console.log("[Firebase Setup] Firebase App initialized successfully with the logged configuration.");
  } catch (e: any) {
    console.error("[Firebase Setup] CRITICAL: Firebase initializeApp(config) FAILED. This usually means the provided configuration is fundamentally incorrect (e.g., malformed project ID). Error:", e.message, e);
    throw e;
  }
} else {
  app = getApps()[0];
  console.log("[Firebase Setup] Existing Firebase App instance retrieved.");
}

// App Check Initialization (moved before getAuth)
let appCheckInstance: AppCheck | undefined;
if (typeof window !== "undefined") {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  console.log(`[Firebase App Check] NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY from .env.local: '${recaptchaSiteKey}'`);

  if (recaptchaSiteKey && recaptchaSiteKey.trim() !== "" && !recaptchaSiteKey.includes("your_actual_recaptcha_v3_site_key_here") && !recaptchaSiteKey.startsWith("PASTE") && !recaptchaSiteKey.startsWith("YOUR")) {
    console.log("[Firebase App Check] Valid reCAPTCHA v3 site key found. Attempting to initialize App Check...");
    try {
      // For debugging in non-localhost environments if reCAPTCHA isn't set up yet:
      // (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NODE_ENV === 'development' ? true : undefined;
      
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[Firebase App Check] Firebase App Check initialized successfully with reCAPTCHA v3. App Check instance:", appCheckInstance ? "Exists" : "Undefined");
    } catch (e: any) {
      console.error("[Firebase App Check] Firebase App Check initialization FAILED. Error Name:", e.name, "Message:", e.message);
      // console.error("[Firebase App Check] Stack:", e.stack); // Can be very verbose
      console.error("[Firebase App Check] THIS IS LIKELY THE CAUSE OF AUTH ERRORS if App Check is enforced in Firebase console and config is otherwise correct.");
    }
  } else {
    if (!recaptchaSiteKey || recaptchaSiteKey.trim() === "") {
        console.warn("[Firebase App Check] App Check NOT initialized: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is MISSING or EMPTY in .env.local.");
    } else {
        console.warn(`[Firebase App Check] App Check NOT initialized: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY ('${recaptchaSiteKey}') appears to be a PLACEHOLDER value.`);
    }
    console.warn("[Firebase App Check] If App Check (e.g., for Authentication) is ENFORCED in your Firebase project console, auth operations WILL LIKELY FAIL if App Check doesn't initialize.");
  }
} else {
    console.log("[Firebase App Check] Not in browser environment, skipping App Check client initialization.");
}

// Initialize other Firebase services AFTER App Check attempt
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  auth = getAuth(app);
  console.log("[Firebase Setup] Firebase Auth service instance retrieved/initialized successfully. Auth instance:", auth ? "Exists" : "Undefined");
  if(appCheckInstance && typeof window !== 'undefined') {
    console.log("[Firebase Setup] App Check was initialized, Auth instance should be App Check-aware.");
  } else if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY.includes("your_actual_recaptcha_v3_site_key_here"))) {
    console.warn("[Firebase Setup] Auth service initialized, but App Check was NOT (due to missing/placeholder reCAPTCHA key). Potential issues if App Check is enforced for Auth.");
  }
} catch (e: any) {
    const errorMsg = `[Firebase Setup] CRITICAL: Failed to initialize Firebase Auth service: ${e.message}. This can happen if the Firebase app object ('app') is invalid due to prior config errors, or if the Auth service isn't properly enabled/configured in your Firebase project. The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

try {
  db = getFirestore(app);
  console.log("[Firebase Setup] Firestore service initialized successfully.");
} catch (e: any) {
    const errorMsg = `[Firebase Setup] CRITICAL: Failed to initialize Firestore service: ${e.message}. Check Firebase project config (especially 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'). The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

try {
  storage = getStorage(app);
  console.log("[Firebase Setup] Firebase Storage service initialized successfully.");
} catch (e: any) {
    const errorMsg = `[Firebase Setup] CRITICAL: Failed to initialize Firebase Storage service: ${e.message}. Check Firebase project config (especially 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'). The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

export { app, auth, db, storage, appCheckInstance };

