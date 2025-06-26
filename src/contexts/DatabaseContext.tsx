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
      console.log('✅ Remote database connected')
      return true
    } catch (error) {
      throw new Error(`Cannot connect to remote server at ${host}:${port}`)
    }
  },

  // Workers
  getWorkers: async () => {
    try {
      return await workersAPI.getAll()
    } catch (error: any) {
      console.error('Failed to get workers:', error.message)
      throw error
    }
  },
  addWorker: async (worker: any) => {
    try {
      return await workersAPI.create(worker)
    } catch (error: any) {
      console.error('Failed to add worker:', error.message)
      throw error
    }
  },
  updateWorker: async (id: number, worker: any) => {
    try {
      return await workersAPI.update(id, worker)
    } catch (error: any) {
      console.error('Failed to update worker:', error.message)
      throw error
    }
  },
  deleteWorker: async (id: number) => {
    try {
      return await workersAPI.delete(id)
    } catch (error: any) {
      console.error('Failed to delete worker:', error.message)
      throw error
    }
  },

  // Sites
  getSites: async () => {
    try {
      return await sitesAPI.getAll()
    } catch (error: any) {
      console.error('Failed to get sites:', error.message)
      throw error
    }
  },
  addSite: async (site: any) => {
    try {
      return await sitesAPI.create(site)
    } catch (error: any) {
      console.error('Failed to add site:', error.message)
      throw error
    }
  },
  updateSite: async (id: number, site: any) => {
    try {
      return await sitesAPI.update(id, site)
    } catch (error: any) {
      console.error('Failed to update site:', error.message)
      throw error
    }
  },
  deleteSite: async (id: number) => {
    try {
      return await sitesAPI.delete(id)
    } catch (error: any) {
      console.error('Failed to delete site:', error.message)
      throw error
    }
  },
  getSiteWorkers: async (siteId: number) => {
    try {
      return await sitesAPI.getWorkers(siteId)
    } catch (error: any) {
      console.error('Failed to get site workers:', error.message)
      return []
    }
  },

  // Time Entries
  getTimeEntries: async () => {
    try {
      return await timeEntriesAPI.getAll()
    } catch (error: any) {
      console.error('Failed to get time entries:', error.message)
      throw error
    }
  },
  addTimeEntry: async (entry: any) => {
    try {
      return await timeEntriesAPI.create(entry)
    } catch (error: any) {
      console.error('Failed to add time entry:', error.message)
      throw error
    }
  },
  updateTimeEntry: async (id: number, entry: any) => {
    try {
      return await timeEntriesAPI.update(id, entry)
    } catch (error: any) {
      console.error('Failed to update time entry:', error.message)
      throw error
    }
  },
  deleteTimeEntry: async (id: number) => {
    try {
      return await timeEntriesAPI.delete(id)
    } catch (error: any) {
      console.error('Failed to delete time entry:', error.message)
      throw error
    }
  },

  // Payments
  getPayments: async () => {
    try {
      return await paymentsAPI.getAll()
    } catch (error: any) {
      console.error('Failed to get payments:', error.message)
      throw error
    }
  },
  addPayment: async (payment: any) => {
    try {
      return await paymentsAPI.create(payment)
    } catch (error: any) {
      console.error('Failed to add payment:', error.message)
      throw error
    }
  },
  updatePayment: async (id: number, payment: any) => {
    try {
      return await paymentsAPI.update(id, payment)
    } catch (error: any) {
      console.error('Failed to update payment:', error.message)
      throw error
    }
  },
  deletePayment: async (id: number) => {
    try {
      return await paymentsAPI.delete(id)
    } catch (error: any) {
      console.error('Failed to delete payment:', error.message)
      throw error
    }
  },

  // Dashboard
  getDashboardStats: async () => {
    try {
      return await dashboardAPI.getStats()
    } catch (error: any) {
      console.error('Failed to get dashboard stats:', error.message)
      return {
        activeWorkers: 0,
        activeSites: 0,
        pendingPayments: 0,
        todayHours: 0
      }
    }
  },

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

  // Separate initialization effect that only runs when mode changes or manual config application
  useEffect(() => {
    localStorage.setItem('edilcheck_database_mode', mode)
    initializeDatabase()
  }, [mode]) // Remove remoteConfig from dependencies

  const initializeDatabase = async () => {
    setConnectionError(null)
    setIsConnected(false)

    try {
      if (mode === 'local') {
        console.log('🔧 Initializing local database...')
        await localDatabase.init()
        setDatabase(localDatabase)
        setIsConnected(true)
        console.log('✅ Local database ready')
      } else {
        console.log(`🔧 Initializing remote database at ${remoteConfig.host}:${remoteConfig.port}...`)
        const remoteDb = createRemoteDatabase(remoteConfig.host, remoteConfig.port)
        await remoteDb.init()
        setDatabase(remoteDb)
        setIsConnected(true)
        console.log('✅ Remote database ready')
      }
    } catch (error: any) {
      console.error('❌ Database initialization failed:', error.message)
      setConnectionError(error.message)
      
      // Fallback to local database if remote fails
      if (mode === 'remote') {
        console.warn('🔄 Remote database failed, falling back to local...')
        try {
          await localDatabase.init()
          setDatabase(localDatabase)
          setIsConnected(true)
          setConnectionError(`Remote failed: ${error.message}. Using local database.`)
          console.log('✅ Fallback to local database successful')
        } catch (localError: any) {
          console.error('❌ Local fallback also failed:', localError.message)
          setConnectionError(`Both databases failed: ${error.message}`)
        }
      }
    }
  }

  const handleSetMode = (newMode: DatabaseMode) => {
    console.log(`🔄 Switching database mode: ${mode} → ${newMode}`)
    setMode(newMode)
  }

  const setRemoteConfig = (host: string, port: string) => {
    console.log(`🔧 Updating remote config: ${host}:${port}`)
    const newConfig = { host, port }
    setRemoteConfigState(newConfig)
    localStorage.setItem('edilcheck_remote_config', JSON.stringify(newConfig))
    
    // Only reinitialize if we're currently in remote mode
    if (mode === 'remote') {
      initializeDatabase()
    }
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
