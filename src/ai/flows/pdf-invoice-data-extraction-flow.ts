'use server';
/**
 * @fileOverview Ekstrakcja danych z PDF przy użyciu Gemini 1.5 Flash.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Usunięto export, aby uniknąć błędu Next.js Server Actions
const maxDuration = 120; 

const PdfInvoiceDataExtractionOutputSchema = z.object({
  invoiceNumber: z.string().describe("Numer faktury znaleziony w dokumencie"),
  invoiceDate: z.string().describe("Data wystawienia w formacie YYYY-MM-DD"),
  seller: z.object({
    name: z.string().describe("Pełna nazwa sprzedawcy"),
    nip: z.string().optional().describe("NIP sprzedawcy (tylko cyfry)"),
  }),
  totalGross: z.number().describe("Łączna kwota brutto do zapłaty"),
});

export type PdfInvoiceDataExtractionOutput = z.infer<typeof PdfInvoiceDataExtractionOutputSchema>;

export async function extractPdfInvoiceData(input: { pdfDataUri: string }): Promise<PdfInvoiceDataExtractionOutput> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: 'Jesteś ekspertem od polskich faktur. Przeanalizuj ten plik PDF i wyciągnij: numer faktury, datę wystawienia (format YYYY-MM-DD), pełną nazwę sprzedawcy, NIP sprzedawcy oraz łączną kwotę brutto. Zwróć dane w formacie JSON.' },
        { media: { url: input.pdfDataUri, contentType: 'application/pdf' } }
      ],
      output: { schema: PdfInvoiceDataExtractionOutputSchema }
    });
    
    if (!response.output) {
      throw new Error('Model AI zwrócił pustą odpowiedź. Sprawdź czy plik PDF jest czytelny.');
    }
    
    return response.output;
  } catch (error: any) {
    console.error("Szczegółowy błąd AI:", error);
    
    // Specyficzna obsługa błędów klucza API dla użytkownika
    if (error.message?.includes('401') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('NIEWAŻNY KLUCZ API: Upewnij się, że w pliku .env klucz GEMINI_API_KEY jest poprawny i nie zawiera spacji.');
    }
    
    throw new Error(`Błąd analizy PDF (Gemini): ${error.message || 'Nieznany problem'}`);
  }
}
