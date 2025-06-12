
import type { Timestamp } from 'firebase/firestore';

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

// Matches ScanUrlForVulnerabilitiesOutput from src/ai/flows/scan-url-for-vulnerabilities.ts
export interface AIScanResult {
  vulnerabilities: Vulnerability[];
  summary: string;
}

// Matches GenerateSecurityImprovementReportOutput from src/ai/flows/generate-security-improvement-report.ts
export interface AISecurityReport {
  report: string;
}
export interface Scan {
  id: string;
  userId: string;
  targetUrl: string;
  status: 'queued' | 'scanning' | 'generating_report' | 'completed' | 'failed';
  aiScanResult?: AIScanResult;
  aiSecurityReport?: AISecurityReport;
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
