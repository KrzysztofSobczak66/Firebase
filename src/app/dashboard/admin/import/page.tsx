"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { parseKSeFXMLClient } from "@/lib/ksef-xml-parser"
import { saveInvoice, isFirebaseConfigured } from "@/lib/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, Loader2, ShieldCheck, Info, AlertCircle } from "lucide-react"

export default function AdminImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState("")
  const [stats, setStats] = useState({ added: 0, updated: 0, total: 0, errors: 0 })
  const { toast } = useToast()

  const processFile = async (file: File) => {
    setCurrentFile(file.name)
    try {
      if (file.name.toLowerCase().endsWith('.xml')) {
        const content = await file.text()
        const parsed = parseKSeFXMLClient(content)
        if (parsed) {
          await saveInvoice({ ...parsed, sourceFile: file.name })
          setStats(prev => ({ ...prev, added: prev.added + 1 }))
        } else {
          throw new Error("Błąd parsowania XML")
        }
      } else {
        throw new Error("Format nieobsługiwany")
      }
    } catch (error: any) {
      console.error(`Błąd: ${file.name}`, error)
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
      if (error.name === 'QuotaExceededError') {
        throw new Error("PAMIĘĆ PEŁNA: Przeglądarka nie może pomieścić więcej danych. Skonfiguruj Firestore, aby importować tysiące plików.")
      }
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    setProgress(0)
    setStats({ added: 0, updated: 0, total: files.length, errors: 0 })

    const fileList = Array.from(files)
    
    try {
      for (let i = 0; i < fileList.length; i++) {
        await processFile(fileList[i])
        setProgress(Math.round(((i + 1) / fileList.length) * 100))
      }
      toast({ title: "Gotowe", description: "Wszystkie pliki zostały przetworzone." })
    } catch (quotaError: any) {
      toast({ variant: "destructive", title: "Limit pamięci", description: quotaError.message })
    } finally {
      setIsUploading(false)
      setCurrentFile("")
      event.target.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!isFirebaseConfigured && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold">Ważna informacja (Tryb Lokalny)</AlertTitle>
          <AlertDescription className="text-amber-700">
            Importujesz {stats.total > 100 ? 'bardzo dużą' : 'sporą'} liczbę plików. Pamięć przeglądarki ma limit ok. 5MB. 
            Zalecamy importowanie plików w paczkach po 100-200 sztuk lub konfigurację Firestore w pliku .env dla pełnej bazy 19k+ rekordów.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Masowy Import XML</CardTitle>
              <CardDescription>Wyślij pliki KSeF bezpośrednio do systemu.</CardDescription>
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
              <p className="font-semibold text-lg">Kliknij aby wybrać pliki XML</p>
              <p className="text-sm text-muted-foreground">Obsługujemy standard KSeF FA(3)</p>
            </div>
          </div>

          {(isUploading || stats.total > 0) && (
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="truncate max-w-[300px]">
                    {isUploading ? `Przetwarzanie: ${currentFile}` : 'Przetwarzanie zakończone'}
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                  <p className="text-[10px] text-green-600 font-bold uppercase">Zaimportowano</p>
                  <p className="text-2xl font-bold">{stats.added}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-600 font-bold uppercase">W kolejce</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                  <p className="text-[10px] text-red-600 font-bold uppercase">Błędy/Limity</p>
                  <p className="text-2xl font-bold">{stats.errors}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
