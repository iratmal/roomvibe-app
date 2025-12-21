staging
/**
 * Clone Production User Data to Staging
 * 
 * This script clones a specific user and all their related data from
 * production database to staging database.
 * 
 * SECURITY GUARDS:
 * - STAGING_ENVIRONMENT must be "true"
 * - ALLOW_PROD_TO_STAGING_CLONE must be "true"
 * - DATABASE_URL_PRODUCTION must be set
 * - DATABASE_URL must be set
 * - DATABASE_URL_PRODUCTION !== DATABASE_URL (exact string match)
 * 
 * Usage: npx tsx scripts/cloneProdToStaging.ts <email>
 */

import pg from "pg";

const { Pool } = pg;

// ============= CONFIGURATION =============
const TARGET_EMAIL = process.argv[2];

if (!TARGET_EMAIL) {
  console.error("❌ Usage: npx tsx scripts/cloneProdToStaging.ts <email>");
  process.exit(1);
}

// ============= SECURITY GUARDS =============

function runSecurityChecks(): void {
  console.log("\n🔒 Running security checks...\n");

  // Guard 1: STAGING_ENVIRONMENT
  if (process.env.STAGING_ENVIRONMENT !== "true") {
    console.error("❌ FATAL: STAGING_ENVIRONMENT is not 'true'");
    console.error("   This script can only run in staging environment.");
    process.exit(1);
  }
  console.log("✅ STAGING_ENVIRONMENT = true");

  // Guard 2: ALLOW_PROD_TO_STAGING_CLONE
  if (process.env.ALLOW_PROD_TO_STAGING_CLONE !== "true") {
    console.error("❌ FATAL: ALLOW_PROD_TO_STAGING_CLONE is not 'true'");
    console.error("   Set this env var temporarily to allow cloning.");
    process.exit(1);
  }
  console.log("✅ ALLOW_PROD_TO_STAGING_CLONE = true");

  // Guard 3: DATABASE_URL_PRODUCTION must be set
  if (!process.env.DATABASE_URL_PRODUCTION) {
    console.error("❌ FATAL: DATABASE_URL_PRODUCTION is not set");
    console.error("   Set this to your production database connection string.");
    process.exit(1);
  }
  console.log("✅ DATABASE_URL_PRODUCTION is set");

  // Guard 4: DATABASE_URL must be set
  if (!process.env.DATABASE_URL) {
    console.error("❌ FATAL: DATABASE_URL (staging) is not set");
    process.exit(1);
  }
  console.log("✅ DATABASE_URL (staging) is set");

  // Guard 5: URLs must be different
  if (process.env.DATABASE_URL_PRODUCTION === process.env.DATABASE_URL) {
    console.error("❌ FATAL: DATABASE_URL_PRODUCTION === DATABASE_URL");
    console.error("   Source and target databases cannot be the same!");
    process.exit(1);
  }
  console.log("✅ Source and target URLs are different");

  console.log("\n🔓 All security checks passed!\n");
}

// ============= DATABASE CONNECTIONS =============

function createPools() {
  const sourcePool = new Pool({
    connectionString: process.env.DATABASE_URL_PRODUCTION,
  });

  const targetPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return { sourcePool, targetPool };
}

// ============= SCHEMA INITIALIZATION =============

