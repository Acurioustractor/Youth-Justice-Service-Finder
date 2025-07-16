/**
 * Import Maximum Dataset to Production Database
 * 
 * Extracts maximum scale dataset and imports to production/Railway database
 */

import { PipelineManager } from './src/data-pipeline/orchestration/pipeline-manager.js';
import axios from 'axios';

const RAILWAY_API_BASE = 'https://youth-justice-service-finder-production.up.railway.app';

async function importMaximumDataset() {
    console.log('🚀 IMPORTING MAXIMUM DATASET TO PRODUCTION DATABASE\n');
    
    const pipeline = new PipelineManager({
        batchSize: 100,
        maxConcurrentJobs: 2,
        enableDeduplication: true,
        minQualityScore: 0.1
    });
    
    let totalImported = 0;
    let errors = 0;
    const startTime = Date.now();
    
    try {
        // Check Railway API health first
        console.log('🔍 Checking production database connection...');
        try {
            const healthCheck = await axios.get(`${RAILWAY_API_BASE}/health`);
            console.log(`✅ Production API healthy: ${healthCheck.data.status}`);
            console.log(`   Uptime: ${Math.round(healthCheck.data.uptime / 3600)} hours`);
        } catch (error) {
            console.log('⚠️  Production API not accessible, will show extraction results only');
        }
        console.log();
        
        console.log('📊 MAXIMUM SCALE EXTRACTION AND IMPORT\n');
        
        // Extract maximum dataset from all sources
        const sources = [
            { 
                name: 'acnc', 
                limit: 500, // Reasonable batch for import
                description: 'ACNC Charity Register',
                priority: 'high'
            },
            { 
                name: 'qld-data', 
                limit: 50, 
                description: 'Queensland Government Data',
                priority: 'high'
            },
            { 
                name: 'vic-cso', 
                limit: 30, 
                description: 'Victoria Community Organizations',
                priority: 'medium'
            }
        ];
        
        console.log('🏛️  **EXTRACTION AND IMPORT TARGETS:**');
        sources.forEach(source => {
            console.log(`   ${source.description}: ${source.limit} services`);
        });
        console.log(`   **TOTAL TARGET**: ${sources.reduce((sum, s) => sum + s.limit, 0)} services`);
        console.log();
        
        let allServices = [];
        
        // Extract from each source
        for (const source of sources) {
            console.log(`🏛️  **Extracting from ${source.description}...**`);
            
            const jobId = pipeline.createJob({
                source: source.name,
                type: 'extraction',
                limit: source.limit,
                enableDeduplication: false, // Will dedupe after all extraction
                enableQualityAssessment: true,
                storeResults: false
            });
            
            // Wait for extraction completion
            const sourceServices = await new Promise((resolve) => {
                pipeline.on('jobCompleted', (job) => {
                    if (job.id === jobId) {
                        const extracted = job.result.services || [];
                        console.log(`   ✅ Extracted: ${extracted.length} services`);
                        console.log(`   📊 Quality: ${Math.round((job.result.avgQualityScore || 0) * 100)}% average`);
                        resolve(extracted);
                    }
                });
                
                pipeline.on('jobFailed', (job) => {
                    if (job.id === jobId) {
                        console.log(`   ❌ Failed: ${job.error?.message}`);
                        resolve([]);
                    }
                });
            });
            
            allServices = allServices.concat(sourceServices);
            console.log();
        }
        
        console.log(`📊 **TOTAL EXTRACTED**: ${allServices.length} services`);
        console.log();
        
        // Run deduplication
        console.log('🔍 **Running cross-source deduplication...**');
        const deduplication = await pipeline.deduplicationEngine.findDuplicates(allServices, []);
        const uniqueServices = allServices.filter((service, index) => {
            return !deduplication.duplicatePairs.some(pair => 
                pair.service1 === service || pair.service2 === service
            );
        });
        
        console.log(`   Duplicates found: ${deduplication.duplicatePairs.length}`);
        console.log(`   Unique services: ${uniqueServices.length}`);
        console.log();
        
        // Analyze dataset before import
        console.log('📊 **DATASET ANALYSIS BEFORE IMPORT:**');
        const analysis = analyzeDataset(uniqueServices);
        console.log(`   Total Services: ${analysis.total}`);
        console.log(`   Average Quality: ${analysis.avgQuality}%`);
        console.log(`   With Contact Info: ${analysis.withContacts}%`);
        console.log(`   With Locations: ${analysis.withLocations}%`);
        console.log(`   States Covered: ${analysis.statesCovered}`);
        console.log(`   Categories: ${analysis.categories}`);
        console.log();
        
        // Try to import to Railway database
        console.log('💾 **IMPORTING TO PRODUCTION DATABASE:**');
        
        try {
            // First check current database status
            const statsResponse = await axios.get(`${RAILWAY_API_BASE}/stats`);
            const currentCount = statsResponse.data.totals?.services || 0;
            console.log(`   Current database services: ${currentCount}`);
            
            // Import in batches
            const batchSize = 50;
            let imported = 0;
            
            for (let i = 0; i < uniqueServices.length; i += batchSize) {
                const batch = uniqueServices.slice(i, i + batchSize);
                
                try {
                    console.log(`   Importing batch ${Math.floor(i/batchSize) + 1}: ${batch.length} services...`);
                    
                    // Import each service individually for better error handling
                    for (const service of batch) {
                        try {
                            await axios.post(`${RAILWAY_API_BASE}/services`, service, {
                                timeout: 10000,
                                headers: { 'Content-Type': 'application/json' }
                            });
                            imported++;
                        } catch (serviceError) {
                            console.log(`     ⚠️  Service import failed: ${service.name}`);
                            errors++;
                        }
                    }
                    
                    console.log(`     ✅ Batch completed: ${imported} total imported`);
                    
                    // Small delay between batches
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (batchError) {
                    console.log(`     ❌ Batch failed: ${batchError.message}`);
                    errors += batch.length;
                }
            }
            
            totalImported = imported;
            console.log(`   📊 Import Summary: ${totalImported} imported, ${errors} errors`);
            
        } catch (importError) {
            console.log(`   ❌ Database import failed: ${importError.message}`);
            console.log(`   💾 Services extracted but not imported: ${uniqueServices.length}`);
            
            // Save to local file as backup
            const fs = await import('fs');
            const filename = `maximum-dataset-${new Date().toISOString().split('T')[0]}.json`;
            fs.writeFileSync(filename, JSON.stringify(uniqueServices, null, 2));
            console.log(`   📁 Dataset saved to: ${filename}`);
        }
        
        console.log();
        
        // Final results
        const totalTime = Date.now() - startTime;
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🎉 **MAXIMUM DATASET IMPORT COMPLETE**');
        console.log('═══════════════════════════════════════════════════════════');
        console.log();
        
        console.log('📊 **FINAL RESULTS:**');
        console.log(`   Services Extracted: ${allServices.length}`);
        console.log(`   Duplicates Removed: ${deduplication.duplicatePairs.length}`);
        console.log(`   Unique Services: ${uniqueServices.length}`);
        console.log(`   Successfully Imported: ${totalImported}`);
        console.log(`   Import Errors: ${errors}`);
        console.log(`   Processing Time: ${Math.round(totalTime / 1000)}s`);
        console.log(`   Import Rate: ${Math.round(totalImported / (totalTime / 1000))} services/second`);
        console.log();
        
        console.log('🎯 **DATABASE STATUS:**');
        try {
            const finalStats = await axios.get(`${RAILWAY_API_BASE}/stats`);
            const finalCount = finalStats.data.totals?.services || 0;
            console.log(`   Total Services in Database: ${finalCount}`);
            console.log(`   Services Added This Import: ${totalImported}`);
            console.log(`   Database Growth: +${Math.round((totalImported/finalCount)*100)}%`);
        } catch (error) {
            console.log(`   Database status unavailable`);
        }
        
        console.log();
        console.log('✅ **NEXT STEPS:**');
        console.log('   🌐 Test frontend with new data: https://frontend-nokdhgueg-benjamin-knights-projects.vercel.app');
        console.log('   📊 Check API stats: https://youth-justice-service-finder-production.up.railway.app/stats');
        console.log('   🔍 Search new services: https://youth-justice-service-finder-production.up.railway.app/search');
        console.log('   📈 Monitor performance: Grafana dashboard');
        console.log('   🔄 Set up automated refresh: Daily pipeline execution');
        
        if (totalImported > 500) {
            console.log('\n🚀 **MASSIVE SUCCESS**: 500+ services now in production database!');
        } else if (totalImported > 200) {
            console.log('\n✅ **GREAT SUCCESS**: 200+ services now in production database!');
        } else if (totalImported > 0) {
            console.log('\n✅ **SUCCESS**: Services successfully imported to production!');
        }
        
    } catch (error) {
        console.error('❌ Maximum dataset import failed:', error.message);
    } finally {
        await pipeline.cleanup();
    }
}

function analyzeDataset(services) {
    let qualitySum = 0;
    let withContacts = 0;
    let withLocations = 0;
    const states = new Set();
    const categories = new Set();
    
    services.forEach(service => {
        qualitySum += service.completeness_score || 0;
        
        if (service.contacts && service.contacts.length > 0) {
            withContacts++;
        }
        
        if (service.locations && service.locations.length > 0) {
            withLocations++;
            const state = service.locations[0].state_province;
            if (state) states.add(state);
        }
        
        if (service.categories) {
            service.categories.forEach(cat => categories.add(cat));
        }
    });
    
    return {
        total: services.length,
        avgQuality: Math.round((qualitySum / services.length) * 100),
        withContacts: Math.round((withContacts / services.length) * 100),
        withLocations: Math.round((withLocations / services.length) * 100),
        statesCovered: states.size,
        categories: categories.size
    };
}

importMaximumDataset().catch(console.error);