import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

export default function SearchFilters({ filters, onFiltersChange, loading }) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    location: true,
    demographics: true,
    populations: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
      offset: 0 // Reset to first page when filters change
    }
    onFiltersChange(newFilters)
  }

  const clearFilter = (key) => {
    handleFilterChange(key, key.includes('_specific') ? false : '')
  }

  const categoryOptions = [
    { value: 'legal_aid', label: 'Legal Aid' },
    { value: 'mental_health', label: 'Mental Health' },
    { value: 'housing', label: 'Housing & Accommodation' },
    { value: 'crisis_support', label: 'Crisis Support' },
    { value: 'education_training', label: 'Education & Training' },
    { value: 'substance_abuse', label: 'Substance Abuse' },
    { value: 'family_support', label: 'Family Support' },
    { value: 'cultural_support', label: 'Cultural Support' },
    { value: 'advocacy', label: 'Advocacy' },
    { value: 'court_support', label: 'Court Support' }
  ]

  const regionOptions = [
    { value: 'brisbane', label: 'Brisbane' },
    { value: 'gold_coast', label: 'Gold Coast' },
    { value: 'cairns', label: 'Cairns' },
    { value: 'townsville', label: 'Townsville' },
    { value: 'toowoomba', label: 'Toowoomba' },
    { value: 'rockhampton', label: 'Rockhampton' },
    { value: 'mackay', label: 'Mackay' },
    { value: 'bundaberg', label: 'Bundaberg' },
    { value: 'hervey_bay', label: 'Hervey Bay' },
    { value: 'gladstone', label: 'Gladstone' },
    { value: 'mount_isa', label: 'Mount Isa' },
    { value: 'statewide', label: 'Statewide' }
  ]

  const FilterSection = ({ title, children, sectionKey }) => (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="mt-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={() => onFiltersChange({
            categories: '',
            regions: '',
            min_age: '',
            max_age: '',
            youth_specific: false,
            indigenous_specific: false,
            limit: 20,
            offset: 0
          })}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
        >
          <X className="w-4 h-4" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <FilterSection title="Service Categories" sectionKey="categories">
          <div className="space-y-2">
            {categoryOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories.split(',').includes(option.value)}
                  onChange={(e) => {
                    const currentCategories = filters.categories ? filters.categories.split(',') : []
                    let newCategories
                    
                    if (e.target.checked) {
                      newCategories = [...currentCategories, option.value]
                    } else {
                      newCategories = currentCategories.filter(cat => cat !== option.value)
                    }
                    
                    handleFilterChange('categories', newCategories.join(','))
                  }}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          
          {filters.categories && (
            <button
              onClick={() => clearFilter('categories')}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Clear categories
            </button>
          )}
        </FilterSection>

        {/* Location */}
        <FilterSection title="Location" sectionKey="location">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              value={filters.regions}
              onChange={(e) => handleFilterChange('regions', e.target.value)}
              className="input-field text-sm"
              disabled={loading}
            >
              <option value="">All regions</option>
              {regionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {filters.regions && (
            <button
              onClick={() => clearFilter('regions')}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Clear region
            </button>
          )}
        </FilterSection>

        {/* Demographics */}
        <FilterSection title="Age Range" sectionKey="demographics">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Age
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={filters.min_age}
                onChange={(e) => handleFilterChange('min_age', e.target.value)}
                placeholder="10"
                className="input-field text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Age
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={filters.max_age}
                onChange={(e) => handleFilterChange('max_age', e.target.value)}
                placeholder="25"
                className="input-field text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {(filters.min_age || filters.max_age) && (
            <button
              onClick={() => {
                clearFilter('min_age')
                clearFilter('max_age')
              }}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Clear age range
            </button>
          )}
        </FilterSection>

        {/* Special Populations */}
        <FilterSection title="Special Populations" sectionKey="populations">
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.youth_specific}
                onChange={(e) => handleFilterChange('youth_specific', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">
                Youth-specific services only
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.indigenous_specific}
                onChange={(e) => handleFilterChange('indigenous_specific', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">
                Indigenous-specific services only
              </span>
            </label>
          </div>

          {(filters.youth_specific || filters.indigenous_specific) && (
            <button
              onClick={() => {
                clearFilter('youth_specific')
                clearFilter('indigenous_specific')
              }}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Clear population filters
            </button>
          )}
        </FilterSection>
      </div>

      {/* Apply Button for Mobile */}
      <div className="mt-6 lg:hidden">
        <button
          onClick={() => {
            // Trigger search on mobile
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="w-full btn-primary"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  )
}