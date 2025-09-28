export interface CitationSource {
  title: string;
  url: string;
  section?: string;
  confidence: number;
  excerpt: string;
}

export interface UnifiedChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context: 'portfolio' | 'blog-post' | 'blog-search';
  sources?: CitationSource[];
  timestamp: Date;
}

export interface UnifiedChatResponse {
  answer: string;
  context: 'portfolio' | 'blog-post' | 'blog-search';
  sources: CitationSource[];
  refusal?: boolean;
  message?: string;
  suggestions?: string[];
}

export interface ChatState {
  portfolioMessages: UnifiedChatMessage[];
  blogMessages: UnifiedChatMessage[];
  loading: boolean;
  error: string | null;
}

export interface SendMessageOptions {
  context: 'portfolio' | 'blog-post' | 'blog-search';
  postSlug?: string;
  blogMode?: 'post' | 'search';
}