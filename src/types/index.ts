
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
  aiScanResult?: AIScanResult | null; // Allow null for initial state
  aiSecurityReport?: AISecurityReport | null; // Allow null
  errorMessage?: string | null; // Allow null
  createdAt: Date;
  updatedAt: Date;
}

// Types for Simulated Attack Module (placeholder for now)
export type AttackType = "sqli" | "xss" | "brute-force" | "header-spoofing" | "rate-limiting";

export interface SimulatedAttackConfig {
  targetUrl: string;
  attackType: AttackType;
  // Specific parameters for different attacks can be added here
  // e.g., loginPageUrl for brute-force, specific headers for spoofing
}

export interface SimulatedAttackReport {
  id: string;
  userId: string;
  simulationConfig: SimulatedAttackConfig;
  status: "pending" | "running" | "completed" | "failed";
  riskLevel?: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  findings: Array<{
    description: string;
    evidence?: string; // e.g., error message, successful payload
    mitigation?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Types for AI Patch Suggestion Engine
export interface AIPatchSuggestion {
  vulnerabilityType: string;
  vulnerabilityDescription: string;
  affectedComponent: string; // e.g., "login.php line 52" or "UserRegistrationForm component"
  suggestedCodePatch: string;
  explanation: string; // Why it's insecure + why the fix works
  language?: string; // e.g., 'javascript', 'python', 'php'
}
