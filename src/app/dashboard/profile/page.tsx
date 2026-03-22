"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mockProfile } from "@/lib/mock-data"
import { User, Building2, MapPin, ShieldCheck, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const handleSave = () => {
    toast({ title: "Profil zaktualizowany", description: "Dane firmy zostały pomyślnie zapisane w Firestore." })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="h-32 bg-primary relative">
          <div className="absolute -bottom-12 left-8 h-24 w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
        </div>
        <CardHeader className="pt-16 px-8">
          <CardTitle className="text-2xl">{mockProfile.name}</CardTitle>
          <CardDescription>Zarządzaj danymi firmy i integracją z KSeF</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div className="flex items-center gap-2 font-bold text-sm text-muted-foreground uppercase tracking-wider">
                <Building2 className="h-4 w-4" /> Dane identyfikacyjne
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Pełna nazwa firmy</Label>
                  <Input defaultValue={mockProfile.name} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>NIP</Label>
                    <Input defaultValue={mockProfile.nip} />
                  </div>
                  <div className="grid gap-2">
                    <Label>REGON</Label>
                    <Input defaultValue={mockProfile.regon} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 font-bold text-sm text-muted-foreground uppercase tracking-wider">
                <MapPin className="h-4 w-4" /> Adres rejestrowy
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Ulica i numer</Label>
                  <Input defaultValue={mockProfile.address.street} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Kod pocztowy</Label>
                    <Input defaultValue={mockProfile.address.postalCode} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Miejscowość</Label>
                    <Input defaultValue={mockProfile.address.city} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t p-6 px-8 flex justify-end gap-3">
          <Button variant="outline">Anuluj zmiany</Button>
          <Button onClick={handleSave} className="bg-primary text-white">
            <Save className="mr-2 h-4 w-4" /> Zapisz profil
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-none shadow-sm bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-accent">
            <ShieldCheck className="h-5 w-5" /> Połączenie z KSeF
          </CardTitle>
          <CardDescription>Status połączenia z bramką Ministerstwa Finansów</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-sm">Token Autoryzacyjny</p>
              <p className="text-xs text-muted-foreground font-mono">••••••••••••••••••••••••••••••••</p>
            </div>
            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white transition-all">
              Generuj nowy token
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}