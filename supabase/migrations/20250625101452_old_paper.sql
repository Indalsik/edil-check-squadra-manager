/*
  # Schema iniziale per Edil-check

  1. Tabelle principali
    - `workers` - Operai con dati personali e tariffe
    - `sites` - Cantieri con informazioni di progetto
    - `time_entries` - Registrazioni ore lavorate
    - `payments` - Pagamenti agli operai
    - `site_workers` - Assegnazioni operai ai cantieri

  2. Sicurezza
    - Abilita RLS su tutte le tabelle
    - Politiche per accesso basato su user_id
    - Ogni utente vede solo i propri dati
*/

-- Tabella operai
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'Attivo',
  hourly_rate decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabella cantieri
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  owner text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'Attivo',
  start_date date NOT NULL,
  estimated_end date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabella registrazioni ore
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_hours decimal(5,2) NOT NULL,
  status text NOT NULL DEFAULT 'Confermato',
  created_at timestamptz DEFAULT now()
);

-- Tabella pagamenti
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  week text NOT NULL,
  hours decimal(5,2) NOT NULL,
  hourly_rate decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  overtime decimal(5,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'Da Pagare',
  paid_date date,
  method text,
  created_at timestamptz DEFAULT now()
);

-- Tabella assegnazioni operai-cantieri
CREATE TABLE IF NOT EXISTS site_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(site_id, worker_id)
);

-- Abilita RLS su tutte le tabelle
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_workers ENABLE ROW LEVEL SECURITY;

-- Politiche RLS per workers
CREATE POLICY "Users can manage their own workers"
  ON workers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiche RLS per sites
CREATE POLICY "Users can manage their own sites"
  ON sites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiche RLS per time_entries
CREATE POLICY "Users can manage their own time entries"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiche RLS per payments
CREATE POLICY "Users can manage their own payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiche RLS per site_workers
CREATE POLICY "Users can manage their own site assignments"
  ON site_workers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites 
      WHERE sites.id = site_workers.site_id 
      AND sites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites 
      WHERE sites.id = site_workers.site_id 
      AND sites.user_id = auth.uid()
    )
  );

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_site_workers_site_id ON site_workers(site_id);
CREATE INDEX IF NOT EXISTS idx_site_workers_worker_id ON site_workers(worker_id);