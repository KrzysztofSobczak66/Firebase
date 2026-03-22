"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { parseKSeFXML } from "@/ai/flows/parse-ksef-xml-flow"
import { extractPdfInvoiceData } from "@/ai/flows/pdf-invoice-data-extraction-flow"
import { saveInvoice } from "@/lib/firestore"

export default function AdminImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState("")
  const [stats, setStats] = useState({ added: 0, updated: 0, total: 0, errors: 0 })
  const { toast } = useToast()

  const LOCAL_PATH = "D:\\OneDrivePARTNER\\KSeF_DEV\\FV_Zakupowe\\DANE"

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
      if (file.name.toLowerCase().endsWith('.xml')) {
        const content = await file.text()
        const parsedData = await parseKSeFXML(content)
        const result = await saveInvoice({
          ...parsedData,
          sourceFile: file.name
        })
        
        if (result.status === 'added') setStats(prev => ({ ...prev, added: prev.added + 1 }))
        else setStats(prev => ({ ...prev, updated: prev.updated + 1 }))
      } 
      else if (file.name.toLowerCase().endsWith('.pdf')) {
        const dataUri = await fileToBase64(file)
        const extractedData = await extractPdfInvoiceData({ pdfDataUri: dataUri })
        
        const result = await saveInvoice({
          ...extractedData,
          sellerNip: extractedData.seller?.nip,
          pdfDataUri: dataUri,
          sourceFile: file.name
        })

        if (result.status === 'added') setStats(prev => ({ ...prev, added: prev.added + 1 }))
        else setStats(prev => ({ ...prev, updated: prev.updated + 1 }))
      }
    } catch (error) {
      console.error(`Błąd pliku ${file.name}:`, error)
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
      // Dodatkowe opóźnienie przy błędzie (prawdopodobny rate limit)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setProgress(0)
    setStats({ added: 0, updated: 0, total: files.length, errors: 0 })

    const fileList = Array.from(files)
    // Najpierw XML (mniejsze obciążenie), potem PDF
    const sortedFiles = fileList.sort((a, b) => {
      if (a.name.endsWith('.xml') && !b.name.endsWith('.xml')) return -1
      if (!a.name.endsWith('.xml') && b.name.endsWith('.xml')) return 1
      return 0
    })

    // Zmniejszona paczka do 1 pliku naraz dla darmowych limitów Gemini
    for (let i = 0; i < sortedFiles.length; i++) {
      await processFile(sortedFiles[i])
      
      const newProgress = Math.round(((i + 1) / sortedFiles.length) * 100)
      setProgress(newProgress)
      
      // Obowiązkowa przerwa między zapytaniami do AI
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    setIsUploading(false)
    setCurrentFile("")
    toast({ 
      title: "Synchronizacja zakończona", 
      description: `Przetworzono ${sortedFiles.length} plików.` 
    })
    event.target.value = ''
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Masowy Import (XML & PDF)</CardTitle>
          <CardDescription>
            System przetwarza pliki sekwencyjnie, aby zachować stabilność przy dużych wolumenach.<br/>
            <code className="text-xs bg-slate-100 p-1 rounded mt-2 block font-mono">
              Lokalizacja: {LOCAL_PATH}
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
            <input 
              type="file" 
              multiple 
              accept=".xml,.pdf"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              {isUploading ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <RefreshCw className="h-8 w-8 text-primary" />}
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Wybierz pliki do synchronizacji</p>
              <p className="text-sm text-muted-foreground">Możesz zaznaczyć wszystkie 1000+ plików naraz.</p>
            </div>
          </div>

          {(isUploading || stats.total > 0) && (
            <div className="mt-8 space-y-6 animate-in fade-in duration-500">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2">
                    {isUploading ? (
                      <>Przetwarzanie: <span className="text-primary truncate max-w-[250px]">{currentFile}</span></>
                    ) : 'Zakończono synchronizację'}
                  </span>
                  <span>{stats.added + stats.updated + stats.errors} / {stats.total}</span>
                </div>
                <Progress value={progress} className="h-2 bg-slate-100" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3 border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-[10px] text-green-600 font-semibold uppercase">Nowe rekordy</p>
                    <p className="text-xl font-bold">{stats.added}</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] text-blue-600 font-semibold uppercase">Zaktualizowane / PDF</p>
                    <p className="text-xl font-bold">{stats.updated}</p>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-[10px] text-red-600 font-semibold uppercase">Błędy / Limity</p>
                    <p className="text-xl font-bold">{stats.errors}</p>
                  </div>
                </div>
              </div>
              
              {stats.errors > 0 && (
                <p className="text-xs text-muted-foreground bg-slate-50 p-2 rounded border border-dashed">
                  Wskazówka: Jeśli widzisz dużo błędów, sprawdź czy klucz API Gemini ma wystarczające limity lub spróbuj mniejszej paczki plików.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
