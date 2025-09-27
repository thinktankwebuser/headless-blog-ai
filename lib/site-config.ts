/**
 * Site configuration object containing all site-wide settings and constants
 */
export const siteConfig = {
  author: {
    name: "Austin Puthur James",
    title: "Product & Solutions Leader | Money Movements | Applied AI in Fintech | Payments Optimisation | B2B & Consumer Payments",
    shortTitle: "Product & Solutions Leader",
    company: "FIS",
    email: "austinputhur@gmail.com",
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
    name: "Austin Puthur James",
    title: "Austin's Portfolio & Blog",
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
      "What are your top skills?",
      "Tell me about your experience",
      "What projects have you built?"
    ],
    timeouts: {
      focus: 100, // ms - timeout for focusing input elements
      cachedContentDelay: 800 // ms - delay for showing cached content to provide visual feedback
    }
  }
} as const;

// Export type for TypeScript
export type SiteConfig = typeof siteConfig;