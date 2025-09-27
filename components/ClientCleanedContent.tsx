'use client';

import { useEffect, useRef } from 'react';
import { cleanWordPressContent } from '@/lib/wp';

interface ClientCleanedContentProps {
  content: string;
  className?: string;
}

export default function ClientCleanedContent({ content, className = '' }: ClientCleanedContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && content) {
      // Clean the content on the client side after hydration
      const cleanedContent = cleanWordPressContent(content);
      contentRef.current.innerHTML = cleanedContent;
    }
  }, [content]);

  return (
    <div
      ref={contentRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
      suppressHydrationWarning
    />
  );
}