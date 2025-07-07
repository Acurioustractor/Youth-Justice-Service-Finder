import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL || {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'youth_justice_services',
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './database/seeds'
  }
};

const db = knex(config);

// Test connection
db.raw('SELECT 1')
  .then(() => console.log('Database connected successfully'))
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

export default db;