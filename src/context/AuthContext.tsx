
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, Scan, AIScanResult } from '@/types';
import { scanUrlForVulnerabilities } from '@/ai/flows/scan-url-for-vulnerabilities';
import { mockScansData } from '@/app/dashboard/scans/page';

// Mock user type that mimics Firebase's User object structure for compatibility
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

// In-memory database for users
const mockUserDatabase: Record<string, UserProfile> = {
  "user-admin-01": { uid: "user-admin-01", email: "admin@example.com", displayName: "Admin User", role: "admin" },
  "user-regular-01": { uid: "user-regular-01", email: "user@example.com", displayName: "Regular User", role: "user" },
};

// In-memory database for scans, prepopulated with mock data.
// A deep copy is made to ensure the mock data is fresh on each module load (important for dev server hot-reloading),
// and dates are properly reconstructed.
let mockScanDatabase: Scan[] = JSON.parse(JSON.stringify(mockScansData)).map((scan: any) => ({
    ...scan,
    createdAt: new Date(scan.createdAt),
    updatedAt: new Date(scan.updatedAt),
}));

interface AuthContextType {
  user: MockUser | null;
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
  const [user, setUser] = useState<MockUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On initial load, check localStorage for a logged-in user
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('safety-scan-user');
      if (storedUser) {
        const loggedInUserProfile: UserProfile = JSON.parse(storedUser);
        const loggedInUser: MockUser = {
            uid: loggedInUserProfile.uid,
            email: loggedInUserProfile.email,
            displayName: loggedInUserProfile.displayName,
            photoURL: loggedInUserProfile.photoURL
        };
        setUser(loggedInUser);
        setUserProfile(loggedInUserProfile);
        setScans(mockScanDatabase.filter(s => s.userId === loggedInUserProfile.uid));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('safety-scan-user');
    }
    setLoading(false);
  }, []);

  const logout = async () => {
    setUser(null);
    setUserProfile(null);
    setScans([]);
    localStorage.removeItem('safety-scan-user');
    router.push('/auth/login');
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) {
        return {error: "You must be logged in to update your profile."};
    }
    const updatedProfile = {...userProfile, ...updates};
    const updatedUser = {...user, ...updates};

    mockUserDatabase[user.uid] = updatedProfile;
    localStorage.setItem('safety-scan-user', JSON.stringify(updatedProfile));
    
    setUserProfile(updatedProfile);
    setUser(updatedUser);
    
    return {};
  }

  const registerUser = async (displayName: string, email: string, password: string) => {
    // Simulate registration
    if (Object.values(mockUserDatabase).find(u => u.email === email)) {
      return { error: "This email address is already in use." };
    }

    const uid = `user-mock-${Date.now()}`;
    const newUserProfile: UserProfile = {
      uid,
      email,
      displayName,
      role: 'user' // All new registrations are 'user' role
    };

    mockUserDatabase[uid] = newUserProfile;
    
    // Automatically sign in the new user
    const newUser: MockUser = { uid, email, displayName, photoURL: undefined };
    setUser(newUser);
    setUserProfile(newUserProfile);
    localStorage.setItem('safety-scan-user', JSON.stringify(newUserProfile));
    
    return {};
  };

  const signInUser = async (email: string, password: string) => {
    // Simulate login
    const foundUser = Object.values(mockUserDatabase).find(u => u.email === email);
    
    // Note: In this mock setup, any password is valid for a known email.
    if (foundUser) {
      const loggedInUser: MockUser = {
        uid: foundUser.uid,
        email: foundUser.email,
        displayName: foundUser.displayName,
        photoURL: foundUser.photoURL
      };
      setUser(loggedInUser);
      setUserProfile(foundUser);
      setScans(mockScanDatabase.filter(s => s.userId === foundUser.uid));
      localStorage.setItem('safety-scan-user', JSON.stringify(foundUser));
      return {};
    }
    
    return { error: "Invalid email or password." };
  };
  
  const sendPasswordReset = async (email: string) => {
    // Simulate sending a password reset email
    if (Object.values(mockUserDatabase).find(u => u.email === email)) {
        console.log(`Password reset email would be sent to ${email}`);
        return {};
    }
    // Don't reveal if an email exists or not for security reasons
    console.log(`Password reset requested for ${email}, pretending to send email.`);
    return {};
  };
  
  const updateScan = useCallback(async (scanId: string, updates: Partial<Scan>) => {
    setScans(prevScans => {
        const newScans = prevScans.map(s => {
            if (s.id === scanId) {
                return { ...s, ...updates, updatedAt: new Date() };
            }
            return s;
        });
        mockScanDatabase = mockScanDatabase.map(s => s.id === scanId ? { ...s, ...updates, updatedAt: new Date() } : s);
        return newScans;
    });
  }, []);

  const startNewScan = async (targetUrl: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    const scanId = `mock-scan-${Date.now()}`;
    const now = new Date();
    const newScan: Scan = {
        id: scanId,
        userId: user.uid,
        targetUrl,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
    };

    // Add to state immediately
    setScans(prev => [...prev, newScan]);
    mockScanDatabase.push(newScan);
    
    // Process in background
    (async () => {
        try {
            await updateScan(scanId, { status: 'scanning' });
            const aiScanResult: AIScanResult = await scanUrlForVulnerabilities({ url: targetUrl });
            await updateScan(scanId, { status: 'completed', aiScanResult });
        } catch (error: any) {
            console.error(`Error during mock scan for ${scanId}:`, error);
            await updateScan(scanId, { status: 'failed', errorMessage: error.message || "Unknown error" });
        }
    })();

    return scanId;
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
