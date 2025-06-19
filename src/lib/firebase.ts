
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'; // New import

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
  console.log("Firebase config values (pre-initialization check passed):", firebaseConfigValues);
}

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfigValues as any);
  } catch (e: any) {
    console.error("Firebase initializeApp(config) FAILED:", e.message);
    throw e;
  }
} else {
  app = getApps()[0];
}

// Initialize App Check
// IMPORTANT: For this to work, you MUST:
// 1. Set up reCAPTCHA v3 for your domain in the Google Cloud Console (reCAPTCHA Admin) and get a SITE KEY.
// 2. Add this SITE KEY to your .env.local file as:
//    NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=your_actual_recaptcha_v3_site_key_here
// 3. In the Firebase Console -> App Check -> Apps: Register your web app if not already.
//    Then, select "reCAPTCHA v3" as the provider and enter your Site Key and Secret Key.
// 4. In the Firebase Console -> App Check -> Services (e.g., Authentication, Firestore): Click "Enforce" for relevant services.
//
// The error "authInstance._getRecaptchaConfig is not a function" typically means App Check IS enforced for Authentication
// in the Firebase console, but client-side App Check initialization (below) is missing or failed.
if (typeof window !== "undefined") { // App Check only runs in the browser environment
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  if (recaptchaSiteKey && recaptchaSiteKey !== "your_actual_recaptcha_v3_site_key_here" && recaptchaSiteKey.trim() !== "") {
    try {
      // Pass `app` to initializeAppCheck
      initializeAppCheck(app, { // Make sure `app` is the FirebaseApp instance
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("Firebase App Check initialized successfully with reCAPTCHA v3.");
    } catch (e: any) {
      console.error("Firebase App Check initialization FAILED:", e.message);
      // Depending on your app's needs, you might treat this as a critical error or allow the app to continue.
      // If App Check is strictly enforced for Auth, failures here will likely lead to auth errors.
    }
  } else {
    console.warn("Firebase App Check with reCAPTCHA v3 not initialized: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is not set or is a placeholder in .env.local. If App Check is enforced in Firebase console for services like Authentication, you WILL encounter errors.");
  }
}


let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  auth = getAuth(app);
  console.log("Firebase Auth service initialized successfully.");
} catch (e: any) {
    const errorMsg = `CRITICAL: Failed to initialize Firebase Auth service: ${e.message}. This usually means your Firebase project configuration is incorrect or the Auth service is not enabled. The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

try {
  db = getFirestore(app);
  console.log("Firestore service initialized successfully.");
} catch (e: any) {
    const errorMsg = `CRITICAL: Failed to initialize Firestore service: ${e.message}. This usually means your Firebase project configuration (especially 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' in .env.local) is incorrect or the project doesn't exist. The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

try {
  storage = getStorage(app);
  console.log("Firebase Storage service initialized successfully.");
} catch (e: any) {
    const errorMsg = `CRITICAL: Failed to initialize Firebase Storage service: ${e.message}. Check Firebase project setup (especially 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'). The application will halt.`;
    console.error(errorMsg, e);
    throw new Error(errorMsg);
}

export { app, auth, db, storage };
