# Edil-Check Database Server

Server database separato per l'applicazione Edil-Check.

## Installazione

```bash
cd database-server
npm install
```

## Avvio

```bash
npm start
```

Il server sarà disponibile su `http://localhost:3002`

## Configurazione

- **Porta**: 3002 (modificabile con variabile d'ambiente `PORT`)
- **Database**: SQLite (`edil-check-database.db`)
- **JWT Secret**: Configurabile con variabile d'ambiente `JWT_SECRET`

## API Endpoints

- `GET /health` - Health check
- `POST /auth/register` - Registrazione utente
- `POST /auth/login` - Login utente
- `GET /workers` - Lista operai
- `GET /sites` - Lista cantieri
- `GET /time-entries` - Lista ore lavorate
- `GET /payments` - Lista pagamenti
- `GET /dashboard/stats` - Statistiche dashboard

## Sicurezza

- Autenticazione JWT
- CORS abilitato per tutti gli origin
- Password hashate con bcrypt
- Isolamento dati per utente