import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDatabase } from '@/contexts/DatabaseContext'
import { 
  Database, 
  Server, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  ArrowUpDown,
  Clock,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface DatabaseSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DatabaseSyncDialog({ open, onOpenChange }: DatabaseSyncDialogProps) {
  const { mode, setMode, isConnected, connectionError, syncStatus, syncDatabase, testConnection } = useDatabase()
  const [isChanging, setIsChanging] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<any>(null)

  const handleModeChange = async (newMode: 'local' | 'remote') => {
    setIsChanging(true)
    setMode(newMode)
    setTimeout(() => {
      setIsChanging(false)
    }, 2000)
  }

  const handleTestConnection = async () => {
    const connected = await testConnection()
    if (connected) {
      toast.success('Connessione al server riuscita!')
    } else {
      toast.error('Impossibile connettersi al server')
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const result = await syncDatabase()
      setLastSyncResult(result)
      
      if (result.success) {
        toast.success(`Sincronizzazione completata! ${result.localToRemote} → remoto, ${result.remoteToLocal} ← locale`)
      } else {
        toast.error(`Sincronizzazione fallita: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Errore sincronizzazione: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Mai'
    const date = new Date(lastSync)
    return date.toLocaleString('it-IT')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'syncing': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestione Database e Sincronizzazione
          </DialogTitle>
          <DialogDescription>
            Configura il database e sincronizza i dati tra locale e remoto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <span className="text-sm font-medium">
                  Modalità: {mode === 'local' ? 'Solo Locale' : 'Locale + Remoto'}
                </span>
                <p className="text-xs text-gray-600">
                  {isConnected ? 'Connesso' : 'Disconnesso'}
                </p>
              </div>
            </div>
            <Badge variant={mode === 'local' ? 'default' : 'secondary'}>
              {mode === 'local' ? 'Locale' : 'Ibrido'}
            </Badge>
          </div>

          {/* Connection Error */}
          {connectionError && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Avviso</p>
                <p>{connectionError}</p>
              </div>
            </div>
          )}

          {/* Database Mode Selection */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Modalità Database</h3>
            
            {/* Local Only Mode */}
            <Card className={`cursor-pointer transition-all ${mode === 'local' ? 'ring-2 ring-edil-blue' : 'hover:shadow-md'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Solo Locale</CardTitle>
                      <CardDescription className="text-sm">Tutti i dati nel browser</CardDescription>
                    </div>
                  </div>
                  {mode === 'local' && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span>Veloce e sempre disponibile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-blue-500" />
                    <span>Funziona offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Dati limitati al dispositivo</span>
                  </div>
                </div>
                <Button 
                  variant={mode === 'local' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => handleModeChange('local')}
                  disabled={isChanging}
                >
                  {mode === 'local' ? 'In Uso' : 'Usa Solo Locale'}
                </Button>
              </CardContent>
            </Card>

            {/* Hybrid Mode */}
            <Card className={`cursor-pointer transition-all ${mode === 'remote' ? 'ring-2 ring-edil-blue' : 'hover:shadow-md'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ArrowUpDown className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Locale + Remoto</CardTitle>
                      <CardDescription className="text-sm">Sincronizzazione automatica</CardDescription>
                    </div>
                  </div>
                  {mode === 'remote' && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Backup automatico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    <span>Condivisione tra dispositivi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-orange-500" />
                    <span>Richiede server remoto</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button 
                    variant={mode === 'remote' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handleModeChange('remote')}
                    disabled={isChanging}
                  >
                    {mode === 'remote' ? 'In Uso' : 'Usa Locale + Remoto'}
                  </Button>
                  {mode === 'remote' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={handleTestConnection}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Connessione
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sync Status and Controls */}
          {mode === 'remote' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sincronizzazione</h3>
              
              {/* Sync Status */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Stato Sincronizzazione</CardTitle>
                    <Badge className={getStatusColor(syncStatus.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(syncStatus.status)}
                        <span className="capitalize">{syncStatus.status}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Ultimo Sync</p>
                      <p className="font-medium">{formatLastSync(syncStatus.lastSync)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Conflitti</p>
                      <p className="font-medium">{syncStatus.conflicts}</p>
                    </div>
                  </div>
                  
                  {syncStatus.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      {syncStatus.error}
                    </div>
                  )}
                  
                  {syncStatus.status === 'syncing' && (
                    <div className="space-y-2">
                      <Progress value={50} className="h-2" />
                      <p className="text-sm text-gray-600">Sincronizzazione in corso...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sync Controls */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSync}
                  disabled={!isConnected || isSyncing || syncStatus.status === 'syncing'}
                  className="flex-1"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizzando...
                    </>
                  ) : (
                    <>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sincronizza Ora
                    </>
                  )}
                </Button>
              </div>

              {/* Last Sync Result */}
              {lastSyncResult && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Ultimo Risultato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Locale → Remoto</p>
                        <p className="font-medium text-blue-600">{lastSyncResult.localToRemote}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Remoto → Locale</p>
                        <p className="font-medium text-green-600">{lastSyncResult.remoteToLocal}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Loading State */}
          {isChanging && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-edil-blue"></div>
              <span className="ml-2 text-sm">Cambiando configurazione...</span>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}