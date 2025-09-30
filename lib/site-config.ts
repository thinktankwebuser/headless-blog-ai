/**
 * Site configuration object containing all site-wide settings and constants
 */
export const siteConfig = {
  author: {
    name: "Austin Puthur James",
    title: "Product & Solutions Leader | Money Movements | Applied AI in Fintech | Payments Optimisation | B2B & Consumer Payments",
    shortTitle: "Product & Solutions Leader",
    company: "Thinking in Capital",
    email: "thinktankwebuser@gmail.com",
    linkedin: {
      url: "https://linkedin.com/in/austinjamesp",
      display: "linkedin.com/in/austinjamesp"
    },
    location: "Greater Sydney Area",
    avatar: "/profile.png",
    bio: "Experienced fintech leader specializing in payment solutions, AI applications, and digital transformation in financial services.",
    connectedSince: "Jul 24, 2010"
  },
  site: {
    name: "Thinking in CAPITAL",
    title: "A space to explore ideas, expand vision, shape systems, and succeed in an evolving economy.",
    description: "Insights on fintech, AI, and product leadership",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  },
  education: [
    "Australian Graduate School of Management"
  ],
  navigation: {
    home: "Home",
    blog: "Blog",
    contact: "Contact Info"
  },
  chat: {
    portfolioQuestions: [
      "Who is Austin and what does he do?",
      "What are Austin's main areas of expertise?",
      "Tell me about Austin's background and experience",
      "What kind of work has Austin done in payments and fintech?",
      "What are some of Austin's major accomplishments?",
      "Tell me about Austin's commercial impact and business results",
      "What transformation programs has Austin led?",
      "How was $100M+ transformation value delivered to central banks?",
      "What were the results of the $40M+ APAC infrastructure opportunities?",
      "How does the 'Thinking in CAPITAL' methodology work?",
      "What's Austin's approach to scaling payment solutions globally?",
      "Tell me about Austin's program leadership capabilities"
    ],
    timeouts: {
      focus: 100, // ms - timeout for focusing input elements
      cachedContentDelay: 800 // ms - delay for showing cached content to provide visual feedback
    }
  }
} as const;

// Export type for TypeScript
export type SiteConfig = typeof siteConfig;