'use server';
/**
 * @fileOverview A Genkit flow for extracting key invoice data from a PDF file.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompanyDetailsSchema = z.object({
  name: z.string().describe('Company name.'),
  nip: z.string().optional().describe('Tax Identification Number (NIP).'),
});

const PdfInvoiceDataExtractionInputSchema = z.object({
  pdfDataUri: z.string().describe("PDF as data URI."),
});

const PdfInvoiceDataExtractionOutputSchema = z.object({
  invoiceNumber: z.string().describe('Invoice number.'),
  invoiceDate: z.string().describe('YYYY-MM-DD.'),
  seller: CompanyDetailsSchema.describe('Seller details.'),
  totalGross: z.number().describe('Total gross.'),
});

export type PdfInvoiceDataExtractionOutput = z.infer<typeof PdfInvoiceDataExtractionOutputSchema>;

const pdfPrompt = ai.definePrompt({
  name: 'pdfInvoiceDataExtractionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: PdfInvoiceDataExtractionInputSchema },
  output: { schema: PdfInvoiceDataExtractionOutputSchema },
  prompt: `Extract structured data from this PDF invoice: {{media url=pdfDataUri}}`,
});

export async function extractPdfInvoiceData(input: { pdfDataUri: string }): Promise<PdfInvoiceDataExtractionOutput> {
  try {
    const { output } = await pdfPrompt(input);
    if (!output) throw new Error('AI returned empty output.');
    return output;
  } catch (error: any) {
    console.error("AI PDF Extraction Error:", error);
    throw error;
  }
}
