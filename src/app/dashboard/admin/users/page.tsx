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
  UserPlus, 
  Loader2, 
  Mail, 
  Calendar, 
  UserCheck, 
  ShieldCheck,
  Search,
  Trash2,
  Users,
  Copy,
  Check
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/firebase"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function AdminUsersPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const adminEmails = ['admin@ksef.pl', 'krzysztof.sobczak@sp-partner.eu']
  const isAdmin = user && adminEmails.includes(user.email || '')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "userProfiles"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setUsers(data)
    } catch (error) {
      console.error("Błąd pobierania użytkowników:", error)
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się pobrać listy użytkowników." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.replace("/dashboard/invoices")
      toast({ variant: "destructive", title: "Brak uprawnień", description: "Dostęp tylko dla administratora." })
    } else if (isAdmin) {
      fetchUsers()
    }
  }, [user, isUserLoading, isAdmin, router])

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten profil z bazy? To nie usunie konta w Firebase Auth, ale zniknie z listy zarządczej.")) return
    try {
      await deleteDoc(doc(db, "userProfiles", id))
      setUsers(prev => prev.filter(u => u.id !== id))
      toast({ title: "Profil usunięty", description: "Użytkownik zniknął z panelu zarządzania." })
    } catch (e) {
      toast({ variant: "destructive", title: "Błąd", description: "Nie udało się usunąć profilu." })
    }
  }

  const handleCopyLink = () => {
    // Generujemy link do strony logowania na aktualnej domenie
    const url = window.location.origin + "/login"
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast({ title: "Skopiowano", description: "Link do rejestracji jest w schowku." })
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isAdmin) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 text-slate-900">
            <Users className="h-8 w-8 text-primary" /> Zarządzanie Użytkownikami
          </h2>
          <p className="text-slate-500">Przeglądaj i zarządzaj dostępem do systemu.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={handleCopyLink} variant="default" className="bg-primary">
             {copied ? <Check className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />} 
             Zaproś Użytkownika
           </Button>
           <Button onClick={() => fetchUsers()} variant="outline" disabled={loading}>
             {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Odśwież"}
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Szukaj po adresie e-mail..." 
                className="pl-10 h-10 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1.5 h-10 flex items-center">{filteredUsers.length} zarejestrowanych</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[300px]">Użytkownik (E-mail)</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Data rejestracji</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 italic">Brak użytkowników do wyświetlenia.</TableCell></TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{u.email}</span>
                          <span className="text-[10px] text-slate-400 font-mono">UID: {u.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {adminEmails.includes(u.email) ? (
                        <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Administrator
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          <UserCheck className="h-3 w-3 mr-1" /> Użytkownik
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pl-PL') : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-destructive hover:bg-red-50"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.email === user?.email}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Jak dodać użytkownika?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-4">
            <p>1. Kliknij przycisk <b>"Zaproś Użytkownika"</b> u góry ekranu, aby skopiować link do rejestracji.</p>
            <p>2. Wyślij ten link do swojego współpracownika.</p>
            <p>3. Poproś go o samodzielną rejestrację konta.</p>
            <p>4. Po pierwszym zalogowaniu użytkownik pojawi się automatycznie na tej liście z uprawnieniami <b>Tylko do odczytu</b>.</p>
            <div className="p-3 bg-slate-50 rounded border border-dashed border-slate-200">
               <p className="text-xs font-bold text-slate-500 mb-1">Twój link do zaproszeń:</p>
               <code className="text-[10px] break-all text-primary">{typeof window !== 'undefined' ? window.location.origin + "/login" : ""}</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
