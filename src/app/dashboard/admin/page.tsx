
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
import { 
  Trash2, 
  ShieldAlert, 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  Globe,
  ExternalLink,
  ShieldCheck,
  LayoutDashboard,
  Rocket,
  CreditCard,
  ChevronRight,
  Github,
  Info,
  AlertCircle
} from "lucide-react"
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
    if (!confirm("OSTRZEŻENIE: Ta operacja nieodwracalnie usunie WSZYSTKIE faktury z bazy danych. Kontynuować?")) return
    setActionInProgress(true)
    try {
      await deleteAllInvoices()
      setInvoices([])
      toast({ title: "Baza wyczyszczona", description: "Wszystkie rekordy zostały usunięte." })
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
          <p className="text-slate-500">Zarządzanie systemem i wdrożeniem sieciowym.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInvoices} disabled={loading || actionInProgress}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Odśwież listę
          </Button>
          <Button variant="destructive" onClick={handleClearAll} disabled={actionInProgress || loading} className="font-bold">
            <AlertTriangle className="h-4 w-4 mr-2" /> Wyczyść Całą Bazę
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Przegląd rekordów w bazie ({invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Numer Faktury</TableHead>
                  <TableHead>Sprzedawca</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead className="text-center w-[80px]">Akcje</TableHead>
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
                      <TableCell><div className="max-w-[200px] truncate">{inv.sellerName}</div></TableCell>
                      <TableCell className="text-right font-black text-slate-900">{inv.totalGross?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {inv.currency}</TableCell>
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

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Globe className="h-5 w-5" /> Udostępnianie w sieci
              </CardTitle>
              <CardDescription>
                Rozwiązanie problemów z wdrożeniem (Deployment settings):
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-4">
              
              <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="font-bold text-red-800 flex items-center gap-2 text-xs">
                  <AlertCircle className="h-4 w-4" /> BŁĄD: INVALID BRANCH NAME?
                </p>
                <p className="text-red-700 text-[11px] leading-relaxed">
                  Jeśli widzisz błąd <b>"Branch name must refer to a valid existing branch"</b>:
                  <br />- Zamiast <code className="bg-red-100 px-1 rounded">firebase</code> wpisz <b>main</b>.
                  <br />- To Twoja domyślna gałąź kodu.
                </p>
              </div>

              <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="font-bold text-amber-800 flex items-center gap-2 text-xs">
                  <Info className="h-4 w-4" /> PROBLEM Z PRZYCISKIEM SAVE?
                </p>
                <p className="text-amber-700 text-[11px] leading-relaxed">
                  Jeśli przycisk <b>Save</b> na GitHubie jest szary:
                  <br />- Wybierz opcję <b>"Only select repositories"</b>.
                  <br />- Z listy wybierz repozytorium o nazwie <b>studio-project</b>.
                </p>
              </div>

              <div className="space-y-3 mt-4">
                <p className="font-bold text-slate-900">OSTATNIE KROKI:</p>
                <ol className="space-y-3 text-[12px]">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center font-bold">1</span>
                    <span>W polu <b>Live branch</b> wpisz: <b className="text-primary">main</b></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center font-bold">2</span>
                    <span>Pole <b>App root directory</b> pozostaw puste: <b>/</b></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center font-bold">3</span>
                    <span>Kliknij <b>Deploy</b> i poczekaj na zakończenie budowania.</span>
                  </li>
                </ol>
              </div>
              
              <Button variant="default" className="w-full bg-primary h-10 mt-4" asChild>
                <a href="https://console.firebase.google.com/project/studio-4075507772-6bfaa/apphosting" target="_blank" rel="noopener noreferrer">
                  Wróć do Konsoli Firebase <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" /> Twoja Rola
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>Zalogowany jako: <b>{user?.email}</b></p>
              <p>Uprawnienia: <span className="text-green-600 font-bold">SUPER ADMINISTRATOR</span></p>
              <hr className="my-3" />
              <p className="text-xs italic text-slate-400">
                Identyfikator Projektu: <code className="bg-slate-100 px-1 rounded">studio-4075507772-6bfaa</code>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
