
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional for core functionality but good to have
};

// Log the raw environment variables being read by this file for debugging
console.log("==========================================================================");
console.log("DEBUG: Firebase Configuration Variables Being Read by src/lib/firebase.ts:");
console.log(`- NEXT_PUBLIC_FIREBASE_API_KEY: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_PROJECT_ID: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_APP_ID: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"`);
console.log("--------------------------------------------------------------------------");

const criticalConfigKeys: (keyof typeof firebaseConfigValues)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
let isConfigValid = true;
const missingOrPlaceholderKeys: string[] = [];

for (const key of criticalConfigKeys) {
  const value = firebaseConfigValues[key];
  if (!value || value.trim() === "" || value.includes("YOUR_") || value.includes("your_") || value.startsWith("[") || value.startsWith("Firebase")) {
    isConfigValid = false;
    missingOrPlaceholderKeys.push(`NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
  }
}

if (!isConfigValid) {
  const errorMessage = `
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!! FIREBASE INITIALIZATION FAILED !!!
------------------------------------------------------------------------------
One or more critical Firebase environment variables are missing, empty, or
still set to placeholder values in your '.env.local' file.

Problematic Variable(s):
${missingOrPlaceholderKeys.map(k => `  - ${k}: Value is "${process.env[k] || 'MISSING or NOT A STRING'}"`).join('\n')}

Please take the following steps:
1. Ensure your '.env.local' file is in the ROOT directory of your project.
2. Open '.env.local' and verify that ALL 'NEXT_PUBLIC_FIREBASE_...'
   variables are filled with the CORRECT, ACTUAL values from your
   Firebase project console (Project settings > General > Your apps > Config).
3. Specifically, ensure the following are not placeholders like "YOUR_...":
   ${missingOrPlaceholderKeys.join(', \n   ')}
4. After saving changes to '.env.local', you MUST RESTART your
   Next.js development server (Ctrl+C in the terminal, then 'npm run dev').

Firebase cannot connect without the correct configuration.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
`;
  console.error(errorMessage);
  // Throw an error to halt further execution with bad config
  // This makes the problem very explicit if running client-side or during build.
  // For server-side rendering, this log might be the primary indicator.
  if (typeof window !== 'undefined') {
     // Only throw client-side to prevent build failures if server-side checks pass initially
     // but client tries to re-evaluate. The console.error is the main signal.
  }
  // For a stricter approach, you could unconditionally throw:
  // throw new Error("Firebase configuration error. Check server logs for details.");
  // However, the detailed console.error above is often more immediately useful to the developer.
  // The app will likely fail later when 'auth', 'db', or 'storage' are used if not properly initialized.
} else {
  console.log("Firebase configuration variables appear to have values for all critical keys.");
  console.log("If Firebase errors persist, ensure these values EXACTLY MATCH your Firebase project console and RESTART your server.");
}
console.log("==========================================================================");


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  // It's crucial that firebaseConfigValues are correct here.
  // If they are not, initializeApp will likely throw its own error.
  try {
    app = initializeApp(firebaseConfigValues as any); // Cast as any if some optional ones might be undefined
                                                    // but critical ones were checked.
  } catch (e: any) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! Firebase initializeApp(config) FAILED! This usually means the provided values in .env.local, even if present, are not valid for Firebase.");
    console.error("!!! Double-check:");
    console.error("!!!   - API Key validity");
    console.error("!!!   - Auth Domain format (e.g., your-project-id.firebaseapp.com)");
    console.error("!!!   - Project ID correctness");
    console.error("!!!   - App ID format");
    console.error("!!! Ensure values EXACTLY MATCH your Firebase project console and RESTART your server.");
    console.error("!!! Original Firebase SDK error:", e.message);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    // Re-throw or handle as appropriate for your app's error strategy
    throw e;
  }
} else {
  app = getApps()[0];
}

let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e: any) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! Error getting Firebase services (Auth, Firestore, Storage) after app initialization.");
    console.error("!!! This can happen if initializeApp succeeded but services are misconfigured or disabled in your Firebase project.");
    console.error("!!! Check your Firebase console settings.");
    console.error("!!! Original Firebase SDK error:", e.message);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    throw e;
}


export { app, auth, db, storage };
