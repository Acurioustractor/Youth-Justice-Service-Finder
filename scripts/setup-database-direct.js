#!/usr/bin/env node

// DIRECT APPROACH - NO FANCY UTILITIES, JUST BASIC POSTGRES CONNECTION
import pg from 'pg';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function setupDatabase() {
  console.log('Setting up database with DIRECT approach...\n');

  // SIMPLE, DIRECT CONNECTION - NO ENVIRONMENT VARIABLES BULLSHIT
  const clientConfig = {
    host: 'localhost',
    port: 5432,
    user: 'benknight',
    database: 'postgres'
    // NO PASSWORD FIELD AT ALL - LET POSTGRES USE PEER AUTH
  };

  console.log('Connection config:', clientConfig);

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('✅ Connected to postgres database');
    
    const dbName = 'youth_justice_services';
    
    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log('Database created successfully');
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    await client.end();

    // Connect to the target database
    const dbClientConfig = {
      host: 'localhost',
      port: 5432,
      user: 'benknight',
      database: dbName
      // NO PASSWORD FIELD AT ALL
    };

    const dbClient = new Client(dbClientConfig);
    await dbClient.connect();
    console.log('✅ Connected to youth_justice_services database');

    // Enable extensions
    console.log('\nEnabling PostgreSQL extensions...');
    
    try {
      await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ uuid-ossp extension enabled');
    } catch (error) {
      console.log('⚠️ uuid-ossp extension not available');
    }
    
    try {
      await dbClient.query('CREATE EXTENSION IF NOT EXISTS "postgis"');
      console.log('✅ PostGIS extension enabled');
    } catch (error) {
      console.log('⚠️ PostGIS extension not available (geographic features will be limited)');
    }
    
    try {
      await dbClient.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
      console.log('✅ pg_trgm extension enabled');
    } catch (error) {
      console.log('⚠️ pg_trgm extension not available (fuzzy search will be limited)');
    }
    
    console.log('Extensions setup complete');

    // Run schema
    console.log('\nCreating database schema...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema-clean.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    try {
      await dbClient.query(schema);
      console.log('Schema created successfully');
    } catch (error) {
      console.error('Error creating schema:', error.message);
    }

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
      await dbClient.query(
        `INSERT INTO taxonomy (id, name, youth_justice_category, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $1, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [category]
      );
    }

    console.log('Taxonomy created');
    await dbClient.end();

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now run the scraper with: npm run scrape:demo');

  } catch (error) {
    console.error('Error setting up database:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();