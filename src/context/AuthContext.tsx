
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { auth, db, isFirebaseInitialized } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  registerUser: (displayName: string, email: string, password: string) => Promise<{ error?: string }>;
  signInUser: (email: string, password: string) => Promise<{ error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CONFIG_ERROR_MESSAGE = "Firebase configuration is invalid. Please check your `.env.local` file and restart the development server.";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseInitialized) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db as Firestore, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
           const defaultProfile: UserProfile = {
             uid: firebaseUser.uid,
             email: firebaseUser.email,
             displayName: firebaseUser.displayName || 'New User',
             role: 'user',
           };
           await setDoc(userDocRef, defaultProfile);
           setUserProfile(defaultProfile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (!isFirebaseInitialized || !auth) return;
    try {
      await firebaseSignOut(auth);
      router.push('/auth/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const registerUser = async (displayName: string, email: string, password: string) => {
    if (!isFirebaseInitialized) {
      return { error: CONFIG_ERROR_MESSAGE };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName }); 
      
      const userProfileData: UserProfile = { 
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        role: 'user', 
      };
      await setDoc(doc(db!, "users", user.uid), userProfileData);

      return {};
    } catch (error: any) {
      console.error("Registration error", error);
      if (error.code === 'auth/email-already-in-use') {
        return { error: "This email address is already in use. Please try another one or log in." };
      }
      if (error.code === 'auth/configuration-not-found') {
        return { error: CONFIG_ERROR_MESSAGE };
      }
      return { error: "An unexpected error occurred during registration." };
    }
  };

  const signInUser = async (email: string, password: string) => {
    if (!isFirebaseInitialized) {
      return { error: CONFIG_ERROR_MESSAGE };
    }
    try {
      await signInWithEmailAndPassword(auth!, email, password);
      return {};
    } catch (error: any) {
      console.error("Login error", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { error: "Invalid email or password. Please check your credentials and try again." };
      }
      if (error.code === 'auth/configuration-not-found') {
        return { error: CONFIG_ERROR_MESSAGE };
      }
      return { error: "An unexpected error occurred during sign-in." };
    }
  };
  
  const sendPasswordReset = async (email: string) => {
    if (!isFirebaseInitialized) {
        return { error: CONFIG_ERROR_MESSAGE };
    }
    try {
      await sendPasswordResetEmail(auth!, email);
      return {};
    } catch (error: any) {
      console.error("Password reset error", error);
       if (error.code === 'auth/configuration-not-found') {
        return { error: CONFIG_ERROR_MESSAGE };
      }
      return { error: "An unexpected error occurred while sending the reset email." };
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout, registerUser, signInUser, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
