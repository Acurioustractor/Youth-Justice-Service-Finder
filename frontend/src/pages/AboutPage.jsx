import React from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Database, Users, Heart, Shield, ExternalLink } from 'lucide-react'

export default function AboutPage() {
  const features = [
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Powerful Elasticsearch-powered search with fuzzy matching, filters, and intelligent suggestions.'
    },
    {
      icon: MapPin,
      title: 'Interactive Mapping',
      description: 'Visualize services on an interactive map with location-based search and distance calculations.'
    },
    {
      icon: Database,
      title: 'Comprehensive Database',
      description: 'Regularly updated database covering legal aid, mental health, housing, education, and crisis support.'
    },
    {
      icon: Users,
      title: 'Youth-Focused',
      description: 'Specifically designed for young people aged 10-25 in contact with the justice system.'
    }
  ]

  const principles = [
    {
      icon: Heart,
      title: 'Dignity & Respect',
      description: 'Every young person deserves access to appropriate support services delivered with dignity and respect.'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'We prioritize the safety and wellbeing of young people, with clear pathways to emergency support.'
    },
    {
      icon: Users,
      title: 'Accessibility',
      description: 'Services should be easy to find, understand, and access regardless of background or circumstances.'
    },
    {
      icon: Database,
      title: 'Data Quality',
      description: 'Accurate, up-to-date information ensures young people can rely on the services they find.'
    }
  ]

  const stats = [
    { number: '605+', label: 'Services Available' },
    { number: '500+', label: 'Partner Organizations' },
    { number: '8', label: 'States & Territories' },
    { number: '24/7', label: 'Crisis Support Access' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-6">
            About Youth Justice Service Finder
          </h1>
          <p className="text-xl text-primary-100 leading-relaxed">
            A comprehensive platform connecting young people in Australia with essential 
            support services including legal aid, mental health support, housing assistance, 
            and crisis intervention.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              To create an accessible, comprehensive platform that empowers young people 
              in the justice system to find and connect with appropriate support services 
              across Australia, breaking down barriers to essential care and advocacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-lg text-gray-600">
              Built with modern technology to provide the best user experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Principles Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Principles</h2>
            <p className="text-lg text-gray-600">
              The values that guide our work and platform development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {principles.map((principle, index) => {
              const Icon = principle.icon
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-gray-600">
                      {principle.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Technology Stack</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Backend</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Node.js & Fastify:</strong> High-performance API server</li>
                  <li>• <strong>PostgreSQL:</strong> Reliable data storage with JSONB support</li>
                  <li>• <strong>Elasticsearch:</strong> Advanced search with fuzzy matching</li>
                  <li>• <strong>OpenAPI 3.0:</strong> Comprehensive API documentation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Frontend</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>React & Vite:</strong> Modern, fast user interface</li>
                  <li>• <strong>Tailwind CSS:</strong> Responsive, accessible design</li>
                  <li>• <strong>Leaflet Maps:</strong> Interactive service mapping</li>
                  <li>• <strong>Progressive Enhancement:</strong> Works on all devices</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">API Documentation</h4>
                  <p className="text-sm text-gray-600">Explore our comprehensive API documentation</p>
                </div>
                <a
                  href="https://youth-justice-service-finder-production.up.railway.app/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>View API Docs</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Data Sources & Partners</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Government Sources</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Legal Aid Queensland</li>
                <li>• Queensland Government Open Data</li>
                <li>• Australian Charities and Not-for-profits Commission</li>
                <li>• State and local government service directories</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Partners</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• headspace National Youth Mental Health Foundation</li>
                <li>• Youth Advocacy Centre</li>
                <li>• Aboriginal and Torres Strait Islander Legal Service</li>
                <li>• Community service directories</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Data Attribution:</strong> All data sources are properly attributed and used 
              in compliance with their respective licenses. We respect the work of organizations 
              providing essential services to Queensland's youth.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Get Started</h2>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
              Ready to find the right support services? Start your search now and 
              connect with organizations that can make a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/search" className="btn-secondary">
                Search Services
              </Link>
              <a
                href="https://youth-justice-service-finder-production.up.railway.app/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-500 hover:bg-primary-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>API Documentation</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}