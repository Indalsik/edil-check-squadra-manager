// Database locale con localStorage per simulare persistenza
// In produzione, questo sarà sostituito con chiamate API al server

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
  workerName?: string;
  siteName?: string;
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
  workerName?: string;
}

class LocalDatabase {
  private currentUserId: string | null = null;

  async init() {
    // Simula l'inizializzazione del database
    this.currentUserId = localStorage.getItem('edilcheck_current_user') || 'default_user';
    
    // Inizializza con dati demo se non esistono
    if (!this.getUsers().length) {
      this.initializeDemoData();
    }
    
    return Promise.resolve();
  }

  private getStorageKey(table: string): string {
    return `edilcheck_${this.currentUserId}_${table}`;
  }

  private getUsers(): any[] {
    return JSON.parse(localStorage.getItem('edilcheck_users') || '[]');
  }

  private saveUsers(users: any[]): void {
    localStorage.setItem('edilcheck_users', JSON.stringify(users));
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.currentUserId = user.id;
      localStorage.setItem('edilcheck_current_user', user.id);
      localStorage.setItem('edilcheck_user_data', JSON.stringify({ id: user.id, email: user.email }));
      return { success: true, user: { id: user.id, email: user.email } };
    }
    
    return { success: false, error: 'Credenziali non valide' };
  }

  async register(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const users = this.getUsers();
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email già registrata' };
    }
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    this.saveUsers(users);
    
    this.currentUserId = newUser.id;
    localStorage.setItem('edilcheck_current_user', newUser.id);
    localStorage.setItem('edilcheck_user_data', JSON.stringify({ id: newUser.id, email: newUser.email }));
    
    return { success: true, user: { id: newUser.id, email: newUser.email } };
  }

  async logout(): Promise<void> {
    this.currentUserId = null;
    localStorage.removeItem('edilcheck_current_user');
    localStorage.removeItem('edilcheck_user_data');
  }

  getCurrentUser(): any | null {
    const userData = localStorage.getItem('edilcheck_user_data');
    return userData ? JSON.parse(userData) : null;
  }

  private initializeDemoData(): void {
    // Crea utente demo
    const demoUser = {
      id: 'demo_user',
      email: 'demo@edilcheck.com',
      password: 'demo123',
      created_at: new Date().toISOString()
    };
    
    this.saveUsers([demoUser]);
    
    // Imposta l'utente demo come corrente per i dati demo
    const originalUserId = this.currentUserId;
    this.currentUserId = 'demo_user';
    
    // Dati demo
    const demoWorkers: Worker[] = [
      {
        id: 1,
        name: "Mario Rossi",
        role: "Muratore",
        phone: "+39 333 1234567",
        email: "mario.rossi@email.com",
        status: "Attivo",
        hourlyRate: 18.50,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "Giuseppe Verdi",
        role: "Elettricista",
        phone: "+39 333 2345678",
        email: "giuseppe.verdi@email.com",
        status: "Attivo",
        hourlyRate: 22.00,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: "Antonio Bianchi",
        role: "Idraulico",
        phone: "+39 333 3456789",
        email: "antonio.bianchi@email.com",
        status: "In Permesso",
        hourlyRate: 20.00,
        created_at: new Date().toISOString()
      }
    ];

    const demoSites: Site[] = [
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
        owner: "TechCorp SRL",
        address: "Via Garibaldi 45, Roma",
        status: "Attivo",
        startDate: "2024-02-01",
        estimatedEnd: "2024-05-15",
        created_at: new Date().toISOString()
      }
    ];

    const demoTimeEntries = [
      {
        id: 1,
        workerId: 1,
        siteId: 1,
        date: new Date().toISOString().split('T')[0],
        startTime: "08:00",
        endTime: "17:00",
        totalHours: 8,
        status: "Confermato",
        workerName: "Mario Rossi",
        siteName: "Villa Moderna",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        workerId: 2,
        siteId: 2,
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "18:00",
        totalHours: 8,
        status: "Confermato",
        workerName: "Giuseppe Verdi",
        siteName: "Ristrutturazione Uffici",
        created_at: new Date().toISOString()
      }
    ];

    const demoPayments = [
      {
        id: 1,
        workerId: 1,
        week: "Settimana 1/2024",
        hours: 40,
        hourlyRate: 18.50,
        totalAmount: 740,
        overtime: 0,
        status: "Da Pagare",
        workerName: "Mario Rossi",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        workerId: 2,
        week: "Settimana 52/2023",
        hours: 40,
        hourlyRate: 22.00,
        totalAmount: 880,
        overtime: 0,
        status: "Pagato",
        paidDate: "2024-01-05",
        method: "Bonifico",
        workerName: "Giuseppe Verdi",
        created_at: new Date().toISOString()
      }
    ];

    // Salva i dati demo
    localStorage.setItem(this.getStorageKey('workers'), JSON.stringify(demoWorkers));
    localStorage.setItem(this.getStorageKey('sites'), JSON.stringify(demoSites));
    localStorage.setItem(this.getStorageKey('timeEntries'), JSON.stringify(demoTimeEntries));
    localStorage.setItem(this.getStorageKey('payments'), JSON.stringify(demoPayments));
    
    // Ripristina l'utente originale
    this.currentUserId = originalUserId;
  }

  // Workers CRUD
  getWorkers(): Worker[] {
    const data = localStorage.getItem(this.getStorageKey('workers'));
    return data ? JSON.parse(data) : [];
  }

  addWorker(worker: Omit<Worker, 'id'>): Worker {
    const workers = this.getWorkers();
    const newWorker = {
      ...worker,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    workers.push(newWorker);
    localStorage.setItem(this.getStorageKey('workers'), JSON.stringify(workers));
    return newWorker;
  }

  updateWorker(id: number, updates: Partial<Worker>): Worker {
    const workers = this.getWorkers();
    const index = workers.findIndex(w => w.id === id);
    if (index !== -1) {
      workers[index] = { ...workers[index], ...updates };
      localStorage.setItem(this.getStorageKey('workers'), JSON.stringify(workers));
      return workers[index];
    }
    throw new Error('Worker not found');
  }

  deleteWorker(id: number): void {
    const workers = this.getWorkers().filter(w => w.id !== id);
    localStorage.setItem(this.getStorageKey('workers'), JSON.stringify(workers));
  }

  // Sites CRUD
  getSites(): Site[] {
    const data = localStorage.getItem(this.getStorageKey('sites'));
    return data ? JSON.parse(data) : [];
  }

  addSite(site: Omit<Site, 'id'>): Site {
    const sites = this.getSites();
    const newSite = {
      ...site,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    sites.push(newSite);
    localStorage.setItem(this.getStorageKey('sites'), JSON.stringify(sites));
    return newSite;
  }

  updateSite(id: number, updates: Partial<Site>): Site {
    const sites = this.getSites();
    const index = sites.findIndex(s => s.id === id);
    if (index !== -1) {
      sites[index] = { ...sites[index], ...updates };
      localStorage.setItem(this.getStorageKey('sites'), JSON.stringify(sites));
      return sites[index];
    }
    throw new Error('Site not found');
  }

  deleteSite(id: number): void {
    const sites = this.getSites().filter(s => s.id !== id);
    localStorage.setItem(this.getStorageKey('sites'), JSON.stringify(sites));
  }

  // Time Entries CRUD
  getTimeEntries(): TimeEntry[] {
    const data = localStorage.getItem(this.getStorageKey('timeEntries'));
    const entries = data ? JSON.parse(data) : [];
    
    // Aggiungi nomi worker e site
    const workers = this.getWorkers();
    const sites = this.getSites();
    
    return entries.map((entry: TimeEntry) => ({
      ...entry,
      workerName: workers.find(w => w.id === entry.workerId)?.name || 'Sconosciuto',
      siteName: sites.find(s => s.id === entry.siteId)?.name || 'Sconosciuto'
    }));
  }

  addTimeEntry(entry: Omit<TimeEntry, 'id'>): TimeEntry {
    const entries = this.getTimeEntries();
    const workers = this.getWorkers();
    const sites = this.getSites();
    
    const newEntry = {
      ...entry,
      id: Date.now(),
      created_at: new Date().toISOString(),
      workerName: workers.find(w => w.id === entry.workerId)?.name || 'Sconosciuto',
      siteName: sites.find(s => s.id === entry.siteId)?.name || 'Sconosciuto'
    };
    
    entries.push(newEntry);
    localStorage.setItem(this.getStorageKey('timeEntries'), JSON.stringify(entries));
    return newEntry;
  }

  updateTimeEntry(id: number, updates: Partial<TimeEntry>): TimeEntry {
    const entries = this.getTimeEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      localStorage.setItem(this.getStorageKey('timeEntries'), JSON.stringify(entries));
      return entries[index];
    }
    throw new Error('Time entry not found');
  }

  deleteTimeEntry(id: number): void {
    const entries = this.getTimeEntries().filter(e => e.id !== id);
    localStorage.setItem(this.getStorageKey('timeEntries'), JSON.stringify(entries));
  }

  // Payments CRUD
  getPayments(): Payment[] {
    const data = localStorage.getItem(this.getStorageKey('payments'));
    const payments = data ? JSON.parse(data) : [];
    
    // Aggiungi nomi worker
    const workers = this.getWorkers();
    
    return payments.map((payment: Payment) => ({
      ...payment,
      workerName: workers.find(w => w.id === payment.workerId)?.name || 'Sconosciuto'
    }));
  }

  addPayment(payment: Omit<Payment, 'id'>): Payment {
    const payments = this.getPayments();
    const workers = this.getWorkers();
    
    const newPayment = {
      ...payment,
      id: Date.now(),
      created_at: new Date().toISOString(),
      workerName: workers.find(w => w.id === payment.workerId)?.name || 'Sconosciuto'
    };
    
    payments.push(newPayment);
    localStorage.setItem(this.getStorageKey('payments'), JSON.stringify(payments));
    return newPayment;
  }

  updatePayment(id: number, updates: Partial<Payment>): Payment {
    const payments = this.getPayments();
    const index = payments.findIndex(p => p.id === id);
    if (index !== -1) {
      payments[index] = { ...payments[index], ...updates };
      localStorage.setItem(this.getStorageKey('payments'), JSON.stringify(payments));
      return payments[index];
    }
    throw new Error('Payment not found');
  }

  deletePayment(id: number): void {
    const payments = this.getPayments().filter(p => p.id !== id);
    localStorage.setItem(this.getStorageKey('payments'), JSON.stringify(payments));
  }

  // Dashboard stats
  getDashboardStats() {
    const workers = this.getWorkers();
    const sites = this.getSites();
    const payments = this.getPayments();
    const timeEntries = this.getTimeEntries();
    
    const today = new Date().toISOString().split('T')[0];
    
    return {
      activeWorkers: workers.filter(w => w.status === 'Attivo').length,
      activeSites: sites.filter(s => s.status === 'Attivo').length,
      pendingPayments: payments.filter(p => p.status === 'Da Pagare').length,
      todayHours: timeEntries
        .filter(e => e.date === today)
        .reduce((sum, e) => sum + e.totalHours, 0)
    };
  }

  // Site Workers (simulato)
  getSiteWorkers(siteId: number): Worker[] {
    // Per semplicità, restituisce tutti gli operai attivi
    return this.getWorkers().filter(w => w.status === 'Attivo');
  }
}

export const database = new LocalDatabase();