async function initializeTargetSchema(pool: pg.Pool): Promise<void> {
  console.log("\n📊 Ensuring target database schema exists...");

  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      email_confirmed BOOLEAN DEFAULT FALSE,
      confirmation_token VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      subscription_status VARCHAR(20) DEFAULT 'free',
      subscription_plan VARCHAR(20) DEFAULT 'user',
      stripe_customer_id VARCHAR(255),
      stripe_subscription_id VARCHAR(255),
      is_admin BOOLEAN DEFAULT FALSE,
      artist_access BOOLEAN DEFAULT FALSE,
      designer_access BOOLEAN DEFAULT FALSE,
      gallery_access BOOLEAN DEFAULT FALSE,
      widget_token VARCHAR(64) UNIQUE,
      onboarding_completed BOOLEAN DEFAULT FALSE
    );
  `);

  // Create artworks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS artworks (
      id SERIAL PRIMARY KEY,
      artist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      image_url TEXT NOT NULL,
      width DECIMAL(10, 2) NOT NULL,
      height DECIMAL(10, 2) NOT NULL,
      price_amount DECIMAL(10, 2),
      buy_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      price_currency VARCHAR(3) DEFAULT 'EUR',
      dimension_unit VARCHAR(2) DEFAULT 'cm'
    );
  `);

  // Create projects table
  await pool.query(`
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

  // Create room_images table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS room_images (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      image_data TEXT,
      label VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create gallery_collections table
  await pool.query(`
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

  // Create gallery_artworks table
  await pool.query(`
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
      image_data TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create pdf_exports table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pdf_exports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      export_month VARCHAR(7) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("   ✅ Schema initialized");
}

// ============= ID MAPPING =============

interface IdMaps {
  userId: Map<number, number>;
  artworkId: Map<number, number>;
  projectId: Map<number, number>;
  roomImageId: Map<number, number>;
  collectionId: Map<number, number>;
  galleryArtworkId: Map<number, number>;
}

// ============= CLONE FUNCTIONS =============

async function cloneUser(
  sourcePool: pg.Pool,
  targetPool: pg.Pool,
  email: string,
  idMaps: IdMaps
): Promise<number | null> {
  console.log(`\n👤 Cloning user: ${email}`);

  // Get user from source
  const sourceResult = await sourcePool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (sourceResult.rows.length === 0) {
    console.error(`❌ User not found in production: ${email}`);
    return null;
  }

  const user = sourceResult.rows[0];
  const oldId = user.id;

  // Check if user already exists in target
  const existingResult = await targetPool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingResult.rows.length > 0) {
    const existingId = existingResult.rows[0].id;
    console.log(`   ℹ️  User already exists in staging with id=${existingId}, updating...`);
    
    // Update existing user
    await targetPool.query(
      `UPDATE users SET 
        password_hash = $1,
        role = $2,
        email_confirmed = $3,
        confirmation_token = $4,
        subscription_status = $5,
        subscription_plan = $6,
        stripe_customer_id = $7,
        stripe_subscription_id = $8,
        is_admin = $9,
        artist_access = $10,
        designer_access = $11,
        gallery_access = $12,
        widget_token = $13,
        onboarding_completed = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = $15`,
      [
        user.password_hash,
        user.role,
        user.email_confirmed,
        user.confirmation_token,
        user.subscription_status,
        user.subscription_plan,
        null, // Don't copy stripe IDs to staging
        null,
        user.is_admin,
        user.artist_access,
        user.designer_access,
        user.gallery_access,
        user.widget_token,
        user.onboarding_completed,
        email
      ]
    );
    
    idMaps.userId.set(oldId, existingId);
    console.log(`   ✅ User updated (prod id=${oldId} → staging id=${existingId})`);
    return existingId;
  }

  // Insert new user
  const insertResult = await targetPool.query(
    `INSERT INTO users (
      email, password_hash, role, email_confirmed, confirmation_token,
      subscription_status, subscription_plan, stripe_customer_id, stripe_subscription_id,
      is_admin, artist_access, designer_access, gallery_access, widget_token, onboarding_completed,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id`,
    [
      user.email,
      user.password_hash,
      user.role,
      user.email_confirmed,
      user.confirmation_token,
      user.subscription_status,
      user.subscription_plan,
      null, // Don't copy stripe IDs to staging
      null,
      user.is_admin,
      user.artist_access,
      user.designer_access,
      user.gallery_access,
      user.widget_token,
      user.onboarding_completed,
      user.created_at,
      user.updated_at
    ]
  );

  const newId = insertResult.rows[0].id;
  idMaps.userId.set(oldId, newId);
  console.log(`   ✅ User created (prod id=${oldId} → staging id=${newId})`);
  return newId;
}

async function cloneArtworks(
  sourcePool: pg.Pool,
  targetPool: pg.Pool,
  oldUserId: number,
  newUserId: number,
  idMaps: IdMaps
): Promise<void> {
  console.log(`\n🎨 Cloning artworks for user id=${oldUserId}...`);

  const sourceResult = await sourcePool.query(
    "SELECT * FROM artworks WHERE artist_id = $1",
    [oldUserId]
  );

  if (sourceResult.rows.length === 0) {
    console.log("   ℹ️  No artworks found");
    return;
  }

  // Delete existing artworks for this user in staging
  await targetPool.query("DELETE FROM artworks WHERE artist_id = $1", [newUserId]);

  for (const artwork of sourceResult.rows) {
    const oldId = artwork.id;

    const insertResult = await targetPool.query(
      `INSERT INTO artworks (
        artist_id, title, image_url, width, height, price_amount, buy_url,
        price_currency, dimension_unit, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        newUserId,
        artwork.title,
        artwork.image_url,
        artwork.width,
        artwork.height,
        artwork.price_amount,
        artwork.buy_url,
        artwork.price_currency,
        artwork.dimension_unit,
        artwork.created_at,
        artwork.updated_at
      ]
    );

    const newId = insertResult.rows[0].id;
    idMaps.artworkId.set(oldId, newId);
  }

  console.log(`   ✅ Cloned ${sourceResult.rows.length} artworks`);
}

