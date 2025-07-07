#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

async function setupDatabase() {
  console.log('Setting up database...\n');

  // Create database if it doesn't exist
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres' // Connect to default database first
  });

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
    const dbClient = new Client({
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT || 5432,
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD,
      database: dbName
    });

    await dbClient.connect();

    // Enable extensions
    console.log('\nEnabling PostgreSQL extensions...');
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "postgis"');
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    console.log('Extensions enabled');

    // Run schema
    console.log('\nCreating database schema...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons but ignore those in function definitions
    const statements = schema
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
      .filter(s => s.trim().length > 0);

    for (const statement of statements) {
      try {
        await dbClient.query(statement);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('Schema created successfully');

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