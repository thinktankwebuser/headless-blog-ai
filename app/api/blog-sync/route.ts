/**
 * Blog Sync Webhook Handler
 *
 * Receives webhooks from WordPress when posts are created, updated, or deleted.
 * Processes content changes and updates Supabase embeddings accordingly.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { processBlogPost, generateContentHash } from '@/lib/blog-processor';
import { generateEmbedding } from '@/lib/embedding-service';

export const runtime = 'nodejs';

// Rate limiting (in-memory, resets on restart)
const rateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 5 seconds between requests

interface WebhookPayload {
  action: 'published' | 'updated' | 'deleted' | 'trashed' | 'untrashed' | 'unpublished' | 'status_changed' | 'test';
  wp_post_id: number;
  slug: string;
  status?: string;
  old_status?: string;
  new_status?: string;
  timestamp: number;
  signature: string;
  post_data?: WordPressPost;
  message?: string; // For test webhooks
}

interface WordPressPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  status: string;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  categories?: number[];
  tags?: number[];
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const lastRequest = rateLimit.get(clientIP);
    const now = Date.now();

    if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
      return NextResponse.json(
        { success: false, error: 'Rate limited' },
        { status: 429 }
      );
    }

    rateLimit.set(clientIP, now);

    // Parse webhook payload
    const payload: WebhookPayload = await request.json();

    // Validate required fields
    if (!payload.action || payload.wp_post_id === undefined || !payload.timestamp || !payload.signature) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(payload)) {
      console.warn('Invalid webhook signature:', {
        action: payload.action,
        wp_post_id: payload.wp_post_id,
        timestamp: payload.timestamp
      });
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Log webhook received
    console.log(`[Blog Sync] Webhook received: ${payload.action} for post ${payload.wp_post_id}`);

    // Handle test webhooks
    if (payload.action === 'test') {
      console.log('[Blog Sync] Test webhook received successfully');
      return NextResponse.json({
        success: true,
        message: 'Test webhook received successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Process webhook based on action
    const result = await processWebhook(payload);

    return NextResponse.json({
      success: true,
      action: payload.action,
      wp_post_id: payload.wp_post_id,
      ...result
    });

  } catch (error) {
    console.error('[Blog Sync] Webhook processing error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature using HMAC
 */
