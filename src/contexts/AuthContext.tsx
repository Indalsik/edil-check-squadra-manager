import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useDatabase } from '@/contexts/DatabaseContext'
import { authAPI, setUserCredentials, clearUserCredentials } from '@/lib/api'

interface User {
  id: number
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
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
  const { mode } = useDatabase()

  useEffect(() => {
    // Check for existing user based on database mode
    const checkExistingAuth = async () => {
      if (mode === 'local') {
        const savedUser = localStorage.getItem('edilcheck_user')
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser))
          } catch (error) {
            console.error('Error parsing saved user:', error)
            localStorage.removeItem('edilcheck_user')
          }
        }
      } else {
        const savedCredentials = localStorage.getItem('edilcheck_credentials')
        if (savedCredentials) {
          try {
            const { email, password } = JSON.parse(savedCredentials)
            setUserCredentials(email, password)
            
            // Verify credentials with remote server
            const response = await authAPI.me()
            setUser(response.user)
          } catch (error) {
            console.error('Credentials verification failed:', error)
            // Clear invalid credentials
            localStorage.removeItem('edilcheck_credentials')
            clearUserCredentials()
          }
        }
      }
      setIsLoading(false)
    }

    checkExistingAuth()
  }, [mode])

  const login = async (email: string, password: string) => {
    try {
      console.log(`🔐 Login attempt for ${email} using ${mode} mode`)
      
      if (mode === 'local') {
        // Local authentication
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
          return { success: false, error: 'Credenziali non valide' }
        }
      } else {
        // Remote authentication
        try {
          const response = await authAPI.login(email, password)
          if (response.success) {
            // Store credentials for future use
            localStorage.setItem('edilcheck_credentials', JSON.stringify({ email, password }))
            setUser(response.user)
            console.log('✅ Remote login successful')
            return { success: true }
          } else {
            return { success: false, error: response.message || 'Login fallito' }
          }
        } catch (error: any) {
          console.error('❌ Remote login error:', error)
          return { 
            success: false, 
            error: error.message || 'Errore durante il login' 
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      return { 
        success: false, 
        error: error.message || 'Errore durante il login' 
      }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      console.log(`📝 Registration attempt for ${email} using ${mode} mode`)
      
      if (mode === 'local') {
        // Local registration
        const users = JSON.parse(localStorage.getItem('edilcheck_users') || '[]')
        
        // Check if user already exists
        if (users.find((u: any) => u.email === email)) {
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
      } else {
        // Remote registration
        try {
          const response = await authAPI.register(email, password)
          if (response.success) {
            // Store credentials for future use
            localStorage.setItem('edilcheck_credentials', JSON.stringify({ email, password }))
            setUser(response.user)
            console.log('✅ Remote registration successful')
            return { success: true }
          } else {
            return { success: false, error: response.message || 'Registrazione fallita' }
          }
        } catch (error: any) {
          console.error('❌ Remote registration error:', error)
          
          // Provide more specific error messages
          let errorMessage = error.message || 'Errore durante la registrazione'
          
          if (errorMessage.includes('già registrata') || errorMessage.includes('already registered')) {
            errorMessage = `Email già registrata sul server remoto. Prova ad accedere o usa un'email diversa.`
          } else if (errorMessage.includes('connettersi al server') || errorMessage.includes('Failed to fetch')) {
            errorMessage = `Impossibile connettersi al server remoto. Verifica che il server sia in esecuzione o passa al database locale.`
          }
          
          return { 
            success: false, 
            error: errorMessage
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error)
      return { 
        success: false, 
        error: error.message || 'Errore durante la registrazione' 
      }
    }
  }

  const logout = async () => {
    console.log(`👋 Logout using ${mode} mode`)
    
    if (mode === 'local') {
      localStorage.removeItem('edilcheck_user')
    } else {
      try {
        await authAPI.logout()
      } catch (error) {
        console.error('Logout error:', error)
      }
      localStorage.removeItem('edilcheck_credentials')
      clearUserCredentials()
    }
    setUser(null)
    console.log('✅ Logout successful')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}