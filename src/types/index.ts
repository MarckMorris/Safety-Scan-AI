
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

// Types for DevOps Module
export interface CiCdConfig {
  gitProvider?: "github" | "gitlab";
  repoUrl?: string;
  mainBranch?: string;
  workflowPath?: string;
  webhookSecret?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  ciCdConfig?: CiCdConfig;
  lastBuildStatus?: "UNKNOWN" | "SUCCESS" | "FAILED" | "RUNNING" | "PENDING";
  lastDeploymentStatus?: "UNKNOWN" | "SUCCESS" | "FAILED" | "RUNNING" | "PENDING";
  createdAt: Date;
  updatedAt: Date;
}

export interface Build {
  id: string;
  commit: string;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "PENDING";
  trigger: 'user' | 'webhook';
  timestamp: Date;
  logsUrl?: string;
}

export interface ProjectVulnerability {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  rawDetails?: Record<string, any>;
  llmExplanation?: string;
  llmImpact?: string;
  llmRecommendations?: string;
  llmCodeFix?: string;
  bestPractices?: string;
  status: 'OPEN' | 'FIXED' | 'ACKNOWLEDGED';
  fixedAt?: Date;
}

export interface ProjectSecurityScan {
  id: string;
  scanType: "DAST" | "SAST" | "SCA" | "CLOUD_CONFIG";
  status: "COMPLETED" | "RUNNING" | "FAILED";
  target: string;
  createdAt: Date;
  finishedAt?: Date;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  reportUrl?: string;
  vulnerabilities?: ProjectVulnerability[];
}
