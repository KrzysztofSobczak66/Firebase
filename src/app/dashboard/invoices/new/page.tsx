
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface InvoiceItem {
  description: string
  quantity: number
  price: number
  vat: number | string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0, vat: 23 }
  ])

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, price: 0, vat: 23 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const totals = useMemo(() => {
    return items.reduce((acc, item) => {
      const net = item.quantity * item.price
      const vatRate = typeof item.vat === 'number' ? item.vat : 0
      const vat = net * (vatRate / 100)
      return {
        net: acc.net + net,
        vat: acc.vat + vat,
        gross: acc.gross + net + vat
      }
    }, { net: 0, vat: 0, gross: 0 })
  }, [items])

  const handleSave = () => {
    toast({ title: "Faktura zapisana", description: "Dokument został pomyślnie zapisany jako szkic." })
    router.push("/dashboard/invoices")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-headline text-primary">Nowa Faktura Sprzedaży</h2>
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
              <div className="col-span-5">Opis usługi/towaru</div>
              <div className="col-span-2">Ilość</div>
              <div className="col-span-2">Cena netto</div>
              <div className="col-span-2">VAT (%)</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center animate-in fade-in duration-300">
                <div className="col-span-5">
                  <Input 
                    placeholder="Np. Usługi programistyczne" 
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Select 
                    value={item.vat.toString()} 
                    onValueChange={(val) => updateItem(index, 'vat', val === 'zw' ? 'zw' : parseInt(val))}
                  >
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(index)} 
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 flex flex-col md:flex-row justify-end gap-6 md:gap-12 p-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-medium">Suma Netto</p>
            <p className="text-xl font-bold">{totals.net.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-medium">Suma VAT</p>
            <p className="text-xl font-bold">{totals.vat.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-medium">Suma Brutto</p>
            <p className="text-3xl font-bold text-primary">{totals.gross.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
