import fs from 'fs';
import { governmentSpending, getSupplierByName } from './frontend/src/lib/spendingData.js';

// Load the merged services data
const servicesData = JSON.parse(fs.readFileSync('MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json', 'utf8'));

console.log('=== SIMULATING FUNDING FILTER ===\n');

// Get first 50 services to test
const services = servicesData.services.slice(0, 50);

console.log(`Testing funding matches on ${services.length} services...\n`);

// Enhance services with funding information (same logic as SearchPage.jsx)
const enhancedServices = services.map(service => {
  // Try multiple name/organization fields for better matching
  const orgName = service.organization?.name || service.organization_name || service.name || '';
  const abn = service.organization?.abn || service.abn || null;
  
  const fundingInfo = getSupplierByName(orgName, abn);
  return {
    ...service,
    fundingInfo: fundingInfo ? {
      amount: fundingInfo.total,
      level: getFundingLevel(fundingInfo.total),
      status: fundingInfo.status,
      contracts: fundingInfo.contracts,
      category: fundingInfo.category,
      fundingPeriod: fundingInfo.fundingPeriod
    } : null
  };
});

// Helper function from spendingData.js
function getFundingLevel(amount) {
  const { fundingLevels } = governmentSpending;
  
  if (amount >= fundingLevels.major.min) return 'major';
  if (amount >= fundingLevels.significant.min) return 'significant';
  if (amount >= fundingLevels.moderate.min) return 'moderate';
  if (amount >= fundingLevels.limited.min) return 'limited';
  return 'minimal';
}

// Count services with funding info
const servicesWithFunding = enhancedServices.filter(service => service.fundingInfo);
console.log(`Services with funding info: ${servicesWithFunding.length} out of ${services.length}`);

// Show examples
console.log('\n=== SERVICES WITH FUNDING ===');
servicesWithFunding.slice(0, 10).forEach((service, i) => {
  console.log(`${i+1}. ${service.name}`);
  console.log(`   Org: ${service.organization?.name}`);
  console.log(`   Funding: $${service.fundingInfo.amount.toLocaleString()} (${service.fundingInfo.level})`);
  console.log('');
});

console.log('\n=== SERVICES WITHOUT FUNDING ===');
const servicesWithoutFunding = enhancedServices.filter(service => !service.fundingInfo);
console.log(`Services without funding: ${servicesWithoutFunding.length}`);

servicesWithoutFunding.slice(0, 10).forEach((service, i) => {
  console.log(`${i+1}. ${service.name}`);
  console.log(`   Org: ${service.organization?.name || 'NO ORGANIZATION'}`);
  console.log('');
});

// Test specific filters
console.log('\n=== TESTING FUNDED_ONLY FILTER ===');
const fundedOnlyServices = enhancedServices.filter(service => service.fundingInfo);
console.log(`Funded only filter result: ${fundedOnlyServices.length} services`);

console.log('\n=== TESTING FUNDING_LEVEL FILTER ===');
['major', 'significant', 'moderate', 'limited', 'minimal'].forEach(level => {
  const levelServices = enhancedServices.filter(service => 
    service.fundingInfo && service.fundingInfo.level === level
  );
  console.log(`${level} funding: ${levelServices.length} services`);
});

console.log('\n=== CONCLUSION ===');
if (servicesWithFunding.length === 0) {
  console.log('❌ NO SERVICES FOUND WITH FUNDING - This explains the 0 results!');
} else {
  console.log(`✅ ${servicesWithFunding.length} services found with funding info`);
  console.log('The filter should be working. Issue might be elsewhere.');
}