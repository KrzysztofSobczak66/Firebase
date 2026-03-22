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

    // Pomocnicza funkcja do pobierania wartości taga bez względu na prefiks (ns0:, itp.)
    const getVal = (tagName: string, parent: Element | Document = xmlDoc) => {
      const elements = parent.getElementsByTagName("*");
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].localName === tagName) {
          return elements[i].textContent?.trim() || "";
        }
      }
      return "";
    };

    // Pomocnicza funkcja do pobierania listy elementów o danej nazwie lokalnej
    const getEls = (tagName: string, parent: Element | Document = xmlDoc) => {
      const all = parent.getElementsByTagName("*");
      const result: Element[] = [];
      for (let i = 0; i < all.length; i++) {
        if (all[i].localName === tagName) result.push(all[i]);
      }
      return result;
    };

    const getAddress = (tagName: string) => {
      const podmioty = getEls(tagName);
      if (podmioty.length === 0) return "";
      const podmiot = podmioty[0];
      const l1 = getVal("AdresL1", podmiot);
      const l2 = getVal("AdresL2", podmiot);
      return l1 && l2 ? `${l1}, ${l2}` : (l1 || l2 || "");
    };

    // Szukamy wierszy faktury (FaWiersz)
    const wierszeEls = getEls("FaWiersz");
    
    const items: InvoiceItem[] = wierszeEls.map(w => {
      const qStr = getVal("P_8B", w).replace(",", ".");
      const pStr = getVal("P_9A", w).replace(",", ".");
      const nStr = getVal("P_11", w).replace(",", ".");
      const vStr = getVal("P_11Vat", w).replace(",", ".");
      
      return {
        description: getVal("P_7", w) || "Towar/Usługa",
        quantity: parseFloat(qStr) || 0,
        unitPrice: parseFloat(pStr) || 0,
        netValue: parseFloat(nStr) || 0,
        vatValue: parseFloat(vStr) || 0,
        vatRate: getVal("P_12", w) ? getVal("P_12", w) + "%" : "23%"
      };
    });

    const gross = parseFloat(getVal("P_15").replace(",", ".")) || 0;
    const currency = getVal("KodWaluty") || "PLN";

    // Wyciąganie danych podmiotów
    const sellerEl = getEls("Podmiot1")[0];
    const buyerEl = getEls("Podmiot2")[0];

    const data: ParsedKSeF = {
      invoiceNumber: getVal("P_2"),
      invoiceDate: getVal("P_1"),
      saleDate: getVal("P_6") || getVal("P_1"),
      sellerName: getVal("Nazwa", sellerEl || xmlDoc),
      sellerNip: getVal("NIP", sellerEl || xmlDoc),
      sellerAddress: getAddress("Podmiot1"),
      buyerName: getVal("Nazwa", buyerEl || xmlDoc),
      buyerNip: getVal("NIP", buyerEl || xmlDoc),
      buyerAddress: getAddress("Podmiot2"),
      totalNet: items.reduce((sum, item) => sum + item.netValue, 0) || gross,
      totalVat: items.reduce((sum, item) => sum + item.vatValue, 0),
      totalGross: gross,
      currency,
      items
    };

    if (!data.invoiceNumber || !data.invoiceDate) return null;

    return data;
  } catch (error) {
    console.error("Błąd parsowania XML:", error);
    return null;
  }
}
