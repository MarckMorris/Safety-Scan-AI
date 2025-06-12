// import { config } from 'dotenv'; // Next.js handles .env.local automatically for the main app
// config(); // This was likely unnecessary for the main app and could potentially conflict

import '@/ai/flows/scan-url-for-vulnerabilities.ts';
import '@/ai/flows/generate-security-improvement-report.ts';
