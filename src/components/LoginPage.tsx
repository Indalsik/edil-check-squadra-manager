import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useDatabase } from '@/contexts/DatabaseContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Building2, Moon, Sun, Database, Server, Trash2, Calendar, Settings, AlertCircle, Info, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ email: '', password: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [lastError, setLastError] = useState<{ type: 'login' | 'register', message: string } | null>(null)
  
  // Local state for remote config to prevent immediate reloads
  const [localRemoteConfig, setLocalRemoteConfig] = useState(() => {
    const saved = localStorage.getItem('edilcheck_remote_config')
    return saved ? JSON.parse(saved) : { host: 'localhost', port: '3002' }
  })
  
  const { login, register } = useAuth()
  const { mode, setMode, setRemoteConfig, isConnected, connectionError } = useDatabase()
  const { theme, toggleTheme } = useTheme()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLastError(null)
    
    console.log('🔐 Login attempt:', { email: loginData.email, mode })
    
    try {
      const result = await login(loginData.email, loginData.password)
      if (result.success) {
        toast.success('Login effettuato con successo!')
      } else {
        const errorMessage = result.error || 'Credenziali non valide'
        console.error('❌ Login failed:', errorMessage)
        setLastError({ type: 'login', message: errorMessage })
        toast.error(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Errore durante il login'
      console.error('❌ Login error:', error)
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
    
    console.log('📝 Registration attempt:', { email: registerData.email, mode })
    
    try {
      const result = await register(registerData.email, registerData.password)
      if (result.success) {
        toast.success('Registrazione completata con successo!')
      } else {
        const errorMessage = result.error || 'Errore durante la registrazione'
        console.error('❌ Registration failed:', errorMessage)
        setLastError({ type: 'register', message: errorMessage })
        toast.error(errorMessage)
        
        // If email already exists, suggest switching to login
        if (errorMessage.includes('già registrata') || errorMessage.includes('already registered')) {
          // Auto-fill login form with the same email
          setLoginData({ email: registerData.email, password: '' })
          // Switch to login tab after a short delay
          setTimeout(() => {
            setActiveTab('login')
          }, 2000)
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Errore durante la registrazione'
      console.error('❌ Registration error:', error)
      setLastError({ type: 'register', message: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getDatabaseCreationDate = () => {
    if (mode === 'local') {
      const data = localStorage.getItem('edilcheck_data')
      if (data) {
        try {
          const parsedData = JSON.parse(data)
          if (parsedData.workers && parsedData.workers.length > 0) {
            const firstWorker = parsedData.workers[0]
            if (firstWorker.created_at) {
              return new Date(firstWorker.created_at).toLocaleDateString('it-IT')
            }
          }
        } catch (error) {
          console.error('Error parsing database data:', error)
        }
      }
      return 'Non disponibile'
    } else {
      return 'Server remoto'
    }
  }

  const handleDeleteDatabase = () => {
    if (mode === 'local') {
      // Clear all local storage data
      localStorage.removeItem('edilcheck_data')
      localStorage.removeItem('edilcheck_users')
      localStorage.removeItem('edilcheck_user')
      localStorage.removeItem('edilcheck_token')
      
      // Clear any form errors
      setLastError(null)
      
      // Reset forms
      setLoginData({ email: '', password: '' })
      setRegisterData({ email: '', password: '', confirmPassword: '' })
      
      toast.success('Database locale cancellato con successo')
      console.log('🗑️ Local database cleared completely')
    } else {
      toast.error('Impossibile cancellare il database remoto da qui')
    }
  }

  const handleModeChange = (newMode: 'local' | 'remote') => {
    console.log(`🔄 Switching database mode: ${mode} → ${newMode}`)
    setMode(newMode)
    setLastError(null) // Clear errors when switching modes
    
    // Clear forms when switching modes
    setLoginData({ email: '', password: '' })
    setRegisterData({ email: '', password: '', confirmPassword: '' })
  }

  const handleRemoteConfigChange = (field: 'host' | 'port', value: string) => {
    const newConfig = { ...localRemoteConfig, [field]: value }
    setLocalRemoteConfig(newConfig)
    // Save to localStorage immediately but don't apply to database context yet
    localStorage.setItem('edilcheck_remote_config', JSON.stringify(newConfig))
  }

  const applyRemoteConfig = () => {
    console.log(`🔧 Applying remote config: ${localRemoteConfig.host}:${localRemoteConfig.port}`)
    setRemoteConfig(localRemoteConfig.host, localRemoteConfig.port)
    toast.success('Configurazione server aggiornata')
  }

  const testConnection = async () => {
    try {
      console.log(`🧪 Testing connection to ${localRemoteConfig.host}:${localRemoteConfig.port}`)
      const response = await fetch(`http://${localRemoteConfig.host}:${localRemoteConfig.port}/health`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Connection test successful:', data)
        toast.success('Connessione al server riuscita!')
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error)
      toast.error(`Impossibile connettersi al server: ${error.message}`)
    }
  }

  const renderErrorAlert = (tabType: 'login' | 'register') => {
    if (!lastError || lastError.type !== tabType) return null

    const isEmailAlreadyExists = lastError.message.includes('già registrata') || lastError.message.includes('already registered')
    const isInvalidCredentials = lastError.message.includes('Credenziali non valide') || lastError.message.includes('Invalid credentials')
    const isConnectionError = lastError.message.includes('connettersi al server') || lastError.message.includes('Failed to fetch')

    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p className="font-medium">{lastError.message}</p>
            {isEmailAlreadyExists && (
              <div className="space-y-1">
                <p className="text-sm">
                  Questa email è già registrata {mode === 'remote' ? 'sul server remoto' : 'nel database locale'}. 
                </p>
                <p className="text-sm">
                  Prova ad accedere con la tab "Accedi" usando la password corretta, 
                  oppure registra un nuovo account con un'email diversa.
                </p>
                {mode === 'remote' && (
                  <p className="text-sm font-medium">
                    💡 Suggerimento: Se vuoi iniziare da zero, passa al "Database Locale" 
                    e cancella i dati esistenti.
                  </p>
                )}
              </div>
            )}
            {isInvalidCredentials && (
              <p className="text-sm">
                La password non è corretta per questa email. Verifica di aver inserito la password giusta, 
                oppure registra un nuovo account con un'email diversa.
              </p>
            )}
            {isConnectionError && (
              <div className="text-sm space-y-1">
                <p>Problemi di connessione al server remoto. Verifica che:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Il server sia in esecuzione sulla porta {localRemoteConfig.port}</li>
                  <li>L'indirizzo {localRemoteConfig.host} sia corretto</li>
                  <li>Non ci siano firewall che bloccano la connessione</li>
                </ul>
                <p className="font-medium">
                  💡 Suggerimento: Passa al "Database Locale" per usare il sistema offline.
                </p>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const DatabaseInfoSection = () => (
    <div className="space-y-4 pt-4 border-t">
      <Label className="text-sm font-medium">Configurazione Database</Label>
      
      {/* Database Mode Selection */}
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

      {/* Remote Configuration */}
      {mode === 'remote' && (
        <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 text-orange-800">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Configurazione Server</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-orange-700">Host/IP</Label>
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
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-orange-600">
              Server: http://{localRemoteConfig.host}:{localRemoteConfig.port}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                className="text-xs h-7"
              >
                Test
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={applyRemoteConfig}
                className="text-xs h-7 bg-orange-100 hover:bg-orange-200"
              >
                Applica
              </Button>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs">
              <strong>Nota:</strong> Modifica la configurazione e clicca "Applica" per connetterti al server. 
              Se ricevi errori di "email già registrata", significa che l'account esiste già sul server.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Local Configuration */}
      {mode === 'local' && (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-600">
              I dati saranno salvati nel browser locale
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLastError(null)
                setLoginData({ email: '', password: '' })
                setRegisterData({ email: '', password: '', confirmPassword: '' })
              }}
              className="text-xs h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset Errori
            </Button>
          </div>
        </div>
      )}
      
      {/* Database Creation Date */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>
          {mode === 'local' 
            ? `Database creato: ${getDatabaseCreationDate()}`
            : `Server: ${localRemoteConfig.host}:${localRemoteConfig.port}`
          }
        </span>
      </div>
      
      {/* Delete Database Button */}
      {mode === 'local' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Cancella Database Locale
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma cancellazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler cancellare tutti i dati del database locale? 
                Questa azione eliminerà definitivamente tutti gli operai, cantieri, 
                ore di lavoro, pagamenti e utenti registrati. L'azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteDatabase}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancella Database
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )

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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
              
              <DatabaseInfoSection />
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                </Button>
              </form>
              
              <DatabaseInfoSection />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
