
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
// import { getAuth, Auth } from 'firebase/auth'; // Original Auth import
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import type { UserCredential, User } from 'firebase/auth'; // Keep types for mock

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// --- Start of Configuration Validation Logic (slightly simplified for this pass) ---
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
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`;
  console.error(errorMessage);
  // Throw an error to halt initialization if critical config is missing/invalid
  // This helps make the problem very explicit.
  throw new Error(`Firebase configuration error: Missing or placeholder values for ${missingOrInvalidKeys.join(', ')}. Check server logs and .env.local.`);
} else {
  console.log("Firebase config values (pre-initialization check passed):", firebaseConfigValues);
}
// --- End of Configuration Validation Logic ---


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

// Mock Auth object
const mockUser: User = {
  uid: 'mockUser123',
  email: 'test@example.com',
  displayName: 'Mock User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mockIdToken',
  getIdTokenResult: async () => ({ token: 'mockIdToken', expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
  reload: async () => {},
  toJSON: () => ({}),
  getPhoneNumber: () => null,
  getIdTokenRefreshTime: () => null, // Added for completeness, might not exist on older SDKs or type
  providerId: 'password', // Typically 'password' for email/pass
};

const mockAuth = {
  createUserWithEmailAndPassword: async (authInstance: any, email: string, pass: string): Promise<UserCredential> => {
    console.warn('Mock createUserWithEmailAndPassword called for:', email);
    return Promise.resolve({ user: { ...mockUser, email }, operationType: 'signIn' });
  },
  signInWithEmailAndPassword: async (authInstance: any, email: string, pass: string): Promise<UserCredential> => {
    console.warn('Mock signInWithEmailAndPassword called for:', email);
    return Promise.resolve({ user: { ...mockUser, email }, operationType: 'signIn' });
  },
  sendPasswordResetEmail: async (authInstance: any, email: string): Promise<void> => {
    console.warn('Mock sendPasswordResetEmail called for:', email);
    return Promise.resolve();
  },
  onAuthStateChanged: (authInstance: any, callback: (user: User | null) => void): (() => void) => {
    console.warn('Mock onAuthStateChanged called. AuthContext will provide mock user instead.');
    // To avoid issues with AuthContext trying to use this, it's better if AuthContext doesn't call it.
    // For now, let's simulate no user being returned by this, as AuthContext is the source of truth.
    // callback(null); // Or call with mock user if AuthContext relied on this.
    return () => { console.warn('Mock onAuthStateChanged unsubscribed.'); }; // Return an unsubscribe function
  },
  signOut: async (authInstance: any): Promise<void> => {
    console.warn('Mock signOut called');
    return Promise.resolve();
  },
  currentUser: null, // Set to null as AuthContext will provide the mock user.
  // Add other methods if they are directly called on the 'auth' object and cause errors.
  // For example, if updateProfile is used as auth.updateProfile (it's usually firebaseAuth.updateProfile(user, ...))
};

const auth = mockAuth as any; // Cast to Auth to satisfy type checks elsewhere

let db: Firestore;
let storage: FirebaseStorage;

try {
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e: any) {
    console.error("Error getting Firestore/Storage services after app initialization:", e.message);
    // Depending on how critical these are, you might throw or provide mocks too.
    // For now, let them fail if app init passed but service init fails.
    // This allows testing features that don't rely on db/storage.
    db = {} as Firestore; // Provide dummy to prevent hard crash if referenced
    storage = {} as FirebaseStorage;
}

export { app, auth, db, storage };
