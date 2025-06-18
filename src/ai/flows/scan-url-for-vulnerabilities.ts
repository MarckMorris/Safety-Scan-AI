
'use server';
/**
 * @fileOverview Scans a URL for common vulnerabilities.
 * FOR TESTING: This flow now returns a MOCK result almost instantly.
 *
 * - scanUrlForVulnerabilities - A function that handles the URL scanning process.
 * - ScanUrlForVulnerabilitiesInput - The input type for the scanUrlForVulnerabilities function.
 * - ScanUrlForVulnerabilitiesOutput - The return type for the scanUrlForVulnerabilities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AIScanResult } from '@/types'; // Import for the output type

const ScanUrlForVulnerabilitiesInputSchema = z.object({
  url: z.string().url().describe('The URL to scan for vulnerabilities.'),
});
export type ScanUrlForVulnerabilitiesInput = z.infer<typeof ScanUrlForVulnerabilitiesInputSchema>;

// Output schema matches AIScanResult structure
const ScanUrlForVulnerabilitiesOutputSchema = z.object({
  vulnerabilities: z.array(
    z.object({
      type: z.string().describe('The type of vulnerability detected.'),
      severity: z
        .enum(['Low', 'Medium', 'High', 'Critical'])
        .describe('The severity of the vulnerability.'),
      description: z.string().describe('A detailed description of the vulnerability.'),
      affectedUrl: z.string().url().optional().describe('The affected URL, if applicable.'),
      affectedFile: z.string().optional().describe('The affected file, if applicable.'),
    })
  ).describe('A list of vulnerabilities found during the scan.'),
  summary: z.string().describe('A summary of the scan results in natural language.'),
});
export type ScanUrlForVulnerabilitiesOutput = z.infer<typeof ScanUrlForVulnerabilitiesOutputSchema>;


// This is the actual function that will be called by the application
export async function scanUrlForVulnerabilities(input: ScanUrlForVulnerabilitiesInput): Promise<ScanUrlForVulnerabilitiesOutput> {
  console.log(`[Mock AI Flow] scanUrlForVulnerabilities called for URL: ${input.url}. Simulating slight delay...`);
  
  // Simulate a very short delay to mimic network/processing time
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // 1.5 to 2.5 seconds

  // Return a hardcoded mock result
  const mockResult: AIScanResult = {
    summary: `Mock scan successfully completed for ${input.url}. This is a test result. Found 2 mock vulnerabilities of varying severity. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
    vulnerabilities: [
      {
        type: "Mock SQL Injection (Critical)",
        severity: "Critical",
        description: "This is a critical mock SQL Injection vulnerability found at the login form (simulated). Input parameters were not properly sanitized, potentially allowing attackers to execute arbitrary SQL commands. Example: ' OR '1'='1",
        affectedUrl: `${input.url}/login`
      },
      {
        type: "Mock XSS (High)",
        severity: "High",
        description: "This is a high severity mock Cross-Site Scripting (XSS) vulnerability found in the search parameter (simulated). User-supplied input is reflected without proper escaping, allowing for script injection. Example: <script>alert('XSS')</script>",
        affectedUrl: `${input.url}/search?q=<script>alert("mock_xss")</script>`,
        affectedFile: "search.php (line 42, simulated)"
      },
      {
        type: "Mock Insecure HTTP Header (Medium)",
        severity: "Medium",
        description: "The 'X-Frame-Options' header is missing or not set to 'DENY' or 'SAMEORIGIN'. This could make the site vulnerable to clickjacking attacks. It is recommended to set this header to prevent embedding in iframes from other domains.",
        affectedUrl: input.url
      },
      {
        type: "Mock Outdated jQuery Version (Low)",
        severity: "Low",
        description: "The application appears to be using jQuery v1.8.3 (simulated), which has known vulnerabilities (e.g., CVE-2019-11358). Consider updating to a more recent and patched version of jQuery to mitigate potential risks.",
        affectedFile: "js/main.js (simulated)"
      }
    ]
  };
  console.log('[Mock AI Flow] Returning mock result:', mockResult);
  return mockResult;
}

// The Genkit flow definition below is now mostly for structure, as the actual logic is simplified above.
// In a real scenario, this flow would contain the prompt and AI call.
const scanUrlForVulnerabilitiesFlow = ai.defineFlow(
  {
    name: 'scanUrlForVulnerabilitiesFlow', // Keep name consistent for potential future use
    inputSchema: ScanUrlForVulnerabilitiesInputSchema,
    outputSchema: ScanUrlForVulnerabilitiesOutputSchema,
  },
  async (input) => {
    // This flow definition will call our simplified exported function directly.
    const result = await scanUrlForVulnerabilities(input); 
    return result;
  }
);
