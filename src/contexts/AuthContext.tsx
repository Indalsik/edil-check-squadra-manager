import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('edilcheck_token')
    const savedUser = localStorage.getItem('edilcheck_user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password)
      
      localStorage.setItem('edilcheck_token', response.token)
      localStorage.setItem('edilcheck_user', JSON.stringify(response.user))
      setUser(response.user)
      
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante il login' 
      }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const response = await authAPI.register(email, password)
      
      localStorage.setItem('edilcheck_token', response.token)
      localStorage.setItem('edilcheck_user', JSON.stringify(response.user))
      setUser(response.user)
      
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante la registrazione' 
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('edilcheck_token')
      localStorage.removeItem('edilcheck_user')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}