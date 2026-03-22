import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Inicjalizacja Genkit 1.x z inteligentnym ładowaniem klucza API.
 * Obsługuje nazwy: GOOGLE_GENAI_API_KEY lub GEMINI_API_KEY.
 */

// Sprawdzamy obie popularne nazwy zmiennych środowiskowych
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("UWAGA: Brak klucza API dla Gemini (GOOGLE_GENAI_API_KEY / GEMINI_API_KEY) w pliku .env!");
}

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: apiKey 
    })
  ],
});
