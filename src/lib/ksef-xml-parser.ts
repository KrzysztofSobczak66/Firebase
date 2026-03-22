/**
 * @fileOverview Zaawansowany, kliencki parser XML dla KSeF FA(3).
 * Wyciąga pełne dane faktury, w tym wszystkie pozycje towarowe i dane adresowe.
 * Obsługuje przestrzenie nazw (namespaces) w sposób elastyczny.
 */

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  netValue: number;
  vatRate: string;
  vatValue: number;
}

export interface ParsedKSeF {
  invoiceNumber: string;
  invoiceDate: string;
  saleDate: string;
  sellerName: string;
  sellerNip: string;
  sellerAddress: string;
  buyerName: string;
  buyerNip: string;
  buyerAddress: string;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  currency: string;
  items: InvoiceItem[];
}

export function parseKSeFXMLClient(xmlString: string): ParsedKSeF | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const getVal = (tagName: string, parent: Element | Document = xmlDoc) => {
      const el = parent.getElementsByTagNameNS("*", tagName)[0] || parent.getElementsByTagName(tagName)[0];
      return el ? el.textContent?.trim() || "" : "";
    };

    const getEls = (tagName: string, parent: Element | Document = xmlDoc) => {
      const els = parent.getElementsByTagNameNS("*", tagName);
      if (els.length > 0) return Array.from(els);
      return Array.from(parent.getElementsByTagName(tagName));
    };

    const getAddress = (parent: Element | null) => {
      if (!parent) return "";
      const adr = parent.getElementsByTagNameNS("*", "Adres")[0] || parent.getElementsByTagName("Adres")[0];
      if (!adr) return "";
      const l1 = getVal("AdresL1", adr);
      const l2 = getVal("AdresL2", adr);
      return `${l1}, ${l2}`;
    };

    const podmiot1 = xmlDoc.getElementsByTagNameNS("*", "Podmiot1")[0] || xmlDoc.getElementsByTagName("Podmiot1")[0];
    const podmiot2 = xmlDoc.getElementsByTagNameNS("*", "Podmiot2")[0] || xmlDoc.getElementsByTagName("Podmiot2")[0];

    // Pobieranie sekcji Fa dla precyzyjniejszego wyszukiwania wierszy
    const faSection = xmlDoc.getElementsByTagNameNS("*", "Fa")[0] || xmlDoc.getElementsByTagName("Fa")[0];
    
    // Kluczowe: wyszukiwanie FaWiersz w całym dokumencie lub sekcji Fa
    const wierszeEls = getEls("FaWiersz", faSection || xmlDoc);
    
    const items: InvoiceItem[] = wierszeEls.map(w => {
      return {
        description: getVal("P_7", w),
        quantity: parseFloat(getVal("P_8B", w).replace(",", ".")) || 0,
        unitPrice: parseFloat(getVal("P_9A", w).replace(",", ".")) || 0,
        netValue: parseFloat(getVal("P_11", w).replace(",", ".")) || 0,
        vatValue: parseFloat(getVal("P_11Vat", w).replace(",", ".")) || 0,
        vatRate: getVal("P_12", w) ? getVal("P_12", w) + "%" : "23%"
      };
    });

    const p13_1 = parseFloat(getVal("P_13_1").replace(",", ".")) || 0;
    const p13_2 = parseFloat(getVal("P_13_2").replace(",", ".")) || 0;
    const p13_3 = parseFloat(getVal("P_13_3").replace(",", ".")) || 0;
    const sumNet = p13_1 + p13_2 + p13_3;
                   
    const p14_1 = parseFloat(getVal("P_14_1").replace(",", ".")) || 0;
    const p14_2 = parseFloat(getVal("P_14_2").replace(",", ".")) || 0;
    const p14_3 = parseFloat(getVal("P_14_3").replace(",", ".")) || 0;
    const sumVat = p14_1 + p14_2 + p14_3;

    const gross = parseFloat(getVal("P_15").replace(",", ".")) || 0;

    const data: ParsedKSeF = {
      invoiceNumber: getVal("P_2"),
      invoiceDate: getVal("P_1"),
      saleDate: getVal("P_6") || getVal("P_1"),
      sellerName: podmiot1 ? getVal("Nazwa", podmiot1) : "",
      sellerNip: podmiot1 ? getVal("NIP", podmiot1) : "",
      sellerAddress: getAddress(podmiot1 as Element),
      buyerName: podmiot2 ? getVal("Nazwa", podmiot2) : "",
      buyerNip: podmiot2 ? getVal("NIP", podmiot2) : "",
      buyerAddress: getAddress(podmiot2 as Element),
      totalNet: sumNet || (gross - sumVat),
      totalVat: sumVat,
      totalGross: gross,
      currency: getVal("KodWaluty") || "PLN",
      items
    };

    if (!data.invoiceNumber || !data.invoiceDate) return null;

    return data;
  } catch (error) {
    console.error("Błąd parsowania XML:", error);
    return null;
  }
}
