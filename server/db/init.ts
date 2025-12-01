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
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'subscription_status'
        ) THEN
          ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'free';
        END IF;
      END $$;
    `);

    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'subscription_plan'
        ) THEN
          ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(20) DEFAULT 'user';
        END IF;
      END $$;
    `);

    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
        ) THEN
          ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
        END IF;
      END $$;
    `);

    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'stripe_subscription_id'
        ) THEN
          ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
        END IF;
      END $$;
    `);

    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'is_admin'
        ) THEN
          ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
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

    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'dimension_unit'
        ) THEN
          ALTER TABLE artworks ADD COLUMN dimension_unit VARCHAR(2) DEFAULT 'cm';
        END IF;
      END $$;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        designer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        client_name VARCHAR(255),
        room_type VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_projects_designer_id ON projects(designer_id);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS room_images (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        image_data TEXT,
        label VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_room_images_project_id ON room_images(project_id);
    `);

    // Add image_data column to room_images if it doesn't exist (for existing installations)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'room_images' AND column_name = 'image_data'
        ) THEN
          ALTER TABLE room_images ADD COLUMN image_data TEXT;
        END IF;
      END $$;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS gallery_collections (
        id SERIAL PRIMARY KEY,
        gallery_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_gallery_collections_gallery_id ON gallery_collections(gallery_id);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS gallery_artworks (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES gallery_collections(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        artist_name VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        width_value DECIMAL(10, 2) NOT NULL,
        height_value DECIMAL(10, 2) NOT NULL,
        dimension_unit VARCHAR(2) DEFAULT 'cm',
        price_amount DECIMAL(10, 2),
        price_currency VARCHAR(3) DEFAULT 'EUR',
        buy_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_gallery_artworks_collection_id ON gallery_artworks(collection_id);
    `);

    // Add image_data column to gallery_artworks if it doesn't exist (for base64 storage)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'gallery_artworks' AND column_name = 'image_data'
        ) THEN
          ALTER TABLE gallery_artworks ADD COLUMN image_data TEXT;
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
