#!/usr/bin/env node

// Import collected Australian services into existing database
import db from './src/config/database.js';
import fs from 'fs';
import glob from 'glob';

console.log('📊 IMPORTING COLLECTED SERVICES TO DATABASE');

async function importToDatabase() {
  try {
    // Find all collected service files
    const serviceFiles = await new Promise((resolve, reject) => {
      glob('*Australian-Services-*.json', (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });

    if (serviceFiles.length === 0) {
      console.log('❌ No service files found to import');
      return;
    }

    console.log(`📁 Found ${serviceFiles.length} service files to import`);

    let totalImported = 0;
    let duplicatesSkipped = 0;
    let errors = 0;

    for (const file of serviceFiles) {
      console.log(`\n📋 Processing ${file}...`);
      
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const services = data.services || [];
        
        console.log(`   📊 Found ${services.length} services in file`);

        for (const service of services) {
          try {
            // Check if service already exists (by name and location)
            const existing = await db.query(
              'SELECT id FROM services WHERE name = ? AND suburb = ?',
              [service.name, service.location?.suburb]
            );

            if (existing.length > 0) {
              duplicatesSkipped++;
              continue;
            }

            // Insert service into database
            await db.query(`
              INSERT INTO services (
                id, name, description, address_line_1, suburb, city, state, postcode,
                phone_primary, email_primary, website, categories, youth_specific,
                organization_name, organization_type, data_source, status,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              service.organization?.name || '',
              service.organization?.type || '',
              service.data_source?.source_name || '',
              service.status || 'active',
              new Date(),
              new Date()
            ]);

            totalImported++;

            if (totalImported % 100 === 0) {
              console.log(`   ✅ Imported ${totalImported} services so far...`);
            }

          } catch (error) {
            errors++;
            if (errors <= 5) { // Only show first 5 errors
              console.log(`   ❌ Error importing service "${service.name}": ${error.message}`);
            }
          }
        }

      } catch (error) {
        console.log(`   💥 Failed to process file ${file}: ${error.message}`);
      }
    }

    // Generate summary
    console.log('\n🎉 IMPORT COMPLETE!');
    console.log(`✅ Successfully imported: ${totalImported} services`);
    console.log(`⏭️  Duplicates skipped: ${duplicatesSkipped}`);
    console.log(`❌ Errors encountered: ${errors}`);

    // Get updated database counts
    const totalCount = await db.query('SELECT COUNT(*) as count FROM services');
    const youthCount = await db.query('SELECT COUNT(*) as count FROM services WHERE youth_specific = 1');
    const stateBreakdown = await db.query(`
      SELECT state, COUNT(*) as count 
      FROM services 
      WHERE state IS NOT NULL AND state != '' 
      GROUP BY state 
      ORDER BY count DESC
    `);

    console.log('\n📊 UPDATED DATABASE STATISTICS:');
    console.log(`   📈 Total services in database: ${totalCount[0]?.count || 0}`);
    console.log(`   👥 Youth-specific services: ${youthCount[0]?.count || 0}`);
    
    console.log('\n🗺️ Services by State:');
    for (const row of stateBreakdown) {
      console.log(`   ${row.state}: ${row.count} services`);
    }

    // Get source breakdown
    const sourceBreakdown = await db.query(`
      SELECT data_source, COUNT(*) as count 
      FROM services 
      WHERE data_source IS NOT NULL AND data_source != '' 
      GROUP BY data_source 
      ORDER BY count DESC
    `);

    console.log('\n📡 Services by Data Source:');
    for (const row of sourceBreakdown) {
      console.log(`   ${row.data_source}: ${row.count} services`);
    }

    return {
      imported: totalImported,
      duplicates: duplicatesSkipped,
      errors: errors,
      total_in_db: totalCount[0]?.count || 0
    };

  } catch (error) {
    console.error('💥 Import failed:', error.message);
    throw error;
  }
}

// Create services table if it doesn't exist
async function ensureTable() {
  try {
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
        organization_name VARCHAR(255),
        organization_type VARCHAR(100),
        data_source VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_state (state),
        INDEX idx_suburb (suburb),
        INDEX idx_youth (youth_specific),
        INDEX idx_source (data_source),
        INDEX idx_name (name),
        FULLTEXT idx_search (name, description)
      )
    `);
    console.log('✅ Services table ready');
  } catch (error) {
    console.log('⚠️ Table creation warning:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ensureTable()
    .then(() => importToDatabase())
    .then(results => {
      console.log(`\n🎊 Database now contains ${results.total_in_db} services!`);
      console.log('🚀 Ready for production use!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Import failed:', error.message);
      process.exit(1);
    });
}

export default importToDatabase;