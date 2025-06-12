
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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ==========================================================================
// !! CRITICAL FIREBASE CONFIGURATION CHECK !!
// ==========================================================================
console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
console.log("!!! VALIDATE YOUR FIREBASE CONFIGURATION BELOW (.env.local) !!!");
console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
console.log("Raw Environment Variables Being Read by src/lib/firebase.ts:");
console.log(`- NEXT_PUBLIC_FIREBASE_API_KEY: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_PROJECT_ID: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_APP_ID: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}"`);
console.log(`- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}" (Optional for Auth)`);
console.log("------------------------------------------------------------");

const criticalConfigKeys: (keyof typeof firebaseConfigValues)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
let isConfigValid = true;
const missingOrPlaceholderKeys: string[] = [];

for (const key of criticalConfigKeys) {
  const value = firebaseConfigValues[key];
  // Check for undefined, null, empty string, or common placeholder patterns
  if (!value || value.trim() === "" || value.includes("YOUR_") || value.includes("your_")) {
    isConfigValid = false;
    missingOrPlaceholderKeys.push(`NEXT_PUBLIC_FIREBASE_${key.toUpperCase().replace("ID", "_ID").replace("KEY", "_KEY").replace("DOMAIN", "_DOMAIN")}`); // Attempt to match .env format
    console.error(`!!! CRITICAL PROBLEM: Firebase config key '${key}' is missing, empty, or still a placeholder: "${value}"`);
  }
}

if (!isConfigValid) {
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("!!! FIREBASE INITIALIZATION WILL FAIL due to missing/placeholder values in .env.local for:");
  console.error(`!!! ${missingOrPlaceholderKeys.join(', ')}`);
  console.error("!!! 1. Ensure '.env.local' is in your project root.");
  console.error("!!! 2. Ensure ALL 'NEXT_PUBLIC_FIREBASE_...' variables are filled with REAL values from your Firebase Console.");
  console.error("!!! 3. RESTART your Next.js server (Ctrl+C, then npm run dev) after changes.");
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
} else {
  console.log("Firebase configuration appears to have values for all critical keys.");
  console.log("If errors persist, ensure these values EXACTLY MATCH your Firebase project console and RESTART your server.");
}
console.log("==========================================================================");


let app: FirebaseApp;
// We will let initializeApp try and potentially fail,
// as the logs above should guide the user to the .env.local problem.
// Throwing a custom error here might prevent Firebase's own, potentially more specific, error messages.

if (!getApps().length) {
  // Pass the potentially problematic config to see Firebase's reaction
  app = initializeApp(firebaseConfigValues);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
