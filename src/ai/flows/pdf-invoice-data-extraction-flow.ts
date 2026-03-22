'use server';
/**
 * @fileOverview Ekstrakcja danych z PDF przy użyciu Gemini 1.5 Flash.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const maxDuration = 120; // 2 minuty na analizę PDF

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
        { text: 'Jesteś ekspertem od polskich faktur. Przeanalizuj ten plik PDF i wyciągnij: numer faktury, datę wystawienia (format YYYY-MM-DD), pełną nazwę sprzedawcy, NIP sprzedawcy oraz łączną kwotę brutto. Jeśli brakuje NIP, zostaw pole puste. Zwróć dane w formacie JSON.' },
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
    
    // Obsługa specyficznych błędów API Google
    if (error.message?.includes('401') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('NIEWAŻNY KLUCZ API: Klucz w .env jest niepoprawny lub nieaktywny w Google AI Studio.');
    }
    
    if (error.message?.includes('403')) {
      throw new Error('BRAK DOSTĘPU (403): Twój klucz może nie mieć uprawnień do tego modelu lub regionu.');
    }

    throw new Error(`Błąd analizy PDF (Gemini): ${error.message || 'Nieznany problem'}`);
  }
}
