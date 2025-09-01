"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Scale,
  LayoutDashboard,
  LogIn,
  Weight,
  PackageCheck,
  Receipt,
  DoorOpen,
  Wallet,
  Menu,
  X,
  ShoppingCart,
  MessageSquare,
  Star,
} from "lucide-react"
import { DashboardView } from "@/components/dashboard-view"
import { GateEntryView } from "@/components/gate-entry-view"
import { FirstWeightView } from "@/components/first-weight-view"
import { LoadVehicleView } from "@/components/load-vehicle-view"
import { SecondWeightView } from "@/components/second-weight-view"
import { GenerateInvoiceView } from "@/components/generate-invoice-view"
import { GateOutView } from "@/components/gate-out-view"
import { PaymentView } from "@/components/payment-view"
import { OrdersView } from "@/components/order-view"
import { ComplaintDetailsView } from "@/components/complaint-details-view"
import { PartyFeedbackView } from "@/components/party-feedback-view"
import { LoginForm } from "@/components/login-form"
import Image from "next/image"
import logo from "@/public/Screenshot_2025-08-13_at_1.45.14_PM-removebg-preview.png"

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "gate-entry", label: "Gate Entry", icon: LogIn },
  { id: "first-weight", label: "First Weight", icon: Weight },
  { id: "load-vehicle", label: "Load Vehicle", icon: PackageCheck },
  { id: "second-weight", label: "Second Weight", icon: Scale },
  { id: "generate-invoice", label: "Generate Invoice", icon: Receipt },
  { id: "gate-out", label: "Gate Out Entry", icon: DoorOpen },
  { id: "payment", label: "Payment", icon: Wallet },
  { id: "complaint-details", label: "Complaint Details", icon: MessageSquare },
  { id: "party-feedback", label: "Party Feedback", icon: Star },
]

export default function O2DSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userAccess, setUserAccess] = useState<string[]>([])
  // ✅ Fixed: Initialize activeView as null, will be set based on user access
  const [activeView, setActiveView] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const savedAuth = localStorage.getItem("o2d_auth")
    const savedAccess = localStorage.getItem("o2d_access")
    const savedView = localStorage.getItem("o2d_active_view")

    if (savedAuth === "true" && savedAccess) {
      setIsAuthenticated(true)
      const accessPermissions = JSON.parse(savedAccess)
      setUserAccess(accessPermissions)
      
      // ✅ Fixed: Only set view to accessible pages, no dashboard fallback
      if (savedView && accessPermissions.includes(savedView)) {
        setActiveView(savedView)
      } else {
        // Set to first accessible view from their permissions
        const firstAccessibleView = sidebarItems.find((item) => accessPermissions.includes(item.id))?.id
        if (firstAccessibleView) {
          setActiveView(firstAccessibleView)
          localStorage.setItem("o2d_active_view", firstAccessibleView)
        }
      }
    }
  }, [])

  const handleLogin = (accessPermissions: string[]) => {
    setIsAuthenticated(true)
    setUserAccess(accessPermissions)

    localStorage.setItem("o2d_auth", "true")
    localStorage.setItem("o2d_access", JSON.stringify(accessPermissions))

    // ✅ Fixed: Set to first accessible view from their permissions
    const firstAccessibleView = sidebarItems.find((item) => accessPermissions.includes(item.id))?.id
    if (firstAccessibleView) {
      setActiveView(firstAccessibleView)
      localStorage.setItem("o2d_active_view", firstAccessibleView)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserAccess([])
    setActiveView(null) // ✅ Fixed: Reset to null instead of dashboard
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
    (item) => userAccess.includes(item.id)
  )

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  const renderActiveView = () => {
    // ✅ Fixed: Handle loading state when activeView is null
    if (!activeView) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )
    }

    // ✅ Fixed: Check if user has access to the current view
    if (!userAccess.includes(activeView)) {
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
      case "orders":
        return <OrdersView />
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
      case "complaint-details":
        return <ComplaintDetailsView />
      case "party-feedback":
        return <PartyFeedbackView />
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        )
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
            <div className="flex items-center gap-2">
              <Image
                src={logo}
                alt="O2D Logo"
                width={72}
                height={72}
                className="rounded-md"
              />
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-black">O2D System</h1>
                <p className="text-xs lg:text-sm text-sidebar-foreground/70 mt-1">Order to Dispatch</p>
              </div>
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
              {sidebarItems.find((item) => item.id === activeView)?.label || "Loading..."}
            </h2>
            <div className="w-9" />
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
