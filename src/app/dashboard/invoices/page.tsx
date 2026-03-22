
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
  ArrowUpDown,
  Download,
  Loader2,
  FileCode,
  Eye,
  Printer
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
      pdf.save(`Faktura_${invoiceNumber}.pdf`);
      toast({ title: "Sukces", description: "Faktura została pobrana jako PDF." });
    } catch (err) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się wygenerować PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const searchStr = searchQuery.toLowerCase()
      return (
        inv.invoiceNumber?.toLowerCase().includes(searchStr) || 
        inv.sellerName?.toLowerCase().includes(searchStr) ||
        inv.buyerName?.toLowerCase().includes(searchStr)
      )
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
        <p className="text-muted-foreground">Inicjalizacja bazy faktur...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Szukaj dokumentu..." 
            className="pl-10 bg-white border-none shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="text-sm font-medium bg-white px-3 py-1 rounded-full shadow-sm text-primary">
          Łącznie dokumentów: {invoices.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead onClick={() => handleSort('invoiceNumber')} className="cursor-pointer">Numer</TableHead>
              <TableHead onClick={() => handleSort('invoiceDate')} className="cursor-pointer">Data</TableHead>
              <TableHead onClick={() => handleSort('sellerName')} className="cursor-pointer">Sprzedawca</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead className="text-right">Kwota Brutto</TableHead>
              <TableHead className="w-[100px] text-center">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-medium text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell className="max-w-[200px] truncate">{inv.sellerName || inv.seller?.name}</TableCell>
                <TableCell>
                  {inv.pdfDataUri ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">PDF</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700">XML (KSeF)</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency || 'PLN'}
                </TableCell>
                <TableCell className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-primary">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-100">
                      <DialogHeader className="sticky top-0 z-10 bg-white p-4 border-b flex flex-row items-center justify-between">
                        <DialogTitle>Podgląd Faktury: {inv.invoiceNumber}</DialogTitle>
                        <div className="flex gap-2">
                          {!inv.pdfDataUri && (
                            <Button size="sm" onClick={() => handleDownloadPDF(inv.invoiceNumber)} disabled={isExporting}>
                              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                              Pobierz PDF
                            </Button>
                          )}
                          {inv.pdfDataUri && (
                             <Button size="sm" asChild>
                               <a href={inv.pdfDataUri} download={`Faktura_${inv.invoiceNumber}.pdf`}>Pobierz oryginał</a>
                             </Button>
                          )}
                        </div>
                      </DialogHeader>
                      
                      <div className="p-4 flex justify-center">
                        {inv.pdfDataUri ? (
                          <iframe src={inv.pdfDataUri} className="w-full h-[700px] border rounded bg-white shadow-lg" />
                        ) : (
                          <div ref={invoiceRef} className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-2xl rounded text-slate-800 font-sans border border-slate-200">
                            {/* Nagłówek wizualizacji faktury z XML */}
                            <div className="flex justify-between border-b-2 border-primary pb-8 mb-8">
                              <div>
                                <h1 className="text-3xl font-bold text-primary mb-2">FAKTURA VAT</h1>
                                <p className="text-xl font-semibold">Nr: {inv.invoiceNumber}</p>
                              </div>
                              <div className="text-right text-sm">
                                <p>Data wystawienia: <strong>{inv.invoiceDate}</strong></p>
                                <p>Data sprzedaży: <strong>{inv.saleDate || inv.invoiceDate}</strong></p>
                                <p>Waluta: <strong>{inv.currency || 'PLN'}</strong></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-12">
                              <div className="p-4 bg-slate-50 rounded-lg">
                                <h2 className="text-xs font-bold uppercase text-slate-500 mb-2">Sprzedawca</h2>
                                <p className="font-bold text-lg">{inv.sellerName}</p>
                                <p>NIP: {inv.sellerNip}</p>
                                <p className="text-sm mt-1">{inv.sellerAddress}</p>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-primary">
                                <h2 className="text-xs font-bold uppercase text-slate-500 mb-2">Nabywca</h2>
                                <p className="font-bold text-lg">{inv.buyerName}</p>
                                <p>NIP: {inv.buyerNip}</p>
                                <p className="text-sm mt-1">{inv.buyerAddress}</p>
                              </div>
                            </div>

                            <Table>
                              <TableHeader className="bg-slate-100">
                                <TableRow>
                                  <TableHead className="text-slate-700">Lp.</TableHead>
                                  <TableHead className="text-slate-700">Nazwa towaru / usługi</TableHead>
                                  <TableHead className="text-right text-slate-700">Ilość</TableHead>
                                  <TableHead className="text-right text-slate-700">Cena netto</TableHead>
                                  <TableHead className="text-right text-slate-700">VAT</TableHead>
                                  <TableHead className="text-right text-slate-700">Wartość netto</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {inv.items && inv.items.map((item: any, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.unitPrice?.toLocaleString('pl-PL')} {inv.currency}</TableCell>
                                    <TableCell className="text-right">{item.vatRate}</TableCell>
                                    <TableCell className="text-right font-semibold">{item.netValue?.toLocaleString('pl-PL')} {inv.currency}</TableCell>
                                  </TableRow>
                                ))}
                                {!inv.items && (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">Pozycje faktury zostaną wygenerowane przy eksporcie.</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>

                            <div className="mt-12 flex justify-end">
                              <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex justify-between text-sm">
                                  <span>Suma netto:</span>
                                  <span>{inv.totalNet?.toLocaleString('pl-PL')} {inv.currency}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Kwota VAT:</span>
                                  <span>{inv.totalVat?.toLocaleString('pl-PL')} {inv.currency}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-primary pt-3 border-t">
                                  <span>DO ZAPŁATY:</span>
                                  <span>{inv.totalGross?.toLocaleString('pl-PL')} {inv.currency}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-20 pt-8 border-t text-[10px] text-slate-400 text-center">
                              Dokument wygenerowany systemowo z danych KSeF XML. Nie wymaga podpisu.
                            </div>
                          </div>
                        )}
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
        <div className="flex items-center justify-center gap-4 py-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Poprzednia</Button>
          <span className="text-sm font-medium">Strona {currentPage} z {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Następna</Button>
        </div>
      )}
    </div>
  )
}
