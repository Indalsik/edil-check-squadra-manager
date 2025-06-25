
import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/AppSidebar"
import { DashboardOverview } from "@/components/DashboardOverview"
import { WorkersManagement } from "@/components/WorkersManagement"
import { TimeTracking } from "@/components/TimeTracking"
import { PaymentsManagement } from "@/components/PaymentsManagement"
import { SitesManagement } from "@/components/SitesManagement"
import { ArchiveManagement } from "@/components/ArchiveManagement"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { LogOut, Moon, Sun, User } from "lucide-react"

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard")
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

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
        return <SitesManagement />
      case "archive":
        return <ArchiveManagement />
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
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <SidebarTrigger className="mb-4" />
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <User className="h-4 w-4 text-edil-blue" />
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="bg-white dark:bg-gray-800"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                onClick={logout}
                className="bg-white dark:bg-gray-800 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Esci
              </Button>
            </div>
          </div>
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default Index
