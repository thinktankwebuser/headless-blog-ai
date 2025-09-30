import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/wp';
import ClientOnlyShareButtons from './ClientOnlyShareButtons';

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
          <ClientOnlyShareButtons slug={slug} title={title} />
        </div>
      </div>
    </article>
  );
}