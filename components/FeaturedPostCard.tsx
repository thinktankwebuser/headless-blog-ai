import Link from 'next/link';
import Image from 'next/image';


export interface FeaturedPostCardProps {
  slug: string;
  content?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText?: string;
    };
  };
  className?: string;
}

export default function FeaturedPostCard({
  slug,
  content,
  featuredImage,
  className = ""
}: FeaturedPostCardProps) {
  return (
    <article className={`post-card ${className}`}>
      <div className="post-card-image">
        {featuredImage ? (
          <Image
            src={featuredImage.node.sourceUrl}
            alt={featuredImage.node.altText || 'Featured post image'}
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

        {content && (
          <div
            className="post-detail-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </article>
  );
}