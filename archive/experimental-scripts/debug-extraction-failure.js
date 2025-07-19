/**
 * Debug Extraction Failure - Professional Analysis
 * 
 * Analyze why extractions returned 0 services when they claimed to extract hundreds
 */

import { ACNCAdapter } from './src/data-pipeline/adapters/acnc-adapter.js';
import { QLDDataAdapter } from './src/data-pipeline/adapters/qld-data-adapter.js';
import axios from 'axios';

async function debugExtractionFailure() {
    console.log('🔍 DEBUGGING EXTRACTION FAILURE - Professional Analysis\n');
    
    try {
        // Test 1: Direct ACNC adapter test
        console.log('1. TESTING ACNC ADAPTER DIRECTLY:');
        const acncAdapter = new ACNCAdapter();
        
        console.log('   Calling extract with limit 10...');
        const acncResult = await acncAdapter.extract({ limit: 10 });
        
        console.log(`   Result type: ${typeof acncResult}`);
        console.log(`   Result is array: ${Array.isArray(acncResult)}`);
        console.log(`   Result length: ${acncResult ? acncResult.length : 'undefined'}`);
        
        if (acncResult && acncResult.length > 0) {
            console.log('   ✅ ACNC extraction working');
            console.log(`   Sample service: ${acncResult[0].name}`);
            console.log(`   Sample source: ${acncResult[0].data_source}`);
        } else {
            console.log('   ❌ ACNC extraction failed - no services returned');
        }
        console.log();
        
        // Test 2: Direct QLD adapter test  
        console.log('2. TESTING QLD ADAPTER DIRECTLY:');
        const qldAdapter = new QLDDataAdapter();
        
        console.log('   Calling extract with limit 10...');
        const qldResult = await qldAdapter.extract({ limit: 10 });
        
        console.log(`   Result type: ${typeof qldResult}`);
        console.log(`   Result is array: ${Array.isArray(qldResult)}`);
        console.log(`   Result length: ${qldResult ? qldResult.length : 'undefined'}`);
        
        if (qldResult && qldResult.length > 0) {
            console.log('   ✅ QLD extraction working');
            console.log(`   Sample service: ${qldResult[0].name}`);
            console.log(`   Sample location: ${qldResult[0].locations?.[0]?.city || 'No location'}`);
        } else {
            console.log('   ❌ QLD extraction failed - no services returned');
        }
        console.log();
        
        // Test 3: Check Railway API endpoints
        console.log('3. TESTING RAILWAY API ENDPOINTS:');
        const baseUrl = 'https://youth-justice-service-finder-production.up.railway.app';
        
        // Test health
        try {
            const healthResponse = await axios.get(`${baseUrl}/health`);
            console.log(`   Health endpoint: ✅ ${healthResponse.status}`);
        } catch (error) {
            console.log(`   Health endpoint: ❌ ${error.response?.status || error.message}`);
        }
        
        // Test stats
        try {
            const statsResponse = await axios.get(`${baseUrl}/stats`);
            console.log(`   Stats endpoint: ✅ ${statsResponse.status}`);
            console.log(`   Current services: ${statsResponse.data.totals?.services || 'unknown'}`);
        } catch (error) {
            console.log(`   Stats endpoint: ❌ ${error.response?.status || error.message}`);
        }
        
        // Test search
        try {
            const searchResponse = await axios.get(`${baseUrl}/search?limit=1`);
            console.log(`   Search endpoint: ✅ ${searchResponse.status}`);
        } catch (error) {
            console.log(`   Search endpoint: ❌ ${error.response?.status || error.message}`);
        }
        
        // Test import endpoint
        try {
            const importResponse = await axios.post(`${baseUrl}/import-603-services`, {
                services: []
            });
            console.log(`   Import endpoint: ✅ ${importResponse.status}`);
        } catch (error) {
            console.log(`   Import endpoint: ❌ ${error.response?.status || error.message}`);
        }
        console.log();
        
        // Test 4: Try single service import
        console.log('4. TESTING SINGLE SERVICE IMPORT:');
        if (acncResult && acncResult.length > 0) {
            const testService = acncResult[0];
            console.log(`   Attempting to import: ${testService.name}`);
            
            try {
                const singleImport = await axios.post(`${baseUrl}/services`, testService, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });
                console.log(`   Single import: ✅ ${singleImport.status}`);
            } catch (error) {
                console.log(`   Single import: ❌ ${error.response?.status || error.message}`);
                if (error.response?.data) {
                    console.log(`   Error details: ${JSON.stringify(error.response.data)}`);
                }
            }
        }
        console.log();
        
        // Test 5: Check what endpoints are available
        console.log('5. CHECKING AVAILABLE API ENDPOINTS:');
        try {
            const docsResponse = await axios.get(`${baseUrl}/docs`);
            console.log(`   API docs: ✅ Available`);
        } catch (error) {
            console.log(`   API docs: ❌ Not available`);
        }
        
        // Try different import endpoints
        const endpoints = [
            '/services',
            '/import-603-services', 
            '/working-import',
            '/bulletproof-import',
            '/api/services'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${baseUrl}${endpoint}`, { timeout: 5000 });
                console.log(`   ${endpoint}: ✅ GET ${response.status}`);
            } catch (error) {
                console.log(`   ${endpoint}: ❌ GET ${error.response?.status || 'timeout/error'}`);
            }
        }
        console.log();
        
        console.log('🔍 DIAGNOSIS:');
        console.log('================================================================');
        
        if (!acncResult || acncResult.length === 0) {
            console.log('❌ ISSUE 1: ACNC adapter not returning services');
            console.log('   - Check if extract() method returns array');
            console.log('   - Verify data processing logic');
            console.log('   - Check for async/await issues');
        }
        
        if (!qldResult || qldResult.length === 0) {
            console.log('❌ ISSUE 2: QLD adapter not returning services');
            console.log('   - Check if extract() method returns array');
            console.log('   - Verify CSV parsing logic');
        }
        
        console.log('❌ ISSUE 3: Import endpoints may not exist or accept data');
        console.log('   - Need to identify correct import endpoint');
        console.log('   - Check request format and authentication');
        console.log('   - Verify data structure matches expected schema');
        
        console.log('\n🔧 NEXT STEPS TO FIX:');
        console.log('1. Fix adapter extract() methods to return actual service arrays');
        console.log('2. Identify working import endpoint on Railway API');
        console.log('3. Test single service import with correct format');
        console.log('4. Implement bulk import with proper error handling');
        console.log('5. Verify database actually receives and stores services');
        
    } catch (error) {
        console.error('❌ Debug analysis failed:', error.message);
        console.error(error.stack);
    }
}

debugExtractionFailure().catch(console.error);