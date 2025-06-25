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
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('edilcheck_token')
        localStorage.removeItem('edilcheck_user')
      }
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email)
      const response = await authAPI.login(email, password)
      console.log('Login response:', response)
      
      localStorage.setItem('edilcheck_token', response.token)
      localStorage.setItem('edilcheck_user', JSON.stringify(response.user))
      setUser(response.user)
      
      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Errore durante il login' 
      }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      console.log('Attempting registration for:', email)
      const response = await authAPI.register(email, password)
      console.log('Registration response:', response)
      
      localStorage.setItem('edilcheck_token', response.token)
      localStorage.setItem('edilcheck_user', JSON.stringify(response.user))
      setUser(response.user)
      
      return { success: true }
    } catch (error: any) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Errore durante la registrazione' 
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
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