/**
 * @fileOverview Zaawansowany, kliencki parser XML dla KSeF FA(3).
 * Wyciąga pełne dane faktury, w tym wszystkie pozycje towarowe, dane adresowe, 
 * płatności i szczegółowe sumy podatkowe.
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
  dueDate: string;
  sellerName: string;
  sellerNip: string;
  sellerAddress: string;
  buyerName: string;
  buyerNip: string;
  buyerAddress: string;
  bankAccount: string;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  amountToPay: number;
  currency: string;
  items: InvoiceItem[];
  // Dodatkowe pola techniczne
  vats: { rate: string; net: number; vat: number }[];
}

export function parseKSeFXMLClient(xmlString: string): ParsedKSeF | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Pomocnicza funkcja ignorująca prefiksy (np. ns0:)
    const getVal = (tagName: string, parent: Element | Document = xmlDoc) => {
      const all = parent.getElementsByTagName("*");
      for (let i = 0; i < all.length; i++) {
        if (all[i].localName === tagName) return all[i].textContent?.trim() || "";
      }
      return "";
    };

    const getEls = (tagName: string, parent: Element | Document = xmlDoc) => {
      const all = parent.getElementsByTagName("*");
      const res: Element[] = [];
      for (let i = 0; i < all.length; i++) {
        if (all[i].localName === tagName) res.push(all[i]);
      }
      return res;
    };

    const sellerEl = getEls("Podmiot1")[0];
    const buyerEl = getEls("Podmiot2")[0];

    const formatAddr = (el: Element) => {
      if (!el) return "";
      const l1 = getVal("AdresL1", el);
      const l2 = getVal("AdresL2", el);
      return [l1, l2].filter(Boolean).join(", ");
    };

    const wiersze = getEls("FaWiersz");
    const items: InvoiceItem[] = wiersze.map(w => ({
      description: getVal("P_7", w) || "Towar/Usługa",
      quantity: parseFloat(getVal("P_8B", w).replace(",", ".")) || 0,
      unitPrice: parseFloat(getVal("P_9A", w).replace(",", ".")) || 0,
      netValue: parseFloat(getVal("P_11", w).replace(",", ".")) || 0,
      vatValue: parseFloat(getVal("P_11Vat", w).replace(",", ".")) || 0,
      vatRate: getVal("P_12", w) ? getVal("P_12", w) + "%" : "23%"
    }));

    // Sumy VAT
    const vats = [
      { rate: "23%", net: parseFloat(getVal("P_13_1").replace(",", ".")) || 0, vat: parseFloat(getVal("P_14_1").replace(",", ".")) || 0 },
      { rate: "8%", net: parseFloat(getVal("P_13_2").replace(",", ".")) || 0, vat: parseFloat(getVal("P_14_2").replace(",", ".")) || 0 },
      { rate: "5%", net: parseFloat(getVal("P_13_3").replace(",", ".")) || 0, vat: parseFloat(getVal("P_14_3").replace(",", ".")) || 0 }
    ].filter(v => v.net > 0 || v.vat > 0);

    const gross = parseFloat(getVal("P_15").replace(",", ".")) || 0;

    return {
      invoiceNumber: getVal("P_2"),
      invoiceDate: getVal("P_1"),
      saleDate: getVal("P_6") || getVal("P_1"),
      dueDate: getVal("Termin"),
      sellerName: sellerEl ? getVal("Nazwa", sellerEl) : "",
      sellerNip: sellerEl ? getVal("NIP", sellerEl) : "",
      sellerAddress: formatAddr(sellerEl),
      buyerName: buyerEl ? getVal("Nazwa", buyerEl) : "",
      buyerNip: buyerEl ? getVal("NIP", buyerEl) : "",
      buyerAddress: formatAddr(buyerEl),
      bankAccount: getVal("NrRB"),
      totalNet: items.reduce((s, i) => s + i.netValue, 0) || (gross / 1.23),
      totalVat: items.reduce((s, i) => s + i.vatValue, 0) || (gross - (gross / 1.23)),
      totalGross: gross,
      amountToPay: parseFloat(getVal("DoZaplaty").replace(",", ".")) || gross,
      currency: getVal("KodWaluty") || "PLN",
      items,
      vats
    };
  } catch (e) {
    console.error("XML Parse Error:", e);
    return null;
  }
}