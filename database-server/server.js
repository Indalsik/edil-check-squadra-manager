import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration - molto permissiva per sviluppo
app.use(cors({
  origin: true, // Permetti tutte le origini
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400
}));

// Middleware per gestire preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json({ limit: '50mb' }));

// Directory per i backup
const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('📁 Created backups directory:', backupDir);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Edil-Check Backup Server',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    backupDir: backupDir,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Funzione per ottenere il percorso del file di backup
const getBackupFilePath = (userEmail) => {
  const safeEmail = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
  return path.join(backupDir, `backup_${safeEmail}.json`);
};

// Endpoint per salvare il backup
app.post('/backup', async (req, res) => {
  try {
    console.log('💾 Backup request received');
    const { userEmail, timestamp, data } = req.body;
    
    if (!userEmail || !data) {
      console.log('❌ Missing userEmail or data in backup request');
      return res.status(400).json({ error: 'userEmail e data sono richiesti' });
    }
    
    const backupData = {
      userEmail,
      timestamp: timestamp || new Date().toISOString(),
      data,
      backupVersion: '1.0'
    };
    
    const filePath = getBackupFilePath(userEmail);
    
    // Salva il backup su file
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Backup saved successfully for user:', userEmail);
    console.log('📁 Backup file:', filePath);
    console.log('📊 Backup contains:', {
      workers: data.workers?.length || 0,
      sites: data.sites?.length || 0,
      timeEntries: data.timeEntries?.length || 0,
      payments: data.payments?.length || 0
    });
    
    res.json({ 
      success: true,
      message: 'Backup salvato con successo',
      timestamp: backupData.timestamp,
      filePath: path.basename(filePath)
    });
  } catch (error) {
    console.error('❌ Backup error:', error);
    res.status(500).json({ error: 'Errore durante il salvataggio del backup', details: error.message });
  }
});

// Endpoint per recuperare il backup
app.get('/restore/:userEmail', async (req, res) => {
  try {
    console.log('📥 Restore request received');
    const { userEmail } = req.params;
    
    if (!userEmail) {
      console.log('❌ Missing userEmail in restore request');
      return res.status(400).json({ error: 'userEmail è richiesto' });
    }
    
    const filePath = getBackupFilePath(userEmail);
    
    // Controlla se il file di backup esiste
    if (!fs.existsSync(filePath)) {
      console.log('❌ No backup found for user:', userEmail);
      return res.status(404).json({ error: 'Nessun backup trovato per questo utente' });
    }
    
    // Leggi il backup dal file
    const backupContent = fs.readFileSync(filePath, 'utf8');
    const backupData = JSON.parse(backupContent);
    
    console.log('✅ Backup loaded successfully for user:', userEmail);
    console.log('📁 Backup file:', filePath);
    console.log('📊 Backup contains:', {
      workers: backupData.data?.workers?.length || 0,
      sites: backupData.data?.sites?.length || 0,
      timeEntries: backupData.data?.timeEntries?.length || 0,
      payments: backupData.data?.payments?.length || 0
    });
    
    res.json(backupData);
  } catch (error) {
    console.error('❌ Restore error:', error);
    res.status(500).json({ error: 'Errore durante il recupero del backup', details: error.message });
  }
});

// Endpoint per elencare i backup disponibili
app.get('/backups', async (req, res) => {
  try {
    console.log('📋 Listing available backups');
    
    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));
    
    const backups = backupFiles.map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        return {
          filename: file,
          userEmail: data.userEmail,
          timestamp: data.timestamp,
          size: stats.size,
          modified: stats.mtime,
          itemCount: {
            workers: data.data?.workers?.length || 0,
            sites: data.data?.sites?.length || 0,
            timeEntries: data.data?.timeEntries?.length || 0,
            payments: data.data?.payments?.length || 0
          }
        };
      } catch (parseError) {
        return {
          filename: file,
          userEmail: 'unknown',
          timestamp: stats.mtime.toISOString(),
          size: stats.size,
          modified: stats.mtime,
          error: 'Invalid backup file'
        };
      }
    });
    
    console.log('✅ Found', backups.length, 'backup files');
    res.json({ backups });
  } catch (error) {
    console.error('❌ List backups error:', error);
    res.status(500).json({ error: 'Errore durante il recupero della lista backup', details: error.message });
  }
});

// Endpoint per eliminare un backup
app.delete('/backup/:userEmail', async (req, res) => {
  try {
    console.log('🗑️ Delete backup request received');
    const { userEmail } = req.params;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail è richiesto' });
    }
    
    const filePath = getBackupFilePath(userEmail);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup non trovato per questo utente' });
    }
    
    fs.unlinkSync(filePath);
    
    console.log('✅ Backup deleted successfully for user:', userEmail);
    res.json({ 
      success: true,
      message: 'Backup eliminato con successo'
    });
  } catch (error) {
    console.error('❌ Delete backup error:', error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione del backup', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Errore interno del server', details: err.message });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Edil-Check Backup Server running on http://localhost:${PORT}`);
  console.log(`📁 Backup directory: ${backupDir}`);
  console.log(`🌐 CORS enabled for all origins (development mode)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • GET  /health - Server status`);
  console.log(`   • POST /backup - Save backup`);
  console.log(`   • GET  /restore/:userEmail - Load backup`);
  console.log(`   • GET  /backups - List all backups`);
  console.log(`   • DELETE /backup/:userEmail - Delete backup`);
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
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});