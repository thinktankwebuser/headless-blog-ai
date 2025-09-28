import Link from 'next/link';
import { fetchPostsWithFeatured } from '@/lib/wp';
import PostCard from '@/components/PostCard';
import FeaturedPostCard from '@/components/FeaturedPostCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Austin Puthur James - Digital Innovation Leader',
  description: 'Product & Solutions Leader specializing in Money Movements, Applied AI in Fintech, and Payments Optimisation. Insights on digital transformation and breakthrough ideas.',
};

export default async function HomePage() {
  const posts = await fetchPostsWithFeatured(4);
  return (
    <div>
      {/* Featured Post Section */}
      {posts.length > 0 && (
        <section className="space-48">
          <div className="container">
            <FeaturedPostCard
              slug={posts[0].slug}
              content={posts[0].content}
              featuredImage={posts[0].featuredImage}
            />
          </div>
        </section>
      )}

      {/* Latest Insights Section */}
      {posts.length === 1 ? (
        <section className="space-48">
          <div className="container">
            <h2>Latest Insights</h2>
            <p>More insights coming soon. Check back for our latest posts on technology, innovation, and digital transformation.</p>
            <Link href="/blog" className="btn btn-cta btn-icon">
              Browse All Posts →
            </Link>
          </div>
        </section>
      ) : posts.length > 1 && (
        <section className="space-48">
          <div className="container">
            <h2>Latest Insights</h2>
            <div className="post-grid" style={{ marginBottom: '32px' }}>
              {posts.slice(1).map((post) => (
                <PostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  excerpt={post.excerpt}
                  featuredImage={post.featuredImage}
                />
              ))}
            </div>

            <Link href="/blog" className="btn btn-cta btn-icon">
              Browse All Posts →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}