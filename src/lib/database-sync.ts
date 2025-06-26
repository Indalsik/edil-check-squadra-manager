// Sistema di sincronizzazione tra database locale e remoto
import { localDatabase } from './local-database'
import { RemoteDatabase } from './remote-database'

export interface SyncStatus {
  isConnected: boolean
  lastSync: string | null
  localCount: number
  remoteCount: number
  conflicts: number
  status: 'idle' | 'syncing' | 'error' | 'success'
  error?: string
}

export interface SyncResult {
  success: boolean
  error?: string
  localToRemote: number
  remoteToLocal: number
  conflicts: number
}

class DatabaseSync {
  private remoteDb: RemoteDatabase | null = null
  private syncStatus: SyncStatus = {
    isConnected: false,
    lastSync: null,
    localCount: 0,
    remoteCount: 0,
    conflicts: 0,
    status: 'idle'
  }
  private listeners: ((status: SyncStatus) => void)[] = []

  constructor() {
    // Carica ultimo sync dal localStorage
    const lastSync = localStorage.getItem('edilcheck_last_sync')
    if (lastSync) {
      this.syncStatus.lastSync = lastSync
    }
  }

  // Configura database remoto
  setRemoteDatabase(remoteDb: RemoteDatabase): void {
    this.remoteDb = remoteDb
    this.testConnection()
  }

