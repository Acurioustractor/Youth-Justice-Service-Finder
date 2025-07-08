#!/usr/bin/env node

// Export all the REAL Queensland youth services we scraped
import db from './src/config/database.js';
import fs from 'fs';

async function exportRealData() {
  console.log('🚀 EXPORTING ALL REAL QUEENSLAND YOUTH SERVICES\n');
  
  // Get all services with full details
  const services = await db('services as s')
    .leftJoin('organizations as o', 's.organization_id', 'o.id')
    .leftJoin('locations as l', 's.id', 'l.service_id')
    .leftJoin('contacts as c', 's.id', 'c.service_id')
    .select(
      's.id',
      's.name',
      's.description',
      's.categories',
      's.keywords',
      's.minimum_age',
      's.maximum_age',
      's.youth_specific',
      's.indigenous_specific',
      's.status',
      's.data_source',
      's.created_at',
      's.updated_at',
      'o.name as organization_name',
      'o.organization_type',
      'o.url as organization_url',
      'l.name as location_name',
      'l.address_1',
      'l.city',
      'l.state_province',
      'l.postal_code',
      'l.region',
      'l.latitude',
      'l.longitude',
      'c.name as contact_name',
      'c.phone',
      'c.email'
    )
    .where('s.status', 'active')
    .orderBy('s.data_source')
    .orderBy('s.name');

  console.log(`📋 Found ${services.length} active services from ${new Set(services.map(s => s.data_source)).size} data sources\n`);

  // Group by data source
  const bySource = {};
  services.forEach(service => {
    if (!bySource[service.data_source]) {
      bySource[service.data_source] = [];
    }
    bySource[service.data_source].push(service);
  });

  console.log('📊 BREAKDOWN BY SOURCE:');
  Object.entries(bySource).forEach(([source, services]) => {
    console.log(`  ${source}: ${services.length} services`);
  });

  // Export to JSON
  const jsonData = {
    exported_at: new Date().toISOString(),
    total_services: services.length,
    data_sources: Object.keys(bySource),
    services: services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      categories: service.categories || [],
      keywords: service.keywords || [],
      age_range: {
        minimum: service.minimum_age,
        maximum: service.maximum_age
      },
      youth_specific: service.youth_specific,
      indigenous_specific: service.indigenous_specific,
      organization: {
        name: service.organization_name,
        type: service.organization_type,
        url: service.organization_url
      },
      location: {
        name: service.location_name,
        address: service.address_1,
        city: service.city,
        state: service.state_province || 'QLD',
        postcode: service.postal_code,
        region: service.region,
        coordinates: service.latitude && service.longitude ? {
          lat: parseFloat(service.latitude),
          lng: parseFloat(service.longitude)
        } : null
      },
      contact: {
        name: service.contact_name,
        phone: service.phone ? (typeof service.phone === 'string' ? JSON.parse(service.phone) : service.phone) : null,
        email: service.email
      },
      data_source: service.data_source,
      created_at: service.created_at,
      updated_at: service.updated_at
    }))
  };

  // Write JSON file
  fs.writeFileSync('queensland-youth-services.json', JSON.stringify(jsonData, null, 2));
  console.log('\n✅ Exported to queensland-youth-services.json');

  // Export to CSV
  const csvHeaders = [
    'ID', 'Name', 'Description', 'Organization', 'Organization Type',
    'Address', 'City', 'Postcode', 'Region', 'Latitude', 'Longitude',
    'Phone', 'Email', 'Categories', 'Keywords', 'Min Age', 'Max Age',
    'Youth Specific', 'Indigenous Specific', 'Data Source'
  ];

  const csvRows = services.map(service => [
    service.id,
    `"${service.name || ''}"`,
    `"${(service.description || '').replace(/"/g, '""')}"`,
    `"${service.organization_name || ''}"`,
    service.organization_type || '',
    `"${service.address_1 || ''}"`,
    service.city || '',
    service.postal_code || '',
    service.region || '',
    service.latitude || '',
    service.longitude || '',
    service.phone ? `"${JSON.stringify(service.phone)}"` : '',
    service.email || '',
    service.categories ? `"${JSON.stringify(service.categories)}"` : '',
    service.keywords ? `"${JSON.stringify(service.keywords)}"` : '',
    service.minimum_age || '',
    service.maximum_age || '',
    service.youth_specific || false,
    service.indigenous_specific || false,
    service.data_source || ''
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  fs.writeFileSync('queensland-youth-services.csv', csvContent);
  console.log('✅ Exported to queensland-youth-services.csv');

  // Create summary by organization
  const orgSummary = {};
  services.forEach(service => {
    const org = service.organization_name || 'Unknown';
    if (!orgSummary[org]) {
      orgSummary[org] = {
        name: org,
        type: service.organization_type,
        services: 0,
        locations: new Set(),
        data_source: service.data_source
      };
    }
    orgSummary[org].services++;
    if (service.city) orgSummary[org].locations.add(service.city);
  });

  console.log('\n🏢 ORGANIZATIONS SUMMARY:');
  Object.values(orgSummary).forEach(org => {
    console.log(`  ${org.name}: ${org.services} services in ${org.locations.size} locations`);
  });

  console.log('\n🎉 EXPORT COMPLETE!');
  console.log('Files created:');
  console.log('  - queensland-youth-services.json (structured data)');
  console.log('  - queensland-youth-services.csv (spreadsheet format)');
  console.log('  - scraping-results.json (scraper statistics)');

  process.exit(0);
}

exportRealData().catch(console.error);