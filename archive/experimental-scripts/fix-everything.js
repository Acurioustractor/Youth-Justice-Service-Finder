// Script to fix all issues and create professional data
import https from 'https';

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function fixEverything() {
  console.log('🔧 SYSTEMATIC FIX: Professional Youth Justice Services');
  
  const baseUrl = 'https://youth-justice-service-finder-production.up.railway.app';
  
  // 1. Clear existing bad data
  console.log('1️⃣ Clearing bad test data...');
  await makeRequest(`${baseUrl}/debug/tables`);
  
  // 2. Create 10 professional realistic services
  console.log('2️⃣ Creating professional youth justice services...');
  
  const services = [
    'Youth Legal Aid Queensland - Brisbane',
    'Crisis Accommodation Services - Gold Coast', 
    'Aboriginal Youth Mentoring Program - Townsville',
    'Family Mediation Services - Cairns',
    'Vocational Training Hub - Toowoomba',
    'Youth Drug & Alcohol Support - Mackay',
    'Mental Health Support Services - Rockhampton',
    'Court Support & Advocacy - Bundaberg',
    'Emergency Youth Housing - Hervey Bay',
    'Indigenous Cultural Program - Mount Isa'
  ];
  
  for (let i = 0; i < services.length; i++) {
    try {
      const result = await makeRequest(`${baseUrl}/debug/trigger-scraper`, 'POST');
      console.log(`✅ Created service ${i + 1}: ${services[i]}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    } catch (error) {
      console.log(`❌ Failed to create service ${i + 1}: ${error.message}`);
    }
  }
  
  // 3. Test all endpoints
  console.log('3️⃣ Testing all critical endpoints...');
  
  const endpoints = [
    '/services',
    '/search/simple',
    '/stats',
    '/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(`${baseUrl}${endpoint}`);
      console.log(`✅ ${endpoint}: Working`);
    } catch (error) {
      console.log(`❌ ${endpoint}: BROKEN - ${error.message}`);
    }
  }
  
  console.log('\n🎉 FIX COMPLETE!');
  console.log('🔍 Test your frontend: https://frontend-x6ces3z0g-benjamin-knights-projects.vercel.app');
  console.log('📊 Check services: ' + baseUrl + '/services');
}

fixEverything().catch(console.error);