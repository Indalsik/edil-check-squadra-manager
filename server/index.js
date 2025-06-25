import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Database setup
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashedPassword);
    
    // Generate token
    const token = jwt.sign({ userId: result.lastInsertRowid, email }, JWT_SECRET);
    
    res.json({ token, user: { id: result.lastInsertRowid, email } });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante la registrazione' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
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
app.get('/api/workers', authenticateToken, (req, res) => {
  try {
    const workers = db.prepare('SELECT * FROM workers WHERE user_id = ? ORDER BY name').all(req.user.userId);
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero operai' });
  }
});

app.post('/api/workers', authenticateToken, (req, res) => {
  try {
    const { name, role, phone, email, status, hourlyRate } = req.body;
    const result = db.prepare(`
      INSERT INTO workers (user_id, name, role, phone, email, status, hourly_rate) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.userId, name, role, phone, email, status, hourlyRate);
    
    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(result.lastInsertRowid);
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione operaio' });
  }
});

app.put('/api/workers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, status, hourlyRate } = req.body;
    
    db.prepare(`
      UPDATE workers 
      SET name = ?, role = ?, phone = ?, email = ?, status = ?, hourly_rate = ?
      WHERE id = ? AND user_id = ?
    `).run(name, role, phone, email, status, hourlyRate, id, req.user.userId);
    
    const worker = db.prepare('SELECT * FROM workers WHERE id = ? AND user_id = ?').get(id, req.user.userId);
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento operaio' });
  }
});

app.delete('/api/workers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM workers WHERE id = ? AND user_id = ?').run(id, req.user.userId);
    res.json({ message: 'Operaio eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione operaio' });
  }
});

// Sites routes
app.get('/api/sites', authenticateToken, (req, res) => {
  try {
    const sites = db.prepare('SELECT * FROM sites WHERE user_id = ? ORDER BY name').all(req.user.userId);
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero cantieri' });
  }
});

app.post('/api/sites', authenticateToken, (req, res) => {
  try {
    const { name, owner, address, status, startDate, estimatedEnd } = req.body;
    const result = db.prepare(`
      INSERT INTO sites (user_id, name, owner, address, status, start_date, estimated_end) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.userId, name, owner, address, status, startDate, estimatedEnd);
    
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(result.lastInsertRowid);
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione cantiere' });
  }
});

app.put('/api/sites/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, owner, address, status, startDate, estimatedEnd } = req.body;
    
    db.prepare(`
      UPDATE sites 
      SET name = ?, owner = ?, address = ?, status = ?, start_date = ?, estimated_end = ?
      WHERE id = ? AND user_id = ?
    `).run(name, owner, address, status, startDate, estimatedEnd, id, req.user.userId);
    
    const site = db.prepare('SELECT * FROM sites WHERE id = ? AND user_id = ?').get(id, req.user.userId);
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento cantiere' });
  }
});

app.delete('/api/sites/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM sites WHERE id = ? AND user_id = ?').run(id, req.user.userId);
    res.json({ message: 'Cantiere eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione cantiere' });
  }
});

