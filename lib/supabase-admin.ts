import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  }
);

// Type definitions for our portfolio docs table
export interface PortfolioDoc {
  id?: string; // UUID
  path: string;
  heading?: string | null;
  content: string;
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioMatch {
  id: string; // UUID
  path: string;
  heading: string | null;
  content: string;
  similarity: number;
}