
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Trash2, ShieldAlert, Loader2, AlertTriangle, RefreshCw, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllInvoices, deleteInvoice, deleteAllInvoices } from "@/lib/firestore"
import { useUser } from "@/firebase"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)
  const { toast } = useToast()

  const adminEmails = ['admin@ksef.pl', 'krzysztof.sobczak@sp-partner.eu']
  const isAdmin = user && adminEmails.includes(user.email || '')

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
    if (!isUserLoading && !isAdmin) {
      router.replace("/dashboard/invoices")
      toast({ variant: "destructive", title: "Brak uprawnień", description: "Tylko administrator może wejść do tego panelu." })
    } else if (isAdmin) {
      fetchInvoices()
    }
  }, [user, isUserLoading, isAdmin, router])

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
    if (!confirm("OSTRZEŻENIE: Ta operacja nieodwracalnie usunie WSZYSTKIE Twoje faktury. Kontynuować?")) return
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

  if (!isAdmin) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 text-slate-900">
            <ShieldAlert className="h-8 w-8 text-destructive" /> Panel Administratora
          </h2>
          <p className="text-slate-500">Zarządzanie bazą danych i użytkownikami.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInvoices} disabled={loading || actionInProgress}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Odśwież
          </Button>
          <Button variant="destructive" onClick={handleClearAll} disabled={actionInProgress || loading} className="font-bold">
            <AlertTriangle className="h-4 w-4 mr-2" /> Wyczyść Bazę
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Twoje rekordy ({invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Numer Faktury</TableHead>
                  <TableHead>Sprzedawca</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead className="text-center w-[80px]">Usuń</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 italic">Baza jest pusta.</TableCell></TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-700">{inv.invoiceNumber}</TableCell>
                      <TableCell><div className="max-w-[150px] truncate">{inv.sellerName}</div></TableCell>
                      <TableCell className="text-right font-black text-slate-900">{inv.totalGross?.toLocaleString('pl-PL')} {inv.currency}</TableCell>
                      <TableCell className="text-center">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={() => handleDelete(inv.id)} disabled={actionInProgress}>
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

        <Card className="border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Zarządzanie kontami
            </CardTitle>
            <CardDescription>
              Nowi użytkownicy mogą rejestrować się samodzielnie przez stronę logowania. 
              Każde konto ma całkowicie odseparowaną bazę danych.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">
                Aby nadać uprawnienia administratora nowemu użytkownikowi, należy dopisać jego e-mail do listy w kodzie aplikacji.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
