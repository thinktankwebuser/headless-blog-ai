-- Fix API Compatibility for Blog Search Functions
-- This fixes the data type mismatches between the existing functions and API expectations

-- Drop and recreate the match_blog_posts_summary function with correct return types
DROP FUNCTION IF EXISTS match_blog_posts_summary(vector, float, int);

CREATE OR REPLACE FUNCTION match_blog_posts_summary(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    post_id TEXT,           -- Changed from UUID to TEXT
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    best_content TEXT,
    max_similarity FLOAT,
    published_at TEXT       -- Changed from TIMESTAMP to TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_chunks AS (
        SELECT
            p.wp_post_id::TEXT AS post_id,    -- Convert to TEXT and use wp_post_id
            p.slug,
            p.title,
            COALESCE(p.excerpt, '') AS excerpt,
            c.content,
            (1 - (c.embedding <=> query_embedding)) AS similarity,
            p.published_at::TEXT AS published_at,  -- Convert to TEXT
            ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY (1 - (c.embedding <=> query_embedding)) DESC) as rn
        FROM wp_posts p
        JOIN wp_post_chunks c ON p.id = c.post_id
        WHERE
            p.status = 'publish'
            AND p.deleted_at IS NULL
            AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
    )
    SELECT
        rc.post_id,
        rc.slug,
        rc.title,
        rc.excerpt,
        rc.content AS best_content,
        rc.similarity AS max_similarity,
        rc.published_at
    FROM ranked_chunks rc
    WHERE rc.rn = 1
    ORDER BY rc.similarity DESC
    LIMIT match_count;
END;
$$;

-- Also fix the keyword search function to match API expectations
DROP FUNCTION IF EXISTS search_blog_posts_keyword(text, int);

CREATE OR REPLACE FUNCTION search_blog_posts_keyword(
    search_terms TEXT,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    post_id TEXT,           -- Changed from UUID to TEXT
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    content TEXT,
    rank REAL,
    published_at TEXT       -- Changed from TIMESTAMP to TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.wp_post_id::TEXT AS post_id,    -- Convert to TEXT and use wp_post_id
        p.slug,
        p.title,
        COALESCE(p.excerpt, '') AS excerpt,
        STRING_AGG(c.content, ' ' ORDER BY c.chunk_index) AS content,
        ts_rank(
            to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.excerpt, '') || ' ' || STRING_AGG(c.content, ' ' ORDER BY c.chunk_index)),
            plainto_tsquery('english', search_terms)
        ) AS rank,
        p.published_at::TEXT AS published_at  -- Convert to TEXT
    FROM wp_posts p
    LEFT JOIN wp_post_chunks c ON p.id = c.post_id
    WHERE
        p.status = 'publish'
        AND p.deleted_at IS NULL
        AND (
            to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.excerpt, '') || ' ' || COALESCE(STRING_AGG(c.content, ' ' ORDER BY c.chunk_index), ''))
            @@ plainto_tsquery('english', search_terms)
        )
    GROUP BY p.id, p.wp_post_id, p.slug, p.title, p.excerpt, p.published_at
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_blog_posts_summary(vector, float, int) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_blog_posts_keyword(text, int) TO anon, authenticated, service_role;

-- Test that the functions exist and are callable
SELECT 'match_blog_posts_summary function created successfully' AS status
WHERE EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'match_blog_posts_summary'
);

SELECT 'search_blog_posts_keyword function created successfully' AS status
WHERE EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'search_blog_posts_keyword'
);