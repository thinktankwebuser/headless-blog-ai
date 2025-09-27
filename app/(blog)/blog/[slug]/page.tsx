import Image from 'next/image';
import { notFound } from 'next/navigation';
import { fetchPostBySlug, formatDate, cleanWordPressContent } from '@/lib/wp';
import ShareButtons from '@/components/ShareButtons';
import BlogAIContent from './BlogAIContent';

export const revalidate = 300; // 5 minutes ISR

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <header className="post-header">
        <h1 className="post-detail-title">{post.title}</h1>
        <div className="post-detail-meta">
          {formatDate(post.date)}
        </div>
      </header>

      {post.featuredImage && (
        <div className="post-detail-featured-image">
          <Image
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || post.title}
            width={400}
            height={240}
            style={{
              color: 'transparent',
              width: '100%',
              height: '596px',
              objectFit: 'cover',
            }}
            priority
          />
        </div>
      )}

      <BlogAIContent
        postContent={post.content || ''}
        postSlug={slug}
        originalContent={
          <div
            className="post-detail-content"
            dangerouslySetInnerHTML={{ __html: cleanWordPressContent(post.content || '') }}
          />
        }
      />

      <ShareButtons slug={slug} title={post.title} />
    </article>
  );
}