
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
import { Lock, Trash2, ShieldAlert, Loader2, AlertTriangle, RefreshCw, KeyRound } from "lucide-react"
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
    // Sprawdź czy już jesteśmy "zalogowani" w tej sesji
    const adminAuth = sessionStorage.getItem("admin_authenticated")
    if (adminAuth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices()
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Domyślne hasło administratora
    if (password === "admin2024") {
      setIsAuthenticated(true)
      sessionStorage.setItem("admin_authenticated", "true")
      toast({ title: "Zalogowano do panelu", description: "Witaj w panelu administratora." })
    } else {
      toast({ variant: "destructive", title: "Błąd", description: "Niepoprawne hasło administratora." })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten rekord?")) return
    setActionInProgress(true)
    try {
      await deleteInvoice(id)
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      toast({ title: "Usunięto", description: "Rekord został usunięty z bazy danych." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Błąd", description: "Wystąpił problem podczas usuwania." })
    } finally {
      setActionInProgress(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm("OSTRZEŻENIE: Ta operacja nieodwracalnie usunie WSZYSTKIE faktury z Twojego profilu. Kontynuować?")) return
    setActionInProgress(true)
    try {
      await deleteAllInvoices()
      setInvoices([])
      toast({ title: "Baza wyczyszczona", description: "Wszystkie Twoje rekordy zostały usunięte." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Błąd", description: "Wystąpił problem przy czyszczeniu bazy." })
    } finally {
      setActionInProgress(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-none shadow-xl bg-white">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black">Panel Administratora</CardTitle>
            <CardDescription>Podaj hasło administratora systemu, aby zarządzać danymi.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-pass">Hasło dostępu</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="admin-pass"
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wpisz hasło (domyślne: admin2024)"
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary font-bold">Odblokuj panel</Button>
            </form>
          </CardContent>
          <CardHeader className="bg-slate-50 border-t rounded-b-lg">
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
              Autoryzacja drugiego stopnia
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 text-slate-900">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            Zarządzanie Bazą Danych
          </h2>
          <p className="text-slate-500">Panel administracyjny dla Twojego konta firmowego.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInvoices} disabled={loading || actionInProgress} className="bg-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Odśwież listę
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleClearAll} 
            disabled={actionInProgress || loading}
            className="font-bold shadow-lg shadow-red-100"
          >
            {actionInProgress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            Wyczyść całą bazę
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Wykryte rekordy w Twoim profilu ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Numer Faktury</TableHead>
                <TableHead>Sprzedawca</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Kwota Brutto</TableHead>
                <TableHead className="text-center w-[80px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-20" />
                    <p className="mt-4 text-slate-400 font-medium">Pobieranie danych...</p>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                    Twoja baza faktur jest obecnie pusta.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/50 group">
                    <TableCell className="font-bold text-slate-700">{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={inv.sellerName}>
                        {inv.sellerName}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{inv.invoiceDate}</TableCell>
                    <TableCell className="text-right font-black text-slate-900">
                      {inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50 transition-colors" 
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
