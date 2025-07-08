#!/usr/bin/env node

// Check current database status and available data
import db from './src/config/database.js';
import fs from 'fs';

console.log('📊 CHECKING DATABASE STATUS');

async function checkStatus() {
  try {
    // Check if services table exists
    const tables = await db.query("SHOW TABLES LIKE 'services'");
    
    if (tables.length === 0) {
      console.log('❌ Services table does not exist');
      
      // Create the table
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
      console.log('✅ Created services table');
    } else {
      console.log('✅ Services table exists');
    }

    // Get current counts
    const totalCount = await db.query('SELECT COUNT(*) as count FROM services');
    const youthCount = await db.query('SELECT COUNT(*) as count FROM services WHERE youth_specific = 1');
    const recentCount = await db.query("SELECT COUNT(*) as count FROM services WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)");

    console.log('\n📈 Current Database Status:');
    console.log(`   Total services: ${totalCount[0]?.count || 0}`);
    console.log(`   Youth-specific: ${youthCount[0]?.count || 0}`);
    console.log(`   Added today: ${recentCount[0]?.count || 0}`);

    if (totalCount[0]?.count > 0) {
      // Get state breakdown
      const stateBreakdown = await db.query(`
        SELECT state, COUNT(*) as count 
        FROM services 
        WHERE state IS NOT NULL AND state != '' 
        GROUP BY state 
        ORDER BY count DESC
      `);

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
        LIMIT 10
      `);

      console.log('\n📡 Top Data Sources:');
      for (const row of sourceBreakdown) {
        console.log(`   ${row.data_source}: ${row.count} services`);
      }

      // Sample services
      const sampleServices = await db.query(`
        SELECT name, suburb, state, organization_name, youth_specific 
        FROM services 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      console.log('\n📋 Recent Services Sample:');
      for (const service of sampleServices) {
        const youthFlag = service.youth_specific ? '👥' : '  ';
        console.log(`   ${youthFlag} ${service.name} - ${service.suburb}, ${service.state}`);
      }
    }

    // Check for available import files
    const serviceFiles = fs.readdirSync('.').filter(f => 
      (f.includes('Australian-Services') || f.includes('COMPREHENSIVE')) && f.endsWith('.json')
    );

    console.log('\n📁 Available Data Files:');
    if (serviceFiles.length > 0) {
      for (const file of serviceFiles) {
        try {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          const services = data.services || [];
          console.log(`   📄 ${file}: ${services.length} services`);
        } catch (error) {
          console.log(`   ❌ ${file}: Error reading file`);
        }
      }
      
      if (totalCount[0]?.count === 0 && serviceFiles.length > 0) {
        console.log('\n💡 Tip: Run direct-import.js to import available data files');
      }
    } else {
      console.log('   (No service files found)');
      console.log('\n💡 Tip: Run comprehensive-dataset-generator.js to create sample data');
    }

    return {
      table_exists: tables.length > 0,
      total_services: totalCount[0]?.count || 0,
      youth_services: youthCount[0]?.count || 0,
      recent_services: recentCount[0]?.count || 0,
      available_files: serviceFiles.length
    };

  } catch (error) {
    console.error('💥 Status check failed:', error.message);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkStatus()
    .then(status => {
      console.log('\n🚀 Database status check complete!');
      if (status.total_services > 0) {
        console.log(`✅ Ready for use with ${status.total_services} services`);
      } else {
        console.log('⚠️  Database is empty - import data to get started');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Failed:', error.message);
      process.exit(1);
    });
}

export default checkStatus;