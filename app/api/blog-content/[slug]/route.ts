import { NextRequest, NextResponse } from 'next/server';
import { fetchPostBySlug } from '@/lib/wp';
import { processBlogContent, findRelevantSection, createEnhancedCitation } from '@/lib/blog-processor';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Fetch the post content from WordPress
    const post = await fetchPostBySlug(slug);

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Process content for enhanced citations and deep linking
    const processedContent = processBlogContent(post.content || '', post.slug);

    // Extract clean text content from HTML (fallback for compatibility)
    const cleanContent = post.content
      ? post.content
          .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
          .replace(/\s+/g, ' ')      // Normalize whitespace
          .trim()
      : '';

    return NextResponse.json({
      slug: post.slug,
      title: post.title,
      content: cleanContent,
      excerpt: post.excerpt,
      rawContent: post.content,
      date: post.date,
      // Enhanced Phase 2 features
      sections: processedContent.sections,
      contentWithAnchors: processedContent.contentWithAnchors,
      wordCount: processedContent.wordCount,
      readingTime: processedContent.readingTime,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Blog content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog content' },
      { status: 500 }
    );
  }
}