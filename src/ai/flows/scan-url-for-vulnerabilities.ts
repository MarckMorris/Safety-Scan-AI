
'use server';
/**
 * @fileOverview Scans a URL for common vulnerabilities using AI analysis.
 * This flow does not perform live network requests but analyzes the URL
 * for patterns and known risks associated with certain technologies.
 *
 * - scanUrlForVulnerabilities - A function that handles the URL scanning process.
 * - ScanUrlForVulnerabilitiesInput - The input type for the scanUrlForVulnerabilities function.
 * - ScanUrlForVulnerabilitiesOutput - The return type for the scanUrlForVulnerabilities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AIScanResult } from '@/types';

const ScanUrlForVulnerabilitiesInputSchema = z.object({
  url: z.string().url().describe('The URL to scan for vulnerabilities.'),
});
export type ScanUrlForVulnerabilitiesInput = z.infer<typeof ScanUrlForVulnerabilitiesInputSchema>;

const ScanUrlForVulnerabilitiesOutputSchema = z.object({
  vulnerabilities: z.array(
    z.object({
      type: z.string().describe('The type of vulnerability detected (e.g., SQL Injection, XSS, Insecure Headers).'),
      severity: z
        .enum(['Low', 'Medium', 'High', 'Critical'])
        .describe('The severity of the vulnerability.'),
      description: z.string().describe('A detailed description of the potential vulnerability, how it could be exploited, and why it is a risk.'),
      affectedUrl: z.string().optional().describe('The specific URL or URL pattern that is potentially affected.'),
      affectedFile: z.string().optional().describe('A hypothetical file path that could be vulnerable (e.g., /login.php, /api/users).'),
    })
  ).describe('A list of potential vulnerabilities identified through analysis.'),
  summary: z.string().describe('A natural language summary of the scan results, including an overall assessment of the security posture based on the URL analysis.'),
});
export type ScanUrlForVulnerabilitiesOutput = z.infer<typeof ScanUrlForVulnerabilitiesOutputSchema>;

export async function scanUrlForVulnerabilities(input: ScanUrlForVulnerabilitiesInput): Promise<ScanUrlForVulnerabilitiesOutput> {
  return scanUrlForVulnerabilitiesFlow(input);
}

const prompt = ai.definePrompt({
    name: 'scanUrlForVulnerabilitiesPrompt',
    input: { schema: ScanUrlForVulnerabilitiesInputSchema },
    output: { schema: ScanUrlForVulnerabilitiesOutputSchema },
    prompt: `
        You are a world-class cybersecurity expert AI. Your task is to analyze the provided URL and identify POTENTIAL security vulnerabilities.
        
        IMPORTANT: You MUST NOT access the URL or perform any network requests. Your analysis should be based solely on the structure of the URL, file extensions, query parameters, and your vast knowledge of web technologies, frameworks, and common attack vectors.

        Analyze the URL: {{{url}}}

        Based on your analysis, provide a list of potential vulnerabilities. For each vulnerability:
        1.  Identify its type (e.g., SQL Injection, XSS, CSRF, Insecure Direct Object Reference, Security Misconfiguration, Outdated Component).
        2.  Assign a severity level (Low, Medium, High, Critical).
        3.  Provide a detailed, clear description of what the vulnerability is, how a potential attacker might exploit it given the URL structure, and the potential impact.
        4.  If a specific part of the URL is relevant, list it as the 'affectedUrl'.

        Example Analysis:
        - If you see ".php?id=123", you should infer a high potential for SQL Injection and XSS.
        - If you see "/wp-admin/", you should infer potential vulnerabilities related to outdated WordPress plugins or brute-force attacks.
        - If you see "/api/v1/users", you should mention the risk of exposed APIs and insecure direct object references if not properly secured.
        - If you see a common framework name or file extension, mention common vulnerabilities associated with it.

        Your final output must be a JSON object that strictly adheres to the provided output schema. Create a comprehensive and educational summary. If the URL appears simple and has no obvious risk indicators (e.g., a static-looking site like "https://example.com/about-us"), state that and list low-severity, general best-practice recommendations like checking for secure headers.
    `,
});

const scanUrlForVulnerabilitiesFlow = ai.defineFlow(
  {
    name: 'scanUrlForVulnerabilitiesFlow',
    inputSchema: ScanUrlForVulnerabilitiesInputSchema,
    outputSchema: ScanUrlForVulnerabilitiesOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - scanUrlForVulnerabilities] Starting real AI analysis for URL: ${input.url}`);
    
    const { output } = await prompt(input);

    if (!output) {
        throw new Error("The AI model did not return a valid output.");
    }
    
    console.log(`[AI Flow - scanUrlForVulnerabilities] Analysis complete for URL: ${input.url}`);
    return output;
  }
);
