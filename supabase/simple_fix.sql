-- Simple fix: just convert the working function's return types
-- This keeps the working logic but fixes the data type issues

-- Update the existing match_blog_posts_summary to return the right types
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
            p.wp_post_id::TEXT AS post_id,    -- Use wp_post_id and convert to TEXT
            p.slug,
            p.title,
            p.excerpt,
            c.content,
            (1 - (c.embedding <=> query_embedding)) AS similarity,
            p.published_at::TEXT AS published_at,  -- Convert timestamp to TEXT
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
    ORDER BY rc.similarity DESC, rc.published_at::timestamp DESC
    LIMIT match_count;
END;
$$;