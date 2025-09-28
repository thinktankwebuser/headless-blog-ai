import Image from 'next/image';
import { notFound } from 'next/navigation';
import { fetchPostBySlug, formatDate, cleanWordPressContent } from '@/lib/wp';
import { processBlogContent } from '@/lib/blog-processor';
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

  // Process content for enhanced sections and anchor links
  const processedContent = processBlogContent(post.content || '', slug);

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
            dangerouslySetInnerHTML={{
              __html: processedContent.contentWithAnchors || cleanWordPressContent(post.content || '')
            }}
          />
        }
        // Enhanced Phase 2 data
        sections={processedContent.sections}
        readingTime={processedContent.readingTime}
        wordCount={processedContent.wordCount}
      />

      <ShareButtons slug={slug} title={post.title} />
    </article>
  );
}