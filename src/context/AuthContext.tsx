
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth'; // Keep User type for mock
// import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'; // Firebase import removed
// import { doc, getDoc, setDoc } from 'firebase/firestore'; // Firebase import removed
// import { auth, db } from '@/lib/firebase'; // Firebase import removed
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock User and UserProfile for testing
const mockUserObject: User = {
  uid: 'mockUser123',
  email: 'test@example.com',
  displayName: 'Mock User (Admin)',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => { console.warn('Mock user delete called'); },
  getIdToken: async () => 'mockIdToken',
  getIdTokenResult: async () => ({ token: 'mockIdToken', expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
  reload: async () => { console.warn('Mock user reload called'); },
  toJSON: () => ({}),
  getPhoneNumber: () => null,
  providerId: 'password',
};

const mockUserProfileObject: UserProfile = {
  uid: 'mockUser123',
  email: 'test@example.com',
  displayName: 'Mock User (Admin)',
  photoURL: undefined,
  role: 'admin', // Set to 'admin' for easier testing of admin features, or 'user'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(mockUserObject);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(mockUserProfileObject);
  const [loading, setLoading] = useState(false); // Set loading to false by default
  const router = useRouter();

  // useEffect for onAuthStateChanged is removed as we are mocking auth state.

  const logout = async () => {
    console.warn("Mock logout called");
    setUser(null);
    setUserProfile(null);
    router.push('/auth/login'); 
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
