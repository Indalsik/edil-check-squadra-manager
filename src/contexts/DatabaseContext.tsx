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
  // Safely get user with fallback
  let user = null
  try {
    const authContext = useAuth()
    user = authContext?.user
  } catch (error) {
    // Auth context not ready yet, use null user
    console.log('Auth context not ready, using anonymous user')
  }

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
  const [isInitialized, setIsInitialized] = useState(false)

  // Aggiorna modalità database
  const handleSetMode = (newMode: DatabaseMode) => {
    console.log(`🔄 Switching database mode: ${mode} → ${newMode}`)
    setMode(newMode)
    localStorage.setItem('edilcheck_database_mode', newMode)
    setIsInitialized(false) // Reset initialization when mode changes
  }

  // Aggiorna configurazione remota
  const setRemoteConfig = (host: string, port: string) => {
    console.log(`🔧 Updating remote config: ${host}:${port}`)
    const newConfig = { host, port }
    setRemoteConfigState(newConfig)
    localStorage.setItem('edilcheck_remote_config', JSON.stringify(newConfig))
    
    // Ricrea il client remoto se in modalità remota
    if (mode === 'remote') {
      const newRemoteDb = new RemoteDatabase(newConfig)
      setRemoteDatabase(newRemoteDb)
      setIsInitialized(false) // Reset to re-test connection
    }
  }

  // Test connessione
  const testConnection = async (): Promise<boolean> => {
    if (mode === 'local') {
      setIsConnected(true)
      setConnectionError(null)
      return true
    }

    try {
      const testDb = remoteDatabase || new RemoteDatabase(remoteConfig)
      const connected = await testDb.testConnection()
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
      console.log(`🚀 Initializing database in ${mode} mode`)
      
      if (mode === 'local') {
        setIsConnected(true)
        setConnectionError(null)
        setIsInitialized(true)
        console.log('✅ Local database ready')
      } else {
        // Remote mode
        const newRemoteDb = new RemoteDatabase(remoteConfig)
        setRemoteDatabase(newRemoteDb)
        
        // Test connection
        try {
          const connected = await newRemoteDb.testConnection()
          setIsConnected(connected)
          if (connected) {
            setConnectionError(null)
            console.log('✅ Remote database connected')
          } else {
            setConnectionError('Impossibile connettersi al server remoto. Usando database locale come fallback.')
            console.log('⚠️ Remote database connection failed, using local fallback')
          }
        } catch (error: any) {
          setIsConnected(false)
          setConnectionError(`Errore connessione remota: ${error.message}. Usando database locale come fallback.`)
          console.error('❌ Remote database error, using local fallback:', error)
        }
        
        setIsInitialized(true)
      }
    }

    if (!isInitialized) {
      initDatabase()
    }
  }, [mode, isInitialized, remoteConfig])

  // Aggiorna credenziali remote quando l'utente cambia
  useEffect(() => {
    if (mode === 'remote' && remoteDatabase && user) {
      const credentials = localStorage.getItem('edilcheck_credentials')
      if (credentials) {
        try {
          const { email, password } = JSON.parse(credentials)
          remoteDatabase.setCredentials(email, password)
          console.log('🔑 Remote credentials updated for user:', email)
        } catch (error) {
          console.error('Error setting remote credentials:', error)
        }
      }
    }
  }, [mode, remoteDatabase, user])

  // Operazioni database con fallback automatico
  const getWorkers = async () => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.getWorkers(userEmail)
    } else {
      try {
        return await remoteDatabase.getWorkers()
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.getWorkers(userEmail)
      }
    }
  }

  const addWorker = async (worker: any) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.addWorker(userEmail, worker)
    } else {
      try {
        return await remoteDatabase.addWorker(worker)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.addWorker(userEmail, worker)
      }
    }
  }

  const updateWorker = async (id: number, worker: any) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.updateWorker(userEmail, id, worker)
    } else {
      try {
        return await remoteDatabase.updateWorker(id, worker)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.updateWorker(userEmail, id, worker)
      }
    }
  }

  const deleteWorker = async (id: number) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      localDatabase.deleteWorker(userEmail, id)
    } else {
      try {
        await remoteDatabase.deleteWorker(id)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        localDatabase.deleteWorker(userEmail, id)
      }
    }
  }

  const getSites = async () => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.getSites(userEmail)
    } else {
      try {
        return await remoteDatabase.getSites()
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.getSites(userEmail)
      }
    }
  }

  const addSite = async (site: any) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.addSite(userEmail, site)
    } else {
      try {
        return await remoteDatabase.addSite(site)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.addSite(userEmail, site)
      }
    }
  }

  const updateSite = async (id: number, site: any) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.updateSite(userEmail, id, site)
    } else {
      try {
        return await remoteDatabase.updateSite(id, site)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.updateSite(userEmail, id, site)
      }
    }
  }

  const deleteSite = async (id: number) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      localDatabase.deleteSite(userEmail, id)
    } else {
      try {
        await remoteDatabase.deleteSite(id)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        localDatabase.deleteSite(userEmail, id)
      }
    }
  }

  const getTimeEntries = async () => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.getTimeEntries(userEmail)
    } else {
      try {
        return await remoteDatabase.getTimeEntries()
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.getTimeEntries(userEmail)
      }
    }
  }

  const addTimeEntry = async (entry: any) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.addTimeEntry(userEmail, entry)
    } else {
      try {
        return await remoteDatabase.addTimeEntry(entry)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.addTimeEntry(userEmail, entry)
      }
    }
  }

  const updateTimeEntry = async (id: number, entry: any) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.updateTimeEntry(userEmail, id, entry)
    } else {
      try {
        return await remoteDatabase.updateTimeEntry(id, entry)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.updateTimeEntry(userEmail, id, entry)
      }
    }
  }

  const deleteTimeEntry = async (id: number) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      localDatabase.deleteTimeEntry(userEmail, id)
    } else {
      try {
        await remoteDatabase.deleteTimeEntry(id)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        localDatabase.deleteTimeEntry(userEmail, id)
      }
    }
  }

  const getPayments = async () => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.getPayments(userEmail)
    } else {
      try {
        return await remoteDatabase.getPayments()
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.getPayments(userEmail)
      }
    }
  }

  const addPayment = async (payment: any) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.addPayment(userEmail, payment)
    } else {
      try {
        return await remoteDatabase.addPayment(payment)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.addPayment(userEmail, payment)
      }
    }
  }

  const updatePayment = async (id: number, payment: any) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.updatePayment(userEmail, id, payment)
    } else {
      try {
        return await remoteDatabase.updatePayment(id, payment)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.updatePayment(userEmail, id, payment)
      }
    }
  }

  const deletePayment = async (id: number) => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      localDatabase.deletePayment(userEmail, id)
    } else {
      try {
        await remoteDatabase.deletePayment(id)
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        localDatabase.deletePayment(userEmail, id)
      }
    }
  }

  const getDashboardStats = async () => {
    const userEmail = user?.email || 'anonymous'
    if (mode === 'local' || !isConnected || !remoteDatabase) {
      return localDatabase.getDashboardStats(userEmail)
    } else {
      try {
        return await remoteDatabase.getDashboardStats()
      } catch (error) {
        console.warn('Remote database failed, falling back to local:', error)
        return localDatabase.getDashboardStats(userEmail)
      }
    }
  }

  return (
    <DatabaseContext.Provider value={{
      mode,
      setMode: handleSetMode,
      remoteConfig,
      setRemoteConfig,
      isConnected: isInitialized && (mode === 'local' || isConnected),
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