function verifyWebhookSignature(payload: WebhookPayload): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Blog Sync] WEBHOOK_SECRET not configured');
    return false;
  }

  const dataToSign = `${payload.wp_post_id}${payload.timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');

  return payload.signature === expectedSignature;
}

/**
 * Process webhook based on action type
 */
async function processWebhook(payload: WebhookPayload) {
  switch (payload.action) {
    case 'published':
    case 'updated':
    case 'untrashed':
      return await handlePostUpsert(payload);

    case 'deleted':
    case 'trashed':
      return await handlePostDeletion(payload);

    case 'unpublished':
    case 'status_changed':
      return await handleStatusChange(payload);

    default:
      console.warn(`[Blog Sync] Unknown action: ${payload.action}`);
      return { message: 'Action processed (no-op)' };
  }
}

/**
 * Handle post creation or update
 */
async function handlePostUpsert(payload: WebhookPayload) {
  if (!payload.post_data) {
    // Fetch post data from WordPress API
    const postData = await fetchPostFromWordPress(payload.wp_post_id);
    if (!postData) {
      throw new Error(`Failed to fetch post data for ID ${payload.wp_post_id}`);
    }
    payload.post_data = postData;
  }

  const { post_data } = payload;

  // Only process published posts
  if (post_data.status !== 'publish') {
    console.log(`[Blog Sync] Skipping non-published post (status: ${post_data.status})`);
    return { message: 'Post not published, skipped' };
  }

  // Check if content has changed (for updates)
  if (payload.action === 'updated') {
    const existingPost = await getExistingPost(payload.wp_post_id);
    if (existingPost) {
      const newContentHash = generateContentHash(post_data.content.rendered);
      if (existingPost.content_hash === newContentHash) {
        console.log(`[Blog Sync] Content unchanged for post ${payload.wp_post_id}, skipping`);
        return { message: 'Content unchanged, skipped' };
      }
    }
  }

  // Process post content
  const processed = processBlogPost(
    post_data.title.rendered,
    post_data.content.rendered,
    post_data.excerpt.rendered
  );

  console.log(`[Blog Sync] Processing ${processed.chunks.length} chunks for post ${payload.wp_post_id}`);

  // Upsert post metadata
  const { data: postRecord, error: postError } = await supabaseAdmin
    .from('wp_posts')
    .upsert({
      wp_post_id: post_data.id,
      slug: post_data.slug,
      title: post_data.title.rendered,
      excerpt: post_data.excerpt.rendered,
      content_hash: processed.contentHash,
      status: post_data.status,
      published_at: post_data.date,
      updated_at: post_data.modified
    }, {
      onConflict: 'wp_post_id'
    })
    .select('id')
    .single();

  if (postError) {
    throw new Error(`Failed to upsert post: ${postError.message}`);
  }

  // Delete existing chunks
  const { error: deleteError } = await supabaseAdmin
    .from('wp_post_chunks')
    .delete()
    .eq('post_id', postRecord.id);

  if (deleteError) {
    console.warn(`[Blog Sync] Failed to delete existing chunks: ${deleteError.message}`);
  }

  // Generate embeddings and store chunks
  const embeddings = [];
  for (let i = 0; i < processed.chunks.length; i++) {
    const chunk = processed.chunks[i];

    try {
      const embeddingResult = await generateEmbedding(chunk.content);

      const { error: insertError } = await supabaseAdmin
        .from('wp_post_chunks')
        .insert({
          post_id: postRecord.id,
          content: chunk.content,
          chunk_index: chunk.index,
          tokens: chunk.tokens,
          embedding: embeddingResult.embedding
        });

      if (insertError) {
        console.error(`[Blog Sync] Failed to insert chunk ${i}:`, insertError.message);
      } else {
        embeddings.push({ index: i, tokens: chunk.tokens });
      }

      // Small delay between embeddings to respect rate limits
      if (i < processed.chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(`[Blog Sync] Failed to generate embedding for chunk ${i}:`, error);
    }
  }

  console.log(`[Blog Sync] Successfully processed ${embeddings.length}/${processed.chunks.length} chunks for post ${payload.wp_post_id}`);

  return {
    message: 'Post processed successfully',
    chunks_processed: embeddings.length,
    total_chunks: processed.chunks.length,
    total_tokens: processed.totalTokens,
    word_count: processed.wordCount
  };
}

/**
 * Handle post deletion
 */
async function handlePostDeletion(payload: WebhookPayload) {
  // Soft delete by setting deleted_at timestamp
  const { error: updateError } = await supabaseAdmin
    .from('wp_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('wp_post_id', payload.wp_post_id);

  if (updateError) {
    console.error(`[Blog Sync] Failed to mark post as deleted:`, updateError.message);
    throw new Error(`Failed to delete post: ${updateError.message}`);
  }

  console.log(`[Blog Sync] Post ${payload.wp_post_id} marked as deleted`);

  return {
    message: 'Post marked as deleted',
    wp_post_id: payload.wp_post_id
  };
}

/**
 * Handle status changes
 */
async function handleStatusChange(payload: WebhookPayload) {
  const { new_status, old_status } = payload;

  // If changing from published to non-published, soft delete
  if (old_status === 'publish' && new_status !== 'publish') {
    return await handlePostDeletion(payload);
  }

  // If changing from non-published to published, treat as upsert
  if (old_status !== 'publish' && new_status === 'publish') {
    return await handlePostUpsert(payload);
  }

  return {
    message: 'Status change processed',
    old_status,
    new_status
  };
}

/**
 * Fetch post data from WordPress REST API
 */
async function fetchPostFromWordPress(postId: number): Promise<WordPressPost | null> {
  const wpApiUrl = process.env.WORDPRESS_API_URL;
  if (!wpApiUrl) {
    throw new Error('WORDPRESS_API_URL not configured');
  }

  try {
    const response = await fetch(`${wpApiUrl}/posts/${postId}`, {
      headers: {
        'User-Agent': 'NextJS-Blog-Sync/1.0.0'
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Blog Sync] Post ${postId} not found in WordPress`);
        return null;
      }
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`[Blog Sync] Failed to fetch post ${postId} from WordPress:`, error);
    throw error;
  }
}

/**
 * Get existing post from Supabase
 */
async function getExistingPost(wpPostId: number) {
  const { data, error } = await supabaseAdmin
    .from('wp_posts')
    .select('content_hash')
    .eq('wp_post_id', wpPostId)
    .eq('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('[Blog Sync] Error fetching existing post:', error);
  }

  return data;
}