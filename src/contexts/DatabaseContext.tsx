
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { localDatabase } from '@/lib/local-database'
import { RemoteDatabase, RemoteConfig } from '@/lib/remote-database'
import { useAuth } from './AuthContext'

type DatabaseMode = 'local' | 'remote'

interface DatabaseContextType {
  mode: DatabaseMode
  setMode: (mode: DatabaseMode) => void
  remoteConfig: { host: string; port: string }
  setRemoteConfig: (host: string, port: string) => void
  isConnected: boolean
  connectionError: string | null
  testConnection: () => Promise<boolean>
  
  // Database operations
  getWorkers: () => Promise<any[]>
  addWorker: (worker: any) => Promise<any>
  updateWorker: (id: number, worker: any) => Promise<any>
  deleteWorker: (id: number) => Promise<void>
  
  getSites: () => Promise<any[]>
  addSite: (site: any) => Promise<any>
  updateSite: (id: number, site: any) => Promise<any>
  deleteSite: (id: number) => Promise<void>
  
  getTimeEntries: () => Promise<any[]>
  addTimeEntry: (entry: any) => Promise<any>
  updateTimeEntry: (id: number, entry: any) => Promise<any>
  deleteTimeEntry: (id: number) => Promise<void>
  
  getPayments: () => Promise<any[]>
  addPayment: (payment: any) => Promise<any>
  updatePayment: (id: number, payment: any) => Promise<any>
  deletePayment: (id: number) => Promise<void>
  
  getDashboardStats: () => Promise<any>
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export const useDatabase = () => {
  const context = useContext(DatabaseContext)
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context
}

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
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
  const [remoteDatabase, setRemoteDatabase] = useState<RemoteDatabase | null>(null)

  // Aggiorna modalità database
  const handleSetMode = (newMode: DatabaseMode) => {
    console.log(`🔄 Switching database mode: ${mode} → ${newMode}`)
    setMode(newMode)
    localStorage.setItem('edilcheck_database_mode', newMode)
  }

  // Aggiorna configurazione remota
  const setRemoteConfig = (host: string, port: string) => {
    console.log(`🔧 Updating remote config: ${host}:${port}`)
    const newConfig = { host, port }
    setRemoteConfigState(newConfig)
    localStorage.setItem('edilcheck_remote_config', JSON.stringify(newConfig))
    
    // Ricrea il client remoto
    if (mode === 'remote') {
      const newRemoteDb = new RemoteDatabase(newConfig)
      setRemoteDatabase(newRemoteDb)
      testConnection()
    }
  }

  // Test connessione
  const testConnection = async (): Promise<boolean> => {
    if (mode === 'local') {
      setIsConnected(true)
      setConnectionError(null)
      return true
    }

    if (!remoteDatabase) {
      setIsConnected(false)
      setConnectionError('Database remoto non configurato')
      return false
    }

    try {
      const connected = await remoteDatabase.testConnection()
      setIsConnected(connected)
      if (connected) {
        setConnectionError(null)
        console.log('✅ Remote database connected')
      } else {
        setConnectionError('Impossibile connettersi al server remoto')
        console.log('❌ Remote database connection failed')
      }
      return connected
    } catch (error: any) {
      setIsConnected(false)
      setConnectionError(error.message)
      console.error('❌ Remote database error:', error)
      return false
    }
  }

  // Inizializza database all'avvio
  useEffect(() => {
    const initDatabase = async () => {
      if (mode === 'local') {
        setIsConnected(true)
        setConnectionError(null)
        console.log('✅ Local database ready')
      } else {
        const newRemoteDb = new RemoteDatabase(remoteConfig)
        setRemoteDatabase(newRemoteDb)
        await testConnection()
      }
    }

    initDatabase()
  }, [mode])

  // Aggiorna credenziali remote quando l'utente cambia
  useEffect(() => {
    if (mode === 'remote' && remoteDatabase && user) {
      const credentials = localStorage.getItem('edilcheck_credentials')
      if (credentials) {
        try {
          const { email, password } = JSON.parse(credentials)
          remoteDatabase.setCredentials(email, password)
        } catch (error) {
          console.error('Error setting remote credentials:', error)
        }
      }
    }
  }, [mode, remoteDatabase, user])

  // Operazioni database
  const getWorkers = async () => {
    if (mode === 'local') {
      return localDatabase.getWorkers(user?.email || 'anonymous')
    } else if (remoteDatabase) {
      return await remoteDatabase.getWorkers()
    }
    return []
  }

  const addWorker = async (worker: any) => {
    if (mode === 'local') {
      return localDatabase.addWorker(user?.email || 'anonymous', worker)
    } else if (remoteDatabase) {
      return await remoteDatabase.addWorker(worker)
    }
    throw new Error('Database not available')
  }

