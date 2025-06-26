// Dynamic API configuration based on database mode
const getApiBaseUrl = () => {
  const remoteConfig = localStorage.getItem('edilcheck_remote_config')
  if (remoteConfig) {
    const { host, port } = JSON.parse(remoteConfig)
    return `http://${host}:${port}`
  }
  return 'http://localhost:3002'
}

// Store current user credentials for API requests
let currentUserCredentials: { email: string; password: string } | null = null

export const setUserCredentials = (email: string, password: string) => {
  currentUserCredentials = { email, password }
}

export const clearUserCredentials = () => {
  currentUserCredentials = null
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

      // Add user credentials to headers for authenticated requests
      if (currentUserCredentials && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
        options.headers = {
          ...options.headers,
          'X-User-Email': currentUserCredentials.email,
          'X-User-Password': currentUserCredentials.password
        }
      }

      try {
        console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`)
        console.log('📋 Request headers:', options.headers)
        console.log('📦 Request body:', config.data)

        const response = await fetch(url, options)
        
        console.log(`📡 Response status: ${response.status} ${response.statusText}`)
        
        if (!response.ok) {
          let errorData
          try {
            const responseText = await response.text()
            console.log('📄 Raw response:', responseText)
            
            // Try to parse as JSON
            try {
              errorData = JSON.parse(responseText)
            } catch {
              errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` }
            }
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
          }
          
          console.error(`❌ API Error: ${response.status}`, errorData)
          
          // Handle authentication errors
          if (response.status === 401 || response.status === 403) {
            console.warn('🔒 Authentication failed, clearing credentials')
            clearUserCredentials()
          }
          
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
        }

        const responseText = await response.text()
        console.log('📄 Raw response:', responseText)
        
        let data
        try {
          data = JSON.parse(responseText)
        } catch {
          data = responseText
        }
        
        console.log(`✅ API Success: ${config.method || 'GET'} ${url}`, data)
        return { data }
      } catch (error: any) {
        console.error(`❌ API Request failed: ${config.method || 'GET'} ${url}`)
        console.error('🔍 Error details:', error)
        
        // Check if it's a network error
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          throw new Error(`Impossibile connettersi al server ${baseURL}. Verifica che il server sia in esecuzione.`)
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
    console.log('🔐 Attempting login for:', email)
    const response = await api.post('/auth/login', { email, password })
    
    // Store credentials for future API calls
    if (response.data.success) {
      setUserCredentials(email, password)
    }
    
    return response.data
  },
  
  register: async (email: string, password: string) => {
    console.log('📝 Attempting registration for:', email)
    const response = await api.post('/auth/register', { email, password })
    
    // Store credentials for future API calls
    if (response.data.success) {
      setUserCredentials(email, password)
    }
    
    return response.data
  },
  
  logout: async () => {
    await api.post('/auth/logout')
    clearUserCredentials()
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
