
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, RefreshCw, AlertCircle, Loader2, ShieldCheck, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { parseKSeFXMLClient } from "@/lib/ksef-xml-parser"
import { extractPdfInvoiceData } from "@/ai/flows/pdf-invoice-data-extraction-flow"
import { saveInvoice, isFirebaseConfigured } from "@/lib/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function AdminImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState("")
  const [stats, setStats] = useState({ added: 0, updated: 0, total: 0, errors: 0 })
  const { toast } = useToast()

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const processFile = async (file: File) => {
    setCurrentFile(file.name)
    try {
      let dataToSave: any = null;

      if (file.name.toLowerCase().endsWith('.xml')) {
        const content = await file.text()
        const parsed = parseKSeFXMLClient(content)
        if (parsed) {
          dataToSave = {
            ...parsed,
            sourceFile: file.name
          }
        }
      } 
      else if (file.name.toLowerCase().endsWith('.pdf')) {
        const dataUri = await fileToBase64(file)
        try {
          const extracted = await extractPdfInvoiceData({ pdfDataUri: dataUri })
          dataToSave = {
            ...extracted,
            sellerName: extracted.seller?.name,
            sellerNip: extracted.seller?.nip,
            pdfDataUri: dataUri,
            sourceFile: file.name
          }
        } catch (aiError) {
          console.error("AI Extraction Error:", aiError)
          throw new Error("Błąd AI: Upewnij się, że masz skonfigurowany klucz GEMINI_API_KEY w .env")
        }
      }

      if (dataToSave) {
        const res = await saveInvoice(dataToSave)
        if (res.status === 'added') setStats(prev => ({ ...prev, added: prev.added + 1 }))
        else setStats(prev => ({ ...prev, updated: prev.updated + 1 }))
      } else {
        throw new Error("Nie udało się rozpoznać formatu pliku lub plik jest uszkodzony")
      }
    } catch (error: any) {
      console.error(`Błąd pliku ${file.name}:`, error)
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
      toast({ 
        variant: "destructive", 
        title: `Błąd: ${file.name}`, 
        description: error.message || "Wystąpił nieoczekiwany problem." 
      })
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
      await new Promise(r => setTimeout(r, 50))
    }

    setIsUploading(false)
    setCurrentFile("")
    toast({ 
      title: "Przetwarzanie zakończone", 
      description: `Sukces: ${stats.added + stats.updated}, Błędy: ${stats.errors}`
    })
    event.target.value = ''
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid gap-4">
        {!isFirebaseConfigured && (
          <Alert className="bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-semibold">Tryb Przeglądarkowy (Demo)</AlertTitle>
            <AlertDescription className="text-amber-700">
              Przetwarzasz pliki lokalnie. Faktury zostaną zapisane w pamięci przeglądarki i zobaczysz je w zakładce "Faktury". 
              Aby połączyć bazę na stałe, uzupełnij plik <strong>.env</strong>.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert className="bg-blue-50 border-blue-200">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 font-semibold">Błyskawiczny XML</AlertTitle>
            <AlertDescription className="text-blue-700 text-xs">
              Pliki XML (KSeF) są przetwarzane natychmiastowo bez użycia AI.
            </AlertDescription>
          </Alert>
          <Alert className="bg-purple-50 border-purple-200">
            <FileText className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-800 font-semibold">Analiza PDF (AI)</AlertTitle>
            <AlertDescription className="text-purple-700 text-xs">
              Pliki PDF są analizowane przez Gemini AI. Wymaga klucza API w .env.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Masowy Import Dokumentów</CardTitle>
              <CardDescription>Przeciągnij pliki XML (KSeF) lub PDF.</CardDescription>
            </div>
            {!isFirebaseConfigured && <Badge variant="secondary" className="bg-amber-100 text-amber-800">Local DB Only</Badge>}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
            <input 
              type="file" 
              multiple 
              accept=".xml,.pdf"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              {isUploading ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <RefreshCw className="h-8 w-8 text-primary" />}
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg text-slate-700">Kliknij lub przeciągnij pliki</p>
              <p className="text-sm text-muted-foreground">Obsługujemy KSeF XML oraz skany PDF</p>
            </div>
          </div>

          {(isUploading || stats.total > 0) && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="truncate max-w-[300px]">
                    {isUploading ? `Przetwarzanie: ${currentFile}` : 'Przetwarzanie zakończone'}
                  </span>
                  <span>{stats.added + stats.updated + stats.errors} / {stats.total}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3 border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider">Poprawne</p>
                    <p className="text-xl font-bold text-slate-800">{stats.added + stats.updated}</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">W kolejce</p>
                    <p className="text-xl font-bold text-slate-800">{stats.total - (stats.added + stats.updated + stats.errors)}</p>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">Błędy</p>
                    <p className="text-xl font-bold text-slate-800">{stats.errors}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
