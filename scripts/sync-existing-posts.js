#!/usr/bin/env node

/**
 * Bulk Sync Script for Existing WordPress Posts
 *
 * This script fetches all published posts from WordPress REST API
 * and sends them to your Next.js webhook for processing.
 */

const crypto = require('crypto');

// Configuration
const WORDPRESS_API_URL = 'https://thinkingincapital.wpcomstaging.com/wp-json/wp/v2';
const NEXTJS_WEBHOOK_URL = 'https://first-project-nsaygujan-austins-projects-5c6378fa.vercel.app/api/blog-sync';
const WEBHOOK_SECRET = '518e7fddae21242135b37dbba53cf92b3834cbf5a7f149a7e3f6ebfc705d761f';

/**
 * Generate HMAC signature for webhook security
 */
function generateSignature(wpPostId, timestamp) {
  const dataToSign = `${wpPostId}${timestamp}`;
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(dataToSign).digest('hex');
}

/**
 * Send webhook notification for a single post
 */
async function syncPost(post) {
  const timestamp = Math.floor(Date.now() / 1000);

  const payload = {
    action: 'published',
    wp_post_id: post.id,
    slug: post.slug,
    status: post.status,
    timestamp,
    signature: generateSignature(post.id, timestamp),
    post_data: {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      date: post.date,
      date_gmt: post.date_gmt,
      modified: post.modified,
      modified_gmt: post.modified_gmt,
      categories: post.categories || [],
      tags: post.tags || []
    }
  };

  try {
    const response = await fetch(NEXTJS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BulkSyncScript/1.0.0'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Synced: "${post.title.rendered}" (ID: ${post.id})`);
      if (result.chunks_processed) {
        console.log(`   📄 Processed ${result.chunks_processed}/${result.total_chunks} chunks`);
      }
      return { success: true, post: post.title.rendered };
    } else {
      const error = await response.text();
      console.error(`❌ Failed: "${post.title.rendered}" (${response.status}): ${error}`);
      return { success: false, post: post.title.rendered, error };
    }
  } catch (error) {
    console.error(`❌ Error syncing "${post.title.rendered}":`, error.message);
    return { success: false, post: post.title.rendered, error: error.message };
  }
}

/**
 * Fetch all published posts from WordPress
 */
async function fetchAllPosts() {
  console.log('🔍 Fetching posts from WordPress...');

  let allPosts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(`${WORDPRESS_API_URL}/posts?status=publish&per_page=10&page=${page}`);

      if (!response.ok) {
        if (response.status === 400 && page > 1) {
          // Probably no more pages
          hasMore = false;
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const posts = await response.json();

      if (posts.length === 0) {
        hasMore = false;
      } else {
        allPosts = allPosts.concat(posts);
        console.log(`📖 Fetched page ${page}: ${posts.length} posts`);
        page++;
      }
    } catch (error) {
      console.error('❌ Failed to fetch posts:', error.message);
      process.exit(1);
    }
  }

  console.log(`📚 Total posts found: ${allPosts.length}`);
  return allPosts;
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Starting bulk sync of WordPress posts...\n');

  // Fetch all posts
  const posts = await fetchAllPosts();

  if (posts.length === 0) {
    console.log('ℹ️ No posts to sync.');
    return;
  }

  console.log('\n📤 Starting sync process...\n');

  // Sync posts with rate limiting
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];

    console.log(`[${i + 1}/${posts.length}] Syncing: "${post.title.rendered}"`);

    const result = await syncPost(post);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ post: result.post, error: result.error });
    }

    // Rate limiting: Wait 30 seconds between requests
    if (i < posts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  // Summary
  console.log('\n📊 Sync Complete!');
  console.log(`✅ Successfully synced: ${results.success} posts`);
  console.log(`❌ Failed: ${results.failed} posts`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.post}: ${error.error}`);
    });
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}