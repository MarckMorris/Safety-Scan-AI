import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Use a valid and recent text model. 'gemini-1.5-flash-latest' is a good choice for speed and capability.
  model: 'googleai/gemini-1.5-flash-latest',
});
