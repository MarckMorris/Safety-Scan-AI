
'use server';
/**
 * @fileOverview Simulates a security attack against a URL using AI analysis.
 * This flow does not perform live network requests but analyzes the URL and
 * attack type to generate a hypothetical attack scenario and outcome.
 *
 * - simulateAttack - A function that handles the attack simulation process.
 * - SimulateAttackInput - The input type for the simulateAttack function.
 * - SimulateAttackOutput - The return type for the simulateAttack function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const attackTypeDescriptions: Record<string, string> = {
    sqli: "SQL Injection: Try to execute malicious SQL queries through input fields.",
    xss: "Cross-Site Scripting (XSS): Try to inject malicious scripts into the web page.",
    "brute-force": "Brute-Force Login: Simulate repeated login attempts with common credentials.",
    "header-spoofing": "Header Spoofing: Test if the application improperly trusts HTTP headers.",
    "rate-limiting": "Rate Limiting / Denial of Service: Test how the server responds to a high volume of requests."
};

const SimulateAttackInputSchema = z.object({
  targetUrl: z.string().url().describe('The URL to simulate an attack against.'),
  attackType: z.enum(["sqli", "xss", "brute-force", "header-spoofing", "rate-limiting"], {
    required_error: "You need to select an attack type.",
  }),
});
export type SimulateAttackInput = z.infer<typeof SimulateAttackInputSchema>;

const SimulateAttackOutputSchema = z.object({
    attackType: z.string().describe('The full name of the attack that was simulated (e.g., "SQL Injection").'),
    target: z.string().describe('The target URL that was analyzed.'),
    status: z.enum(["success", "failed", "error", "no_vulnerability"]).describe("The outcome of the simulation. 'success' means a vulnerability was likely found, 'no_vulnerability' means it was likely secure."),
    summary: z.string().describe("A concise, one-sentence summary of the simulation's outcome."),
    details: z.array(z.string()).optional().describe("A list of specific findings, attack vectors, or exposed areas identified during the simulation."),
    recommendations: z.array(z.string()).optional().describe("A list of actionable steps to mitigate the identified risks."),
    riskLevel: z.enum(["Low", "Medium", "High", "Critical"]).optional().describe("An assessment of the risk level if the vulnerability were real."),
});
export type SimulateAttackOutput = z.infer<typeof SimulateAttackOutputSchema>;


export async function simulateAttack(input: SimulateAttackInput): Promise<SimulateAttackOutput> {
  return simulateAttackFlow(input);
}

// We need an extended input schema for the prompt that includes the description.
const PromptInputSchema = z.object({
    targetUrl: z.string().url(),
    attackType: z.string(),
    attackDescription: z.string(),
});

const prompt = ai.definePrompt({
    name: 'simulateAttackPrompt',
    input: { schema: PromptInputSchema },
    output: { schema: SimulateAttackOutputSchema },
    prompt: `
        You are a principal security researcher AI conducting a *simulated* penetration test.
        You MUST NOT access the network or the target URL. Your entire analysis will be hypothetical, based on your knowledge of web technologies and the provided information.

        **Simulation Target:**
        - URL: {{{targetUrl}}}
        - Attack Type: {{{attackType}}} (Description: {{{attackDescription}}})

        **Your Task:**
        1.  Analyze the provided URL and the chosen attack type.
        2.  Describe a plausible, hypothetical scenario for how this attack would be carried out against the target.
        3.  Based on common vulnerabilities and secure coding practices, determine the *likely* outcome.
            -   If the URL structure suggests a potential weakness (e.g., 'login.php?user=' for SQLi, or a search page for XSS), the simulation should be a 'success', and you should identify a 'High' or 'Critical' risk.
            -   If the URL seems modern or suggests a framework that usually protects against this (e.g., a modern SPA for a brute-force login), the simulation should be 'no_vulnerability', and you should identify a 'Low' risk.
        4.  Provide a clear summary, detailed hypothetical findings, and concrete recommendations for mitigation.
        5.  Your response must be in a JSON object that strictly adheres to the provided output schema.

        **Example Scenario (for SQLi on 'example.com/products.php?id=123'):**
        -   **Summary:** "Potential SQL Injection point found in the 'id' parameter."
        -   **Status:** 'success'
        -   **Risk Level:** 'Critical'
        -   **Details:** ["The parameter 'id' in the query string is a common vector for SQLi.", "A payload like '123 OR 1=1' might be used to bypass filtering."]
        -   **Recommendations:** ["Implement parameterized queries (prepared statements).", "Use a web application firewall (WAF)."]
    `,
});

const simulateAttackFlow = ai.defineFlow(
  {
    name: 'simulateAttackFlow',
    inputSchema: SimulateAttackInputSchema,
    outputSchema: SimulateAttackOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - simulateAttack] Starting simulation for URL: ${input.targetUrl} with attack: ${input.attackType}`);
    
    const { output } = await prompt({
        ...input,
        attackDescription: attackTypeDescriptions[input.attackType],
    });

    if (!output) {
        throw new Error("The AI model did not return a valid output for the simulation.");
    }
    
    console.log(`[AI Flow - simulateAttack] Simulation complete for URL: ${input.targetUrl}`);
    return output;
  }
);
