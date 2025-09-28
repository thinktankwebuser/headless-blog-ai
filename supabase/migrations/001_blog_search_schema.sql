-- Blog Search Schema Migration
-- Phase 1: Supabase Setup for Semantic Blog Search

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Main posts table
CREATE TABLE IF NOT EXISTS wp_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wp_post_id BIGINT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT,
    content_hash TEXT,
    status TEXT DEFAULT 'publish' CHECK (status IN ('publish', 'draft', 'private')),
    published_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chunks table with embeddings
CREATE TABLE IF NOT EXISTS wp_post_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES wp_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    tokens INTEGER,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure chunks are ordered properly per post
    UNIQUE(post_id, chunk_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wp_posts_wp_id ON wp_posts(wp_post_id);
CREATE INDEX IF NOT EXISTS idx_wp_posts_status ON wp_posts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wp_posts_published ON wp_posts(published_at DESC) WHERE status = 'publish' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wp_posts_slug ON wp_posts(slug) WHERE status = 'publish' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wp_chunks_post_id ON wp_post_chunks(post_id);
CREATE INDEX IF NOT EXISTS idx_wp_chunks_embedding ON wp_post_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update timestamps
CREATE TRIGGER update_wp_posts_updated_at
    BEFORE UPDATE ON wp_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE wp_posts IS 'WordPress posts with metadata for semantic search';
COMMENT ON TABLE wp_post_chunks IS 'Text chunks with embeddings for semantic search';
COMMENT ON COLUMN wp_posts.content_hash IS 'SHA256 hash of post content to detect changes';
COMMENT ON COLUMN wp_post_chunks.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';