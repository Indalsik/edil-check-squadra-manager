import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
  origin: NODE_ENV === 'development' ? 'http://localhost:3000' : true,
  credentials: true
}));
app.use(express.json());

// Database setup - SQLite file nella stessa cartella del programma
const dbPath = path.join(__dirname, 'edilcheck.db');
const db = createClient({
  url: `file:${dbPath}`
});

console.log(`📁 Database SQLite: ${dbPath}`);

// Initialize database tables
await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Attivo',
    hourly_rate REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Attivo',
    start_date DATE NOT NULL,
    estimated_end DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    site_id INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confermato',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
  );
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    week TEXT NOT NULL,
    hours REAL NOT NULL,
    hourly_rate REAL NOT NULL,
    total_amount REAL NOT NULL,
    overtime REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Da Pagare',
    paid_date DATE,
    method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
  );
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS site_workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    UNIQUE(site_id, worker_id)
  );
`);

// Crea utente demo se non esiste
const demoUserResult = await db.execute({
  sql: 'SELECT id FROM users WHERE email = ?',
  args: ['demo@edilcheck.com']
});

if (demoUserResult.rows.length === 0) {
  const hashedPassword = bcrypt.hashSync('demo123', 10);
  const result = await db.execute({
    sql: 'INSERT INTO users (email, password) VALUES (?, ?)',
    args: ['demo@edilcheck.com', hashedPassword]
  });
  const demoUserId = result.lastInsertRowid;
  
  // Inserisci dati demo
  const demoWorkers = [
    { name: "Mario Rossi", role: "Muratore", phone: "+39 333 1234567", email: "mario.rossi@email.com", status: "Attivo", hourly_rate: 18.50 },
    { name: "Giuseppe Verdi", role: "Elettricista", phone: "+39 333 2345678", email: "giuseppe.verdi@email.com", status: "Attivo", hourly_rate: 22.00 },
    { name: "Antonio Bianchi", role: "Idraulico", phone: "+39 333 3456789", email: "antonio.bianchi@email.com", status: "In Permesso", hourly_rate: 20.00 }
  ];
  
  const demoSites = [
    { name: "Villa Moderna", owner: "Famiglia Rossi", address: "Via Roma 123, Milano", status: "Attivo", start_date: "2024-01-15", estimated_end: "2024-06-30" },
    { name: "Ristrutturazione Uffici", owner: "TechCorp SRL", address: "Via Garibaldi 45, Roma", status: "Attivo", start_date: "2024-02-01", estimated_end: "2024-05-15" }
  ];
  
  for (const worker of demoWorkers) {
    await db.execute({
      sql: 'INSERT INTO workers (user_id, name, role, phone, email, status, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [demoUserId, worker.name, worker.role, worker.phone, worker.email, worker.status, worker.hourly_rate]
    });
  }
  
  for (const site of demoSites) {
    await db.execute({
      sql: 'INSERT INTO sites (user_id, name, owner, address, status, start_date, estimated_end) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [demoUserId, site.name, site.owner, site.address, site.status, site.start_date, site.estimated_end]
    });
  }
  
  console.log('✅ Dati demo creati per utente: demo@edilcheck.com / demo123');
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingUserResult = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    });
    
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (email, password) VALUES (?, ?)',
      args: [email, hashedPassword]
    });
    
    const token = jwt.sign({ userId: result.lastInsertRowid, email }, JWT_SECRET);
    
    res.json({ token, user: { id: result.lastInsertRowid, email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Errore durante la registrazione' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userResult = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout effettuato' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Workers routes
app.get('/api/workers', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM workers WHERE user_id = ? ORDER BY name',
      args: [req.user.userId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero operai' });
  }
});

app.post('/api/workers', authenticateToken, async (req, res) => {
  try {
    const { name, role, phone, email, status, hourlyRate } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO workers (user_id, name, role, phone, email, status, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.userId, name, role, phone, email, status, hourlyRate]
    });
    
    const workerResult = await db.execute({
      sql: 'SELECT * FROM workers WHERE id = ?',
      args: [result.lastInsertRowid]
    });
    res.json(workerResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione operaio' });
  }
});

app.put('/api/workers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, status, hourlyRate } = req.body;
    
    await db.execute({
      sql: 'UPDATE workers SET name = ?, role = ?, phone = ?, email = ?, status = ?, hourly_rate = ? WHERE id = ? AND user_id = ?',
      args: [name, role, phone, email, status, hourlyRate, id, req.user.userId]
    });
    
    const workerResult = await db.execute({
      sql: 'SELECT * FROM workers WHERE id = ? AND user_id = ?',
      args: [id, req.user.userId]
    });
    res.json(workerResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento operaio' });
  }
});

app.delete('/api/workers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: 'DELETE FROM workers WHERE id = ? AND user_id = ?',
      args: [id, req.user.userId]
    });
    res.json({ message: 'Operaio eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione operaio' });
  }
});

// Sites routes
app.get('/api/sites', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM sites WHERE user_id = ? ORDER BY name',
      args: [req.user.userId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero cantieri' });
  }
});

app.post('/api/sites', authenticateToken, async (req, res) => {
  try {
    const { name, owner, address, status, startDate, estimatedEnd } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO sites (user_id, name, owner, address, status, start_date, estimated_end) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.userId, name, owner, address, status, startDate, estimatedEnd]
    });
    
    const siteResult = await db.execute({
      sql: 'SELECT * FROM sites WHERE id = ?',
      args: [result.lastInsertRowid]
    });
    res.json(siteResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione cantiere' });
  }
});

app.put('/api/sites/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, owner, address, status, startDate, estimatedEnd } = req.body;
    
    await db.execute({
      sql: 'UPDATE sites SET name = ?, owner = ?, address = ?, status = ?, start_date = ?, estimated_end = ? WHERE id = ? AND user_id = ?',
      args: [name, owner, address, status, startDate, estimatedEnd, id, req.user.userId]
    });
    
    const siteResult = await db.execute({
      sql: 'SELECT * FROM sites WHERE id = ? AND user_id = ?',
      args: [id, req.user.userId]
    });
    res.json(siteResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento cantiere' });
  }
});

app.delete('/api/sites/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: 'DELETE FROM sites WHERE id = ? AND user_id = ?',
      args: [id, req.user.userId]
    });
    res.json({ message: 'Cantiere eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione cantiere' });
  }
});

// Time entries routes
app.get('/api/time-entries', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT te.*, w.name as workerName, s.name as siteName 
            FROM time_entries te
            JOIN workers w ON te.worker_id = w.id
            JOIN sites s ON te.site_id = s.id
            WHERE te.user_id = ?
            ORDER BY te.date DESC, te.start_time`,
      args: [req.user.userId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero ore' });
  }
});

