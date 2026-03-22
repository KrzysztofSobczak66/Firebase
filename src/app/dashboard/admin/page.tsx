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
import { Lock, Trash2, Edit, Save, X, ShieldAlert, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllInvoices, deleteInvoice, updateInvoice, deleteAllInvoices } from "@/lib/firestore"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
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
      toast({ 
        variant: "destructive", 
        title: "Błąd", 
        description: "Niepoprawne hasło administratora." 
      })
    }
  }

  const handleDelete = async (id: string) => {
    console.log("Próba usunięcia rekordu o ID:", id);
    setLoading(true)
    try {
      await deleteInvoice(id)
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      toast({ title: "Usunięto", description: "Dokument został usunięty pomyślnie." })
    } catch (error: any) {
      console.error("Błąd podczas usuwania:", error);
      toast({ variant: "destructive", title: "Błąd", description: "Wystąpił błąd przy usuwaniu." })
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = async () => {
    console.log("Rozpoczynanie czyszczenia całej bazy...");
    setClearing(true)
    try {
      await deleteAllInvoices()
      setInvoices([])
      toast({ 
        title: "Baza wyczyszczona", 
        description: "Wszystkie rekordy zostały usunięte z pamięci i Firestore." 
      })
    } catch (error: any) {
      console.error("Krytyczny błąd czyszczenia bazy:", error);
      toast({ 
        variant: "destructive", 
        title: "Błąd czyszczenia", 
        description: "Nie udało się wyczyścić bazy danych." 
      })
    } finally {
      setClearing(false)
    }
  }

  const startEdit = (inv: any) => {
    setEditingId(inv.id)
    setEditForm({ 
      invoiceNumber: inv.invoiceNumber, 
      sellerName: inv.sellerName || inv.seller?.name,
      totalGross: inv.totalGross 
    })
  }

  const handleSave = async (id: string) => {
    try {
      await updateInvoice(id, editForm)
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...editForm } : inv))
      setEditingId(null)
      toast({ title: "Zaktualizowano", description: "Dane faktury zostały zapisane." })
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Błąd podczas zapisu." })
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
            <CardTitle>Autoryzacja Administratora</CardTitle>
            <CardDescription>Wprowadź hasło, aby zarządzać bazą faktur.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full bg-primary text-white">Odblokuj dostęp</Button>
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
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground font-headline">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Zarządzanie Bazą Danych
          </h2>
          <p className="text-muted-foreground">Usuwanie i edycja rekordów.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInvoices} disabled={loading || clearing}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Odśwież listę
          </Button>
          <Button 
            variant="destructive" 
            className="bg-red-600 hover:bg-red-700" 
            onClick={handleClearAll} 
            disabled={clearing || loading}
          >
            {clearing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            Wyczyść wszystko
          </Button>
          <Button variant="secondary" onClick={() => setIsAuthenticated(false)}>Wyloguj</Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Dokumenty w systemie ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Numer Faktury</TableHead>
                <TableHead>Sprzedawca</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Brutto (PLN)</TableHead>
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
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50">
                    <TableCell>{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.sellerName || inv.seller?.name}</TableCell>
                    <TableCell>{inv.invoiceDate}</TableCell>
                    <TableCell>{inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive" 
                        onClick={() => handleDelete(inv.id)}
                        disabled={loading}
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
