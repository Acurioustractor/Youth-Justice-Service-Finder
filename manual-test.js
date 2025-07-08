// Quick script to manually create test data using simple HTTP requests

import https from 'https';

async function makeRequest(hostname, path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function createTestData() {
  console.log('🧪 Creating test data via API...');

  const hostname = 'youth-justice-service-finder-production.up.railway.app';

  try {
    // First check current state
    const current = await makeRequest(hostname, '/debug/tables');
    console.log('📊 Current database state:', current);

    // Trigger scrapers
    const scraperResult = await makeRequest(hostname, '/debug/run-scrapers', 'POST');
    console.log('🚀 Scraper trigger result:', scraperResult);

    console.log('✅ Test data creation completed');
    console.log('🔍 Check your frontend in 2-3 minutes: https://frontend-x6ces3z0g-benjamin-knights-projects.vercel.app');

  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
  }
}

createTestData();