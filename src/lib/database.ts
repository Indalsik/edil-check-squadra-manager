// Browser-based database using localStorage
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
  workerName?: string;
  siteName?: string;
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
  workerName?: string;
  created_at?: string;
}

class Database {
  private storageKey = 'edilcheck_data';
  private data: {
    workers: Worker[];
    sites: Site[];
    timeEntries: TimeEntry[];
    payments: Payment[];
    nextId: number;
  };

  constructor() {
    this.loadData();
  }

  private loadData() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      this.data = {
        workers: this.getSampleWorkers(),
        sites: this.getSampleSites(),
        timeEntries: this.getSampleTimeEntries(),
        payments: this.getSamplePayments(),
        nextId: 100
      };
      this.saveData();
    }
  }

  private saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  private getNextId(): number {
    return this.data.nextId++;
  }

  async init() {
    // No initialization needed for localStorage
    return Promise.resolve();
  }

  // Workers CRUD
  getWorkers(): Worker[] {
    return this.data.workers;
  }

  addWorker(worker: Omit<Worker, 'id'>): Worker {
    const newWorker: Worker = {
      ...worker,
      id: this.getNextId(),
      created_at: new Date().toISOString()
    };
    this.data.workers.push(newWorker);
    this.saveData();
    return newWorker;
  }

  updateWorker(id: number, updates: Partial<Worker>): Worker {
    const index = this.data.workers.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Worker not found');
    
    this.data.workers[index] = { ...this.data.workers[index], ...updates };
    this.saveData();
    return this.data.workers[index];
  }

  deleteWorker(id: number): void {
    this.data.workers = this.data.workers.filter(w => w.id !== id);
    // Also remove related time entries and payments
    this.data.timeEntries = this.data.timeEntries.filter(te => te.workerId !== id);
    this.data.payments = this.data.payments.filter(p => p.workerId !== id);
    this.saveData();
  }

  // Sites CRUD
  getSites(): Site[] {
    return this.data.sites;
  }

  addSite(site: Omit<Site, 'id'>): Site {
    const newSite: Site = {
      ...site,
      id: this.getNextId(),
      created_at: new Date().toISOString()
    };
    this.data.sites.push(newSite);
    this.saveData();
    return newSite;
  }

  updateSite(id: number, updates: Partial<Site>): Site {
    const index = this.data.sites.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Site not found');
    
    this.data.sites[index] = { ...this.data.sites[index], ...updates };
    this.saveData();
    return this.data.sites[index];
  }

  deleteSite(id: number): void {
    this.data.sites = this.data.sites.filter(s => s.id !== id);
    // Also remove related time entries
    this.data.timeEntries = this.data.timeEntries.filter(te => te.siteId !== id);
    this.saveData();
  }

  // Time Entries CRUD
  getTimeEntries(): TimeEntry[] {
    return this.data.timeEntries.map(entry => {
      const worker = this.data.workers.find(w => w.id === entry.workerId);
      const site = this.data.sites.find(s => s.id === entry.siteId);
      return {
        ...entry,
        workerName: worker?.name || 'Unknown',
        siteName: site?.name || 'Unknown'
      };
    });
  }

  addTimeEntry(entry: Omit<TimeEntry, 'id'>): TimeEntry {
    const newEntry: TimeEntry = {
      ...entry,
      id: this.getNextId(),
      created_at: new Date().toISOString()
    };
    this.data.timeEntries.push(newEntry);
    this.saveData();
    
    const worker = this.data.workers.find(w => w.id === entry.workerId);
    const site = this.data.sites.find(s => s.id === entry.siteId);
    return {
      ...newEntry,
      workerName: worker?.name || 'Unknown',
      siteName: site?.name || 'Unknown'
    };
  }

  updateTimeEntry(id: number, updates: Partial<TimeEntry>): TimeEntry {
    const index = this.data.timeEntries.findIndex(te => te.id === id);
    if (index === -1) throw new Error('Time entry not found');
    
    this.data.timeEntries[index] = { ...this.data.timeEntries[index], ...updates };
    this.saveData();
    
    const entry = this.data.timeEntries[index];
    const worker = this.data.workers.find(w => w.id === entry.workerId);
    const site = this.data.sites.find(s => s.id === entry.siteId);
    return {
      ...entry,
      workerName: worker?.name || 'Unknown',
      siteName: site?.name || 'Unknown'
    };
  }

  deleteTimeEntry(id: number): void {
    this.data.timeEntries = this.data.timeEntries.filter(te => te.id !== id);
    this.saveData();
  }

  // Payments CRUD
  getPayments(): Payment[] {
    return this.data.payments.map(payment => {
      const worker = this.data.workers.find(w => w.id === payment.workerId);
      return {
        ...payment,
        workerName: worker?.name || 'Unknown'
      };
    });
  }

  addPayment(payment: Omit<Payment, 'id'>): Payment {
    const newPayment: Payment = {
      ...payment,
      id: this.getNextId(),
      created_at: new Date().toISOString()
    };
    this.data.payments.push(newPayment);
    this.saveData();
    
    const worker = this.data.workers.find(w => w.id === payment.workerId);
    return {
      ...newPayment,
      workerName: worker?.name || 'Unknown'
    };
  }

  updatePayment(id: number, updates: Partial<Payment>): Payment {
    const index = this.data.payments.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Payment not found');
    
    this.data.payments[index] = { ...this.data.payments[index], ...updates };
    this.saveData();
    
    const payment = this.data.payments[index];
    const worker = this.data.workers.find(w => w.id === payment.workerId);
    return {
      ...payment,
      workerName: worker?.name || 'Unknown'
    };
  }

  deletePayment(id: number): void {
    this.data.payments = this.data.payments.filter(p => p.id !== id);
    this.saveData();
  }

  // Dashboard stats
  getDashboardStats() {
    const activeWorkers = this.data.workers.filter(w => w.status === 'Attivo').length;
    const activeSites = this.data.sites.filter(s => s.status === 'Attivo').length;
    const pendingPayments = this.data.payments.filter(p => p.status === 'Da Pagare').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayHours = this.data.timeEntries
      .filter(te => te.date === today)
      .reduce((sum, te) => sum + te.totalHours, 0);

    return {
      activeWorkers,
      activeSites,
      pendingPayments,
      todayHours
    };
  }

  // Site Workers
  getSiteWorkers(siteId: number): Worker[] {
    // For demo purposes, return some workers assigned to the site
    return this.data.workers.filter((_, index) => index < 2);
  }

  assignWorkerToSite(siteId: number, workerId: number): void {
    // Implementation for assigning workers to sites
    console.log('Assign worker to site:', { siteId, workerId });
  }

  removeWorkerFromSite(siteId: number, workerId: number): void {
    // Implementation for removing workers from sites
    console.log('Remove worker from site:', { siteId, workerId });
  }

  // Sample data generators
  private getSampleWorkers(): Worker[] {
    return [
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
      },
      {
        id: 3,
        name: "Antonio Verdi",
        role: "Idraulico",
        phone: "+39 333 3456789",
        email: "antonio.verdi@email.com",
        status: "In Permesso",
        hourlyRate: 20.00,
        created_at: new Date().toISOString()
      }
    ];
  }

  private getSampleSites(): Site[] {
    return [
      {
        id: 1,
        name: "Villa Moderna",
        owner: "Famiglia Rossi",
        address: "Via Roma 123, Milano",
        status: "Attivo",
        startDate: "2024-01-15",
        estimatedEnd: "2024-06-30",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "Ristrutturazione Uffici",
        owner: "ABC S.r.l.",
        address: "Corso Italia 45, Roma",
        status: "Attivo",
        startDate: "2024-02-01",
        estimatedEnd: "2024-04-15",
        created_at: new Date().toISOString()
      }
    ];
  }

  private getSampleTimeEntries(): TimeEntry[] {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    return [
      {
        id: 1,
        workerId: 1,
        siteId: 1,
        date: today,
        startTime: "08:00",
        endTime: "17:00",
        totalHours: 8,
        status: "Confermato",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        workerId: 2,
        siteId: 1,
        date: today,
        startTime: "08:30",
        endTime: "16:30",
        totalHours: 7.5,
        status: "Confermato",
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        workerId: 1,
        siteId: 2,
        date: yesterday,
        startTime: "08:00",
        endTime: "17:00",
        totalHours: 8,
        status: "Confermato",
        created_at: new Date().toISOString()
      }
    ];
  }

  private getSamplePayments(): Payment[] {
    return [
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
      },
      {
        id: 2,
        workerId: 2,
        week: "Settimana 3/2024",
        hours: 38,
        hourlyRate: 22.00,
        totalAmount: 836,
        overtime: 2,
        status: "Da Pagare",
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        workerId: 1,
        week: "Settimana 2/2024",
        hours: 40,
        hourlyRate: 18.50,
        totalAmount: 740,
        overtime: 0,
        status: "Pagato",
        paidDate: "2024-01-15",
        method: "Bonifico",
        created_at: new Date().toISOString()
      }
    ];
  }
}

export const database = new Database();