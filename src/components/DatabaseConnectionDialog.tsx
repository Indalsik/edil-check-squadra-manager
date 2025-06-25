import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDatabase } from '@/contexts/DatabaseContext'
import { Database, Server, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'

interface DatabaseConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DatabaseConnectionDialog({ open, onOpenChange }: DatabaseConnectionDialogProps) {
  const { mode, setMode, isConnected, connectionError } = useDatabase()
  const [isChanging, setIsChanging] = useState(false)

  const handleModeChange = async (newMode: 'local' | 'remote') => {
    setIsChanging(true)
    setMode(newMode)
    // Give some time for the connection to establish
    setTimeout(() => {
      setIsChanging(false)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurazione Database
          </DialogTitle>
          <DialogDescription>
            Scegli come salvare i tuoi dati: localmente nel browser o su un server remoto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                Stato: {isConnected ? 'Connesso' : 'Disconnesso'}
              </span>
            </div>
            <Badge variant={mode === 'local' ? 'default' : 'secondary'}>
              {mode === 'local' ? 'Locale' : 'Remoto'}
            </Badge>
          </div>

          {/* Connection Error */}
          {connectionError && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Avviso di connessione</p>
                <p>{connectionError}</p>
              </div>
            </div>
          )}

          {/* Database Options */}
          <div className="grid gap-4">
            {/* Local Database */}
            <Card className={`cursor-pointer transition-all ${mode === 'local' ? 'ring-2 ring-edil-blue' : 'hover:shadow-md'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Database Locale</CardTitle>
                      <CardDescription className="text-sm">Salva nel browser</CardDescription>
                    </div>
                  </div>
                  {mode === 'local' && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>Funziona offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Configurazione immediata</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Dati limitati al browser</span>
                  </div>
                </div>
                <Button 
                  variant={mode === 'local' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => handleModeChange('local')}
                  disabled={isChanging}
                >
                  {mode === 'local' ? 'In Uso' : 'Usa Database Locale'}
                </Button>
              </CardContent>
            </Card>

            {/* Remote Database */}
            <Card className={`cursor-pointer transition-all ${mode === 'remote' ? 'ring-2 ring-edil-blue' : 'hover:shadow-md'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Server className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Database Remoto</CardTitle>
                      <CardDescription className="text-sm">Server dedicato</CardDescription>
                    </div>
                  </div>
                  {mode === 'remote' && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Dati condivisi tra dispositivi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Backup automatico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span>Richiede connessione internet</span>
                  </div>
                </div>
                <Button 
                  variant={mode === 'remote' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => handleModeChange('remote')}
                  disabled={isChanging}
                >
                  {mode === 'remote' ? 'In Uso' : 'Usa Database Remoto'}
                </Button>
              </CardContent>
            </Card>
          </div>

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