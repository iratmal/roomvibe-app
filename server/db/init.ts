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

    // Add entitlement columns for multi-role access
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'artist_access'
        ) THEN
          ALTER TABLE users ADD COLUMN artist_access BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'designer_access'
        ) THEN
          ALTER TABLE users ADD COLUMN designer_access BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'gallery_access'
        ) THEN
          ALTER TABLE users ADD COLUMN gallery_access BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // Backfill entitlements from existing subscription_plan for existing users
    await query(`
      UPDATE users SET 
        artist_access = CASE 
          WHEN subscription_plan IN ('artist', 'designer', 'gallery') AND subscription_status IN ('active', 'free') THEN TRUE
          WHEN role = 'artist' AND subscription_status = 'free' THEN TRUE
          ELSE COALESCE(artist_access, FALSE)
        END,
        designer_access = CASE 
          WHEN subscription_plan IN ('designer', 'gallery') AND subscription_status IN ('active', 'free') THEN TRUE
          WHEN role = 'designer' AND subscription_status = 'free' THEN TRUE
          ELSE COALESCE(designer_access, FALSE)
        END,
        gallery_access = CASE 
          WHEN subscription_plan = 'gallery' AND subscription_status IN ('active', 'free') THEN TRUE
          WHEN role = 'gallery' AND subscription_status = 'free' THEN TRUE
          ELSE COALESCE(gallery_access, FALSE)
        END
      WHERE artist_access IS NULL OR designer_access IS NULL OR gallery_access IS NULL
        OR (subscription_status = 'active' AND subscription_plan IS NOT NULL);
    `);

    // Admins get all access
    await query(`
      UPDATE users SET 
        artist_access = TRUE,
        designer_access = TRUE,
        gallery_access = TRUE
      WHERE is_admin = TRUE;
    `);

    // Add widget_token column for unified widget system
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'widget_token'
        ) THEN
          ALTER TABLE users ADD COLUMN widget_token VARCHAR(64) UNIQUE;
        END IF;
      END $$;
    `);

    // Create index for widget token lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_widget_token ON users(widget_token);
    `);

    // Add onboarding_completed column for first-time user onboarding wizard
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'onboarding_completed'
        ) THEN
          ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // =====================================================
    // Artist Connect Core - Artist Profile v2 fields
    // =====================================================
    
    // display_name - Artist's public display name
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'display_name'
        ) THEN
          ALTER TABLE users ADD COLUMN display_name VARCHAR(255);
        END IF;
      END $$;
    `);

    // location_city - Artist's city
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'location_city'
        ) THEN
          ALTER TABLE users ADD COLUMN location_city VARCHAR(100);
        END IF;
      END $$;
    `);

    // location_country - Artist's country
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'location_country'
        ) THEN
          ALTER TABLE users ADD COLUMN location_country VARCHAR(100);
        END IF;
      END $$;
    `);

    // bio - Artist's biography
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'bio'
        ) THEN
          ALTER TABLE users ADD COLUMN bio TEXT;
        END IF;
      END $$;
    `);

    // primary_style_tags - Multi-select array of style tags (JSONB)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'primary_style_tags'
        ) THEN
          ALTER TABLE users ADD COLUMN primary_style_tags JSONB DEFAULT '[]'::jsonb;
        END IF;
      END $$;
    `);

    // primary_medium - Artist's primary medium
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'primary_medium'
        ) THEN
          ALTER TABLE users ADD COLUMN primary_medium VARCHAR(100);
        END IF;
      END $$;
    `);

    // profile_image_url - Artist's profile image
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'profile_image_url'
        ) THEN
          ALTER TABLE users ADD COLUMN profile_image_url TEXT;
        END IF;
      END $$;
    `);

    // website_url - Artist's website
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'website_url'
        ) THEN
          ALTER TABLE users ADD COLUMN website_url TEXT;
        END IF;
      END $$;
    `);

    // instagram_url - Artist's Instagram
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'instagram_url'
        ) THEN
          ALTER TABLE users ADD COLUMN instagram_url TEXT;
        END IF;
      END $$;
    `);

    // languages - Array of languages artist speaks (JSONB)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'languages'
        ) THEN
          ALTER TABLE users ADD COLUMN languages JSONB DEFAULT '[]'::jsonb;
        END IF;
      END $$;
    `);

    // visible_to_designers - Toggle for Designer visibility in Artist Connect
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'visible_to_designers'
        ) THEN
          ALTER TABLE users ADD COLUMN visible_to_designers BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // visible_to_galleries - Toggle for Gallery visibility in Artist Connect
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'visible_to_galleries'
        ) THEN
          ALTER TABLE users ADD COLUMN visible_to_galleries BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // =====================================================
    // GDPR Consent Fields - Terms of Service & Marketing
    // =====================================================

    // tos_accepted_at - When Terms of Service was accepted
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'tos_accepted_at'
        ) THEN
          ALTER TABLE users ADD COLUMN tos_accepted_at TIMESTAMP;
        END IF;
      END $$;
    `);

    // privacy_accepted_at - When Privacy Policy was accepted
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'privacy_accepted_at'
        ) THEN
          ALTER TABLE users ADD COLUMN privacy_accepted_at TIMESTAMP;
        END IF;
      END $$;
    `);

    // tos_version - Version of ToS accepted (e.g., 2025-12-13)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'tos_version'
        ) THEN
          ALTER TABLE users ADD COLUMN tos_version VARCHAR(20);
        END IF;
      END $$;
    `);

    // marketing_opt_in - Whether user opted in to marketing emails
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'marketing_opt_in'
        ) THEN
          ALTER TABLE users ADD COLUMN marketing_opt_in BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // marketing_opt_in_at - When marketing opt-in was given
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'marketing_opt_in_at'
        ) THEN
          ALTER TABLE users ADD COLUMN marketing_opt_in_at TIMESTAMP;
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

    // =====================================================
    // Artist Connect Core - Artwork Connect metadata fields
    // =====================================================

    // orientation - artwork orientation (portrait/landscape/square)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'orientation'
        ) THEN
          ALTER TABLE artworks ADD COLUMN orientation VARCHAR(20);
        END IF;
      END $$;
    `);

    // style_tags - multi-select style tags for the artwork (JSONB array)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'style_tags'
        ) THEN
          ALTER TABLE artworks ADD COLUMN style_tags JSONB DEFAULT '[]'::jsonb;
        END IF;
      END $$;
    `);

    // dominant_colors - 1-3 dominant colors in the artwork (JSONB array)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'dominant_colors'
        ) THEN
          ALTER TABLE artworks ADD COLUMN dominant_colors JSONB DEFAULT '[]'::jsonb;
        END IF;
      END $$;
    `);

    // medium - artwork medium (e.g., oil on canvas, acrylic, etc.)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'medium'
        ) THEN
          ALTER TABLE artworks ADD COLUMN medium VARCHAR(100);
        END IF;
      END $$;
    `);

    // availability - artwork availability status (available/sold/on_request)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'artworks' AND column_name = 'availability'
        ) THEN
          ALTER TABLE artworks ADD COLUMN availability VARCHAR(20) DEFAULT 'available';
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

    // Add description column to gallery_artworks for artwork info panel
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'gallery_artworks' AND column_name = 'description'
        ) THEN
          ALTER TABLE gallery_artworks ADD COLUMN description TEXT;
        END IF;
      END $$;
    `);

    // =====================================================
    // Artist Connect Core - User profile images table
    // =====================================================
    await query(`
      CREATE TABLE IF NOT EXISTS user_profile_images (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        image_data TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // =====================================================
    // Artist Connect Core - Messages/Inbox table
    // =====================================================
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_role VARCHAR(20) NOT NULL,
        artwork_id INTEGER REFERENCES artworks(id) ON DELETE SET NULL,
        project_name VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    `);

    // PDF export tracking table for monthly limits
    await query(`
      CREATE TABLE IF NOT EXISTS pdf_exports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        export_month VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_pdf_exports_user_month ON pdf_exports(user_id, export_month);
    `);

    console.log('✅ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
