import axios from 'axios';

// Use relative URL for API calls (will be proxied by Vite)
const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edilcheck_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('edilcheck_token');
      localStorage.removeItem('edilcheck_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
  
  logout: async () => {
    await api.post('/auth/logout');
  },
  
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Workers API
export const workersAPI = {
  getAll: async () => {
    const response = await api.get('/workers');
    return response.data;
  },
  
  create: async (worker: any) => {
    const response = await api.post('/workers', worker);
    return response.data;
  },
  
  update: async (id: number, worker: any) => {
    const response = await api.put(`/workers/${id}`, worker);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/workers/${id}`);
  }
};

// Sites API
export const sitesAPI = {
  getAll: async () => {
    const response = await api.get('/sites');
    return response.data;
  },
  
  create: async (site: any) => {
    const response = await api.post('/sites', site);
    return response.data;
  },
  
  update: async (id: number, site: any) => {
    const response = await api.put(`/sites/${id}`, site);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/sites/${id}`);
  },
  
  getWorkers: async (siteId: number) => {
    const response = await api.get(`/sites/${siteId}/workers`);
    return response.data;
  }
};

// Time Entries API
export const timeEntriesAPI = {
  getAll: async () => {
    const response = await api.get('/time-entries');
    return response.data;
  },
  
  create: async (entry: any) => {
    const response = await api.post('/time-entries', entry);
    return response.data;
  },
  
  update: async (id: number, entry: any) => {
    const response = await api.put(`/time-entries/${id}`, entry);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/time-entries/${id}`);
  }
};

// Payments API
export const paymentsAPI = {
  getAll: async () => {
    const response = await api.get('/payments');
    return response.data;
  },
  
  create: async (payment: any) => {
    const response = await api.post('/payments', payment);
    return response.data;
  },
  
  update: async (id: number, payment: any) => {
    const response = await api.put(`/payments/${id}`, payment);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/payments/${id}`);
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

export default api;