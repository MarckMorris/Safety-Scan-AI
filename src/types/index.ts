
import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: 'user' | 'admin';
}

export interface Vulnerability {
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  affectedUrl?: string;
  affectedFile?: string;
}

export interface AIScanResult {
  vulnerabilities: Vulnerability[];
  summary: string;
}

export interface AISecurityReport {
  report: string;
}
export interface Scan {
  id: string;
  userId: string;
  targetUrl: string;
  status: 'queued' | 'scanning' | 'generating_report' | 'completed' | 'failed';
  aiScanResult?: AIScanResult | null;
  aiSecurityReport?: AISecurityReport | null;
  errorMessage?: string | null;
  createdAt: Date; // Firestore Timestamps will be converted to Date objects
  updatedAt: Date; // Firestore Timestamps will be converted to Date objects
}

// Types for AI Patch Suggestion Engine
export interface AIPatchSuggestion {
  vulnerabilityType: string;
  vulnerabilityDescription: string;
  affectedComponent: string;
  suggestedCodePatch: string;
  explanation: string;
  language?: string;
}
