
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
        return <DashboardOverview />
      case "workers":
        return <WorkersManagement />
      case "timetracking":
        return <TimeTracking />
      case "payments":
        return <PaymentsManagement />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="mb-6">
            <SidebarTrigger className="mb-4" />
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveSection("dashboard")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === "dashboard"
                    ? "bg-edil-blue text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveSection("workers")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === "workers"
                    ? "bg-edil-blue text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Operai
              </button>
              <button
                onClick={() => setActiveSection("timetracking")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === "timetracking"
                    ? "bg-edil-blue text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Ore di Lavoro
              </button>
              <button
                onClick={() => setActiveSection("payments")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === "payments"
                    ? "bg-edil-blue text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Pagamenti
              </button>
            </div>
          </div>
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default Index
