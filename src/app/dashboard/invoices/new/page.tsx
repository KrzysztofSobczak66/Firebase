"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

export default function NewInvoicePage() {
  const router = useRouter()
  const [items, setItems] = useState([{ description: "", quantity: 1, price: 0, vat: 23 }])

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, price: 0, vat: 23 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    toast({ title: "Faktura zapisana", description: "Dokument został pomyślnie zapisany jako szkic." })
    router.push("/dashboard/invoices")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-headline">Nowa Faktura Sprzedaży</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>Zapisz szkic</Button>
          <Button className="bg-primary text-white">
            <Send className="mr-2 h-4 w-4" /> Wyślij do KSeF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Sprzedawca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nazwa firmy</Label>
              <Input defaultValue="Tech Solutions Sp. z o.o." disabled className="bg-slate-50" />
            </div>
            <div className="grid gap-2">
              <Label>NIP</Label>
              <Input defaultValue="1234567890" disabled className="bg-slate-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Nabywca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>NIP Nabywcy</Label>
              <Input placeholder="Wpisz NIP aby pobrać dane..." />
            </div>
            <div className="grid gap-2">
              <Label>Nazwa Nabywcy</Label>
              <Input placeholder="Nazwa firmy lub imię i nazwisko" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Pozycje Faktury</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Dodaj pozycję
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-muted-foreground px-2">
              <div className="col-span-6">Opis usługi/towaru</div>
              <div className="col-span-1">Ilość</div>
              <div className="col-span-2">Cena netto</div>
              <div className="col-span-2">VAT (%)</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center animate-in fade-in duration-300">
                <div className="col-span-6">
                  <Input placeholder="Np. Usługi programistyczne" />
                </div>
                <div className="col-span-1">
                  <Input type="number" defaultValue={item.quantity} />
                </div>
                <div className="col-span-2">
                  <Input type="number" defaultValue={item.price} />
                </div>
                <div className="col-span-2">
                  <Select defaultValue="23">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="23">23%</SelectItem>
                      <SelectItem value="8">8%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="zw">zw.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 flex justify-end gap-12 p-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Suma Netto</p>
            <p className="text-lg font-bold">0,00 PLN</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Suma VAT</p>
            <p className="text-lg font-bold">0,00 PLN</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Suma Brutto</p>
            <p className="text-2xl font-bold text-primary">0,00 PLN</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}