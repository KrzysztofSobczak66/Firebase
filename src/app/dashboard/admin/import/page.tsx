
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { parseKSeFXMLClient } from "@/lib/ksef-xml-parser"
import { saveInvoice } from "@/lib/firestore"
import { RefreshCw, Loader2, CheckCircle2, AlertCircle, FileStack } from "lucide-react"
import { useUser } from "@/firebase"
import { useRouter } from "next/navigation"

export default function AdminImportPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState("")
  const [stats, setStats] = useState({ added: 0, updated: 0, total: 0, errors: 0 })
  const { toast } = useToast()

  const adminEmails = ['admin@ksef.pl', 'krzysztof.sobczak@sp-partner.eu']
  const isAdmin = user && adminEmails.includes(user.email || '')

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.replace("/dashboard/invoices")
      toast({ variant: "destructive", title: "Brak uprawnień", description: "Tylko administrator może importować pliki." })
    }
  }, [user, isUserLoading, isAdmin, router])

  const processFile = async (file: File) => {
    setCurrentFile(file.name)
    try {
      if (file.name.toLowerCase().endsWith('.xml')) {
        const content = await file.text()
        const parsed = parseKSeFXMLClient(content)
        if (parsed) {
          const result = await saveInvoice({ ...parsed, sourceFile: file.name })
          if (result.status === 'added') {
            setStats(prev => ({ ...prev, added: prev.added + 1 }))
          } else {
            setStats(prev => ({ ...prev, updated: prev.updated + 1 }))
          }
        } else {
          throw new Error("Błąd parsowania XML")
        }
      } else {
        throw new Error("Nieprawidłowy format pliku")
      }
    } catch (error: any) {
      console.error("Błąd przetwarzania pliku:", file.name, error)
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    setProgress(0)
    setStats({ added: 0, updated: 0, total: files.length, errors: 0 })

    const fileList = Array.from(files)
    
    for (let i = 0; i < fileList.length; i++) {
      await processFile(fileList[i])
      setProgress(Math.round(((i + 1) / fileList.length) * 100))
    }
    
    toast({ 
      title: "Import zakończony", 
      description: `Przetworzono ${fileList.length} plików. Dodano: ${stats.added + (stats.total > 0 ? 0 : 0)}, Zaktualizowano: ${stats.updated}.` 
    })
    setIsUploading(false)
    setCurrentFile("")
    event.target.value = ''
  }

  if (!isAdmin) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Masowy Import XML (Admin)</CardTitle>
              <CardDescription>Wyślij pliki KSeF bezpośrednio do wspólnej bazy danych.</CardDescription>
            </div>
            {isUploading && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
            <input 
              type="file" 
              multiple 
              accept=".xml"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <RefreshCw className={`h-12 w-12 text-primary ${isUploading ? 'animate-spin' : ''}`} />
            <div className="text-center">
              <p className="font-semibold text-lg">Wybierz lub przeciągnij pliki XML</p>
              <p className="text-sm text-muted-foreground">System automatycznie wykryje i zaktualizuje duplikaty</p>
            </div>
          </div>

          {(isUploading || stats.total > 0) && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="truncate max-w-[300px] text-slate-600 italic">
                    {isUploading ? `Przetwarzanie: ${currentFile}` : 'Wszystkie pliki zostały przetworzone'}
                  </span>
                  <span className="font-bold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mb-1" />
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Nowe</p>
                  <p className="text-2xl font-black text-green-700">{stats.added}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center">
                  <FileStack className="h-4 w-4 text-blue-600 mb-1" />
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Zaktualizowane</p>
                  <p className="text-2xl font-black text-blue-700">{stats.updated}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                  <RefreshCw className="h-4 w-4 text-slate-500 mb-1" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Razem</p>
                  <p className="text-2xl font-black text-slate-700">{stats.total}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mb-1" />
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-tighter">Błędy</p>
                  <p className="text-2xl font-black text-red-700">{stats.errors}</p>
                </div>
              </div>
              
              {stats.updated > 0 && !isUploading && (
                <p className="text-xs text-center text-muted-foreground bg-blue-50/50 py-2 rounded-lg border border-dashed border-blue-200">
                  Wskazówka: Faktury o numerach, które już były w bazie, zostały zaktualizowane zamiast tworzenia kopii.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
