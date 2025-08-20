"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Scale, LayoutDashboard, LogIn, Weight, PackageCheck, Receipt, DoorOpen, Wallet, Menu, X } from "lucide-react"
import { DashboardView } from "@/components/dashboard-view"
import { GateEntryView } from "@/components/gate-entry-view"
import { FirstWeightView } from "@/components/first-weight-view"
import { LoadVehicleView } from "@/components/load-vehicle-view"
import { SecondWeightView } from "@/components/second-weight-view"
import { GenerateInvoiceView } from "@/components/generate-invoice-view"
import { GateOutView } from "@/components/gate-out-view"
import { PaymentView } from "@/components/payment-view"
import { LoginForm } from "@/components/login-form"

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "gate-entry", label: "Gate Entry", icon: LogIn },
  { id: "first-weight", label: "First Weight", icon: Weight },
  { id: "load-vehicle", label: "Load Vehicle", icon: PackageCheck },
  { id: "second-weight", label: "Second Weight", icon: Scale },
  { id: "generate-invoice", label: "Generate Invoice", icon: Receipt },
  { id: "gate-out", label: "Gate Out Entry", icon: DoorOpen },
  { id: "payment", label: "Payment", icon: Wallet },
]

export default function O2DSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userAccess, setUserAccess] = useState<string[]>([])
  const [activeView, setActiveView] = useState("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const savedAuth = localStorage.getItem("o2d_auth")
    const savedAccess = localStorage.getItem("o2d_access")
    const savedView = localStorage.getItem("o2d_active_view")

    if (savedAuth === "true" && savedAccess) {
      setIsAuthenticated(true)
      setUserAccess(JSON.parse(savedAccess))
      if (savedView) {
        setActiveView(savedView)
      }
    }
  }, [])

  const handleLogin = (accessPermissions: string[]) => {
    setIsAuthenticated(true)
    setUserAccess(accessPermissions)

    localStorage.setItem("o2d_auth", "true")
    localStorage.setItem("o2d_access", JSON.stringify(accessPermissions))

    if (accessPermissions.length > 0) {
      const firstAccessibleView = sidebarItems.find((item) => accessPermissions.includes(item.id))?.id || "dashboard"
      setActiveView(firstAccessibleView)
      localStorage.setItem("o2d_active_view", firstAccessibleView)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserAccess([])
    setActiveView("dashboard")
    localStorage.removeItem("o2d_auth")
    localStorage.removeItem("o2d_access")
    localStorage.removeItem("o2d_active_view")
  }

  const handleViewChange = (viewId: string) => {
    setActiveView(viewId)
    localStorage.setItem("o2d_active_view", viewId)
    setIsMobileMenuOpen(false)
  }

  const accessibleItems = sidebarItems.filter(
    (item) => userAccess.includes(item.id) || item.id === "dashboard", // Always allow dashboard
  )

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  const renderActiveView = () => {
    if (!userAccess.includes(activeView) && activeView !== "dashboard") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    switch (activeView) {
      case "dashboard":
        return <DashboardView />
      case "gate-entry":
        return <GateEntryView />
      case "first-weight":
        return <FirstWeightView />
      case "load-vehicle":
        return <LoadVehicleView />
      case "second-weight":
        return <SecondWeightView />
      case "generate-invoice":
        return <GenerateInvoiceView />
      case "gate-out":
        return <GateOutView />
      case "payment":
        return <PaymentView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              {/* <h1 className="text-lg lg:text-xl font-bold text-sidebar-primary-foreground">O2D System</h1> */}
              <h1 className="text-lg lg:text-xl font-bold text-black">
  O2D System
</h1>

              <p className="text-xs lg:text-sm text-sidebar-foreground/70 mt-1">Order to Dispatch</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="px-3 lg:px-4 space-y-1 lg:space-y-2">
          {accessibleItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start gap-2 lg:gap-3 text-sm lg:text-base py-2 lg:py-2.5 ${
                  activeView === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                onClick={() => handleViewChange(item.id)}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-sidebar-foreground/50 mb-2 px-2">Access: {userAccess.join(", ")}</div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-sm bg-transparent"
            onClick={handleLogout}
          >
            <LogIn className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold text-foreground capitalize">
              {sidebarItems.find((item) => item.id === activeView)?.label || "Dashboard"}
            </h2>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">{renderActiveView()}</div>
        </div>

        <footer className="bg-background border-t border-border p-3 lg:p-4">
          <div className="text-center">
            <p className="text-xs lg:text-sm text-muted-foreground">
              Powered by{" "}
              <a
                href="https://botivate.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              >
                Botivate
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