  // Test connessione remota
  async testConnection(): Promise<boolean> {
    if (!this.remoteDb) {
      this.updateStatus({ isConnected: false, error: 'Database remoto non configurato' })
      return false
    }

    try {
      const connected = await this.remoteDb.testConnection()
      this.updateStatus({ 
        isConnected: connected,
        error: connected ? undefined : 'Server remoto non raggiungibile'
      })
      return connected
    } catch (error: any) {
      this.updateStatus({ 
        isConnected: false, 
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
    // Ritorna funzione per rimuovere listener
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

  // Sincronizzazione completa
  async syncAll(userEmail: string): Promise<SyncResult> {
    if (!this.remoteDb || !this.syncStatus.isConnected) {
      throw new Error('Database remoto non disponibile')
    }

    this.updateStatus({ status: 'syncing', error: undefined })

    try {
      console.log('🔄 Starting full database sync...')
      
      let localToRemote = 0
      let remoteToLocal = 0
      let conflicts = 0

      // Sync Workers
      const workersResult = await this.syncWorkers(userEmail)
      localToRemote += workersResult.localToRemote
      remoteToLocal += workersResult.remoteToLocal
      conflicts += workersResult.conflicts

      // Sync Sites
      const sitesResult = await this.syncSites(userEmail)
      localToRemote += sitesResult.localToRemote
      remoteToLocal += sitesResult.remoteToLocal
      conflicts += sitesResult.conflicts

      // Sync Time Entries
      const timeEntriesResult = await this.syncTimeEntries(userEmail)
      localToRemote += timeEntriesResult.localToRemote
      remoteToLocal += timeEntriesResult.remoteToLocal
      conflicts += timeEntriesResult.conflicts

      // Sync Payments
      const paymentsResult = await this.syncPayments(userEmail)
      localToRemote += paymentsResult.localToRemote
      remoteToLocal += paymentsResult.remoteToLocal
      conflicts += paymentsResult.conflicts

      // Aggiorna timestamp ultimo sync
      const now = new Date().toISOString()
      localStorage.setItem('edilcheck_last_sync', now)

      this.updateStatus({ 
        status: 'success',
        lastSync: now,
        conflicts
      })

      console.log('✅ Sync completed successfully')
      return {
        success: true,
        localToRemote,
        remoteToLocal,
        conflicts
      }

    } catch (error: any) {
      console.error('❌ Sync failed:', error)
      this.updateStatus({ 
        status: 'error', 
        error: error.message 
      })
      return {
        success: false,
        error: error.message,
        localToRemote: 0,
        remoteToLocal: 0,
        conflicts: 0
      }
    }
  }

  // Sync Workers
  private async syncWorkers(userEmail: string): Promise<SyncResult> {
    console.log('🔄 Syncing workers...')
    
    const localWorkers = localDatabase.getWorkers(userEmail)
    const remoteWorkers = await this.remoteDb!.getWorkers()

    let localToRemote = 0
    let remoteToLocal = 0
    let conflicts = 0

    // Crea mappa per confronto
    const localMap = new Map(localWorkers.map(w => [w.email, w]))
    const remoteMap = new Map(remoteWorkers.map(w => [w.email, w]))

    // Sync da locale a remoto (nuovi o più recenti)
    for (const localWorker of localWorkers) {
      const remoteWorker = remoteMap.get(localWorker.email)
      
      if (!remoteWorker) {
        // Nuovo worker locale -> crea su remoto
        try {
          await this.remoteDb!.addWorker(localWorker)
          localToRemote++
          console.log(`➡️ Created worker on remote: ${localWorker.name}`)
        } catch (error) {
          console.error(`❌ Failed to create worker on remote: ${localWorker.name}`, error)
        }
      } else if (new Date(localWorker.created_at) > new Date(remoteWorker.created_at)) {
        // Worker locale più recente -> aggiorna remoto
        try {
          await this.remoteDb!.updateWorker(remoteWorker.id, localWorker)
          localToRemote++
          console.log(`➡️ Updated worker on remote: ${localWorker.name}`)
        } catch (error) {
          console.error(`❌ Failed to update worker on remote: ${localWorker.name}`, error)
        }
      }
    }

    // Sync da remoto a locale (nuovi o più recenti)
    for (const remoteWorker of remoteWorkers) {
      const localWorker = localMap.get(remoteWorker.email)
      
      if (!localWorker) {
        // Nuovo worker remoto -> crea locale
        try {
          localDatabase.addWorker(userEmail, remoteWorker)
          remoteToLocal++
          console.log(`⬅️ Created worker locally: ${remoteWorker.name}`)
        } catch (error) {
          console.error(`❌ Failed to create worker locally: ${remoteWorker.name}`, error)
        }
      } else if (new Date(remoteWorker.created_at) > new Date(localWorker.created_at)) {
        // Worker remoto più recente -> aggiorna locale
        try {
          localDatabase.updateWorker(userEmail, localWorker.id, remoteWorker)
          remoteToLocal++
          console.log(`⬅️ Updated worker locally: ${remoteWorker.name}`)
        } catch (error) {
          console.error(`❌ Failed to update worker locally: ${remoteWorker.name}`, error)
        }
      }
    }

    return { success: true, localToRemote, remoteToLocal, conflicts }
  }

  // Sync Sites
  private async syncSites(userEmail: string): Promise<SyncResult> {
    console.log('🔄 Syncing sites...')
    
    const localSites = localDatabase.getSites(userEmail)
    const remoteSites = await this.remoteDb!.getSites()

    let localToRemote = 0
    let remoteToLocal = 0
    let conflicts = 0

    // Crea mappa per confronto (usando nome + indirizzo come chiave unica)
    const localMap = new Map(localSites.map(s => [`${s.name}_${s.address}`, s]))
    const remoteMap = new Map(remoteSites.map(s => [`${s.name}_${s.address}`, s]))

    // Sync da locale a remoto
    for (const localSite of localSites) {
      const key = `${localSite.name}_${localSite.address}`
      const remoteSite = remoteMap.get(key)
      
      if (!remoteSite) {
        try {
          await this.remoteDb!.addSite(localSite)
          localToRemote++
          console.log(`➡️ Created site on remote: ${localSite.name}`)
        } catch (error) {
          console.error(`❌ Failed to create site on remote: ${localSite.name}`, error)
        }
      } else if (new Date(localSite.created_at) > new Date(remoteSite.created_at)) {
        try {
          await this.remoteDb!.updateSite(remoteSite.id, localSite)
          localToRemote++
          console.log(`➡️ Updated site on remote: ${localSite.name}`)
        } catch (error) {
          console.error(`❌ Failed to update site on remote: ${localSite.name}`, error)
        }
      }
    }

    // Sync da remoto a locale
    for (const remoteSite of remoteSites) {
      const key = `${remoteSite.name}_${remoteSite.address}`
      const localSite = localMap.get(key)
      
      if (!localSite) {
        try {
          localDatabase.addSite(userEmail, remoteSite)
          remoteToLocal++
          console.log(`⬅️ Created site locally: ${remoteSite.name}`)
        } catch (error) {
          console.error(`❌ Failed to create site locally: ${remoteSite.name}`, error)
        }
      } else if (new Date(remoteSite.created_at) > new Date(localSite.created_at)) {
        try {
          localDatabase.updateSite(userEmail, localSite.id, remoteSite)
          remoteToLocal++
          console.log(`⬅️ Updated site locally: ${remoteSite.name}`)
        } catch (error) {
          console.error(`❌ Failed to update site locally: ${remoteSite.name}`, error)
        }
      }
    }

    return { success: true, localToRemote, remoteToLocal, conflicts }
  }

  // Sync Time Entries
  private async syncTimeEntries(userEmail: string): Promise<SyncResult> {
    console.log('🔄 Syncing time entries...')
    
    const localEntries = localDatabase.getTimeEntries(userEmail)
    const remoteEntries = await this.remoteDb!.getTimeEntries()

    let localToRemote = 0
    let remoteToLocal = 0
    let conflicts = 0

    // Crea mappa per confronto (usando workerId + date + startTime come chiave unica)
    const localMap = new Map(localEntries.map(e => [`${e.workerId}_${e.date}_${e.startTime}`, e]))
    const remoteMap = new Map(remoteEntries.map(e => [`${e.workerId}_${e.date}_${e.startTime}`, e]))

    // Sync da locale a remoto
    for (const localEntry of localEntries) {
      const key = `${localEntry.workerId}_${localEntry.date}_${localEntry.startTime}`
      const remoteEntry = remoteMap.get(key)
      
      if (!remoteEntry) {
        try {
          await this.remoteDb!.addTimeEntry(localEntry)
          localToRemote++
          console.log(`➡️ Created time entry on remote: ${localEntry.date}`)
        } catch (error) {
          console.error(`❌ Failed to create time entry on remote: ${localEntry.date}`, error)
        }
      } else if (new Date(localEntry.created_at) > new Date(remoteEntry.created_at)) {
        try {
          await this.remoteDb!.updateTimeEntry(remoteEntry.id, localEntry)
          localToRemote++
          console.log(`➡️ Updated time entry on remote: ${localEntry.date}`)
        } catch (error) {
          console.error(`❌ Failed to update time entry on remote: ${localEntry.date}`, error)
        }
      }
    }

    // Sync da remoto a locale
    for (const remoteEntry of remoteEntries) {
      const key = `${remoteEntry.workerId}_${remoteEntry.date}_${remoteEntry.startTime}`
      const localEntry = localMap.get(key)
      
      if (!localEntry) {
        try {
          localDatabase.addTimeEntry(userEmail, remoteEntry)
          remoteToLocal++
          console.log(`⬅️ Created time entry locally: ${remoteEntry.date}`)
        } catch (error) {
          console.error(`❌ Failed to create time entry locally: ${remoteEntry.date}`, error)
        }
      } else if (new Date(remoteEntry.created_at) > new Date(localEntry.created_at)) {
        try {
          localDatabase.updateTimeEntry(userEmail, localEntry.id, remoteEntry)
          remoteToLocal++
          console.log(`⬅️ Updated time entry locally: ${remoteEntry.date}`)
        } catch (error) {
          console.error(`❌ Failed to update time entry locally: ${remoteEntry.date}`, error)
        }
      }
    }

    return { success: true, localToRemote, remoteToLocal, conflicts }
  }

  // Sync Payments
  private async syncPayments(userEmail: string): Promise<SyncResult> {
    console.log('🔄 Syncing payments...')
    
    const localPayments = localDatabase.getPayments(userEmail)
    const remotePayments = await this.remoteDb!.getPayments()

    let localToRemote = 0
    let remoteToLocal = 0
    let conflicts = 0

    // Crea mappa per confronto (usando workerId + week come chiave unica)
    const localMap = new Map(localPayments.map(p => [`${p.workerId}_${p.week}`, p]))
    const remoteMap = new Map(remotePayments.map(p => [`${p.workerId}_${p.week}`, p]))

    // Sync da locale a remoto
    for (const localPayment of localPayments) {
      const key = `${localPayment.workerId}_${localPayment.week}`
      const remotePayment = remoteMap.get(key)
      
      if (!remotePayment) {
        try {
          await this.remoteDb!.addPayment(localPayment)
          localToRemote++
          console.log(`➡️ Created payment on remote: ${localPayment.week}`)
        } catch (error) {
          console.error(`❌ Failed to create payment on remote: ${localPayment.week}`, error)
        }
      } else if (new Date(localPayment.created_at) > new Date(remotePayment.created_at)) {
        try {
          await this.remoteDb!.updatePayment(remotePayment.id, localPayment)
          localToRemote++
          console.log(`➡️ Updated payment on remote: ${localPayment.week}`)
        } catch (error) {
          console.error(`❌ Failed to update payment on remote: ${localPayment.week}`, error)
        }
      }
    }

    // Sync da remoto a locale
    for (const remotePayment of remotePayments) {
      const key = `${remotePayment.workerId}_${remotePayment.week}`
      const localPayment = localMap.get(key)
      
      if (!localPayment) {
        try {
          localDatabase.addPayment(userEmail, remotePayment)
          remoteToLocal++
          console.log(`⬅️ Created payment locally: ${remotePayment.week}`)
        } catch (error) {
          console.error(`❌ Failed to create payment locally: ${remotePayment.week}`, error)
        }
      } else if (new Date(remotePayment.created_at) > new Date(localPayment.created_at)) {
        try {
          localDatabase.updatePayment(userEmail, localPayment.id, remotePayment)
          remoteToLocal++
          console.log(`⬅️ Updated payment locally: ${remotePayment.week}`)
        } catch (error) {
          console.error(`❌ Failed to update payment locally: ${remotePayment.week}`, error)
        }
      }
    }

    return { success: true, localToRemote, remoteToLocal, conflicts }
  }

  // Sync automatico all'avvio
  async autoSync(userEmail: string): Promise<void> {
    if (!this.remoteDb) return

    try {
      const connected = await this.testConnection()
      if (connected) {
        console.log('🔄 Starting auto-sync...')
        await this.syncAll(userEmail)
      } else {
        console.log('⚠️ Auto-sync skipped: remote database not available')
      }
    } catch (error) {
      console.error('❌ Auto-sync failed:', error)
    }
  }
}

export const databaseSync = new DatabaseSync()