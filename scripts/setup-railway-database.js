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

    // Create demo organization and services
    console.log('\nCreating demo data...');
    
    // Create demo organization
    const orgResult = await client.query(`
      INSERT INTO organizations (id, name, description, organization_type, data_source)
      VALUES (uuid_generate_v4(), 'Queensland Youth Services Demo', 'Demo organization for testing', 'government', 'manual')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    if (orgResult.rows.length > 0) {
      const orgId = orgResult.rows[0].id;

      // Create demo services
      const services = [
        {
          name: 'Youth Legal Aid',
          description: 'Free legal assistance for young people aged 10-25 facing court proceedings',
          categories: ['legal_aid', 'court_support', 'advocacy'],
          keywords: ['legal', 'court', 'lawyer', 'advocacy', 'rights'],
          min_age: 10,
          max_age: 25
        },
        {
          name: 'Family Counseling Services',
          description: 'Counseling and support services for families affected by youth justice issues',
          categories: ['family_support', 'mental_health'],
          keywords: ['counseling', 'family', 'therapy', 'support', 'mediation'],
          min_age: 0,
          max_age: 25
        },
        {
          name: 'Education and Training Programs',
          description: 'Alternative education and vocational training for at-risk youth',
          categories: ['education_training', 'prevention'],
          keywords: ['education', 'training', 'skills', 'employment', 'school'],
          min_age: 12,
          max_age: 24
        }
      ];

      for (const service of services) {
        const serviceResult = await client.query(`
          INSERT INTO services (id, organization_id, name, description, categories, keywords, minimum_age, maximum_age, youth_specific, data_source)
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, true, 'manual')
          RETURNING id
        `, [orgId, service.name, service.description, service.categories, service.keywords, service.min_age, service.max_age]);

        const serviceId = serviceResult.rows[0].id;

        // Add location for each service
        await client.query(`
          INSERT INTO locations (id, service_id, name, address_1, city, postal_code, region, latitude, longitude)
          VALUES (uuid_generate_v4(), $1, $2, $3, 'Brisbane', '4000', 'brisbane', -27.4698, 153.0251)
        `, [serviceId, `${service.name} Office`, '123 Demo Street']);

        // Add contact
        await client.query(`
          INSERT INTO contacts (id, service_id, name, phone, email)
          VALUES (uuid_generate_v4(), $1, 'Demo Contact', $2, $3)
        `, [serviceId, JSON.stringify(['(07) 3000 1234']), 'demo@youthservices.qld.gov.au']);
      }

      console.log('✅ Demo data created');
    }

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