import initSqlJs from 'sql.js';

export interface Worker {
  id?: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
  hourlyRate: number;
  createdAt?: string;
}

export interface Site {
  id?: number;
  name: string;
  owner: string;
  address: string;
  status: string;
  startDate: string;
  estimatedEnd: string;
  createdAt?: string;
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
  createdAt?: string;
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
  createdAt?: string;
}

export interface SiteWorker {
  id?: number;
  siteId: number;
  workerId: number;
  assignedAt?: string;
}

class Database {
  private db: any = null;
  private SQL: any = null;

  async init() {
    if (this.db) return;

    this.SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem('edilcheck_db');
    if (savedDb) {
      const uint8Array = new Uint8Array(JSON.parse(savedDb));
      this.db = new this.SQL.Database(uint8Array);
    } else {
      this.db = new this.SQL.Database();
      this.createTables();
      this.insertSampleData();
    }
  }

  private createTables() {
    // Workers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Attivo',
        hourlyRate REAL NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sites table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner TEXT NOT NULL,
        address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Attivo',
        startDate DATE NOT NULL,
        estimatedEnd DATE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Time entries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workerId INTEGER NOT NULL,
        siteId INTEGER NOT NULL,
        date DATE NOT NULL,
        startTime TIME NOT NULL,
        endTime TIME NOT NULL,
        totalHours REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Confermato',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workerId) REFERENCES workers(id),
        FOREIGN KEY (siteId) REFERENCES sites(id)
      )
    `);

    // Payments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workerId INTEGER NOT NULL,
        week TEXT NOT NULL,
        hours REAL NOT NULL,
        hourlyRate REAL NOT NULL,
        totalAmount REAL NOT NULL,
        overtime REAL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Da Pagare',
        paidDate DATE,
        method TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workerId) REFERENCES workers(id)
      )
    `);

    // Site workers junction table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS site_workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        siteId INTEGER NOT NULL,
        workerId INTEGER NOT NULL,
        assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (siteId) REFERENCES sites(id),
        FOREIGN KEY (workerId) REFERENCES workers(id),
        UNIQUE(siteId, workerId)
      )
    `);
  }

  private insertSampleData() {
    // Sample workers
    const workers = [
      { name: 'Marco Rossi', role: 'Capocantiere', phone: '+39 333 1234567', email: 'marco.rossi@edilcheck.it', status: 'Attivo', hourlyRate: 18 },
      { name: 'Luca Bianchi', role: 'Muratore', phone: '+39 333 7654321', email: 'luca.bianchi@edilcheck.it', status: 'Attivo', hourlyRate: 15 },
      { name: 'Antonio Verde', role: 'Elettricista', phone: '+39 333 9876543', email: 'antonio.verde@edilcheck.it', status: 'In Permesso', hourlyRate: 20 },
      { name: 'Francesco Neri', role: 'Idraulico', phone: '+39 333 5432109', email: 'francesco.neri@edilcheck.it', status: 'Attivo', hourlyRate: 19 }
    ];

    workers.forEach(worker => {
      this.db.run(
        'INSERT INTO workers (name, role, phone, email, status, hourlyRate) VALUES (?, ?, ?, ?, ?, ?)',
        [worker.name, worker.role, worker.phone, worker.email, worker.status, worker.hourlyRate]
      );
    });

    // Sample sites
    const sites = [
      { name: 'Ristrutturazione Villa Roma', owner: 'Mario Bianchi', address: 'Via Roma 123, Milano', status: 'Attivo', startDate: '2024-01-15', estimatedEnd: '2024-03-30' },
      { name: 'Nuova Costruzione Garibaldi', owner: 'Edil Costruzioni SRL', address: 'Piazza Garibaldi 45, Milano', status: 'Attivo', startDate: '2024-02-01', estimatedEnd: '2024-06-15' },
      { name: 'Ristrutturazione Uffici', owner: 'Tech Company Ltd', address: 'Via Montenapoleone 88, Milano', status: 'In Pausa', startDate: '2024-01-20', estimatedEnd: '2024-04-10' }
    ];

    sites.forEach(site => {
      this.db.run(
        'INSERT INTO sites (name, owner, address, status, startDate, estimatedEnd) VALUES (?, ?, ?, ?, ?, ?)',
        [site.name, site.owner, site.address, site.status, site.startDate, site.estimatedEnd]
      );
    });

    // Sample site assignments
    const assignments = [
      { siteId: 1, workerId: 1 }, { siteId: 1, workerId: 2 }, { siteId: 1, workerId: 3 },
      { siteId: 2, workerId: 4 }, { siteId: 2, workerId: 1 },
      { siteId: 3, workerId: 3 }
    ];

    assignments.forEach(assignment => {
      this.db.run(
        'INSERT INTO site_workers (siteId, workerId) VALUES (?, ?)',
        [assignment.siteId, assignment.workerId]
      );
    });

    // Sample time entries
    const timeEntries = [
      { workerId: 1, siteId: 1, date: '2024-01-15', startTime: '08:00', endTime: '17:00', totalHours: 8, status: 'Confermato' },
      { workerId: 2, siteId: 1, date: '2024-01-15', startTime: '07:30', endTime: '16:30', totalHours: 8, status: 'Confermato' },
      { workerId: 3, siteId: 3, date: '2024-01-15', startTime: '09:00', endTime: '13:00', totalHours: 4, status: 'In Attesa' },
      { workerId: 4, siteId: 2, date: '2024-01-15', startTime: '08:30', endTime: '17:30', totalHours: 8, status: 'Confermato' }
    ];

    timeEntries.forEach(entry => {
      this.db.run(
        'INSERT INTO time_entries (workerId, siteId, date, startTime, endTime, totalHours, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [entry.workerId, entry.siteId, entry.date, entry.startTime, entry.endTime, entry.totalHours, entry.status]
      );
    });

    // Sample payments
    const payments = [
      { workerId: 1, week: 'Settimana 02/2024', hours: 40, hourlyRate: 18, totalAmount: 720, overtime: 0, status: 'Da Pagare' },
      { workerId: 2, week: 'Settimana 02/2024', hours: 38, hourlyRate: 15, totalAmount: 570, overtime: 2, status: 'Da Pagare' },
      { workerId: 4, week: 'Settimana 02/2024', hours: 42, hourlyRate: 19, totalAmount: 798, overtime: 4, status: 'Da Pagare' },
      { workerId: 3, week: 'Settimana 01/2024', hours: 32, hourlyRate: 20, totalAmount: 800, overtime: 0, status: 'Pagato', paidDate: '2024-01-12', method: 'Bonifico' },
      { workerId: 1, week: 'Settimana 01/2024', hours: 40, hourlyRate: 18, totalAmount: 720, overtime: 0, status: 'Pagato', paidDate: '2024-01-12', method: 'Contanti' }
    ];

    payments.forEach(payment => {
      this.db.run(
        'INSERT INTO payments (workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [payment.workerId, payment.week, payment.hours, payment.hourlyRate, payment.totalAmount, payment.overtime, payment.status, payment.paidDate, payment.method]
      );
    });

    this.saveToLocalStorage();
  }

  private saveToLocalStorage() {
    const data = this.db.export();
    localStorage.setItem('edilcheck_db', JSON.stringify(Array.from(data)));
  }

  // Workers CRUD
  getWorkers(): Worker[] {
    const stmt = this.db.prepare('SELECT * FROM workers ORDER BY name');
    const workers = [];
    while (stmt.step()) {
      workers.push(stmt.getAsObject());
    }
    stmt.free();
    return workers;
  }

  addWorker(worker: Omit<Worker, 'id'>): number {
    const stmt = this.db.prepare(
      'INSERT INTO workers (name, role, phone, email, status, hourlyRate) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run([worker.name, worker.role, worker.phone, worker.email, worker.status, worker.hourlyRate]);
    const id = this.db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    stmt.free();
    this.saveToLocalStorage();
    return id;
  }

  updateWorker(id: number, worker: Partial<Worker>): void {
    const fields = Object.keys(worker).filter(key => key !== 'id');
    const values = fields.map(key => worker[key as keyof Worker]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    this.db.run(`UPDATE workers SET ${setClause} WHERE id = ?`, [...values, id]);
    this.saveToLocalStorage();
  }

  deleteWorker(id: number): void {
    this.db.run('DELETE FROM workers WHERE id = ?', [id]);
    this.saveToLocalStorage();
  }

  // Sites CRUD
  getSites(): Site[] {
    const stmt = this.db.prepare('SELECT * FROM sites ORDER BY name');
    const sites = [];
    while (stmt.step()) {
      sites.push(stmt.getAsObject());
    }
    stmt.free();
    return sites;
  }

  addSite(site: Omit<Site, 'id'>): number {
    const stmt = this.db.prepare(
      'INSERT INTO sites (name, owner, address, status, startDate, estimatedEnd) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run([site.name, site.owner, site.address, site.status, site.startDate, site.estimatedEnd]);
    const id = this.db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    stmt.free();
    this.saveToLocalStorage();
    return id;
  }

  updateSite(id: number, site: Partial<Site>): void {
    const fields = Object.keys(site).filter(key => key !== 'id');
    const values = fields.map(key => site[key as keyof Site]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    this.db.run(`UPDATE sites SET ${setClause} WHERE id = ?`, [...values, id]);
    this.saveToLocalStorage();
  }

  deleteSite(id: number): void {
    this.db.run('DELETE FROM sites WHERE id = ?', [id]);
    this.saveToLocalStorage();
  }

  // Site Workers
  getSiteWorkers(siteId: number): Worker[] {
    const stmt = this.db.prepare(`
      SELECT w.* FROM workers w 
      JOIN site_workers sw ON w.id = sw.workerId 
      WHERE sw.siteId = ?
    `);
    stmt.bind([siteId]);
    const workers = [];
    while (stmt.step()) {
      workers.push(stmt.getAsObject());
    }
    stmt.free();
    return workers;
  }

  assignWorkerToSite(siteId: number, workerId: number): void {
    this.db.run('INSERT OR IGNORE INTO site_workers (siteId, workerId) VALUES (?, ?)', [siteId, workerId]);
    this.saveToLocalStorage();
  }

  removeWorkerFromSite(siteId: number, workerId: number): void {
    this.db.run('DELETE FROM site_workers WHERE siteId = ? AND workerId = ?', [siteId, workerId]);
    this.saveToLocalStorage();
  }

  // Time Entries CRUD
  getTimeEntries(): any[] {
    const stmt = this.db.prepare(`
      SELECT te.*, w.name as workerName, s.name as siteName 
      FROM time_entries te
      JOIN workers w ON te.workerId = w.id
      JOIN sites s ON te.siteId = s.id
      ORDER BY te.date DESC, te.startTime
    `);
    const entries = [];
    while (stmt.step()) {
      entries.push(stmt.getAsObject());
    }
    stmt.free();
    return entries;
  }

  addTimeEntry(entry: Omit<TimeEntry, 'id'>): number {
    const stmt = this.db.prepare(
      'INSERT INTO time_entries (workerId, siteId, date, startTime, endTime, totalHours, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([entry.workerId, entry.siteId, entry.date, entry.startTime, entry.endTime, entry.totalHours, entry.status]);
    const id = this.db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    stmt.free();
    this.saveToLocalStorage();
    return id;
  }

  updateTimeEntry(id: number, entry: Partial<TimeEntry>): void {
    const fields = Object.keys(entry).filter(key => key !== 'id');
    const values = fields.map(key => entry[key as keyof TimeEntry]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    this.db.run(`UPDATE time_entries SET ${setClause} WHERE id = ?`, [...values, id]);
    this.saveToLocalStorage();
  }

  deleteTimeEntry(id: number): void {
    this.db.run('DELETE FROM time_entries WHERE id = ?', [id]);
    this.saveToLocalStorage();
  }

  // Payments CRUD
  getPayments(): any[] {
    const stmt = this.db.prepare(`
      SELECT p.*, w.name as workerName 
      FROM payments p
      JOIN workers w ON p.workerId = w.id
      ORDER BY p.createdAt DESC
    `);
    const payments = [];
    while (stmt.step()) {
      payments.push(stmt.getAsObject());
    }
    stmt.free();
    return payments;
  }

  addPayment(payment: Omit<Payment, 'id'>): number {
    const stmt = this.db.prepare(
      'INSERT INTO payments (workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([payment.workerId, payment.week, payment.hours, payment.hourlyRate, payment.totalAmount, payment.overtime, payment.status, payment.paidDate, payment.method]);
    const id = this.db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    stmt.free();
    this.saveToLocalStorage();
    return id;
  }

  updatePayment(id: number, payment: Partial<Payment>): void {
    const fields = Object.keys(payment).filter(key => key !== 'id');
    const values = fields.map(key => payment[key as keyof Payment]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    this.db.run(`UPDATE payments SET ${setClause} WHERE id = ?`, [...values, id]);
    this.saveToLocalStorage();
  }

  deletePayment(id: number): void {
    this.db.run('DELETE FROM payments WHERE id = ?', [id]);
    this.saveToLocalStorage();
  }

  // Dashboard stats
  getDashboardStats() {
    const activeWorkers = this.db.exec('SELECT COUNT(*) as count FROM workers WHERE status = "Attivo"')[0].values[0][0];
    const activeSites = this.db.exec('SELECT COUNT(*) as count FROM sites WHERE status = "Attivo"')[0].values[0][0];
    const pendingPayments = this.db.exec('SELECT COUNT(*) as count FROM payments WHERE status = "Da Pagare"')[0].values[0][0];
    const todayHours = this.db.exec('SELECT COALESCE(SUM(totalHours), 0) as total FROM time_entries WHERE date = date("now")')[0].values[0][0];

    return {
      activeWorkers,
      activeSites,
      pendingPayments,
      todayHours
    };
  }
}

export const database = new Database();