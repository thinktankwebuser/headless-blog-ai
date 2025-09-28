-- Blog Search Functions Migration
-- Semantic search functions with corrected similarity math

-- Main blog search function with fixed similarity calculation
CREATE OR REPLACE FUNCTION match_blog_posts(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    post_id UUID,
    slug TEXT,
    title TEXT,
    content TEXT,
    similarity FLOAT,
    chunk_index INTEGER,
    published_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS post_id,
        p.slug,
        p.title,
        c.content,
        (1 - (c.embedding <=> query_embedding)) AS similarity,
        c.chunk_index,
        p.published_at
    FROM wp_posts p
    JOIN wp_post_chunks c ON p.id = c.post_id
    WHERE
        p.status = 'publish'
        AND p.deleted_at IS NULL
        AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
    ORDER BY similarity DESC, p.published_at DESC
    LIMIT match_count;
END;
$$;

-- Function to get post summaries (best chunk per post)
CREATE OR REPLACE FUNCTION match_blog_posts_summary(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    post_id UUID,
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    best_content TEXT,
    max_similarity FLOAT,
    published_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_chunks AS (
        SELECT
            p.id AS post_id,
            p.slug,
            p.title,
            p.excerpt,
            c.content,
            (1 - (c.embedding <=> query_embedding)) AS similarity,
            p.published_at,
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
    ORDER BY rc.similarity DESC, rc.published_at DESC
    LIMIT match_count;
END;
$$;

-- Function to search by keywords (fallback for non-semantic search)
CREATE OR REPLACE FUNCTION search_blog_posts_keyword(
    search_terms TEXT,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    post_id UUID,
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    content TEXT,
    rank REAL,
    published_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS post_id,
        p.slug,
        p.title,
        p.excerpt,
        c.content,
        ts_rank(
            to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(c.content, '')),
            plainto_tsquery('english', search_terms)
        ) AS rank,
        p.published_at
    FROM wp_posts p
    JOIN wp_post_chunks c ON p.id = c.post_id
    WHERE
        p.status = 'publish'
        AND p.deleted_at IS NULL
        AND (
            to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(c.content, ''))
            @@ plainto_tsquery('english', search_terms)
        )
    ORDER BY rank DESC, p.published_at DESC
    LIMIT match_count;
END;
$$;

-- Utility function to get post statistics
CREATE OR REPLACE FUNCTION get_blog_stats()
RETURNS TABLE (
    total_posts BIGINT,
    published_posts BIGINT,
    total_chunks BIGINT,
    avg_chunks_per_post NUMERIC,
    latest_post_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS total_posts,
        COUNT(*) FILTER (WHERE status = 'publish' AND deleted_at IS NULL) AS published_posts,
        (SELECT COUNT(*) FROM wp_post_chunks) AS total_chunks,
        ROUND(
            (SELECT COUNT(*)::NUMERIC FROM wp_post_chunks) /
            NULLIF(COUNT(*) FILTER (WHERE status = 'publish' AND deleted_at IS NULL), 0),
            2
        ) AS avg_chunks_per_post,
        MAX(published_at) FILTER (WHERE status = 'publish' AND deleted_at IS NULL) AS latest_post_date
    FROM wp_posts;
END;
$$;

-- Grant execute permissions to appropriate roles
GRANT EXECUTE ON FUNCTION match_blog_posts TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_blog_posts_summary TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_blog_posts_keyword TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_blog_stats TO anon, authenticated, service_role;

-- Comments for documentation
COMMENT ON FUNCTION match_blog_posts IS 'Semantic search returning all matching chunks with similarity scores';
COMMENT ON FUNCTION match_blog_posts_summary IS 'Semantic search returning best chunk per post (post-level results)';
COMMENT ON FUNCTION search_blog_posts_keyword IS 'Keyword-based search using PostgreSQL full-text search';
COMMENT ON FUNCTION get_blog_stats IS 'Returns statistics about blog posts and chunks';