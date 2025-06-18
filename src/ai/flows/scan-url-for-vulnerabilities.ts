
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
  console.log(`[Mock AI Flow] scanUrlForVulnerabilities called for URL: ${input.url}`);
  
  // Simulate a very short delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return a hardcoded mock result
  const mockResult: AIScanResult = {
    summary: `Mock scan completed for ${input.url}. This is a test result. Found 2 mock vulnerabilities.`,
    vulnerabilities: [
      {
        type: "Mock SQL Injection",
        severity: "Critical",
        description: "This is a mock SQL Injection vulnerability found at the login form (simulated).",
        affectedUrl: `${input.url}/login`
      },
      {
        type: "Mock XSS",
        severity: "High",
        description: "This is a mock Cross-Site Scripting vulnerability found in the search parameter (simulated).",
        affectedUrl: `${input.url}/search?q=<script>alert("mock")</script>`
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
    // No separate prompt needed for this mock version.
    const result = await scanUrlForVulnerabilities(input); // Call the simplified function
    return result;
  }
);
