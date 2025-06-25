
import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { DashboardOverview } from "@/components/DashboardOverview"
import { WorkersManagement } from "@/components/WorkersManagement"
import { TimeTracking } from "@/components/TimeTracking"
import { PaymentsManagement } from "@/components/PaymentsManagement"

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard")

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview onSectionChange={setActiveSection} />
      case "workers":
        return <WorkersManagement />
      case "timetracking":
        return <TimeTracking />
      case "payments":
        return <PaymentsManagement />
      case "permissions":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Gestione Permessi</h2>
            <p className="text-muted-foreground">Sezione in sviluppo...</p>
          </div>
        )
      case "sites":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Gestione Cantieri</h2>
            <p className="text-muted-foreground">Sezione in sviluppo...</p>
          </div>
        )
      case "archive":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Archivio</h2>
            <p className="text-muted-foreground">Sezione in sviluppo...</p>
          </div>
        )
      case "settings":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Impostazioni</h2>
            <p className="text-muted-foreground">Sezione in sviluppo...</p>
          </div>
        )
      default:
        return <DashboardOverview onSectionChange={setActiveSection} />
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="mb-6">
            <SidebarTrigger className="mb-4" />
          </div>
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default Index
