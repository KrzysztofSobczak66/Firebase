'use server';
/**
 * @fileOverview An AI-powered tool for validating KSeF XML invoice files.
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
  prompt: `You are an expert in Polish KSeF XML schema (FA(3)) validation. Analyze the XML:
  {{xmlContent}}`,
});

export async function ksefXMLValidation(
  input: KSeFXMLValidationInput
): Promise<KSeFXMLValidationOutput> {
  const { output } = await ksefXMLValidationPrompt(input);
  return output!;
}
