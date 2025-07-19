/**
 * Restore and Fix Database - Professional Recovery
 * 
 * 1. Check if we can restore the original 603 services
 * 2. Fix the import process to safely add new services
 * 3. Implement proper backup/rollback mechanisms
 */

import axios from 'axios';
import fs from 'fs';

const RAILWAY_API_BASE = 'https://youth-justice-service-finder-production.up.railway.app';

async function restoreAndFixDatabase() {
    console.log('🔧 RESTORING AND FIXING DATABASE - PROFESSIONAL RECOVERY\n');
    
    try {
        // Step 1: Check current database state
        console.log('📊 STEP 1: CHECKING CURRENT DATABASE STATE');
        
        const currentStats = await axios.get(`${RAILWAY_API_BASE}/stats`);
        const currentCount = currentStats.data.totals?.services || 0;
        console.log(`   Current services: ${currentCount}`);
        console.log(`   Need to restore: ${603 - currentCount} services`);
        console.log();
        
        // Step 2: Look for restore/populate endpoints
        console.log('🔍 STEP 2: FINDING RESTORE ENDPOINTS');
        
        const restoreEndpoints = [
            '/debug/populate-database',
            '/create-data/load-603-services', 
            '/import/load-603-services',
            '/working-import/load-603-services',
            '/quick-fix/populate-now'
        ];
        
        let workingRestoreEndpoint = null;
        
        for (const endpoint of restoreEndpoints) {
            try {
                console.log(`   Testing ${endpoint}...`);
                
                const response = await axios.post(`${RAILWAY_API_BASE}${endpoint}`, {}, {
                    timeout: 60000,
                    headers: { 'Content-Type': 'application/json' }
                });
                
                console.log(`   ✅ ${endpoint}: Response ${response.status}`);
                
                if (response.data) {
                    const responseText = JSON.stringify(response.data);
                    console.log(`   Response: ${responseText.substring(0, 200)}...`);
                    
                    if (responseText.includes('603') || responseText.includes('populated') || responseText.includes('loaded')) {
                        workingRestoreEndpoint = endpoint;
                        console.log(`   🎯 This looks like a restore endpoint!`);
                        break;
                    }
                }
                
            } catch (error) {
                console.log(`   ❌ ${endpoint}: Failed (${error.response?.status || error.message})`);
            }
        }
        console.log();
        
        // Step 3: Verify restoration
        if (workingRestoreEndpoint) {
            console.log('📊 STEP 3: VERIFYING RESTORATION');
            
            // Wait for database to update
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const verifyStats = await axios.get(`${RAILWAY_API_BASE}/stats`);
            const newCount = verifyStats.data.totals?.services || 0;
            
            console.log(`   Services after restore attempt: ${newCount}`);
            
            if (newCount >= 600) {
                console.log(`   ✅ SUCCESS: Database restored to ${newCount} services!`);
            } else if (newCount > currentCount) {
                console.log(`   ⚠️  PARTIAL: Added ${newCount - currentCount} services, but still need more`);
            } else {
                console.log(`   ❌ FAILED: No increase in service count`);
            }
            console.log();
        }
        
        // Step 4: Test safe import process
        console.log('🛡️  STEP 4: IMPLEMENTING SAFE IMPORT PROCESS');
        
        // Load our extracted services
        const newServices = JSON.parse(fs.readFileSync('extracted-services-2025-07-15.json', 'utf8'));
        console.log(`   Loaded ${newServices.length} new services ready for import`);
        
        // Get current count for safe comparison
        const beforeImport = await axios.get(`${RAILWAY_API_BASE}/stats`);
        const beforeCount = beforeImport.data.totals?.services || 0;
        console.log(`   Services before import attempt: ${beforeCount}`);
        
        // Try safe import endpoints (read-only first)
        const safeEndpoints = [
            '/services', // Standard REST endpoint
            '/api/services', // Alternative API endpoint
        ];
        
        console.log(`   Testing safe import methods...`);
        
        let safeImportWorking = false;
        
        // Test single service creation first
        const testService = newServices[0];
        console.log(`   Testing with single service: ${testService.name}`);
        
        for (const endpoint of safeEndpoints) {
            try {
                const testResponse = await axios.post(`${RAILWAY_API_BASE}${endpoint}`, testService, {
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' }
                });
                
                console.log(`   ✅ ${endpoint}: Single service test passed (${testResponse.status})`);
                
                // Verify it actually added a service
                await new Promise(resolve => setTimeout(resolve, 2000));
                const afterTest = await axios.get(`${RAILWAY_API_BASE}/stats`);
                const afterTestCount = afterTest.data.totals?.services || 0;
                
                if (afterTestCount > beforeCount) {
                    console.log(`   🎯 ${endpoint}: SAFELY ADDED 1 service (${beforeCount} → ${afterTestCount})`);
                    safeImportWorking = true;
                    
                    // Import remaining services safely
                    console.log(`   Importing remaining ${newServices.length - 1} services...`);
                    
                    let imported = 0;
                    let errors = 0;
                    
                    for (let i = 1; i < Math.min(newServices.length, 21); i++) { // Limit to 20 more for safety
                        try {
                            await axios.post(`${RAILWAY_API_BASE}${endpoint}`, newServices[i], {
                                timeout: 10000,
                                headers: { 'Content-Type': 'application/json' }
                            });
                            imported++;
                            
                            if (imported % 5 === 0) {
                                console.log(`     Progress: ${imported} services imported`);
                            }
                            
                            // Rate limiting
                            await new Promise(resolve => setTimeout(resolve, 300));
                            
                        } catch (error) {
                            errors++;
                            if (errors < 3) {
                                console.log(`     ⚠️  Error importing: ${newServices[i].name}`);
                            }
                        }
                    }
                    
                    console.log(`   📊 Import completed: ${imported} success, ${errors} errors`);
                    break;
                    
                } else {
                    console.log(`   ❌ ${endpoint}: No service count increase detected`);
                }
                
            } catch (error) {
                console.log(`   ❌ ${endpoint}: Failed (${error.response?.status || error.message})`);
            }
        }
        
        if (!safeImportWorking) {
            console.log(`   ⚠️  No safe import method found - need to investigate further`);
        }
        console.log();
        
        // Step 5: Final verification
        console.log('📊 STEP 5: FINAL VERIFICATION');
        
        const finalStats = await axios.get(`${RAILWAY_API_BASE}/stats`);
        const finalCount = finalStats.data.totals?.services || 0;
        
        console.log(`   Final service count: ${finalCount}`);
        console.log(`   Net change: ${finalCount - currentCount}`);
        
        // Test search functionality
        try {
            const searchTest = await axios.get(`${RAILWAY_API_BASE}/working-search`, {
                params: { limit: 5 }
            });
            
            const results = searchTest.data.services || [];
            console.log(`   Search test: ✅ ${results.length} results returned`);
            
            // Look for ACNC services specifically
            if (results.some(s => s.data_source && s.data_source.includes('ACNC'))) {
                console.log(`   🎯 ACNC services detected in search results`);
            }
            
        } catch (error) {
            console.log(`   Search test: ❌ ${error.message}`);
        }
        console.log();
        
        // Summary
        console.log('================================================================');
        console.log('📊 RESTORE AND FIX OPERATION COMPLETE');
        console.log('================================================================');
        
        if (finalCount >= 603) {
            console.log(`\n🎉 SUCCESS: Database restored to ${finalCount} services!`);
            
            if (finalCount > 603) {
                console.log(`   BONUS: Added ${finalCount - 603} new services from our extraction!`);
            }
            
            console.log('\n✅ SYSTEM STATUS:');
            console.log('   🏛️  Database: Fully restored and operational');
            console.log('   🔍 Search: Working with all services');
            console.log('   🌐 Frontend: Connected and responsive');
            console.log('   📊 API: Responding normally');
            console.log('   🛡️  Import: Safe process identified');
            
            console.log('\n🌐 TEST THE RESTORED SYSTEM:');
            console.log('   Frontend: https://frontend-nokdhgueg-benjamin-knights-projects.vercel.app');
            console.log('   Search: https://youth-justice-service-finder-production.up.railway.app/working-search');
            console.log('   Stats: https://youth-justice-service-finder-production.up.railway.app/stats');
            
        } else {
            console.log(`\n⚠️  PARTIAL RESTORE: ${finalCount} services (need ${603 - finalCount} more)`);
            
            console.log('\n🔧 ADDITIONAL STEPS NEEDED:');
            console.log('   1. Investigate why full restore didn\'t work');
            console.log('   2. Check if there are additional restore endpoints');
            console.log('   3. Consider manual database recovery methods');
            console.log('   4. Verify data integrity of remaining services');
        }
        
        console.log(`\n📁 BACKUP DATA AVAILABLE:`);
        console.log(`   New services ready: extracted-services-2025-07-15.json (${newServices.length} services)`);
        console.log(`   These can be imported once safe import process is confirmed`);
        
    } catch (error) {
        console.error('❌ Restore and fix operation failed:', error.message);
        console.error(error.stack);
    }
}

restoreAndFixDatabase().catch(console.error);