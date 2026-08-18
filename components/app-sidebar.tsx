"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Package,
  Truck,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Settings,
} from "lucide-react"

type Tab = "estoque" | "entrada" | "financeiro" | "dashboard" | "lista-compras" | "admin"

interface AppSidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onLogout: () => void
  user: string
  userRole: string
  userPermissoes: string[]
  isOpen: boolean
  onToggle: () => void
}

const menuItems = [
  { id: "estoque" as Tab, label: "Estoque", icon: Package },
  { id: "entrada" as Tab, label: "Entrada", icon: Truck },
  { id: "financeiro" as Tab, label: "Financeiro", icon: DollarSign },
  { id: "dashboard" as Tab, label: "Dashboard", icon: BarChart3 },
  { id: "lista-compras" as Tab, label: "Lista de Compras", icon: ShoppingCart },
  { id: "admin" as Tab, label: "Administração", icon: Settings },
]

export function AppSidebar({
  activeTab,
  onTabChange,
  onLogout,
  user,
  userRole,
  userPermissoes,
  isOpen,
  onToggle,
}: AppSidebarProps) {
  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.id === "admin") {
      return userRole === "admin"
    }
    return userPermissoes && userPermissoes.includes(item.id)
  })
  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 border-r border-border bg-sidebar transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-sidebar-border p-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.jpg"
                alt="Dom Costelo Logo"
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <h1 className="font-bold text-sidebar-foreground">
                  Dom Costelo
                </h1>
                <p className="text-xs text-muted-foreground">PRO</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {filteredMenuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onTabChange(item.id)
                      if (window.innerWidth < 768) onToggle()
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      activeTab === item.id
                        ? "bg-sidebar-accent text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {user.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-sidebar-foreground capitalize">
                  {user}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
