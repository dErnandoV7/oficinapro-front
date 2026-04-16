"use client"

import { useEffect, useState } from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Store, Users, Wrench } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { tokenHasStore } from "@/lib/jwt"

export const AppSidebar = () => {
  const pathname = usePathname()
  const router = useRouter()

  const [hasStore, setHasStore] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    let token: string | null = null

    try {
      token = window.sessionStorage.getItem("token")
    } catch {
      token = null
    }

    if (!token) {
      const cookieTokenMatch = document.cookie.match(/(?:^|; )token=([^;]*)/)
      if (cookieTokenMatch?.[1]) {
        try {
          token = decodeURIComponent(cookieTokenMatch[1])
        } catch {
          token = cookieTokenMatch[1]
        }
      }
    }

    setHasStore(token ? tokenHasStore(token) : false)
  }, [pathname])

  const handleLogout = () => {
    sessionStorage.removeItem("token")

    const baseCookie = "token=; path=/; max-age=0; samesite=lax"
    document.cookie = baseCookie
    if (window.location.protocol === "https:") {
      document.cookie = `${baseCookie}; secure`
    }

    router.replace("/login")
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="px-3 pt-4 pb-3">
        <Link
          href={hasStore ? "/clientes" : "/loja"}
          className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-accent ring-1 ring-sidebar-border shadow-xs">
            <Wrench className="size-5 text-sidebar-foreground" />
          </div>
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">
              Oficina<span className="font-extrabold text-sidebar-primary">PRO</span>
            </span>
            <span className="text-xs text-sidebar-foreground/70">Gestão da oficina</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hasStore ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={pathname === "/clientes"}
                    tooltip="Clientes"
                    className={
                      "gap-3 rounded-xl px-3 ring-1 ring-transparent hover:ring-sidebar-border/60 " +
                      "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm data-[active=true]:ring-sidebar-border"
                    }
                  >
                    <Link href="/clientes">
                      <Users className="size-4 opacity-90" />
                      <span className="font-medium">Clientes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={pathname === "/loja"}
                    tooltip="Adicionar loja"
                    className={
                      "gap-3 rounded-xl px-3 ring-1 ring-transparent hover:ring-sidebar-border/60 " +
                      "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm data-[active=true]:ring-sidebar-border"
                    }
                  >
                    <Link href="/loja">
                      <Store className="size-4 opacity-90" />
                      <span className="font-medium">Adicionar loja</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Sair"
              type="button"
              onClick={handleLogout}
              className="gap-3 rounded-xl px-3 ring-1 ring-transparent hover:ring-sidebar-border/60 hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15 active:text-destructive"
            >
              <LogOut className="size-4 opacity-90" />
              <span className="font-medium">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
