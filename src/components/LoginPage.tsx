import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Building2, Moon, Sun, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

export const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ email: '', password: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const result = await login(loginData.email, loginData.password)
      
      if (result.success) {
        toast.success('Login effettuato con successo!')
      } else {
        setError(result.error || 'Credenziali non valide')
        toast.error(result.error || 'Credenziali non valide')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = 'Errore durante il login'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Le password non coincidono')
      toast.error('Le password non coincidono')
      return
    }

    if (registerData.password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri')
      toast.error('La password deve contenere almeno 6 caratteri')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await register(registerData.email, registerData.password)
      
      if (result.success) {
        toast.success('Registrazione completata con successo!')
      } else {
        setError(result.error || 'Errore durante la registrazione')
        toast.error(result.error || 'Errore durante la registrazione')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      const errorMessage = 'Errore durante la registrazione'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setLoginData({ email: 'demo@edilcheck.com', password: 'demo123' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-edil-blue to-edil-dark-blue p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-edil-orange" />
            <CardTitle className="text-2xl font-bold text-edil-blue">
              Edil-Check
            </CardTitle>
          </div>
          <CardDescription>
            Sistema di gestione per l'edilizia - Versione Locale
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Demo Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Account Demo Disponibile:</p>
                <p>Email: demo@edilcheck.com</p>
                <p>Password: demo123</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={handleDemoLogin}
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                >
                  Clicca qui per compilare automaticamente
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Registrati</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Conferma Password</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>💾 Dati salvati localmente - Perfetto per self-hosting!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}