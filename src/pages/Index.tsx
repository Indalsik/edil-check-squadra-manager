import { useState, useEffect } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/AppSidebar"
import { DashboardOverview } from "@/components/DashboardOverview"
import { WorkersManagement } from "@/components/WorkersManagement"
import { TimeTracking } from "@/components/TimeTracking"
import { PaymentsManagement } from "@/components/PaymentsManagement"
import { SitesManagement } from "@/components/SitesManagement"
import { ArchiveManagement } from "@/components/ArchiveManagement"
import { DatabaseSyncDialog } from "@/components/DatabaseSyncDialog"
import { useAuth } from "@/contexts/AuthContext"
import { useDatabase } from "@/contexts/DatabaseContext"
import { useTheme } from "@/contexts/ThemeContext"
import { LogOut, Moon, Sun, User, HardDrive, AlertCircle, Upload, Download } from "lucide-react"

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [isInitialized, setIsInitialized] = useState(false)
  const [showDatabaseDialog, setShowDatabaseDialog] = useState(false)
  const { user, logout } = useAuth()
  const { mode, isRemoteAvailable, connectionError, syncStatus, backupToRemote } = useDatabase()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const initDatabase = async () => {
      if (user) {
        try {
          setIsInitialized(true)
        } catch (error) {
          console.error('Failed to initialize database:', error)
          setIsInitialized(true)
        }
      }
    }

    initDatabase()
  }, [user])

  const handleQuickBackup = async () => {
    if (mode === 'local-with-backup' && isRemoteAvailable) {
      try {
        await backupToRemote()
      } catch (error) {
        console.error('Quick backup failed:', error)
      }
    }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-edil-blue mx-auto"></div>
          <p className="mt-4 text-lg">Inizializzazione database locale...</p>
        </div>
      </div>
    )
  }

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

  const getBackupStatusColor = () => {
    if (mode === 'local-only') return 'text-gray-600'
    switch (syncStatus.status) {
      case 'success': return 'text-green-600'
      case 'backing-up': return 'text-blue-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getBackupStatusIcon = () => {
    if (mode === 'local-only') return <HardDrive className="h-3 w-3" />
    switch (syncStatus.status) {
      case 'backing-up': return <Upload className="h-3 w-3 animate-pulse" />
      case 'error': return <AlertCircle className="h-3 w-3" />
      default: return <Upload className="h-3 w-3" />
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
              {/* Database Status */}
              <Button
                variant="outline"
                onClick={() => setShowDatabaseDialog(true)}
                className="bg-white dark:bg-gray-800"
              >
                <HardDrive className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {mode === 'local-only' ? 'Solo Locale' : 'Con Backup'}
                </span>
                <div className={`w-2 h-2 rounded-full ml-2 ${mode === 'local-only' ? 'bg-blue-500' : isRemoteAvailable ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </Button>

              {/* Quick Backup Button */}
              {mode === 'local-with-backup' && isRemoteAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickBackup}
                  disabled={syncStatus.status === 'backing-up'}
                  className="bg-white dark:bg-gray-800"
                >
                  <div className={`flex items-center gap-1 ${getBackupStatusColor()}`}>
                    {getBackupStatusIcon()}
                    <span className="text-xs">Backup</span>
                  </div>
                </Button>
              )}

              {/* Connection Warning */}
              {connectionError && mode === 'local-with-backup' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>Backup offline</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <User className="h-4 w-4 text-edil-blue" />
                <span className="text-sm font-medium">{user?.email}</span>
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

      <DatabaseSyncDialog 
        open={showDatabaseDialog} 
        onOpenChange={setShowDatabaseDialog} 
      />
    </SidebarProvider>
  )
}

export default Index