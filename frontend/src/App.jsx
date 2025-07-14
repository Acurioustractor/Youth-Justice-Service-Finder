import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import AboutPage from './pages/AboutPage'
import DataDownloadPage from './pages/DataDownloadPage'
import AnalysisPage from './pages/AnalysisPage'
import SpendingAnalysisPage from './pages/SpendingAnalysisPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/service/:id" element={<ServiceDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/data" element={<DataDownloadPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/spending" element={<SpendingAnalysisPage />} />
      </Routes>
    </Layout>
  )
}

export default App