  const updateWorker = async (id: number, worker: any) => {
    if (mode === 'local') {
      return localDatabase.updateWorker(user?.email || 'anonymous', id, worker)
    } else if (remoteDatabase) {
      return await remoteDatabase.updateWorker(id, worker)
    }
    throw new Error('Database not available')
  }

  const deleteWorker = async (id: number) => {
    if (mode === 'local') {
      localDatabase.deleteWorker(user?.email || 'anonymous', id)
    } else if (remoteDatabase) {
      await remoteDatabase.deleteWorker(id)
    }
  }

  const getSites = async () => {
    if (mode === 'local') {
      return localDatabase.getSites(user?.email || 'anonymous')
    } else if (remoteDatabase) {
      return await remoteDatabase.getSites()
    }
    return []
  }

  const addSite = async (site: any) => {
    if (mode === 'local') {
      return localDatabase.addSite(user?.email || 'anonymous', site)
    } else if (remoteDatabase) {
      return await remoteDatabase.addSite(site)
    }
    throw new Error('Database not available')
  }

  const updateSite = async (id: number, site: any) => {
    if (mode === 'local') {
      return localDatabase.updateSite(user?.email || 'anonymous', id, site)
    } else if (remoteDatabase) {
      return await remoteDatabase.updateSite(id, site)
    }
    throw new Error('Database not available')
  }

  const deleteSite = async (id: number) => {
    if (mode === 'local') {
      localDatabase.deleteSite(user?.email || 'anonymous', id)
    } else if (remoteDatabase) {
      await remoteDatabase.deleteSite(id)
    }
  }

  const getTimeEntries = async () => {
    if (mode === 'local') {
      return localDatabase.getTimeEntries(user?.email || 'anonymous')
    } else if (remoteDatabase) {
      return await remoteDatabase.getTimeEntries()
    }
    return []
  }

  const addTimeEntry = async (entry: any) => {
    if (mode === 'local') {
      return localDatabase.addTimeEntry(user?.email || 'anonymous', entry)
    } else if (remoteDatabase) {
      return await remoteDatabase.addTimeEntry(entry)
    }
    throw new Error('Database not available')
  }

  const updateTimeEntry = async (id: number, entry: any) => {
    if (mode === 'local') {
      return localDatabase.updateTimeEntry(user?.email || 'anonymous', id, entry)
    } else if (remoteDatabase) {
      return await remoteDatabase.updateTimeEntry(id, entry)
    }
    throw new Error('Database not available')
  }

  const deleteTimeEntry = async (id: number) => {
    if (mode === 'local') {
      localDatabase.deleteTimeEntry(user?.email || 'anonymous', id)
    } else if (remoteDatabase) {
      await remoteDatabase.deleteTimeEntry(id)
    }
  }

  const getPayments = async () => {
    if (mode === 'local') {
      return localDatabase.getPayments(user?.email || 'anonymous')
    } else if (remoteDatabase) {
      return await remoteDatabase.getPayments()
    }
    return []
  }

  const addPayment = async (payment: any) => {
    if (mode === 'local') {
      return localDatabase.addPayment(user?.email || 'anonymous', payment)
    } else if (remoteDatabase) {
      return await remoteDatabase.addPayment(payment)
    }
    throw new Error('Database not available')
  }

  const updatePayment = async (id: number, payment: any) => {
    if (mode === 'local') {
      return localDatabase.updatePayment(user?.email || 'anonymous', id, payment)
    } else if (remoteDatabase) {
      return await remoteDatabase.updatePayment(id, payment)
    }
    throw new Error('Database not available')
  }

  const deletePayment = async (id: number) => {
    if (mode === 'local') {
      localDatabase.deletePayment(user?.email || 'anonymous', id)
    } else if (remoteDatabase) {
      await remoteDatabase.deletePayment(id)
    }
  }

  const getDashboardStats = async () => {
    if (mode === 'local') {
      return localDatabase.getDashboardStats(user?.email || 'anonymous')
    } else if (remoteDatabase) {
      return await remoteDatabase.getDashboardStats()
    }
    return { activeWorkers: 0, activeSites: 0, pendingPayments: 0, todayHours: 0 }
  }

  return (
    <DatabaseContext.Provider value={{
      mode,
      setMode: handleSetMode,
      remoteConfig,
      setRemoteConfig,
      isConnected,
      connectionError,
      testConnection,
      getWorkers,
      addWorker,
      updateWorker,
      deleteWorker,
      getSites,
      addSite,
      updateSite,
      deleteSite,
      getTimeEntries,
      addTimeEntry,
      updateTimeEntry,
      deleteTimeEntry,
      getPayments,
      addPayment,
      updatePayment,
      deletePayment,
      getDashboardStats
    }}>
      {children}
    </DatabaseContext.Provider>
  )
}
