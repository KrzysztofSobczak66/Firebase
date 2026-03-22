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
  FileText, 
  Search, 
  Download,
  Loader2,
  Eye,
  FileCode,
  ArrowUpDown
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAllInvoices } from "@/lib/firestore"
import { Badge } from "@/components/ui/badge"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

const PAGE_SIZE = 50

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc' | null}>({ 
    key: 'invoiceDate', 
    direction: 'desc' 
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllInvoices()
        setInvoices(data)
      } catch (error) {
        console.error("Błąd pobierania:", error)
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
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Faktura_${invoiceNumber.replace(/\//g, '_')}.pdf`);
      toast({ title: "Sukces", description: "Faktura została pobrana jako PDF." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się wygenerować PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const searchStr = searchQuery.toLowerCase()
      const sName = (inv.sellerName || inv.seller?.name || "").toLowerCase();
      const bName = (inv.buyerName || "").toLowerCase();
      const iNum = (inv.invoiceNumber || "").toLowerCase();
      return iNum.includes(searchStr) || sName.includes(searchStr) || bName.includes(searchStr);
    })
  }, [searchQuery, invoices])

  const sortedInvoices = useMemo(() => {
    const items = [...filteredInvoices]
    if (sortConfig.direction !== null) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
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
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null
    setSortConfig({ key, direction })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground">Ładowanie bazy faktur...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Szukaj po numerze lub nazwie..." 
            className="pl-10 bg-white border-none shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="secondary" className="px-3 py-1 text-sm">{invoices.length} Dokumentów</Badge>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead onClick={() => handleSort('invoiceNumber')} className="cursor-pointer group">
                Numer Faktury <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-0 group-hover:opacity-50" />
              </TableHead>
              <TableHead onClick={() => handleSort('invoiceDate')} className="cursor-pointer group">
                Data <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-0 group-hover:opacity-50" />
              </TableHead>
              <TableHead>Sprzedawca / Nabywca</TableHead>
              <TableHead className="text-right">Kwota Brutto</TableHead>
              <TableHead className="w-[120px] text-center">Akcja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-semibold text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">S:</span> {inv.sellerName || inv.seller?.name}</p>
                    {inv.buyerName && <p><span className="text-muted-foreground">N:</span> {inv.buyerName}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-slate-900">
                  {inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency || 'PLN'}
                </TableCell>
                <TableCell className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white transition-all">
                        <FileCode className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-slate-100 p-0 gap-0">
                      <DialogHeader className="sticky top-0 z-20 bg-white p-4 border-b flex flex-row items-center justify-between shadow-sm">
                        <DialogTitle className="text-lg">Podgląd dokumentu: {inv.invoiceNumber}</DialogTitle>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleDownloadPDF(inv.invoiceNumber)} disabled={isExporting}>
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                            Pobierz PDF
                          </Button>
                        </div>
                      </DialogHeader>
                      
                      <div className="p-8 flex justify-center bg-slate-200/50">
                        <div ref={invoiceRef} className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-2xl rounded text-slate-800 font-sans border border-slate-300">
                          {/* Header */}
                          <div className="flex justify-between border-b-4 border-primary pb-8 mb-8">
                            <div className="space-y-1">
                              <h1 className="text-4xl font-black text-primary tracking-tighter">FAKTURA VAT</h1>
                              <p className="text-xl font-bold text-slate-600">Numer: {inv.invoiceNumber}</p>
                            </div>
                            <div className="text-right space-y-1 text-sm font-medium">
                              <p>Data wystawienia: <span className="font-bold">{inv.invoiceDate}</span></p>
                              <p>Data sprzedaży: <span className="font-bold">{inv.saleDate || inv.invoiceDate}</span></p>
                              <p>Miejsce wystawienia: <span className="font-bold">Grodzisk Maz.</span></p>
                            </div>
                          </div>

                          {/* Parties */}
                          <div className="grid grid-cols-2 gap-12 mb-10">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                              <h2 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest border-b pb-1">Sprzedawca</h2>
                              <p className="font-bold text-xl mb-1">{inv.sellerName}</p>
                              <p className="text-sm">NIP: <span className="font-semibold">{inv.sellerNip}</span></p>
                              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{inv.sellerAddress}</p>
                            </div>
                            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                              <h2 className="text-[10px] font-black uppercase text-primary/40 mb-3 tracking-widest border-b border-primary/10 pb-1">Nabywca</h2>
                              <p className="font-bold text-xl mb-1">{inv.buyerName}</p>
                              <p className="text-sm">NIP: <span className="font-semibold">{inv.buyerNip}</span></p>
                              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{inv.buyerAddress}</p>
                            </div>
                          </div>

                          {/* Items Table */}
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
                                {inv.items && inv.items.length > 0 ? (
                                  inv.items.map((item: any, idx: number) => (
                                    <TableRow key={idx} className="border-b">
                                      <TableCell className="text-center text-slate-500">{idx + 1}</TableCell>
                                      <TableCell className="font-semibold text-slate-700">{item.description}</TableCell>
                                      <TableCell className="text-center">{item.quantity}</TableCell>
                                      <TableCell className="text-right">{item.unitPrice?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                      <TableCell className="text-center">{item.vatRate}</TableCell>
                                      <TableCell className="text-right font-bold">{item.netValue?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">
                                      Brak szczegółowych pozycji w pliku źródłowym.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Totals */}
                          <div className="flex justify-end pt-6">
                            <div className="w-80 space-y-4 bg-slate-900 text-white p-8 rounded-2xl shadow-xl">
                              <div className="flex justify-between items-center text-slate-400 text-sm">
                                <span>Wartość Netto</span>
                                <span className="font-mono">{inv.totalNet?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-400 text-sm">
                                <span>Kwota VAT</span>
                                <span className="font-mono">{inv.totalVat?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</span>
                              </div>
                              <div className="border-t border-slate-700 pt-4 flex justify-between items-end">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-primary uppercase">Razem do zapłaty</p>
                                  <p className="text-3xl font-black">{inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <span className="text-lg font-bold text-slate-500 pb-1">{inv.currency}</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Info */}
                          <div className="mt-24 pt-8 border-t border-slate-100 grid grid-cols-2 gap-10">
                             <div className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider">
                                Faktura została wygenerowana automatycznie na podstawie danych przesłanych do Krajowego Systemu e-Faktur (KSeF). Dokument nie wymaga podpisu ani pieczęci.
                             </div>
                             <div className="text-right text-[10px] text-slate-400 space-y-1">
                                <p>System: KSeF Faktury Cloud v2.0</p>
                                <p>Identyfikator KSeF: {inv.id || 'GENERATED-LOCAL'}</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {paginatedInvoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                  Nie znaleziono faktur spełniających kryteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-6">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Wstecz</Button>
          <span className="text-sm font-semibold bg-white px-4 py-1 rounded-full shadow-sm border">Strona {currentPage} z {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Dalej</Button>
        </div>
      )}
    </div>
  )
}
