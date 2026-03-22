export const mockProfile = {
  name: "Tech Solutions Sp. z o.o.",
  nip: "1234567890",
  regon: "987654321",
  address: {
    street: "Warszawska 15/4",
    city: "Warszawa",
    postalCode: "00-001",
    country: "Polska"
  }
};

export const mockInvoices = Array.from({ length: 120 }, (_, i) => ({
  id: `INV-2024-${String(i + 1).padStart(3, '0')}`,
  invoiceNumber: `FV/${new Date().getFullYear()}/${String(i + 1).padStart(4, '0')}`,
  invoiceDate: "2024-03-20",
  type: i % 3 === 0 ? 'PURCHASE' : 'SALE',
  customerName: i % 2 === 0 ? "Global Corp" : "Local Retailer",
  totalNet: 1000 + i * 50,
  totalGross: (1000 + i * 50) * 1.23,
  currency: "PLN",
  status: i % 5 === 0 ? 'DRAFT' : (i % 7 === 0 ? 'REJECTED' : 'ACCEPTED'),
  ksefReference: i % 5 !== 0 ? `20240320-KSEF-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null
}));