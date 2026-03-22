'use server';
/**
 * @fileOverview A Genkit flow for extracting key invoice data from a PDF file.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AddressSchema = z.object({
  street: z.string().describe('Street and building number.'),
  city: z.string().describe('City.'),
  postalCode: z.string().describe('Postal code.'),
  country: z.string().describe('Country.'),
});

const CompanyDetailsSchema = z.object({
  name: z.string().describe('Company name.'),
  nip: z.string().optional().describe('Tax Identification Number (NIP).'),
  address: AddressSchema.optional().describe('Company address.'),
});

const InvoiceItemSchema = z.object({
  description: z.string().describe('Description of the item.'),
  quantity: z.number().describe('Quantity.'),
  unitPrice: z.number().describe('Price per unit.'),
  vatRate: z.number().describe('VAT rate (e.g. 23).'),
});

const PdfInvoiceDataExtractionInputSchema = z.object({
  pdfDataUri: z.string().describe("PDF as data URI."),
});

const PdfInvoiceDataExtractionOutputSchema = z.object({
  invoiceNumber: z.string().describe('Invoice number.'),
  invoiceDate: z.string().describe('YYYY-MM-DD.'),
  seller: CompanyDetailsSchema.describe('Seller details.'),
  totalNet: z.number().describe('Total net.'),
  totalGross: z.number().describe('Total gross.'),
  totalVat: z.number().describe('Total VAT.'),
  currency: z.string().optional().describe('Currency.'),
});

export type PdfInvoiceDataExtractionOutput = z.infer<typeof PdfInvoiceDataExtractionOutputSchema>;

const pdfPrompt = ai.definePrompt({
  name: 'pdfInvoiceDataExtractionPrompt',
  input: { schema: PdfInvoiceDataExtractionInputSchema },
  output: { schema: PdfInvoiceDataExtractionOutputSchema },
  config: {
    model: 'googleai/gemini-1.5-flash',
  },
  prompt: `Extract structured data from this PDF invoice: {{media url=pdfDataUri}}`,
});

export async function extractPdfInvoiceData(input: { pdfDataUri: string }): Promise<PdfInvoiceDataExtractionOutput> {
  return pdfFlow(input);
}

const pdfFlow = ai.defineFlow(
  {
    name: 'pdfInvoiceDataExtractionFlow',
    inputSchema: PdfInvoiceDataExtractionInputSchema,
    outputSchema: PdfInvoiceDataExtractionOutputSchema,
  },
  async (input) => {
    const { output } = await pdfPrompt(input);
    if (!output) throw new Error('Failed to extract data.');
    return output;
  }
);
