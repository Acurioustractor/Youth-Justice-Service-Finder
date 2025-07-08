// Emergency population script - run locally but connect to Railway database
import pg from 'pg';

const { Client } = pg;

async function emergencyPopulate() {
  console.log('🚨 EMERGENCY DATABASE POPULATION');
  
  const client = new Client({
    connectionString: 'postgresql://postgres:AbcdYyYnbSJEaYaXxZtKNxogjZZZXEWp@junction.proxy.rlwy.net:58893/railway',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway database');

    // Create organization
    const orgResult = await client.query(`
      INSERT INTO organizations (name, description, organization_type, data_source)
      VALUES ('Queensland Youth Justice Services', 'Emergency populated data', 'government', 'emergency')
      RETURNING id
    `);
    
    const orgId = orgResult.rows[0].id;
    console.log('✅ Created organization:', orgId);

    // Create services
    const services = [
      ['Youth Legal Aid Queensland', 'Free legal representation for young people', '{"legal_aid","court_support"}', '{"legal","court","lawyer"}', 10, 25],
      ['Crisis Accommodation Brisbane', 'Emergency housing for homeless youth', '{"housing","crisis_support"}', '{"housing","emergency","shelter"}', 16, 25],
      ['Aboriginal Youth Support', 'Cultural support for Indigenous youth', '{"cultural_support","mentoring"}', '{"aboriginal","indigenous","cultural"}', 12, 25]
    ];

    for (let i = 0; i < services.length; i++) {
      const [name, desc, categories, keywords, min_age, max_age] = services[i];
      
      const serviceResult = await client.query(`
        INSERT INTO services (organization_id, name, description, categories, keywords, minimum_age, maximum_age, youth_specific, data_source, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'emergency', 'active')
        RETURNING id
      `, [orgId, name, desc, categories, keywords, min_age, max_age]);
      
      const serviceId = serviceResult.rows[0].id;
      console.log(`✅ Created service: ${name}`);

      // Create location
      await client.query(`
        INSERT INTO locations (service_id, name, address_1, city, postal_code, region, latitude, longitude)
        VALUES ($1, $2, $3, 'Brisbane', '4000', 'brisbane', -27.4698, 153.0251)
      `, [serviceId, `${name} Office`, `${100 + i} Emergency Street`]);

      // Create contact
      await client.query(`
        INSERT INTO contacts (service_id, name, phone, email)
        VALUES ($1, 'Coordinator', $2, $3)
      `, [serviceId, `["(07) 300${i} 1234"]`, `contact${i}@emergency.qld.gov.au`]);
    }

    // Record as scraping job
    await client.query(`
      INSERT INTO scraping_jobs (source_name, source_url, job_type, status, services_found, started_at, completed_at)
      VALUES ('emergency_population', '/emergency-script', 'emergency', 'completed', $1, NOW(), NOW())
    `, [services.length]);

    await client.end();

    console.log('🎉 EMERGENCY POPULATION COMPLETED!');
    console.log(`✅ Created ${services.length} services`);
    console.log('🔍 Check your frontend now: https://frontend-x6ces3z0g-benjamin-knights-projects.vercel.app');

  } catch (error) {
    console.error('❌ Emergency population failed:', error.message);
  }
}

emergencyPopulate();