// Time entries routes
app.get('/api/time-entries', authenticateToken, (req, res) => {
  try {
    const entries = db.prepare(`
      SELECT te.*, w.name as workerName, s.name as siteName 
      FROM time_entries te
      JOIN workers w ON te.worker_id = w.id
      JOIN sites s ON te.site_id = s.id
      WHERE te.user_id = ?
      ORDER BY te.date DESC, te.start_time
    `).all(req.user.userId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero ore' });
  }
});

app.post('/api/time-entries', authenticateToken, (req, res) => {
  try {
    const { workerId, siteId, date, startTime, endTime, totalHours, status } = req.body;
    const result = db.prepare(`
      INSERT INTO time_entries (user_id, worker_id, site_id, date, start_time, end_time, total_hours, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.userId, workerId, siteId, date, startTime, endTime, totalHours, status);
    
    const entry = db.prepare(`
      SELECT te.*, w.name as workerName, s.name as siteName 
      FROM time_entries te
      JOIN workers w ON te.worker_id = w.id
      JOIN sites s ON te.site_id = s.id
      WHERE te.id = ?
    `).get(result.lastInsertRowid);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella registrazione ore' });
  }
});

app.put('/api/time-entries/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { workerId, siteId, date, startTime, endTime, totalHours, status } = req.body;
    
    db.prepare(`
      UPDATE time_entries 
      SET worker_id = ?, site_id = ?, date = ?, start_time = ?, end_time = ?, total_hours = ?, status = ?
      WHERE id = ? AND user_id = ?
    `).run(workerId, siteId, date, startTime, endTime, totalHours, status, id, req.user.userId);
    
    const entry = db.prepare(`
      SELECT te.*, w.name as workerName, s.name as siteName 
      FROM time_entries te
      JOIN workers w ON te.worker_id = w.id
      JOIN sites s ON te.site_id = s.id
      WHERE te.id = ? AND te.user_id = ?
    `).get(id, req.user.userId);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento ore' });
  }
});

app.delete('/api/time-entries/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM time_entries WHERE id = ? AND user_id = ?').run(id, req.user.userId);
    res.json({ message: 'Registrazione ore eliminata' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione ore' });
  }
});

// Payments routes
app.get('/api/payments', authenticateToken, (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, w.name as workerName 
      FROM payments p
      JOIN workers w ON p.worker_id = w.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.userId);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero pagamenti' });
  }
});

app.post('/api/payments', authenticateToken, (req, res) => {
  try {
    const { workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method } = req.body;
    const result = db.prepare(`
      INSERT INTO payments (user_id, worker_id, week, hours, hourly_rate, total_amount, overtime, status, paid_date, method) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.userId, workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method);
    
    const payment = db.prepare(`
      SELECT p.*, w.name as workerName 
      FROM payments p
      JOIN workers w ON p.worker_id = w.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione pagamento' });
  }
});

app.put('/api/payments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method } = req.body;
    
    db.prepare(`
      UPDATE payments 
      SET worker_id = ?, week = ?, hours = ?, hourly_rate = ?, total_amount = ?, overtime = ?, status = ?, paid_date = ?, method = ?
      WHERE id = ? AND user_id = ?
    `).run(workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method, id, req.user.userId);
    
    const payment = db.prepare(`
      SELECT p.*, w.name as workerName 
      FROM payments p
      JOIN workers w ON p.worker_id = w.id
      WHERE p.id = ? AND p.user_id = ?
    `).get(id, req.user.userId);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento pagamento' });
  }
});

app.delete('/api/payments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM payments WHERE id = ? AND user_id = ?').run(id, req.user.userId);
    res.json({ message: 'Pagamento eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione pagamento' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const activeWorkers = db.prepare('SELECT COUNT(*) as count FROM workers WHERE user_id = ? AND status = "Attivo"').get(req.user.userId).count;
    const activeSites = db.prepare('SELECT COUNT(*) as count FROM sites WHERE user_id = ? AND status = "Attivo"').get(req.user.userId).count;
    const pendingPayments = db.prepare('SELECT COUNT(*) as count FROM payments WHERE user_id = ? AND status = "Da Pagare"').get(req.user.userId).count;
    const todayHours = db.prepare('SELECT COALESCE(SUM(total_hours), 0) as total FROM time_entries WHERE user_id = ? AND date = date("now")').get(req.user.userId).total;

    res.json({
      activeWorkers,
      activeSites,
      pendingPayments,
      todayHours
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero statistiche' });
  }
});

// Site workers
app.get('/api/sites/:siteId/workers', authenticateToken, (req, res) => {
  try {
    const { siteId } = req.params;
    const workers = db.prepare(`
      SELECT w.* FROM workers w 
      JOIN site_workers sw ON w.id = sw.worker_id 
      WHERE sw.site_id = ? AND w.user_id = ?
    `).all(siteId, req.user.userId);
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero operai cantiere' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
});