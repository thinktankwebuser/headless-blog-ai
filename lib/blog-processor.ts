/**
 * Blog Text Processing Utilities
 *
 * Handles text chunking, cleaning, and content hash generation for blog search.
 * Uses token-aware chunking to ensure proper embedding generation.
 */

import { encode, decode } from 'gpt-tokenizer';
import crypto from 'crypto';

// Configuration constants
export const BLOG_CONFIG = {
  maxTokensPerChunk: 1000,
  chunkOverlap: 100,
  maxContentLength: 50000, // Max characters for a single post
  minChunkLength: 50, // Minimum characters for a valid chunk
} as const;

export interface BlogChunk {
  content: string;
  tokens: number;
  index: number;
}

export interface ProcessedBlogPost {
  chunks: BlogChunk[];
  totalTokens: number;
  contentHash: string;
  wordCount: number;
}

/**
 * Clean HTML content and extract readable text
 */
export function cleanBlogContent(htmlContent: string): string {
  if (!htmlContent) return '';

  let cleaned = htmlContent;

  // Remove HTML tags but keep the content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Clean up whitespace and special characters
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');

  // Remove excessive spacing
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Generate content hash for change detection
 */
export function generateContentHash(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Split text into token-aware chunks with overlap
 */
export function chunkTextByTokens(
  text: string,
  maxTokens: number = BLOG_CONFIG.maxTokensPerChunk,
  overlap: number = BLOG_CONFIG.chunkOverlap
): BlogChunk[] {
  if (!text || text.length < BLOG_CONFIG.minChunkLength) {
    return [];
  }

  // Truncate if too long
  if (text.length > BLOG_CONFIG.maxContentLength) {
    text = text.substring(0, BLOG_CONFIG.maxContentLength) + '...';
  }

  const chunks: BlogChunk[] = [];

  try {
    // Encode the entire text to get tokens
    const allTokens = encode(text);

    if (allTokens.length <= maxTokens) {
      // Text fits in single chunk
      return [{
        content: text,
        tokens: allTokens.length,
        index: 0
      }];
    }

    let startToken = 0;
    let chunkIndex = 0;

    while (startToken < allTokens.length) {
      // Determine end token for this chunk
      const endToken = Math.min(startToken + maxTokens, allTokens.length);

      // Extract tokens for this chunk
      const chunkTokens = allTokens.slice(startToken, endToken);
      const chunkText = decode(chunkTokens);

      // Only add chunk if it has meaningful content
      if (chunkText.trim().length >= BLOG_CONFIG.minChunkLength) {
        chunks.push({
          content: chunkText.trim(),
          tokens: chunkTokens.length,
          index: chunkIndex
        });
        chunkIndex++;
      }

      // Move start position (with overlap)
      if (endToken >= allTokens.length) {
        break; // We've reached the end
      }

      startToken = endToken - overlap;

      // Ensure we make progress even with large overlap
      if (startToken <= (chunks.length > 0 ? encode(chunks[chunks.length - 1].content).length : 0)) {
        startToken = endToken - Math.floor(overlap / 2);
      }
    }

    return chunks;

  } catch (error) {
    console.error('Error chunking text:', error);

    // Fallback to simple text splitting
    return fallbackTextChunking(text, maxTokens);
  }
}

/**
 * Fallback chunking method when token encoding fails
 */
function fallbackTextChunking(text: string, maxTokens: number): BlogChunk[] {
  const chunks: BlogChunk[] = [];

  // Estimate ~4 characters per token (rough approximation)
  const estimatedCharsPerToken = 4;
  const maxCharsPerChunk = maxTokens * estimatedCharsPerToken;

  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // If adding this paragraph would exceed chunk size, start new chunk
    if (currentChunk.length + trimmedParagraph.length > maxCharsPerChunk && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        tokens: Math.ceil(currentChunk.length / estimatedCharsPerToken),
        index: chunkIndex
      });
      chunkIndex++;
      currentChunk = trimmedParagraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
    }
  }

  // Add final chunk
  if (currentChunk.trim().length >= BLOG_CONFIG.minChunkLength) {
    chunks.push({
      content: currentChunk.trim(),
      tokens: Math.ceil(currentChunk.length / estimatedCharsPerToken),
      index: chunkIndex
    });
  }

  return chunks;
}

/**
 * Process blog post content into chunks
 */
export function processBlogPost(
  title: string,
  content: string,
  excerpt?: string
): ProcessedBlogPost {
  // Combine title, excerpt, and content for processing
  const titleText = title ? `# ${title}\n\n` : '';
  const excerptText = excerpt ? `${excerpt}\n\n` : '';
  const cleanContent = cleanBlogContent(content);

  const fullText = titleText + excerptText + cleanContent;

  // Generate chunks
  const chunks = chunkTextByTokens(fullText);

  // Calculate total tokens
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);

  // Generate content hash (excluding title for consistency)
  const contentHash = generateContentHash(cleanContent);

  // Calculate word count
  const wordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;

  return {
    chunks,
    totalTokens,
    contentHash,
    wordCount
  };
}

/**
 * Validate chunk for embedding generation
 */
export function isValidChunk(chunk: BlogChunk): boolean {
  return (
    chunk.content.trim().length >= BLOG_CONFIG.minChunkLength &&
    chunk.tokens > 0 &&
    chunk.tokens <= BLOG_CONFIG.maxTokensPerChunk
  );
}

/**
 * Get processing statistics
 */
