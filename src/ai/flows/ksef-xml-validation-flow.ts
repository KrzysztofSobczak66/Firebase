'use server';
/**
 * @fileOverview An AI-powered tool for validating KSeF XML invoice files.
 *
 * - ksefXMLValidation - A function that handles the KSeF XML validation process.
 * - KSeFXMLValidationInput - The input type for the ksefXMLValidation function.
 * - KSeFXMLValidationOutput - The return type for the ksefXMLValidation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KSeFXMLValidationInputSchema = z.object({
  xmlContent: z
    .string()
    .describe('The content of the KSeF XML invoice file as a string.'),
});
export type KSeFXMLValidationInput = z.infer<typeof KSeFXMLValidationInputSchema>;

const KSeFXMLValidationOutputSchema = z.object({
  isValid: z
    .boolean()
    .describe('Whether the XML file is considered valid by the AI.'),
  errors: z
    .array(z.string())
    .describe('A list of identified errors in the XML file.'),
  suggestions: z
    .array(z.string())
    .describe('A list of suggestions for correcting the identified errors and ensuring compliance.'),
  technicalDetails: z.object({
    invoiceNumber: z.string().optional(),
    totalGross: z.number().optional(),
    currency: z.string().optional(),
    sellerNip: z.string().optional(),
    buyerNip: z.string().optional(),
  }).optional().describe('Key technical fields extracted for quick verification.'),
});
export type KSeFXMLValidationOutput = z.infer<typeof KSeFXMLValidationOutputSchema>;

const ksefXMLValidationPrompt = ai.definePrompt({
  name: 'ksefXMLValidationPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: KSeFXMLValidationInputSchema },
  output: { schema: KSeFXMLValidationOutputSchema },
  prompt: `You are an expert in Polish KSeF XML schema (FA(3)) validation. Your task is to analyze the provided XML content of a KSeF invoice.

Identify any errors or non-compliance issues based on the official KSeF FA(3) schema rules. Focus on:
1. Field mapping (e.g., P_1 is date, P_15 is gross total).
2. Tax rate codes in P_12.
3. Correct net/vat sums (P_13_x, P_14_x matching P_15).

Determine if the XML is valid or invalid and provide a list of specific errors and suggestions.
Also, extract the core technical details from the XML fields like P_2 (invoice number) and P_15 (gross).

XML Content:
{{xmlContent}}
`,
});

export async function ksefXMLValidation(
  input: KSeFXMLValidationInput
): Promise<KSeFXMLValidationOutput> {
  const { output } = await ksefXMLValidationPrompt(input);
  return output!;
}
