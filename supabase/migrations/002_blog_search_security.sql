-- Blog Search Security Migration
-- RLS Policies for secure access to blog data

-- Enable RLS on all tables
ALTER TABLE wp_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_post_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for migration safety)
DROP POLICY IF EXISTS "Public read published posts" ON wp_posts;
DROP POLICY IF EXISTS "Service role full access posts" ON wp_posts;
DROP POLICY IF EXISTS "Service role full access chunks" ON wp_post_chunks;
DROP POLICY IF EXISTS "Public read chunks for published posts" ON wp_post_chunks;

-- POSTS TABLE POLICIES

-- 1. Public can read published, non-deleted posts
CREATE POLICY "Public read published posts"
ON wp_posts FOR SELECT
USING (
    status = 'publish'
    AND deleted_at IS NULL
);

-- 2. Service role has full access for sync operations
CREATE POLICY "Service role full access posts"
ON wp_posts FOR ALL
USING (auth.role() = 'service_role');

-- CHUNKS TABLE POLICIES

-- 1. Public can read chunks only for published posts
CREATE POLICY "Public read chunks for published posts"
ON wp_post_chunks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM wp_posts p
        WHERE p.id = wp_post_chunks.post_id
        AND p.status = 'publish'
        AND p.deleted_at IS NULL
    )
);

-- 2. Service role has full access for embedding operations
CREATE POLICY "Service role full access chunks"
ON wp_post_chunks FOR ALL
USING (auth.role() = 'service_role');

-- Create public view for safe frontend access (no embeddings exposed)
CREATE OR REPLACE VIEW public_blog_posts AS
SELECT
    id,
    wp_post_id,
    slug,
    title,
    excerpt,
    status,
    published_at,
    updated_at
FROM wp_posts
WHERE status = 'publish' AND deleted_at IS NULL
ORDER BY published_at DESC;

-- Grant access to the view
GRANT SELECT ON public_blog_posts TO anon;
GRANT SELECT ON public_blog_posts TO authenticated;

-- Comments for security documentation
COMMENT ON POLICY "Public read published posts" ON wp_posts IS 'Allow public access to published blog posts only';
COMMENT ON POLICY "Public read chunks for published posts" ON wp_post_chunks IS 'Allow public access to chunks only for published posts';
COMMENT ON VIEW public_blog_posts IS 'Safe public view of blog posts without embeddings';