export function getProcessingStats(processed: ProcessedBlogPost) {
  return {
    chunkCount: processed.chunks.length,
    totalTokens: processed.totalTokens,
    averageTokensPerChunk: processed.chunks.length > 0
      ? Math.round(processed.totalTokens / processed.chunks.length)
      : 0,
    wordCount: processed.wordCount,
    contentHash: processed.contentHash,
    estimatedCost: calculateEmbeddingCost(processed.totalTokens)
  };
}

/**
 * Calculate estimated OpenAI embedding cost
 */
function calculateEmbeddingCost(tokens: number): number {
  // OpenAI text-embedding-3-small pricing: $0.00002 per 1K tokens
  const costPer1KTokens = 0.00002;
  return (tokens / 1000) * costPer1KTokens;
}

// ================================================================
// ENHANCED CITATIONS & DEEP LINKING (Phase 2)
// ================================================================

export interface BlogSection {
  id: string;
  title: string;
  level: number; // 1 for h1, 2 for h2, etc.
  content: string;
  excerpt: string;
  startPosition: number;
  endPosition: number;
}

export interface ProcessedBlogContent {
  sections: BlogSection[];
  contentWithAnchors: string;
  wordCount: number;
  readingTime: number;
}

/**
 * Creates a URL-safe anchor ID from heading text
 */
function createAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50); // Limit length
}

/**
 * Extracts text content without HTML tags
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Generates a reading time estimate
 */
function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Processes WordPress blog content to extract sections and add anchor links
 */
export function processBlogContent(htmlContent: string, postSlug: string): ProcessedBlogContent {
  if (!htmlContent) {
    return {
      sections: [],
      contentWithAnchors: '',
      wordCount: 0,
      readingTime: 0
    };
  }

  const sections: BlogSection[] = [];
  let processedContent = htmlContent;

  // Regex to match headings (h1-h6)
  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  let match;
  let lastEndPosition = 0;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const [fullMatch, tagName, headingText] = match;
    const level = parseInt(tagName.charAt(1));
    const cleanTitle = stripHtml(headingText);
    const anchorId = createAnchorId(cleanTitle);

    // Get content between this heading and the next
    const startPosition = match.index + fullMatch.length;
    const nextHeadingMatch = headingRegex.exec(htmlContent);
    const endPosition = nextHeadingMatch ? nextHeadingMatch.index : htmlContent.length;

    // Reset regex position for next iteration
    headingRegex.lastIndex = match.index + fullMatch.length;

    // Extract section content
    const sectionContent = htmlContent.slice(startPosition, endPosition);
    const cleanContent = stripHtml(sectionContent);
    const excerpt = cleanContent.slice(0, 200) + (cleanContent.length > 200 ? '...' : '');

    sections.push({
      id: anchorId,
      title: cleanTitle,
      level,
      content: cleanContent,
      excerpt,
      startPosition: match.index,
      endPosition
    });

    // Add anchor link to the heading in processed content
    const headingWithAnchor = `<${tagName} id="${anchorId}">${headingText}</${tagName}>`;
    processedContent = processedContent.replace(fullMatch, headingWithAnchor);
  }

  // Calculate word count and reading time
  const totalText = stripHtml(htmlContent);
  const wordCount = totalText.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = calculateReadingTime(wordCount);

  return {
    sections,
    contentWithAnchors: processedContent,
    wordCount,
    readingTime
  };
}

/**
 * Finds the most relevant section for a given text query
 */
export function findRelevantSection(
  sections: BlogSection[],
  queryText: string,
  minConfidence: number = 0.3
): BlogSection | null {
  if (!sections.length || !queryText.trim()) return null;

  const query = queryText.toLowerCase();
  let bestMatch: BlogSection | null = null;
  let bestScore = 0;

  for (const section of sections) {
    const title = section.title.toLowerCase();
    const content = section.content.toLowerCase();

    // Calculate relevance score
    let score = 0;

    // Title match (high weight)
    if (title.includes(query)) score += 0.8;

    // Content match (medium weight)
    const contentWords = query.split(/\s+/);
    const matchingWords = contentWords.filter(word =>
      content.includes(word) || title.includes(word)
    );
    score += (matchingWords.length / contentWords.length) * 0.6;

    // Exact phrase match (bonus)
    if (content.includes(query) || title.includes(query)) score += 0.4;

    if (score > bestScore && score >= minConfidence) {
      bestScore = score;
      bestMatch = section;
    }
  }

  return bestMatch;
}

/**
 * Generates a deep link URL to a specific section
 */
export function generateSectionUrl(postSlug: string, sectionId: string): string {
  return `/blog/${postSlug}#${sectionId}`;
}

/**
 * Creates enhanced citation data for AI responses
 */
export interface EnhancedCitation {
  title: string;
  url: string;
  section?: string;
  sectionId?: string;
  excerpt: string;
  confidence: number;
  postSlug: string;
  readingTime?: number;
}

export function createEnhancedCitation(
  postSlug: string,
  postTitle: string,
  section: BlogSection | null,
  confidence: number,
  fallbackExcerpt: string = ''
): EnhancedCitation {
  if (section) {
    return {
      title: postTitle,
      url: generateSectionUrl(postSlug, section.id),
      section: section.title,
      sectionId: section.id,
      excerpt: section.excerpt,
      confidence,
      postSlug
    };
  }

  return {
    title: postTitle,
    url: `/blog/${postSlug}`,
    excerpt: fallbackExcerpt,
    confidence,
    postSlug
  };
}