/**
 * This function is a “summariser service”.
 *
 * You hand it an article and say “overview” or “takeaways.”
 *
 * It makes sure you’re not spamming or overspending,
 * asks ChatGPT to write in a very specific format,
 * and then gives the result back as clean JSON.
 */
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple rate limiting (in-memory, resets on restart)
const rateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 5 seconds between requests

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
    const { content, type, slug, question, context, blogMode } = body;

    // Validate input
    if (!content || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing content or type parameter' },
        { status: 400 }
      );
    }

    if (!['overview', 'takeaways', 'questions', 'custom_question', 'blog_search'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "overview", "takeaways", "questions", "custom_question", or "blog_search"' },
        { status: 400 }
      );
    }

    // Validate custom_question specific requirements
    if (type === 'custom_question' && !question) {
      return NextResponse.json(
        { success: false, error: 'Missing question parameter for custom_question type' },
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
            "You are an engaging, modern content summarizer creating comprehensive yet readable summaries.",
            "Write in natural, flowing prose that explains concepts clearly and thoroughly.",
            "Use relevant emojis sparingly and focus on coherent explanations rather than bullet points.",
            "Make content feel fresh and informative - focus on unique angles and specific details.",
            "Structure: Quick Overview (2-3 coherent paragraphs) + Detailed Summary (4 focused sections with flowing text).",
            "Style: conversational, confident, with clear explanations and full sentences.",
            "Avoid corporate jargon, bullet points, and fragmented text - write complete thoughts and explanations."
          ].join(" ")
        : type === 'takeaways'
        ? [
            "You are an engaging content curator creating actionable takeaways.",
            "Focus on practical, specific insights readers can actually use.",
            "Use compelling language with personality - avoid boring corporate speak.",
            "3-6 bullets maximum, each offering real value or a fresh perspective."
          ].join(" ")
        : type === 'custom_question'
        ? [
            "You are an expert AI assistant providing detailed, helpful responses to specific questions about content.",
            "Answer the user's question directly and comprehensively using the provided content.",
            "Be specific, practical, and engaging in your response.",
            "Use examples from the content when relevant.",
            "If the question can't be fully answered from the content, acknowledge this and provide what insight you can."
          ].join(" ")
        : type === 'blog_search'
        ? [
            "You are Austin's blog search assistant, helping users find insights across all blog posts.",
            "Answer questions by drawing connections and patterns across Austin's blog content.",
            "Be conversational and insightful, highlighting key themes and expertise areas.",
            "If you can't answer from the available content, suggest related topics Austin has written about.",
            "Focus on practical insights and actionable takeaways from across the blog."
          ].join(" ")
        : [
            "You are a curious reader who generates natural, valuable questions about content.",
            "Create questions that real readers would genuinely want to ask after reading.",
            "Focus on practical applications, deeper understanding, and clarifications.",
            "Questions should be conversational, specific, and genuinely useful.",
            "Avoid generic questions - make them relevant to the specific content provided."
          ].join(" ");

    const overviewPrompt = `
    Create an engaging, visually appealing overview with this exact structure:

    <div class="ai-cards">
      <section class="ai-card quick-overview-card" aria-label="Quick Overview">
        <div class="card-header">
          <h4><span class="icon">⚡</span>Quick Overview</h4>
        </div>
        <div class="overview-content">
          <!-- Write 2-3 coherent paragraphs explaining the key insights -->
          <!-- Use flowing prose with <strong> emphasis on important concepts -->
          <!-- Example: <p>The content explores how AI transforms payments by...</p> -->
        </div>
      </section>

      <section class="ai-card detailed-summary-card" aria-label="Detailed Summary">
        <div class="card-header">
          <h4><span class="icon">📖</span>Detailed Summary</h4>
        </div>
        <div class="ai-card-grid">
          <div class="ai-subcard">
            <h5><span class="subcard-icon">💭</span>What it says</h5>
            <div class="subcard-content"><!-- Write flowing paragraph explaining what the content says, use <strong> for key terms --></div>
          </div>
          <div class="ai-subcard">
            <h5><span class="subcard-icon">🔍</span>How it works</h5>
            <div class="subcard-content"><!-- Write flowing paragraph explaining how it works or the approach/method --></div>
          </div>
          <div class="ai-subcard">
            <h5><span class="subcard-icon">🎯</span>Why it matters</h5>
            <div class="subcard-content"><!-- Write flowing paragraph explaining why it matters and the impact/significance --></div>
          </div>
          <div class="ai-subcard">
            <h5><span class="subcard-icon">⚠️</span>Considerations</h5>
            <div class="subcard-content"><!-- Write flowing paragraph on considerations, limitations, or caveats if relevant --></div>
          </div>
        </div>
      </section>
    </div>

    Guidelines:
    - Use <strong> tags for emphasis on key terms
    - Include relevant emojis but don't overdo it
    - Make each bullet actionable and specific
    - Avoid generic corporate language
    - Focus on unique insights from the content
    `;

    const takeawaysPrompt = `
    Create an engaging takeaways section:

    <section class="ai-card takeaways-card" aria-label="Your takeaways">
      <div class="card-header">
        <h4><span class="icon">🎯</span>Key Takeaways</h4>
      </div>
      <ul class="takeaways-list">
        <!-- 4-6 actionable, specific bullets with strategic use of <strong> emphasis -->
        <!-- Example: <li>💡 <strong>Action item:</strong> specific thing you can do</li> -->
        <!-- Focus on practical insights, not generic observations -->
      </ul>
    </section>

    Guidelines:
    - Start each bullet with a relevant emoji
    - Use <strong> tags for key actions or concepts
    - Make each takeaway actionable and specific
    - Avoid generic advice - focus on unique insights from the content
    `;

    const questionsPrompt = `
    Generate exactly 3 valuable, simple questions that readers would naturally want to ask about this content. Return them as a simple JSON array of strings.

    Format: ["Question 1?", "Question 2?", "Question 3?"]

    Guidelines for questions:
    - Keep each question under 10 words when possible
    - Make them conversational and natural
    - Focus on practical applications, clarifications, or deeper insights
    - Avoid yes/no questions - prefer "how", "what", "when", "why"
    - Make them specific to the content, not generic
    - Examples of good questions:
      * "How do I implement this in practice?"
      * "What are the common pitfalls?"
      * "When should I use this approach?"
      * "Why is this better than alternatives?"
      * "What tools are recommended?"
      * "How long does this typically take?"

    Return ONLY the JSON array, no other text or formatting.
    `;

    const customQuestionPrompt = `
    Answer this specific question about the content: "${question}"

    Provide a helpful, detailed response using the provided content. Format your response as clean HTML with proper structure:

    <div class="custom-answer">
      <p>Your comprehensive answer here, using the content to provide specific insights...</p>
      <!-- Use additional paragraphs, lists, or emphasis as needed -->
    </div>

    Guidelines:
    - Answer directly and comprehensively
    - Use specific examples from the content when possible
    - Be engaging and practical
    - Use <strong> tags for emphasis on key points
    - Include actionable insights when relevant
    `;

    const blogSearchPrompt = `
    Answer this question about Austin's blog insights: "${question}"

    Draw from across Austin's blog content to provide a comprehensive answer. Format your response as clean HTML:

    <div class="blog-search-answer">
      <p>Based on Austin's blog insights, here's what I found...</p>
      <!-- Provide comprehensive answer drawing connections across posts -->
      <!-- Use <strong> for key concepts and insights -->
      <!-- Include practical takeaways when relevant -->
    </div>

    Guidelines:
    - Synthesize insights across multiple posts when relevant
    - Highlight Austin's unique perspective and expertise
    - Be conversational and engaging
    - Focus on practical, actionable insights
    - If specific information isn't available, suggest related topics Austin has covered
    `;

    const prompts = {
      overview: `${overviewPrompt}\n\n${truncatedContent}`,
      takeaways: `${takeawaysPrompt}\n\n${truncatedContent}`,
      questions: `${questionsPrompt}\n\n${truncatedContent}`,
      custom_question: `${customQuestionPrompt}\n\nContent:\n${truncatedContent}`,
      blog_search: `${blogSearchPrompt}\n\nAvailable Blog Content:\n${truncatedContent}`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemByType },
        { role: 'user', content: prompts[type as keyof typeof prompts] }
      ],
      max_tokens: type === 'overview' ? 600 : type === 'takeaways' ? 250 : type === 'custom_question' ? 400 : type === 'blog_search' ? 500 : 150,
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

    // Log usage for monitoring in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`AI request: ${type} for post ${slug || 'unknown'} - tokens: ${completion.usage?.total_tokens}`);
    }

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