/**
 * @fileOverview Zaawansowany, kliencki parser XML dla KSeF FA(3).
 * Wyciąga pełne dane faktury, w tym wszystkie pozycje towarowe i dane adresowe.
 * Obsługuje przestrzenie nazw (namespaces) w sposób elastyczny, ignorując prefiksy.
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

    // Pomocnicza funkcja do pobierania taga z konkretnego rodzica
    const getValFrom = (tagName: string, parent: Element) => {
      const children = parent.getElementsByTagName("*");
      for (let i = 0; i < children.length; i++) {
        if (children[i].localName === tagName) {
          return children[i].textContent?.trim() || "";
        }
      }
      return "";
    };

    // Szukamy sekcji podmiotów
    const sellerEls = getEls("Podmiot1");
    const buyerEls = getEls("Podmiot2");
    const sellerEl = sellerEls[0];
    const buyerEl = buyerEls[0];

    // Wyciąganie adresu z Podmiotu
    const getAddressFromPodmiot = (podmiotEl: Element) => {
      if (!podmiotEl) return "";
      const l1 = getValFrom("AdresL1", podmiotEl);
      const l2 = getValFrom("AdresL2", podmiotEl);
      return l1 && l2 ? `${l1}, ${l2}` : (l1 || l2 || "");
    };

    // Szukamy wierszy faktury (FaWiersz)
    const wierszeEls = getEls("FaWiersz");
    
    const items: InvoiceItem[] = wierszeEls.map(w => {
      const qStr = getValFrom("P_8B", w).replace(",", ".");
      const pStr = getValFrom("P_9A", w).replace(",", ".");
      const nStr = getValFrom("P_11", w).replace(",", ".");
      const vStr = getValFrom("P_11Vat", w).replace(",", ".");
      
      return {
        description: getValFrom("P_7", w) || "Towar/Usługa",
        quantity: parseFloat(qStr) || 0,
        unitPrice: parseFloat(pStr) || 0,
        netValue: parseFloat(nStr) || 0,
        vatValue: parseFloat(vStr) || 0,
        vatRate: getValFrom("P_12", w) ? getValFrom("P_12", w) + "%" : "23%"
      };
    });

    const gross = parseFloat(getVal("P_15").replace(",", ".")) || 0;
    const currency = getVal("KodWaluty") || "PLN";

    const data: ParsedKSeF = {
      invoiceNumber: getVal("P_2"),
      invoiceDate: getVal("P_1"),
      saleDate: getVal("P_6") || getVal("P_1"),
      sellerName: sellerEl ? getValFrom("Nazwa", sellerEl) : getVal("Nazwa"),
      sellerNip: sellerEl ? getValFrom("NIP", sellerEl) : getVal("NIP"),
      sellerAddress: sellerEl ? getAddressFromPodmiot(sellerEl) : "",
      buyerName: buyerEl ? getValFrom("Nazwa", buyerEl) : "",
      buyerNip: buyerEl ? getValFrom("NIP", buyerEl) : "",
      buyerAddress: buyerEl ? getAddressFromPodmiot(buyerEl) : "",
      totalNet: items.length > 0 ? items.reduce((sum, item) => sum + item.netValue, 0) : (parseFloat(getVal("P_13_1").replace(",", ".")) || gross / 1.23),
      totalVat: items.length > 0 ? items.reduce((sum, item) => sum + item.vatValue, 0) : (parseFloat(getVal("P_14_1").replace(",", ".")) || gross - (gross / 1.23)),
      totalGross: gross,
      currency,
      items
    };

    return data;
  } catch (error) {
    console.error("Krytyczny błąd podczas parsowania KSeF XML:", error);
    return null;
  }
}
