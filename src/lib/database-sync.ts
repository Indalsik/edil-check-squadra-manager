// Sistema di backup semplificato - copia diretta dei dati senza autenticazione
import { localDatabase } from './local-database'

export interface SyncStatus {
  isRemoteAvailable: boolean
  lastBackup: string | null
  lastRestore: string | null
  localCount: number
  remoteCount: number
  status: 'idle' | 'backing-up' | 'restoring' | 'error' | 'success'
  error?: string
}

export interface SyncResult {
  success: boolean
  error?: string
  itemsProcessed: number
  conflicts: number
  operation: 'backup' | 'restore'
}

interface RemoteConfig {
  host: string
  port: string
}

class DatabaseSync {
  private remoteConfig: RemoteConfig = { host: 'localhost', port: '3002' }
  private syncStatus: SyncStatus = {
    isRemoteAvailable: false,
    lastBackup: null,
    lastRestore: null,
    localCount: 0,
    remoteCount: 0,
    status: 'idle'
  }
  private listeners: ((status: SyncStatus) => void)[] = []

  constructor() {
    // Carica timestamp dal localStorage
    const lastBackup = localStorage.getItem('edilcheck_last_backup')
    const lastRestore = localStorage.getItem('edilcheck_last_restore')
    if (lastBackup) this.syncStatus.lastBackup = lastBackup
    if (lastRestore) this.syncStatus.lastRestore = lastRestore
  }

  // Configura server remoto
  setRemoteConfig(config: RemoteConfig): void {
    this.remoteConfig = config
    this.testConnection()
  }

