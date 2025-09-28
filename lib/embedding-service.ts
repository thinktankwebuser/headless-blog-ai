/**
 * Embedding Service for Blog Search
 *
 * Handles OpenAI embedding generation with error handling, retries, and rate limiting.
 * Uses text-embedding-3-small model for cost-effective semantic search.
 */

import OpenAI from 'openai';

// Configuration constants
const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  maxRetries: 3,
  baseDelay: 1000, // 1 second base delay for retries
  maxInputLength: 8000, // Max characters for embedding input
  batchSize: 100, // Max embeddings per batch request
} as const;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  text: string;
  index?: number;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokens: number;
  cost: number;
}

/**
 * Generate embedding for a single text chunk
 */
export async function generateEmbedding(
  text: string,
  retryCount: number = 0
): Promise<EmbeddingResult> {
  if (!text?.trim()) {
    throw new Error('Text cannot be empty');
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  // Truncate text if too long
  const truncatedText = text.length > EMBEDDING_CONFIG.maxInputLength
    ? text.substring(0, EMBEDDING_CONFIG.maxInputLength)
    : text;

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_CONFIG.model,
      input: truncatedText,
      encoding_format: 'float',
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length !== EMBEDDING_CONFIG.dimensions) {
      throw new Error(`Invalid embedding dimensions: expected ${EMBEDDING_CONFIG.dimensions}, got ${embedding?.length || 0}`);
    }

    return {
      embedding,
      tokens: response.usage?.total_tokens || 0,
      text: truncatedText,
    };

  } catch (error) {
    // Handle rate limiting and retry
    if (isRetryableError(error) && retryCount < EMBEDDING_CONFIG.maxRetries) {
      const delay = EMBEDDING_CONFIG.baseDelay * Math.pow(2, retryCount);
      console.warn(`Embedding generation failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${EMBEDDING_CONFIG.maxRetries}):`, error);

      await sleep(delay);
      return generateEmbedding(text, retryCount + 1);
    }

    // Log the error for debugging
    console.error('Embedding generation failed:', {
      error: error instanceof Error ? error.message : String(error),
      textLength: text.length,
      retryCount,
    });

    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<BatchEmbeddingResult> {
  if (!texts.length) {
    return {
      embeddings: [],
      totalTokens: 0,
      cost: 0,
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  // Process in batches to respect API limits
  const embeddings: EmbeddingResult[] = [];
  let totalTokens = 0;

  for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batchSize) {
    const batch = texts.slice(i, i + EMBEDDING_CONFIG.batchSize);
    const batchResult = await processBatch(batch, i);

    embeddings.push(...batchResult.embeddings);
    totalTokens += batchResult.totalTokens;

    // Add small delay between batches to respect rate limits
    if (i + EMBEDDING_CONFIG.batchSize < texts.length) {
      await sleep(100);
    }
  }

  const cost = calculateCost(totalTokens);

  return {
    embeddings,
    totalTokens,
    cost,
  };
}

/**
 * Process a single batch of embeddings
 */
async function processBatch(
  texts: string[],
  startIndex: number
): Promise<BatchEmbeddingResult> {
  // Truncate texts if necessary
  const truncatedTexts = texts.map(text =>
    text.length > EMBEDDING_CONFIG.maxInputLength
      ? text.substring(0, EMBEDDING_CONFIG.maxInputLength)
      : text
  );

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_CONFIG.model,
      input: truncatedTexts,
      encoding_format: 'float',
    });

    const embeddings: EmbeddingResult[] = response.data.map((item, index) => ({
      embedding: item.embedding,
      tokens: 0, // Individual token counts not available in batch
      text: truncatedTexts[index],
      index: startIndex + index,
    }));

    // Validate embeddings
    for (const result of embeddings) {
      if (!result.embedding || result.embedding.length !== EMBEDDING_CONFIG.dimensions) {
        throw new Error(`Invalid embedding dimensions in batch`);
      }
    }

    return {
      embeddings,
      totalTokens: response.usage?.total_tokens || 0,
      cost: 0, // Calculated later
    };

  } catch (error) {
    console.error('Batch embedding generation failed:', error);
    throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || error.status;

  // Rate limiting
  if (errorCode === 429 || errorMessage.includes('rate limit')) {
    return true;
  }

  // Temporary server errors
  if (errorCode >= 500 && errorCode < 600) {
    return true;
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
    return true;
  }

  return false;
}

/**
 * Sleep utility for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate cost for embedding generation
 */
export function calculateCost(tokens: number): number {
  // OpenAI text-embedding-3-small pricing: $0.00002 per 1K tokens
  const costPer1KTokens = 0.00002;
  return (tokens / 1000) * costPer1KTokens;
}

/**
 * Validate embedding vector
 */
export function validateEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length !== EMBEDDING_CONFIG.dimensions) {
    return false;
  }

  // Check for valid numbers
  return embedding.every(value =>
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value)
  );
}

/**
 * Normalize embedding vector (optional, for consistency)
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));

  if (magnitude === 0) {
    return embedding;
  }

  return embedding.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Get embedding service statistics
 */
export function getEmbeddingStats() {
  return {
    model: EMBEDDING_CONFIG.model,
    dimensions: EMBEDDING_CONFIG.dimensions,
    maxInputLength: EMBEDDING_CONFIG.maxInputLength,
    batchSize: EMBEDDING_CONFIG.batchSize,
    costPer1KTokens: 0.00002,
  };
}