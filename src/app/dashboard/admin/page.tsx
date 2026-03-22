"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Lock, Trash2, ShieldAlert, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllInvoices, deleteInvoice, deleteAllInvoices } from "@/lib/firestore"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)
  const { toast } = useToast()

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const data = await getAllInvoices()
      setInvoices(data || [])
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się pobrać danych." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices()
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "admin2024") {
      setIsAuthenticated(true)
      toast({ title: "Zalogowano", description: "Witaj w panelu administratora." })
    } else {
      toast({ variant: "destructive", title: "Błąd", description: "Niepoprawne hasło." })
    }
  }

  const handleDelete = async (id: string) => {
    setActionInProgress(true)
    try {
      await deleteInvoice(id)
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      toast({ title: "Usunięto", description: "Rekord został usunięty." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć rekordu." })
    } finally {
      setActionInProgress(false)
    }
  }

  const handleClearAll = async () => {
    setActionInProgress(true)
    try {
      await deleteAllInvoices()
      setInvoices([])
      toast({ title: "Baza wyczyszczona", description: "Wszystkie rekordy zostały usunięte." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Błąd", description: "Wystąpił problem przy czyszczeniu." })
    } finally {
      setActionInProgress(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Autoryzacja Admina</CardTitle>
            <CardDescription>Hasło: admin2024</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Hasło administratora"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">Odblokuj</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Zarządzanie Bazą
          </h2>
          <p className="text-muted-foreground">Usuwanie i czyszczenie danych ({invoices.length} rekordów).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInvoices} disabled={loading || actionInProgress}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleClearAll} 
            disabled={actionInProgress || loading}
          >
            {actionInProgress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            Wyczyść wszystko
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Numer Faktury</TableHead>
                <TableHead>Sprzedawca</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Kwota</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Baza jest pusta.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs">{inv.sellerName}</TableCell>
                    <TableCell className="text-xs">{inv.invoiceDate}</TableCell>
                    <TableCell className="text-xs font-bold">{inv.totalGross?.toLocaleString()} PLN</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:bg-red-50" 
                        onClick={() => handleDelete(inv.id)}
                        disabled={actionInProgress}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
