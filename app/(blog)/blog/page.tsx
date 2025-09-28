import Link from 'next/link';
import Image from 'next/image';
import { fetchPosts, formatDate } from '@/lib/wp';

export const revalidate = 300; // 5 minutes ISR

export default async function BlogPage() {
  const allPosts = await fetchPosts(10);
  // Filter out the featured post to avoid duplication
  const posts = allPosts.filter(post => post.slug !== 'thinking-in-capital');

  if (posts.length === 0) {
    return (
      <div>
        <h1 className="blog-title">Blog</h1>
        <p>No posts found. Please check your WordPress GraphQL endpoint configuration.</p>
      </div>
    );
  }

  return (
    <div>
      <header className="blog-header">
        <h1 className="blog-title">Latest Insights</h1>
      </header>

      <div className="post-grid">
        {posts.map((post) => (
          <article key={post.slug} className="post-card">
            <div className="post-card-image">
              {post.featuredImage ? (
                <Image
                  src={post.featuredImage.node.sourceUrl}
                  alt={post.featuredImage.node.altText || post.title}
                  width={400}
                  height={240}
                  style={{
                    width: '100%',
                    height: '240px',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div className="post-card-placeholder">
                  <span>No Image</span>
                </div>
              )}
            </div>

            <div className="post-card-content">
              <div className="post-card-meta">
                {formatDate(post.date)}
              </div>

              <h2 className="post-card-title">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>

              {post.excerpt && (
                <div
                  className="post-card-excerpt"
                  dangerouslySetInnerHTML={{ __html: post.excerpt }}
                />
              )}

              <div className="post-card-footer">
                <Link href={`/blog/${post.slug}`} className="post-card-link">
                  Read More
                </Link>
                <div className="post-card-share">
                  <span className="share-label">Share this:</span>
                  <div className="share-icons">
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://localhost:3000/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="share-icon twitter" aria-label="Share on X">
                      𝕏
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://localhost:3000/blog/${post.slug}`)}`} target="_blank" rel="noopener noreferrer" className="share-icon facebook" aria-label="Share on Facebook">
                      f
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://localhost:3000/blog/${post.slug}`)}`} target="_blank" rel="noopener noreferrer" className="share-icon linkedin" aria-label="Share on LinkedIn">
                      in
                    </a>
                    <a href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`Check out this article: https://localhost:3000/blog/${post.slug}`)}`} className="share-icon email" aria-label="Share via Email">
                      @
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}