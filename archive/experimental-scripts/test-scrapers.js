#!/usr/bin/env node

// Quick scraper test to see what actually works
import db from './src/config/database.js';

const scrapers = [
  { name: 'Legal Aid', file: './src/scrapers/legal-aid-scraper.js', class: 'LegalAidScraper' },
  { name: 'PCYC', file: './src/scrapers/pcyc-scraper.js', class: 'PCYCScraper' },
  { name: 'Headspace', file: './src/scrapers/headspace-scraper.js', class: 'HeadspaceScraper' },
  { name: 'Ask Izzy', file: './src/scrapers/ask-izzy-scraper.js', class: 'AskIzzyScraper' },
  { name: 'Queensland Open Data', file: './src/scrapers/queensland-open-data-scraper.js', class: 'QueenslandOpenDataScraper' }
];

async function testScrapers() {
  console.log('🧪 Testing scrapers to see which ones work...\n');
  
  const results = [];
  
  for (const scraper of scrapers) {
    console.log(`Testing ${scraper.name}...`);
    
    try {
      // Test import
      const module = await import(scraper.file);
      const ScraperClass = module[scraper.class];
      
      if (!ScraperClass) {
        throw new Error(`Class ${scraper.class} not found in ${scraper.file}`);
      }
      
      // Test instantiation
      const instance = new ScraperClass(db);
      
      // Test if scrape method exists
      if (typeof instance.scrape === 'function') {
        console.log(`✅ ${scraper.name}: Import OK, Class OK, Method OK`);
        results.push({ name: scraper.name, status: 'ready', scraper: instance });
      } else {
        console.log(`⚠️  ${scraper.name}: Import OK, Class OK, No scrape method`);
        results.push({ name: scraper.name, status: 'no_method', error: 'No scrape method' });
      }
      
    } catch (error) {
      console.log(`❌ ${scraper.name}: ${error.message}`);
      results.push({ name: scraper.name, status: 'error', error: error.message });
    }
    
    console.log('');
  }
  
  console.log('📊 SUMMARY:');
  const working = results.filter(r => r.status === 'ready');
  const broken = results.filter(r => r.status !== 'ready');
  
  console.log(`✅ Working: ${working.length}`);
  working.forEach(w => console.log(`  - ${w.name}`));
  
  console.log(`❌ Broken: ${broken.length}`);
  broken.forEach(b => console.log(`  - ${b.name}: ${b.error}`));
  
  if (working.length > 0) {
    console.log('\n🚀 Running the working scrapers...');
    
    for (const scraper of working) {
      console.log(`\nRunning ${scraper.name}...`);
      try {
        const result = await scraper.scraper.scrape();
        console.log(`✅ ${scraper.name} completed:`, result);
      } catch (error) {
        console.log(`❌ ${scraper.name} failed:`, error.message);
      }
    }
  }
  
  console.log('\n🏁 Test complete!');
  process.exit(0);
}

testScrapers().catch(console.error);