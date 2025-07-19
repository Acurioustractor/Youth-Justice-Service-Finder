import fs from 'fs';
import path from 'path';

// Load the merged services data
const servicesData = JSON.parse(fs.readFileSync('MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json', 'utf8'));

console.log('=== ANALYSIS: Government Funding Filter Issue ===\n');

// Get all unique organization names from QLD services
const qldServices = servicesData.services.filter(service => 
  service.data_source && service.data_source.source_name === 'QLD Scraped Services'
);

console.log('QLD Services found:', qldServices.length);

// Extract organization names
const organizationNames = [...new Set(qldServices.map(service => 
  service.organization?.name || 'NO_ORGANIZATION_NAME'
).filter(name => name !== 'NO_ORGANIZATION_NAME'))];

console.log('Unique organization names in QLD services:', organizationNames.length);
console.log('\nFirst 30 organization names from QLD services:');
organizationNames.slice(0, 30).forEach((name, i) => {
  console.log(`${i+1}. ${name}`);
});

console.log('\n=== SAMPLE SPENDING DATA NAMES ===');
// Read spending data file as text to extract names
const spendingDataText = fs.readFileSync('frontend/src/lib/spendingData.js', 'utf8');

// Extract supplier names using regex
const supplierMatches = spendingDataText.match(/name: '([^']+)'/g);
if (supplierMatches) {
  const supplierNames = supplierMatches.map(match => match.replace(/name: '([^']+)'/, '$1'));
  console.log('Sample spending data organization names:');
  supplierNames.slice(0, 15).forEach((name, i) => {
    console.log(`${i+1}. ${name}`);
  });
}

console.log('\n=== EXACT MATCH TEST ===');
// Test for exact matches between service org names and spending data
const testMatches = [
  'Mission Australia',
  'Youth Advocacy Centre Inc',
  'Department of Youth Justice',
  'Anglicare Central Queensland',
  'Anglicare Southern Queensland',
  'Brisbane Youth Service',
  'Gold Coast Youth Service Inc'
];

console.log('Testing if these service organization names exist in QLD services:');
testMatches.forEach(testName => {
  const found = organizationNames.find(name => 
    name.toLowerCase().includes(testName.toLowerCase()) ||
    testName.toLowerCase().includes(name.toLowerCase())
  );
  console.log(`- "${testName}": ${found ? 'FOUND as "' + found + '"' : 'NOT FOUND'}`);
});

console.log('\n=== KEY ISSUE DIAGNOSIS ===');
console.log('The problem is likely that:');
console.log('1. Organization names in services don\'t exactly match spending data names');
console.log('2. Service organization names might be more generic/abbreviated');
console.log('3. The matching algorithm needs to be more flexible');

// Show some examples of organization types in the services
console.log('\n=== ORGANIZATION TYPES IN SERVICES ===');
const orgTypes = [...new Set(qldServices.map(s => s.organization?.type).filter(Boolean))];
console.log('Organization types found:', orgTypes);

// Count government services
const govServices = qldServices.filter(s => s.organization?.type === 'government');
console.log(`\nGovernment services: ${govServices.length} out of ${qldServices.length}`);

console.log('\n=== SAMPLE GOVERNMENT SERVICES ===');
govServices.slice(0, 10).forEach((service, i) => {
  console.log(`${i+1}. ${service.name} (org: ${service.organization?.name})`);
});