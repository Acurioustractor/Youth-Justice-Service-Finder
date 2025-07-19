#!/usr/bin/env node

// Direct import of collected services
import db from './src/config/database.js';
import fs from 'fs';

console.log('📊 DIRECT DATABASE IMPORT');

async function directImport() {
  try {
    // Ensure services table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address_line_1 VARCHAR(255),
        suburb VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(10),
        postcode VARCHAR(10),
        phone_primary VARCHAR(50),
        email_primary VARCHAR(255),
        website VARCHAR(255),
        categories JSON,
        youth_specific BOOLEAN DEFAULT FALSE,
        indigenous_specific BOOLEAN DEFAULT FALSE,
        organization_name VARCHAR(255),
        organization_type VARCHAR(100),
        data_source VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_state (state),
        INDEX idx_suburb (suburb),
        INDEX idx_youth (youth_specific),
        INDEX idx_source (data_source)
      )
    `);

    console.log('✅ Services table ready');

    // Find service files
    const files = fs.readdirSync('.').filter(f => 
      f.includes('Australian-Services') && f.endsWith('.json')
    );

    if (files.length === 0) {
      console.log('❌ No service files found to import');
      return { imported: 0, total: 0 };
    }

    console.log(`📁 Found ${files.length} service files`);

    let totalImported = 0;
    let duplicatesSkipped = 0;

    for (const file of files) {
      console.log(`\n📋 Processing ${file}...`);
      
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const services = data.services || [];
      
      console.log(`   📊 Found ${services.length} services`);

      for (const service of services) {
        try {
          // Check if service already exists
          const existing = await db.query(
            'SELECT id FROM services WHERE name = ? AND suburb = ?',
            [service.name, service.location?.suburb || '']
          );

          if (existing.length > 0) {
            duplicatesSkipped++;
            continue;
          }

          // Insert service
          await db.query(`
            INSERT INTO services (
              id, name, description, address_line_1, suburb, city, state, postcode,
              phone_primary, email_primary, website, categories, 
              youth_specific, indigenous_specific, organization_name, 
              organization_type, data_source, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            service.id,
            service.name,
            service.description || '',
            service.location?.address_line_1 || '',
            service.location?.suburb || '',
            service.location?.city || '',
            service.location?.state || '',
            service.location?.postcode || '',
            service.contact?.phone?.primary || '',
            service.contact?.email?.primary || '',
            service.contact?.website || '',
            JSON.stringify(service.categories || []),
            service.youth_specific ? 1 : 0,
            service.indigenous_specific ? 1 : 0,
            service.organization?.name || '',
            service.organization?.type || '',
            service.data_source?.source_name || '',
            service.status || 'active',
            new Date(),
            new Date()
          ]);

          totalImported++;

        } catch (error) {
          console.log(`   ❌ Error importing "${service.name}": ${error.message}`);
        }
      }

      console.log(`   ✅ Processed ${file}`);
    }

    // Get final statistics
    const totalCount = await db.query('SELECT COUNT(*) as count FROM services');
    const youthCount = await db.query('SELECT COUNT(*) as count FROM services WHERE youth_specific = 1');
    const stateBreakdown = await db.query(`
      SELECT state, COUNT(*) as count 
      FROM services 
      WHERE state IS NOT NULL AND state != '' 
      GROUP BY state 
      ORDER BY count DESC
    `);
    const sourceBreakdown = await db.query(`
      SELECT data_source, COUNT(*) as count 
      FROM services 
      WHERE data_source IS NOT NULL AND data_source != '' 
      GROUP BY data_source 
      ORDER BY count DESC
    `);

    console.log('\n🎉 IMPORT COMPLETE!');
    console.log(`✅ Imported: ${totalImported} new services`);
    console.log(`⏭️  Skipped duplicates: ${duplicatesSkipped}`);
    console.log(`📊 Total in database: ${totalCount[0]?.count || 0}`);
    console.log(`👥 Youth-specific: ${youthCount[0]?.count || 0}`);

    console.log('\n🗺️ Services by State:');
    for (const row of stateBreakdown) {
      console.log(`   ${row.state}: ${row.count} services`);
    }

    console.log('\n📡 Services by Source:');
    for (const row of sourceBreakdown) {
      console.log(`   ${row.data_source}: ${row.count} services`);
    }

    return {
      imported: totalImported,
      duplicates: duplicatesSkipped,
      total_in_db: totalCount[0]?.count || 0,
      youth_services: youthCount[0]?.count || 0
    };

  } catch (error) {
    console.error('💥 Import failed:', error.message);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  directImport()
    .then(results => {
      console.log(`\n🚀 Database ready with ${results.total_in_db} services!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Failed:', error.message);
      process.exit(1);
    });
}

export default directImport;