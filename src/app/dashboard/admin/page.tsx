
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
import { Lock, Trash2, Edit, Save, X, ShieldAlert, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getAllInvoices, deleteInvoice, updateInvoice } from "@/lib/firestore"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const data = await getAllInvoices()
      setInvoices(data)
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się pobrać danych z bazy." })
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
    if (!confirm("Czy na pewno chcesz usunąć tę fakturę?")) return
    
    try {
      await deleteInvoice(id)
      setInvoices(invoices.filter(inv => inv.id !== id))
      toast({ title: "Usunięto", description: "Faktura została usunięta z bazy." })
    } catch (error) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć dokumentu." })
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground font-headline">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Zarządzanie Fakturami
          </h2>
          <p className="text-muted-foreground">Tryb edycji i usuwania rekordów z bazy Firestore.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInvoices} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Odśwież bazę"}
          </Button>
          <Button variant="destructive" onClick={() => setIsAuthenticated(false)}>Wyloguj</Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Wszystkie dokumenty w kolekcji</CardTitle>
          <CardDescription>Zmiany wprowadzone tutaj są natychmiastowe w bazie danych.</CardDescription>
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
                    <TableCell>
                      {editingId === inv.id ? (
                        <Input 
                          value={editForm.invoiceNumber} 
                          onChange={(e) => setEditForm({...editForm, invoiceNumber: e.target.value})}
                          className="h-8" 
                        />
                      ) : (
                        inv.invoiceNumber
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === inv.id ? (
                        <Input 
                          value={editForm.sellerName} 
                          onChange={(e) => setEditForm({...editForm, sellerName: e.target.value})}
                          className="h-8" 
                        />
                      ) : (
                        inv.sellerName || inv.seller?.name
                      )}
                    </TableCell>
                    <TableCell>{inv.invoiceDate}</TableCell>
                    <TableCell>
                      {editingId === inv.id ? (
                        <Input 
                          type="number"
                          value={editForm.totalGross} 
                          onChange={(e) => setEditForm({...editForm, totalGross: parseFloat(e.target.value)})}
                          className="h-8" 
                        />
                      ) : (
                        inv.totalGross?.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {editingId === inv.id ? (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleSave(inv.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => startEdit(inv)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(inv.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Baza jest pusta. Użyj modułu importu, aby dodać faktury.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
