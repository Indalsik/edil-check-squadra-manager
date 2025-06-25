
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  username: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string) => Promise<boolean>
  logout: () => void
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
    // Check for existing session
    const currentUser = localStorage.getItem('edilcheck_current_user')
    if (currentUser) {
      setUser(JSON.parse(currentUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Get stored users
    const users = JSON.parse(localStorage.getItem('edilcheck_users') || '{}')
    
    if (users[username] && users[username].password === password) {
      const userData = { username, createdAt: users[username].createdAt }
      setUser(userData)
      localStorage.setItem('edilcheck_current_user', JSON.stringify(userData))
      
      // Set the database key for this user
      localStorage.setItem('edilcheck_current_db_key', `edilcheck_db_${username}`)
      
      return true
    }
    return false
  }

  const register = async (username: string, password: string): Promise<boolean> => {
    // Get existing users
    const users = JSON.parse(localStorage.getItem('edilcheck_users') || '{}')
    
    // Check if user already exists
    if (users[username]) {
      return false
    }

    // Create new user
    users[username] = {
      password,
      createdAt: new Date().toISOString()
    }
    
    localStorage.setItem('edilcheck_users', JSON.stringify(users))
    
    // Auto-login after registration
    const userData = { username, createdAt: users[username].createdAt }
    setUser(userData)
    localStorage.setItem('edilcheck_current_user', JSON.stringify(userData))
    localStorage.setItem('edilcheck_current_db_key', `edilcheck_db_${username}`)
    
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('edilcheck_current_user')
    localStorage.removeItem('edilcheck_current_db_key')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
