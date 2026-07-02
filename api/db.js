import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const { Pool } = pg;

// Sanitizar posibles comillas en variables de entorno
let connectionString = process.env.POSTGRES || process.env.DATABASE_URL;
if (typeof connectionString === 'string') {
  connectionString = connectionString.replace(/^["']|["']$/g, '').trim();
}

export const pool = new Pool({
  connectionString,
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS faculties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        logo_url TEXT
      );

      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        career VARCHAR(255) NOT NULL,
        modalidad VARCHAR(100) DEFAULT 'Escolarizada',
        faculty_id INTEGER REFERENCES faculties(id) ON DELETE SET NULL,
        courses JSONB NOT NULL DEFAULT '[]'::jsonb,
        electives JSONB DEFAULT '[]'::jsonb,
        min_credits INTEGER,
        max_credits INTEGER,
        UNIQUE(career, modalidad)
      );

      CREATE TABLE IF NOT EXISTS forum_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email_hash VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS forum_pins (
        id SERIAL PRIMARY KEY,
        email_hash VARCHAR(255) UNIQUE NOT NULL,
        pin VARCHAR(20) NOT NULL,
        expires_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS forum_posts (
        id VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        career VARCHAR(255) DEFAULT 'General',
        author VARCHAR(100) NOT NULL,
        email_hash VARCHAR(255) NOT NULL,
        likes INTEGER DEFAULT 0,
        liked_by JSONB DEFAULT '[]'::jsonb,
        comments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}
