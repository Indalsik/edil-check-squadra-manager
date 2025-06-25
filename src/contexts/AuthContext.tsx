import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useDatabase } from '@/contexts/DatabaseContext'
import { authAPI } from '@/lib/api'

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
    if (mode === 'local') {
      const savedUser = localStorage.getItem('edilcheck_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } else {
      const token = localStorage.getItem('edilcheck_token')
      if (token) {
        // Verify token with remote server
        authAPI.me()
          .then(response => {
            setUser(response.user)
          })
          .catch(() => {
            localStorage.removeItem('edilcheck_token')
          })
      }
    }
    setIsLoading(false)
  }, [mode])

  const login = async (email: string, password: string) => {
    try {
      if (mode === 'local') {
        // Local authentication
        const users = JSON.parse(localStorage.getItem('edilcheck_users') || '[]')
        const user = users.find((u: any) => u.email === email && u.password === password)
        
        if (user) {
          const userInfo = { id: user.id, email: user.email }
          localStorage.setItem('edilcheck_user', JSON.stringify(userInfo))
          setUser(userInfo)
          return { success: true }
        } else {
          return { success: false, error: 'Credenziali non valide' }
        }
      } else {
        // Remote authentication
        const response = await authAPI.login(email, password)
        localStorage.setItem('edilcheck_token', response.token)
        setUser(response.user)
        return { success: true }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante il login' 
      }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      if (mode === 'local') {
        // Local registration
        const users = JSON.parse(localStorage.getItem('edilcheck_users') || '[]')
        
        if (users.find((u: any) => u.email === email)) {
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
        
        return { success: true }
      } else {
        // Remote registration
        const response = await authAPI.register(email, password)
        localStorage.setItem('edilcheck_token', response.token)
        setUser(response.user)
        return { success: true }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante la registrazione' 
      }
    }
  }

  const logout = async () => {
    if (mode === 'local') {
      localStorage.removeItem('edilcheck_user')
    } else {
      try {
        await authAPI.logout()
      } catch (error) {
        console.error('Logout error:', error)
      }
      localStorage.removeItem('edilcheck_token')
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}