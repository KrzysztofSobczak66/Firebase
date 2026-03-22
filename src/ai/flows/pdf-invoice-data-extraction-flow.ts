'use server';
/**
 * @fileOverview Ekstrakcja danych z PDF przy użyciu Gemini 1.5 Flash.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
        { text: 'Jesteś ekspertem od faktur. Wyciągnij z tego pliku PDF następujące dane: numer faktury, datę wystawienia (YYYY-MM-DD), nazwę sprzedawcy, NIP sprzedawcy oraz kwotę brutto.' },
        { media: { url: input.pdfDataUri } }
      ],
      output: { schema: PdfInvoiceDataExtractionOutputSchema }
    });
    
    if (!response.output) {
      throw new Error('Model AI nie zwrócił poprawnego wyniku.');
    }
    
    return response.output;
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error(`Błąd AI: ${error.message || 'Nieznany błąd podczas analizy PDF'}`);
  }
}