async function cloneProjects(
  sourcePool: pg.Pool,
  targetPool: pg.Pool,
  oldUserId: number,
  newUserId: number,
  idMaps: IdMaps
): Promise<void> {
  console.log(`\n🏠 Cloning projects for user id=${oldUserId}...`);

  const sourceResult = await sourcePool.query(
    "SELECT * FROM projects WHERE designer_id = $1",
    [oldUserId]
  );

  if (sourceResult.rows.length === 0) {
    console.log("   ℹ️  No projects found");
    return;
  }

  // Get existing project IDs to delete their room_images first
  const existingProjects = await targetPool.query(
    "SELECT id FROM projects WHERE designer_id = $1",
    [newUserId]
  );
  
  for (const proj of existingProjects.rows) {
    await targetPool.query("DELETE FROM room_images WHERE project_id = $1", [proj.id]);
  }
  await targetPool.query("DELETE FROM projects WHERE designer_id = $1", [newUserId]);

  for (const project of sourceResult.rows) {
    const oldId = project.id;

    const insertResult = await targetPool.query(
      `INSERT INTO projects (
        designer_id, title, client_name, room_type, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        newUserId,
        project.title,
        project.client_name,
        project.room_type,
        project.notes,
        project.created_at,
        project.updated_at
      ]
    );

    const newId = insertResult.rows[0].id;
    idMaps.projectId.set(oldId, newId);
  }

  console.log(`   ✅ Cloned ${sourceResult.rows.length} projects`);
}

async function cloneRoomImages(
  sourcePool: pg.Pool,
  targetPool: pg.Pool,
  idMaps: IdMaps
): Promise<void> {
  console.log(`\n🖼️  Cloning room images...`);

  let totalCloned = 0;

  for (const [oldProjectId, newProjectId] of idMaps.projectId) {
    const sourceResult = await sourcePool.query(
      "SELECT * FROM room_images WHERE project_id = $1",
      [oldProjectId]
    );

    for (const roomImage of sourceResult.rows) {
      const oldId = roomImage.id;

      const insertResult = await targetPool.query(
        `INSERT INTO room_images (
          project_id, image_url, image_data, label, created_at
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [
          newProjectId,
          roomImage.image_url,
          roomImage.image_data,
          roomImage.label,
          roomImage.created_at
        ]
      );

      const newId = insertResult.rows[0].id;
      idMaps.roomImageId.set(oldId, newId);
      totalCloned++;
    }
  }

  console.log(`   ✅ Cloned ${totalCloned} room images`);
}

