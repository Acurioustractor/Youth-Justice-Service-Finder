#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables in order: .env.local overrides .env
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const { Client } = pg;

async function setupDatabase() {
  console.log('Setting up database...\n');

  // Create database if it doesn't exist
  const clientConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || 'benknight',
    database: 'postgres' // Connect to default database first
  };
  
  // Only add password if it's actually set and not empty
  const password = process.env.DATABASE_PASSWORD;
  if (password && typeof password === 'string' && password.trim() !== '') {
    clientConfig.password = password;
  }
  
  // Remove any undefined password field to prevent SCRAM issues
  if ('password' in clientConfig && !clientConfig.password) {
    delete clientConfig.password;
  }
  
  const client = new Client(clientConfig);

  try {
    await client.connect();
    
    const dbName = process.env.DATABASE_NAME || 'youth_justice_services';
    
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

    // Now connect to the new database
    const dbClientConfig = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT || 5432,
      user: process.env.DATABASE_USER || 'benknight',
      database: dbName
    };
    
    // Only add password if it's actually set and not empty
    const dbPassword = process.env.DATABASE_PASSWORD;
    if (dbPassword && typeof dbPassword === 'string' && dbPassword.trim() !== '') {
      dbClientConfig.password = dbPassword;
    }
    
    // Remove any undefined password field to prevent SCRAM issues
    if ('password' in dbClientConfig && !dbClientConfig.password) {
      delete dbClientConfig.password;
    }
    
    const dbClient = new Client(dbClientConfig);

    await dbClient.connect();

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
    
    // Execute schema as one block to avoid parsing issues with functions
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
    process.exit(1);
  }
}

// Run setup
setupDatabase();