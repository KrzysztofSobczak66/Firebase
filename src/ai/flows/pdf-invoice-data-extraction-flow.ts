'use server';
/**
 * @fileOverview Ekstrakcja danych z PDF przy użyciu Gemini 1.5 Flash.
 * Zoptymalizowana pod kątem stabilności i obsługi błędów.
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
  console.log("URUCHAMIAM ANALIZĘ PDF (Gemini 1.5 Flash)...");
  
  if (!input.pdfDataUri) {
    throw new Error("Brak danych pliku PDF.");
  }

  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: 'Przeanalizuj tę fakturę i wyciągnij: numer faktury, datę wystawienia (YYYY-MM-DD), nazwę sprzedawcy, NIP sprzedawcy oraz kwotę brutto. Zwróć tylko JSON.' },
        { media: { url: input.pdfDataUri, contentType: 'application/pdf' } }
      ],
      output: { schema: PdfInvoiceDataExtractionOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });
    
    if (!response.output) {
      console.error("Model AI nie zwrócił ustrukturyzowanych danych.");
      throw new Error('AI nie rozpoznało danych na fakturze. Upewnij się, że plik jest czytelnym dokumentem PDF.');
    }
    
    console.log("SUKCES ANALIZY PDF:", response.output.invoiceNumber);
    return response.output;
  } catch (error: any) {
    console.error("KRYTYCZNY BŁĄD GEMINI:", error.message);
    
    if (error.message?.includes('401') || error.message?.includes('API_KEY')) {
      throw new Error('NIEPRAWIDŁOWY KLUCZ API: Sprawdź plik .env i upewnij się, że klucz GEMINI_API_KEY jest poprawny.');
    }
    
    if (error.message?.includes('429')) {
      throw new Error('LIMIT PRZEKROCZONY: Zbyt wiele zapytań do AI. Poczekaj minutę i spróbuj ponownie.');
    }

    throw new Error(`Błąd AI: ${error.message || 'Problem z połączeniem z Gemini'}`);
  }
}
