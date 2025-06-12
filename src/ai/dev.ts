import { config } from 'dotenv';
config();

import '@/ai/flows/scan-url-for-vulnerabilities.ts';
import '@/ai/flows/generate-security-improvement-report.ts';