'use server';
/**
 * @fileOverview Genkit flow for parsing KSeF FA(3) XML content into structured JSON.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/google-genai';

const KSeFParseInputSchema = z.object({
  xmlContent: z.string().describe('Raw XML content of the KSeF invoice.'),
});

const KSeFParseOutputSchema = z.object({
  invoiceNumber: z.string().describe('P_2 field: Invoice number.'),
  invoiceDate: z.string().describe('P_1 field: Issue date.'),
  sellerName: z.string().describe('Podmiot1/Nazwa: Seller company name.'),
  sellerNip: z.string().describe('Podmiot1/NIP: Seller tax ID.'),
  buyerName: z.string().describe('Podmiot2/Nazwa: Buyer company name.'),
  buyerNip: z.string().describe('Podmiot2/NIP: Buyer tax ID.'),
  totalNet: z.number().describe('Sum of net amounts (e.g., P_13_1 + P_13_3).'),
  totalVat: z.number().describe('Sum of VAT amounts (e.g., P_14_1 + P_14_3).'),
  totalGross: z.number().describe('P_15 field: Total gross amount.'),
  currency: z.string().describe('KodWaluty field: Currency (e.g., PLN).'),
  items: z.array(z.object({
    description: z.string().describe('P_7: Item description.'),
    quantity: z.number().describe('P_8B: Quantity.'),
    netPrice: z.number().describe('P_9A: Net unit price.'),
    vatRate: z.string().describe('P_12: VAT rate.'),
  })).optional(),
});

export type KSeFParseOutput = z.infer<typeof KSeFParseOutputSchema>;

const ksefParsePrompt = ai.definePrompt({
  name: 'ksefParsePrompt',
  model: gemini15Flash,
  input: { schema: KSeFParseInputSchema },
  output: { schema: KSeFParseOutputSchema },
  prompt: `You are a specialist in Polish KSeF XML (FA(3) schema). 
  Parse the following XML content and extract all required fields. 
  Pay close attention to namespaces (e.g., ns0:).
  - P_1 is the issue date.
  - P_2 is the invoice number.
  - P_15 is the gross total.
  - Podmiot1 is the seller, Podmiot2 is the buyer.
  
  XML Content:
  {{xmlContent}}`,
});

export async function parseKSeFXML(xmlContent: string): Promise<KSeFParseOutput> {
  try {
    const { output } = await ksefParsePrompt({ xmlContent });
    if (!output) throw new Error('AI returned empty output.');
    return output;
  } catch (error: any) {
    console.error("AI Parse Error:", error);
    throw error;
  }
}
