import { NextRequest, NextResponse } from 'next/server';
import { fetchPosts } from '@/lib/wp';

export async function GET(request: NextRequest) {
  try {
    // Fetch recent blog posts for search context
    const posts = await fetchPosts(8); // Get 8 recent posts for comprehensive context

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        content: 'Austin Puthur James is a digital innovation leader specializing in AI, fintech, payment optimization, and digital transformation.',
        postCount: 0
      });
    }

    // Create comprehensive content summary from all posts
    let aggregatedContent = `Austin Puthur James's Blog - ${posts.length} Recent Posts:\n\n`;

    posts.forEach((post, index) => {
      const cleanTitle = post.title.replace(/<[^>]*>/g, '').trim();
      const cleanExcerpt = post.excerpt
        ? post.excerpt.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : '';
      const cleanContent = post.content
        ? post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500) + '...'
        : '';

      aggregatedContent += `${index + 1}. "${cleanTitle}"\n`;
      aggregatedContent += `Published: ${new Date(post.date).toLocaleDateString()}\n`;

      if (cleanExcerpt) {
        aggregatedContent += `Summary: ${cleanExcerpt}\n`;
      }

      if (cleanContent) {
        aggregatedContent += `Content Preview: ${cleanContent}\n`;
      }

      aggregatedContent += `\n`;
    });

    // Add author expertise summary
    aggregatedContent += `\nAuthor Expertise Areas:
- Digital Innovation & Transformation Leadership
- AI and Machine Learning Applications in Fintech
- Payment Systems Optimization and Modern Channels
- API Integrations and Platform Architecture
- Product Leadership and Engineering Management
- Self-Serve Solutions and Platform Development
- Modern Tech Stacks (Next.js, AWS, Supabase, TypeScript)

Key Topics Covered:
- Payment optimization strategies
- Applied AI in financial services
- Digital transformation methodologies
- Platform engineering best practices
- Team leadership in fast-paced environments`;

    return NextResponse.json({
      content: aggregatedContent,
      postCount: posts.length,
      posts: posts.map(post => ({
        slug: post.slug,
        title: post.title.replace(/<[^>]*>/g, '').trim(),
        date: post.date
      }))
    });

  } catch (error) {
    console.error('Blog search content API error:', error);

    // Return fallback content on error
    return NextResponse.json({
      content: `Austin Puthur James is a digital innovation leader specializing in AI, fintech, payment optimization, and digital transformation. His blog covers modern payment channels, applied AI in financial services, digital transformation strategies, and platform development insights.`,
      postCount: 0,
      error: 'Failed to fetch blog posts, using fallback content'
    });
  }
}