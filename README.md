# Edil-Check - Sistema Self-Hosted per Gestione Operai Edili

Sistema completo di gestione per squadre edili con backend Node.js/Express e database SQLite.

## 🚀 Caratteristiche

- **🔐 Autenticazione Multi-Utente** - Ogni utente ha il proprio spazio isolato
- **📊 Database SQLite** - Leggero e performante, un database per installazione
- **🏗️ Gestione Completa** - Operai, cantieri, ore di lavoro, pagamenti
- **📱 Responsive** - Accessibile da desktop e mobile
- **🌙 Dark Mode** - Tema chiaro/scuro
- **🔒 Sicurezza** - JWT tokens, password hashate con bcrypt

## 📋 Requisiti

- Node.js 18+ 
- npm o yarn

## 🛠️ Installazione

1. **Clona il repository**
```bash
git clone <repository-url>
cd edil-check
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Avvia il sistema**
```bash
npm run dev
```

Il sistema sarà disponibile su:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001

## 🗄️ Database

Il database SQLite viene creato automaticamente in `server/database.db` al primo avvio.

### Schema Database:
- **users** - Utenti del sistema
- **workers** - Operai (isolati per utente)
- **sites** - Cantieri (isolati per utente)
- **time_entries** - Registrazioni ore lavorate
- **payments** - Gestione pagamenti
- **site_workers** - Assegnazioni operai-cantieri

## 🔧 Configurazione

### Variabili d'Ambiente (opzionali)

Crea un file `.env` nella root:

```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
```

### Configurazione Produzione

Per il deployment in produzione:

1. **Build del frontend**
```bash
npm run build
```

2. **Configurazione server**
```bash
# Modifica server/index.js per servire i file statici
app.use(express.static('dist'));
```

3. **Avvio produzione**
```bash
NODE_ENV=production npm run server
```

## 🌐 Accesso Remoto

Per rendere il sistema accessibile da remoto:

1. **Configura il CORS** nel server per il tuo dominio
2. **Usa un reverse proxy** (nginx, Apache)
3. **Configura HTTPS** per la sicurezza
4. **Firewall** - Apri solo le porte necessarie

### Esempio nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📱 Funzionalità

### 👥 Gestione Operai
- Anagrafica completa
- Ruoli e specializzazioni
- Tariffe orarie personalizzate
- Stati (Attivo, In Permesso, Inattivo)

### 🏗️ Gestione Cantieri
- Informazioni progetto
- Date inizio/fine
- Assegnazione operai
- Stati cantiere

### ⏰ Tracciamento Ore
- Registrazione ore giornaliere
- Calcolo automatico ore totali
- Stati approvazione
- Storico completo

### 💰 Gestione Pagamenti
- Calcolo automatico stipendi
- Gestione straordinari
- Tracking pagamenti
- Metodi di pagamento

### 📊 Dashboard
- Statistiche in tempo reale
- Attività recenti
- Pagamenti in sospeso
- Ore lavorate oggi

## 🔒 Sicurezza

- **Password hashate** con bcrypt
- **JWT tokens** per autenticazione
- **Isolamento dati** per utente
- **Validazione input** server-side
- **CORS configurabile**

## 🚀 Deployment

### Docker (Opzionale)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "server"]
```

### Systemd Service

```ini
[Unit]
Description=Edil-Check Server
After=network.target

[Service]
Type=simple
User=edilcheck
WorkingDirectory=/path/to/edil-check
ExecStart=/usr/bin/node server/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## 📝 API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Info utente

### Operai
- `GET /api/workers` - Lista operai
- `POST /api/workers` - Crea operaio
- `PUT /api/workers/:id` - Aggiorna operaio
- `DELETE /api/workers/:id` - Elimina operaio

### Cantieri
- `GET /api/sites` - Lista cantieri
- `POST /api/sites` - Crea cantiere
- `PUT /api/sites/:id` - Aggiorna cantiere
- `DELETE /api/sites/:id` - Elimina cantiere

### Ore di Lavoro
- `GET /api/time-entries` - Lista registrazioni
- `POST /api/time-entries` - Crea registrazione
- `PUT /api/time-entries/:id` - Aggiorna registrazione
- `DELETE /api/time-entries/:id` - Elimina registrazione

### Pagamenti
- `GET /api/payments` - Lista pagamenti
- `POST /api/payments` - Crea pagamento
- `PUT /api/payments/:id` - Aggiorna pagamento
- `DELETE /api/payments/:id` - Elimina pagamento

## 🤝 Supporto

Per supporto e domande, contatta il team di sviluppo.

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT.