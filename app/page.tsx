import Link from 'next/link';
import Image from 'next/image';
import { fetchPosts, formatDate } from '@/lib/wp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Austin Puthur James - Digital Innovation Leader',
  description: 'Product & Solutions Leader specializing in Money Movements, Applied AI in Fintech, and Payments Optimisation. Insights on digital transformation and breakthrough ideas.',
};

export default async function HomePage() {
  const posts = await fetchPosts(4);
  return (
    <div>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-image">
              <Image
                src="/hero-placeholder.png"
                alt="Thinking in CAPITAL"
                width={600}
                height={400}
                style={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover'
                }}
                priority
              />
            </div>
            <div className="hero-text">
              <h1>Thinking in CAPITAL</h1>
              <p>Discover insights, trends, and breakthrough ideas that are shaping tomorrow's digital landscape. Stay ahead with expert analysis and forward-thinking perspectives.</p>
              <Link href="/blog" className="btn btn-cta btn-lg">
                VIEW POSTS
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-48">
        <div className="container">
          <h2>Latest Insights</h2>
          <p>Explore our latest blog posts covering technology, innovation, and digital transformation.</p>

          {posts.length > 0 && (
            <div className="post-grid" style={{ marginBottom: '32px' }}>
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

                    <h3 className="post-card-title">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>

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
          )}

          <Link href="/blog" className="btn btn-outline btn-icon">
            Browse All Posts →
          </Link>
        </div>
      </section>
    </div>
  );
}