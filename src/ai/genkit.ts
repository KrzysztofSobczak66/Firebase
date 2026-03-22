import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Inicjalizacja Genkit 1.x.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
});
