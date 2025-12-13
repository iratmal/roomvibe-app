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
          artwork.created_at,
          artwork.updated_at
        ]
      );
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
