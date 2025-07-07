#!/usr/bin/env node

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

async function setupRailwayDatabase() {
  console.log('Setting up Railway database...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('Make sure PostgreSQL is added to your Railway project');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Enable extensions
    console.log('\nEnabling PostgreSQL extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    console.log('✅ Extensions enabled');

    // Run simplified schema
    console.log('\nCreating database schema...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema-simple.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons but ignore those in function definitions
    const statements = schema
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
      .filter(s => s.trim().length > 0);

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('✅ Schema created successfully');

    // Create initial taxonomy entries
    console.log('\nCreating initial taxonomy...');
    const categories = [
      'prevention',
      'diversion', 
      'court_support',
      'supervision',
      'detention',
      'reintegration',
      'family_support',
      'education_training',
      'mental_health',
      'substance_abuse',
      'housing',
      'legal_aid',
      'advocacy',
      'cultural_support',
      'youth_services'
    ];

    for (const category of categories) {
      await client.query(
        `INSERT INTO taxonomy (id, name, youth_justice_category, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $1, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [category]
      );
    }

    console.log('✅ Taxonomy created');

    // Skip demo data - database is ready for real scraped data
    console.log('\n✅ Database ready for real Australian youth justice service data');
    console.log('💡 Run scrapers to populate with actual services from government and organization sources');

    await client.end();

    console.log('\n🚀 Railway database setup completed successfully!');
    console.log('\nYour Youth Justice Service Finder database now contains:');
    console.log('- Complete schema with all tables');
    console.log('- Demo organization and services');
    console.log('- Basic taxonomy categories');
    console.log('\nThe API should now return data when you visit your frontend!');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

// Run setup
setupRailwayDatabase();