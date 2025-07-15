import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, MapPin, Info, Menu, X, Download, BarChart3, DollarSign } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', icon: MapPin },
    { name: 'Search Services', href: '/search', icon: Search },
    { name: 'Spending Analysis', href: '/spending', icon: DollarSign },
    { name: 'Data Downloads', href: '/data', icon: Download },
    { name: 'About', href: '/about', icon: Info },
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Youth Justice Service Finder
                  </h1>
                  <p className="text-xs text-gray-500">Australia</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Youth Justice Service Finder</h3>
              </div>
              <p className="text-sm text-gray-600">
                Connecting young people with essential support services across Australia.
                Find legal aid, mental health support, housing assistance, and more.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/search" className="hover:text-gray-900">Search Services</Link></li>
                <li><Link to="/spending" className="hover:text-gray-900">Spending Analysis</Link></li>
                <li><Link to="/data" className="hover:text-gray-900">Data Downloads</Link></li>
                <li><Link to="/about" className="hover:text-gray-900">About</Link></li>
                <li><a href="https://youth-justice-service-finder-production.up.railway.app/docs" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Emergency Contacts</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><strong>Emergency:</strong> 000</li>
                <li><strong>Kids Helpline:</strong> 1800 55 1800</li>
                <li><strong>Lifeline:</strong> 13 11 14</li>
                <li><strong>Legal Aid Australia:</strong> 1300 651 188</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>© 2025 Youth Justice Service Finder. Built for Australia's youth justice ecosystem.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}