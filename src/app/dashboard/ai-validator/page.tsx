"use client"

import { useState } from "react"
import { ksefXMLValidation, type KSeFXMLValidationOutput } from "@/ai/flows/ksef-xml-validation-flow"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  FileCode,
  Info
} from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function AIValidatorPage() {
  const [xmlContent, setXmlContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KSeFXMLValidationOutput | null>(null)

  const handleValidate = async () => {
    if (!xmlContent.trim()) return
    setLoading(true)
    try {
      const response = await ksefXMLValidation({ xmlContent })
      setResult(response)
    } catch (error) {
      console.error("Validation failed", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Walidacja AI KSeF XML
          </CardTitle>
          <CardDescription>
            Wklej zawartość pliku XML, aby sprawdzić jego zgodność ze schemą KSeF przed wysyłką.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="<Invoice>...</Invoice>" 
            className="min-h-[300px] font-mono text-sm border-slate-200"
            value={xmlContent}
            onChange={(e) => setXmlContent(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setXmlContent("")}>Wyczyść</Button>
          <Button 
            onClick={handleValidate} 
            disabled={loading || !xmlContent}
            className="bg-accent hover:bg-accent/90 text-white"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Analizuj plik XML
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <Alert variant={result.isValid ? "default" : "destructive"} className={result.isValid ? "bg-green-50 border-green-200 text-green-800" : ""}>
            {result.isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.isValid ? "Plik jest poprawny" : "Wykryto błędy w pliku"}</AlertTitle>
            <AlertDescription>
              {result.isValid 
                ? "Twój plik XML jest zgodny ze standardami KSeF i jest gotowy do wysyłki." 
                : "Znaleziono błędy, które mogą uniemożliwić poprawne przetworzenie dokumentu."}
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Wykryte błędy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.errors.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Brak błędów krytycznych.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Sugestie poprawy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.suggestions.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
                    {result.suggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Wszystkie parametry są optymalne.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}