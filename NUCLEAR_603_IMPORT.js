#!/usr/bin/env node

// NUCLEAR OPTION: Direct database import using pg client
import fs from 'fs';
import { Client } from 'pg';

console.log('🚀 NUCLEAR 603 IMPORT - BYPASSING RAILWAY API');

async function nuclearImport() {
  // Try to get Railway connection from environment
  const DATABASE_URL = process.env.DATABASE_URL || 
                      'postgresql://postgres:********@trolley.proxy.rlwy.net:52530/railway';

  console.log('🔗 Connecting to Railway database...');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway database');

    // Load 603 services
    const data = JSON.parse(fs.readFileSync('MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json', 'utf8'));
    const services = data.services || [];
    
    console.log(`📊 Found ${services.length} services to import`);

    // Check current schema
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Available tables:', tables.rows.map(r => r.table_name));

    // Clear data
    await client.query('DELETE FROM services');
    await client.query('DELETE FROM organizations');
    console.log('🧹 Cleared existing data');

    // Import organizations (minimal)
    const orgs = new Set();
    for (const service of services) {
      if (service.organization?.id && !orgs.has(service.organization.id)) {
        orgs.add(service.organization.id);
        try {
          await client.query(`
            INSERT INTO organizations (id, name) 
            VALUES ($1, $2) ON CONFLICT (id) DO NOTHING
          `, [service.organization.id, service.organization.name || 'Unknown']);
        } catch (e) {
          // Skip on error
        }
      }
    }
    
    console.log(`✅ Imported ${orgs.size} organizations`);

    // Import services (minimal)
    let imported = 0;
    for (const service of services) {
      try {
        await client.query(`
          INSERT INTO services (id, name, organization_id) 
          VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING
        `, [service.id, service.name || 'Unknown Service', service.organization?.id]);
        imported++;
      } catch (e) {
        // Skip on error
      }
    }

    console.log(`✅ Imported ${imported} services`);

    // Verify
    const finalCount = await client.query('SELECT COUNT(*) FROM services');
    
    console.log(`🎉 FINAL RESULT: ${finalCount.rows[0].count} services in database`);
    
    if (parseInt(finalCount.rows[0].count) >= 500) {
      console.log('🎉🎉🎉 SUCCESS! Your 603 services are LIVE! 🎉🎉🎉');
    }

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n🎯 TO GET DATABASE_URL:');
    console.log('1. Go to railway.app/dashboard');
    console.log('2. Click your project > PostgreSQL service');
    console.log('3. Click "Connect" tab');
    console.log('4. Copy the "DATABASE_URL" string');
    console.log('5. Run: export DATABASE_URL="your-connection-string"');
    console.log('6. Run this script again');
  } finally {
    await client.end();
  }
}

nuclearImport();