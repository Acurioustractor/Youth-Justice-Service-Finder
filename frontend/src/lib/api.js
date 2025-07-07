import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const apiService = {
  // Health check
  async healthCheck() {
    const response = await api.get('/health')
    return response.data
  },

  // Search services
  async searchServices(params = {}) {
    const response = await api.get('/search', { params })
    return response.data
  },

  // Enhanced Elasticsearch search
  async searchServicesES(params = {}) {
    const response = await api.get('/search/es/enhanced', { params })
    return response.data
  },

  // Fuzzy search
  async fuzzySearch(query, options = {}) {
    const response = await api.get('/search/es/fuzzy', { 
      params: { q: query, ...options } 
    })
    return response.data
  },

  // Geographic search
  async nearbyServices(lat, lng, radius = '10km', limit = 20) {
    const response = await api.get('/search/es/geo', {
      params: { lat, lng, radius, limit }
    })
    return response.data
  },

  // Autocomplete suggestions
  async getAutocomplete(query, type = 'services') {
    const response = await api.get('/search/es/autocomplete/enhanced', {
      params: { q: query, type, limit: 10 }
    })
    return response.data
  },

  // Get all services
  async getServices(params = {}) {
    const response = await api.get('/services', { params })
    return response.data
  },

  // Get service by ID
  async getService(id) {
    const response = await api.get(`/services/${id}`)
    return response.data
  },

  // Get organizations
  async getOrganizations(params = {}) {
    const response = await api.get('/organizations', { params })
    return response.data
  },

  // Get organization by ID
  async getOrganization(id) {
    const response = await api.get(`/organizations/${id}`)
    return response.data
  },

  // Get statistics
  async getStats() {
    const response = await api.get('/stats')
    return response.data
  },

  // Get demographic stats
  async getDemographicStats() {
    const response = await api.get('/stats/demographics')
    return response.data
  },

  // Get geographic stats
  async getGeographicStats() {
    const response = await api.get('/stats/geographic')
    return response.data
  },

  // Search suggestions
  async getSearchSuggestions(context = '') {
    const response = await api.get('/search/es/suggestions', {
      params: { context }
    })
    return response.data
  },

  // Search analytics
  async getSearchAnalytics(period = 'week') {
    const response = await api.get('/search/es/analytics', {
      params: { period }
    })
    return response.data
  }
}

export default api