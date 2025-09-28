import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/wp';

export interface PostCardProps {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText?: string;
    };
  };
  className?: string;
}

export default function PostCard({
  slug,
  title,
  date,
  excerpt,
  featuredImage,
  className = ""
}: PostCardProps) {
  return (
    <article className={`post-card ${className}`}>
      <div className="post-card-image">
        {featuredImage ? (
          <Image
            src={featuredImage.node.sourceUrl}
            alt={featuredImage.node.altText || title}
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
          {formatDate(date)}
        </div>

        <h3 className="post-card-title">
          <Link href={`/blog/${slug}`}>
            {title}
          </Link>
        </h3>

        {excerpt && (
          <div
            className="post-card-excerpt"
            dangerouslySetInnerHTML={{ __html: excerpt }}
          />
        )}

        <div className="post-card-footer">
          <Link href={`/blog/${slug}`} className="post-card-link">
            Read More
          </Link>
          <div className="post-card-share">
            <span className="share-label">Share this:</span>
            <div className="share-icons">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://localhost:3000/blog/${slug}`)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-icon twitter"
                aria-label="Share on X"
              >
                𝕏
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://localhost:3000/blog/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-icon facebook"
                aria-label="Share on Facebook"
              >
                f
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://localhost:3000/blog/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-icon linkedin"
                aria-label="Share on LinkedIn"
              >
                in
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this article: https://localhost:3000/blog/${slug}`)}`}
                className="share-icon email"
                aria-label="Share via Email"
              >
                @
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}