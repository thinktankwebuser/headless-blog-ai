/**
 * 👉 This function is basically your content manager for the chatbot’s brain.
 *
 * When you want to teach it about your CV → you call `/api/portfolio` with `seed`.
 *
 * When you want to see what it knows → you call it with `list`.
 *
 * When you want to wipe it clean → you call it with `clear`.
 *
 * The chatbot itself will later ask Supabase to retrieve the most relevant chunks
 * when answering visitor questions — this API is just how you load and maintain that knowledge.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin, PortfolioDoc } from '@/lib/supabase-admin';

export const runtime = 'nodejs'; // Ensure we're using Node.js runtime for better compatibility

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const MODEL_EMBED = 'text-embedding-3-small'; // 1536 dimensions

async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODEL_EMBED,
    input: text
  });
  return response.data[0].embedding;
}

function assertAuth(req: NextRequest) {
  const token = req.headers.get('x-portfolio-secret');
  if (!token || token !== process.env.PORTFOLIO_SECRET) {
    throw new Error('Unauthorized');
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAuth(req);
    const body = await req.json();
    const { action } = body as { action: 'seed' | 'list' | 'clear' };

    if (action === 'seed') {
      // body.items: Array<{ path: string; heading?: string; content: string }>
      const items: Array<{ path: string; heading?: string; content: string }> = body.items ?? [];

      if (!items.length) {
        return NextResponse.json(
          { success: false, error: 'No items provided' },
          { status: 400 }
        );
      }

      let successCount = 0;
      const errors: string[] = [];

      // Process each item and generate embeddings
      for (const item of items) {
        try {
          console.log(`Processing: ${item.path}`);

          // Generate embedding for content
          const embedding = await embed(item.content);

          // Upsert into Supabase
          const { error } = await supabaseAdmin
            .from('portfolio_documents')
            .upsert({
              path: item.path,
              heading: item.heading ?? null,
              content: item.content,
              embedding: embedding
            });

          if (error) {
            console.error(`Error upserting ${item.path}:`, error);
            errors.push(`${item.path}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing ${item.path}:`, error);
          errors.push(`${item.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return NextResponse.json({
        success: true,
        processed: items.length,
        successful: successCount,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    if (action === 'list') {
      // List all seeded documents
      const { data, error } = await supabaseAdmin
        .from('portfolio_documents')
        .select('id, path, heading');

      if (error) {
        throw new Error(`Failed to list documents: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        count: data?.length || 0,
        documents: data
      });
    }

    if (action === 'clear') {
      // Clear all documents (use with caution)
      const { error } = await supabaseAdmin
        .from('portfolio_documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) {
        throw new Error(`Failed to clear documents: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        message: 'All documents cleared'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('RAG API error:', error);

    const status = error?.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Server error'
      },
      { status }
    );
  }
}