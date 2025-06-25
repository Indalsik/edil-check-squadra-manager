import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useDatabase } from '@/contexts/DatabaseContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Building2, Moon, Sun, Database, Server } from 'lucide-react'
import { toast } from 'sonner'

export const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ email: '', password: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)
  const { login, register } = useAuth()
  const { mode, setMode } = useDatabase()
  const { theme, toggleTheme } = useTheme()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await login(loginData.email, loginData.password)
      if (result.success) {
        toast.success('Login effettuato con successo!')
      } else {
        toast.error(result.error || 'Credenziali non valide')
      }
    } catch (error) {
      toast.error('Errore durante il login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Le password non coincidono')
      return
    }

    if (registerData.password.length < 6) {
      toast.error('La password deve contenere almeno 6 caratteri')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await register(registerData.email, registerData.password)
      if (result.success) {
        toast.success('Registrazione completata con successo!')
      } else {
        toast.error(result.error || 'Errore durante la registrazione')
      }
    } catch (error) {
      toast.error('Errore durante la registrazione')
    } finally {
      setIsLoading(false)
    }
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
            Sistema di gestione per l'edilizia - Self Hosted
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
              
              {/* Database Selection */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium">Modalità Database</Label>
                <Select value={mode} onValueChange={(value: 'local' | 'remote') => setMode(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span>Database Locale</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="remote">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-orange-600" />
                        <span>Database Remoto</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {mode === 'local' 
                    ? 'I dati saranno salvati nel browser locale' 
                    : 'I dati saranno salvati sul server remoto'
                  }
                </p>
              </div>
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
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                </Button>
              </form>
              
              {/* Database Selection for Register tab too */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium">Modalità Database</Label>
                <Select value={mode} onValueChange={(value: 'local' | 'remote') => setMode(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span>Database Locale</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="remote">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-orange-600" />
                        <span>Database Remoto</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {mode === 'local' 
                    ? 'I dati saranno salvati nel browser locale' 
                    : 'I dati saranno salvati sul server remoto'
                  }
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}