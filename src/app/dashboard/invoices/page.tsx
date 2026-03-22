"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Download,
  Loader2,
  FileCode,
  ArrowUpDown,
  Filter,
  X,
  ChevronRight,
  Printer
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAllInvoices } from "@/lib/firestore"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

const PAGE_SIZE = 50

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  
  // Filtry
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sellerFilter, setSellerFilter] = useState("")
  const [buyerFilter, setBuyerFilter] = useState("")
  
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc' | null}>({ 
    key: 'invoiceDate', 
    direction: 'desc' 
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllInvoices()
        setInvoices(data || [])
      } catch (error) {
        toast({ variant: "destructive", title: "Błąd bazy", description: "Nie udało się pobrać faktur." })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDownloadPDF = async (invoiceNumber: string) => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Faktura_${invoiceNumber.replace(/\//g, '_')}.pdf`);
      toast({ title: "Sukces", description: "Dokument PDF został wygenerowany." });
    } catch (err) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się wygenerować PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = searchQuery === "" || 
        (inv.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesSeller = sellerFilter === "" || 
        (inv.sellerName || "").toLowerCase().includes(sellerFilter.toLowerCase()) ||
        (inv.sellerNip || "").includes(sellerFilter)
        
      const matchesBuyer = buyerFilter === "" || 
        (inv.buyerName || "").toLowerCase().includes(buyerFilter.toLowerCase()) ||
        (inv.buyerNip || "").includes(buyerFilter)

      const invDate = inv.invoiceDate || "";
      const matchesStartDate = startDate === "" || invDate >= startDate;
      const matchesEndDate = endDate === "" || invDate <= endDate;

      return matchesSearch && matchesSeller && matchesBuyer && matchesStartDate && matchesEndDate;
    })
  }, [searchQuery, sellerFilter, buyerFilter, startDate, endDate, invoices])

  const sortedInvoices = useMemo(() => {
    const items = [...filteredInvoices]
    if (sortConfig.direction !== null) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    }
    return items
  }, [filteredInvoices, sortConfig])

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedInvoices.slice(start, start + PAGE_SIZE)
  }, [sortedInvoices, currentPage])

  const totalPages = Math.ceil(sortedInvoices.length / PAGE_SIZE)

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStartDate("")
    setEndDate("")
    setSellerFilter("")
    setBuyerFilter("")
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Przeszukiwanie bazy faktur...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 text-primary font-bold">
            <Filter className="h-4 w-4" />
            Panel Filtrowania i Zakresu Dat
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Numer Faktury</label>
              <Input 
                placeholder="Szukaj numeru..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Sprzedawca / NIP</label>
              <Input 
                placeholder="Nazwa lub NIP..." 
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nabywca / NIP</label>
              <Input 
                placeholder="Nazwa lub NIP..." 
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Data Od</label>
              <Input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Data Do</label>
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Badge variant="secondary" className="px-3 py-1 font-bold">Wyniki: {sortedInvoices.length}</Badge>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-primary">
              <X className="h-4 w-4 mr-1" /> Wyczyść wszystkie filtry
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b">
            <TableRow>
              <TableHead onClick={() => handleSort('invoiceNumber')} className="cursor-pointer group whitespace-nowrap">
                Numer Faktury <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
              </TableHead>
              <TableHead onClick={() => handleSort('invoiceDate')} className="cursor-pointer group">
                Data Wyst. <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
              </TableHead>
              <TableHead>Sprzedawca / NIP</TableHead>
              <TableHead>Nabywca / NIP</TableHead>
              <TableHead onClick={() => handleSort('totalGross')} className="text-right cursor-pointer group">
                Brutto <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
              </TableHead>
              <TableHead className="w-[100px] text-center">Akcja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-bold text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell className="text-xs">{inv.invoiceDate}</TableCell>
                <TableCell>
                  <div className="text-[10px] leading-tight">
                    <p className="font-bold text-slate-700 truncate max-w-[180px]">{inv.sellerName}</p>
                    <p className="text-muted-foreground font-mono">{inv.sellerNip}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-[10px] leading-tight">
                    <p className="font-bold text-slate-700 truncate max-w-[180px]">{inv.buyerName}</p>
                    <p className="text-muted-foreground font-mono">{inv.buyerNip}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-slate-900">
                  {inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} <span className="text-[10px] font-normal text-muted-foreground ml-1">{inv.currency}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary hover:text-white h-8 px-3 font-bold">
                        <FileCode className="h-3.5 w-3.5 mr-1.5" />
                        PDF
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-slate-100 p-0 gap-0">
                      <DialogHeader className="sticky top-0 z-30 bg-white p-4 border-b flex flex-row items-center justify-between shadow-sm">
                        <DialogTitle className="text-lg flex items-center gap-2">
                          <FileCode className="h-5 w-5 text-primary" />
                          Podgląd Faktury: {inv.invoiceNumber}
                        </DialogTitle>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.print()} className="hidden md:flex">
                            <Printer className="h-4 w-4 mr-2" /> Drukuj
                          </Button>
                          <Button size="sm" onClick={() => handleDownloadPDF(inv.invoiceNumber)} disabled={isExporting}>
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                            Pobierz PDF
                          </Button>
                        </div>
                      </DialogHeader>
                      
                      <div className="p-10 flex justify-center bg-slate-200/40">
                        <div ref={invoiceRef} className="w-[210mm] min-h-[297mm] bg-white p-16 shadow-2xl text-slate-800 font-sans border border-slate-300 relative">
                          
                          {/* Top Header */}
                          <div className="flex justify-between items-start border-b-8 border-primary pb-8 mb-10">
                            <div>
                              <h1 className="text-5xl font-black text-primary tracking-tighter mb-2">FAKTURA VAT</h1>
                              <div className="bg-slate-900 text-white px-3 py-1 inline-block rounded text-sm font-bold tracking-widest">
                                ORYGINAŁ
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <p className="text-2xl font-black text-slate-700">Nr: {inv.invoiceNumber}</p>
                              <div className="grid grid-cols-2 gap-x-4 text-xs font-medium text-slate-500">
                                <p>Miejscowość:</p><p className="text-slate-900 font-bold">{inv.seller?.addressL2?.split(' ')[1] || 'Warszawa'}</p>
                                <p>Data wystawienia:</p><p className="text-slate-900 font-bold">{inv.invoiceDate}</p>
                                <p>Data sprzedaży:</p><p className="text-slate-900 font-bold">{inv.saleDate || inv.invoiceDate}</p>
                              </div>
                            </div>
                          </div>

                          {/* Parties Grid */}
                          <div className="grid grid-cols-2 gap-10 mb-12">
                            {/* Podmiot 1 - Sprzedawca */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                              <h2 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] border-b border-slate-200 pb-1">Sprzedawca</h2>
                              <p className="font-black text-xl text-slate-900 mb-2">{inv.seller?.name || inv.sellerName}</p>
                              <div className="space-y-1 text-sm">
                                <p className="font-bold">NIP: <span className="font-mono text-primary">{inv.seller?.nip || inv.sellerNip}</span></p>
                                <p className="text-slate-600">{inv.seller?.addressL1 || inv.sellerAddress}</p>
                                <p className="text-slate-600">{inv.seller?.addressL2}</p>
                                {inv.seller?.gln && <p className="text-xs text-slate-400 mt-2">GLN: {inv.seller.gln}</p>}
                              </div>
                            </div>

                            {/* Podmiot 2 - Nabywca */}
                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                              <h2 className="text-[10px] font-black uppercase text-primary/40 mb-4 tracking-[0.2em] border-b border-primary/10 pb-1">Nabywca</h2>
                              <p className="font-black text-xl text-slate-900 mb-2">{inv.buyer?.name || inv.buyerName}</p>
                              <div className="space-y-1 text-sm">
                                <p className="font-bold">NIP: <span className="font-mono text-primary">{inv.buyer?.nip || inv.buyerNip}</span></p>
                                <p className="text-slate-600">{inv.buyer?.addressL1 || inv.buyerAddress}</p>
                                <p className="text-slate-600">{inv.buyer?.addressL2}</p>
                                {inv.buyer?.gln && <p className="text-xs text-slate-400 mt-2">GLN: {inv.buyer.gln}</p>}
                              </div>
                            </div>

                            {/* Podmiot 3 - Odbiorca (if exists) */}
                            {inv.recipient?.name && (
                              <div className="col-span-2 bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200">
                                <h2 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em]">Odbiorca / Podmiot 3</h2>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-lg text-slate-800">{inv.recipient.name}</p>
                                    <p className="text-sm text-slate-600">{inv.recipient.addressL1}, {inv.recipient.addressL2}</p>
                                  </div>
                                  {inv.recipient.gln && <p className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">GLN: {inv.recipient.gln}</p>}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Items Table */}
                          <div className="mb-12">
                            <Table className="border rounded-xl overflow-hidden shadow-sm">
                              <TableHeader className="bg-slate-100 border-b-2">
                                <TableRow className="h-12">
                                  <TableHead className="w-10 text-center font-black text-slate-600 text-[10px] uppercase">Lp.</TableHead>
                                  <TableHead className="font-black text-slate-600 text-[10px] uppercase">Nazwa towaru lub usługi</TableHead>
                                  <TableHead className="text-center font-black text-slate-600 text-[10px] uppercase">Ilość</TableHead>
                                  <TableHead className="text-right font-black text-slate-600 text-[10px] uppercase">Cena netto</TableHead>
                                  <TableHead className="text-center font-black text-slate-600 text-[10px] uppercase">VAT</TableHead>
                                  <TableHead className="text-right font-black text-slate-600 text-[10px] uppercase">Wartość netto</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {inv.items?.length > 0 ? inv.items.map((item: any, idx: number) => (
                                  <TableRow key={idx} className="border-b h-14 hover:bg-slate-50/50">
                                    <TableCell className="text-center text-slate-400 font-bold">{idx + 1}</TableCell>
                                    <TableCell className="font-bold text-slate-800">{item.description}</TableCell>
                                    <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{item.unitPrice?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-center font-bold text-primary">{item.vatRate}%</TableCell>
                                    <TableCell className="text-right font-black">{item.netValue?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                  </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">Brak szczegółowych pozycji towarowych w dokumencie.</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Footer: VAT Summary & Totals */}
                          <div className="grid grid-cols-2 gap-12 border-t pt-10">
                            <div>
                              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Zestawienie stawek VAT</h3>
                              <Table className="text-xs border rounded-lg">
                                <TableHeader className="bg-slate-50">
                                  <TableRow className="h-8">
                                    <TableHead className="font-bold">Stawka</TableHead>
                                    <TableHead className="text-right font-bold">Netto</TableHead>
                                    <TableHead className="text-right font-bold">Podatek VAT</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {inv.vats?.map((v: any, idx: number) => (
                                    <TableRow key={idx} className="h-10">
                                      <TableCell className="font-black text-primary">{v.rate}</TableCell>
                                      <TableCell className="text-right font-medium">{v.net?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                      <TableCell className="text-right font-bold">{v.vat?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>

                              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <p className="text-[10px] font-black uppercase text-slate-400">Informacje o płatności</p>
                                <div className="text-xs space-y-1">
                                  <p><span className="text-slate-400">Forma:</span> <span className="font-bold">{inv.paymentMethod === '6' ? 'Przelew' : 'Inna'}</span></p>
                                  <p><span className="text-slate-400">Termin:</span> <span className="font-bold text-primary">{inv.dueDate || '-'}</span></p>
                                  {inv.bankAccount && (
                                    <div className="pt-2">
                                      <p className="text-slate-400 mb-1">Numer konta:</p>
                                      <p className="font-mono font-bold text-slate-800 bg-white p-2 border rounded">{inv.bankAccount}</p>
                                      {inv.bankName && <p className="text-[10px] text-slate-400 mt-1">{inv.bankName}</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col justify-between">
                              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl transform hover:scale-[1.02] transition-transform">
                                <div className="space-y-4">
                                  <div className="flex justify-between text-slate-400 text-xs uppercase font-black tracking-widest">
                                    <span>Razem Netto</span>
                                    <span>{inv.totalNet?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400 text-xs uppercase font-black tracking-widest">
                                    <span>Razem VAT</span>
                                    <span>{inv.totalVat?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</span>
                                  </div>
                                  <div className="border-t border-slate-700 pt-6">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Do zapłaty (Brutto)</p>
                                    <div className="flex justify-between items-baseline">
                                      <p className="text-5xl font-black tracking-tighter">{inv.amountToPay?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</p>
                                      <p className="text-xl font-bold text-slate-500">{inv.currency}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-10 text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] leading-relaxed">
                                <p>Identyfikator KSeF: {inv.id}</p>
                                <p>Dokument wygenerowany elektronicznie w standardzie KSeF FA(3)</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-6">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Poprzednia</Button>
          <span className="text-sm font-semibold bg-white px-5 py-1.5 rounded-full shadow-sm border">Strona {currentPage} z {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Następna</Button>
        </div>
      )}
    </div>
  )
}
