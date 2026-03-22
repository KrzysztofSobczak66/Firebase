
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Upload, 
  User, 
  LogOut, 
  Menu,
  FilePlus,
  Search,
  Settings,
  ShieldAlert
} from "lucide-react"

import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { label: "Panel główny", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Faktury", icon: FileText, href: "/dashboard/invoices" },
    { label: "Weryfikacja AI", icon: ShieldCheck, href: "/dashboard/ai-validator" },
    { label: "Masowy Import", icon: Upload, href: "/dashboard/admin/import" },
    { label: "Administracja", icon: ShieldAlert, href: "/dashboard/admin" },
  ]

  const settingsItems = [
    { label: "Profil Firmy", icon: User, href: "/dashboard/profile" },
    { label: "Ustawienia", icon: Settings, href: "/dashboard/settings" },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="bg-sidebar border-none text-sidebar-foreground">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                <FileText className="text-primary h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">KSeF Faktury</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/60 px-4 mb-2 uppercase text-[10px] font-bold tracking-widest">
                Menu Główne
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.label}
                        className="transition-all duration-200"
                      >
                        <Link href={item.href} className="flex items-center gap-3 py-6">
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup className="mt-auto">
              <SidebarGroupLabel className="text-white/60 px-4 mb-2 uppercase text-[10px] font-bold tracking-widest">
                System
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.label}
                      >
                        <Link href={item.href} className="flex items-center gap-3 py-6">
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-white/80 hover:text-white mt-4">
                      <LogOut className="h-5 w-5" />
                      <span>Wyloguj się</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1 bg-background">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:py-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground font-headline">
                {navItems.find(i => i.href === pathname)?.label || "Dashboard"}
              </h1>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="hidden sm:flex border-primary text-primary hover:bg-primary/5">
                  <Search className="h-4 w-4 mr-2" />
                  Szukaj...
                </Button>
                <Button asChild className="bg-accent hover:bg-accent/90 text-white font-semibold">
                  <Link href="/dashboard/invoices/new">
                    <FilePlus className="h-4 w-4 mr-2" />
                    Nowa Faktura
                  </Link>
                </Button>
              </div>
            </div>
          </header>
          <main className="p-6 transition-all duration-300">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
