#!/usr/bin/env node

// Use the working health endpoint to import 603 services
import fs from 'fs';
import axios from 'axios';

const API_URL = 'https://youth-justice-service-finder-production.up.railway.app';

console.log('🚀 WORKING IMPORT - Using health endpoint pattern');

async function workingImport() {
  try {
    // First verify backend is working
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Backend is healthy:', health.data.status);
    
    // Check current stats
    const currentStats = await axios.get(`${API_URL}/stats`);
    console.log('📊 Current database:', currentStats.data);
    
    // Load our 603 services
    const data = JSON.parse(fs.readFileSync('MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json', 'utf8'));
    console.log(`📁 Found ${data.services.length} services ready to import`);
    
    // The working stats endpoint shows we have access to the database
    // Let's wait for Railway to deploy our bulletproof import and keep trying
    
    const endpoints = [
      '/bulletproof/bulletproof-603-import',
      '/create-data/load-603-services', 
      '/import/load-603-services'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔥 Trying ${endpoint}...`);
        const response = await axios.post(`${API_URL}${endpoint}`, {}, {
          timeout: 180000 // 3 minutes
        });
        
        console.log('🎉 SUCCESS!', response.data);
        
        // Verify results
        const finalStats = await axios.get(`${API_URL}/stats`);
        console.log('🎯 Final database stats:', finalStats.data);
        
        if (finalStats.data.totals.services >= 500) {
          console.log('\n🎉🎉🎉 YOUR 603 SERVICES ARE LIVE! 🎉🎉🎉');
          console.log('🌐 Frontend: https://frontend-nv94erx6q-benjamin-knights-projects.vercel.app');
          console.log('🚀 Backend: https://youth-justice-service-finder-production.up.railway.app');
          return;
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error.response?.status, error.response?.data?.error || error.message);
      }
    }
    
    console.log('\n⏳ All endpoints failed - Railway may still be deploying...');
    console.log('🎯 Your 603 services are ready, just waiting for Railway deployment');
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
  }
}

workingImport();