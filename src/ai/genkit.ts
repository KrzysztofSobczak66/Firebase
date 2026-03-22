import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Inicjalizacja Genkit 1.x.
 * Obsługuje klucze GOOGLE_GENAI_API_KEY lub GEMINI_API_KEY.
 */

// Pobieranie klucza z różnych możliwych źródeł środowiskowych
const rawApiKey = process.env.GEMINI_API_KEY || 
                  process.env.GOOGLE_GENAI_API_KEY || 
                  process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Czyszczenie klucza z ewentualnych spacji, cudzysłowów (częsty błąd przy kopiowaniu)
const apiKey = rawApiKey?.trim().replace(/["']/g, '');

if (!apiKey) {
  console.error("ALARM: Brak klucza API dla Gemini! Sprawdź plik .env i upewnij się, że masz tam GEMINI_API_KEY=...");
}

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: apiKey 
    })
  ],
});