async function cloneGalleryCollections(
  sourcePool: pg.Pool,
  targetPool: pg.Pool,
  oldUserId: number,
  newUserId: number,
  idMaps: IdMaps
): Promise<void> {
  console.log(`\n📚 Cloning gallery collections for user id=${oldUserId}...`);

  const sourceResult = await sourcePool.query(
    "SELECT * FROM gallery_collections WHERE gallery_id = $1",
    [oldUserId]
  );

  if (sourceResult.rows.length === 0) {
    console.log("   ℹ️  No gallery collections found");
    return;
  }

  // Get existing collection IDs to delete their gallery_artworks first
  const existingCollections = await targetPool.query(
    "SELECT id FROM gallery_collections WHERE gallery_id = $1",
    [newUserId]
  );
  
  for (const col of existingCollections.rows) {
    await targetPool.query("DELETE FROM gallery_artworks WHERE collection_id = $1", [col.id]);
  }
  await targetPool.query("DELETE FROM gallery_collections WHERE gallery_id = $1", [newUserId]);

  for (const collection of sourceResult.rows) {
    const oldId = collection.id;

    const insertResult = await targetPool.query(
      `INSERT INTO gallery_collections (
        gallery_id, title, subtitle, description, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        newUserId,
        collection.title,
        collection.subtitle,
        collection.description,
        collection.status,
        collection.created_at,
        collection.updated_at
      ]
    );

    const newId = insertResult.rows[0].id;
    idMaps.collectionId.set(oldId, newId);
  }

  console.log(`   ✅ Cloned ${sourceResult.rows.length} gallery collections`);
}

async function cloneGalleryArtworks(
  sourcePool: pg.Pool,
  targetPool: pg.Pool,
  idMaps: IdMaps
): Promise<void> {
  console.log(`\n🖼️  Cloning gallery artworks...`);

  let totalCloned = 0;

  for (const [oldCollectionId, newCollectionId] of idMaps.collectionId) {
    const sourceResult = await sourcePool.query(
      "SELECT * FROM gallery_artworks WHERE collection_id = $1",
      [oldCollectionId]
    );

    for (const artwork of sourceResult.rows) {
      const oldId = artwork.id;

      const insertResult = await targetPool.query(
        `INSERT INTO gallery_artworks (
          collection_id, title, artist_name, image_url, width_value, height_value,
          dimension_unit, price_amount, price_currency, buy_url, image_data, description,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id`,
        [
          newCollectionId,
          artwork.title,
          artwork.artist_name,
          artwork.image_url,
          artwork.width_value,
          artwork.height_value,
          artwork.dimension_unit,
          artwork.price_amount,
          artwork.price_currency,
          artwork.buy_url,
          artwork.image_data,
          artwork.description,

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const TARGET_EMAIL = 'irena.ratkovicmalbasa@gmail.com';

function validateEnvironment(): { prodUrl: string; stagingUrl: string } {
  console.log('='.repeat(60));
  console.log('PRODUCTION → STAGING DATA CLONE');
  console.log('='.repeat(60));
  console.log('');

  if (process.env.STAGING_ENVIRONMENT !== 'true') {
    console.error('❌ FATAL: STAGING_ENVIRONMENT must be "true"');
    console.error('   This script can ONLY run from the staging environment.');
    process.exit(1);
  }

  if (process.env.ALLOW_PROD_TO_STAGING_CLONE !== 'true') {
    console.error('❌ FATAL: ALLOW_PROD_TO_STAGING_CLONE must be "true"');
    console.error('   Add this env var temporarily to allow the clone.');
    process.exit(1);
  }

  const prodUrl = process.env.DATABASE_URL_PRODUCTION;
  const stagingUrl = process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL;

  if (!prodUrl) {
    console.error('❌ FATAL: DATABASE_URL_PRODUCTION is required');
    console.error('   Set this to your production Neon database URL.');
    process.exit(1);
  }

  if (!stagingUrl) {
    console.error('❌ FATAL: DATABASE_URL_STAGING or DATABASE_URL is required');
    console.error('   Set this to your staging database URL.');
    process.exit(1);
  }

  if (prodUrl === stagingUrl) {
    console.error('❌ FATAL: Production and staging URLs are the same!');
    console.error('   This would corrupt production data. Aborting.');
    process.exit(1);
  }

  const prodHost = new URL(prodUrl).host;
  const stagingHost = new URL(stagingUrl).host;

  console.log(`✓ Production DB: ${prodHost}`);
  console.log(`✓ Staging DB: ${stagingHost}`);
  console.log(`✓ Target user: ${TARGET_EMAIL}`);
  console.log('');

  return { prodUrl, stagingUrl };
}

async function cloneUserData() {
  const { prodUrl, stagingUrl } = validateEnvironment();

  const prodPool = new Pool({ connectionString: prodUrl });
  const stagingPool = new Pool({ connectionString: stagingUrl });

  try {
    console.log('Connecting to databases...');
    
    await prodPool.query('SELECT 1');
    console.log('✓ Connected to PRODUCTION');
    
    await stagingPool.query('SELECT 1');
    console.log('✓ Connected to STAGING');
    console.log('');

    const userResult = await prodPool.query(
      'SELECT * FROM users WHERE email = $1',
      [TARGET_EMAIL]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ User not found in production: ${TARGET_EMAIL}`);
      process.exit(1);
    }

    const prodUser = userResult.rows[0];
    console.log(`Found user: ${prodUser.email} (ID: ${prodUser.id})`);
    console.log(`  Role: ${prodUser.role}`);
    console.log(`  Plan: ${prodUser.subscription_plan}`);
    console.log('');

    const existingUser = await stagingPool.query(
      'SELECT id FROM users WHERE email = $1',
      [TARGET_EMAIL]
    );

    let stagingUserId: number;

    if (existingUser.rows.length > 0) {
      stagingUserId = existingUser.rows[0].id;
      console.log(`⚠️  User already exists in staging (ID: ${stagingUserId})`);
      console.log('   Updating user data and cleaning old related records...');
      
      await stagingPool.query('DELETE FROM pdf_exports WHERE user_id = $1', [stagingUserId]);
      await stagingPool.query('DELETE FROM room_images WHERE project_id IN (SELECT id FROM projects WHERE designer_id = $1)', [stagingUserId]);
      await stagingPool.query('DELETE FROM projects WHERE designer_id = $1', [stagingUserId]);
      await stagingPool.query('DELETE FROM artworks WHERE artist_id = $1', [stagingUserId]);
      await stagingPool.query('DELETE FROM gallery_artworks WHERE collection_id IN (SELECT id FROM gallery_collections WHERE gallery_id = $1)', [stagingUserId]);
      await stagingPool.query('DELETE FROM gallery_collections WHERE gallery_id = $1', [stagingUserId]);
      
      await stagingPool.query(
        `UPDATE users SET
          password_hash = $1,
          role = $2,
          email_confirmed = $3,
          subscription_status = $4,
          subscription_plan = $5,
          is_admin = $6,
          artist_access = $7,
          designer_access = $8,
          gallery_access = $9,
          widget_token = $10,
          onboarding_completed = $11,
          updated_at = NOW()
        WHERE id = $12`,
        [
          prodUser.password_hash,
          prodUser.role,
          prodUser.email_confirmed,
          prodUser.subscription_status,
          prodUser.subscription_plan,
          prodUser.is_admin,
          prodUser.artist_access,
          prodUser.designer_access,
          prodUser.gallery_access,
          prodUser.widget_token,
          prodUser.onboarding_completed,
          stagingUserId
        ]
      );
      console.log('✓ User updated in staging');
    } else {
      const insertResult = await stagingPool.query(
        `INSERT INTO users (
          email, password_hash, role, email_confirmed, confirmation_token,
          subscription_status, subscription_plan, stripe_customer_id, stripe_subscription_id,
          is_admin, artist_access, designer_access, gallery_access, widget_token, onboarding_completed,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id`,
        [
          prodUser.email,
          prodUser.password_hash,
          prodUser.role,
          prodUser.email_confirmed,
          prodUser.confirmation_token,
          prodUser.subscription_status,
          prodUser.subscription_plan,
          null,
          null,
          prodUser.is_admin,
          prodUser.artist_access,
          prodUser.designer_access,
          prodUser.gallery_access,
          prodUser.widget_token,
          prodUser.onboarding_completed,
          prodUser.created_at,
          prodUser.updated_at
        ]
      );
      stagingUserId = insertResult.rows[0].id;
      console.log(`✓ User created in staging (new ID: ${stagingUserId})`);
    }

    console.log('');
    console.log('Copying artworks...');
    const artworksResult = await prodPool.query(
      'SELECT * FROM artworks WHERE artist_id = $1',
      [prodUser.id]
    );
    
    const artworkIdMap = new Map<number, number>();
    for (const artwork of artworksResult.rows) {
      const insertResult = await stagingPool.query(
        `INSERT INTO artworks (
          artist_id, title, image_url, width, height, price_amount, buy_url,
          price_currency, dimension_unit, image_data, tags, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [
          stagingUserId,
          artwork.title,
          artwork.image_url,
          artwork.width,
          artwork.height,
          artwork.price_amount,
          artwork.buy_url,
          artwork.price_currency,
          artwork.dimension_unit,
          artwork.image_data,
          artwork.tags,
main
          artwork.created_at,
          artwork.updated_at
        ]
      );
staging

      const newId = insertResult.rows[0].id;
      idMaps.galleryArtworkId.set(oldId, newId);
      totalCloned++;
    }
  }

  console.log(`   ✅ Cloned ${totalCloned} gallery artworks`);
}

async function clonePdfExports(
  sourcePool: pg.Pool,
  targetPool: pg.Pool,
  oldUserId: number,
  newUserId: number
): Promise<void> {
  console.log(`\n📄 Cloning PDF exports for user id=${oldUserId}...`);

  const sourceResult = await sourcePool.query(
    "SELECT * FROM pdf_exports WHERE user_id = $1",
    [oldUserId]
  );

  if (sourceResult.rows.length === 0) {
    console.log("   ℹ️  No PDF exports found");
    return;
  }

  // Delete existing and re-insert
  await targetPool.query("DELETE FROM pdf_exports WHERE user_id = $1", [newUserId]);

  for (const pdfExport of sourceResult.rows) {
    await targetPool.query(
      `INSERT INTO pdf_exports (user_id, export_month, created_at)
       VALUES ($1, $2, $3)`,
      [newUserId, pdfExport.export_month, pdfExport.created_at]
    );
  }

  console.log(`   ✅ Cloned ${sourceResult.rows.length} PDF exports`);
}

//  MAIN 

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("   RoomVibe: Clone Production User to Staging");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`\n📧 Target user: ${TARGET_EMAIL}`);

  // Run security checks
  runSecurityChecks();

  // Create database connections
  const { sourcePool, targetPool } = createPools();

  // Initialize ID maps
  const idMaps: IdMaps = {
    userId: new Map(),
    artworkId: new Map(),
    projectId: new Map(),
    roomImageId: new Map(),
    collectionId: new Map(),
    galleryArtworkId: new Map(),
  };

  try {
    // Test connections
    console.log("🔌 Testing database connections...");
    await sourcePool.query("SELECT 1");
    console.log("   ✅ Connected to production database");
    await targetPool.query("SELECT 1");
    console.log("   ✅ Connected to staging database");

    // Initialize schema on target
    await initializeTargetSchema(targetPool);

    // Get source user ID
    const sourceUserResult = await sourcePool.query(
      "SELECT id FROM users WHERE email = $1",
      [TARGET_EMAIL]
    );

    if (sourceUserResult.rows.length === 0) {
      console.error(`\n❌ User not found in production: ${TARGET_EMAIL}`);
      process.exit(1);
    }

    const oldUserId = sourceUserResult.rows[0].id;

    // Clone user
    const newUserId = await cloneUser(sourcePool, targetPool, TARGET_EMAIL, idMaps);
    
    if (newUserId === null) {
      process.exit(1);
    }

    // Clone related data
    await cloneArtworks(sourcePool, targetPool, oldUserId, newUserId, idMaps);
    await cloneProjects(sourcePool, targetPool, oldUserId, newUserId, idMaps);
    await cloneRoomImages(sourcePool, targetPool, idMaps);
    await cloneGalleryCollections(sourcePool, targetPool, oldUserId, newUserId, idMaps);
    await cloneGalleryArtworks(sourcePool, targetPool, idMaps);
    await clonePdfExports(sourcePool, targetPool, oldUserId, newUserId);

    // Summary
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("   ✅ CLONE COMPLETED SUCCESSFULLY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`\n📊 Summary:`);
    console.log(`   • User: ${TARGET_EMAIL}`);
    console.log(`   • Artworks: ${idMaps.artworkId.size}`);
    console.log(`   • Projects: ${idMaps.projectId.size}`);
    console.log(`   • Room Images: ${idMaps.roomImageId.size}`);
    console.log(`   • Gallery Collections: ${idMaps.collectionId.size}`);
    console.log(`   • Gallery Artworks: ${idMaps.galleryArtworkId.size}`);
    console.log(`\n🔑 User can now login with their production credentials.`);
    console.log(`\n⚠️  CLEANUP REMINDER:`);
    console.log(`   1. Remove ALLOW_PROD_TO_STAGING_CLONE from Secrets`);
    console.log(`   2. Remove DATABASE_URL_PRODUCTION from Secrets`);

  } catch (error) {
    console.error("\n❌ Clone failed:", error);
    process.exit(1);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

main();

      artworkIdMap.set(artwork.id, insertResult.rows[0].id);
    }
    console.log(`✓ Copied ${artworksResult.rows.length} artworks`);

    console.log('Copying projects...');
    const projectsResult = await prodPool.query(
      'SELECT * FROM projects WHERE designer_id = $1',
      [prodUser.id]
    );
    
    const projectIdMap = new Map<number, number>();
    for (const project of projectsResult.rows) {
      const insertResult = await stagingPool.query(
        `INSERT INTO projects (
          designer_id, title, client_name, room_type, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          stagingUserId,
          project.title,
          project.client_name,
          project.room_type,
          project.notes,
          project.created_at,
          project.updated_at
        ]
      );
      projectIdMap.set(project.id, insertResult.rows[0].id);
    }
    console.log(`✓ Copied ${projectsResult.rows.length} projects`);

    console.log('Copying room images...');
    let roomImageCount = 0;
    for (const [prodProjectId, stagingProjectId] of projectIdMap) {
      const roomImagesResult = await prodPool.query(
        'SELECT * FROM room_images WHERE project_id = $1',
        [prodProjectId]
      );
      
      for (const roomImage of roomImagesResult.rows) {
        await stagingPool.query(
          `INSERT INTO room_images (
            project_id, image_url, label, image_data, created_at
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            stagingProjectId,
            roomImage.image_url,
            roomImage.label,
            roomImage.image_data,
            roomImage.created_at
          ]
        );
        roomImageCount++;
      }
    }
    console.log(`✓ Copied ${roomImageCount} room images`);

    console.log('Copying gallery collections...');
    const collectionsResult = await prodPool.query(
      'SELECT * FROM gallery_collections WHERE gallery_id = $1',
      [prodUser.id]
    );
    
    const collectionIdMap = new Map<number, number>();
    for (const collection of collectionsResult.rows) {
      const insertResult = await stagingPool.query(
        `INSERT INTO gallery_collections (
          gallery_id, title, subtitle, description, status,
          scene_data, scene_360_data, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          stagingUserId,
          collection.title,
          collection.subtitle,
          collection.description,
          collection.status,
          collection.scene_data,
          collection.scene_360_data,
          collection.created_at,
          collection.updated_at
        ]
      );
      collectionIdMap.set(collection.id, insertResult.rows[0].id);
    }
    console.log(`✓ Copied ${collectionsResult.rows.length} gallery collections`);

    console.log('Copying gallery artworks...');
    let galleryArtworkCount = 0;
    for (const [prodCollectionId, stagingCollectionId] of collectionIdMap) {
      const galleryArtworksResult = await prodPool.query(
        'SELECT * FROM gallery_artworks WHERE collection_id = $1',
        [prodCollectionId]
      );
      
      for (const artwork of galleryArtworksResult.rows) {
        await stagingPool.query(
          `INSERT INTO gallery_artworks (
            collection_id, title, artist_name, image_url,
            width_value, height_value, dimension_unit,
            price_amount, price_currency, buy_url, image_data, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            stagingCollectionId,
            artwork.title,
            artwork.artist_name,
            artwork.image_url,
            artwork.width_value,
            artwork.height_value,
            artwork.dimension_unit,
            artwork.price_amount,
            artwork.price_currency,
            artwork.buy_url,
            artwork.image_data,
            artwork.description,
            artwork.created_at
          ]
        );
        galleryArtworkCount++;
      }
    }
    console.log(`✓ Copied ${galleryArtworkCount} gallery artworks`);

    console.log('');
    console.log('='.repeat(60));
    console.log('CLONE COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('Summary:');
    console.log(`  User: ${TARGET_EMAIL}`);
    console.log(`  Staging user ID: ${stagingUserId}`);
    console.log(`  Artworks: ${artworksResult.rows.length}`);
    console.log(`  Projects: ${projectsResult.rows.length}`);
    console.log(`  Room images: ${roomImageCount}`);
    console.log(`  Collections: ${collectionsResult.rows.length}`);
    console.log(`  Gallery artworks: ${galleryArtworkCount}`);
    console.log('');
    console.log('✅ You can now log in to staging with your production password.');
    console.log('');
    console.log('⚠️  IMPORTANT: Remove ALLOW_PROD_TO_STAGING_CLONE from env vars');
    console.log('    to prevent accidental re-runs.');
    console.log('');

  } catch (error) {
    console.error('❌ Clone failed:', error);
    process.exit(1);
  } finally {
    await prodPool.end();
    await stagingPool.end();
  }
}

cloneUserData();
main
