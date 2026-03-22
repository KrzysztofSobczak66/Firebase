'use server';
/**
 * @fileOverview Ekstrakcja danych z PDF przy użyciu poprawnej konfiguracji modelu.
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
        { text: 'Extract invoice data: number, date (YYYY-MM-DD), seller name, seller NIP, and total gross amount.' },
        { media: { url: input.pdfDataUri } }
      ],
      output: { schema: PdfInvoiceDataExtractionOutputSchema }
    });
    
    if (!response.output) throw new Error('AI returned empty output.');
    return response.output;
  } catch (error: any) {
    console.error("AI PDF Extraction Error:", error);
    throw error;
  }
}