app.post('/api/time-entries', authenticateToken, async (req, res) => {
  try {
    const { workerId, siteId, date, startTime, endTime, totalHours, status } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO time_entries (user_id, worker_id, site_id, date, start_time, end_time, total_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.userId, workerId, siteId, date, startTime, endTime, totalHours, status]
    });
    
    const entryResult = await db.execute({
      sql: `SELECT te.*, w.name as workerName, s.name as siteName 
            FROM time_entries te
            JOIN workers w ON te.worker_id = w.id
            JOIN sites s ON te.site_id = s.id
            WHERE te.id = ?`,
      args: [result.lastInsertRowid]
    });
    res.json(entryResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella registrazione ore' });
  }
});

app.put('/api/time-entries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId, siteId, date, startTime, endTime, totalHours, status } = req.body;
    
    await db.execute({
      sql: 'UPDATE time_entries SET worker_id = ?, site_id = ?, date = ?, start_time = ?, end_time = ?, total_hours = ?, status = ? WHERE id = ? AND user_id = ?',
      args: [workerId, siteId, date, startTime, endTime, totalHours, status, id, req.user.userId]
    });
    
    const entryResult = await db.execute({
      sql: `SELECT te.*, w.name as workerName, s.name as siteName 
            FROM time_entries te
            JOIN workers w ON te.worker_id = w.id
            JOIN sites s ON te.site_id = s.id
            WHERE te.id = ? AND te.user_id = ?`,
      args: [id, req.user.userId]
    });
    res.json(entryResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento ore' });
  }
});

