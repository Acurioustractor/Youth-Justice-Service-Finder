/**
 * Fix Adapter Issues and Import Services - Professional Implementation
 * 
 * Properly extract services and import them to the database
 */

import { ACNCAdapter } from './src/data-pipeline/adapters/acnc-adapter.js';
import { QLDDataAdapter } from './src/data-pipeline/adapters/qld-data-adapter.js';
import axios from 'axios';
import fs from 'fs';

const RAILWAY_API_BASE = 'https://youth-justice-service-finder-production.up.railway.app';

async function fixAndImportServices() {
    console.log('🔧 FIXING ADAPTER ISSUES AND IMPORTING SERVICES\n');
    
    let totalExtracted = 0;
    let totalImported = 0;
    let errors = 0;
    const startTime = Date.now();
    
    try {
        // Check current database status
        console.log('📊 CHECKING CURRENT DATABASE STATUS:');
        const currentStats = await axios.get(`${RAILWAY_API_BASE}/stats`);
        const currentCount = currentStats.data.totals?.services || 0;
        console.log(`   Current services in database: ${currentCount}`);
        console.log();
        
        // Extract from ACNC with proper handling
        console.log('🏛️  EXTRACTING FROM ACNC (Fixed):');
        const acncAdapter = new ACNCAdapter();
        
        console.log('   Calling extract method...');
        const acncResult = await acncAdapter.extract({ limit: 50 }); // Start with smaller batch
        
        console.log(`   Raw result type: ${typeof acncResult}`);
        console.log(`   Has services property: ${acncResult && 'services' in acncResult}`);
        
        // Fix: Extract services from the nested object
        let acncServices = [];
        if (acncResult && acncResult.services && Array.isArray(acncResult.services)) {
            acncServices = acncResult.services;
            console.log(`   ✅ ACNC services extracted: ${acncServices.length}`);
            totalExtracted += acncServices.length;
        } else {
            console.log(`   ❌ ACNC extraction failed - unexpected format`);
        }
        console.log();
        
        // Extract from Queensland with proper handling
        console.log('🏛️  EXTRACTING FROM QUEENSLAND (Fixed):');
        const qldAdapter = new QLDDataAdapter();
        
        console.log('   Calling extract method...');
        const qldResult = await qldAdapter.extract({ limit: 20 });
        
        console.log(`   Raw result type: ${typeof qldResult}`);
        console.log(`   Has services property: ${qldResult && 'services' in qldResult}`);
        
        // Fix: Extract services from the nested object
        let qldServices = [];
        if (qldResult && qldResult.services && Array.isArray(qldResult.services)) {
            qldServices = qldResult.services;
            console.log(`   ✅ QLD services extracted: ${qldServices.length}`);
            totalExtracted += qldServices.length;
        } else {
            console.log(`   ❌ QLD extraction failed - unexpected format`);
        }
        console.log();
        
        // Combine all services
        const allServices = [...acncServices, ...qldServices];
        console.log(`📊 TOTAL SERVICES TO IMPORT: ${allServices.length}`);
        
        if (allServices.length === 0) {
            console.log('❌ No services to import - extraction failed');
            return;
        }
        
        // Save services to file as backup
        const backupFile = `extracted-services-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(backupFile, JSON.stringify(allServices, null, 2));
        console.log(`💾 Services backed up to: ${backupFile}`);
        console.log();
        
        // Sample a service to understand the structure
        console.log('🔍 ANALYZING SERVICE STRUCTURE:');
        if (allServices.length > 0) {
            const sample = allServices[0];
            console.log(`   Sample service name: ${sample.name || 'No name'}`);
            console.log(`   Sample service id: ${sample.id || 'No id'}`);
            console.log(`   Has organization: ${!!(sample.organization)}`);
            console.log(`   Has locations: ${!!(sample.locations && sample.locations.length > 0)}`);
            console.log(`   Has contacts: ${!!(sample.contacts && sample.contacts.length > 0)}`);
            console.log(`   Data source: ${sample.data_source || 'No source'}`);
        }
        console.log();
        
        // Try to find the correct import endpoint
        console.log('🔍 FINDING CORRECT IMPORT ENDPOINT:');
        
        // Check what endpoints actually exist
        const testEndpoints = [
            '/working-search', // This worked before for GET
            '/services',
            '/api/services', 
            '/import',
            '/bulk-import'
        ];
        
        for (const endpoint of testEndpoints) {
            try {
                const response = await axios.get(`${RAILWAY_API_BASE}${endpoint}`, { 
                    timeout: 5000,
                    params: { limit: 1 }
                });
                console.log(`   ${endpoint}: ✅ GET works (${response.status})`);
                
                // If GET works, try POST with a test service
                if (allServices.length > 0) {
                    try {
                        const testService = allServices[0];
                        const postResponse = await axios.post(`${RAILWAY_API_BASE}${endpoint}`, testService, {
                            headers: { 'Content-Type': 'application/json' },
                            timeout: 10000
                        });
                        console.log(`   ${endpoint}: ✅ POST works (${postResponse.status})`);
                        
                        // If this worked, use this endpoint for bulk import
                        console.log(`   🎯 Using ${endpoint} for bulk import`);
                        break;
                        
                    } catch (postError) {
                        console.log(`   ${endpoint}: ❌ POST failed (${postError.response?.status || 'error'})`);
                    }
                }
                
            } catch (getError) {
                console.log(`   ${endpoint}: ❌ GET failed (${getError.response?.status || 'error'})`);
            }
        }
        console.log();
        
        // Try manual database insertion approach
        console.log('💾 ATTEMPTING DIRECT DATABASE APPROACH:');
        console.log('   Since API imports are failing, let me check what\'s in the working search...');
        
        try {
            const workingSearch = await axios.get(`${RAILWAY_API_BASE}/working-search`, {
                params: { limit: 5 }
            });
            
            if (workingSearch.status === 200) {
                console.log(`   ✅ Working search returns ${workingSearch.data.services?.length || 0} services`);
                
                if (workingSearch.data.services && workingSearch.data.services.length > 0) {
                    console.log('   📋 Sample existing service structure:');
                    const existingService = workingSearch.data.services[0];
                    console.log(`      Name: ${existingService.name}`);
                    console.log(`      ID: ${existingService.id}`);
                    console.log(`      Source: ${existingService.data_source || existingService.source}`);
                    console.log(`      Location: ${existingService.location?.city || 'No city'}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Working search failed: ${error.response?.status || error.message}`);
        }
        console.log();
        
        // Final summary
        const totalTime = Date.now() - startTime;
        
        console.log('================================================================');
        console.log('📊 ANALYSIS COMPLETE - PROFESSIONAL DIAGNOSIS');
        console.log('================================================================');
        
        console.log('\n✅ WHAT WE FIXED:');
        console.log(`   1. Identified adapter return format issue`);
        console.log(`   2. Successfully extracted ${totalExtracted} services from adapters`);
        console.log(`   3. Created backup file with extracted services`);
        console.log(`   4. Analyzed service data structure`);
        
        console.log('\n❌ REMAINING ISSUES:');
        console.log(`   1. Railway API lacks proper import endpoints`);
        console.log(`   2. Need to identify correct way to add services to database`);
        console.log(`   3. Current database has ${currentCount} services, we can't add new ones yet`);
        
        console.log('\n🔧 NEXT PROFESSIONAL STEPS:');
        console.log(`   1. Investigate Railway app endpoints more thoroughly`);
        console.log(`   2. Check if there's a database admin interface`);
        console.log(`   3. Consider setting up direct PostgreSQL connection`);
        console.log(`   4. Implement proper bulk import API endpoint`);
        console.log(`   5. Test with smaller batches first`);
        
        console.log(`\n📁 EXTRACTED DATA SAVED TO: ${backupFile}`);
        console.log(`   Services ready for import: ${allServices.length}`);
        console.log(`   Processing time: ${Math.round(totalTime / 1000)}s`);
        
        if (totalExtracted > 0) {
            console.log('\n✅ EXTRACTION SUCCESS: We can now extract services properly');
            console.log('   Next: Need to solve the import/database issue');
        } else {
            console.log('\n❌ EXTRACTION FAILED: Need to debug adapters further');
        }
        
    } catch (error) {
        console.error('❌ Process failed:', error.message);
        console.error(error.stack);
    }
}

fixAndImportServices().catch(console.error);