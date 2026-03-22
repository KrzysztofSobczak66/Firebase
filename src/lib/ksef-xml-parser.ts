
/**
 * @fileOverview Zaawansowany, kliencki parser XML dla KSeF FA(3).
 * Wyciąga pełne dane faktury, w tym pozycje i dane adresowe.
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

    // Parsowanie pozycji faktury (FaWiersz)
    const wierszeEls = Array.from(xmlDoc.getElementsByTagNameNS("*", "FaWiersz") || xmlDoc.getElementsByTagName("FaWiersz"));
    const items: InvoiceItem[] = wierszeEls.map(w => ({
      description: getVal("P_7", w),
      quantity: parseFloat(getVal("P_8B", w)) || 0,
      unitPrice: parseFloat(getVal("P_9A", w)) || 0,
      netValue: parseFloat(getVal("P_11", w)) || 0,
      vatValue: parseFloat(getVal("P_11Vat", w)) || 0,
      vatRate: getVal("P_12", w) + "%"
    }));

    const data: ParsedKSeF = {
      invoiceNumber: getVal("P_2"),
      invoiceDate: getVal("P_1"),
      saleDate: getVal("P_6"),
      sellerName: podmiot1 ? getVal("Nazwa", podmiot1) : "",
      sellerNip: podmiot1 ? getVal("NIP", podmiot1) : "",
      sellerAddress: getAddress(podmiot1 as Element),
      buyerName: podmiot2 ? getVal("Nazwa", podmiot2) : "",
      buyerNip: podmiot2 ? getVal("NIP", podmiot2) : "",
      buyerAddress: getAddress(podmiot2 as Element),
      totalNet: parseFloat(getVal("P_13_1").replace(",", ".")) || 0,
      totalVat: parseFloat(getVal("P_14_1").replace(",", ".")) || 0,
      totalGross: parseFloat(getVal("P_15").replace(",", ".")) || 0,
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
