
"use client"

import { useState } from "react"
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
import { Lock, Trash2, Edit, Save, X, ShieldAlert } from "lucide-react"
import { mockInvoices } from "@/lib/mock-data"
import { toast } from "@/hooks/use-toast"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "admin2024") { // Proste zabezpieczenie dla prototypu
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

  const handleDelete = (id: string) => {
    toast({ title: "Usunięto rekord", description: `Faktura ${id} została usunięta z bazy.` })
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Zarządzanie Kolekcją Faktury
          </h2>
          <p className="text-muted-foreground">Możliwość edycji, usuwania i masowego importu rekordów.</p>
        </div>
        <Button variant="outline" onClick={() => setIsAuthenticated(false)}>Wyloguj</Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Wszystkie dokumenty w Firestore</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numer Faktury</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Brutto</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.slice(0, 10).map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    {editingId === inv.id ? (
                      <Input defaultValue={inv.invoiceNumber} className="h-8" />
                    ) : (
                      inv.invoiceNumber
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === inv.id ? (
                      <Input defaultValue={inv.customerName} className="h-8" />
                    ) : (
                      inv.customerName
                    )}
                  </TableCell>
                  <TableCell>{inv.invoiceDate}</TableCell>
                  <TableCell>{inv.totalGross.toLocaleString()} {inv.currency}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === inv.id ? (
                      <>
                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => setEditingId(null)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => setEditingId(inv.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
