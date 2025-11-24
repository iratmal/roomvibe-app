import { query } from './database.js';

export async function initializeDatabase() {
  try {
    console.log('📊 Initializing database schema...');

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        email_confirmed BOOLEAN DEFAULT FALSE,
        confirmation_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_confirmation_token ON users(confirmation_token);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS artworks (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        width DECIMAL(10, 2) NOT NULL,
        height DECIMAL(10, 2) NOT NULL,
        price DECIMAL(10, 2),
        buy_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON artworks(artist_id);
    `);

    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'price_currency'
        ) THEN
          ALTER TABLE artworks ADD COLUMN price_currency VARCHAR(3) DEFAULT 'EUR';
        END IF;
      END $$;
    `);

    await query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'price'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'price_amount'
        ) THEN
          ALTER TABLE artworks RENAME COLUMN price TO price_amount;
        END IF;
      END $$;
    `);

    console.log('✅ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
