
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start loading as true
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // This case might happen if a user exists in Firebase Auth but not Firestore
          // e.g. manual deletion of Firestore doc or incomplete registration.
          // For now, we'll set a basic profile. A more robust solution might create it.
           console.warn(`No Firestore profile found for user ${firebaseUser.uid}. This might be an incomplete registration or social auth without profile creation step.`);
           // A default profile or null, depending on desired behavior.
           // Setting to a default helps avoid errors in components expecting userProfile.
           const defaultProfile: UserProfile = {
             uid: firebaseUser.uid,
             email: firebaseUser.email,
             displayName: firebaseUser.displayName || 'New User',
             role: 'user', // Default role
           };
           // Optionally create it in Firestore if it's missing
           // await setDoc(userDocRef, defaultProfile);
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
    try {
      await firebaseSignOut(auth);
      // setUser(null); // onAuthStateChanged will handle this
      // setUserProfile(null); // onAuthStateChanged will handle this
      router.push('/auth/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle logout error (e.g., show a toast)
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout }}>
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
