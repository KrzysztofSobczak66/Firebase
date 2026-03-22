
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
  Printer,
  Trash2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAllInvoices, deleteInvoice } from "@/lib/firestore"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from "@/firebase"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

const PAGE_SIZE = 50

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()
  
  const isAdmin = user?.email === 'admin@ksef.pl'
  
  // Filtry
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sellerFilter, setSellerFilter] = useState("")
  const [buyerFilter, setBuyerFilter] = useState("")
  const [recipientFilter, setRecipientFilter] = useState("")
  const [minNet, setMinNet] = useState("")
  const [maxNet, setMaxNet] = useState("")
  
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc' | null}>({ 
    key: 'invoiceDate', 
    direction: 'desc' 
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getAllInvoices()
      setInvoices(data || [])
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd bazy", description: "Nie udało się pobrać faktur." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Czy na pewno chcesz usunąć tę fakturę?")) return
    setIsDeleting(true)
    try {
      await deleteInvoice(id)
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      toast({ title: "Usunięto", description: "Dokument został usunięty z bazy." })
    } catch (err) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć dokumentu." })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadPDF = async (invoiceNumber: string) => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(invoiceRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: invoiceRef.current.offsetWidth,
        height: invoiceRef.current.offsetHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

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
      const matchesSearch = searchQuery === "" || (inv.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSeller = sellerFilter === "" || (inv.sellerName || "").toLowerCase().includes(sellerFilter.toLowerCase()) || (inv.sellerNip || "").includes(sellerFilter)
      const matchesBuyer = buyerFilter === "" || (inv.buyerName || "").toLowerCase().includes(buyerFilter.toLowerCase()) || (inv.buyerNip || "").includes(buyerFilter)
      const matchesRecipient = recipientFilter === "" || (inv.recipient?.name || "").toLowerCase().includes(recipientFilter.toLowerCase()) || (inv.recipient?.nip || "").includes(recipientFilter)
      const invDate = inv.invoiceDate || "";
      const matchesStartDate = startDate === "" || invDate >= startDate;
      const matchesEndDate = endDate === "" || invDate <= endDate;
      const invNet = inv.totalNet || 0;
      const matchesMinNet = minNet === "" || invNet >= parseFloat(minNet);
      const matchesMaxNet = maxNet === "" || invNet <= parseFloat(maxNet);

      return matchesSearch && matchesSeller && matchesBuyer && matchesRecipient && matchesStartDate && matchesEndDate && matchesMinNet && matchesMaxNet;
    })
  }, [searchQuery, sellerFilter, buyerFilter, recipientFilter, startDate, endDate, minNet, maxNet, invoices])

  const sortedInvoices = useMemo(() => {
    const items = [...filteredInvoices]
    if (sortConfig.direction !== null) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (typeof valA === 'number' && typeof valB === 'number') {
           return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        const strA = (valA || "").toString().toLowerCase();
        const strB = (valB || "").toString().toLowerCase();
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
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
    setSearchQuery(""); setStartDate(""); setEndDate(""); setSellerFilter(""); setBuyerFilter(""); setRecipientFilter(""); setMinNet(""); setMaxNet(""); setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Ładowanie bazy faktur...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 text-primary font-bold">
            <Filter className="h-4 w-4" /> Filtrowanie zaawansowane
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Numer Faktury</label>
              <Input placeholder="Szukaj..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Sprzedawca / NIP</label>
              <Input placeholder="NIP lub nazwa..." value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nabywca / NIP</label>
              <Input placeholder="NIP lub nazwa..." value={buyerFilter} onChange={(e) => setBuyerFilter(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Odbiorca / NIP</label>
              <Input placeholder="NIP lub nazwa..." value={recipientFilter} onChange={(e) => setRecipientFilter(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Data Od</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Data Do</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Netto Od</label>
              <Input type="number" placeholder="Min" value={minNet} onChange={(e) => setMinNet(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Netto Do</label>
              <Input type="number" placeholder="Max" value={maxNet} onChange={(e) => setMaxNet(e.target.value)} className="h-9" />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Badge variant="secondary" className="px-3 py-1 font-bold">Znaleziono: {sortedInvoices.length}</Badge>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-primary">
              <X className="h-4 w-4 mr-1" /> Wyczyść filtry
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b">
            <TableRow>
              <TableHead onClick={() => handleSort('invoiceNumber')} className="cursor-pointer group whitespace-nowrap">Nr Faktury <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" /></TableHead>
              <TableHead onClick={() => handleSort('invoiceDate')} className="cursor-pointer group">Data Wyst. <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" /></TableHead>
              <TableHead>Sprzedawca / NIP</TableHead>
              <TableHead>Nabywca / NIP</TableHead>
              <TableHead>Odbiorca / NIP</TableHead>
              <TableHead onClick={() => handleSort('totalNet')} className="text-right cursor-pointer group">Netto <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" /></TableHead>
              <TableHead onClick={() => handleSort('totalGross')} className="text-right cursor-pointer group">Brutto <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" /></TableHead>
              <TableHead className="w-[120px] text-center">Opcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Brak faktur spełniających kryteria.</TableCell></TableRow>
            ) : paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-bold text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell className="text-xs">{inv.invoiceDate}</TableCell>
                <TableCell><div className="text-[10px] leading-tight"><p className="font-bold text-slate-700 truncate max-w-[150px]">{inv.sellerName}</p><p className="text-muted-foreground font-mono">{inv.sellerNip}</p></div></TableCell>
                <TableCell><div className="text-[10px] leading-tight"><p className="font-bold text-slate-700 truncate max-w-[150px]">{inv.buyerName}</p><p className="text-muted-foreground font-mono">{inv.buyerNip}</p></div></TableCell>
                <TableCell><div className="text-[10px] leading-tight"><p className="font-bold text-slate-700 truncate max-w-[150px]">{inv.recipient?.name || "-"}</p><p className="text-muted-foreground font-mono">{inv.recipient?.nip || ""}</p></div></TableCell>
                <TableCell className="text-right font-bold text-slate-700">{inv.totalNet?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</TableCell>
                <TableCell className="text-right font-black text-slate-900">{inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10">
                          <FileCode className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-slate-100 p-0 gap-0">
                        <DialogHeader className="sticky top-0 z-30 bg-white p-4 border-b flex flex-row items-center justify-between shadow-sm">
                          <DialogTitle className="text-lg flex items-center gap-2">Podgląd: {inv.invoiceNumber}</DialogTitle>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => window.print()} className="hidden md:flex"><Printer className="h-4 w-4 mr-2" /> Drukuj</Button>
                            <Button size="sm" onClick={() => handleDownloadPDF(inv.invoiceNumber)} disabled={isExporting}>
                              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />} Pobierz PDF
                            </Button>
                          </div>
                        </DialogHeader>
                        <div className="p-10 flex justify-center bg-slate-200/40">
                          <div id="printable-invoice" ref={invoiceRef} className="w-[210mm] bg-white p-16 shadow-2xl text-slate-800 font-sans border border-slate-300 relative">
                            {/* PDF Content - Simplified for logic preservation */}
                            <div className="flex justify-between items-start border-b-8 border-primary pb-8 mb-10">
                              <div><h1 className="text-5xl font-black text-primary tracking-tighter mb-2 uppercase">FAKTURA VAT</h1></div>
                              <div className="text-right space-y-2"><p className="text-2xl font-black text-slate-700">Nr: {inv.invoiceNumber}</p><p className="text-xs">Data: {inv.invoiceDate}</p></div>
                            </div>
                            {/* ... more PDF structure ... */}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" onClick={(e) => handleDeleteInvoice(inv.id, e)} className="h-8 w-8 text-destructive hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
