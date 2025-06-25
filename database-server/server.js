import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'edil-check-database-secret-key';

// CORS configuration - MIGLIORATA per essere più permissiva
app.use(cors({
  origin: function (origin, callback) {
    // Permetti richieste senza origin (es. app mobile, Postman)
    if (!origin) return callback(null, true);
    
    // Lista di origini permesse
    const allowedOrigins = [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      // Permetti tutti i domini webcontainer
      /^https:\/\/.*\.webcontainer-api\.io$/,
      /^https:\/\/.*\.local-credentialless\.webcontainer-api\.io$/,
      /^https:\/\/.*\.stackblitz\.io$/,
      /^https:\/\/.*\.bolt\.new$/
    ];
    
    // Controlla se l'origin è permesso
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else {
        return allowedOrigin.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(null, true); // Per sviluppo, permetti comunque
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 ore
}));

// Middleware per gestire preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());

// Database setup
let db;
const dbPath = path.join(process.cwd(), 'edil-check-database.db');

try {
  console.log('📊 Initializing Edil-Check Database Server at:', dbPath);
  
  const SQL = await initSqlJs();
  
  let data;
  try {
    data = fs.readFileSync(dbPath);
    console.log('✅ Existing database file loaded');
  } catch (err) {
    console.log('📝 Creating new database file');
    data = null;
  }
  
  db = new SQL.Database(data);
  console.log('✅ Database connection successful');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}

// Helper function to save database
const saveDatabase = () => {
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, data);
  } catch (error) {
    console.error('❌ Error saving database:', error);
  }
};

// Initialize database tables
try {
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
  saveDatabase();
  console.log('✅ Database tables initialized');
} catch (error) {
  console.error('❌ Database table creation failed:', error);
  process.exit(1);
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token mancante' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token non valido' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ error: 'Errore di autenticazione' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Edil-Check Database Server',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono richiesti' });
    }
    
    const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const existingUser = stmt.get([email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertStmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    const result = insertStmt.run([email, hashedPassword]);
    saveDatabase();
    
    const token = jwt.sign({ userId: result.lastID, email }, JWT_SECRET);
    
    res.json({ token, user: { id: result.lastID, email } });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Errore durante la registrazione' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono richiesti' });
    }
    
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get([email]);
    
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logout effettuato' });
});

app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Workers routes
app.get('/workers', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM workers WHERE user_id = ? ORDER BY name');
    const workers = stmt.all([req.user.userId]);
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero operai' });
  }
});

app.post('/workers', authenticateToken, (req, res) => {
  try {
    const { name, role, phone, email, status, hourlyRate } = req.body;
    const stmt = db.prepare(`
      INSERT INTO workers (user_id, name, role, phone, email, status, hourly_rate) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run([req.user.userId, name, role, phone, email, status, hourlyRate]);
    saveDatabase();
    
    const getStmt = db.prepare('SELECT * FROM workers WHERE id = ?');
    const worker = getStmt.get([result.lastID]);
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione operaio' });
  }
});

app.put('/workers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, status, hourlyRate } = req.body;
    
    const stmt = db.prepare(`
      UPDATE workers 
      SET name = ?, role = ?, phone = ?, email = ?, status = ?, hourly_rate = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run([name, role, phone, email, status, hourlyRate, id, req.user.userId]);
    saveDatabase();
    
    const getStmt = db.prepare('SELECT * FROM workers WHERE id = ? AND user_id = ?');
    const worker = getStmt.get([id, req.user.userId]);
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento operaio' });
  }
});

app.delete('/workers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM workers WHERE id = ? AND user_id = ?');
    stmt.run([id, req.user.userId]);
    saveDatabase();
    res.json({ message: 'Operaio eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione operaio' });
  }
});

// Sites routes
app.get('/sites', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM sites WHERE user_id = ? ORDER BY name');
    const sites = stmt.all([req.user.userId]);
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero cantieri' });
  }
});

app.post('/sites', authenticateToken, (req, res) => {
  try {
    const { name, owner, address, status, startDate, estimatedEnd } = req.body;
    const stmt = db.prepare(`
      INSERT INTO sites (user_id, name, owner, address, status, start_date, estimated_end) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run([req.user.userId, name, owner, address, status, startDate, estimatedEnd]);
    saveDatabase();
    
    const getStmt = db.prepare('SELECT * FROM sites WHERE id = ?');
    const site = getStmt.get([result.lastID]);
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione cantiere' });
  }
});

app.put('/sites/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, owner, address, status, startDate, estimatedEnd } = req.body;
    
    const stmt = db.prepare(`
      UPDATE sites 
      SET name = ?, owner = ?, address = ?, status = ?, start_date = ?, estimated_end = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run([name, owner, address, status, startDate, estimatedEnd, id, req.user.userId]);
    saveDatabase();
    
    const getStmt = db.prepare('SELECT * FROM sites WHERE id = ? AND user_id = ?');
    const site = getStmt.get([id, req.user.userId]);
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento cantiere' });
  }
});

app.delete('/sites/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM sites WHERE id = ? AND user_id = ?');
    stmt.run([id, req.user.userId]);
    saveDatabase();
    res.json({ message: 'Cantiere eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione cantiere' });
  }
});

