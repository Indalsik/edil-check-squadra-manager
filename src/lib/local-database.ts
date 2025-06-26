
// Database locale usando localStorage
export interface DatabaseData {
  workers: Worker[]
  sites: Site[]
  timeEntries: TimeEntry[]
  payments: Payment[]
  nextId: number
}

export interface Worker {
  id: number
  name: string
  role: string
  phone: string
  email: string
  status: string
  hourlyRate: number
  created_at: string
}

export interface Site {
  id: number
  name: string
  owner: string
  address: string
  status: string
  startDate: string
  estimatedEnd: string
  created_at: string
}

export interface TimeEntry {
  id: number
  workerId: number
  siteId: number
  date: string
  startTime: string
  endTime: string
  totalHours: number
  status: string
  workerName?: string
  siteName?: string
  created_at: string
}

export interface Payment {
  id: number
  workerId: number
  week: string
  hours: number
  hourlyRate: number
  totalAmount: number
  overtime: number
  status: string
  paidDate?: string
  method?: string
  workerName?: string
  created_at: string
}

class LocalDatabase {
  private getStorageKey(userId: string): string {
    return `edilcheck_data_${userId}`
  }

  private loadUserData(userId: string): DatabaseData {
    const key = this.getStorageKey(userId)
    const stored = localStorage.getItem(key)
    
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Error parsing stored data:', error)
      }
    }

    // Dati di esempio iniziali
    return {
      workers: [
        {
          id: 1,
          name: "Marco Rossi",
          role: "Muratore",
          phone: "+39 333 1234567",
          email: "marco.rossi@email.com",
          status: "Attivo",
          hourlyRate: 18.50,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: "Giuseppe Bianchi",
          role: "Elettricista",
          phone: "+39 333 2345678",
          email: "giuseppe.bianchi@email.com",
          status: "Attivo",
          hourlyRate: 22.00,
          created_at: new Date().toISOString()
        }
      ],
      sites: [
        {
          id: 1,
          name: "Villa Moderna",
          owner: "Famiglia Rossi",
          address: "Via Roma 123, Milano",
          status: "Attivo",
          startDate: "2024-01-15",
          estimatedEnd: "2024-06-30",
          created_at: new Date().toISOString()
        }
      ],
      timeEntries: [
        {
          id: 1,
          workerId: 1,
          siteId: 1,
          date: new Date().toISOString().split('T')[0],
          startTime: "08:00",
          endTime: "17:00",
          totalHours: 8,
          status: "Confermato",
          created_at: new Date().toISOString()
        }
      ],
      payments: [
        {
          id: 1,
          workerId: 1,
          week: "Settimana 3/2024",
          hours: 40,
          hourlyRate: 18.50,
          totalAmount: 740,
          overtime: 0,
          status: "Da Pagare",
          created_at: new Date().toISOString()
        }
      ],
      nextId: 100
    }
  }

  private saveUserData(userId: string, data: DatabaseData): void {
    const key = this.getStorageKey(userId)
    localStorage.setItem(key, JSON.stringify(data))
  }

  private getNextId(userId: string): number {
    const data = this.loadUserData(userId)
    data.nextId++
    this.saveUserData(userId, data)
    return data.nextId - 1
  }

  // Workers
  getWorkers(userId: string): Worker[] {
    return this.loadUserData(userId).workers
  }

  addWorker(userId: string, worker: Omit<Worker, 'id' | 'created_at'>): Worker {
    const data = this.loadUserData(userId)
    const newWorker: Worker = {
      ...worker,
      id: this.getNextId(userId),
      created_at: new Date().toISOString()
    }
    data.workers.push(newWorker)
    this.saveUserData(userId, data)
    return newWorker
  }

  updateWorker(userId: string, id: number, updates: Partial<Worker>): Worker {
    const data = this.loadUserData(userId)
    const index = data.workers.findIndex(w => w.id === id)
    if (index === -1) throw new Error('Worker not found')
    
    data.workers[index] = { ...data.workers[index], ...updates }
    this.saveUserData(userId, data)
    return data.workers[index]
  }

  deleteWorker(userId: string, id: number): void {
    const data = this.loadUserData(userId)
    data.workers = data.workers.filter(w => w.id !== id)
    data.timeEntries = data.timeEntries.filter(te => te.workerId !== id)
    data.payments = data.payments.filter(p => p.workerId !== id)
    this.saveUserData(userId, data)
  }

  // Sites
  getSites(userId: string): Site[] {
    return this.loadUserData(userId).sites
  }

  addSite(userId: string, site: Omit<Site, 'id' | 'created_at'>): Site {
    const data = this.loadUserData(userId)
    const newSite: Site = {
      ...site,
      id: this.getNextId(userId),
      created_at: new Date().toISOString()
    }
    data.sites.push(newSite)
    this.saveUserData(userId, data)
    return newSite
  }

  updateSite(userId: string, id: number, updates: Partial<Site>): Site {
    const data = this.loadUserData(userId)
    const index = data.sites.findIndex(s => s.id === id)
    if (index === -1) throw new Error('Site not found')
    
    data.sites[index] = { ...data.sites[index], ...updates }
    this.saveUserData(userId, data)
    return data.sites[index]
  }

  deleteSite(userId: string, id: number): void {
    const data = this.loadUserData(userId)
    data.sites = data.sites.filter(s => s.id !== id)
    data.timeEntries = data.timeEntries.filter(te => te.siteId !== id)
    this.saveUserData(userId, data)
  }

  // Time Entries
  getTimeEntries(userId: string): TimeEntry[] {
    const data = this.loadUserData(userId)
    return data.timeEntries.map(entry => {
      const worker = data.workers.find(w => w.id === entry.workerId)
      const site = data.sites.find(s => s.id === entry.siteId)
      return {
        ...entry,
        workerName: worker?.name || 'Unknown',
        siteName: site?.name || 'Unknown'
      }
    })
  }

  addTimeEntry(userId: string, entry: Omit<TimeEntry, 'id' | 'created_at' | 'workerName' | 'siteName'>): TimeEntry {
    const data = this.loadUserData(userId)
    const newEntry: TimeEntry = {
      ...entry,
      id: this.getNextId(userId),
      created_at: new Date().toISOString()
    }
    data.timeEntries.push(newEntry)
    this.saveUserData(userId, data)
    
    const worker = data.workers.find(w => w.id === entry.workerId)
    const site = data.sites.find(s => s.id === entry.siteId)
    return {
      ...newEntry,
      workerName: worker?.name || 'Unknown',
      siteName: site?.name || 'Unknown'
    }
  }

  updateTimeEntry(userId: string, id: number, updates: Partial<TimeEntry>): TimeEntry {
    const data = this.loadUserData(userId)
    const index = data.timeEntries.findIndex(te => te.id === id)
    if (index === -1) throw new Error('Time entry not found')
    
    data.timeEntries[index] = { ...data.timeEntries[index], ...updates }
    this.saveUserData(userId, data)
    
    const entry = data.timeEntries[index]
    const worker = data.workers.find(w => w.id === entry.workerId)
    const site = data.sites.find(s => s.id === entry.siteId)
    return {
      ...entry,
      workerName: worker?.name || 'Unknown',
      siteName: site?.name || 'Unknown'
    }
  }

  deleteTimeEntry(userId: string, id: number): void {
    const data = this.loadUserData(userId)
    data.timeEntries = data.timeEntries.filter(te => te.id !== id)
    this.saveUserData(userId, data)
  }

  // Payments
  getPayments(userId: string): Payment[] {
    const data = this.loadUserData(userId)
    return data.payments.map(payment => {
      const worker = data.workers.find(w => w.id === payment.workerId)
      return {
        ...payment,
        workerName: worker?.name || 'Unknown'
      }
    })
  }

  addPayment(userId: string, payment: Omit<Payment, 'id' | 'created_at' | 'workerName'>): Payment {
    const data = this.loadUserData(userId)
    const newPayment: Payment = {
      ...payment,
      id: this.getNextId(userId),
      created_at: new Date().toISOString()
    }
    data.payments.push(newPayment)
    this.saveUserData(userId, data)
    
    const worker = data.workers.find(w => w.id === payment.workerId)
    return {
      ...newPayment,
      workerName: worker?.name || 'Unknown'
    }
  }

  updatePayment(userId: string, id: number, updates: Partial<Payment>): Payment {
    const data = this.loadUserData(userId)
    const index = data.payments.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Payment not found')
    
    data.payments[index] = { ...data.payments[index], ...updates }
    this.saveUserData(userId, data)
    
    const payment = data.payments[index]
    const worker = data.workers.find(w => w.id === payment.workerId)
    return {
      ...payment,
      workerName: worker?.name || 'Unknown'
    }
  }

  deletePayment(userId: string, id: number): void {
    const data = this.loadUserData(userId)
    data.payments = data.payments.filter(p => p.id !== id)
    this.saveUserData(userId, data)
  }

  // Dashboard stats
  getDashboardStats(userId: string): { activeWorkers: number; activeSites: number; pendingPayments: number; todayHours: number } {
    const data = this.loadUserData(userId)
    const today = new Date().toISOString().split('T')[0]
    
    return {
      activeWorkers: data.workers.filter(w => w.status === 'Attivo').length,
      activeSites: data.sites.filter(s => s.status === 'Attivo').length,
      pendingPayments: data.payments.filter(p => p.status === 'Da Pagare').length,
      todayHours: data.timeEntries
        .filter(te => te.date === today)
        .reduce((sum, te) => sum + te.totalHours, 0)
    }
  }

  // Utility
  clearUserData(userId: string): void {
    const key = this.getStorageKey(userId)
    localStorage.removeItem(key)
  }
}

export const localDatabase = new LocalDatabase()
