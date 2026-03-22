'use server';
/**
 * @fileOverview Ekstrakcja danych z PDF przy użyciu Gemini 1.5 Flash.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const maxDuration = 60; // Zwiększony timeout dla analizy PDF

const PdfInvoiceDataExtractionOutputSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  seller: z.object({
    name: z.string(),
    nip: z.string().optional(),
  }),
  totalGross: z.number(),
});

export type PdfInvoiceDataExtractionOutput = z.infer<typeof PdfInvoiceDataExtractionOutputSchema>;

export async function extractPdfInvoiceData(input: { pdfDataUri: string }): Promise<PdfInvoiceDataExtractionOutput> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: 'Jesteś ekspertem od faktur. Wyciągnij z tego pliku PDF następujące dane: numer faktury, datę wystawienia (format YYYY-MM-DD), pełną nazwę sprzedawcy, NIP sprzedawcy (tylko cyfry) oraz łączną kwotę brutto. Zwróć dane w formacie JSON.' },
        { media: { url: input.pdfDataUri, contentType: 'application/pdf' } }
      ],
      output: { schema: PdfInvoiceDataExtractionOutputSchema }
    });
    
    if (!response.output) {
      throw new Error('Model AI nie zwrócił poprawnego wyniku (pusta odpowiedź).');
    }
    
    return response.output;
  } catch (error: any) {
    console.error("AI Error:", error);
    // Przekazujemy czytelny błąd do UI
    if (error.message?.includes('401') || error.message?.includes('API_KEY')) {
      throw new Error('BŁĄD AUTORYZACJI: Brak poprawnego klucza GOOGLE_GENAI_API_KEY w pliku .env.');
    }
    throw new Error(`Błąd analizy PDF: ${error.message || 'Nieznany problem z modelem Gemini'}`);
  }
}
