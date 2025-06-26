// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if all necessary environment variables are set
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (isConfigValid) {
  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  // Enable offline persistence
  try {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          console.warn('Firestore persistence failed: multiple tabs open.');
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firestore persistence not supported in this browser.');
        }
      });
  } catch (err) {
    console.error("Error enabling firestore persistence", err);
  }

} else {
  console.error("Firebase configuration is invalid. Please check your .env.local file.");
  // To prevent crashes, we can assign dummy objects, but for now, the app logic
  // relies on `isFirebaseInitialized` to guard calls.
}

// Export a flag to check if Firebase is initialized
const isFirebaseInitialized = isConfigValid;

export { app, auth, db, isFirebaseInitialized };
