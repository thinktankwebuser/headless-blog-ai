/**
 * 👉 This function is basically your Q&A engine for the portfolio chatbot.
 *
 * When a visitor asks a question → it first checks the rules (rate limit, length, banned topics).
 * If the question is valid → it looks up the most relevant snippets of your CV/portfolio (via Supabase or local matcher).
 * If good matches exist → it asks ChatGPT to write a short, grounded answer with citations.
 * If no matches or off-scope → it politely refuses.
 *
 * So the chatbot itself is powered by this API: it’s the piece that turns a free-form visitor
 * question into either a scoped, supported answer or a safe refusal.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin, PortfolioMatch } from '@/lib/supabase-admin';

export const runtime = 'nodejs'; // Ensure Node.js runtime for better compatibility

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const MODEL_EMBED = 'text-embedding-3-small'; // 1536 dimensions
const SIM_THRESHOLD = 0.1; // Similarity threshold for relevant matches (lowered for better coverage)
const MATCH_COUNT = 5; // Maximum number of matches to retrieve

// Simple rate limiting (in-memory, resets on restart)
const rateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 5 seconds between requests (aligned with ai-generate)

async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODEL_EMBED,
    input: text
  });
  return response.data[0].embedding;
}

async function searchPortfolio(question: string): Promise<PortfolioMatch[]> {
  try {
    // Generate embedding for the question
    const questionEmbedding = await embed(question);

    // Search for similar content using the RPC function
    const { data: matches, error } = await supabaseAdmin.rpc('match_portfolio_docs', {
      query_embedding: questionEmbedding,
      match_count: MATCH_COUNT,
      sim_threshold: SIM_THRESHOLD
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return [];
    }

    return matches || [];
  } catch (error) {
    console.error('Error searching portfolio:', error);
    return [];
  }
}

async function generateAnswer(question: string, matches: PortfolioMatch[]): Promise<{
  answer: string | null;
  refusal: boolean;
  message?: string;
  citations: Array<{ path: string; heading: string | null; similarity: number }>;
}> {
  // If no relevant matches found, return refusal
  if (matches.length === 0) {
    return {
      answer: null,
      refusal: true,
      message: "I can only answer questions about Austin's portfolio (bio, CV, skills, experience, projects).",
      citations: []
    };
  }

  try {
    // Prepare context from top matches
    const contextBlocks = matches.slice(0, 3).map((match, index) => {
      const heading = match.heading ? ` - ${match.heading}` : '';
      return `[Source ${index + 1}: ${match.path}${heading}]\n${match.content}`;
    }).join('\n\n');

    const systemPrompt = `You are Austin Puthur's portfolio assistant. Answer questions ONLY from the provided context about his CV, skills, experience, and projects.

Rules:
- Answer only from the provided context
- If the question cannot be answered from context, refuse politely
- Keep answers under 180 words
- Include brief source references like (skills.md) or (experience.md)
- Be conversational and helpful
- No financial advice or personal information
- Focus on technical skills, work experience, and projects`;

    const userPrompt = `Question: ${question}\n\nContext:\n${contextBlocks}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    const answer = completion.choices[0]?.message?.content?.trim() || '';

    // Handle empty responses from OpenAI (safety filtering, etc.)
    if (!answer) {
      return {
        answer: null,
        refusal: true,
        message: "I can only answer questions about Austin's portfolio (bio, CV, skills, experience, projects).",
        citations: []
      };
    }

    // Check if the AI refused to answer based on context
    const refusalIndicators = [
      'cannot answer',
      'not provided',
      'not mentioned',
      'no information',
      'outside the scope'
    ];

    const isRefusal = refusalIndicators.some(indicator =>
      answer.toLowerCase().includes(indicator)
    );

    if (isRefusal) {
      return {
        answer: null,
        refusal: true,
        message: "I can only answer questions about Austin's portfolio (bio, CV, skills, experience, projects).",
        citations: []
      };
    }

    return {
      answer,
      refusal: false,
      citations: matches.slice(0, 3).map(match => ({
        path: match.path,
        heading: match.heading,
        similarity: Math.round(match.similarity * 100) / 100
      }))
    };

  } catch (error) {
    console.error('Error generating answer:', error);
    throw new Error('Failed to generate answer');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const lastRequest = rateLimit.get(clientIP);
    const now = Date.now();

    if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
      return NextResponse.json(
        {
          error: 'Please wait a moment before asking another question.',
          refusal: false
        },
        { status: 429 }
      );
    }

    rateLimit.set(clientIP, now);

    // Parse and validate request
    const body = await request.json();
    const { question } = body;

    // Basic validation
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3) {
      return NextResponse.json(
        { error: 'Question too short' },
        { status: 400 }
      );
    }

    if (trimmedQuestion.length > 500) {
      return NextResponse.json(
        { error: 'Question too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Enhanced guardrails - check for denied keywords
    const deniedKeywords = [
      'salary', 'wage', 'income', // Personal compensation (but allow 'pay' for payments)
      'personal', 'private', 'confidential', 'secret',
      'medical', 'health', 'doctor',
      'political', 'politics', 'vote',
      'legal', 'lawyer', 'advice',
      'controversial', 'opinion',
      'password', 'login', 'access',
      'relationship', 'dating', 'family'
    ];

    const lowerQuestion = trimmedQuestion.toLowerCase();
    const deniedMatch = deniedKeywords.find(keyword => lowerQuestion.includes(keyword));

    if (deniedMatch) {
      return NextResponse.json({
        answer: null,
        refusal: true,
        message: "I can only answer questions about Austin's portfolio, skills, experience, and projects. I don't discuss personal, financial, or confidential topics."
      });
    }

    // Use Supabase vector search
    const matches = await searchPortfolio(trimmedQuestion);
    const result = await generateAnswer(trimmedQuestion, matches);

    // Log for monitoring (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Supabase Chat: "${trimmedQuestion.substring(0, 50)}..." -> Answer: ${result.answer ? 'Generated' : 'Refused'}`);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('RAG Chat API error:', error);

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}