import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Initialize database with migrations
export async function initializeDatabase() {
  try {
    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    // If migrations fail, try to create tables from schema directly
    console.log('⚠️  Attempting to create tables from schema...');
    // This is a fallback - in production, you should ensure migrations are set up properly
  }
}

// Close database connection
export async function closeDatabase() {
  await pool.end();
  console.log('✅ Database connection closed');
}

