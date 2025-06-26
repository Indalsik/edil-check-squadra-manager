import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { localDatabase } from '@/lib/local-database'
import { RemoteDatabase, RemoteConfig } from '@/lib/remote-database'
import { databaseSync, SyncStatus, SyncResult } from '@/lib/database-sync'
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
  
  // Sync functionality
  syncStatus: SyncStatus
  syncDatabase: () => Promise<SyncResult>
  
  // Database operations (sempre locali ora)
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(databaseSync.getStatus())

  // Aggiorna modalità database
  const handleSetMode = (newMode: DatabaseMode) => {
    console.log(`🔄 Switching database mode: ${mode} → ${newMode}`)
    setMode(newMode)
    localStorage.setItem('edilcheck_database_mode', newMode)
    setIsInitialized(false)
  }

  // Aggiorna configurazione remota
  const setRemoteConfig = (host: string, port: string) => {
    console.log(`🔧 Updating remote config: ${host}:${port}`)
    const newConfig = { host, port }
    setRemoteConfigState(newConfig)
    localStorage.setItem('edilcheck_remote_config', JSON.stringify(newConfig))
    
    // Ricrea il client remoto
    const newRemoteDb = new RemoteDatabase(newConfig)
    setRemoteDatabase(newRemoteDb)
    databaseSync.setRemoteDatabase(newRemoteDb)
    setIsInitialized(false)
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
      const connected = await databaseSync.testConnection()
      setIsConnected(connected)
      setConnectionError(connected ? null : 'Server remoto non raggiungibile')
      return connected
    } catch (error: any) {
      setIsConnected(false)
      setConnectionError(`Errore connessione: ${error.message}`)
      return false
    }
  }

  // Sincronizzazione manuale
  const syncDatabase = async (): Promise<SyncResult> => {
    if (!user?.email) {
      throw new Error('Utente non autenticato')
    }
    
    return await databaseSync.syncAll(user.email)
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
        databaseSync.setRemoteDatabase(newRemoteDb)
        
        // Test connessione senza bloccare l'app
        try {
          const connected = await newRemoteDb.testConnection()
          setIsConnected(connected)
          setConnectionError(connected ? null : 'Server remoto non disponibile')
          
          // Se connesso e utente autenticato, fai auto-sync
          if (connected && user?.email) {
            const credentials = localStorage.getItem('edilcheck_credentials')
            if (credentials) {
              const { email, password } = JSON.parse(credentials)
              newRemoteDb.setCredentials(email, password)
              
              // Auto-sync in background
              setTimeout(() => {
                databaseSync.autoSync(user.email)
              }, 1000)
            }
          }
        } catch (error: any) {
          setIsConnected(false)
          setConnectionError(`Server remoto non disponibile`)
          console.log('⚠️ Remote database not available, using local only')
        }
        
        setIsInitialized(true)
      }
    }

    if (!isInitialized) {
      initDatabase()
    }
  }, [mode, isInitialized, remoteConfig, user])

  // Listen to sync status changes
  useEffect(() => {
    const unsubscribe = databaseSync.onStatusChange(setSyncStatus)
    return unsubscribe
  }, [])

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

  // Tutte le operazioni database sono ora sempre locali
  const userEmail = user?.email || 'anonymous'

  const getWorkers = async () => {
    return localDatabase.getWorkers(userEmail)
  }

  const addWorker = async (worker: any) => {
    return localDatabase.addWorker(userEmail, worker)
  }

  const updateWorker = async (id: number, worker: any) => {
    return localDatabase.updateWorker(userEmail, id, worker)
  }

  const deleteWorker = async (id: number) => {
    localDatabase.deleteWorker(userEmail, id)
  }

  const getSites = async () => {
    return localDatabase.getSites(userEmail)
  }

  const addSite = async (site: any) => {
    return localDatabase.addSite(userEmail, site)
  }

  const updateSite = async (id: number, site: any) => {
    return localDatabase.updateSite(userEmail, id, site)
  }

  const deleteSite = async (id: number) => {
    localDatabase.deleteSite(userEmail, id)
  }

  const getTimeEntries = async () => {
    return localDatabase.getTimeEntries(userEmail)
  }

  const addTimeEntry = async (entry: any) => {
    return localDatabase.addTimeEntry(userEmail, entry)
  }

  const updateTimeEntry = async (id: number, entry: any) => {
    return localDatabase.updateTimeEntry(userEmail, id, entry)
  }

  const deleteTimeEntry = async (id: number) => {
    localDatabase.deleteTimeEntry(userEmail, id)
  }

  const getPayments = async () => {
    return localDatabase.getPayments(userEmail)
  }

  const addPayment = async (payment: any) => {
    return localDatabase.addPayment(userEmail, payment)
  }

  const updatePayment = async (id: number, payment: any) => {
    return localDatabase.updatePayment(userEmail, id, payment)
  }

  const deletePayment = async (id: number) => {
    localDatabase.deletePayment(userEmail, id)
  }

  const getDashboardStats = async () => {
    return localDatabase.getDashboardStats(userEmail)
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
      syncStatus,
      syncDatabase,
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