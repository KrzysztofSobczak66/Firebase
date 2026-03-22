
"use client"

import { useState, useMemo, useEffect } from "react"
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
  AlertCircle,
  FileCode,
  Eye
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAllInvoices } from "@/lib/firestore"
import { Badge } from "@/components/ui/badge"

const PAGE_SIZE = 50

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
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
        <p className="text-muted-foreground animate-pulse">Inicjalizacja bazy faktur...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Szukaj (nr, sprzedawca, nabywca)..." 
            className="pl-10 bg-white border-none shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="text-sm text-muted-foreground font-medium bg-white px-3 py-1 rounded-full shadow-sm">
          Dokumenty: {invoices.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead onClick={() => handleSort('invoiceNumber')} className="cursor-pointer">
                <div className="flex items-center gap-2">Numer <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort('invoiceDate')} className="cursor-pointer">
                <div className="flex items-center gap-2">Data <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort('sellerName')} className="cursor-pointer">
                <div className="flex items-center gap-2">Sprzedawca <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead>Źródło</TableHead>
              <TableHead onClick={() => handleSort('totalGross')} className="text-right cursor-pointer">
                <div className="flex items-center justify-end gap-2">Brutto <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead className="w-[100px] text-center">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-medium text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell>{inv.sellerName || inv.seller?.name}</TableCell>
                <TableCell>
                  {inv.pdfDataUri ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <FileText className="h-3 w-3 mr-1" /> PDF AI
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <FileCode className="h-3 w-3 mr-1" /> KSeF XML
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {inv.totalGross?.toLocaleString()} {inv.currency || 'PLN'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    {inv.pdfDataUri ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-slate-100 border-none shadow-2xl">
                          <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between">
                            <DialogTitle>Podgląd dokumentu: {inv.invoiceNumber}</DialogTitle>
                            <Button variant="outline" size="sm" asChild className="mr-8">
                              <a href={inv.pdfDataUri} download={`Faktura_${inv.invoiceNumber}.pdf`}>
                                <Download className="h-4 w-4 mr-2" /> Pobierz PDF
                              </a>
                            </Button>
                          </DialogHeader>
                          <div className="w-full h-full p-6">
                            <iframe 
                              src={inv.pdfDataUri} 
                              className="w-full h-[calc(100%-2rem)] rounded-xl border shadow-xl bg-white"
                              title="Invoice Preview"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="p-2 text-slate-300" title="Dokument XML - brak podglądu PDF">
                        <FileCode className="h-5 w-5 opacity-40" />
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paginatedInvoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Brak dokumentów pasujących do kryteriów.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button 
            variant="outline" size="sm" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >Poprzednia</Button>
          <span className="text-sm font-medium">Strona {currentPage} z {totalPages}</span>
          <Button 
            variant="outline" size="sm" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >Następna</Button>
        </div>
      )}
    </div>
  )
}
