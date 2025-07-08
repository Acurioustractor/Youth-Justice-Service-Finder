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
    
    // For demo mode, return mock data instead of failing
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.log('API not available, using demo mode')
      return Promise.resolve({
        data: {
          error: 'API_UNAVAILABLE',
          demo_mode: true
        }
      })
    }
    
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
    try {
      const response = await api.get('/search', { params })
      return response.data
    } catch (error) {
      // Return demo search results if API unavailable
      console.log('Using demo search data')
      return {
        services: [
          {
            id: 'demo-1',
            name: 'Brisbane Youth Legal Service',
            description: 'Free legal advice and representation for young people aged 10-17 in Brisbane.',
            organization: { name: 'Youth Advocacy Centre' },
            location: { city: 'Brisbane', state: 'QLD', suburb: 'South Brisbane' },
            contact: { phone: { primary: '07 3356 1002' }, website: 'https://yac.net.au' },
            categories: ['legal_aid', 'youth_development'],
            youth_specific: true
          },
          {
            id: 'demo-2', 
            name: 'Headspace Sydney',
            description: 'Mental health support for young people aged 12-25 in Sydney CBD.',
            organization: { name: 'Headspace' },
            location: { city: 'Sydney', state: 'NSW', suburb: 'Sydney CBD' },
            contact: { phone: { primary: '02 9114 4100' }, website: 'https://headspace.org.au' },
            categories: ['mental_health', 'counselling'],
            youth_specific: true
          }
        ],
        total: 2,
        demo_mode: true,
        message: 'Demo results - 603+ services available when backend is deployed'
      }
    }
  },

  // Enhanced Elasticsearch search (fallback to simple search)
  async searchServicesES(params = {}) {
    try {
      // Try Elasticsearch first
      const response = await api.get('/search/es/enhanced', { params })
      return response.data
    } catch (error) {
      // Fallback to simple search for free hosting
      console.log('Falling back to simple search')
      const response = await api.get('/search/simple', { params })
      return response.data
    }
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
    try {
      // Try Elasticsearch geo search first
      const response = await api.get('/search/es/geo', {
        params: { lat, lng, radius, limit }
      })
      return response.data
    } catch (error) {
      // Fallback to simple geo search for free hosting
      console.log('Falling back to simple geo search')
      const response = await api.get('/search/geo', {
        params: { lat, lng, radius, limit }
      })
      return response.data
    }
  },

  // Autocomplete suggestions
  async getAutocomplete(query, type = 'services') {
    try {
      // Try Elasticsearch autocomplete first
      const response = await api.get('/search/es/autocomplete/enhanced', {
        params: { q: query, type, limit: 10 }
      })
      return response.data
    } catch (error) {
      // Fallback to simple autocomplete for free hosting
      console.log('Falling back to simple autocomplete')
      const response = await api.get('/search/autocomplete', {
        params: { q: query, limit: 10 }
      })
      return response.data
    }
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
    try {
      const response = await api.get('/stats')
      if (response.data && typeof response.data === 'object') {
        return response.data
      }
      throw new Error('Invalid response format')
    } catch (error) {
      // Return demo stats if API unavailable
      console.log('Using demo stats data:', error.message)
      return {
        totals: {
          services: 603,
          organizations: 400
        },
        regions: ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'ACT', 'NT', 'TAS'],
        categories: [
          'Youth Development',
          'Mental Health', 
          'Legal Aid',
          'Housing Support',
          'Family Services',
          'Education Support',
          'Health Services',
          'Crisis Support'
        ],
        demo_mode: true,
        status: 'Demo data - database import pending. Search will show demo results until 603 services are imported.'
      }
    }
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
  },

  // Working search endpoint that actually works
  async workingSearch(params = {}) {
    try {
      const response = await api.get('/working-search', { params })
      return response.data
    } catch (error) {
      // Return demo search results if API unavailable
      console.log('Using demo search data')
      return {
        services: [
          {
            id: 'demo-1',
            name: 'Brisbane Youth Legal Service',
            description: 'Free legal advice and representation for young people aged 10-17 in Brisbane.',
            organization: { name: 'Youth Advocacy Centre' },
            location: { city: 'Brisbane', state: 'QLD', suburb: 'South Brisbane' },
            contact: { phone: { primary: '07 3356 1002' }, website: 'https://yac.net.au' },
            categories: ['legal_aid', 'youth_development'],
            youth_specific: true
          },
          {
            id: 'demo-2', 
            name: 'Headspace Sydney',
            description: 'Mental health support for young people aged 12-25 in Sydney CBD.',
            organization: { name: 'Headspace' },
            location: { city: 'Sydney', state: 'NSW', suburb: 'Sydney CBD' },
            contact: { phone: { primary: '02 9114 4100' }, website: 'https://headspace.org.au' },
            categories: ['mental_health', 'counselling'],
            youth_specific: true
          }
        ],
        pagination: {
          limit: 20,
          offset: 0,
          total: 2,
          pages: 1,
          current_page: 1,
          has_next: false,
          has_prev: false
        },
        total: 2,
        demo_mode: true,
        message: 'Demo results - 603+ services available when backend database is populated'
      }
    }
  }
}

export default api