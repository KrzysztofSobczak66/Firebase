'use server';
/**
 * @fileOverview Ekstrakcja danych z PDF przy użyciu Gemini 1.5 Flash.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

/**
 * Analizuje PDF i wyciąga dane faktury.
 */
export async function extractPdfInvoiceData(input: { pdfDataUri: string }): Promise<PdfInvoiceDataExtractionOutput> {
  console.log("Rozpoczynam analizę AI dla pliku PDF...");
  
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: 'Jesteś ekspertem od polskich faktur. Przeanalizuj ten plik PDF i wyciągnij: numer faktury, datę wystawienia (format YYYY-MM-DD), pełną nazwę sprzedawcy, NIP sprzedawcy oraz łączną kwotę brutto. Zwróć dane w formacie JSON zgodnym ze schematem.' },
        { media: { url: input.pdfDataUri, contentType: 'application/pdf' } }
      ],
      output: { schema: PdfInvoiceDataExtractionOutputSchema }
    });
    
    if (!response.output) {
      throw new Error('Model AI nie zwrócił ustrukturyzowanych danych. Upewnij się, że PDF jest czytelny i zawiera fakturę.');
    }
    
    console.log("Analiza AI zakończona sukcesem:", response.output.invoiceNumber);
    return response.output;
  } catch (error: any) {
    console.error("SZCZEGÓŁOWY BŁĄD GEMINI:", error);
    
    // Obsługa błędów autoryzacji
    if (error.message?.includes('401') || error.message?.includes('API_KEY') || error.message?.includes('auth')) {
      throw new Error('BŁĄD KLUCZA API: Twój klucz Gemini jest nieważny lub niepoprawnie wklejony w pliku .env.');
    }
    
    // Obsługa limitów (Quotas)
    if (error.message?.includes('429')) {
      throw new Error('LIMIT PRZEKROCZONY: Zbyt wiele zapytań do AI w krótkim czasie. Odczekaj chwilę.');
    }

    throw new Error(`Błąd AI: ${error.message || 'Nieznany problem z modelem Gemini'}`);
  }
}
