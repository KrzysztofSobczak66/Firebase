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
  Calendar as CalendarIcon,
  Filter,
  X
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
            Panel Filtrowania
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Numer Faktury</label>
              <Input 
                placeholder="Np. FV/2026/..." 
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
            <Badge variant="secondary" className="px-3 py-1">Znaleziono: {sortedInvoices.length} z {invoices.length}</Badge>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-primary">
              <X className="h-4 w-4 mr-1" /> Wyczyść filtry
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead onClick={() => handleSort('invoiceNumber')} className="cursor-pointer group">
                Numer <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
              </TableHead>
              <TableHead onClick={() => handleSort('invoiceDate')} className="cursor-pointer group">
                Data Wyst. <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
              </TableHead>
              <TableHead>Sprzedawca / NIP</TableHead>
              <TableHead>Nabywca / NIP</TableHead>
              <TableHead onClick={() => handleSort('totalGross')} className="text-right cursor-pointer group">
                Brutto <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
              </TableHead>
              <TableHead className="w-[100px] text-center">Dokument</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50">
                <TableCell className="font-bold text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell className="text-xs">{inv.invoiceDate}</TableCell>
                <TableCell>
                  <div className="text-[10px] font-medium leading-tight">
                    <p className="font-bold truncate max-w-[150px]">{inv.sellerName}</p>
                    <p className="text-muted-foreground">{inv.sellerNip}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-[10px] font-medium leading-tight">
                    <p className="font-bold truncate max-w-[150px]">{inv.buyerName}</p>
                    <p className="text-muted-foreground">{inv.buyerNip}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-black">
                  {inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}
                </TableCell>
                <TableCell className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white h-8 px-2">
                        <FileCode className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-slate-100 p-0 gap-0">
                      <DialogHeader className="sticky top-0 z-20 bg-white p-4 border-b flex flex-row items-center justify-between shadow-sm">
                        <DialogTitle className="text-lg">Dokument: {inv.invoiceNumber}</DialogTitle>
                        <Button size="sm" onClick={() => handleDownloadPDF(inv.invoiceNumber)} disabled={isExporting}>
                          {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                          Zapisz PDF
                        </Button>
                      </DialogHeader>
                      
                      <div className="p-8 flex justify-center bg-slate-200/50">
                        <div ref={invoiceRef} className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-2xl text-slate-800 font-sans border border-slate-300">
                          {/* Faktura Layout */}
                          <div className="flex justify-between border-b-4 border-primary pb-8 mb-8">
                            <div className="space-y-1">
                              <h1 className="text-4xl font-black text-primary tracking-tighter">FAKTURA VAT</h1>
                              <p className="text-xl font-bold text-slate-600">Nr: {inv.invoiceNumber}</p>
                            </div>
                            <div className="text-right space-y-1 text-sm font-medium">
                              <p>Data wystawienia: <span className="font-bold">{inv.invoiceDate}</span></p>
                              <p>Data sprzedaży: <span className="font-bold">{inv.saleDate || inv.invoiceDate}</span></p>
                              <p>Termin płatności: <span className="font-bold">{inv.dueDate || '-'}</span></p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-12 mb-10">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                              <h2 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest border-b pb-1">Sprzedawca</h2>
                              <p className="font-bold text-xl mb-1">{inv.sellerName}</p>
                              <p className="text-sm">NIP: <span className="font-semibold">{inv.sellerNip}</span></p>
                              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{inv.sellerAddress}</p>
                              {inv.bankAccount && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Konto Bankowe</p>
                                  <p className="text-xs font-mono font-bold">{inv.bankAccount}</p>
                                </div>
                              )}
                            </div>
                            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                              <h2 className="text-[10px] font-black uppercase text-primary/40 mb-3 tracking-widest border-b border-primary/10 pb-1">Nabywca</h2>
                              <p className="font-bold text-xl mb-1">{inv.buyerName}</p>
                              <p className="text-sm">NIP: <span className="font-semibold">{inv.buyerNip}</span></p>
                              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{inv.buyerAddress}</p>
                            </div>
                          </div>

                          <div className="mb-10">
                            <Table className="border rounded-lg overflow-hidden">
                              <TableHeader className="bg-slate-100 border-b-2">
                                <TableRow>
                                  <TableHead className="w-10 text-center font-bold">Lp.</TableHead>
                                  <TableHead className="font-bold">Nazwa towaru lub usługi</TableHead>
                                  <TableHead className="text-center font-bold">Ilość</TableHead>
                                  <TableHead className="text-right font-bold">Cena netto</TableHead>
                                  <TableHead className="text-center font-bold">VAT</TableHead>
                                  <TableHead className="text-right font-bold">Wartość netto</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {inv.items?.map((item: any, idx: number) => (
                                  <TableRow key={idx} className="border-b">
                                    <TableCell className="text-center text-slate-500">{idx + 1}</TableCell>
                                    <TableCell className="font-semibold text-slate-700">{item.description}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.unitPrice?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-center">{item.vatRate}</TableCell>
                                    <TableCell className="text-right font-bold">{item.netValue?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          <div className="grid grid-cols-2 gap-10 pt-6">
                            <div className="space-y-4">
                              <Table className="text-[10px] border">
                                <TableHeader className="bg-slate-50">
                                  <TableRow>
                                    <TableHead>Stawka VAT</TableHead>
                                    <TableHead className="text-right">Netto</TableHead>
                                    <TableHead className="text-right">VAT</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {inv.vats?.map((v: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-bold">{v.rate}</TableCell>
                                      <TableCell className="text-right">{v.net?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                      <TableCell className="text-right">{v.vat?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="w-full bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-3">
                                <div className="flex justify-between text-slate-400 text-xs uppercase font-bold">
                                  <span>Suma Netto</span>
                                  <span>{inv.totalNet?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</span>
                                </div>
                                <div className="flex justify-between text-slate-400 text-xs uppercase font-bold">
                                  <span>Suma VAT</span>
                                  <span>{inv.totalVat?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-4 flex justify-between items-end">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-primary uppercase">Do zapłaty</p>
                                    <p className="text-3xl font-black">{inv.amountToPay?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</p>
                                  </div>
                                  <span className="text-lg font-bold text-slate-500 pb-1">{inv.currency}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                            <p>Identyfikator KSeF: {inv.id}</p>
                            <p>Dokument wygenerowany systemowo</p>
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
          <span className="text-sm font-semibold bg-white px-4 py-1 rounded-full shadow-sm border">Strona {currentPage} z {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Następna</Button>
        </div>
      )}
    </div>
  )
}