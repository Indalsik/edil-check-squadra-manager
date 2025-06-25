// Dynamic API configuration based on database mode
const getApiBaseUrl = () => {
  const remoteConfig = localStorage.getItem('edilcheck_remote_config')
  if (remoteConfig) {
    const { host, port } = JSON.parse(remoteConfig)
    return `http://${host}:${port}`
  }
  return 'http://localhost:3002'
}

// Create axios instance with dynamic base URL
const createApiInstance = () => {
  const baseURL = getApiBaseUrl()
  
  const instance = {
    async request(config: any) {
      const url = `${baseURL}${config.url}`
      const options: RequestInit = {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        credentials: 'include'
      }

      if (config.data) {
        options.body = JSON.stringify(config.data)
      }

      const token = localStorage.getItem('edilcheck_token')
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        }
      }

      try {
        const response = await fetch(url, options)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return { data }
      } catch (error: any) {
        console.error('API Error:', error.message)
        if (error.message.includes('401') || error.message.includes('403')) {
          localStorage.removeItem('edilcheck_token')
          localStorage.removeItem('edilcheck_user')
          window.location.href = '/'
        }
        throw error
      }
    },

    get: (url: string) => instance.request({ method: 'GET', url }),
    post: (url: string, data?: any) => instance.request({ method: 'POST', url, data }),
    put: (url: string, data?: any) => instance.request({ method: 'PUT', url, data }),
    delete: (url: string) => instance.request({ method: 'DELETE', url })
  }

  return instance
}

const api = createApiInstance()

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password })
    return response.data
  },
  
  logout: async () => {
    await api.post('/auth/logout')
  },
  
  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  }
}

// Workers API
export const workersAPI = {
  getAll: async () => {
    const response = await api.get('/workers')
    return response.data
  },
  
  create: async (worker: any) => {
    const response = await api.post('/workers', worker)
    return response.data
  },
  
  update: async (id: number, worker: any) => {
    const response = await api.put(`/workers/${id}`, worker)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/workers/${id}`)
  }
}

// Sites API
export const sitesAPI = {
  getAll: async () => {
    const response = await api.get('/sites')
    return response.data
  },
  
  create: async (site: any) => {
    const response = await api.post('/sites', site)
    return response.data
  },
  
  update: async (id: number, site: any) => {
    const response = await api.put(`/sites/${id}`, site)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/sites/${id}`)
  },
  
  getWorkers: async (siteId: number) => {
    const response = await api.get(`/sites/${siteId}/workers`)
    return response.data
  }
}

// Time Entries API
export const timeEntriesAPI = {
  getAll: async () => {
    const response = await api.get('/time-entries')
    return response.data
  },
  
  create: async (entry: any) => {
    const response = await api.post('/time-entries', entry)
    return response.data
  },
  
  update: async (id: number, entry: any) => {
    const response = await api.put(`/time-entries/${id}`, entry)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/time-entries/${id}`)
  }
}

// Payments API
export const paymentsAPI = {
  getAll: async () => {
    const response = await api.get('/payments')
    return response.data
  },
  
  create: async (payment: any) => {
    const response = await api.post('/payments', payment)
    return response.data
  },
  
  update: async (id: number, payment: any) => {
    const response = await api.put(`/payments/${id}`, payment)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/payments/${id}`)
  }
}

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  }
}

export default api