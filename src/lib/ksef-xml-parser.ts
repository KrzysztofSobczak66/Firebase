/**
 * @fileOverview Zaawansowany parser XML dla KSeF FA(3).
 * Wyciąga wszystkie dane: Podmiot 1, 2, 3, płatności, pełne adresy, kaucje i zestawienia VAT.
 */

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  netValue: number;
  vatRate: string;
  vatValue: number;
  gtin?: string;
}

export interface PartyData {
  name: string;
  nip: string;
  addressL1: string;
  addressL2: string;
  countryCode: string;
  gln?: string;
  role?: string;
}

export interface Charge {
  amount: number;
  reason: string;
}

export interface ParsedKSeF {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  saleDate: string;
  dueDate: string;
  currency: string;
  seller: PartyData;
  buyer: PartyData;
  recipient?: PartyData;
  bankAccount: string;
  bankName: string;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  amountToPay: number;
  items: InvoiceItem[];
  vats: { rate: string; net: number; vat: number }[];
  charges: Charge[];
  sumCharges: number;
  paymentMethod: string;
  paymentTermDescription: string;
  // Legacy fields for backward compatibility in UI
  sellerName: string;
  sellerNip: string;
  sellerAddress: string;
  buyerName: string;
  buyerNip: string;
  buyerAddress: string;
}

export function parseKSeFXMLClient(xmlString: string): ParsedKSeF | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

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

    const parseParty = (tagName: string): PartyData | undefined => {
      const el = getEls(tagName)[0];
      if (!el) return undefined;
      return {
        name: getVal("Nazwa", el),
        nip: getVal("NIP", el),
        addressL1: getVal("AdresL1", el),
        addressL2: getVal("AdresL2", el),
        countryCode: getVal("KodKraju", el) || "PL",
        gln: getVal("GLN", el),
        role: getVal("Rola", el)
      };
    };

    const seller = parseParty("Podmiot1")!;
    const buyer = parseParty("Podmiot2")!;
    const recipient = parseParty("Podmiot3");

    const wiersze = getEls("FaWiersz");
    const items: InvoiceItem[] = wiersze.map(w => ({
      description: getVal("P_7", w),
      gtin: getVal("GTIN", w),
      quantity: parseFloat(getVal("P_8B", w).replace(",", ".")) || 0,
      unitPrice: parseFloat(getVal("P_9A", w).replace(",", ".")) || 0,
      netValue: parseFloat(getVal("P_11", w).replace(",", ".")) || 0,
      vatValue: parseFloat(getVal("P_11Vat", w).replace(",", ".")) || 0,
      vatRate: getVal("P_12", w)
    }));

    const vats = [
      { rate: "23%", net: parseFloat(getVal("P_13_1").replace(",", ".")) || 0, vat: parseFloat(getVal("P_14_1").replace(",", ".")) || 0 },
      { rate: "8%", net: parseFloat(getVal("P_13_2").replace(",", ".")) || 0, vat: parseFloat(getVal("P_14_2").replace(",", ".")) || 0 },
      { rate: "5%", net: parseFloat(getVal("P_13_3").replace(",", ".")) || 0, vat: parseFloat(getVal("P_14_3").replace(",", ".")) || 0 },
      { rate: "0%", net: parseFloat(getVal("P_13_4").replace(",", ".")) || 0, vat: 0 },
      { rate: "zw", net: parseFloat(getVal("P_13_5").replace(",", ".")) || 0, vat: 0 }
    ].filter(v => v.net !== 0 || v.vat !== 0);

    const obciazeniaEls = getEls("Obciazenia");
    const charges: Charge[] = obciazeniaEls.map(o => ({
      amount: parseFloat(getVal("Kwota", o).replace(",", ".")) || 0,
      reason: getVal("Powod", o)
    }));

    const gross = parseFloat(getVal("P_15").replace(",", ".")) || 0;
    const amountToPay = parseFloat(getVal("DoZaplaty").replace(",", ".")) || gross;

    return {
      id: 'ksef-' + Date.now() + Math.random().toString(36).substr(2, 5),
      invoiceNumber: getVal("P_2"),
      invoiceDate: getVal("P_1"),
      saleDate: getVal("P_6") || getVal("P_1"),
      dueDate: getVal("Termin"),
      currency: getVal("KodWaluty") || "PLN",
      seller,
      buyer,
      recipient,
      bankAccount: getVal("NrRB"),
      bankName: getVal("NazwaBanku"),
      totalNet: vats.reduce((s, v) => s + v.net, 0) || (gross / 1.23),
      totalVat: vats.reduce((s, v) => s + v.vat, 0) || (gross - (gross / 1.23)),
      totalGross: gross,
      amountToPay: amountToPay,
      items,
      vats,
      charges,
      sumCharges: parseFloat(getVal("SumaObciazen").replace(",", ".")) || 0,
      paymentMethod: getVal("FormaPlatnosci"),
      paymentTermDescription: `${getVal("Ilosc")} ${getVal("Jednostka")}`,
      // Legacy mapping
      sellerName: seller.name,
      sellerNip: seller.nip,
      sellerAddress: `${seller.addressL1}, ${seller.addressL2}`,
      buyerName: buyer.name,
      buyerNip: buyer.nip,
      buyerAddress: `${buyer.addressL1}, ${buyer.addressL2}`
    };
  } catch (e) {
    console.error("Critical XML Parse Error:", e);
    return null;
  }
}
