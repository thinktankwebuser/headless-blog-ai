export interface PostNode {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  content?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText?: string;
    };
  };
}

export interface PostsResponse {
  data: {
    posts: {
      nodes: PostNode[];
    };
  };
}

export interface PostResponse {
  data: {
    post: PostNode | null;
  };
}

const WP_GRAPHQL_URL = process.env.WP_GRAPHQL_URL;

if (!WP_GRAPHQL_URL) {
  throw new Error('WP_GRAPHQL_URL environment variable is not set');
}

async function graphqlFetch(query: string, variables: Record<string, any> = {}) {
  try {
    const response = await fetch(WP_GRAPHQL_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      next: { revalidate: 300 }, // 5 minutes ISR
    });

    if (!response.ok) {
      console.error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Network error in graphqlFetch:', error);
    throw error;
  }
}

export async function fetchPosts(first: number = 10): Promise<PostNode[]> {
  const query = `
    query Posts($first: Int = 10) {
      posts(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          excerpt
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  `;

  try {
    const response: PostsResponse = await graphqlFetch(query, { first });
    return response.data.posts.nodes;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

export async function fetchPostBySlug(slug: string): Promise<PostNode | null> {
  const query = `
    query PostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        title
        date
        content
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  `;

  try {
    const response: PostResponse = await graphqlFetch(query, { slug });
    return response.data.post;
  } catch (error) {
    console.error(`Failed to fetch post with slug ${slug}:`, error);
    return null;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function cleanWordPressContent(content: string): string {
  if (!content) return content;

  // Cache the result to ensure consistency between server and client
  // This prevents regex execution differences
  const cacheKey = content.length + content.slice(0, 100); // Simple cache key

  // For now, return content as-is to avoid hydration issues
  // TODO: Implement proper client-side cleaning if needed
  return content;
}