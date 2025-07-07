import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, ExternalLink, Clock, Users, Target } from 'lucide-react'

export default function ServiceCard({ service, onSelect }) {
  const formatPhoneNumber = (phone) => {
    if (!phone) return null
    if (Array.isArray(phone) && phone.length > 0) {
      return phone[0].number || phone[0]
    }
    return phone
  }

  const getCategoryBadgeColor = (category) => {
    const colors = {
      legal_aid: 'bg-red-100 text-red-800',
      mental_health: 'bg-green-100 text-green-800',
      housing: 'bg-purple-100 text-purple-800',
      crisis_support: 'bg-orange-100 text-orange-800',
      education_training: 'bg-blue-100 text-blue-800',
      substance_abuse: 'bg-pink-100 text-pink-800',
      family_support: 'bg-cyan-100 text-cyan-800',
      cultural_support: 'bg-yellow-100 text-yellow-800',
      advocacy: 'bg-indigo-100 text-indigo-800',
      court_support: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getAgeRangeText = (ageRange) => {
    if (!ageRange) return null
    const { minimum, maximum } = ageRange
    if (minimum && maximum) {
      return `Ages ${minimum}-${maximum}`
    } else if (minimum) {
      return `Ages ${minimum}+`
    } else if (maximum) {
      return `Up to age ${maximum}`
    }
    return null
  }

  const truncateDescription = (text, maxLength = 200) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {service.name}
            </h3>
            {service.score && (
              <span className="text-xs text-gray-500 ml-4 bg-gray-100 px-2 py-1 rounded">
                Score: {service.score.toFixed(1)}
              </span>
            )}
          </div>

          {service.organization?.name && (
            <p className="text-sm text-gray-600 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {service.organization.name}
              {service.organization.type && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {formatCategory(service.organization.type)}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Categories */}
      {service.categories && service.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {service.categories.slice(0, 3).map((category, index) => (
            <span
              key={index}
              className={`badge ${getCategoryBadgeColor(category)}`}
            >
              {formatCategory(category)}
            </span>
          ))}
          {service.categories.length > 3 && (
            <span className="badge bg-gray-100 text-gray-600">
              +{service.categories.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {service.description && (
        <p className="text-gray-700 mb-4 leading-relaxed">
          {truncateDescription(service.description)}
        </p>
      )}

      {/* Age Range & Special Populations */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
        {getAgeRangeText(service.age_range) && (
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            {getAgeRangeText(service.age_range)}
          </div>
        )}
        
        {service.youth_specific && (
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            Youth-specific
          </div>
        )}

        {service.indigenous_specific && (
          <div className="flex items-center text-orange-600">
            <Users className="w-4 h-4 mr-1" />
            Indigenous-specific
          </div>
        )}
      </div>

      {/* Contact & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Contact Info */}
        <div className="space-y-2">
          {formatPhoneNumber(service.contact?.phone) && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-primary-600" />
              <a
                href={`tel:${formatPhoneNumber(service.contact.phone)}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {formatPhoneNumber(service.contact.phone)}
              </a>
            </div>
          )}

          {service.contact?.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-primary-600" />
              <a
                href={`mailto:${service.contact.email}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {service.contact.email}
              </a>
            </div>
          )}
        </div>

        {/* Location */}
        {service.location && (
          <div className="space-y-2">
            {service.location.address && (
              <div className="flex items-start text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-primary-600 flex-shrink-0" />
                <div>
                  <div>{service.location.address}</div>
                  {service.location.city && (
                    <div className="text-xs text-gray-500">
                      {service.location.city}
                      {service.location.region && `, ${formatCategory(service.location.region)}`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {service.distance && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                {service.distance} away
              </div>
            )}
          </div>
        )}
      </div>

      {/* Highlights */}
      {service.highlight && Object.keys(service.highlight).length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-1">Matching content:</p>
          {Object.entries(service.highlight).map(([field, highlights]) => (
            <div key={field} className="text-sm text-yellow-700">
              {Array.isArray(highlights) ? highlights.map((highlight, i) => (
                <div key={i} dangerouslySetInnerHTML={{ __html: highlight }} />
              )) : (
                <div dangerouslySetInnerHTML={{ __html: highlights }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          {service.url && (
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Visit Website
            </a>
          )}
        </div>

        <Link
          to={`/service/${service.id}`}
          className="btn-primary text-sm"
          onClick={() => onSelect && onSelect(service)}
        >
          View Details
        </Link>
      </div>
    </div>
  )
}