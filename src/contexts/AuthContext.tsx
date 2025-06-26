import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { RemoteDatabase } from '@/lib/remote-database'

interface User {
  id: number
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, mode: 'local' | 'remote', remoteConfig?: { host: string; port: string }) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, mode: 'local' | 'remote', remoteConfig?: { host: string; port: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Controlla se c'è un utente salvato
    const checkExistingAuth = () => {
      const savedUser = localStorage.getItem('edilcheck_user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error('Error parsing saved user:', error)
          localStorage.removeItem('edilcheck_user')
        }
      }
      setIsLoading(false)
    }

    checkExistingAuth()
  }, [])

  const login = async (email: string, password: string, mode: 'local' | 'remote', remoteConfig?: { host: string; port: string }) => {
    try {
      console.log(`🔐 Login attempt for ${email} using ${mode} mode`)
      
      if (mode === 'local') {
        // Autenticazione locale
        const users = JSON.parse(localStorage.getItem('edilcheck_users') || '[]')
        const user = users.find((u: any) => u.email === email && u.password === password)
        
        if (user) {
          const userInfo = { id: user.id, email: user.email }
          localStorage.setItem('edilcheck_user', JSON.stringify(userInfo))
          setUser(userInfo)
          console.log('✅ Local login successful')
          return { success: true }
        } else {
          console.log('❌ Local login failed: invalid credentials')
          return { success: false, error: 'Credenziali non valide per il database locale' }
        }
      } else if (remoteConfig) {
        // Autenticazione remota
        console.log('🌐 Attempting remote login with config:', remoteConfig)
        const remoteDb = new RemoteDatabase(remoteConfig)
        
        // Prima testa la connessione
        const isConnected = await remoteDb.testConnection()
        if (!isConnected) {
          return { success: false, error: 'Impossibile connettersi al server remoto. Verifica che sia avviato e raggiungibile.' }
        }
        
        const result = await remoteDb.login(email, password)
        
        if (result.success && result.user) {
          // Salva credenziali per API future
          localStorage.setItem('edilcheck_credentials', JSON.stringify({ email, password }))
          localStorage.setItem('edilcheck_user', JSON.stringify(result.user))
          setUser(result.user)
          console.log('✅ Remote login successful')
          return { success: true }
        } else {
          return { success: false, error: result.error || 'Login remoto fallito' }
        }
      }
      
      return { success: false, error: 'Configurazione non valida' }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      return { success: false, error: error.message || 'Errore durante il login' }
    }
  }

  const register = async (email: string, password: string, mode: 'local' | 'remote', remoteConfig?: { host: string; port: string }) => {
    try {
      console.log(`📝 Registration attempt for ${email} using ${mode} mode`)
      
      if (mode === 'local') {
        // Registrazione locale
        const users = JSON.parse(localStorage.getItem('edilcheck_users') || '[]')
        
        // Controlla se l'utente esiste già
        const existingUser = users.find((u: any) => u.email === email)
        if (existingUser) {
          console.log('❌ Local registration failed: email already exists')
          return { success: false, error: 'Email già registrata nel database locale' }
        }
        
        const newUser = {
          id: Date.now(),
          email,
          password
        }
        users.push(newUser)
        localStorage.setItem('edilcheck_users', JSON.stringify(users))
        
        const userInfo = { id: newUser.id, email: newUser.email }
        localStorage.setItem('edilcheck_user', JSON.stringify(userInfo))
        setUser(userInfo)
        
        console.log('✅ Local registration successful')
        return { success: true }
      } else if (remoteConfig) {
        // Registrazione remota
        console.log('🌐 Attempting remote registration with config:', remoteConfig)
        const remoteDb = new RemoteDatabase(remoteConfig)
        
        // Prima testa la connessione
        const isConnected = await remoteDb.testConnection()
        if (!isConnected) {
          return { success: false, error: 'Impossibile connettersi al server remoto. Verifica che sia avviato e raggiungibile.' }
        }
        
        const result = await remoteDb.register(email, password)
        
        if (result.success && result.user) {
          // Salva credenziali per API future
          localStorage.setItem('edilcheck_credentials', JSON.stringify({ email, password }))
          localStorage.setItem('edilcheck_user', JSON.stringify(result.user))
          setUser(result.user)
          console.log('✅ Remote registration successful')
          return { success: true }
        } else {
          return { success: false, error: result.error || 'Registrazione remota fallita' }
        }
      }
      
      return { success: false, error: 'Configurazione non valida' }
    } catch (error: any) {
      console.error('❌ Registration error:', error)
      return { success: false, error: error.message || 'Errore durante la registrazione' }
    }
  }

  const logout = async () => {
    console.log('👋 Logout')
    
    // Pulisci tutto
    localStorage.removeItem('edilcheck_user')
    localStorage.removeItem('edilcheck_credentials')
    setUser(null)
    
    console.log('✅ Logout successful')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}