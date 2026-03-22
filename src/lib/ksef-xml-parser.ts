/**
 * @fileOverview Ultra-szybki, kliencki parser XML dla KSeF FA(3).
 * Działa bezpośrednio w przeglądarce, eliminując potrzebę komunikacji z serwerem AI dla plików XML.
 */

export interface ParsedKSeF {
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  sellerNip: string;
  buyerName: string;
  buyerNip: string;
  totalGross: number;
  currency: string;
}

export function parseKSeFXMLClient(xmlString: string): ParsedKSeF | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Pomocnicza funkcja do wyciągania wartości tagów (obsługuje namespace np. ns0:)
    const getVal = (tagName: string, parent: Element | Document = xmlDoc) => {
      const el = parent.getElementsByTagNameNS("*", tagName)[0] || parent.getElementsByTagName(tagName)[0];
      return el ? el.textContent?.trim() || "" : "";
    };

    // Szukamy sekcji podmiotów
    const podmiot1 = xmlDoc.getElementsByTagNameNS("*", "Podmiot1")[0] || xmlDoc.getElementsByTagName("Podmiot1")[0];
    const podmiot2 = xmlDoc.getElementsByTagNameNS("*", "Podmiot2")[0] || xmlDoc.getElementsByTagName("Podmiot2")[0];

    const data: ParsedKSeF = {
      invoiceNumber: getVal("P_2"),
      invoiceDate: getVal("P_1"),
      sellerName: podmiot1 ? getVal("Nazwa", podmiot1) : "",
      sellerNip: podmiot1 ? getVal("NIP", podmiot1) : "",
      buyerName: podmiot2 ? getVal("Nazwa", podmiot2) : "",
      buyerNip: podmiot2 ? getVal("NIP", podmiot2) : "",
      totalGross: parseFloat(getVal("P_15").replace(",", ".")) || 0,
      currency: getVal("KodWaluty") || "PLN",
    };

    if (!data.invoiceNumber || !data.invoiceDate) {
      console.warn("Plik XML nie zawiera wymaganych pól KSeF (P_1, P_2).");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Błąd parsowania XML w przeglądarce:", error);
    return null;
  }
}
