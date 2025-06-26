
// Database types - removed supabase import as it's not used in this local-first app
export interface Worker {
  id?: string
  user_id: string
  name: string
  role: string
  phone: string
  email: string
  status: string
  hourly_rate: number
  created_at?: string
}

export interface Site {
  id?: string
  user_id: string
  name: string
  owner: string
  address: string
  status: string
  start_date: string
  estimated_end: string
  created_at?: string
}

export interface TimeEntry {
  id?: string
  user_id: string
  worker_id: string
  site_id: string
  date: string
  start_time: string
  end_time: string
  total_hours: number
  status: string
  created_at?: string
}

export interface Payment {
  id?: string
  user_id: string
  worker_id: string
  week: string
  hours: number
  hourly_rate: number
  total_amount: number
  overtime: number
  status: string
  paid_date?: string
  method?: string
  created_at?: string
}
