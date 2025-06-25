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
  getWorkers(): Promise<Worker[]> {
    return workersAPI.getAll();
  }

  addWorker(worker: Omit<Worker, 'id'>): Promise<Worker> {
    return workersAPI.create(worker);
  }

  updateWorker(id: number, worker: Partial<Worker>): Promise<Worker> {
    return workersAPI.update(id, worker);
  }

  deleteWorker(id: number): Promise<void> {
    return workersAPI.delete(id);
  }

  // Sites CRUD
  getSites(): Promise<Site[]> {
    return sitesAPI.getAll();
  }

  addSite(site: Omit<Site, 'id'>): Promise<Site> {
    return sitesAPI.create(site);
  }

  updateSite(id: number, site: Partial<Site>): Promise<Site> {
    return sitesAPI.update(id, site);
  }

  deleteSite(id: number): Promise<void> {
    return sitesAPI.delete(id);
  }

  // Time Entries CRUD
  getTimeEntries(): Promise<any[]> {
    return timeEntriesAPI.getAll();
  }

  addTimeEntry(entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    return timeEntriesAPI.create(entry);
  }

  updateTimeEntry(id: number, entry: Partial<TimeEntry>): Promise<TimeEntry> {
    return timeEntriesAPI.update(id, entry);
  }

  deleteTimeEntry(id: number): Promise<void> {
    return timeEntriesAPI.delete(id);
  }

  // Payments CRUD
  getPayments(): Promise<any[]> {
    return paymentsAPI.getAll();
  }

  addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    return paymentsAPI.create(payment);
  }

  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment> {
    return paymentsAPI.update(id, payment);
  }

  deletePayment(id: number): Promise<void> {
    return paymentsAPI.delete(id);
  }

  // Dashboard stats
  getDashboardStats() {
    return dashboardAPI.getStats();
  }

  // Site Workers
  getSiteWorkers(siteId: number): Promise<Worker[]> {
    return sitesAPI.getWorkers(siteId);
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