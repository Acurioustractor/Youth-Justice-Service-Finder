import React, { useState, useEffect } from 'react'
import { Download, FileText, Info, Calendar, ExternalLink } from 'lucide-react'
import { apiService } from '../lib/api'

export default function DataDownloadPage() {
  const [downloadInfo, setDownloadInfo] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDownloadInfo = async () => {
      try {
        const data = await apiService.getDataDownloadInfo()
        setDownloadInfo(data)
      } catch (err) {
        setError('Failed to load download information')
        console.error('Error fetching download info:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDownloadInfo()
  }, [])

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiService.baseURL}/data/dyjvs-payments`)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'dyjvs_payments_data.csv'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(`Download failed: ${err.message}`)
      console.error('Download error:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Data Downloads
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access and download the latest data from Queensland Department of Youth Justice, 
            Victoria and Sport (DYJVS) for research and analysis purposes.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-56 mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* DYJVS On-time Payments Dataset */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        DYJVS On-time Payments Data
                      </h2>
                      <p className="text-sm text-gray-500">2024-25 Financial Year</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Latest
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Info className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900">Dataset Information</span>
                    </div>
                    <div className="pl-7 space-y-2 text-sm text-gray-600">
                      <p>Department of Youth Justice, Victoria and Sport on-time payments data</p>
                      <p>Updated regularly by Queensland Government</p>
                      <p>CSV format with detailed payment information</p>
                    </div>
                  </div>

                  {downloadInfo && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-900">Last Updated</span>
                      </div>
                      <div className="pl-7 space-y-2 text-sm text-gray-600">
                        <p>Source: Queensland Government Open Data</p>
                        <p>Filename: {downloadInfo.filename_format}</p>
                        <p>Last checked: {new Date(downloadInfo.last_checked).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800">
                      <Info className="w-5 h-5" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isDownloading ? 'Downloading...' : 'Download CSV'}</span>
                  </button>

                  {downloadInfo?.source_url && (
                    <a
                      href={downloadInfo.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>View Original Source</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Data Usage Guidelines
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>
                  <strong>Attribution:</strong> Please cite "Queensland Department of Youth Justice, Victoria and Sport" 
                  when using this data in research or publications.
                </p>
                <p>
                  <strong>License:</strong> This data is provided under Queensland Government's Open Data License. 
                  Please review the terms of use before redistribution.
                </p>
                <p>
                  <strong>Updates:</strong> Data is refreshed regularly. Check back for the most current information.
                </p>
                <p>
                  <strong>Support:</strong> For questions about the data or technical issues, 
                  contact the Queensland Government Open Data team.
                </p>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-gray-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Technical Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Format:</span>
                  <p className="text-gray-600">CSV (Comma-separated values)</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Encoding:</span>
                  <p className="text-gray-600">UTF-8</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Update Frequency:</span>
                  <p className="text-gray-600">Regular (as published by QLD Gov)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}