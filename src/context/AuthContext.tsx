
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, onSnapshot, addDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db, isFirebaseInitialized } from '@/lib/firebase';
import type { UserProfile, Scan, AIScanResult } from '@/types';
import { scanUrlForVulnerabilities } from '@/ai/flows/scan-url-for-vulnerabilities';

const CONFIG_ERROR_MESSAGE = "Firebase configuration is invalid. Please check your .env.local file and restart the development server.";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  scans: Scan[];
  loading: boolean;
  logout: () => Promise<void>;
  registerUser: (displayName: string, email: string, password: string) => Promise<{ error?: string }>;
  signInUser: (email: string, password: string) => Promise<{ error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  startNewScan: (targetUrl: string) => Promise<string>;
  updateScan: (scanId: string, updates: Partial<Scan>) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseInitialized) {
      console.error(CONFIG_ERROR_MESSAGE);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUserProfile(userDocSnap.data() as UserProfile);
            } else {
              // Handle case where user exists in Auth but not Firestore
              const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: 'user',
              };
              await setDoc(userDocRef, newUserProfile);
              setUserProfile(newUserProfile);
            }
        } catch (error) {
            console.error("Firestore Error: Failed to get user document.", error);
            console.error("This may be due to Firestore not being enabled in your Firebase project, or incorrect security rules. Please check the Firebase console.");
            // Prevent app from being stuck in a loading state
            setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setScans([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile && isFirebaseInitialized) {
      const scansCollectionRef = collection(db, 'users', userProfile.uid, 'scans');
      const q = query(scansCollectionRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userScans: Scan[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            userScans.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as Scan);
        });
        setScans(userScans);
      }, (error) => {
        console.error("Error fetching scans:", error);
        if (error.code === 'failed-precondition') {
            console.error("This can happen if Firestore indexes are not set up.");
        }
      });

      return () => unsubscribe();
    }
  }, [userProfile]);

  const logout = async () => {
    if (!isFirebaseInitialized) return;
    await signOut(auth);
    router.push('/auth/login');
  };

  const registerUser = async (displayName: string, email: string, password: string) => {
    if (!isFirebaseInitialized) {
      return { error: CONFIG_ERROR_MESSAGE };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName });

      const userProfileData: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        role: 'user',
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfileData);
      return {};
    } catch (error: any) {
       if (error.code === 'auth/configuration-not-found') {
        return { error: CONFIG_ERROR_MESSAGE };
      }
      return { error: error.message };
    }
  };

  const signInUser = async (email: string, password: string) => {
    if (!isFirebaseInitialized) {
      return { error: CONFIG_ERROR_MESSAGE };
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: any) {
       if (error.code === 'auth/configuration-not-found') {
        return { error: CONFIG_ERROR_MESSAGE };
      }
      return { error: error.message };
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!isFirebaseInitialized) {
      return { error: CONFIG_ERROR_MESSAGE };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return {};
    } catch (error: any) {
       if (error.code === 'auth/configuration-not-found') {
        return { error: CONFIG_ERROR_MESSAGE };
      }
      return { error: error.message };
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile || !isFirebaseInitialized) return { error: "User not authenticated or Firebase not configured." };

    try {
        if(updates.displayName && user.displayName !== updates.displayName) {
            await updateProfile(user, { displayName: updates.displayName });
        }
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, updates);
        setUserProfile(prev => prev ? { ...prev, ...updates } : null);
        return {};
    } catch(error: any) {
        return {error: error.message};
    }
  };
  
  const updateScan = useCallback(async (scanId: string, updates: Partial<Scan>) => {
    if (!user || !isFirebaseInitialized) return;
    const scanDocRef = doc(db, 'users', user.uid, 'scans', scanId);
    await updateDoc(scanDocRef, { ...updates, updatedAt: serverTimestamp() });
  }, [user]);

  const startNewScan = async (targetUrl: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (!isFirebaseInitialized) throw new Error(CONFIG_ERROR_MESSAGE);

    const newScanRef = await addDoc(collection(db, 'users', user.uid, 'scans'), {
      userId: user.uid,
      targetUrl,
      status: 'queued',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Process in background
    (async () => {
        try {
            await updateScan(newScanRef.id, { status: 'scanning' });
            const aiScanResult: AIScanResult = await scanUrlForVulnerabilities({ url: targetUrl });
            console.log(`AI Scan successful for ${newScanRef.id}`, aiScanResult);
            await updateScan(newScanRef.id, { status: 'completed', aiScanResult });
        } catch (error: any) {
            console.error(`Error during scan for ${newScanRef.id}:`, error);
            await updateScan(newScanRef.id, { status: 'failed', errorMessage: error.message || "Unknown error" });
        }
    })();

    return newScanRef.id;
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        userProfile, 
        scans,
        loading, 
        logout, 
        registerUser, 
        signInUser, 
        sendPasswordReset,
        startNewScan,
        updateScan,
        updateUserProfile
    }}>
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
