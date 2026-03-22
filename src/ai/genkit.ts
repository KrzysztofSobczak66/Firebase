import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Inicjalizacja Genkit 1.x.
 * Dodano obsługę braku klucza, aby nie wywalać całej aplikacji przy starcie serwera.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: apiKey || 'DUMMY_KEY_FOR_INIT'
    })
  ],
});
