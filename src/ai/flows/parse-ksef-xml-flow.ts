'use server';
/**
 * @fileOverview Szybki parser XML dla KSeF FA(3) - metoda hybrydowa (Regex + AI fallback).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KSeFParseOutputSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  sellerName: z.string(),
  sellerNip: z.string(),
  buyerName: z.string(),
  buyerNip: z.string(),
  totalGross: z.number(),
  currency: z.string().default('PLN'),
});

export type KSeFParseOutput = z.infer<typeof KSeFParseOutputSchema>;

/**
 * Manualny parser XML dla KSeF - 100% stabilności dla ustrukturyzowanych danych.
 */
function manualParseKSeF(xml: string): KSeFParseOutput | null {
  try {
    const getTagValue = (tag: string, content: string) => {
      const regex = new RegExp(`<[^>]*${tag}[^>]*>([^<]*)<`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : '';
    };

    // Wyciąganie sekcji podmiotów
    const podmiot1Match = xml.match(/<[^>]*Podmiot1[^>]*>([\s\S]*?)<\/[^>]*Podmiot1[^>]*>/i);
    const podmiot2Match = xml.match(/<[^>]*Podmiot2[^>]*>([\s\S]*?)<\/[^>]*Podmiot2[^>]*>/i);
    
    const podmiot1 = podmiot1Match ? podmiot1Match[1] : '';
    const podmiot2 = podmiot2Match ? podmiot2Match[1] : '';

    const data: KSeFParseOutput = {
      invoiceNumber: getTagValue('P_2', xml),
      invoiceDate: getTagValue('P_1', xml),
      sellerName: getTagValue('Nazwa', podmiot1),
      sellerNip: getTagValue('NIP', podmiot1),
      buyerName: getTagValue('Nazwa', podmiot2),
      buyerNip: getTagValue('NIP', podmiot2),
      totalGross: parseFloat(getTagValue('P_15', xml)) || 0,
      currency: getTagValue('KodWaluty', xml) || 'PLN',
    };

    if (!data.invoiceNumber || !data.sellerName) return null;
    return data;
  } catch (e) {
    console.error("Manual parse error:", e);
    return null;
  }
}

export async function parseKSeFXML(xmlContent: string): Promise<KSeFParseOutput> {
  // 1. Najpierw spróbuj manualnie (szybko i za darmo)
  const manualData = manualParseKSeF(xmlContent);
  if (manualData) return manualData;

  // 2. Jeśli manualny zawiedzie, użyj AI jako backupu
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Parse this Polish KSeF XML and return JSON with: invoiceNumber (P_2), invoiceDate (P_1), sellerName (Podmiot1/Nazwa), sellerNip (Podmiot1/NIP), buyerName (Podmiot2/Nazwa), buyerNip (Podmiot2/NIP), totalGross (P_15), currency (KodWaluty). XML: ${xmlContent}`,
      output: { schema: KSeFParseOutputSchema }
    });
    return response.output!;
  } catch (error) {
    console.error("AI Parse Error:", error);
    throw new Error("Nie udało się sparsować pliku XML żadną metodą.");
  }
}
