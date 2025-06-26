import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { localDatabase } from '@/lib/local-database'
import { RemoteDatabase, RemoteConfig } from '@/lib/remote-database'
import { databaseSync, SyncStatus, SyncResult } from '@/lib/database-sync'
import { useAuth } from './AuthContext'

type DatabaseMode = 'local-only' | 'local-with-backup'

interface DatabaseContextType {
  mode: DatabaseMode
  setMode: (mode: DatabaseMode) => void
  remoteConfig: { host: string; port: string }
  setRemoteConfig: (host: string, port: string) => void
  isRemoteAvailable: boolean
  connectionError: string | null
  testRemoteConnection: () => Promise<boolean>
  isConnected: boolean
  
  // Sync functionality (solo per backup)
  syncStatus: SyncStatus
  backupToRemote: () => Promise<SyncResult>
  restoreFromRemote: () => Promise<SyncResult>
  
  // Database operations (SEMPRE locali)
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
  // Usa un try-catch per gestire il caso in cui AuthContext non sia ancora pronto
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)

  // Prova a ottenere l'utente dall'AuthContext
  useEffect(() => {
    try {
      const authContext = useAuth()
      setUser(authContext.user)
      setAuthReady(true)
      console.log('✅ Auth context ready, user:', authContext.user?.email || 'anonymous')
    } catch (error) {
      // AuthContext non ancora pronto, usa utente dal localStorage
      const savedUser = localStorage.getItem('edilcheck_user')
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
          console.log('🔄 Using saved user from localStorage:', parsedUser.email)
        } catch (parseError) {
          console.log('⚠️ Could not parse saved user, using anonymous')
        }
      } else {
        console.log('⚠️ No saved user found, using anonymous')
      }
      setAuthReady(true)
    }
  }, [])

  const [mode, setMode] = useState<DatabaseMode>(() => {
    const saved = localStorage.getItem('edilcheck_database_mode')
    return (saved as DatabaseMode) || 'local-only'
  })
  
  const [remoteConfig, setRemoteConfigState] = useState(() => {
    const saved = localStorage.getItem('edilcheck_remote_config')
    return saved ? JSON.parse(saved) : { host: 'localhost', port: '3002' }
  })
  
  const [isRemoteAvailable, setIsRemoteAvailable] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [remoteDatabase, setRemoteDatabase] = useState<RemoteDatabase | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(databaseSync.getStatus())
  const [isConnected, setIsConnected] = useState(false)

  // Aggiorna modalità database
  const handleSetMode = (newMode: DatabaseMode) => {
    console.log(`🔄 Switching database mode: ${mode} → ${newMode}`)
    setMode(newMode)
    localStorage.setItem('edilcheck_database_mode', newMode)
    
    if (newMode === 'local-with-backup' && !remoteDatabase) {
      // Inizializza database remoto se necessario
      const newRemoteDb = new RemoteDatabase(remoteConfig)
      setRemoteDatabase(newRemoteDb)
      databaseSync.setRemoteDatabase(newRemoteDb)
      testRemoteConnection()
    }
  }

  // Aggiorna configurazione remota
  const setRemoteConfig = (host: string, port: string) => {
    console.log(`🔧 Updating remote config: ${host}:${port}`)
    const newConfig = { host, port }
    setRemoteConfigState(newConfig)
    localStorage.setItem('edilcheck_remote_config', JSON.stringify(newConfig))
    
    // Ricrea il client remoto se in modalità backup
    if (mode === 'local-with-backup') {
      const newRemoteDb = new RemoteDatabase(newConfig)
      setRemoteDatabase(newRemoteDb)
      databaseSync.setRemoteDatabase(newRemoteDb)
      testRemoteConnection()
    }
  }

  // Test connessione remota (solo per backup)
  const testRemoteConnection = async (): Promise<boolean> => {
    if (mode === 'local-only') {
      setIsRemoteAvailable(false)
      setConnectionError(null)
      return false
    }

    if (!remoteDatabase) {
      setIsRemoteAvailable(false)
      setConnectionError('Database remoto non configurato')
      return false
    }

    try {
      const connected = await databaseSync.testConnection()
      setIsRemoteAvailable(connected)
      setConnectionError(connected ? null : 'Server remoto non raggiungibile')
      return connected
    } catch (error: any) {
      setIsRemoteAvailable(false)
      setConnectionError(`Errore connessione: ${error.message}`)
      return false
    }
  }

  // Backup manuale verso remoto
  const backupToRemote = async (): Promise<SyncResult> => {
    const currentUser = user || { email: 'anonymous' }
    
    if (!currentUser.email || currentUser.email === 'anonymous') {
      throw new Error('Utente non autenticato per il backup. Effettua il login prima.')
    }
    
    if (!isRemoteAvailable) {
      throw new Error('Server remoto non disponibile')
    }
    
    console.log('💾 Starting backup to remote for user:', currentUser.email)
    return await databaseSync.backupToRemote(currentUser.email)
  }

  // Ripristino da remoto
  const restoreFromRemote = async (): Promise<SyncResult> => {
    const currentUser = user || { email: 'anonymous' }
    
    if (!currentUser.email || currentUser.email === 'anonymous') {
      throw new Error('Utente non autenticato per il ripristino. Effettua il login prima.')
    }
    
    if (!isRemoteAvailable) {
      throw new Error('Server remoto non disponibile')
    }
    
    console.log('📥 Starting restore from remote for user:', currentUser.email)
    return await databaseSync.restoreFromRemote(currentUser.email)
  }

  // Inizializza all'avvio
  useEffect(() => {
    if (!authReady) return

    const initDatabase = async () => {
      console.log(`🚀 Initializing local database in ${mode} mode`)
      
      // Il database locale è SEMPRE disponibile immediatamente
      setIsConnected(true)
      setConnectionError('Using local database')
      
      if (mode === 'local-with-backup') {
        // Configura database remoto per backup (in background, non bloccante)
        const newRemoteDb = new RemoteDatabase(remoteConfig)
        setRemoteDatabase(newRemoteDb)
        databaseSync.setRemoteDatabase(newRemoteDb)
        
        // Test connessione in background (non bloccante)
        setTimeout(async () => {
          try {
            const connected = await newRemoteDb.testConnection()
            setIsRemoteAvailable(connected)
            setConnectionError(connected ? null : 'Server remoto non disponibile per backup')
            
            // Se connesso e utente autenticato, configura credenziali
            if (connected && user?.email) {
              const credentials = localStorage.getItem('edilcheck_credentials')
              if (credentials) {
                const { email, password } = JSON.parse(credentials)
                newRemoteDb.setCredentials(email, password)
                console.log('🔑 Remote credentials configured for backup')
              }
            }
          } catch (error: any) {
            setIsRemoteAvailable(false)
            setConnectionError('Server remoto non disponibile per backup')
            console.log('⚠️ Remote backup server not available')
          }
        }, 100) // Molto veloce, non bloccante
      } else {
        setIsRemoteAvailable(false)
        setConnectionError(null)
        console.log('✅ Local-only mode active')
      }
    }

    initDatabase()
  }, [mode, remoteConfig, authReady])

  // Listen to sync status changes
  useEffect(() => {
    const unsubscribe = databaseSync.onStatusChange(setSyncStatus)
    return unsubscribe
  }, [])

  // Aggiorna credenziali remote quando l'utente cambia
  useEffect(() => {
    if (mode === 'local-with-backup' && remoteDatabase && user) {
      const credentials = localStorage.getItem('edilcheck_credentials')
      if (credentials) {
        try {
          const { email, password } = JSON.parse(credentials)
          remoteDatabase.setCredentials(email, password)
          console.log('🔑 Remote backup credentials updated for user:', email)
        } catch (error) {
          console.error('Error setting remote backup credentials:', error)
        }
      }
    }
  }, [mode, remoteDatabase, user])

  // TUTTE le operazioni database sono SEMPRE locali
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
    return localDatabase.updatePayment(userEmail, payment)
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
      isRemoteAvailable,
      connectionError,
      testRemoteConnection,
      isConnected,
      syncStatus,
      backupToRemote,
      restoreFromRemote,
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