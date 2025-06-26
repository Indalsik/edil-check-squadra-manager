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
  Upload,
  Download,
  Clock,
  Zap,
  Shield,
  HardDrive
} from 'lucide-react'
import { toast } from 'sonner'

interface DatabaseSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DatabaseSyncDialog({ open, onOpenChange }: DatabaseSyncDialogProps) {
  const { 
    mode, 
    setMode, 
    isRemoteAvailable, 
    connectionError, 
    syncStatus, 
    backupToRemote, 
    restoreFromRemote, 
    testRemoteConnection 
  } = useDatabase()
  
  const [isChanging, setIsChanging] = useState(false)
  const [isOperating, setIsOperating] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const handleModeChange = async (newMode: 'local-only' | 'local-with-backup') => {
    setIsChanging(true)
    setMode(newMode)
    setTimeout(() => {
      setIsChanging(false)
    }, 2000)
  }

  const handleTestConnection = async () => {
    const connected = await testRemoteConnection()
    if (connected) {
      toast.success('Server remoto raggiungibile!')
    } else {
      toast.error('Server remoto non raggiungibile')
    }
  }

  const handleBackup = async () => {
    setIsOperating(true)
    try {
      const result = await backupToRemote()
      setLastResult(result)
      
      if (result.success) {
        toast.success(`Backup completato! ${result.itemsProcessed} elementi salvati`)
      } else {
        toast.error(`Backup fallito: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Errore backup: ${error.message}`)
    } finally {
      setIsOperating(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('Sei sicuro di voler ripristinare i dati dal server remoto? Questo potrebbe sovrascrivere i dati locali.')) {
      return
    }

    setIsOperating(true)
    try {
      const result = await restoreFromRemote()
      setLastResult(result)
      
      if (result.success) {
        toast.success(`Ripristino completato! ${result.itemsProcessed} elementi ripristinati`)
      } else {
        toast.error(`Ripristino fallito: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Errore ripristino: ${error.message}`)
    } finally {
      setIsOperating(false)
    }
  }

  const formatLastOperation = (timestamp: string | null) => {
    if (!timestamp) return 'Mai'
    const date = new Date(timestamp)
    return date.toLocaleString('it-IT')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'backing-up': 
      case 'restoring': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'backing-up': 
      case 'restoring': return <RefreshCw className="h-4 w-4 animate-spin" />
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
            Database Local-First con Backup Remoto
          </DialogTitle>
          <DialogDescription>
            Il database è sempre locale per velocità. Il server remoto serve solo per backup e sincronizzazione multi-device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-sm font-medium">
                  Database: Sempre Locale
                </span>
                <p className="text-xs text-gray-600">
                  Backup: {mode === 'local-only' ? 'Disabilitato' : isRemoteAvailable ? 'Disponibile' : 'Non disponibile'}
                </p>
              </div>
            </div>
            <Badge variant={mode === 'local-only' ? 'default' : 'secondary'}>
              {mode === 'local-only' ? 'Solo Locale' : 'Con Backup'}
            </Badge>
          </div>

          {/* Connection Status */}
          {mode === 'local-with-backup' && connectionError && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Server Backup</p>
                <p>{connectionError}</p>
              </div>
            </div>
          )}

          {/* Database Mode Selection */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Modalità Database</h3>
            
            {/* Local Only Mode */}
            <Card className={`cursor-pointer transition-all ${mode === 'local-only' ? 'ring-2 ring-edil-blue' : 'hover:shadow-md'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <HardDrive className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Solo Locale</CardTitle>
                      <CardDescription className="text-sm">Database sempre nel browser</CardDescription>
                    </div>
                  </div>
                  {mode === 'local-only' && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span>Velocità massima</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-blue-500" />
                    <span>Funziona sempre offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Dati privati nel dispositivo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Nessun backup automatico</span>
                  </div>
                </div>
                <Button 
                  variant={mode === 'local-only' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => handleModeChange('local-only')}
                  disabled={isChanging}
                >
                  {mode === 'local-only' ? 'In Uso' : 'Usa Solo Locale'}
                </Button>
              </CardContent>
            </Card>

            {/* Local with Backup Mode */}
            <Card className={`cursor-pointer transition-all ${mode === 'local-with-backup' ? 'ring-2 ring-edil-blue' : 'hover:shadow-md'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Server className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Locale + Backup</CardTitle>
                      <CardDescription className="text-sm">Database locale con backup remoto</CardDescription>
                    </div>
                  </div>
                  {mode === 'local-with-backup' && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span>Database sempre locale (veloce)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-500" />
                    <span>Backup manuale su server</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-green-500" />
                    <span>Ripristino da altri dispositivi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-orange-500" />
                    <span>Richiede server per backup</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button 
                    variant={mode === 'local-with-backup' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handleModeChange('local-with-backup')}
                    disabled={isChanging}
                  >
                    {mode === 'local-with-backup' ? 'In Uso' : 'Abilita Backup'}
                  </Button>
                  {mode === 'local-with-backup' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={handleTestConnection}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Server Backup
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backup Controls */}
          {mode === 'local-with-backup' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Backup e Ripristino</h3>
              
              {/* Backup Status */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Stato Backup</CardTitle>
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
                      <p className="text-gray-600">Ultimo Backup</p>
                      <p className="font-medium">{formatLastOperation(syncStatus.lastBackup)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ultimo Ripristino</p>
                      <p className="font-medium">{formatLastOperation(syncStatus.lastRestore)}</p>
                    </div>
                  </div>
                  
                  {syncStatus.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      {syncStatus.error}
                    </div>
                  )}
                  
                  {(syncStatus.status === 'backing-up' || syncStatus.status === 'restoring') && (
                    <div className="space-y-2">
                      <Progress value={50} className="h-2" />
                      <p className="text-sm text-gray-600">
                        {syncStatus.status === 'backing-up' ? 'Backup in corso...' : 'Ripristino in corso...'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Backup Controls */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleBackup}
                  disabled={!isRemoteAvailable || isOperating || syncStatus.status === 'backing-up'}
                  variant="outline"
                  className="flex-1"
                >
                  {syncStatus.status === 'backing-up' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Backup...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Backup
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleRestore}
                  disabled={!isRemoteAvailable || isOperating || syncStatus.status === 'restoring'}
                  variant="outline"
                  className="flex-1"
                >
                  {syncStatus.status === 'restoring' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Ripristino...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Ripristina
                    </>
                  )}
                </Button>
              </div>

              {/* Last Operation Result */}
              {lastResult && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Ultimo {lastResult.operation === 'backup' ? 'Backup' : 'Ripristino'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Elementi Processati</p>
                        <p className="font-medium text-blue-600">{lastResult.itemsProcessed}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conflitti</p>
                        <p className="font-medium text-yellow-600">{lastResult.conflicts}</p>
                      </div>
                    </div>
                    {lastResult.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        {lastResult.error}
                      </div>
                    )}
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