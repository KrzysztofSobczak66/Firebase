'use server';
/**
 * @fileOverview A Genkit flow for extracting key invoice data from a PDF file.
 *
 * - extractPdfInvoiceData - A function that handles the extraction process.
 * - PdfInvoiceDataExtractionInput - The input type for the extractPdfInvoiceData function.
 * - PdfInvoiceDataExtractionOutput - The return type for the extractPdfInvoiceData function.
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
  nip: z.string().optional().describe('Tax Identification Number (NIP) for Polish companies or equivalent for foreign.'),
  regon: z.string().optional().describe('National Official Business Register (REGON) number, if available.'),
  address: AddressSchema.optional().describe('Company address.'),
});

const InvoiceItemSchema = z.object({
  description: z.string().describe('Description of the item or service.'),
  quantity: z.number().describe('Quantity of the item.'),
  unit: z.string().optional().describe('Unit of measurement (e.g., szt., kg, godz.).'),
  unitPrice: z.number().describe('Price per unit, excluding VAT.'),
  vatRate: z.number().describe('VAT rate as a percentage (e.g., 23 for 23%).'),
  totalNet: z.number().describe('Total net amount for this item.'),
  totalGross: z.number().describe('Total gross amount for this item.'),
});

const PdfInvoiceDataExtractionInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF invoice file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type PdfInvoiceDataExtractionInput = z.infer<typeof PdfInvoiceDataExtractionInputSchema>;

const PdfInvoiceDataExtractionOutputSchema = z.object({
  invoiceNumber: z.string().describe('Unique invoice number.'),
  invoiceDate: z.string().describe('Date the invoice was issued, in YYYY-MM-DD format.'),
  issueDate: z.string().optional().describe('Date of service/goods issue, in YYYY-MM-DD format.'),
  dueDate: z.string().optional().describe('Payment due date, in YYYY-MM-DD format.'),
  seller: CompanyDetailsSchema.describe('Details of the selling company.'),
  buyer: CompanyDetailsSchema.describe('Details of the buying company.'),
  items: z.array(InvoiceItemSchema).describe('List of invoice items.'),
  totalNet: z.number().describe('Total net amount of the invoice.'),
  totalGross: z.number().describe('Total gross amount of the invoice.'),
  totalVat: z.number().describe('Total VAT amount of the invoice.'),
  currency: z.string().optional().describe('Currency of the invoice (e.g., PLN, EUR, USD).'),
});
export type PdfInvoiceDataExtractionOutput = z.infer<typeof PdfInvoiceDataExtractionOutputSchema>;

export async function extractPdfInvoiceData(input: PdfInvoiceDataExtractionInput): Promise<PdfInvoiceDataExtractionOutput> {
  return pdfInvoiceDataExtractionFlow(input);
}

const pdfInvoiceDataExtractionPrompt = ai.definePrompt({
  name: 'pdfInvoiceDataExtractionPrompt',
  input: { schema: PdfInvoiceDataExtractionInputSchema },
  output: { schema: PdfInvoiceDataExtractionOutputSchema },
  config: {
    model: 'googleai/gemini-1.5-flash',
  },
  prompt: `You are an AI assistant specialized in extracting structured data from PDF invoices.
  Your task is to analyze the provided PDF invoice content and extract key information into a structured JSON format, adhering to the specified schema.
  
  Extract the following details:
  - Invoice Number
  - Invoice Date, Issue Date, Due Date (if available, format YYYY-MM-DD). If only one date is present, use it for 'invoiceDate'.
  - Seller's details: Company Name, NIP/Tax ID, REGON (if available), and Address (street, city, postal code, country).
  - Buyer's details: Company Name, NIP/Tax ID, REGON (if available), and Address (street, city, postal code, country).
  - A list of invoice items, each including: Description, Quantity, Unit (e.g., szt.), Unit Price (net), VAT Rate (as percentage), Total Net for the item, Total Gross for the item.
  - Total Net amount of the invoice.
  - Total Gross amount of the invoice.
  - Total VAT amount of the invoice.
  - Currency of the invoice (e.g., PLN).

  The output must be a JSON object strictly conforming to the provided output schema.
  If a field is not found in the invoice, omit optional fields or use appropriate default values for required fields (e.g., empty string for string fields). Ensure all numerical values are parsed correctly as numbers.
  
  PDF Content: {{media url=pdfDataUri}}`,
});

const pdfInvoiceDataExtractionFlow = ai.defineFlow(
  {
    name: 'pdfInvoiceDataExtractionFlow',
    inputSchema: PdfInvoiceDataExtractionInputSchema,
    outputSchema: PdfInvoiceDataExtractionOutputSchema,
  },
  async (input) => {
    const { output } = await pdfInvoiceDataExtractionPrompt(input);

    if (!output) {
      throw new Error('Failed to extract invoice data.');
    }
    return output;
  }
);
