"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  FileText, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from "recharts"

const stats = [
  { label: "Wysłane faktury", value: "1,234", icon: FileText, trend: "+12%", color: "text-primary" },
  { label: "Przychód netto", value: "45,231 PLN", icon: TrendingUp, trend: "+8.5%", color: "text-accent" },
  { label: "Oczekujące KSeF", value: "12", icon: Clock, trend: "-2", color: "text-blue-500" },
  { label: "Błędy walidacji", value: "3", icon: AlertCircle, trend: "Stable", color: "text-destructive" },
]

const data = [
  { name: "Pon", value: 400 },
  { name: "Wt", value: 300 },
  { name: "Śr", value: 600 },
  { name: "Czw", value: 800 },
  { name: "Pt", value: 500 },
  { name: "Sob", value: 200 },
  { name: "Ndz", value: 100 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={stat.trend.startsWith('+') ? 'text-green-500' : 'text-blue-500'}>
                  {stat.trend}
                </span>{" "}
                od ostatniego miesiąca
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Aktywność faktur</CardTitle>
            <CardDescription>Liczba wygenerowanych faktur w tym tygodniu</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(34, 110, 219, 0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Ostatnie Akcje</CardTitle>
            <CardDescription>Twoja aktywność w systemie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Wysłano fakturę FV/2024/00{i}</p>
                    <p className="text-sm text-muted-foreground">Status: Zaakceptowano przez KSeF</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-muted-foreground">2h temu</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}