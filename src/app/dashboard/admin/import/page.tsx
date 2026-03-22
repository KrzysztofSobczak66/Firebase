
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileCode, FileText, CheckCircle2, Loader2, FolderSearch, AlertCircle, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { parseKSeFXML } from "@/ai/flows/parse-ksef-xml-flow"
import { saveInvoice } from "@/lib/firestore"

export default function AdminImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({ added: 0, skipped: 0, total: 0 })

  const LOCAL_PATH = "D:\\OneDrivePARTNER\\KSeF_DEV\\FV_Zakupowe\\DANE"

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setProgress(0)
    setStats({ added: 0, skipped: 0, total: files.length })

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        if (file.name.endsWith('.xml')) {
          const content = await file.text()
          const parsedData = await parseKSeFXML(content)
          
          // Zapis do bazy z weryfikacją duplikatów
          const result = await saveInvoice(parsedData)
          
          if (result.status === 'added') {
            setStats(prev => ({ ...prev, added: prev.added + 1 }))
          } else {
            setStats(prev => ({ ...prev, skipped: prev.skipped + 1 }))
          }
        }
        
        setProgress(Math.round(((i + 1) / files.length) * 100))
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
      title: "Import zakończony", 
      description: `Dodano: ${stats.added + (stats.total > 0 ? 0 : 0)}, Pominięto (duplikaty): ${stats.skipped}` 
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Automatyczny Import Dokumentów</CardTitle>
          <CardDescription>
            System weryfikuje numery faktur przed zapisem. Dokumenty już istniejące w bazie zostaną pominięte.<br/>
            <code className="text-xs bg-slate-100 p-1 rounded mt-2 block font-mono">
              Monitorowana ścieżka: {LOCAL_PATH}
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
            <input 
              type="file" 
              multiple 
              accept=".xml"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <RefreshCw className={`h-8 w-8 text-primary ${isUploading ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Synchronizuj bazę z folderem DANE</p>
              <p className="text-sm text-muted-foreground">Wybierz nowe pliki XML, aby dodać je do systemu.</p>
            </div>
          </div>

          {(isUploading || stats.total > 0) && (
            <div className="mt-8 space-y-4 animate-in fade-in duration-500">
              <div className="flex justify-between text-sm font-medium">
                <span>Postęp synchronizacji: {progress}%</span>
                <span>{stats.added + stats.skipped} / {stats.total}</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-100" />
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-green-600 font-semibold uppercase">Nowe</p>
                    <p className="text-xl font-bold">{stats.added}</p>
                  </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-amber-600 font-semibold uppercase">Pominięte</p>
                    <p className="text-xl font-bold">{stats.skipped}</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                  <Loader2 className={`h-5 w-5 text-blue-500 ${isUploading ? 'animate-spin' : ''}`} />
                  <div>
                    <p className="text-xs text-blue-600 font-semibold uppercase">Status AI</p>
                    <p className="text-sm font-bold">{isUploading ? 'Analizuje...' : 'Gotowy'}</p>
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
                  <FileCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm font-mono uppercase">OneDrive Sync Session</p>
                  <p className="text-xs text-muted-foreground">Ostatnia próba: przed chwilą</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">Wzorzec FA(3)</p>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-none">ZSYNCHRONIZOWANO</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
