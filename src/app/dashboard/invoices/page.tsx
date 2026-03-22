"use client"

import { useState, useMemo } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  MoreHorizontal, 
  FileText, 
  FileCode, 
  Download, 
  Eye, 
  Filter,
  ArrowUpDown,
  FileSearch,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { mockInvoices } from "@/lib/mock-data"
import { toast } from "@/hooks/use-toast"

const PAGE_SIZE = 50

export default function InvoicesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter(inv => {
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (inv.ksefReference?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredInvoices.slice(start, start + PAGE_SIZE)
  }, [filteredInvoices, currentPage])

  const totalPages = Math.ceil(filteredInvoices.length / PAGE_SIZE)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Zaakceptowana</Badge>
      case 'REJECTED': return <Badge variant="destructive" className="border-none">Odrzucona</Badge>
      case 'DRAFT': return <Badge variant="secondary" className="border-none">Szkic</Badge>
      default: return <Badge variant="outline" className="border-none">{status}</Badge>
    }
  }

  const handleDownloadXML = (invId: string) => {
    toast({ title: "Pobieranie XML", description: `Generowanie pliku XML dla ${invId}...` })
  }

  const handleDownloadPDF = (invId: string) => {
    toast({ title: "Podgląd PDF", description: `Otwieranie podglądu faktury ${invId}...` })
  }

  const handleGeneratePZ = (invId: string) => {
    toast({ title: "Generowanie PZ (TXT)", description: `Tworzenie dokumentu Potwierdzenia Odbioru dla ${invId}...` })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Szukaj po numerze, kliencie lub KSeF..." 
            className="pl-10 bg-white border-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="bg-white border-none shadow-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtry
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white border-none shadow-sm">
                Status: {statusFilter === "ALL" ? "Wszystkie" : statusFilter}
              </DropdownMenuTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>Wszystkie</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("ACCEPTED")}>Zaakceptowane</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("REJECTED")}>Odrzucone</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("DRAFT")}>Szkice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[180px] font-bold">Numer Faktury</TableHead>
              <TableHead className="font-bold">Data</TableHead>
              <TableHead className="font-bold">Klient</TableHead>
              <TableHead className="font-bold">Kwota Netto</TableHead>
              <TableHead className="font-bold text-right">Brutto</TableHead>
              <TableHead className="font-bold">Status KSeF</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-medium text-primary">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell>{inv.customerName}</TableCell>
                <TableCell>{inv.totalNet.toLocaleString()} {inv.currency}</TableCell>
                <TableCell className="text-right font-semibold">
                  {inv.totalGross.toLocaleString()} {inv.currency}
                </TableCell>
                <TableCell>{getStatusBadge(inv.status)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Akcje dokumentu</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleDownloadPDF(inv.id)}>
                        <Eye className="mr-2 h-4 w-4 text-accent" /> Podgląd PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadXML(inv.id)}>
                        <FileCode className="mr-2 h-4 w-4 text-primary" /> Pobierz XML KSeF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGeneratePZ(inv.id)}>
                        <FileText className="mr-2 h-4 w-4 text-blue-500" /> Generuj PZ (TXT)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Usuń dokument
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          Pokazano {paginatedInvoices.length} z {filteredInvoices.length} rekordów
        </p>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Strona {currentPage} z {totalPages || 1}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}