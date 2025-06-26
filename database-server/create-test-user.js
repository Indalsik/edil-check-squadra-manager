// Script per creare utente di test nel database remoto
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createTestUser = async () => {
  console.log('🔧 Creating test user for Edil-Check Database...\n');
  
  try {
    // Initialize database
    const SQL = await initSqlJs();
    const dbPath = path.join(process.cwd(), 'edil-check-database.db');
    
    let data;
    try {
      data = fs.readFileSync(dbPath);
      console.log('✅ Database file loaded');
    } catch (err) {
      console.log('📝 Creating new database file');
      data = null;
    }
    
    const db = new SQL.Database(data);
    
    // Create tables if they don't exist
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
    `);
    
    // Create test users
    const testUsers = [
      { email: 'admin@edilcheck.com', password: 'edilcheck123' },
      { email: 'test@edilcheck.com', password: 'edilcheck123' },
      { email: 'demo@edilcheck.com', password: 'demo123' }
    ];
    
    for (const user of testUsers) {
      try {
        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get([user.email]);
        
        if (existingUser) {
          console.log(`⚠️  User ${user.email} already exists`);
          continue;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Create user
        const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run([user.email, hashedPassword]);
        console.log(`✅ Created user: ${user.email} (ID: ${result.lastID})`);
        
        // Add some sample data for the first user
        if (user.email === 'admin@edilcheck.com') {
          const userId = result.lastID;
          
          // Add sample worker
          const workerResult = db.prepare(`
            INSERT INTO workers (user_id, name, role, phone, email, status, hourly_rate) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run([userId, 'Mario Rossi', 'Muratore', '+39 333 1234567', 'mario.rossi@example.com', 'Attivo', 18.50]);
          
          // Add sample site
          const siteResult = db.prepare(`
            INSERT INTO sites (user_id, name, owner, address, status, start_date, estimated_end) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run([userId, 'Villa Moderna', 'Famiglia Bianchi', 'Via Roma 123, Milano', 'Attivo', '2024-01-15', '2024-06-30']);
          
          // Add sample time entry
          db.prepare(`
            INSERT INTO time_entries (user_id, worker_id, site_id, date, start_time, end_time, total_hours, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run([userId, workerResult.lastID, siteResult.lastID, '2024-01-20', '08:00', '17:00', 8, 'Confermato']);
          
          // Add sample payment
          db.prepare(`
            INSERT INTO payments (user_id, worker_id, week, hours, hourly_rate, total_amount, overtime, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run([userId, workerResult.lastID, 'Settimana 3/2024', 40, 18.50, 740, 0, 'Da Pagare']);
          
          console.log(`📊 Added sample data for ${user.email}`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }
    
    // Save database
    const dbData = db.export();
    fs.writeFileSync(dbPath, dbData);
    console.log('\n✅ Database saved successfully');
    
    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Available test accounts:');
    console.log('   • admin@edilcheck.com / edilcheck123 (with sample data)');
    console.log('   • test@edilcheck.com / edilcheck123 (empty)');
    console.log('   • demo@edilcheck.com / demo123 (empty)');
    console.log('\n🚀 You can now start the server with: npm start');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
};

// Run the script
createTestUser();