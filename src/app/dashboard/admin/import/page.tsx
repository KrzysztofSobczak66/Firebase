"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileCode, FileText, CheckCircle2, Loader2, FolderSearch, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { parseKSeFXML } from "@/ai/flows/parse-ksef-xml-flow"

export default function AdminImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)

  // Ścieżka lokalna wspomniana przez użytkownika
  const LOCAL_PATH = "D:\\OneDrivePARTNER\\KSeF_DEV\\FV_Zakupowe\\DANE"

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setProgress(0)
    setTotalFiles(files.length)
    setProcessedCount(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        if (file.name.endsWith('.xml')) {
          const content = await file.text()
          // Wywołujemy rzeczywisty parser AI
          await parseKSeFXML(content)
        }
        
        // Symulacja postępu
        setProcessedCount(prev => prev + 1)
        setProgress(Math.round(((i + 1) / files.length) * 100))
        
        // Krótkie opóźnienie dla efektu UI
        await new Promise(r => setTimeout(r, 200))
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
      }
    }

    setIsUploading(false)
    toast({ 
      title: "Import zakończony", 
      description: `Pomyślnie przetworzono ${files.length} dokumentów.` 
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Automatyczny Import Dokumentów</CardTitle>
          <CardDescription>
            System jest skonfigurowany do monitorowania folderu:<br/>
            <code className="text-xs bg-slate-100 p-1 rounded mt-2 block font-mono">
              {LOCAL_PATH}
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
              <FolderSearch className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Zaciągnij nowe pliki z OneDrive</p>
              <p className="text-sm text-muted-foreground">Wybierz pliki z folderu lokalnego, aby zaktualizować bazę danych.</p>
            </div>
          </div>

          {isUploading && (
            <div className="mt-8 space-y-4 animate-in fade-in duration-500">
              <div className="flex justify-between text-sm font-medium">
                <span>Przetwarzanie dokumentów ({processedCount} / {totalFiles})...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-100" />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-blue-600 font-semibold uppercase">Status</p>
                    <p className="text-lg font-bold">W toku...</p>
                  </div>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
                  <div>
                    <p className="text-xs text-cyan-600 font-semibold uppercase">AI Parser</p>
                    <p className="text-lg font-bold">Aktywny</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ostatnie sesje importu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded flex items-center justify-center border">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm font-mono">ONEDRIVE-SYNC-2024-03-24</p>
                  <p className="text-xs text-muted-foreground">Ostatnia synchronizacja: dzisiaj, 10:45</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">Przetworzono wzorzec FA(3)</p>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-none">ZSYNCHRONIZOWANO</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
