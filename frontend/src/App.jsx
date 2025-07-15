import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import AboutPage from './pages/AboutPage'
import DataDownloadPage from './pages/DataDownloadPage'
import SpendingAnalysisPage from './pages/SpendingAnalysisPage'
import BudgetDashboard from './pages/BudgetDashboard'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/service/:id" element={<ServiceDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/data" element={<DataDownloadPage />} />
        <Route path="/spending" element={<SpendingAnalysisPage />} />
        <Route path="/budget" element={<BudgetDashboard />} />
      </Routes>
    </Layout>
  )
}

export default App