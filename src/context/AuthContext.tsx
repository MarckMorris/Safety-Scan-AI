
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, onSnapshot, addDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db, isFirebaseInitialized } from '@/lib/firebase';
import type { UserProfile, Scan, AIScanResult, Project } from '@/types';
import { scanUrlForVulnerabilities } from '@/ai/flows/scan-url-for-vulnerabilities';

const CONFIG_ERROR_MESSAGE = "Firebase configuration is invalid. Please check your .env.local file and restart the development server.";

type AuthErrorState = { code: string; message: string } | null;

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  scans: Scan[];
  projects: Project[];
  loading: boolean;
  authError: AuthErrorState;
  logout: () => Promise<void>;
  registerUser: (displayName: string, email: string, password: string) => Promise<{ error?: string }>;
  signInUser: (email: string, password: string) => Promise<{ error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  startNewScan: (targetUrl: string) => Promise<string>;
  updateScan: (scanId: string, updates: Partial<Scan>) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  addProject: (name: string, description: string) => Promise<string>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthErrorState>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseInitialized) {
      console.error(CONFIG_ERROR_MESSAGE);
      setAuthError({ code: 'firebase-config-invalid', message: CONFIG_ERROR_MESSAGE });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        setAuthError(null); // Clear previous errors on new auth state
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
        } catch (error: any) {
            console.error("Firestore Error:", error);
            if (error.code === 'permission-denied') {
                setAuthError({
                    code: 'firestore-permission-denied',
                    message: "PERMISSION_DENIED: Your security rules are blocking access. You need to deploy the provided Firestore rules."
                });
            } else {
                setAuthError({
                    code: 'firestore-not-found',
                    message: 'Could not connect to the database. This can happen if Firestore is not enabled in your Firebase project.'
                });
            }
            setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setScans([]);
        setProjects([]);
        setAuthError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile && isFirebaseInitialized && !authError) {
      // Listener for Scans
      const scansCollectionRef = collection(db, 'users', userProfile.uid, 'scans');
      const qScans = query(scansCollectionRef, orderBy('createdAt', 'desc'));
      const unsubscribeScans = onSnapshot(qScans, (querySnapshot) => {
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
        if (error.code === 'permission-denied') {
          setAuthError({
              code: 'firestore-permission-denied',
              message: "PERMISSION_DENIED: Your security rules are blocking access for the 'scans' collection. Deploy the latest Firestore rules."
          });
        }
      });

      // Listener for Projects
      const projectsCollectionRef = collection(db, 'users', userProfile.uid, 'projects');
      const qProjects = query(projectsCollectionRef, orderBy('createdAt', 'desc'));
      const unsubscribeProjects = onSnapshot(qProjects, (querySnapshot) => {
        const userProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            userProjects.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as Project);
        });
        setProjects(userProjects);
      }, (error) => {
        console.error("Error fetching projects:", error);
        if (error.code === 'permission-denied') {
          setAuthError({
              code: 'firestore-permission-denied',
              message: "PERMISSION_DENIED: Your security rules are blocking access for the 'projects' collection. Deploy the latest Firestore rules."
          });
        }
      });

      return () => {
        unsubscribeScans();
        unsubscribeProjects();
      };
    }
  }, [userProfile, authError]);

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

  const addProject = async (name: string, description: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (!isFirebaseInitialized) throw new Error(CONFIG_ERROR_MESSAGE);

    const newProjectRef = await addDoc(collection(db, 'users', user.uid, 'projects'), {
      userId: user.uid,
      name,
      description,
      lastBuildStatus: 'UNKNOWN',
      lastDeploymentStatus: 'UNKNOWN',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newProjectRef.id;
  };

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    if (!user || !isFirebaseInitialized) return;
    const projectDocRef = doc(db, 'users', user.uid, 'projects', projectId);
    await updateDoc(projectDocRef, { ...updates, updatedAt: serverTimestamp() });
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
        user, 
        userProfile, 
        scans,
        projects,
        loading, 
        authError,
        logout, 
        registerUser, 
        signInUser, 
        sendPasswordReset,
        startNewScan,
        updateScan,
        updateUserProfile,
        addProject,
        updateProject
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
