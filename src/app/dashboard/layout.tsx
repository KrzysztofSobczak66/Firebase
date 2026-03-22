
"use client"

import * as React from "react"
import { 
  FileText, 
  Upload, 
  LogOut, 
  ShieldAlert,
  Loader2,
  Users
} from "lucide-react"

import { 
  Sidebar, 
  SidebarContent, 
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
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const auth = useAuth()

  // Lista administratorów
  const adminEmails = ['admin@ksef.pl', 'krzysztof.sobczak@sp-partner.eu']
  const isAdmin = user && adminEmails.includes(user.email || '')

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  // Nawigacja widoczna dla wszystkich
  const publicNav = [
    { label: "Lista Faktur", icon: FileText, href: "/dashboard/invoices" },
  ]

  // Nawigacja widoczna tylko dla administratorów
  const adminNav = [
    { label: "Masowy Import", icon: Upload, href: "/dashboard/admin/import" },
    { label: "Użytkownicy", icon: Users, href: "/dashboard/admin/users" },
    { label: "Administracja", icon: ShieldAlert, href: "/dashboard/admin" },
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
              <span className="text-xl font-bold tracking-tight text-white">KSeF Studio</span>
            </div>
            {isAdmin && (
              <div className="mt-2 px-2">
                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Administrator
                </span>
              </div>
            )}
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/60 px-4 mb-2 uppercase text-[10px] font-bold tracking-widest">
                Dokumenty
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {publicNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.label}
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

            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-white/60 px-4 mb-2 uppercase text-[10px] font-bold tracking-widest">
                  Zarządzanie Systemem
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNav.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={pathname === item.href}
                          tooltip={item.label}
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
            )}
            
            <SidebarGroup className="mt-auto">
              <SidebarGroupLabel className="text-white/60 px-4 mb-2 uppercase text-[10px] font-bold tracking-widest truncate max-w-[180px]">
                Konto: {user.email}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} className="text-white/80 hover:text-white mt-4">
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
                {publicNav.find(i => i.href === pathname)?.label || adminNav.find(i => i.href === pathname)?.label || "KSeF Studio"}
              </h1>
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
