"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, RefreshCw, AlertCircle, Loader2, Database, ShieldCheck } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { parseKSeFXMLClient } from "@/lib/ksef-xml-parser"
import { extractPdfInvoiceData } from "@/ai/flows/pdf-invoice-data-extraction-flow"
import { saveInvoice } from "@/lib/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState("")
  const [stats, setStats] = useState({ added: 0, updated: 0, total: 0, errors: 0 })
  const { toast } = useToast()

  const isFirebaseOk = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('TWÓJ');
  const isAiOk = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY || !!process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

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

      // 1. Parsowanie lokalne dla XML (Błyskawiczne, bez AI)
      if (file.name.toLowerCase().endsWith('.xml')) {
        const content = await file.text()
        dataToSave = parseKSeFXMLClient(content)
      } 
      // 2. Parsowanie przez AI dla PDF
      else if (file.name.toLowerCase().endsWith('.pdf')) {
        if (!isAiOk) {
          throw new Error("Brak klucza API dla Gemini (wymagany dla PDF)")
        }
        const dataUri = await fileToBase64(file)
        const extracted = await extractPdfInvoiceData({ pdfDataUri: dataUri })
        dataToSave = {
          ...extracted,
          sellerName: extracted.seller?.name,
          sellerNip: extracted.seller?.nip,
          pdfDataUri: dataUri
        }
      }

      // 3. Zapis do bazy danych
      if (dataToSave) {
        const res = await saveInvoice({
          ...dataToSave,
          sourceFile: file.name
        })

        if (res.status === 'added') setStats(prev => ({ ...prev, added: prev.added + 1 }))
        else setStats(prev => ({ ...prev, updated: prev.updated + 1 }))
      } else {
        throw new Error("Nie udało się rozpoznać formatu pliku")
      }
    } catch (error: any) {
      console.error(`Błąd pliku ${file.name}:`, error)
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    if (!isFirebaseOk) {
      toast({ 
        variant: "destructive", 
        title: "Błąd bazy danych", 
        description: "Uzupełnij klucze Firebase w pliku .env przed importem." 
      })
      return
    }

    setIsUploading(true)
    setProgress(0)
    setStats({ added: 0, updated: 0, total: files.length, errors: 0 })

    const fileList = Array.from(files)
    
    for (let i = 0; i < fileList.length; i++) {
      await processFile(fileList[i])
      setProgress(Math.round(((i + 1) / fileList.length) * 100))
      // Krótkie oczekiwanie dla płynności UI
      await new Promise(r => setTimeout(r, 50))
    }

    setIsUploading(false)
    setCurrentFile("")
    toast({ 
      title: "Import zakończony", 
      description: `Pomyślnie przetworzono pliki.` 
    })
    event.target.value = ''
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid gap-4">
        {!isFirebaseOk && (
          <Alert variant="destructive" className="bg-red-50">
            <Database className="h-4 w-4" />
            <AlertTitle>Błąd konfiguracji Firebase</AlertTitle>
            <AlertDescription>
              Wejdź do Firebase Console -> Ustawienia projektu -> Skopiuj klucze SDK i wklej je do pliku <strong>.env</strong> w edytorze obok.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-50 border-blue-200">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <AlertTitle>Szybki import XML aktywny</AlertTitle>
          <AlertDescription>
            Pliki XML są przetwarzane lokalnie w ułamku sekundy. PDF-y wymagają aktywnego klucza Gemini.
          </AlertDescription>
        </Alert>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Masowy Import Danych</CardTitle>
          <CardDescription>Przeciągnij pliki XML (KSeF) lub PDF do bazy danych.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
            <input 
              type="file" 
              multiple 
              accept=".xml,.pdf"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={isUploading || !isFirebaseOk}
            />
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              {isUploading ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <RefreshCw className="h-8 w-8 text-primary" />}
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Wybierz pliki do importu</p>
              <p className="text-sm text-muted-foreground">Obsługiwane formaty: XML, PDF</p>
            </div>
          </div>

          {(isUploading || stats.total > 0) && (
            <div className="mt-8 space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="truncate max-w-[300px]">
                    {isUploading ? `Analizuję: ${currentFile}` : 'Zakończono'}
                  </span>
                  <span>{stats.added + stats.updated + stats.errors} / {stats.total}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3 border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-[10px] text-green-600 font-semibold uppercase">Zapisane</p>
                    <p className="text-xl font-bold">{stats.added}</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] text-blue-600 font-semibold uppercase">Zaktualizowane</p>
                    <p className="text-xl font-bold">{stats.updated}</p>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-[10px] text-red-600 font-semibold uppercase">Pominięte</p>
                    <p className="text-xl font-bold">{stats.errors}</p>
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