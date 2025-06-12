// src/ai/flows/generate-security-improvement-report.ts
'use server';
/**
 * @fileOverview Generates a human-readable security improvement report with best practices and recommendations based on the scan results.
 *
 * - generateSecurityImprovementReport - A function that generates the security improvement report.
 * - GenerateSecurityImprovementReportInput - The input type for the generateSecurityImprovementReport function.
 * - GenerateSecurityImprovementReportOutput - The return type for the generateSecurityImprovementReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSecurityImprovementReportInputSchema = z.object({
  scanResults: z
    .string()
    .describe('The scan results in JSON format.'),
});
export type GenerateSecurityImprovementReportInput = z.infer<typeof GenerateSecurityImprovementReportInputSchema>;

const GenerateSecurityImprovementReportOutputSchema = z.object({
  report: z.string().describe('A human-readable security improvement report.'),
});
export type GenerateSecurityImprovementReportOutput = z.infer<typeof GenerateSecurityImprovementReportOutputSchema>;

export async function generateSecurityImprovementReport(
  input: GenerateSecurityImprovementReportInput
): Promise<GenerateSecurityImprovementReportOutput> {
  return generateSecurityImprovementReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSecurityImprovementReportPrompt',
  input: {schema: GenerateSecurityImprovementReportInputSchema},
  output: {schema: GenerateSecurityImprovementReportOutputSchema},
  prompt: `You are an AI security expert. Based on the provided scan results, generate a human-readable security improvement report.

Scan Results:
{{{scanResults}}}

Include best practices and recommendations, such as improved headers, permissions, and authentication hardening.  The report should be comprehensive and actionable.
`,
});

const generateSecurityImprovementReportFlow = ai.defineFlow(
  {
    name: 'generateSecurityImprovementReportFlow',
    inputSchema: GenerateSecurityImprovementReportInputSchema,
    outputSchema: GenerateSecurityImprovementReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
