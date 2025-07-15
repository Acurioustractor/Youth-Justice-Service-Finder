import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, MapPin, List, Loader, X, DollarSign } from 'lucide-react'
import ServiceMap from '../components/ServiceMap'
import ServiceCard from '../components/ServiceCard'
import SearchFilters from '../components/SearchFilters'
import { apiService } from '../lib/api'
import { governmentSpending, getFundingLevel, getSupplierByName, formatCurrency, getFundingStatusColor } from '../lib/spendingData'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedService, setSelectedService] = useState(null)

  // Search filters
  const [filters, setFilters] = useState({
    categories: searchParams.get('categories') || '',
    regions: searchParams.get('regions') || '',
    min_age: searchParams.get('min_age') || '',
    max_age: searchParams.get('max_age') || '',
    youth_specific: searchParams.get('youth_specific') === 'true',
    indigenous_specific: searchParams.get('indigenous_specific') === 'true',
    funding_level: searchParams.get('funding_level') || '',
    funded_only: searchParams.get('funded_only') === 'true',
    limit: 20,
    offset: 0
  })

  // Search function
  const performSearch = async (query = searchQuery, searchFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      // Clean and prepare parameters
      const cleanParams = {}
      
      // Add query if not empty
      if (query && query.trim()) {
        cleanParams.q = query.trim()
      }
      
      // Add other parameters only if they have meaningful values
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (key === 'limit' || key === 'offset') {
          // Always include pagination params
          cleanParams[key] = value
        } else if (key.includes('_specific')) {
          // Only include boolean flags if they're true
          if (value === true) {
            cleanParams[key] = value
          }
        } else if (value && value !== '' && value !== null && value !== undefined) {
          // Map frontend parameter names to backend names
          if (key === 'categories') {
            cleanParams.category = value  // Backend expects 'category' (singular)
          } else if (key === 'regions') {
            cleanParams.region = value    // Backend expects 'region' (singular)
          } else if (key === 'min_age') {
            cleanParams.minimum_age = value  // Backend expects 'minimum_age'
          } else if (key === 'max_age') {
            cleanParams.maximum_age = value  // Backend expects 'maximum_age'
          } else {
            cleanParams[key] = value
          }
        }
      })
      
      console.log('Search params:', cleanParams)

      // Use working search endpoint that's actually available
      console.log('Using working-search endpoint');
      const data = await apiService.workingSearch(cleanParams)
      
      // Enhance services with funding information (Queensland funding only)
      const enhancedServices = (data.services || []).map(service => {
        // Only apply Queensland government funding to Queensland services
        const isQueenslandService = service.location?.state === 'QLD' || 
                                   service.location?.postcode?.toString().startsWith('4');
        
        if (!isQueenslandService) {
          return { ...service, fundingInfo: null };
        }
        
        // Try multiple name/organization fields for better matching
        const orgName = service.organization?.name || service.organization_name || service.name || '';
        const abn = service.organization?.abn || service.abn || null;
        
        const fundingInfo = getSupplierByName(orgName, abn)
        return {
          ...service,
          fundingInfo: fundingInfo ? {
            amount: fundingInfo.total,
            level: getFundingLevel(fundingInfo.total),
            status: fundingInfo.status,
            contracts: fundingInfo.contracts,
            category: fundingInfo.category,
            fundingPeriod: fundingInfo.fundingPeriod
          } : null
        }
      })
      
      // Apply funding filters
      let filteredServices = enhancedServices
      
      if (searchFilters.funded_only) {
        filteredServices = filteredServices.filter(service => service.fundingInfo)
      }
      
      if (searchFilters.funding_level) {
        filteredServices = filteredServices.filter(service => 
          service.fundingInfo && service.fundingInfo.level === searchFilters.funding_level
        )
      }
      
      // Apply client-side pagination to filtered results
      const totalFiltered = filteredServices.length
      const currentOffset = searchFilters.offset || 0
      const currentLimit = searchFilters.limit || 20
      
      // Slice the filtered results for current page
      const paginatedServices = filteredServices.slice(currentOffset, currentOffset + currentLimit)
      
      setServices(paginatedServices)
      
      // Update pagination to reflect filtered results
      const updatedPagination = {
        total: totalFiltered,
        offset: currentOffset,
        limit: currentLimit,
        pages: Math.ceil(totalFiltered / currentLimit)
      }
      
      setPagination(updatedPagination)
    } catch (err) {
      console.error('Search failed:', err)
      setError('Failed to search services. Please try again.')
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  // Update URL with current search params
  const updateURL = (query, searchFilters) => {
    const params = new URLSearchParams()
    
    if (query) params.set('q', query)
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value && value !== '' && key !== 'limit' && key !== 'offset') {
        params.set(key, value.toString())
      }
    })

    setSearchParams(params)
  }

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault()
    const newFilters = { ...filters, offset: 0 }
    setFilters(newFilters)
    updateURL(searchQuery, newFilters)
    performSearch(searchQuery, newFilters)
  }

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...newFilters, offset: 0 }
    setFilters(updatedFilters)
    updateURL(searchQuery, updatedFilters)
    performSearch(searchQuery, updatedFilters)
  }

  // Handle pagination
  const handlePageChange = (newOffset) => {
    const newFilters = { ...filters, offset: newOffset }
    setFilters(newFilters)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    performSearch(searchQuery, newFilters)
  }

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      categories: '',
      regions: '',
      min_age: '',
      max_age: '',
      youth_specific: false,
      indigenous_specific: false,
      funding_level: '',
      funded_only: false,
      limit: 20,
      offset: 0
    }
    setFilters(clearedFilters)
    setSearchQuery('')
    setSearchParams({})
    performSearch('', clearedFilters)
  }

  // Initial search on component mount
  useEffect(() => {
    performSearch()
  }, [])

  const hasActiveFilters = Object.values(filters).some(value => 
    value && value !== '' && value !== false && value !== 20 && value !== 0
  ) || searchQuery

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search Form */}
            <div className="flex-1 max-w-2xl">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded font-medium transition-colors duration-200"
                >
                  Search
                </button>
              </form>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-4">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
                  showFilters
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'map'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters & Clear */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
                    "{searchQuery}"
                  </span>
                )}
                {filters.categories && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Category: {filters.categories}
                  </span>
                )}
                {filters.regions && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Region: {filters.regions}
                  </span>
                )}
                {filters.funding_level && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    Funding: {governmentSpending.fundingLevels[filters.funding_level]?.label}
                  </span>
                )}
                {filters.funded_only && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    Government Funded Only
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:w-80">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFilterChange}
                loading={loading}
              />
            </div>
          )}

          {/* Results Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {loading ? 'Searching...' : `Search Results`}
                </h2>
                {pagination && (
                  <p className="text-sm text-gray-600">
                    Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} services
                  </p>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary-600" />
                <span className="ml-2 text-gray-600">Searching services...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Results */}
            {!loading && !error && (
              <>
                {viewMode === 'list' ? (
                  <div className="space-y-4">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onSelect={setSelectedService}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                        <p className="text-gray-600 mb-4">
                          Try adjusting your search terms or filters to find more results.
                        </p>
                        <button
                          onClick={clearFilters}
                          className="btn-primary"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 lg:h-[600px]">
                    <ServiceMap
                      services={services}
                      onServiceSelect={setSelectedService}
                      className="h-full"
                    />
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="mt-8 flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                      disabled={pagination.offset === 0}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-600">
                      Page {Math.floor(pagination.offset / pagination.limit) + 1} of {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                      disabled={pagination.offset + pagination.limit >= pagination.total}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}