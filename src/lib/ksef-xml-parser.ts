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

    // Pomocnicza funkcja do pobierania wartości taga ignorując prefiks ns0:
    const getVal = (tagName: string, parent: Element | Document = xmlDoc) => {
      const allElements = parent.getElementsByTagName("*");
      for (let i = 0; i < allElements.length; i++) {
        if (allElements[i].localName === tagName) {
          return allElements[i].textContent?.trim() || "";
        }
      }
      return "";
    };

    // Pomocnicza funkcja do pobierania listy elementów o danej nazwie lokalnej
    const getEls = (tagName: string, parent: Element | Document = xmlDoc) => {
      const all = parent.getElementsByTagName("*");
      const result: Element[] = [];
      for (let i = 0; i < all.length; i++) {
        if (all[i].localName === tagName) {
          result.push(all[i]);
        }
      }
      return result;
    };

    // Wyciąganie sekcji podmiotów
    const sellerEls = getEls("Podmiot1");
    const buyerEls = getEls("Podmiot2");
    const sellerEl = sellerEls[0];
    const buyerEl = buyerEls[0];

    const getAddressFromPodmiot = (podmiotEl: Element) => {
      if (!podmiotEl) return "";
      const l1 = getVal("AdresL1", podmiotEl);
      const l2 = getVal("AdresL2", podmiotEl);
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

    const data: ParsedKSeF = {
      invoiceNumber: getVal("P_2"),
      invoiceDate: getVal("P_1"),
      saleDate: getVal("P_6") || getVal("P_1"),
      sellerName: sellerEl ? getVal("Nazwa", sellerEl) : getVal("Nazwa"),
      sellerNip: sellerEl ? getVal("NIP", sellerEl) : getVal("NIP"),
      sellerAddress: sellerEl ? getAddressFromPodmiot(sellerEl) : "",
      buyerName: buyerEl ? getVal("Nazwa", buyerEl) : "",
      buyerNip: buyerEl ? getVal("NIP", buyerEl) : "",
      buyerAddress: buyerEl ? getAddressFromPodmiot(buyerEl) : "",
      totalNet: items.length > 0 ? items.reduce((sum, item) => sum + item.netValue, 0) : (parseFloat(getVal("P_13_1").replace(",", ".")) || gross / 1.23),
      totalVat: items.length > 0 ? items.reduce((sum, item) => sum + item.vatValue, 0) : (parseFloat(getVal("P_14_1").replace(",", ".")) || gross - (gross / 1.23)),
      totalGross: gross,
      currency,
      items
    };

    return data;
  } catch (error) {
    console.error("Błąd podczas parsowania XML:", error);
    return null;
  }
}
