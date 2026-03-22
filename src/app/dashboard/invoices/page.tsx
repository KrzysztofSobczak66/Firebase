
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
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Download,
  Loader2,
  FileCode,
  ArrowUpDown,
  Filter,
  X,
  Printer,
  Trash2,
  Edit2,
  Save,
  CheckCircle2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { getAllInvoices, deleteInvoice, saveInvoice } from "@/lib/firestore"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from "@/firebase"
import html2canvas from "html2canvas"
import jsPDF from "jsPDF"

const PAGE_SIZE = 50

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isActionInProgress, setIsActionInProgress] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()
  
  const adminEmails = ['admin@ksef.pl', 'krzysztof.sobczak@sp-partner.eu']
  const isAdmin = user && adminEmails.includes(user.email || '')
  
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null)
  
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
    setIsActionInProgress(true)
    try {
      await deleteInvoice(id)
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      toast({ title: "Usunięto", description: "Dokument został usunięty z bazy." })
    } catch (err) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć dokumentu." })
    } finally {
      setIsActionInProgress(false)
    }
  }

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return
    setIsActionInProgress(true)
    try {
      await saveInvoice(editingInvoice)
      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? editingInvoice : inv))
      toast({ title: "Zaktualizowano", description: "Zmiany zostały zapisane w bazie danych." })
      setEditingInvoice(null)
    } catch (err) {
      toast({ variant: "destructive", title: "Błąd zapisu", description: "Nie udało się zaktualizować danych." })
    } finally {
      setIsActionInProgress(false)
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
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Faktura_${invoiceNumber.replace(/\//g, '_')}.pdf`);
      
      toast({ title: "Sukces", description: "Dokument PDF został wygenerowany." });
    } catch (err) {
      console.error("PDF generation error:", err);
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
              <TableHead className="w-[140px] text-center">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Brak faktur spełniających kryteria.</TableCell></TableRow>
            ) : paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-bold text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell className="text-xs">{inv.invoiceDate}</TableCell>
                <TableCell><div className="text-[10px] leading-tight"><p className="font-bold text-slate-700 truncate max-w-[120px]">{inv.sellerName}</p><p className="text-muted-foreground font-mono">{inv.sellerNip}</p></div></TableCell>
                <TableCell><div className="text-[10px] leading-tight"><p className="font-bold text-slate-700 truncate max-w-[120px]">{inv.buyerName}</p><p className="text-muted-foreground font-mono">{inv.buyerNip}</p></div></TableCell>
                <TableCell><div className="text-[10px] leading-tight"><p className="font-bold text-slate-700 truncate max-w-[120px]">{inv.recipient?.name || "-"}</p><p className="text-muted-foreground font-mono">{inv.recipient?.nip || ""}</p></div></TableCell>
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
                          <div id="printable-invoice" ref={invoiceRef} className="w-[210mm] bg-white p-12 shadow-2xl text-slate-800 font-sans border border-slate-300 relative flex flex-col min-h-[297mm]">
                            
                            {/* Nagłówek Faktury */}
                            <div className="flex justify-between items-start border-b-8 border-primary pb-8 mb-10">
                              <div>
                                <h1 className="text-5xl font-black text-primary tracking-tighter mb-2 uppercase">
                                  {inv.documentType || "FAKTURA VAT"}
                                </h1>
                                <p className="text-slate-500 font-medium">Oryginał</p>
                              </div>
                              <div className="text-right space-y-2">
                                <p className="text-2xl font-black text-slate-700">Nr: {inv.invoiceNumber}</p>
                                <div className="text-xs text-slate-500 space-y-1">
                                  <p>Data wystawienia: <span className="font-bold text-slate-700">{inv.invoiceDate}</span></p>
                                  <p>Data sprzedaży: <span className="font-bold text-slate-700">{inv.saleDate || inv.invoiceDate}</span></p>
                                  <p>Termin płatności: <span className="font-bold text-slate-700">{inv.dueDate || "-"}</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Strony Transakcji */}
                            <div className="grid grid-cols-2 gap-12 mb-12">
                              <div>
                                <p className="text-[10px] font-bold uppercase text-primary mb-3 border-b pb-1">Sprzedawca</p>
                                <p className="font-bold text-lg leading-tight mb-2">{inv.sellerName}</p>
                                <div className="text-sm text-slate-600 space-y-0.5">
                                  <p>{inv.seller?.addressL1}</p>
                                  <p>{inv.seller?.addressL2}</p>
                                  <p className="font-bold text-slate-900 mt-2">NIP: {inv.sellerNip}</p>
                                  {inv.seller?.gln && <p className="text-xs">GLN: {inv.seller.gln}</p>}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase text-primary mb-3 border-b pb-1">Nabywca</p>
                                <p className="font-bold text-lg leading-tight mb-2">{inv.buyerName}</p>
                                <div className="text-sm text-slate-600 space-y-0.5">
                                  <p>{inv.buyer?.addressL1}</p>
                                  <p>{inv.buyer?.addressL2}</p>
                                  <p className="font-bold text-slate-900 mt-2">NIP: {inv.buyerNip}</p>
                                </div>
                                {inv.recipient && (
                                  <div className="mt-4 pt-4 border-t border-dashed">
                                    <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Odbiorca</p>
                                    <p className="font-bold text-xs">{inv.recipient.name}</p>
                                    <p className="text-xs">{inv.recipient.addressL1}, {inv.recipient.addressL2}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tabela Pozycji */}
                            <div className="flex-1">
                              <table className="w-full text-left border-collapse mb-10">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-y border-slate-200">
                                    <th className="py-3 px-2 w-10 text-center">Lp.</th>
                                    <th className="py-3 px-2">Nazwa towaru lub usługi</th>
                                    <th className="py-3 px-2 text-right">Ilość</th>
                                    <th className="py-3 px-2 text-center">J.m.</th>
                                    <th className="py-3 px-2 text-right">Cena netto</th>
                                    <th className="py-3 px-2 text-center">VAT</th>
                                    <th className="py-3 px-2 text-right">Wartość netto</th>
                                  </tr>
                                </thead>
                                <tbody className="text-sm">
                                  {inv.items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                      <td className="py-3 px-2 text-center text-slate-400">{idx + 1}</td>
                                      <td className="py-3 px-2 font-medium">
                                        {item.description}
                                        {item.gtin && <p className="text-[10px] text-slate-400 font-mono mt-0.5">EAN: {item.gtin}</p>}
                                      </td>
                                      <td className="py-3 px-2 text-right">{item.quantity}</td>
                                      <td className="py-3 px-2 text-center text-slate-500">szt.</td>
                                      <td className="py-3 px-2 text-right">{item.unitPrice?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</td>
                                      <td className="py-3 px-2 text-center">{item.vatRate}</td>
                                      <td className="py-3 px-2 text-right font-semibold">{item.netValue?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Podsumowanie VAT i Kwoty */}
                            <div className="flex justify-between gap-12 mb-12 mt-auto">
                              <div className="w-1/2">
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Zestawienie VAT</p>
                                <table className="w-full text-xs border border-slate-200">
                                  <thead className="bg-slate-50">
                                    <tr className="border-b border-slate-200">
                                      <th className="p-2 text-left">Stawka</th>
                                      <th className="p-2 text-right">Netto</th>
                                      <th className="p-2 text-right">VAT</th>
                                      <th className="p-2 text-right">Brutto</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inv.vats?.map((v: any, i: number) => (
                                      <tr key={i} className="border-b border-slate-100">
                                        <td className="p-2 font-bold">{v.rate}</td>
                                        <td className="p-2 text-right">{v.net?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-2 text-right">{v.vat?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-2 text-right">{(v.net + v.vat).toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    ))}
                                    <tr className="bg-slate-50 font-bold">
                                      <td className="p-2">Razem</td>
                                      <td className="p-2 text-right">{inv.totalNet?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</td>
                                      <td className="p-2 text-right">{inv.totalVat?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</td>
                                      <td className="p-2 text-right">{inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              
                              <div className="text-right flex flex-col justify-end">
                                <div className="bg-primary text-white p-6 rounded-xl shadow-inner min-w-[280px]">
                                  <p className="text-xs font-bold uppercase opacity-80 mb-1">Do zapłaty</p>
                                  <p className="text-4xl font-black">{inv.amountToPay?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</p>
                                </div>
                              </div>
                            </div>

                            {/* Szczegóły Płatności */}
                            <div className="grid grid-cols-2 gap-8 p-8 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Forma płatności</p>
                                  <p className="font-bold text-slate-700">{inv.paymentMethod === '6' ? 'Przelew' : inv.paymentMethod || 'Przelew'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Termin płatności</p>
                                  <p className="font-bold text-slate-700">{inv.dueDate} {inv.paymentTermDescription && `(${inv.paymentTermDescription})`}</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Rachunek bankowy</p>
                                  <p className="font-bold text-lg text-primary font-mono tracking-tighter">{inv.bankAccount || "-"}</p>
                                  <p className="text-xs text-slate-500">{inv.bankName}</p>
                                </div>
                              </div>
                            </div>

                            {/* Stopka KSeF */}
                            <div className="mt-12 flex items-center justify-between text-[8px] text-slate-400 uppercase tracking-widest border-t pt-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>Dokument przetworzony przez KSeF Studio</span>
                              </div>
                              <div className="font-mono">ID: {inv.id}</div>
                            </div>

                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {isAdmin && (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => setEditingInvoice({...inv})}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edytuj Fakturę</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-1">
                                <Label>Numer Faktury</Label>
                                <Input value={editingInvoice?.invoiceNumber || ""} onChange={e => setEditingInvoice({...editingInvoice, invoiceNumber: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label>Data Wystawienia</Label>
                                  <Input type="date" value={editingInvoice?.invoiceDate || ""} onChange={e => setEditingInvoice({...editingInvoice, invoiceDate: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                  <Label>Waluta</Label>
                                  <Input value={editingInvoice?.currency || "PLN"} onChange={e => setEditingInvoice({...editingInvoice, currency: e.target.value})} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label>Netto</Label>
                                  <Input type="number" value={editingInvoice?.totalNet || 0} onChange={e => setEditingInvoice({...editingInvoice, totalNet: parseFloat(e.target.value)})} />
                                </div>
                                <div className="space-y-1">
                                  <Label>Brutto</Label>
                                  <Input type="number" value={editingInvoice?.totalGross || 0} onChange={e => setEditingInvoice({...editingInvoice, totalGross: parseFloat(e.target.value)})} />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingInvoice(null)}>Anuluj</Button>
                              <Button onClick={handleUpdateInvoice} disabled={isActionInProgress}>
                                {isActionInProgress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Zapisz
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button size="icon" variant="ghost" onClick={(e) => handleDeleteInvoice(inv.id, e)} className="h-8 w-8 text-destructive hover:bg-red-50" disabled={isActionInProgress}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
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
