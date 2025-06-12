'use server';
/**
 * @fileOverview Scans a URL for common vulnerabilities, SQL injection points, unprotected APIs, insecure HTTP headers, and outdated dependencies.
 *
 * - scanUrlForVulnerabilities - A function that handles the URL scanning process.
 * - ScanUrlForVulnerabilitiesInput - The input type for the scanUrlForVulnerabilities function.
 * - ScanUrlForVulnerabilitiesOutput - The return type for the scanUrlForVulnerabilities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanUrlForVulnerabilitiesInputSchema = z.object({
  url: z.string().url().describe('The URL to scan for vulnerabilities.'),
});
export type ScanUrlForVulnerabilitiesInput = z.infer<typeof ScanUrlForVulnerabilitiesInputSchema>;

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

export async function scanUrlForVulnerabilities(input: ScanUrlForVulnerabilitiesInput): Promise<ScanUrlForVulnerabilitiesOutput> {
  return scanUrlForVulnerabilitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanUrlForVulnerabilitiesPrompt',
  input: {schema: ScanUrlForVulnerabilitiesInputSchema},
  output: {schema: ScanUrlForVulnerabilitiesOutputSchema},
  prompt: `You are a security expert tasked with scanning a given URL for potential vulnerabilities.

  Analyze the URL and identify common security vulnerabilities, including but not limited to:
  - OWASP Top 10 vulnerabilities
  - SQL injection points
  - Exposed or unprotected APIs
  - Insecure HTTP headers
  - Outdated or vulnerable dependencies

  Provide a detailed report of the findings, including the type of vulnerability, severity (Low, Medium, High, Critical), description, and affected URL or file (if applicable).
  Also, provide a summary of the scan results in natural language.

  URL to scan: {{{url}}}
  `,
});

const scanUrlForVulnerabilitiesFlow = ai.defineFlow(
  {
    name: 'scanUrlForVulnerabilitiesFlow',
    inputSchema: ScanUrlForVulnerabilitiesInputSchema,
    outputSchema: ScanUrlForVulnerabilitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
