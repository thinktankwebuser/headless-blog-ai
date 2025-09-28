-- Fix Semantic Search RPC Functions
-- Run this in your Supabase SQL Editor

-- First, ensure the pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS match_blog_posts_summary(vector, float, int);
DROP FUNCTION IF EXISTS search_blog_posts_keyword(text, int);

-- Create the semantic search function that matches your API expectations
CREATE OR REPLACE FUNCTION match_blog_posts_summary(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  post_id text,
  slug text,
  title text,
  excerpt text,
  best_content text,
  max_similarity float,
  published_at text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.wp_post_id::text as post_id,
    p.slug,
    p.title,
    COALESCE(p.excerpt, '') as excerpt,
    COALESCE(c.content, '') as best_content,
    MAX(1 - (c.embedding <=> query_embedding)) as max_similarity,
    p.published_at
  FROM wp_posts p
  LEFT JOIN wp_post_chunks c ON p.id = c.post_id
  WHERE
    p.deleted_at IS NULL
    AND p.status = 'publish'
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  GROUP BY p.id, p.wp_post_id, p.slug, p.title, p.excerpt, p.published_at, c.content
  ORDER BY max_similarity DESC
  LIMIT match_count;
END;
$$;

-- Create the keyword search function
CREATE OR REPLACE FUNCTION search_blog_posts_keyword(
  search_terms text,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  post_id text,
  slug text,
  title text,
  excerpt text,
  content text,
  rank float,
  published_at text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.wp_post_id::text as post_id,
    p.slug,
    p.title,
    COALESCE(p.excerpt, '') as excerpt,
    COALESCE(string_agg(c.content, ' '), '') as content,
    ts_rank(
      to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '') || ' ' || COALESCE(string_agg(c.content, ' '), '')),
      plainto_tsquery('english', search_terms)
    ) as rank,
    p.published_at
  FROM wp_posts p
  LEFT JOIN wp_post_chunks c ON p.id = c.post_id
  WHERE
    p.deleted_at IS NULL
    AND p.status = 'publish'
    AND (
      to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '') || ' ' || COALESCE(string_agg(c.content, ' '), ''))
      @@ plainto_tsquery('english', search_terms)
    )
  GROUP BY p.id, p.wp_post_id, p.slug, p.title, p.excerpt, p.published_at
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION match_blog_posts_summary(vector, float, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_blog_posts_keyword(text, int) TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wp_posts_status_deleted ON wp_posts(status, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wp_post_chunks_embedding ON wp_post_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_wp_posts_fts ON wp_posts USING gin(to_tsvector('english', title || ' ' || COALESCE(excerpt, '')));

-- Verify the functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('match_blog_posts_summary', 'search_blog_posts_keyword');