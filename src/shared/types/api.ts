/**
 * API types for external services
 */

// News API types
export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

export interface NewsAPIArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

// OpenAI API types
export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: string;
}

// X API types
export interface XAPIUser {
  id: string;
  name: string;
  username: string;
  created_at: string;
  description?: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
}

export interface XAPITweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
    impression_count?: number;
  };
  context_annotations?: {
    domain: {
      id: string;
      name: string;
      description: string;
    };
    entity: {
      id: string;
      name: string;
      description?: string;
    };
  }[];
}

export interface XAPIResponse<T> {
  data: T[];
  includes?: {
    users?: XAPIUser[];
    tweets?: XAPITweet[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
    previous_token?: string;
  };
}

// RSS Feed types
export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author?: string;
  content?: string;
  guid?: string;
}

// API Error types
export interface APIError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}

// Rate limiting types
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

export interface APIRateLimitInfo {
  newsapi: RateLimit;
  openai: RateLimit;
  xapi: RateLimit;
}
