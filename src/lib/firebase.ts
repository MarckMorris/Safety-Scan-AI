
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

// --- Start of Configuration Validation Logic ---
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

// Mock User object, consistent with AuthContext's mock user for Firestore rule testing
const mockUserForFirebaseAuth: User = {
  uid: 'mockUser123', // Matches the uid in AuthContext
  email: 'test@example.com',
  displayName: 'Mock User (Admin)', // Matches displayName in AuthContext
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: { creationTime: new Date().toISOString(), lastSignInTime: new Date().toISOString() },
  providerData: [{
    providerId: 'password',
    uid: 'test@example.com',
    displayName: 'Mock User (Admin)',
    email: 'test@example.com',
    phoneNumber: null,
    photoURL: null,
  }],
  refreshToken: 'mockRefreshToken',
  tenantId: null,
  delete: async () => { console.warn('Mock user delete called'); Promise.resolve(); },
  getIdToken: async () => 'mockIdToken',
  getIdTokenResult: async () => ({ token: 'mockIdToken', expirationTime: (new Date().getTime() + 3600*1000).toString(), issuedAtTime: new Date().getTime().toString(), signInProvider: 'password', signInSecondFactor: null, claims: { role: 'admin' } }),
  reload: async () => { console.warn('Mock user reload called'); Promise.resolve(); },
  toJSON: () => ({ uid: 'mockUser123', email: 'test@example.com', displayName: 'Mock User (Admin)' }),
};


const mockAuth = {
  createUserWithEmailAndPassword: async (authInstance: any, email: string, pass: string): Promise<UserCredential> => {
    console.warn('Mock createUserWithEmailAndPassword called for:', email);
    // @ts-ignore
    return Promise.resolve({ user: { ...mockUserForFirebaseAuth, email }, operationType: 'signIn' });
  },
  signInWithEmailAndPassword: async (authInstance: any, email: string, pass: string): Promise<UserCredential> => {
    console.warn('Mock signInWithEmailAndPassword called for:', email);
    // @ts-ignore
    return Promise.resolve({ user: { ...mockUserForFirebaseAuth, email }, operationType: 'signIn' });
  },
  sendPasswordResetEmail: async (authInstance: any, email: string): Promise<void> => {
    console.warn('Mock sendPasswordResetEmail called for:', email);
    return Promise.resolve();
  },
  onAuthStateChanged: (authInstance: any, callback: (user: User | null) => void): (() => void) => {
    console.warn('Mock onAuthStateChanged called. AuthContext provides mock user.');
    // callback(mockUserForFirebaseAuth); // This could be called to simulate an auth state change
    return () => { console.warn('Mock onAuthStateChanged unsubscribed.'); };
  },
  signOut: async (authInstance: any): Promise<void> => {
    console.warn('Mock signOut called from firebase.ts instance');
    // In a real scenario, this would also update currentUser to null
    if (mockAuth.currentUser) {
        // mockAuth.currentUser = null; // This line might cause issues if not handled carefully with React state
        console.warn("Simulated mockAuth.currentUser to null. App state managed by AuthContext.");
    }
    return Promise.resolve();
  },
  currentUser: mockUserForFirebaseAuth, // Set currentUser to the mock user
  // Add other methods that might be called on 'auth' directly if needed
  updateProfile: async (user: User, profile: { displayName?: string | null, photoURL?: string | null }) => {
    console.warn('Mock auth.updateProfile called for user:', user.uid, 'with profile:', profile);
    if (mockAuth.currentUser && mockAuth.currentUser.uid === user.uid) {
        mockAuth.currentUser.displayName = profile.displayName ?? mockAuth.currentUser.displayName;
        mockAuth.currentUser.photoURL = profile.photoURL ?? mockAuth.currentUser.photoURL;
    }
    return Promise.resolve();
  },
  updateEmail: async (user: User, newEmail: string) => {
    console.warn('Mock auth.updateEmail called for user:', user.uid, 'to new email:', newEmail);
     if (mockAuth.currentUser && mockAuth.currentUser.uid === user.uid) {
        mockAuth.currentUser.email = newEmail;
    }
    return Promise.resolve();
  }
};

const auth = mockAuth as any; 

let db: Firestore;
let storage: FirebaseStorage;

try {
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e: any) {
    console.error("Error getting Firestore/Storage services after app initialization:", e.message);
    db = {} as Firestore; 
    storage = {} as FirebaseStorage;
}

export { app, auth, db, storage };
