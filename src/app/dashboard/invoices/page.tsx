
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
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Search, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAllInvoices } from "@/lib/firestore"

const PAGE_SIZE = 50

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'invoiceDate', direction: 'desc' })

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllInvoices()
        setInvoices(data)
      } catch (error) {
        console.error("Błąd podczas pobierania faktur:", error)
        toast({ variant: "destructive", title: "Błąd", description: "Nie udało się pobrać danych z bazy." })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtrowanie danych
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const searchStr = searchQuery.toLowerCase()
      return (
        inv.invoiceNumber.toLowerCase().includes(searchStr) || 
        inv.sellerName?.toLowerCase().includes(searchStr) ||
        inv.buyerName?.toLowerCase().includes(searchStr)
      )
    })
  }, [searchQuery, invoices])

  // Sortowanie danych
  const sortedInvoices = useMemo(() => {
    const items = [...filteredInvoices]
    if (sortConfig.direction !== null) {
      items.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return items
  }, [filteredInvoices, sortConfig])

  // Paginacja
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedInvoices.slice(start, start + PAGE_SIZE)
  }, [sortedInvoices, currentPage])

  const totalPages = Math.ceil(sortedInvoices.length / PAGE_SIZE)

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null
    }
    setSortConfig({ key, direction })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Ładowanie bazy faktur...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Szukaj po numerze lub kontrahencie..." 
            className="pl-10 bg-white border-none shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          Łącznie w bazie: {invoices.length} dokumentów
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead onClick={() => handleSort('invoiceNumber')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">Numer <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort('invoiceDate')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">Data <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort('sellerName')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">Sprzedawca <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort('totalNet')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">Netto <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => handleSort('totalGross')} className="cursor-pointer hover:bg-slate-100 transition-colors text-right">
                <div className="flex items-center justify-end gap-2">Brutto <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead className="w-[100px] text-center">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.length > 0 ? paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-medium text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell>{inv.sellerName}</TableCell>
                <TableCell>{inv.totalNet?.toLocaleString()} {inv.currency}</TableCell>
                <TableCell className="text-right font-semibold">
                  {inv.totalGross?.toLocaleString()} {inv.currency}
                </TableCell>
                <TableCell className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                        <FileText className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Podgląd faktury: {inv.invoiceNumber}</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed">
                        <div className="text-center space-y-2">
                          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
                          <p className="text-slate-500">Podgląd PDF dla faktury {inv.invoiceNumber}</p>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" /> Pobierz plik PDF
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Brak faktur w bazie. Przejdź do zakładki "Masowy Import", aby dodać dokumenty.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-muted-foreground">
            Strona {currentPage} z {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-white"
            >
              Poprzednia
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-white"
            >
              Następna
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
