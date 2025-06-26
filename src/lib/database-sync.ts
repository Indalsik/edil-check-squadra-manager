// Sistema di backup e sincronizzazione per database local-first
import { localDatabase } from './local-database'
import { RemoteDatabase } from './remote-database'

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

class DatabaseSync {
  private remoteDb: RemoteDatabase | null = null
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

  // Configura database remoto per backup
  setRemoteDatabase(remoteDb: RemoteDatabase): void {
    this.remoteDb = remoteDb
    this.testConnection()
  }

  // Test connessione remota
  async testConnection(): Promise<boolean> {
    if (!this.remoteDb) {
      this.updateStatus({ isRemoteAvailable: false, error: 'Database remoto non configurato' })
      return false
    }

    try {
      const connected = await this.remoteDb.testConnection()
      this.updateStatus({ 
        isRemoteAvailable: connected,
        error: connected ? undefined : 'Server remoto non raggiungibile'
      })
      return connected
    } catch (error: any) {
      this.updateStatus({ 
        isRemoteAvailable: false, 
        error: `Errore connessione: ${error.message}` 
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

  // BACKUP: Copia tutti i dati locali sul server remoto
  async backupToRemote(userEmail: string): Promise<SyncResult> {
    if (!this.remoteDb || !this.syncStatus.isRemoteAvailable) {
      throw new Error('Server remoto non disponibile per backup')
    }

    this.updateStatus({ status: 'backing-up', error: undefined })

    try {
      console.log('💾 Starting backup to remote server...')
      
      let itemsProcessed = 0
      let conflicts = 0

      // Backup Workers
      const workers = localDatabase.getWorkers(userEmail)
      for (const worker of workers) {
        try {
          await this.remoteDb.addWorker(worker)
          itemsProcessed++
          console.log(`💾 Backed up worker: ${worker.name}`)
        } catch (error: any) {
          if (error.message.includes('già esiste') || error.message.includes('duplicate')) {
            // Worker già esistente, prova aggiornamento
            try {
              const remoteWorkers = await this.remoteDb.getWorkers()
              const existing = remoteWorkers.find(w => w.email === worker.email)
              if (existing) {
                await this.remoteDb.updateWorker(existing.id, worker)
                itemsProcessed++
                console.log(`💾 Updated worker on remote: ${worker.name}`)
              }
            } catch (updateError) {
              conflicts++
              console.warn(`⚠️ Conflict backing up worker: ${worker.name}`)
            }
          } else {
            conflicts++
            console.error(`❌ Failed to backup worker: ${worker.name}`, error)
          }
        }
      }

      // Backup Sites
      const sites = localDatabase.getSites(userEmail)
      for (const site of sites) {
        try {
          await this.remoteDb.addSite(site)
          itemsProcessed++
          console.log(`💾 Backed up site: ${site.name}`)
        } catch (error: any) {
          if (error.message.includes('già esiste') || error.message.includes('duplicate')) {
            try {
              const remoteSites = await this.remoteDb.getSites()
              const existing = remoteSites.find(s => s.name === site.name && s.address === site.address)
              if (existing) {
                await this.remoteDb.updateSite(existing.id, site)
                itemsProcessed++
                console.log(`💾 Updated site on remote: ${site.name}`)
              }
            } catch (updateError) {
              conflicts++
              console.warn(`⚠️ Conflict backing up site: ${site.name}`)
            }
          } else {
            conflicts++
            console.error(`❌ Failed to backup site: ${site.name}`, error)
          }
        }
      }

      // Backup Time Entries
      const timeEntries = localDatabase.getTimeEntries(userEmail)
      for (const entry of timeEntries) {
        try {
          await this.remoteDb.addTimeEntry(entry)
          itemsProcessed++
          console.log(`💾 Backed up time entry: ${entry.date}`)
        } catch (error: any) {
          conflicts++
          console.warn(`⚠️ Conflict backing up time entry: ${entry.date}`)
        }
      }

      // Backup Payments
      const payments = localDatabase.getPayments(userEmail)
      for (const payment of payments) {
        try {
          await this.remoteDb.addPayment(payment)
          itemsProcessed++
          console.log(`💾 Backed up payment: ${payment.week}`)
        } catch (error: any) {
          conflicts++
          console.warn(`⚠️ Conflict backing up payment: ${payment.week}`)
        }
      }

      // Aggiorna timestamp backup
      const now = new Date().toISOString()
      localStorage.setItem('edilcheck_last_backup', now)

      this.updateStatus({ 
        status: 'success',
        lastBackup: now,
        localCount: workers.length + sites.length + timeEntries.length + payments.length
      })

      console.log('✅ Backup completed successfully')
      return {
        success: true,
        itemsProcessed,
        conflicts,
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

  // RESTORE: Scarica tutti i dati dal server remoto e li mette nel database locale
  async restoreFromRemote(userEmail: string): Promise<SyncResult> {
    if (!this.remoteDb || !this.syncStatus.isRemoteAvailable) {
      throw new Error('Server remoto non disponibile per ripristino')
    }

    this.updateStatus({ status: 'restoring', error: undefined })

    try {
      console.log('📥 Starting restore from remote server...')
      
      let itemsProcessed = 0
      let conflicts = 0

      // Restore Workers
      const remoteWorkers = await this.remoteDb.getWorkers()
      for (const worker of remoteWorkers) {
        try {
          localDatabase.addWorker(userEmail, worker)
          itemsProcessed++
          console.log(`📥 Restored worker: ${worker.name}`)
        } catch (error: any) {
          // Worker già esistente, prova aggiornamento
          try {
            const localWorkers = localDatabase.getWorkers(userEmail)
            const existing = localWorkers.find(w => w.email === worker.email)
            if (existing) {
              localDatabase.updateWorker(userEmail, existing.id, worker)
              itemsProcessed++
              console.log(`📥 Updated local worker: ${worker.name}`)
            }
          } catch (updateError) {
            conflicts++
            console.warn(`⚠️ Conflict restoring worker: ${worker.name}`)
          }
        }
      }

      // Restore Sites
      const remoteSites = await this.remoteDb.getSites()
      for (const site of remoteSites) {
        try {
          localDatabase.addSite(userEmail, site)
          itemsProcessed++
          console.log(`📥 Restored site: ${site.name}`)
        } catch (error: any) {
          try {
            const localSites = localDatabase.getSites(userEmail)
            const existing = localSites.find(s => s.name === site.name && s.address === site.address)
            if (existing) {
              localDatabase.updateSite(userEmail, existing.id, site)
              itemsProcessed++
              console.log(`📥 Updated local site: ${site.name}`)
            }
          } catch (updateError) {
            conflicts++
            console.warn(`⚠️ Conflict restoring site: ${site.name}`)
          }
        }
      }

      // Restore Time Entries
      const remoteTimeEntries = await this.remoteDb.getTimeEntries()
      for (const entry of remoteTimeEntries) {
        try {
          localDatabase.addTimeEntry(userEmail, entry)
          itemsProcessed++
          console.log(`📥 Restored time entry: ${entry.date}`)
        } catch (error: any) {
          conflicts++
          console.warn(`⚠️ Conflict restoring time entry: ${entry.date}`)
        }
      }

      // Restore Payments
      const remotePayments = await this.remoteDb.getPayments()
      for (const payment of remotePayments) {
        try {
          localDatabase.addPayment(userEmail, payment)
          itemsProcessed++
          console.log(`📥 Restored payment: ${payment.week}`)
        } catch (error: any) {
          conflicts++
          console.warn(`⚠️ Conflict restoring payment: ${payment.week}`)
        }
      }

      // Aggiorna timestamp restore
      const now = new Date().toISOString()
      localStorage.setItem('edilcheck_last_restore', now)

      this.updateStatus({ 
        status: 'success',
        lastRestore: now,
        remoteCount: remoteWorkers.length + remoteSites.length + remoteTimeEntries.length + remotePayments.length
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