'use server';
/**
 * @fileOverview Szybki parser XML dla KSeF FA(3) - 100% lokalny, bez AI.
 * Wykorzystuje zoptymalizowane wyrażenia regularne do wyciągania danych z ustrukturyzowanego pliku XML.
 */

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
 * Manualny parser XML dla KSeF - wyciąga kluczowe dane bez użycia ciężkich bibliotek czy AI.
 * Obsługuje opcjonalne przestrzenie nazw (np. ns0:).
 */
function manualParseKSeF(xml: string): KSeFParseOutput | null {
  try {
    const getTagValue = (tag: string, content: string) => {
      // Szuka tagu z opcjonalnym prefiksem przestrzeni nazw
      const regex = new RegExp(`<([^>]*:)?${tag}[^>]*>([^<]*)<`, 'i');
      const match = content.match(regex);
      return match ? match[2].trim() : '';
    };

    // Wyciąganie sekcji podmiotów za pomocą bardziej elastycznych regexów
    const extractSection = (sectionName: string, fullXml: string) => {
      const regex = new RegExp(`<([^>]*:)?${sectionName}[^>]*>([\\s\\S]*?)<\\/([^>]*:)?${sectionName}>`, 'i');
      const match = fullXml.match(regex);
      return match ? match[2] : '';
    };

    const podmiot1 = extractSection('Podmiot1', xml);
    const podmiot2 = extractSection('Podmiot2', xml);

    const data: KSeFParseOutput = {
      invoiceNumber: getTagValue('P_2', xml),
      invoiceDate: getTagValue('P_1', xml),
      sellerName: getTagValue('Nazwa', podmiot1),
      sellerNip: getTagValue('NIP', podmiot1),
      buyerName: getTagValue('Nazwa', podmiot2),
      buyerNip: getTagValue('NIP', podmiot2),
      totalGross: parseFloat(getTagValue('P_15', xml).replace(',', '.')) || 0,
      currency: getTagValue('KodWaluty', xml) || 'PLN',
    };

    // Podstawowa walidacja - numer faktury i data są krytyczne
    if (!data.invoiceNumber || !data.invoiceDate) return null;
    
    return data;
  } catch (e) {
    console.error("Manual parse error:", e);
    return null;
  }
}

/**
 * Funkcja parsująca XML KSeF.
 * @returns Obiekt z danymi lub rzuca błąd w przypadku niepowodzenia.
 */
export async function parseKSeFXML(xmlContent: string): Promise<KSeFParseOutput> {
  const manualData = manualParseKSeF(xmlContent);
  if (manualData) {
    return manualData;
  }
  
  throw new Error("Nie udało się sparsować pliku XML. Upewnij się, że jest to poprawny plik KSeF FA(3).");
}
