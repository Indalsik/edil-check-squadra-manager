// Client per database remoto - completamente riscritto
import { Worker, Site, TimeEntry, Payment } from './local-database'

interface RemoteConfig {
  host: string
  port: string
}

class RemoteDatabase {
  private config: RemoteConfig
  private credentials: { email: string; password: string } | null = null

  constructor(config: RemoteConfig) {
    this.config = config
  }

  private getBaseUrl(): string {
    return `http://${this.config.host}:${this.config.port}`
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    }

    // Aggiungi credenziali se disponibili
    if (this.credentials) {
      headers['X-User-Email'] = this.credentials.email
      headers['X-User-Password'] = this.credentials.password
    }

    try {
      console.log(`🌐 Remote API: ${options.method || 'GET'} ${url}`)
      console.log('📤 Headers:', { ...headers, 'X-User-Password': headers['X-User-Password'] ? '[HIDDEN]' : 'not set' })
      
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors'
      })

      console.log(`📡 Response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.log('❌ Error response:', errorData)
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ Remote API success')
      return data
    } catch (error: any) {
      console.error('❌ Remote API error:', error)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`Impossibile connettersi al server ${this.config.host}:${this.config.port}. Verifica che il server sia avviato.`)
      }
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connection to:', this.getBaseUrl())
      const response = await this.request('/health')
      console.log('✅ Connection test successful:', response)
      return true
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      return false
    }
  }

  setCredentials(email: string, password: string): void {
    console.log('🔑 Setting credentials for:', email)
    this.credentials = { email, password }
  }

  clearCredentials(): void {
    console.log('🔑 Clearing credentials')
    this.credentials = null
  }

  // Auth
  async register(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      console.log('📝 Registering user:', email)
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      
      if (response.success) {
        console.log('✅ Registration successful')
        this.setCredentials(email, password)
        return { success: true, user: response.user }
      }
      
      return { success: false, error: response.error || 'Registrazione fallita' }
    } catch (error: any) {
      console.error('❌ Registration error:', error)
      return { success: false, error: error.message }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      console.log('🔐 Logging in user:', email)
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      
      if (response.success) {
        console.log('✅ Login successful')
        this.setCredentials(email, password)
        return { success: true, user: response.user }
      }
      
      return { success: false, error: response.error || 'Login fallito' }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      return { success: false, error: error.message }
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' })
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
    this.clearCredentials()
  }

  // Workers
  async getWorkers(): Promise<Worker[]> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request('/workers')
  }

  async addWorker(worker: Omit<Worker, 'id' | 'created_at'>): Promise<Worker> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
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
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(worker)
    })
  }

  async deleteWorker(id: number): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    await this.request(`/workers/${id}`, { method: 'DELETE' })
  }

  // Sites
  async getSites(): Promise<Site[]> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request('/sites')
  }

  async addSite(site: Omit<Site, 'id' | 'created_at'>): Promise<Site> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
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
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request(`/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(site)
    })
  }

  async deleteSite(id: number): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    await this.request(`/sites/${id}`, { method: 'DELETE' })
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntry[]> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request('/time-entries')
  }

  async addTimeEntry(entry: Omit<TimeEntry, 'id' | 'created_at' | 'workerName' | 'siteName'>): Promise<TimeEntry> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request('/time-entries', {
      method: 'POST',
      body: JSON.stringify(entry)
    })
  }

  async updateTimeEntry(id: number, entry: Partial<TimeEntry>): Promise<TimeEntry> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request(`/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry)
    })
  }

  async deleteTimeEntry(id: number): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    await this.request(`/time-entries/${id}`, { method: 'DELETE' })
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request('/payments')
  }

  async addPayment(payment: Omit<Payment, 'id' | 'created_at' | 'workerName'>): Promise<Payment> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(payment)
    })
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    return await this.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payment)
    })
  }

  async deletePayment(id: number): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
    await this.request(`/payments/${id}`, { method: 'DELETE' })
  }

  // Dashboard
  async getDashboardStats(): Promise<{ activeWorkers: number; activeSites: number; pendingPayments: number; todayHours: number }> {
    if (!this.credentials) {
      throw new Error('Credenziali non impostate')
    }
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