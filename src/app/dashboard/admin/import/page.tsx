
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { parseKSeFXML } from "@/ai/flows/parse-ksef-xml-flow"
import { extractPdfInvoiceData } from "@/ai/flows/pdf-invoice-data-extraction-flow"
import { saveInvoice } from "@/lib/firestore"

export default function AdminImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({ added: 0, updated: 0, total: 0 })
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setProgress(0)
    
    let addedCount = 0
    let updatedCount = 0
    const totalFiles = files.length
    
    setStats({ added: 0, updated: 0, total: totalFiles })

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i]
      console.log(`Przetwarzanie pliku: ${file.name}`)
      
      try {
        if (file.name.toLowerCase().endsWith('.xml')) {
          const content = await file.text()
          const parsedData = await parseKSeFXML(content)
          const result = await saveInvoice({
            ...parsedData,
            sourceFile: file.name
          })
          
          if (result.status === 'added') {
            addedCount++
            setStats(prev => ({ ...prev, added: prev.added + 1 }))
          } else {
            updatedCount++
            setStats(prev => ({ ...prev, updated: prev.updated + 1 }))
          }
        } 
        else if (file.name.toLowerCase().endsWith('.pdf')) {
          const dataUri = await fileToBase64(file)
          const extractedData = await extractPdfInvoiceData({ pdfDataUri: dataUri })
          
          const result = await saveInvoice({
            ...extractedData,
            sellerNip: extractedData.seller.nip,
            pdfDataUri: dataUri,
            sourceFile: file.name
          })

          if (result.status === 'added') {
            addedCount++
            setStats(prev => ({ ...prev, added: prev.added + 1 }))
          } else {
            updatedCount++
            setStats(prev => ({ ...prev, updated: prev.updated + 1 }))
          }
        }
        
        setProgress(Math.round(((i + 1) / totalFiles) * 100))
      } catch (error) {
        console.error(`Błąd podczas przetwarzania ${file.name}:`, error)
        toast({ 
          variant: "destructive", 
          title: "Błąd pliku", 
          description: `Nie udało się przetworzyć ${file.name}` 
        })
      }
    }

    setIsUploading(false)
    toast({ 
      title: "Synchronizacja zakończona", 
      description: `Pomyślnie przetworzono ${addedCount + updatedCount} plików z ${totalFiles}.` 
    })
    
    // Resetuj input
    event.target.value = ''
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Masowy Import (XML & PDF)</CardTitle>
          <CardDescription>
            Wybierz pliki z folderu lokalnego, aby zsynchronizować bazę danych. System automatycznie połączy dane XML z podglądem PDF.<br/>
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
              <RefreshCw className={`h-8 w-8 text-primary ${isUploading ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Zsynchronizuj pliki</p>
              <p className="text-sm text-muted-foreground">Kliknij tutaj, zaznacz wszystkie pliki w folderze DANE i otwórz je.</p>
            </div>
          </div>

          {(isUploading || stats.total > 0) && (
            <div className="mt-8 space-y-4 animate-in fade-in duration-500">
              <div className="flex justify-between text-sm font-medium">
                <span>{isUploading ? 'Przetwarzanie dokumentów...' : 'Przetwarzanie zakończone'}</span>
                <span>{stats.added + stats.updated} / {stats.total}</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-100" />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3 border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-green-600 font-semibold uppercase">Nowe w bazie</p>
                    <p className="text-xl font-bold">{stats.added}</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-blue-600 font-semibold uppercase">Zaktualizowane / PDF</p>
                    <p className="text-xl font-bold">{stats.updated}</p>
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
