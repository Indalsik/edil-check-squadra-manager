import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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

  const login = async (email: string, password: string) => {
    try {
      console.log(`🔐 Local login attempt for ${email}`)
      
      // Autenticazione sempre locale
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
    } catch (error: any) {
      console.error('❌ Login error:', error)
      return { success: false, error: error.message || 'Errore durante il login' }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      console.log(`📝 Local registration attempt for ${email}`)
      
      // Registrazione sempre locale
      const users = JSON.parse(localStorage.getItem('edilcheck_users') || '[]')
      
      // Controlla se l'utente esiste già
      const existingUser = users.find((u: any) => u.email === email)
      if (existingUser) {
        console.log('❌ Local registration failed: email already exists')
        return { success: false, error: 'Email già registrata' }
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