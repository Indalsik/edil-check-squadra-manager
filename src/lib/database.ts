import { supabase } from './supabase'
import type { Worker, Site, TimeEntry, Payment } from './supabase'

class Database {
  private userId: string | null = null

  async init() {
    const { data: { user } } = await supabase.auth.getUser()
    this.userId = user?.id || null
    
    if (!this.userId) {
      throw new Error('User not authenticated')
    }
  }

  private ensureUserId() {
    if (!this.userId) {
      throw new Error('Database not initialized or user not authenticated')
    }
    return this.userId
  }

  // Workers CRUD
  async getWorkers(): Promise<Worker[]> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data || []
  }

  async addWorker(worker: Omit<Worker, 'id' | 'user_id' | 'created_at'>): Promise<Worker> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('workers')
      .insert({ ...worker, user_id: userId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateWorker(id: string, worker: Partial<Worker>): Promise<Worker> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('workers')
      .update(worker)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteWorker(id: string): Promise<void> {
    const userId = this.ensureUserId()
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Sites CRUD
  async getSites(): Promise<Site[]> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data || []
  }

  async addSite(site: Omit<Site, 'id' | 'user_id' | 'created_at'>): Promise<Site> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('sites')
      .insert({ ...site, user_id: userId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateSite(id: string, site: Partial<Site>): Promise<Site> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('sites')
      .update(site)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteSite(id: string): Promise<void> {
    const userId = this.ensureUserId()
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Time Entries CRUD
  async getTimeEntries(): Promise<any[]> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        workers!inner(name),
        sites!inner(name)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data?.map(entry => ({
      ...entry,
      workerName: entry.workers.name,
      siteName: entry.sites.name
    })) || []
  }

  async addTimeEntry(entry: Omit<TimeEntry, 'id' | 'user_id' | 'created_at'>): Promise<TimeEntry> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('time_entries')
      .insert({ ...entry, user_id: userId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTimeEntry(id: string, entry: Partial<TimeEntry>): Promise<TimeEntry> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('time_entries')
      .update(entry)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const userId = this.ensureUserId()
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Payments CRUD
  async getPayments(): Promise<any[]> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        workers!inner(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data?.map(payment => ({
      ...payment,
      workerName: payment.workers.name
    })) || []
  }

  async addPayment(payment: Omit<Payment, 'id' | 'user_id' | 'created_at'>): Promise<Payment> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...payment, user_id: userId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updatePayment(id: string, payment: Partial<Payment>): Promise<Payment> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('payments')
      .update(payment)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deletePayment(id: string): Promise<void> {
    const userId = this.ensureUserId()
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Dashboard stats
  async getDashboardStats() {
    const userId = this.ensureUserId()
    
    const [workersResult, sitesResult, paymentsResult, timeEntriesResult] = await Promise.all([
      supabase.from('workers').select('id').eq('user_id', userId).eq('status', 'Attivo'),
      supabase.from('sites').select('id').eq('user_id', userId).eq('status', 'Attivo'),
      supabase.from('payments').select('id').eq('user_id', userId).eq('status', 'Da Pagare'),
      supabase.from('time_entries').select('total_hours').eq('user_id', userId).eq('date', new Date().toISOString().split('T')[0])
    ])

    const activeWorkers = workersResult.data?.length || 0
    const activeSites = sitesResult.data?.length || 0
    const pendingPayments = paymentsResult.data?.length || 0
    const todayHours = timeEntriesResult.data?.reduce((sum, entry) => sum + entry.total_hours, 0) || 0

    return {
      activeWorkers,
      activeSites,
      pendingPayments,
      todayHours
    }
  }

  // Site Workers
  async getSiteWorkers(siteId: string): Promise<Worker[]> {
    const userId = this.ensureUserId()
    const { data, error } = await supabase
      .from('site_workers')
      .select(`
        workers!inner(*)
      `)
      .eq('site_id', siteId)
      .eq('workers.user_id', userId)

    if (error) throw error
    return data?.map(item => item.workers) || []
  }

  async assignWorkerToSite(siteId: string, workerId: string): Promise<void> {
    const { error } = await supabase
      .from('site_workers')
      .insert({ site_id: siteId, worker_id: workerId })

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error
    }
  }

  async removeWorkerFromSite(siteId: string, workerId: string): Promise<void> {
    const { error } = await supabase
      .from('site_workers')
      .delete()
      .eq('site_id', siteId)
      .eq('worker_id', workerId)

    if (error) throw error
  }
}

export const database = new Database()