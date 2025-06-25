import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { database } from '@/lib/database'

interface User {
  id: string
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
    const initAuth = async () => {
      try {
        await database.init()
        const currentUser = database.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const result = await database.login(email, password)
      if (result.success && result.user) {
        setUser(result.user)
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (error: any) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.message || 'Errore durante il login' 
      }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const result = await database.register(email, password)
      if (result.success && result.user) {
        setUser(result.user)
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (error: any) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        error: error.message || 'Errore durante la registrazione' 
      }
    }
  }

  const logout = async () => {
    try {
      await database.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}