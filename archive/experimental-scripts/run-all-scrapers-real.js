#!/usr/bin/env node

// Run ALL working scrapers to get maximum real data
import db from './src/config/database.js';

const scrapers = [
  { name: 'Legal Aid', file: './src/scrapers/legal-aid-scraper.js', class: 'LegalAidScraper' },
  { name: 'PCYC', file: './src/scrapers/pcyc-scraper.js', class: 'PCYCScraper' },
  { name: 'Headspace', file: './src/scrapers/headspace-scraper.js', class: 'HeadspaceScraper' },
  { name: 'Queensland Open Data', file: './src/scrapers/queensland-open-data-scraper.js', class: 'QueenslandOpenDataScraper' },
  { name: 'Youth Advocacy', file: './src/scrapers/youth-advocacy-scraper.js', class: 'YouthAdvocacyScraper' },
  { name: 'Crisis Support', file: './src/scrapers/crisis-support-scraper.js', class: 'CrisisSupportScraper' }
];

async function runAllScrapers() {
  console.log('🚀 RUNNING ALL SCRAPERS TO GET MAXIMUM REAL DATA\n');
  
  const results = {};
  let totalFound = 0;
  
  for (const scraper of scrapers) {
    console.log(`🕷️ Running ${scraper.name} scraper...`);
    
    try {
      const module = await import(scraper.file);
      const ScraperClass = module[scraper.class];
      const instance = new ScraperClass(db);
      
      const result = await instance.scrape();
      results[scraper.name] = result;
      totalFound += result.servicesFound || 0;
      
      console.log(`✅ ${scraper.name}: ${result.servicesFound || 0} services found`);
      
    } catch (error) {
      console.log(`❌ ${scraper.name}: ${error.message}`);
      results[scraper.name] = { error: error.message };
    }
    
    console.log('');
  }
  
  console.log('🎉 ALL SCRAPERS COMPLETE!');
  console.log(`📊 Total services found: ${totalFound}`);
  console.log('\n📋 Detailed Results:');
  console.log(JSON.stringify(results, null, 2));
  
  // Export results to JSON
  const fs = await import('fs');
  const exportData = {
    timestamp: new Date().toISOString(),
    totalServices: totalFound,
    results: results
  };
  
  fs.writeFileSync('./scraping-results.json', JSON.stringify(exportData, null, 2));
  console.log('\n💾 Results exported to scraping-results.json');
  
  // Get current database stats
  try {
    const stats = await db.raw(`
      SELECT 
        (SELECT COUNT(*) FROM services) as total_services,
        (SELECT COUNT(*) FROM organizations) as total_organizations,
        (SELECT COUNT(*) FROM locations) as total_locations,
        (SELECT COUNT(DISTINCT data_source) FROM services) as data_sources
    `);
    
    console.log('\n📈 Current Database Stats:');
    console.log(`  Services: ${stats.rows[0].total_services}`);
    console.log(`  Organizations: ${stats.rows[0].total_organizations}`);
    console.log(`  Locations: ${stats.rows[0].total_locations}`);
    console.log(`  Data Sources: ${stats.rows[0].data_sources}`);
    
  } catch (error) {
    console.log('Could not get database stats:', error.message);
  }
  
  process.exit(0);
}

runAllScrapers().catch(console.error);