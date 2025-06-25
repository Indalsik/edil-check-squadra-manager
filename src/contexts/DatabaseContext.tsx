import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { database as localDatabase } from '@/lib/database'
import { authAPI, workersAPI, sitesAPI, timeEntriesAPI, paymentsAPI, dashboardAPI } from '@/lib/api'

type DatabaseMode = 'local' | 'remote'

interface DatabaseContextType {
  mode: DatabaseMode
  setMode: (mode: DatabaseMode) => void
  setRemoteConfig: (host: string, port: string) => void
  isConnected: boolean
  connectionError: string | null
  database: any
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export const useDatabase = () => {
  const context = useContext(DatabaseContext)
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context
}

// Remote database adapter
const createRemoteDatabase = (host: string, port: string) => ({
  async init() {
    try {
      const response = await fetch(`http://${host}:${port}/health`)
      if (!response.ok) throw new Error('Server not available')
      return true
    } catch (error) {
      throw new Error(`Cannot connect to remote server at ${host}:${port}`)
    }
  },

  // Workers
  getWorkers: () => workersAPI.getAll(),
  addWorker: (worker: any) => workersAPI.create(worker),
  updateWorker: (id: number, worker: any) => workersAPI.update(id, worker),
  deleteWorker: (id: number) => workersAPI.delete(id),

  // Sites
  getSites: () => sitesAPI.getAll(),
  addSite: (site: any) => sitesAPI.create(site),
  updateSite: (id: number, site: any) => sitesAPI.update(id, site),
  deleteSite: (id: number) => sitesAPI.delete(id),
  getSiteWorkers: (siteId: number) => sitesAPI.getWorkers(siteId),

  // Time Entries
  getTimeEntries: () => timeEntriesAPI.getAll(),
  addTimeEntry: (entry: any) => timeEntriesAPI.create(entry),
  updateTimeEntry: (id: number, entry: any) => timeEntriesAPI.update(id, entry),
  deleteTimeEntry: (id: number) => timeEntriesAPI.delete(id),

  // Payments
  getPayments: () => paymentsAPI.getAll(),
  addPayment: (payment: any) => paymentsAPI.create(payment),
  updatePayment: (id: number, payment: any) => paymentsAPI.update(id, payment),
  deletePayment: (id: number) => paymentsAPI.delete(id),

  // Dashboard
  getDashboardStats: () => dashboardAPI.getStats(),

  // Utility methods
  assignWorkerToSite: (siteId: number, workerId: number) => {
    console.log('Assign worker to site:', { siteId, workerId })
  },
  removeWorkerFromSite: (siteId: number, workerId: number) => {
    console.log('Remove worker from site:', { siteId, workerId })
  }
})

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<DatabaseMode>(() => {
    const saved = localStorage.getItem('edilcheck_database_mode')
    return (saved as DatabaseMode) || 'local'
  })
  const [remoteConfig, setRemoteConfigState] = useState(() => {
    const saved = localStorage.getItem('edilcheck_remote_config')
    return saved ? JSON.parse(saved) : { host: 'localhost', port: '3002' }
  })
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [database, setDatabase] = useState<any>(localDatabase)

  useEffect(() => {
    localStorage.setItem('edilcheck_database_mode', mode)
    localStorage.setItem('edilcheck_remote_config', JSON.stringify(remoteConfig))
    initializeDatabase()
  }, [mode, remoteConfig])

  const initializeDatabase = async () => {
    setConnectionError(null)
    setIsConnected(false)

    try {
      if (mode === 'local') {
        await localDatabase.init()
        setDatabase(localDatabase)
        setIsConnected(true)
      } else {
        const remoteDb = createRemoteDatabase(remoteConfig.host, remoteConfig.port)
        await remoteDb.init()
        setDatabase(remoteDb)
        setIsConnected(true)
      }
    } catch (error: any) {
      setConnectionError(error.message)
      // Fallback to local database if remote fails
      if (mode === 'remote') {
        console.warn('Remote database failed, falling back to local:', error.message)
        try {
          await localDatabase.init()
          setDatabase(localDatabase)
          setIsConnected(true)
          setConnectionError(`Remote failed: ${error.message}. Using local database.`)
        } catch (localError: any) {
          setConnectionError(`Both databases failed: ${error.message}`)
        }
      }
    }
  }

  const handleSetMode = (newMode: DatabaseMode) => {
    setMode(newMode)
  }

  const setRemoteConfig = (host: string, port: string) => {
    setRemoteConfigState({ host, port })
  }

  return (
    <DatabaseContext.Provider value={{
      mode,
      setMode: handleSetMode,
      setRemoteConfig,
      isConnected,
      connectionError,
      database
    }}>
      {children}
    </DatabaseContext.Provider>
  )
}