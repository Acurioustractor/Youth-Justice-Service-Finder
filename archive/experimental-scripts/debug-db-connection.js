#!/usr/bin/env node
/**
 * Debug database connection and working-search issues
 */

import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// Use Railway database URL from environment
const RAILWAY_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:ArQYLfNfYNFxzAPKmoORqfTxYhnZxXCh@trolley.proxy.rlwy.net:52530/railway';

console.log('🔗 Connecting to:', RAILWAY_DB_URL.replace(/:[^:]*@/, ':***@'));

const db = knex({
  client: 'postgresql',
  connection: RAILWAY_DB_URL,
  pool: {
    min: 1,
    max: 3
  }
});

async function debugDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await db.raw('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    // Check if services table exists
    console.log('\n📋 Checking tables...');
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Available tables:', tables.rows.map(t => t.table_name));
    
    // Check services table structure
    if (tables.rows.some(t => t.table_name === 'services')) {
      console.log('\n🏗️ Services table structure:');
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'services'
        ORDER BY ordinal_position
      `);
      console.table(columns.rows);
      
      // Test simple count
      console.log('\n📊 Testing service count...');
      const count = await db('services').count('* as total');
      console.log('Total services:', count[0].total);
      
      // Test simple select with status filter
      console.log('\n🔍 Testing working-search query...');
      try {
        const services = await db('services')
          .select('*')
          .where('status', 'active')
          .limit(2);
        
        console.log('✅ Working-search query successful');
        console.log('Sample service keys:', Object.keys(services[0] || {}));
        console.log('Sample service:', services[0] ? {
          id: services[0].id,
          name: services[0].name,
          status: services[0].status
        } : 'No services found');
        
      } catch (queryError) {
        console.error('❌ Working-search query failed:', queryError.message);
        
        // Try without status filter
        console.log('\nTrying without status filter...');
        const servicesNoFilter = await db('services').select('*').limit(2);
        console.log('Services without filter:', servicesNoFilter.length);
        if (servicesNoFilter.length > 0) {
          console.log('Sample service status values:', servicesNoFilter.map(s => s.status));
        }
      }
      
    } else {
      console.error('❌ Services table not found!');
    }
    
  } catch (error) {
    console.error('💥 Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
  }
}

debugDatabase().catch(console.error);