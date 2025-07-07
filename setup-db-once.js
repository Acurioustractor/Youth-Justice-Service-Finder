// One-time database setup and real data scraping for Railway
import('./scripts/setup-railway-database.js').then(() => {
  console.log('🚀 Database ready - now scraping REAL Australian youth justice services...');
  return import('./scripts/run-all-scrapers-production.js');
}).catch(console.error);