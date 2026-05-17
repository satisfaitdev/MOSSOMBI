/**
 * Migration script: Convert existing base64 product images to files.
 * 
 * Run from Backend directory:
 *   node src/scripts/migrate_images.js
 * 
 * This script:
 * 1. Loads all agency_articles from Supabase
 * 2. For each product, checks image_url and metadata.media.images
 * 3. If any are base64, converts them to files in uploads/products/
 * 4. Updates the database record with the new file URLs
 */

import { dbAdmin } from '../config/db.js';
import { saveBase64Image, processProductImages } from '../utils/fileStorage.js';

async function migrate() {
  console.log('🔄 Starting image migration...\n');

  const { data: articles, error } = await dbAdmin
    .from('agency_articles')
    .select('id, image_url, metadata')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Failed to load articles:', error.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log('ℹ️  No articles found. Nothing to migrate.');
    process.exit(0);
  }

  console.log(`📦 Found ${articles.length} articles to check.\n`);
  let migratedCount = 0;

  for (const article of articles) {
    let needsUpdate = false;
    const updates = {};

    // 1. Check main image_url
    if (article.image_url && article.image_url.startsWith('data:image/')) {
      const saved = saveBase64Image(article.image_url, 'products');
      if (saved) {
        updates.image_url = saved;
        needsUpdate = true;
        console.log(`  ✅ [${article.id}] Main image → ${saved}`);
      }
    }

    // 2. Check metadata.media.images (gallery)
    const metadata = article.metadata || {};
    const media = metadata.media || {};
    const images = Array.isArray(media.images) ? media.images : [];
    
    const hasBase64Gallery = images.some(img => typeof img === 'string' && img.startsWith('data:image/'));
    
    if (hasBase64Gallery) {
      const processed = processProductImages(images, 'products');
      const newMetadata = {
        ...metadata,
        media: {
          ...media,
          images: processed,
        },
      };
      updates.metadata = newMetadata;
      needsUpdate = true;
      console.log(`  ✅ [${article.id}] Gallery: ${images.length} images → ${processed.length} files`);
    }

    // 3. Update DB if changes were made
    if (needsUpdate) {
      updates.updated_at = new Date().toISOString();
      const { error: updateErr } = await dbAdmin
        .from('agency_articles')
        .update(updates)
        .eq('id', article.id);

      if (updateErr) {
        console.error(`  ❌ [${article.id}] Update failed:`, updateErr.message);
      } else {
        migratedCount++;
      }
    }
  }

  console.log(`\n✨ Migration complete! ${migratedCount}/${articles.length} articles updated.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
