#!/usr/bin/env node

// Execute Australian Youth Services Comprehensive Scraper
import { MasterAustralianScraper } from './src/scrapers/master-australian-scraper.js';
import pino from 'pino';

const logger = pino({ 
  name: 'australian-scraper-execution',
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});

async function main() {
  logger.info('🇦🇺 Starting comprehensive Australian youth services data collection');
  logger.info('📊 Target: Expand from 275 Queensland services to 2000+ Australia-wide');
  
  try {
    // Initialize master scraper with production settings
    const masterScraper = new MasterAustralianScraper({
      maxConcurrentScrapers: 3,
      deduplicationThreshold: 0.85,
      exportFormats: ['json', 'csv'],
      enableFOIRequests: false, // Will be enabled in Phase 2
      respectRateLimits: true
    });

    logger.info('🚀 Executing comprehensive scraping strategy...');
    
    // Execute the world-class scraping operation
    const results = await masterScraper.executeComprehensiveScraping();
    
    // Display final results
    logger.info('✅ Australian youth services scraping completed successfully!');
    logger.info({
      total_services_collected: results.summary.coverage.total_services,
      processing_time_minutes: results.summary.execution_summary.processing_time_minutes,
      data_sources: Object.keys(results.summary.coverage.data_sources).length,
      states_covered: Object.keys(results.summary.coverage.by_state).length,
      quality_scores: results.summary.data_quality
    }, 'FINAL RESULTS');

    // Show state breakdown
    logger.info('📍 Services by State:');
    for (const [state, count] of Object.entries(results.summary.coverage.by_state)) {
      logger.info(`   ${state}: ${count} services`);
    }

    // Show top organizations
    logger.info('🏢 Top Service Organizations:');
    results.summary.coverage.top_organizations.slice(0, 5).forEach((org, index) => {
      logger.info(`   ${index + 1}. ${org.name}: ${org.services_count} services`);
    });

    // Show recommendations
    if (results.summary.recommendations.length > 0) {
      logger.info('💡 Recommendations:');
      results.summary.recommendations.forEach(rec => {
        logger.info(`   ${rec.priority.toUpperCase()}: ${rec.message}`);
      });
    }

    // Next steps
    logger.info('🎯 Next Steps:');
    results.next_steps.forEach((step, index) => {
      logger.info(`   ${index + 1}. ${step}`);
    });

    return results;

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Scraping execution failed');
    throw error;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(results => {
      logger.info('🎉 World-class Australian youth services database successfully created!');
      process.exit(0);
    })
    .catch(error => {
      logger.error('❌ Execution failed:', error.message);
      process.exit(1);
    });
}

export default main;