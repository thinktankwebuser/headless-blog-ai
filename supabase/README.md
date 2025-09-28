# Blog Search Setup Guide

Complete setup guide for implementing semantic blog search with Supabase.

## Phase 1: Supabase Setup (30 minutes)

### 1.1 Create New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project name: `blog-search`
5. Set database password (save this!)
6. Choose region closest to your users
7. Click "Create new project"

### 1.2 Run Database Migrations

Execute these SQL files in order in the Supabase SQL Editor:

1. **001_blog_search_schema.sql** - Creates tables and indexes
2. **002_blog_search_security.sql** - Sets up RLS policies
3. **003_blog_search_functions.sql** - Creates search functions

```sql
-- Execute each migration file in the SQL Editor
-- Check for any errors before proceeding to the next
```

### 1.3 Environment Variables

Add to your `.env.local`:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI for embeddings
OPENAI_API_KEY=sk-...

# WordPress Integration
WORDPRESS_API_URL=https://yourblog.com/wp-json/wp/v2
WEBHOOK_SECRET=your-secure-random-string-here
```

### 1.4 Verify Setup

Test the setup with this SQL query:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('wp_posts', 'wp_post_chunks');

-- Check if functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'match_blog%';
```

## Required Dependencies

Install these packages in your Next.js project:

```bash
npm install @supabase/supabase-js openai gpt-tokenizer
```

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ Public can only read published posts
- ✅ Service role isolated for sync operations
- ✅ Embeddings not exposed in public views
- ✅ Webhook signature verification implemented

## Performance Optimization

After initial data load:

```sql
-- Create vector index (adjust lists based on row count)
-- Rule: lists = √(row_count), minimum 100
CREATE INDEX IF NOT EXISTS idx_wp_chunks_embedding
ON wp_post_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Update statistics
ANALYZE wp_posts;
ANALYZE wp_post_chunks;
```

## Search Functions Available

1. **match_blog_posts()** - Returns all matching chunks
2. **match_blog_posts_summary()** - Returns best chunk per post
3. **search_blog_posts_keyword()** - Keyword fallback search
4. **get_blog_stats()** - Database statistics

## Next Steps

After Supabase setup is complete:

1. **Phase 2**: WordPress webhook configuration
2. **Phase 3**: Next.js API implementation
3. **Phase 4**: Initial data population
4. **Phase 5**: Frontend integration

## Troubleshooting

### Common Issues

**Vector extension not enabled:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**RLS blocking service role:**
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename IN ('wp_posts', 'wp_post_chunks');
```

**Search returning no results:**
```sql
-- Test with lower threshold
SELECT * FROM match_blog_posts_summary('[test_embedding]', 0.1, 5);
```

## Database Schema Overview

```
wp_posts
├── id (UUID, PK)
├── wp_post_id (BIGINT, unique)
├── slug (TEXT, unique)
├── title (TEXT)
├── excerpt (TEXT)
├── content_hash (TEXT)
├── status (TEXT)
├── published_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── deleted_at (TIMESTAMP)
└── created_at (TIMESTAMP)

wp_post_chunks
├── id (UUID, PK)
├── post_id (UUID, FK → wp_posts.id)
├── content (TEXT)
├── chunk_index (INTEGER)
├── tokens (INTEGER)
├── embedding (VECTOR(1536))
└── created_at (TIMESTAMP)
```

This completes Phase 1. Proceed to WordPress configuration once Supabase is ready.