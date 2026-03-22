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
});
export type KSeFXMLValidationOutput = z.infer<typeof KSeFXMLValidationOutputSchema>;

export async function ksefXMLValidation(
  input: KSeFXMLValidationInput
): Promise<KSeFXMLValidationOutput> {
  return ksefXMLValidationFlow(input);
}

const ksefXMLValidationPrompt = ai.definePrompt({
  name: 'ksefXMLValidationPrompt',
  input: { schema: KSeFXMLValidationInputSchema },
  output: { schema: KSeFXMLValidationOutputSchema },
  prompt: `You are an expert in Polish KSeF XML schema validation. Your task is to analyze the provided XML content of a KSeF invoice file.

Identify any errors or non-compliance issues based on the typical KSeF XML schema rules and best practices. Then, provide clear, actionable suggestions for correcting these errors and ensuring the XML file is compliant.

Determine if the XML is valid or invalid and provide a list of specific errors and suggestions.

XML Content:
{{xmlContent}}
`,
});

const ksefXMLValidationFlow = ai.defineFlow(
  {
    name: 'ksefXMLValidationFlow',
    inputSchema: KSeFXMLValidationInputSchema,
    outputSchema: KSeFXMLValidationOutputSchema,
  },
  async (input) => {
    const { output } = await ksefXMLValidationPrompt(input);
    return output!;
  }
);
