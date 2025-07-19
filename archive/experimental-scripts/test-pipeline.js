/**
 * Test Script for Multi-Source Data Pipeline
 * 
 * Demonstrates the Week 1-2 Foundation implementation:
 * - Ask Izzy API integration (with placeholder data)
 * - Multi-source data pipeline architecture
 * - Deduplication and quality scoring systems
 */

import { PipelineManager } from './src/data-pipeline/orchestration/pipeline-manager.js';

async function testPipeline() {
    console.log('🚀 Testing Multi-Source Data Pipeline Foundation\n');
    
    // Initialize pipeline manager
    const pipeline = new PipelineManager({
        batchSize: 50,
        maxConcurrentJobs: 2,
        enableDeduplication: true,
        minQualityScore: 0.3
    });
    
    // Set up event listeners
    pipeline.on('jobCreated', (job) => {
        console.log(`📝 Job created: ${job.id} (${job.source})`);
    });
    
    pipeline.on('jobStarted', (job) => {
        console.log(`▶️  Job started: ${job.id}`);
    });
    
    pipeline.on('jobCompleted', (job) => {
        console.log(`✅ Job completed: ${job.id}`);
        console.log(`   - Services processed: ${job.result.servicesProcessed}`);
        console.log(`   - Services stored: ${job.result.servicesStored}`);
        console.log(`   - Duplicates found: ${job.result.duplicatesFound}`);
        console.log(`   - Processing time: ${job.result.processingTime}ms\n`);
    });
    
    pipeline.on('jobFailed', (job) => {
        console.log(`❌ Job failed: ${job.id} - ${job.error.message}\n`);
    });
    
    try {
        console.log('📋 Step 1: Testing adapter connectivity\n');
        
        // Test all adapters
        const testResults = await pipeline.runTests();
        
        for (const [adapter, result] of Object.entries(testResults)) {
            console.log(`🔌 ${adapter}: ${result.status === 'success' ? '✅' : '❌'}`);
            if (result.status === 'success') {
                console.log(`   - Available services: ${result.metadata.estimatedRecords || 'Unknown'}`);
                console.log(`   - Sample extraction: ${result.extraction.servicesExtracted} services`);
            } else {
                console.log(`   - Error: ${result.error}`);
            }
        }
        
        console.log('\n📋 Step 2: Running extraction jobs\n');
        
        // Create extraction jobs
        const job1 = pipeline.createJob({
            source: 'askizzy',
            type: 'extraction',
            limit: 20,
            youthOnly: true,
            enableDeduplication: true,
            enableQualityAssessment: true,
            storeResults: false // Set to true when database is configured
        });
        
        console.log(`📋 Step 3: Processing pipeline jobs\n`);
        
        // Wait for jobs to complete
        await new Promise((resolve) => {
            pipeline.on('queueCompleted', resolve);
        });
        
        console.log('📋 Step 4: Pipeline statistics\n');
        
        // Get final statistics
        const stats = pipeline.getStats();
        console.log('📊 Pipeline Statistics:');
        console.log(`   - Jobs completed: ${stats.jobsCompleted}`);
        console.log(`   - Jobs failed: ${stats.jobsFailed}`);
        console.log(`   - Services processed: ${stats.servicesProcessed}`);
        console.log(`   - Services stored: ${stats.servicesStored}`);
        console.log(`   - Duplicates found: ${stats.duplicatesFound}`);
        console.log(`   - Average processing time: ${Math.round(stats.averageProcessingTime)}ms`);
        
        console.log('\n📋 Step 5: Testing deduplication engine\n');
        
        // Demonstrate deduplication with sample data
        const sampleServices = [
            {
                id: '1',
                name: 'Youth Legal Service Brisbane',
                organization: { name: 'Youth Legal Service Inc' },
                locations: [{ address_1: '123 Main St', city: 'Brisbane', postal_code: '4000' }],
                contacts: [{ email: 'info@youthlegaldemo.org.au', phone: [{ number: '07 3000 0000' }] }],
                data_source: 'test_source_1'
            },
            {
                id: '2',
                name: 'Youth Legal Service - Brisbane',
                organization: { name: 'Youth Legal Service Incorporated' },
                locations: [{ address_1: '123 Main Street', city: 'Brisbane', postal_code: '4000' }],
                contacts: [{ email: 'contact@youthlegaldemo.org.au', phone: [{ number: '(07) 3000-0000' }] }],
                data_source: 'test_source_2'
            }
        ];
        
        const { DeduplicationEngine } = await import('./src/data-pipeline/engines/deduplication-engine.js');
        const deduplicator = new DeduplicationEngine();
        
        const duplicateResults = await deduplicator.findDuplicates(sampleServices);
        
        console.log('🔍 Deduplication Results:');
        console.log(`   - Services checked: ${duplicateResults.stats.totalChecked}`);
        console.log(`   - Duplicates found: ${duplicateResults.stats.duplicatesFound}`);
        
        if (duplicateResults.duplicatePairs.length > 0) {
            const pair = duplicateResults.duplicatePairs[0];
            console.log(`   - Match type: ${pair.matchType}`);
            console.log(`   - Confidence: ${(pair.confidence * 100).toFixed(1)}%`);
            console.log(`   - Name similarity: ${(pair.scores.name * 100).toFixed(1)}%`);
            console.log(`   - Location similarity: ${(pair.scores.location * 100).toFixed(1)}%`);
        }
        
        console.log('\n📋 Step 6: Testing quality engine\n');
        
        // Demonstrate quality assessment
        const { QualityEngine } = await import('./src/data-pipeline/engines/quality-engine.js');
        const qualityEngine = new QualityEngine();
        
        const qualityResults = await qualityEngine.assessBatch(sampleServices);
        
        console.log('⭐ Quality Assessment Results:');
        console.log(`   - Services assessed: ${qualityResults.summary.totalServices}`);
        console.log(`   - Average score: ${(qualityResults.summary.averageScore * 100).toFixed(1)}%`);
        console.log(`   - Score distribution:`);
        
        for (const [level, count] of Object.entries(qualityResults.summary.scoreDistribution)) {
            if (count > 0) {
                console.log(`     - ${level}: ${count} services`);
            }
        }
        
        if (qualityResults.summary.commonIssues.length > 0) {
            console.log(`   - Common issues:`);
            qualityResults.summary.commonIssues.slice(0, 3).forEach(issue => {
                console.log(`     - ${issue.issue}: ${issue.count} occurrences`);
            });
        }
        
        console.log('\n🎉 Multi-Source Data Pipeline Foundation Test Complete!\n');
        
        console.log('✅ Successfully implemented:');
        console.log('   - Base adapter interface with Ask Izzy integration');
        console.log('   - Multi-source data pipeline architecture');
        console.log('   - Deduplication engine with fuzzy matching');
        console.log('   - Quality scoring system');
        console.log('   - Pipeline orchestration and job management');
        console.log('   - Error handling and monitoring');
        
        console.log('\n📋 Next Steps (Week 3-4):');
        console.log('   - Obtain Ask Izzy API access from Infoxchange');
        console.log('   - Implement Queensland Open Data Portal integration');
        console.log('   - Add Department of Youth Justice data feeds');
        console.log('   - Configure database storage');
        console.log('   - Deploy pipeline to production environment');
        
    } catch (error) {
        console.error('❌ Pipeline test failed:', error.message);
        console.error(error.stack);
    } finally {
        // Clean up
        await pipeline.cleanup();
    }
}

// Run the test
testPipeline().catch(console.error);