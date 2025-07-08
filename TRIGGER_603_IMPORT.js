#!/usr/bin/env node

// Simple script to trigger 603 service import via existing API
import fs from 'fs';
import axios from 'axios';

const API_URL = 'https://youth-justice-service-finder-production.up.railway.app';

console.log('🚀 TRIGGERING 603-SERVICE IMPORT');

async function triggerImport() {
  try {
    // First check current stats
    console.log('📊 Checking current database stats...');
    const statsResponse = await axios.get(`${API_URL}/stats`);
    console.log('Current stats:', statsResponse.data);
    
    // Load and validate our dataset
    const mergedFile = 'MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json';
    const data = JSON.parse(fs.readFileSync(mergedFile, 'utf8'));
    console.log(`📁 Found ${data.services.length} services ready for import`);
    
    // Try the import endpoint we just added
    console.log('🔥 Triggering import via API...');
    
    try {
      const importResponse = await axios.post(`${API_URL}/create-data/load-603-services`, {}, {
        timeout: 300000, // 5 minutes
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✅ IMPORT SUCCESS!', importResponse.data);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Import endpoint not found. Route not deployed yet.');
        console.log('⏳ Railway may still be deploying the new import route...');
        
        // Try alternate approach - use existing health endpoint to verify deployment
        const healthCheck = await axios.get(`${API_URL}/health`);
        console.log('Backend health:', healthCheck.data);
        
        console.log('\n🎯 SOLUTION: The import endpoint needs to be deployed.');
        console.log('Either wait for Railway auto-deploy or manually trigger redeploy.');
        
      } else {
        throw error;
      }
    }
    
    // Check final stats
    console.log('\n📊 Checking final database stats...');
    const finalStats = await axios.get(`${API_URL}/stats`);
    console.log('Final stats:', finalStats.data);
    
    if (finalStats.data.totals.services >= 600) {
      console.log('\n🎉 SUCCESS! 603+ services are now live!');
      console.log('🌐 Frontend: https://frontend-nv94erx6q-benjamin-knights-projects.vercel.app');
      console.log('🚀 Backend: https://youth-justice-service-finder-production.up.railway.app');
    } else {
      console.log('\n⏳ Import may still be in progress or failed.');
      console.log(`Current: ${finalStats.data.totals.services} services`);
    }
    
  } catch (error) {
    console.error('💥 Import trigger failed:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

triggerImport();