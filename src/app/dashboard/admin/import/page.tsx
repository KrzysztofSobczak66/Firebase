"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileCode, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

export default function AdminImportPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleBulkImport = () => {
    setIsUploading(true)
    setProgress(0)
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          toast({ title: "Import zakończony", description: "Pomyślnie przetworzono 25 plików." })
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Masowy Import Dokumentów</CardTitle>
          <CardDescription>
            Prześlij wiele plików XML lub PDF naraz. System automatycznie wyodrębni dane i przygotuje faktury do wysyłki.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
            onClick={() => !isUploading && handleBulkImport()}
          >
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Kliknij lub przeciągnij pliki tutaj</p>
              <p className="text-sm text-muted-foreground">Obsługiwane formaty: .xml, .pdf (Max 50MB na paczkę)</p>
            </div>
          </div>

          {isUploading && (
            <div className="mt-8 space-y-4 animate-in fade-in duration-500">
              <div className="flex justify-between text-sm font-medium">
                <span>Przetwarzanie dokumentów...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-100" />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-blue-600 font-semibold uppercase">Faktury XML</p>
                    <p className="text-lg font-bold">12 / 15</p>
                  </div>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg flex items-center gap-3">
                  <FileText className="h-5 w-5 text-cyan-500" />
                  <div>
                    <p className="text-xs text-cyan-600 font-semibold uppercase">Faktury PDF</p>
                    <p className="text-lg font-bold">8 / 10</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ostatnie Importy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">BATCH-2024-03-{i}5</p>
                    <p className="text-xs text-muted-foreground">24 marca 2024, 14:2{i}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">25 plików</p>
                  <Badge variant="outline" className="text-[10px] bg-white">ZAKOŃCZONO</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}