app.delete('/api/time-entries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: 'DELETE FROM time_entries WHERE id = ? AND user_id = ?',
      args: [id, req.user.userId]
    });
    res.json({ message: 'Registrazione ore eliminata' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione ore' });
  }
});

// Payments routes
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT p.*, w.name as workerName 
            FROM payments p
            JOIN workers w ON p.worker_id = w.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC`,
      args: [req.user.userId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero pagamenti' });
  }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO payments (user_id, worker_id, week, hours, hourly_rate, total_amount, overtime, status, paid_date, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.userId, workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method]
    });
    
    const paymentResult = await db.execute({
      sql: `SELECT p.*, w.name as workerName 
            FROM payments p
            JOIN workers w ON p.worker_id = w.id
            WHERE p.id = ?`,
      args: [result.lastInsertRowid]
    });
    res.json(paymentResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione pagamento' });
  }
});

app.put('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method } = req.body;
    
    await db.execute({
      sql: 'UPDATE payments SET worker_id = ?, week = ?, hours = ?, hourly_rate = ?, total_amount = ?, overtime = ?, status = ?, paid_date = ?, method = ? WHERE id = ? AND user_id = ?',
      args: [workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method, id, req.user.userId]
    });
    
    const paymentResult = await db.execute({
      sql: `SELECT p.*, w.name as workerName 
            FROM payments p
            JOIN workers w ON p.worker_id = w.id
            WHERE p.id = ? AND p.user_id = ?`,
      args: [id, req.user.userId]
    });
    res.json(paymentResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento pagamento' });
  }
});

app.delete('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: 'DELETE FROM payments WHERE id = ? AND user_id = ?',
      args: [id, req.user.userId]
    });
    res.json({ message: 'Pagamento eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione pagamento' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const activeWorkersResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM workers WHERE user_id = ? AND status = "Attivo"',
      args: [req.user.userId]
    });
    const activeSitesResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM sites WHERE user_id = ? AND status = "Attivo"',
      args: [req.user.userId]
    });
    const pendingPaymentsResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM payments WHERE user_id = ? AND status = "Da Pagare"',
      args: [req.user.userId]
    });
    const todayHoursResult = await db.execute({
      sql: 'SELECT COALESCE(SUM(total_hours), 0) as total FROM time_entries WHERE user_id = ? AND date = date("now")',
      args: [req.user.userId]
    });

    res.json({
      activeWorkers: activeWorkersResult.rows[0].count,
      activeSites: activeSitesResult.rows[0].count,
      pendingPayments: pendingPaymentsResult.rows[0].count,
      todayHours: todayHoursResult.rows[0].total
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero statistiche' });
  }
});

// Site workers
app.get('/api/sites/:siteId/workers', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;
    const result = await db.execute({
      sql: `SELECT w.* FROM workers w 
            JOIN site_workers sw ON w.id = sw.worker_id 
            WHERE sw.site_id = ? AND w.user_id = ?`,
      args: [siteId, req.user.userId]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero operai cantiere' });
  }
});

// Setup Vite in development or serve static files in production
if (NODE_ENV === 'development') {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.ssrFixStacktrace);
  app.use('*', vite.middlewares);
} else {
  // Serve static files in production
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Edil-Check server running on http://localhost:${PORT}`);
  console.log(`📁 Database SQLite: ${dbPath}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`👤 Account demo: demo@edilcheck.com / demo123`);
});