  private getBaseUrl(): string {
    return `http://${this.remoteConfig.host}:${this.remoteConfig.port}`
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`
    
    try {
      console.log(`🌐 Backup API: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        mode: 'cors'
      })

      console.log(`📡 Response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ Backup API success')
      return data
    } catch (error: any) {
      console.error('❌ Backup API error:', error)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`Server backup non raggiungibile su ${this.remoteConfig.host}:${this.remoteConfig.port}`)
      }
      throw error
    }
  }

  // Test connessione remota
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing backup server connection:', this.getBaseUrl())
      const response = await this.request('/health')
      console.log('✅ Backup server connection successful:', response)
      this.updateStatus({ isRemoteAvailable: true, error: undefined })
      return true
    } catch (error: any) {
      console.error('❌ Backup server connection failed:', error)
      this.updateStatus({ 
        isRemoteAvailable: false, 
        error: `Server backup non disponibile: ${error.message}` 
      })
      return false
    }
  }

  // Aggiorna status e notifica listeners
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates }
    this.listeners.forEach(listener => listener(this.syncStatus))
  }

  // Aggiungi listener per status updates
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Ottieni status corrente
  getStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  // BACKUP: Invia tutti i dati locali al server per il backup
  async backupToRemote(userEmail: string): Promise<SyncResult> {
    if (!this.syncStatus.isRemoteAvailable) {
      throw new Error('Server backup non disponibile')
    }

    this.updateStatus({ status: 'backing-up', error: undefined })

    try {
      console.log('💾 Starting backup to server for user:', userEmail)
      
      // Raccogli tutti i dati locali
      const workers = localDatabase.getWorkers(userEmail)
      const sites = localDatabase.getSites(userEmail)
      const timeEntries = localDatabase.getTimeEntries(userEmail)
      const payments = localDatabase.getPayments(userEmail)

      // Prepara il payload del backup
      const backupData = {
        userEmail,
        timestamp: new Date().toISOString(),
        data: {
          workers: workers.map(w => {
            const { id, ...workerData } = w
            return workerData
          }),
          sites: sites.map(s => {
            const { id, ...siteData } = s
            return siteData
          }),
          timeEntries: timeEntries.map(te => {
            const { id, workerName, siteName, ...entryData } = te
            return entryData
          }),
          payments: payments.map(p => {
            const { id, workerName, ...paymentData } = p
            return paymentData
          })
        }
      }

      console.log('💾 Backup data prepared:', {
        workers: backupData.data.workers.length,
        sites: backupData.data.sites.length,
        timeEntries: backupData.data.timeEntries.length,
        payments: backupData.data.payments.length
      })

      // Invia il backup al server
      await this.request('/backup', {
        method: 'POST',
        body: JSON.stringify(backupData)
      })

      const totalItems = workers.length + sites.length + timeEntries.length + payments.length

      // Aggiorna timestamp backup
      const now = new Date().toISOString()
      localStorage.setItem('edilcheck_last_backup', now)

      this.updateStatus({ 
        status: 'success',
        lastBackup: now,
        localCount: totalItems
      })

      console.log('✅ Backup completed successfully')
      return {
        success: true,
        itemsProcessed: totalItems,
        conflicts: 0,
        operation: 'backup'
      }

    } catch (error: any) {
      console.error('❌ Backup failed:', error)
      this.updateStatus({ 
        status: 'error', 
        error: error.message 
      })
      return {
        success: false,
        error: error.message,
        itemsProcessed: 0,
        conflicts: 0,
        operation: 'backup'
      }
    }
  }

  // RESTORE: Scarica i dati dal server e li ripristina localmente
  async restoreFromRemote(userEmail: string): Promise<SyncResult> {
    if (!this.syncStatus.isRemoteAvailable) {
      throw new Error('Server backup non disponibile')
    }

    this.updateStatus({ status: 'restoring', error: undefined })

    try {
      console.log('📥 Starting restore from server for user:', userEmail)
      
      // Richiedi i dati dal server
      const backupData = await this.request(`/restore/${encodeURIComponent(userEmail)}`)

      if (!backupData || !backupData.data) {
        throw new Error('Nessun backup trovato per questo utente')
      }

      console.log('📥 Backup data received:', {
        workers: backupData.data.workers?.length || 0,
        sites: backupData.data.sites?.length || 0,
        timeEntries: backupData.data.timeEntries?.length || 0,
        payments: backupData.data.payments?.length || 0
      })

      let itemsProcessed = 0
      let conflicts = 0

      // Pulisci i dati locali esistenti (opzionale - potresti voler fare un merge)
      console.log('🗑️ Clearing existing local data...')
      localDatabase.clearUserData(userEmail)

      // Ripristina Workers
      if (backupData.data.workers) {
        for (const worker of backupData.data.workers) {
          try {
            localDatabase.addWorker(userEmail, worker)
            itemsProcessed++
          } catch (error) {
            conflicts++
            console.warn('⚠️ Conflict restoring worker:', worker.name, error)
          }
        }
      }

      // Ripristina Sites
      if (backupData.data.sites) {
        for (const site of backupData.data.sites) {
          try {
            localDatabase.addSite(userEmail, site)
            itemsProcessed++
          } catch (error) {
            conflicts++
            console.warn('⚠️ Conflict restoring site:', site.name, error)
          }
        }
      }

      // Ripristina Time Entries
      if (backupData.data.timeEntries) {
        for (const entry of backupData.data.timeEntries) {
          try {
            localDatabase.addTimeEntry(userEmail, entry)
            itemsProcessed++
          } catch (error) {
            conflicts++
            console.warn('⚠️ Conflict restoring time entry:', entry.date, error)
          }
        }
      }

      // Ripristina Payments
      if (backupData.data.payments) {
        for (const payment of backupData.data.payments) {
          try {
            localDatabase.addPayment(userEmail, payment)
            itemsProcessed++
          } catch (error) {
            conflicts++
            console.warn('⚠️ Conflict restoring payment:', payment.week, error)
          }
        }
      }

      // Aggiorna timestamp restore
      const now = new Date().toISOString()
      localStorage.setItem('edilcheck_last_restore', now)

      this.updateStatus({ 
        status: 'success',
        lastRestore: now,
        remoteCount: itemsProcessed
      })

      console.log('✅ Restore completed successfully')
      return {
        success: true,
        itemsProcessed,
        conflicts,
        operation: 'restore'
      }

    } catch (error: any) {
      console.error('❌ Restore failed:', error)
      this.updateStatus({ 
        status: 'error', 
        error: error.message 
      })
      return {
        success: false,
        error: error.message,
        itemsProcessed: 0,
        conflicts: 0,
        operation: 'restore'
      }
    }
  }
}

export const databaseSync = new DatabaseSync()