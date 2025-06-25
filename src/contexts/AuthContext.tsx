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
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('edilcheck_user')
    
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Simple browser-based authentication
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
    } catch (error: any) {
      return { 
        success: false, 
        error: 'Errore durante il login' 
      }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const users = JSON.parse(localStorage.getItem('edilcheck_users') || '[]')
      
      // Check if user already exists
      if (users.find((u: any) => u.email === email)) {
        return { success: false, error: 'Email già registrata' }
      }
      
      // Add new user
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
    } catch (error: any) {
      return { 
        success: false, 
        error: 'Errore durante la registrazione' 
      }
    }
  }

  const logout = async () => {
    localStorage.removeItem('edilcheck_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}