// Time entries routes
app.get('/time-entries', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT te.*, w.name as workerName, s.name as siteName 
      FROM time_entries te
      JOIN workers w ON te.worker_id = w.id
      JOIN sites s ON te.site_id = s.id
      WHERE te.user_id = ?
      ORDER BY te.date DESC, te.start_time
    `);
    const entries = stmt.all([req.user.userId]);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero ore' });
  }
});

app.post('/time-entries', authenticateToken, (req, res) => {
  try {
    const { workerId, siteId, date, startTime, endTime, totalHours, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO time_entries (user_id, worker_id, site_id, date, start_time, end_time, total_hours, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run([req.user.userId, workerId, siteId, date, startTime, endTime, totalHours, status]);
    saveDatabase();
    
    const getStmt = db.prepare(`
      SELECT te.*, w.name as workerName, s.name as siteName 
      FROM time_entries te
      JOIN workers w ON te.worker_id = w.id
      JOIN sites s ON te.site_id = s.id
      WHERE te.id = ?
    `);
    const entry = getStmt.get([result.lastID]);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella registrazione ore' });
  }
});

app.put('/time-entries/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { workerId, siteId, date, startTime, endTime, totalHours, status } = req.body;
    
    const stmt = db.prepare(`
      UPDATE time_entries 
      SET worker_id = ?, site_id = ?, date = ?, start_time = ?, end_time = ?, total_hours = ?, status = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run([workerId, siteId, date, startTime, endTime, totalHours, status, id, req.user.userId]);
    saveDatabase();
    
    const getStmt = db.prepare(`
      SELECT te.*, w.name as workerName, s.name as siteName 
      FROM time_entries te
      JOIN workers w ON te.worker_id = w.id
      JOIN sites s ON te.site_id = s.id
      WHERE te.id = ? AND te.user_id = ?
    `);
    const entry = getStmt.get([id, req.user.userId]);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento ore' });
  }
});

app.delete('/time-entries/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM time_entries WHERE id = ? AND user_id = ?');
    stmt.run([id, req.user.userId]);
    saveDatabase();
    res.json({ message: 'Registrazione ore eliminata' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione ore' });
  }
});

// Payments routes
app.get('/payments', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT p.*, w.name as workerName 
      FROM payments p
      JOIN workers w ON p.worker_id = w.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `);
    const payments = stmt.all([req.user.userId]);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero pagamenti' });
  }
});

app.post('/payments', authenticateToken, (req, res) => {
  try {
    const { workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method } = req.body;
    const stmt = db.prepare(`
      INSERT INTO payments (user_id, worker_id, week, hours, hourly_rate, total_amount, overtime, status, paid_date, method) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run([req.user.userId, workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method]);
    saveDatabase();
    
    const getStmt = db.prepare(`
      SELECT p.*, w.name as workerName 
      FROM payments p
      JOIN workers w ON p.worker_id = w.id
      WHERE p.id = ?
    `);
    const payment = getStmt.get([result.lastID]);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione pagamento' });
  }
});

app.put('/payments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method } = req.body;
    
    const stmt = db.prepare(`
      UPDATE payments 
      SET worker_id = ?, week = ?, hours = ?, hourly_rate = ?, total_amount = ?, overtime = ?, status = ?, paid_date = ?, method = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run([workerId, week, hours, hourlyRate, totalAmount, overtime, status, paidDate, method, id, req.user.userId]);
    saveDatabase();
    
    const getStmt = db.prepare(`
      SELECT p.*, w.name as workerName 
      FROM payments p
      JOIN workers w ON p.worker_id = w.id
      WHERE p.id = ? AND p.user_id = ?
    `);
    const payment = getStmt.get([id, req.user.userId]);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento pagamento' });
  }
});

app.delete('/payments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM payments WHERE id = ? AND user_id = ?');
    stmt.run([id, req.user.userId]);
    saveDatabase();
    res.json({ message: 'Pagamento eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione pagamento' });
  }
});

// Dashboard stats
app.get('/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const activeWorkersStmt = db.prepare('SELECT COUNT(*) as count FROM workers WHERE user_id = ? AND status = ?');
    const activeWorkers = activeWorkersStmt.get([req.user.userId, 'Attivo'])?.count || 0;
    
    const activeSitesStmt = db.prepare('SELECT COUNT(*) as count FROM sites WHERE user_id = ? AND status = ?');
    const activeSites = activeSitesStmt.get([req.user.userId, 'Attivo'])?.count || 0;
    
    const pendingPaymentsStmt = db.prepare('SELECT COUNT(*) as count FROM payments WHERE user_id = ? AND status = ?');
    const pendingPayments = pendingPaymentsStmt.get([req.user.userId, 'Da Pagare'])?.count || 0;
    
    const todayHoursStmt = db.prepare('SELECT COALESCE(SUM(total_hours), 0) as total FROM time_entries WHERE user_id = ? AND date = date("now")');
    const todayHours = todayHoursStmt.get([req.user.userId])?.total || 0;

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
app.get('/sites/:siteId/workers', authenticateToken, (req, res) => {
  try {
    const { siteId } = req.params;
    const stmt = db.prepare(`
      SELECT w.* FROM workers w 
      JOIN site_workers sw ON w.id = sw.worker_id 
      WHERE sw.site_id = ? AND w.user_id = ?
    `);
    const workers = stmt.all([siteId, req.user.userId]);
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero operai cantiere' });
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Edil-Check Database Server running on http://localhost:${PORT}`);
  console.log(`📊 Database file: ${dbPath}`);
  console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
  console.log(`🌐 CORS enabled for all origins (development mode)`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    if (db) {
      saveDatabase();
      db.close();
      console.log('✅ Database closed');
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    if (db) {
      saveDatabase();
      db.close();
      console.log('✅ Database closed');
    }
    process.exit(0);
  });
});