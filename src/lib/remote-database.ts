
// Client per database remoto
import { Worker, Site, TimeEntry, Payment } from './local-database'

interface RemoteConfig {
  host: string
  port: string
  credentials?: {
    email: string
    password: string
  }
}

class RemoteDatabase {
  private config: RemoteConfig

  constructor(config: RemoteConfig) {
    this.config = config
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `http://${this.config.host}:${this.config.port}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    }

    // Aggiungi credenziali se disponibili
    if (this.config.credentials) {
      headers['X-User-Email'] = this.config.credentials.email
      headers['X-User-Password'] = this.config.credentials.password
    }

    try {
      console.log(`🌐 Remote API: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
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
      console.log('✅ Remote API success:', data)
      return data
    } catch (error: any) {
      console.error('❌ Remote API error:', error)
      if (error.message === 'Failed to fetch') {
        throw new Error(`Impossibile connettersi al server ${this.config.host}:${this.config.port}`)
      }
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/health')
      return true
    } catch {
      return false
    }
  }

  setCredentials(email: string, password: string): void {
    this.config.credentials = { email, password }
  }

  clearCredentials(): void {
    this.config.credentials = undefined
  }

  // Auth
  async register(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      
      if (response.success) {
        this.setCredentials(email, password)
        return { success: true, user: response.user }
      }
      
      return { success: false, error: response.error || 'Registrazione fallita' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      
      if (response.success) {
        this.setCredentials(email, password)
        return { success: true, user: response.user }
      }
      
      return { success: false, error: response.error || 'Login fallito' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    this.clearCredentials()
  }

  // Workers
  async getWorkers(): Promise<Worker[]> {
    return await this.request('/workers')
  }

  async addWorker(worker: Omit<Worker, 'id' | 'created_at'>): Promise<Worker> {
    return await this.request('/workers', {
      method: 'POST',
      body: JSON.stringify({
        name: worker.name,
        role: worker.role,
        phone: worker.phone,
        email: worker.email,
        status: worker.status,
        hourlyRate: worker.hourlyRate
      })
    })
  }

  async updateWorker(id: number, worker: Partial<Worker>): Promise<Worker> {
    return await this.request(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(worker)
    })
  }

  async deleteWorker(id: number): Promise<void> {
    await this.request(`/workers/${id}`, { method: 'DELETE' })
  }

  // Sites
  async getSites(): Promise<Site[]> {
    return await this.request('/sites')
  }

  async addSite(site: Omit<Site, 'id' | 'created_at'>): Promise<Site> {
    return await this.request('/sites', {
      method: 'POST',
      body: JSON.stringify({
        name: site.name,
        owner: site.owner,
        address: site.address,
        status: site.status,
        startDate: site.startDate,
        estimatedEnd: site.estimatedEnd
      })
    })
  }

  async updateSite(id: number, site: Partial<Site>): Promise<Site> {
    return await this.request(`/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(site)
    })
  }

  async deleteSite(id: number): Promise<void> {
    await this.request(`/sites/${id}`, { method: 'DELETE' })
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntry[]> {
    return await this.request('/time-entries')
  }

  async addTimeEntry(entry: Omit<TimeEntry, 'id' | 'created_at' | 'workerName' | 'siteName'>): Promise<TimeEntry> {
    return await this.request('/time-entries', {
      method: 'POST',
      body: JSON.stringify(entry)
    })
  }

  async updateTimeEntry(id: number, entry: Partial<TimeEntry>): Promise<TimeEntry> {
    return await this.request(`/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry)
    })
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await this.request(`/time-entries/${id}`, { method: 'DELETE' })
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return await this.request('/payments')
  }

  async addPayment(payment: Omit<Payment, 'id' | 'created_at' | 'workerName'>): Promise<Payment> {
    return await this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(payment)
    })
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment> {
    return await this.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payment)
    })
  }

  async deletePayment(id: number): Promise<void> {
    await this.request(`/payments/${id}`, { method: 'DELETE' })
  }

  // Dashboard
  async getDashboardStats(): Promise<{ activeWorkers: number; activeSites: number; pendingPayments: number; todayHours: number }> {
    try {
      return await this.request('/dashboard/stats')
    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      return { activeWorkers: 0, activeSites: 0, pendingPayments: 0, todayHours: 0 }
    }
  }
}

export { RemoteDatabase }
export type { RemoteConfig }
