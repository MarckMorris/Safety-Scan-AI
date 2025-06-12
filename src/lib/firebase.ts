
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// import { getFunctions, Functions } from 'firebase/functions'; // If using Firebase Functions

// Log all Firebase config values being loaded by the app for debugging
console.log("============================================================");
console.log("DEBUG: Firebase Configuration being used by the App");
console.log("------------------------------------------------------------");
console.log(`NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`);
console.log(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
console.log(`NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
console.log(`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
console.log(`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}`);
console.log(`NEXT_PUBLIC_FIREBASE_APP_ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`);
console.log(`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`);
console.log("============================================================");
console.log("IF ANY OF THE ABOVE VALUES ARE 'undefined' OR STILL PLACEHOLDERS LIKE 'YOUR_PROJECT_ID',");
console.log("PLEASE CHECK YOUR .env.local FILE AND RESTART THE SERVER.");
console.log("Ensure that .env.local is in the project root and all NEXT_PUBLIC_FIREBASE_... variables are correctly set with your actual Firebase project credentials.");
console.log("============================================================");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
// const functions: Functions = getFunctions(app); // If using Firebase Functions

export { app, auth, db, storage }; // export functions if used
