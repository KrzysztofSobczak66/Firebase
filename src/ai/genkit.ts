import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Inicjalizacja Genkit 1.x.
 * Wtyczka googleAI automatycznie szuka klucza w zmiennej GOOGLE_GENAI_API_KEY.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: 'googleai/gemini-1.5-flash',
});
