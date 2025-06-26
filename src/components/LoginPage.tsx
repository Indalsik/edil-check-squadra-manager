import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useDatabase } from '@/contexts/DatabaseContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Building2, Moon, Sun, Database, Server, AlertCircle, Settings, Info } from 'lucide-react'
import { toast } from 'sonner'

export const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ email: '', password: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [lastError, setLastError] = useState<{ type: 'login' | 'register', message: string } | null>(null)
  
  const [localRemoteConfig, setLocalRemoteConfig] = useState(() => {
    const saved = localStorage.getItem('edilcheck_remote_config')
    return saved ? JSON.parse(saved) : { host: 'localhost', port: '3002' }
  })
  
  const { login, register } = useAuth()
  const { mode, setMode, setRemoteConfig, testConnection, connectionError } = useDatabase()
  const { theme, toggleTheme } = useTheme()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLastError(null)
    
    try {
      const result = await login(loginData.email, loginData.password, mode, mode === 'remote' ? localRemoteConfig : undefined)
      if (result.success) {
        toast.success('Login effettuato con successo!')
      } else {
        const errorMessage = result.error || 'Credenziali non valide'
        setLastError({ type: 'login', message: errorMessage })
        toast.error(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Errore durante il login'
      setLastError({ type: 'login', message: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLastError(null)
    
    if (registerData.password !== registerData.confirmPassword) {
      const errorMessage = 'Le password non coincidono'
      setLastError({ type: 'register', message: errorMessage })
      toast.error(errorMessage)
      return
    }

    if (registerData.password.length < 6) {
      const errorMessage = 'La password deve contenere almeno 6 caratteri'
      setLastError({ type: 'register', message: errorMessage })
      toast.error(errorMessage)
      return
    }

    setIsLoading(true)
    
    try {
      const result = await register(registerData.email, registerData.password, mode, mode === 'remote' ? localRemoteConfig : undefined)
      if (result.success) {
        toast.success('Registrazione completata con successo!')
      } else {
        const errorMessage = result.error || 'Errore durante la registrazione'
        setLastError({ type: 'register', message: errorMessage })
        toast.error(errorMessage)
        
        if (errorMessage.includes('già registrata')) {
          setLoginData({ email: registerData.email, password: '' })
          setTimeout(() => setActiveTab('login'), 2000)
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Errore durante la registrazione'
      setLastError({ type: 'register', message: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModeChange = (newMode: 'local' | 'remote') => {
    setMode(newMode)
    setLastError(null)
    setLoginData({ email: '', password: '' })
    setRegisterData({ email: '', password: '', confirmPassword: '' })
  }

  const handleRemoteConfigChange = (field: 'host' | 'port', value: string) => {
    const newConfig = { ...localRemoteConfig, [field]: value }
    setLocalRemoteConfig(newConfig)
    localStorage.setItem('edilcheck_remote_config', JSON.stringify(newConfig))
  }

  const applyRemoteConfig = () => {
    setRemoteConfig(localRemoteConfig.host, localRemoteConfig.port)
    toast.success('Configurazione server aggiornata')
  }

  const handleTestConnection = async () => {
    const connected = await testConnection()
    if (connected) {
      toast.success('Connessione al server riuscita!')
    } else {
      toast.error('Impossibile connettersi al server')
    }
  }

  const renderErrorAlert = (tabType: 'login' | 'register') => {
    if (!lastError || lastError.type !== tabType) return null

    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <p className="font-medium">{lastError.message}</p>
        </AlertDescription>
      </Alert>
    )
  }

  // Credenziali di test per il database remoto
  const fillTestCredentials = () => {
    setLoginData({ email: 'admin@edilcheck.com', password: 'edilcheck123' })
  }

  const fillTestRegisterCredentials = () => {
    setRegisterData({ 
      email: 'test@edilcheck.com', 
      password: 'edilcheck123', 
      confirmPassword: 'edilcheck123' 
    })
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
            Sistema di gestione per l'edilizia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Registrati</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              {renderErrorAlert('login')}
              
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
                
                {/* Credenziali di test per database remoto */}
                {mode === 'remote' && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Credenziali di Test</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillTestCredentials}
                      className="text-xs bg-blue-100 hover:bg-blue-200 border-blue-300"
                    >
                      Usa credenziali di test
                    </Button>
                    <p className="text-xs text-blue-600 mt-1">
                      Email: admin@edilcheck.com<br />
                      Password: edilcheck123
                    </p>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              {renderErrorAlert('register')}
              
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
                
                {/* Credenziali di test per registrazione */}
                {mode === 'remote' && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Registrazione di Test</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillTestRegisterCredentials}
                      className="text-xs bg-green-100 hover:bg-green-200 border-green-300"
                    >
                      Usa dati di test
                    </Button>
                    <p className="text-xs text-green-600 mt-1">
                      Compila automaticamente con dati di test
                    </p>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Configurazione Database */}
          <div className="space-y-4 pt-4 border-t mt-4">
            <Label className="text-sm font-medium">Database</Label>
            
            <Select value={mode} onValueChange={handleModeChange}>
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

            {mode === 'remote' && (
              <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-orange-800">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Configurazione Server</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-orange-700">Host</Label>
                    <Input
                      value={localRemoteConfig.host}
                      onChange={(e) => handleRemoteConfigChange('host', e.target.value)}
                      placeholder="localhost"
                      className="text-sm h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-orange-700">Porta</Label>
                    <Input
                      value={localRemoteConfig.port}
                      onChange={(e) => handleRemoteConfigChange('port', e.target.value)}
                      placeholder="3002"
                      className="text-sm h-8"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    className="text-xs"
                  >
                    Test
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyRemoteConfig}
                    className="text-xs bg-orange-100 hover:bg-orange-200"
                  >
                    Applica
                  </Button>
                </div>
                
                {connectionError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-xs">
                      {connectionError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}