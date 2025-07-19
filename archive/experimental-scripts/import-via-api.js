#!/usr/bin/env node

// Import 603 services via the live API endpoint
import fs from 'fs';
import axios from 'axios';

const API_URL = 'https://youth-justice-service-finder-production.up.railway.app';

console.log('🚀 IMPORTING 603 SERVICES VIA API');

async function importViaAPI() {
  try {
    // Load the 603-service dataset
    const mergedFile = 'MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json';
    
    if (!fs.existsSync(mergedFile)) {
      throw new Error('603-service dataset not found!');
    }

    const data = JSON.parse(fs.readFileSync(mergedFile, 'utf8'));
    const services = data.services || [];
    
    console.log(`📊 Found ${services.length} services to import`);

    // Check if there's a bulk import endpoint
    try {
      const response = await axios.post(`${API_URL}/services/bulk-import`, {
        services: services
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000 // 5 minutes
      });
      
      console.log('✅ Bulk import successful:', response.data);
      
    } catch (error) {
      console.log('❌ Bulk import failed, trying individual imports...');
      
      // Import services one by one
      let imported = 0;
      for (const service of services.slice(0, 50)) { // Start with first 50
        try {
          await axios.post(`${API_URL}/services`, service, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });
          imported++;
          
          if (imported % 10 === 0) {
            console.log(`   📊 Imported ${imported} services...`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.log(`   ❌ Failed to import ${service.name}`);
        }
      }
      
      console.log(`✅ Imported ${imported} services individually`);
    }

    // Check final stats
    const statsResponse = await axios.get(`${API_URL}/stats`);
    console.log('\n🎉 FINAL STATS:', statsResponse.data);
    
  } catch (error) {
    console.error('💥 Import failed:', error.message);
  }
}

importViaAPI();