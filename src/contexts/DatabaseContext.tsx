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

  // Test connessione con timeout
  const testConnection = async (): Promise<boolean> => {
    if (mode === 'local') {
      setIsConnected(true)
      setConnectionError(null)
      return true
    }

    try {
      console.log('🔍 Testing remote connection with timeout...')
      const testDb = remoteDatabase || new RemoteDatabase(remoteConfig)
      
      // Test con timeout di 5 secondi
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      })
      
      const connectionPromise = testDb.testConnection()
      const connected = await Promise.race([connectionPromise, timeoutPromise])
      
      setIsConnected(connected)
      
      if (connected) {
        setConnectionError(null)
        console.log('✅ Remote database connected')
      } else {
        setConnectionError('Server remoto non raggiungibile')
        console.log('❌ Remote database connection failed')
      }
      return connected
    } catch (error: any) {
      setIsConnected(false)
      const errorMsg = error.message.includes('timeout') 
        ? 'Timeout connessione server remoto' 
        : `Errore connessione: ${error.message}`
      setConnectionError(errorMsg)
      console.error('❌ Remote database error:', error)
      return false
    }
  }

  // Inizializza database all'avvio con timeout
  useEffect(() => {
    const initDatabase = async () => {
      console.log(`🚀 Initializing database in ${mode} mode`)
      
      if (mode === 'local') {
        setIsConnected(true)
        setConnectionError(null)
        setIsInitialized(true)
        console.log('✅ Local database ready')
      } else {
        // Remote mode con timeout
        const newRemoteDb = new RemoteDatabase(remoteConfig)
        setRemoteDatabase(newRemoteDb)
        
        try {
          console.log('🔍 Testing remote connection with 3 second timeout...')
          
          // Timeout più breve per l'inizializzazione
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), 3000)
          })
          
          const connectionPromise = newRemoteDb.testConnection()
          const connected = await Promise.race([connectionPromise, timeoutPromise])
          
          setIsConnected(connected)
          if (connected) {
            setConnectionError(null)
            console.log('✅ Remote database connected')
          } else {
            setConnectionError('Server remoto non disponibile. Usando database locale.')
            console.log('⚠️ Remote database connection failed, using local fallback')
          }
        } catch (error: any) {
          setIsConnected(false)
          const errorMsg = error.message.includes('timeout') 
            ? 'Server remoto non risponde. Usando database locale.' 
            : `Errore server remoto. Usando database locale.`
          setConnectionError(errorMsg)
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

  // Helper per decidere quale database usare
  const shouldUseRemote = () => {
    return mode === 'remote' && isConnected && remoteDatabase
  }

  // Operazioni database con fallback automatico e gestione errori
  const getWorkers = async () => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.getWorkers(userEmail)
    }
    
    try {
      return await remoteDatabase!.getWorkers()
    } catch (error) {
      console.warn('Remote getWorkers failed, falling back to local:', error)
      return localDatabase.getWorkers(userEmail)
    }
  }

  const addWorker = async (worker: any) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.addWorker(userEmail, worker)
    }
    
    try {
      return await remoteDatabase!.addWorker(worker)
    } catch (error) {
      console.warn('Remote addWorker failed, falling back to local:', error)
      return localDatabase.addWorker(userEmail, worker)
    }
  }

  const updateWorker = async (id: number, worker: any) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.updateWorker(userEmail, id, worker)
    }
    
    try {
      return await remoteDatabase!.updateWorker(id, worker)
    } catch (error) {
      console.warn('Remote updateWorker failed, falling back to local:', error)
      return localDatabase.updateWorker(userEmail, id, worker)
    }
  }

  const deleteWorker = async (id: number) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      localDatabase.deleteWorker(userEmail, id)
      return
    }
    
    try {
      await remoteDatabase!.deleteWorker(id)
    } catch (error) {
      console.warn('Remote deleteWorker failed, falling back to local:', error)
      localDatabase.deleteWorker(userEmail, id)
    }
  }

  const getSites = async () => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.getSites(userEmail)
    }
    
    try {
      return await remoteDatabase!.getSites()
    } catch (error) {
      console.warn('Remote getSites failed, falling back to local:', error)
      return localDatabase.getSites(userEmail)
    }
  }

  const addSite = async (site: any) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.addSite(userEmail, site)
    }
    
    try {
      return await remoteDatabase!.addSite(site)
    } catch (error) {
      console.warn('Remote addSite failed, falling back to local:', error)
      return localDatabase.addSite(userEmail, site)
    }
  }

  const updateSite = async (id: number, site: any) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.updateSite(userEmail, id, site)
    }
    
    try {
      return await remoteDatabase!.updateSite(id, site)
    } catch (error) {
      console.warn('Remote updateSite failed, falling back to local:', error)
      return localDatabase.updateSite(userEmail, id, site)
    }
  }

  const deleteSite = async (id: number) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      localDatabase.deleteSite(userEmail, id)
      return
    }
    
    try {
      await remoteDatabase!.deleteSite(id)
    } catch (error) {
      console.warn('Remote deleteSite failed, falling back to local:', error)
      localDatabase.deleteSite(userEmail, id)
    }
  }

  const getTimeEntries = async () => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.getTimeEntries(userEmail)
    }
    
    try {
      return await remoteDatabase!.getTimeEntries()
    } catch (error) {
      console.warn('Remote getTimeEntries failed, falling back to local:', error)
      return localDatabase.getTimeEntries(userEmail)
    }
  }

  const addTimeEntry = async (entry: any) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.addTimeEntry(userEmail, entry)
    }
    
    try {
      return await remoteDatabase!.addTimeEntry(entry)
    } catch (error) {
      console.warn('Remote addTimeEntry failed, falling back to local:', error)
      return localDatabase.addTimeEntry(userEmail, entry)
    }
  }

  const updateTimeEntry = async (id: number, entry: any) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.updateTimeEntry(userEmail, id, entry)
    }
    
    try {
      return await remoteDatabase!.updateTimeEntry(id, entry)
    } catch (error) {
      console.warn('Remote updateTimeEntry failed, falling back to local:', error)
      return localDatabase.updateTimeEntry(userEmail, id, entry)
    }
  }

  const deleteTimeEntry = async (id: number) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      localDatabase.deleteTimeEntry(userEmail, id)
      return
    }
    
    try {
      await remoteDatabase!.deleteTimeEntry(id)
    } catch (error) {
      console.warn('Remote deleteTimeEntry failed, falling back to local:', error)
      localDatabase.deleteTimeEntry(userEmail, id)
    }
  }

  const getPayments = async () => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.getPayments(userEmail)
    }
    
    try {
      return await remoteDatabase!.getPayments()
    } catch (error) {
      console.warn('Remote getPayments failed, falling back to local:', error)
      return localDatabase.getPayments(userEmail)
    }
  }

  const addPayment = async (payment: any) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.addPayment(userEmail, payment)
    }
    
    try {
      return await remoteDatabase!.addPayment(payment)
    } catch (error) {
      console.warn('Remote addPayment failed, falling back to local:', error)
      return localDatabase.addPayment(userEmail, payment)
    }
  }

  const updatePayment = async (id: number, payment: any) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.updatePayment(userEmail, id, payment)
    }
    
    try {
      return await remoteDatabase!.updatePayment(id, payment)
    } catch (error) {
      console.warn('Remote updatePayment failed, falling back to local:', error)
      return localDatabase.updatePayment(userEmail, id, payment)
    }
  }

  const deletePayment = async (id: number) => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      localDatabase.deletePayment(userEmail, id)
      return
    }
    
    try {
      await remoteDatabase!.deletePayment(id)
    } catch (error) {
      console.warn('Remote deletePayment failed, falling back to local:', error)
      localDatabase.deletePayment(userEmail, id)
    }
  }

  const getDashboardStats = async () => {
    const userEmail = user?.email || 'anonymous'
    if (!shouldUseRemote()) {
      return localDatabase.getDashboardStats(userEmail)
    }
    
    try {
      return await remoteDatabase!.getDashboardStats()
    } catch (error) {
      console.warn('Remote getDashboardStats failed, falling back to local:', error)
      return localDatabase.getDashboardStats(userEmail)
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