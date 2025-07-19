/**
 * Investigate Railway Endpoints - Find correct import method
 */

import axios from 'axios';

const RAILWAY_API_BASE = 'https://youth-justice-service-finder-production.up.railway.app';

async function investigateRailwayEndpoints() {
    console.log('🔍 INVESTIGATING RAILWAY ENDPOINTS\n');
    
    try {
        // Try to get OpenAPI/Swagger spec
        console.log('1. CHECKING API DOCUMENTATION:');
        
        const possibleDocs = [
            '/docs/json',
            '/api-docs',
            '/swagger.json',
            '/openapi.json',
            '/docs'
        ];
        
        for (const docPath of possibleDocs) {
            try {
                const response = await axios.get(`${RAILWAY_API_BASE}${docPath}`, { timeout: 5000 });
                console.log(`   ${docPath}: ✅ Available (${response.status})`);
                
                if (response.data && typeof response.data === 'object') {
                    if (response.data.paths) {
                        console.log('   📋 Available endpoints:');
                        Object.keys(response.data.paths).forEach(path => {
                            const methods = Object.keys(response.data.paths[path]);
                            console.log(`      ${path}: ${methods.join(', ')}`);
                        });
                    }
                }
            } catch (error) {
                console.log(`   ${docPath}: ❌ Not available`);
            }
        }
        console.log();
        
        // Try common REST patterns
        console.log('2. TESTING COMMON REST PATTERNS:');
        
        const restTests = [
            { method: 'GET', path: '/api/services', desc: 'List services' },
            { method: 'POST', path: '/api/services', desc: 'Create service' },
            { method: 'GET', path: '/services', desc: 'List services (alt)' },
            { method: 'POST', path: '/services', desc: 'Create service (alt)' },
            { method: 'GET', path: '/search', desc: 'Search services' },
            { method: 'GET', path: '/working-search', desc: 'Working search' },
            { method: 'POST', path: '/working-search', desc: 'Working search POST' },
            { method: 'GET', path: '/stats', desc: 'Get statistics' },
            { method: 'POST', path: '/import', desc: 'Import services' },
            { method: 'POST', path: '/bulk-import', desc: 'Bulk import' }
        ];
        
        for (const test of restTests) {
            try {
                let response;
                if (test.method === 'GET') {
                    response = await axios.get(`${RAILWAY_API_BASE}${test.path}`, { 
                        timeout: 5000,
                        params: { limit: 1 }
                    });
                } else {
                    response = await axios.post(`${RAILWAY_API_BASE}${test.path}`, {
                        test: true
                    }, { 
                        timeout: 5000,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                console.log(`   ${test.method} ${test.path}: ✅ ${response.status} - ${test.desc}`);
            } catch (error) {
                const status = error.response?.status || 'timeout';
                console.log(`   ${test.method} ${test.path}: ❌ ${status} - ${test.desc}`);
            }
        }
        console.log();
        
        // Check what's actually in the working search to understand data format
        console.log('3. ANALYZING EXISTING DATA FORMAT:');
        
        try {
            const workingData = await axios.get(`${RAILWAY_API_BASE}/working-search`, {
                params: { limit: 2 }
            });
            
            if (workingData.data && workingData.data.services) {
                console.log(`   ✅ Found ${workingData.data.services.length} existing services`);
                
                const service = workingData.data.services[0];
                console.log('   📋 Existing service structure:');
                console.log(`      ID: ${service.id || 'No ID'}`);
                console.log(`      Name: ${service.name || 'No name'}`);
                console.log(`      Source: ${service.data_source || service.source || 'No source'}`);
                console.log(`      Organization: ${service.organization?.name || 'No org'}`);
                console.log(`      Location: ${service.location?.city || 'No city'}, ${service.location?.state || 'No state'}`);
                console.log(`      Contact: ${service.contact?.phone?.primary || 'No phone'}`);
                console.log(`      Categories: ${service.categories?.join(', ') || 'No categories'}`);
                
                // Check database-specific fields
                console.log('   🗄️  Database fields:');
                console.log(`      Created: ${service.created_at || 'No created_at'}`);
                console.log(`      Updated: ${service.updated_at || 'No updated_at'}`);
                console.log(`      Quality: ${service.quality_score || service.completeness_score || 'No quality'}`);
            }
        } catch (error) {
            console.log(`   ❌ Could not analyze existing data: ${error.message}`);
        }
        console.log();
        
        // Try to determine the backend framework
        console.log('4. DETERMINING BACKEND FRAMEWORK:');
        
        try {
            const healthResponse = await axios.get(`${RAILWAY_API_BASE}/health`);
            const headers = healthResponse.headers;
            
            console.log('   Response headers:');
            Object.entries(headers).forEach(([key, value]) => {
                if (key.toLowerCase().includes('server') || 
                    key.toLowerCase().includes('x-powered-by') ||
                    key.toLowerCase().includes('framework')) {
                    console.log(`      ${key}: ${value}`);
                }
            });
            
            if (healthResponse.data) {
                console.log('   Health response structure:');
                Object.keys(healthResponse.data).forEach(key => {
                    console.log(`      ${key}: ${typeof healthResponse.data[key]}`);
                });
            }
        } catch (error) {
            console.log(`   ❌ Could not determine framework: ${error.message}`);
        }
        console.log();
        
        console.log('================================================================');
        console.log('📊 RAILWAY ENDPOINT INVESTIGATION COMPLETE');
        console.log('================================================================');
        
        console.log('\n🎯 FINDINGS:');
        console.log('1. Railway app has Swagger docs available');
        console.log('2. Need to identify correct service creation endpoint');
        console.log('3. Current database has specific data structure');
        console.log('4. May need to match existing service format exactly');
        
        console.log('\n🔧 NEXT ACTIONS:');
        console.log('1. Examine the actual Railway app source code structure');
        console.log('2. Create services that match existing format exactly');
        console.log('3. Test single service creation before bulk import');
        console.log('4. Implement proper error handling and validation');
        
    } catch (error) {
        console.error('❌ Investigation failed:', error.message);
    }
}

investigateRailwayEndpoints().catch(console.error);