import { z } from "zod";

/**
 * @fileOverview Schemat struktury KSeF FA(3) zgodny z dokumentacją Ministerstwa Finansów
 * na podstawie załączonego pliku wzorcowego.
 */

export const AdresSchema = z.object({
  KodKraju: z.string().default("PL"),
  AdresL1: z.string().describe("Ulica i numer"),
  AdresL2: z.string().describe("Miejscowość i kod pocztowy"),
  GLN: z.string().optional(),
});

export const PodmiotSchema = z.object({
  PrefiksPodatnika: z.string().optional().default("PL"),
  DaneIdentyfikacyjne: z.object({
    NIP: z.string(),
    Nazwa: z.string(),
  }),
  Adres: AdresSchema,
  Rola: z.string().optional(),
});

export const FaWierszSchema = z.object({
  NrWierszaFa: z.number(),
  P_7: z.string().describe("Nazwa (opis) towaru lub usługi"),
  GTIN: z.string().optional(),
  P_8A: z.string().optional().describe("Jednostka miary"),
  P_8B: z.number().describe("Ilość"),
  P_9A: z.number().describe("Cena jednostkowa netto"),
  P_11: z.number().describe("Wartość netto pozycji"),
  P_11Vat: z.number().describe("Kwota podatku"),
  P_12: z.string().describe("Stawka podatku (np. 23, 8, 5, 0, zw)"),
});

export const KSeFInvoiceSchema = z.object({
  Naglowek: z.object({
    KodFormularza: z.object({
      _text: z.string(),
      kodSystemowy: z.string(),
      wersjaSchemy: z.string(),
    }).optional(),
    WariantFormularza: z.number().default(3),
    DataWytworzeniaFa: z.string().describe("Data i czas w formacie ISO"),
  }),
  Podmiot1: PodmiotSchema.describe("Sprzedawca"),
  Podmiot2: PodmiotSchema.describe("Nabywca"),
  Podmiot3: PodmiotSchema.partial().optional().describe("Inny podmiot / Odbiorca"),
  Fa: z.object({
    KodWaluty: z.string().default("PLN"),
    P_1: z.string().describe("Data wystawienia"),
    P_2: z.string().describe("Numer faktury"),
    P_6: z.string().describe("Data dokonania dostawy"),
    // Pola sumaryczne dla stawek VAT (zgodnie z FA(3))
    P_13_1: z.number().optional().describe("Suma wartości sprzedaży netto - 23%"),
    P_14_1: z.number().optional().describe("Suma podatku - 23%"),
    P_13_2: z.number().optional().describe("Suma wartości sprzedaży netto - 8%"),
    P_14_2: z.number().optional().describe("Suma podatku - 8%"),
    P_13_3: z.number().optional().describe("Suma wartości sprzedaży netto - 5%"),
    P_14_3: z.number().optional().describe("Suma podatku - 5%"),
    P_15: z.number().describe("Wartość brutto faktury"),
    RodzajFaktury: z.string().default("VAT"),
    Adnotacje: z.object({
      P_16: z.number().default(2),
      P_17: z.number().default(2),
      P_18: z.number().default(2),
      P_18A: z.number().default(2),
      P_23: z.number().default(2),
    }).optional(),
    FaWiersze: z.array(FaWierszSchema),
    Rozliczenie: z.object({
      DoZaplaty: z.number(),
      SumaObciazen: z.number().optional(),
    }).optional(),
    Platnosc: z.object({
      TerminPlatnosci: z.object({
        Termin: z.string(),
      }),
      FormaPlatnosci: z.string(),
      RachunekBankowy: z.object({
        NrRB: z.string(),
        NazwaBanku: z.string().optional(),
      }).optional(),
    }).optional(),
  }),
});

export type KSeFInvoice = z.infer<typeof KSeFInvoiceSchema>;
export type FaWiersz = z.infer<typeof FaWierszSchema>;
