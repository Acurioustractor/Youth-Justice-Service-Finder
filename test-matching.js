import { governmentSpending, getSupplierByName } from './frontend/src/lib/spendingData.js';

console.log('=== TESTING SPECIFIC MATCHES ===\n');

// Test cases from the actual service data
const testCases = [
  { serviceName: 'Aboriginal and Torres Strait Islander Community Health Service', 
    spendingName: 'Aboriginal and Torres Strait Islander Community Health Service Brisbane Limited' },
  { serviceName: 'Gold Coast Youth Service', 
    spendingName: 'Gold Coast Youth Service Inc' },
  { serviceName: 'Mission Australia', 
    spendingName: 'Mission Australia' },
  { serviceName: 'Youth Advocacy Centre', 
    spendingName: 'Youth Advocacy Centre Inc' },
  { serviceName: 'Department of Youth Justice', 
    spendingName: null }, // This probably won't match as it's a government dept
  { serviceName: 'Big Bounce', 
    spendingName: 'Community Sports Mentoring & Coaching Ltd' }, // Service name vs org name
];

testCases.forEach(test => {
  console.log(`Testing: "${test.serviceName}"`);
  const match = getSupplierByName(test.serviceName);
  
  if (match) {
    console.log(`  ✓ MATCHED: ${match.name}`);
    console.log(`  Funding: $${match.total.toLocaleString()}`);
  } else {
    console.log(`  ✗ NO MATCH`);
    if (test.spendingName) {
      console.log(`  Expected: ${test.spendingName}`);
    }
  }
  console.log('');
});

console.log('=== TESTING REVERSE LOOKUP ===');
console.log('Looking for spending data organizations in service org names...\n');

// Test if any spending suppliers match service organization names
const spendingNames = [
  'Gold Coast Youth Service Inc',
  'Aboriginal and Torres Strait Islander Community Health Service Brisbane Limited',
  'Youth Advocacy Centre Inc',
  'Community Sports Mentoring & Coaching Ltd'
];

spendingNames.forEach(spendingName => {
  console.log(`Spending org: "${spendingName}"`);
  const match = getSupplierByName(spendingName);
  console.log(`  Match result: ${match ? match.name : 'NO MATCH'}`);
});

console.log('\n=== KEY FINDINGS ===');
console.log('1. Some exact matches work (Mission Australia)');
console.log('2. Many service org names are abbreviated vs spending data (missing "Inc", "Limited", etc.)');
console.log('3. Some services have different names than their funding organization');
console.log('4. The matching algorithm needs improvement for partial matches');