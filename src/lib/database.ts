import { 
  workersAPI, 
  sitesAPI, 
  timeEntriesAPI, 
  paymentsAPI, 
  dashboardAPI 
} from './api';

export interface Worker {
  id?: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
  hourlyRate: number;
  created_at?: string;
}

export interface Site {
  id?: number;
  name: string;
  owner: string;
  address: string;
  status: string;
  startDate: string;
  estimatedEnd: string;
  created_at?: string;
}

export interface TimeEntry {
  id?: number;
  workerId: number;
  siteId: number;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  status: string;
  created_at?: string;
}

export interface Payment {
  id?: number;
  workerId: number;
  week: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  overtime: number;
  status: string;
  paidDate?: string;
  method?: string;
  created_at?: string;
}

class Database {
  async init() {
    // No initialization needed for API-based database
    return Promise.resolve();
  }

  // Workers CRUD
  async getWorkers(): Promise<Worker[]> {
    return await workersAPI.getAll();
  }

  async addWorker(worker: Omit<Worker, 'id'>): Promise<Worker> {
    return await workersAPI.create(worker);
  }

  async updateWorker(id: number, worker: Partial<Worker>): Promise<Worker> {
    return await workersAPI.update(id, worker);
  }

  async deleteWorker(id: number): Promise<void> {
    await workersAPI.delete(id);
  }

  // Sites CRUD
  async getSites(): Promise<Site[]> {
    return await sitesAPI.getAll();
  }

  async addSite(site: Omit<Site, 'id'>): Promise<Site> {
    return await sitesAPI.create(site);
  }

  async updateSite(id: number, site: Partial<Site>): Promise<Site> {
    return await sitesAPI.update(id, site);
  }

  async deleteSite(id: number): Promise<void> {
    await sitesAPI.delete(id);
  }

  // Time Entries CRUD
  async getTimeEntries(): Promise<any[]> {
    return await timeEntriesAPI.getAll();
  }

  async addTimeEntry(entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    return await timeEntriesAPI.create(entry);
  }

  async updateTimeEntry(id: number, entry: Partial<TimeEntry>): Promise<TimeEntry> {
    return await timeEntriesAPI.update(id, entry);
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await timeEntriesAPI.delete(id);
  }

  // Payments CRUD
  async getPayments(): Promise<any[]> {
    return await paymentsAPI.getAll();
  }

  async addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    return await paymentsAPI.create(payment);
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment> {
    return await paymentsAPI.update(id, payment);
  }

  async deletePayment(id: number): Promise<void> {
    await paymentsAPI.delete(id);
  }

  // Dashboard stats
  async getDashboardStats() {
    return await dashboardAPI.getStats();
  }

  // Site Workers
  async getSiteWorkers(siteId: number): Promise<Worker[]> {
    return await sitesAPI.getWorkers(siteId);
  }

  async assignWorkerToSite(siteId: number, workerId: number): Promise<void> {
    // This would need to be implemented in the API
    console.log('Assign worker to site not implemented yet');
  }

  async removeWorkerFromSite(siteId: number, workerId: number): Promise<void> {
    // This would need to be implemented in the API
    console.log('Remove worker from site not implemented yet');
  }
}

export const database = new Database();