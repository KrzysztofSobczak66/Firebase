import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Inicjalizacja Genkit 1.x.
 * Obsługuje klucze GOOGLE_GENAI_API_KEY lub GEMINI_API_KEY.
 */

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.warn("BRAK KLUCZA API: Dodaj GEMINI_API_KEY do pliku .env, aby analiza PDF działała.");
}

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: apiKey 
    })
  ],
});
