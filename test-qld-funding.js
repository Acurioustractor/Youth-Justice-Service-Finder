import fs from 'fs';
import { governmentSpending, getSupplierByName } from './frontend/src/lib/spendingData.js';

// Load the merged services data
const servicesData = JSON.parse(fs.readFileSync('MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json', 'utf8'));

console.log('=== TESTING QLD SERVICES FUNDING MATCHING ===\n');

// Get ONLY QLD scraped services
const qldServices = servicesData.services.filter(service => 
  service.data_source && service.data_source.source_name === 'QLD Scraped Services'
);

console.log(`Testing QLD services: ${qldServices.length}\n`);

// Helper function from spendingData.js
function getFundingLevel(amount) {
  const { fundingLevels } = governmentSpending;
  
  if (amount >= fundingLevels.major.min) return 'major';
  if (amount >= fundingLevels.significant.min) return 'significant';
  if (amount >= fundingLevels.moderate.min) return 'moderate';
  if (amount >= fundingLevels.limited.min) return 'limited';
  return 'minimal';
}

// Enhance QLD services with funding information
const enhancedQldServices = qldServices.map(service => {
  const orgName = service.organization?.name || service.organization_name || service.name || '';
  const abn = service.organization?.abn || service.abn || null;
  
  const fundingInfo = getSupplierByName(orgName, abn);
  return {
    ...service,
    orgName,
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

// Count QLD services with funding info
const qldServicesWithFunding = enhancedQldServices.filter(service => service.fundingInfo);
console.log(`QLD Services with funding info: ${qldServicesWithFunding.length} out of ${qldServices.length}\n`);

if (qldServicesWithFunding.length > 0) {
  console.log('=== QLD SERVICES WITH FUNDING ===');
  qldServicesWithFunding.slice(0, 15).forEach((service, i) => {
    console.log(`${i+1}. ${service.name}`);
    console.log(`   Org: ${service.orgName}`);
    console.log(`   Funding: $${service.fundingInfo.amount.toLocaleString()} (${service.fundingInfo.level})`);
    console.log(`   Matched to: ${service.fundingInfo.category}`);
    console.log('');
  });
} else {
  console.log('❌ NO QLD SERVICES HAVE FUNDING MATCHES!');
  console.log('\nLet\'s test some specific QLD organization names:');
  
  const sampleQldOrgs = [...new Set(qldServices.slice(0, 20).map(s => s.organization?.name).filter(Boolean))];
  
  sampleQldOrgs.forEach(orgName => {
    const match = getSupplierByName(orgName);
    console.log(`- "${orgName}": ${match ? 'MATCHED to ' + match.name : 'NO MATCH'}`);
  });
}

console.log('\n=== TESTING SPECIFIC EXPECTED MATCHES ===');

// Test specific organizations that should definitely match
const expectedMatches = [
  'Anglicare Central Queensland',
  'Anglicare Southern Queensland', 
  'Mission Australia',
  'Youth Advocacy Centre',
  'Department of Youth Justice'
];

expectedMatches.forEach(orgName => {
  const qldService = qldServices.find(s => s.organization?.name === orgName);
  if (qldService) {
    const match = getSupplierByName(orgName);
    console.log(`✓ Found "${orgName}" in QLD services`);
    console.log(`  Funding match: ${match ? match.name + ' ($' + match.total.toLocaleString() + ')' : 'NO MATCH'}`);
  } else {
    console.log(`✗ "${orgName}" not found in QLD services`);
  }
});

console.log(`\n=== FINAL ANALYSIS ===`);
console.log(`Total QLD services: ${qldServices.length}`);
console.log(`QLD services with funding: ${qldServicesWithFunding.length}`);
console.log(`Match rate: ${((qldServicesWithFunding.length / qldServices.length) * 100).toFixed(1)}%`);

if (qldServicesWithFunding.length === 0) {
  console.log('\n❌ THIS IS THE PROBLEM: No QLD services are getting funding matches!');
  console.log('The government funding filter will always return 0 results.');
} else {
  console.log('\n✅ QLD services do have funding matches. Problem may be in the search API or frontend logic.');
}