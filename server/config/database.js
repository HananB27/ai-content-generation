const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

const initializeDatabase = async () => {
  try {
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_generations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        prompt TEXT NOT NULL,
        generated_text TEXT NOT NULL,
        background_music VARCHAR(255),
        background_video VARCHAR(255),
        voiceover_url TEXT,
        video_url TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS connected_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        platform VARCHAR(50) NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        account_id VARCHAR(255),
        account_username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, platform)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS published_videos (
        id SERIAL PRIMARY KEY,
        content_generation_id INTEGER REFERENCES content_generations(id),
        user_id INTEGER REFERENCES users(id),
        platform VARCHAR(50) NOT NULL,
        platform_video_id VARCHAR(255),
        title TEXT,
        description TEXT,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initializeDatabase();

module.exports = pool;
