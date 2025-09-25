import Link from 'next/link';
import Image from 'next/image';
import { fetchPosts, formatDate } from '@/lib/wp';

export const revalidate = 300; // 5 minutes ISR

export default async function BlogPage() {
  const posts = await fetchPosts(10);

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
        <p className="blog-subtitle">Discover breakthrough ideas and expert analysis on digital innovation</p>
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
                  Read More →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}