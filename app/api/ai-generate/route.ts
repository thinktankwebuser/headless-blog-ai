import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple rate limiting (in-memory, resets on restart)
const rateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 10 seconds between requests

// Content length limit to prevent excessive token usage
const MAX_CONTENT_LENGTH = 8000;

export async function POST(request: NextRequest) {
  try { 
    // Basic rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const lastRequest = rateLimit.get(clientIP);
    const now = Date.now();

    if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
      return NextResponse.json(
        { success: false, error: 'Rate limited. Please wait before making another request.' },
        { status: 429 }
      );
    }

    rateLimit.set(clientIP, now);

    // Parse request body
    const body = await request.json();
    const { content, type, slug } = body;

    // Validate input
    if (!content || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing content or type parameter' },
        { status: 400 }
      );
    }

    if (!['overview', 'takeaways'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "overview" or "takeaways"' },
        { status: 400 }
      );
    }

    // Truncate content if too long
    const truncatedContent = content.length > MAX_CONTENT_LENGTH
      ? content.substring(0, MAX_CONTENT_LENGTH) + '...'
      : content;

    const systemByType =
      type === 'overview'
        ? [
            "You summarise articles for an 18-year-old reader. No preamble.",
            "Write the Detailed Summary FIRST, titled '📖 Detailed Summary'.",
            "It MUST be 150–200 words in EXACTLY four sections with headers:",
            "'What it says', 'How it argues', 'Why it matters', 'Limits/Risks'.",
            "Write EXACTLY 3 sentences per section, each 12–16 words."
          ].join(" ")
        : [
            "Return a Markdown section titled '✅ Your takeaways' with 3–5 bullet points.",
            "Each bullet starts with a verb, ≤14 words, article-derived only, no external facts.",
            "No preamble or extra text."
          ].join(" ");

    const overviewPrompt = `
    Return (Markdown):
    ⚡ Quick overview — 3 bullets, ≤12 words, plain words + light emojis.
    🚩 Limits/Gaps — only if present; no external facts.

    (Generate the Detailed Summary first as per system.)
    `;

    const takeawaysPrompt = `
    Provide only:
    ✅ Your takeaways
    - 3–5 bullets; start with strong verbs; ≤14 words; article-derived; no extras.
    `;

    const prompts = {
      overview: `${overviewPrompt}\n\n${truncatedContent}`,
      takeaways: `${takeawaysPrompt}\n\n${truncatedContent}`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemByType },
        { role: 'user', content: prompts[type as keyof typeof prompts] }
      ],
      max_tokens: type === 'overview' ? 600 : 250,
      temperature: 0.3,
    });

    // Parse response
    const result = completion.choices[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'No content generated' },
        { status: 500 }
      );
    }

    // Log usage for monitoring (optional)
    console.log(`AI request: ${type} for post ${slug || 'unknown'} - tokens: ${completion.usage?.total_tokens}`);

    return NextResponse.json({
      success: true,
      content: result.trim(),
      type: type,
      tokensUsed: completion.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('AI generation error:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { success: false, error: 'API configuration error' },
          { status: 500 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { success: false, error: 'AI service temporarily unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}