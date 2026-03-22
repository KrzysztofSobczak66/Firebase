import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Inicjalizacja Genkit 1.x z poprawioną obsługą kluczy środowiskowych.
 */

// Pobieranie klucza z różnych możliwych nazw i czyszczenie go
const getApiKey = () => {
  const rawKey = process.env.GEMINI_API_KEY || 
                 process.env.GOOGLE_GENAI_API_KEY || 
                 process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!rawKey) return undefined;
  
  // Usuwa spacje, cudzysłowy i znaki nowej linii
  return rawKey.trim().replace(/["']/g, '');
};

const apiKey = getApiKey();

if (!apiKey) {
  console.warn("UWAGA: Brak klucza API Gemini w zmiennych środowiskowych. Analiza PDF nie będzie działać.");
}

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: apiKey 
    })
  ],
});
