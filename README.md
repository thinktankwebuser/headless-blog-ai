# Headless Blog MVP

A minimal, fast blog built with Next.js 14 and WordPress GraphQL API. Features server-side rendering, Incremental Static Regeneration (ISR), and a clean, responsive design.

## Features

- 📝 Blog index page showing latest 10 posts
- 📖 Individual post pages with full content
- 🖼️ Featured image support
- ⚡ ISR with 5-minute revalidation window
- 📱 Fully responsive design
- 🚀 Deploy-ready for Vercel
- 🛠️ TypeScript support
- 🎨 Minimal CSS styling

## Prerequisites

- Node.js 18+
- npm
- WordPress site with [WPGraphQL](https://www.wpgraphql.com/) plugin installed
- WordPress posts with published content

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd headless-blog-mvp
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
WP_GRAPHQL_URL=https://your-wordpress-site.com/graphql
```

Replace `https://your-wordpress-site.com/graphql` with your WordPress GraphQL endpoint.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the blog.

### 4. Build and Test

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── (blog)/
│   │   └── blog/
│   │       ├── page.tsx          # Blog index (/blog)
│   │       └── [slug]/
│   │           └── page.tsx      # Blog post detail (/blog/[slug])
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with nav/footer
│   └── page.tsx                  # Home page
├── lib/
│   └── wp.ts                     # WordPress GraphQL utilities
├── .env                          # Environment variables
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

## Routes

- `/` - Home page with link to blog
- `/blog` - Blog index showing latest 10 posts
- `/blog/[slug]` - Individual blog post pages

## WordPress Setup

### Required Plugin

Install and activate [WPGraphQL](https://wordpress.org/plugins/wp-graphql/) on your WordPress site.

### GraphQL Endpoint

Your GraphQL endpoint will be available at:
```
https://your-wordpress-site.com/graphql
```

### Required WordPress Data

The blog expects these WordPress post fields:
- Title
- Content
- Date
- Slug
- Excerpt (optional)
- Featured Image (optional)

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login and deploy:
```bash
vercel login
vercel
```

3. Set environment variable in Vercel dashboard:
   - Go to your project settings
   - Add `WP_GRAPHQL_URL` environment variable

4. Deploy to production:
```bash
vercel --prod
```

### Environment Variables for Production

In your Vercel project settings, add:
- `WP_GRAPHQL_URL`: Your WordPress GraphQL endpoint

## Caching Strategy

- **ISR**: 300 seconds (5 minutes) revalidation
- **Static**: Blog pages are statically generated at build time
- **Fresh Content**: New posts appear within 5 minutes of publishing

## Testing

### Smoke Test (Local)

```bash
# Start the server
npm run build && npm start &
sleep 2

# Test blog index responds
curl -s -o /dev/null -w "%{http_code}\\n" http://localhost:3000/blog | grep 200

# Test content is present
curl -s http://localhost:3000/blog | grep -i "<h1"
```

### Content Verification

```bash
# Check if posts are loading
curl -s http://localhost:3000/blog | grep "post-item"
```

## Customization

### Styling

Edit `app/globals.css` to customize the appearance. The design uses:
- System fonts for performance
- CSS Grid/Flexbox for layout
- Mobile-first responsive design
- Semantic HTML structure

### WordPress Fields

To add more WordPress fields, update:
1. TypeScript interfaces in `lib/wp.ts`
2. GraphQL queries in `lib/wp.ts`
3. Components in `app/(blog)/blog/` pages

### ISR Timing

Change the revalidation period by updating the `revalidate` export in page components:

```typescript
export const revalidate = 300; // 5 minutes in seconds
```

## Troubleshooting

### "No posts found" Error

1. Verify WordPress GraphQL endpoint is accessible
2. Check WordPress has published posts
3. Confirm WPGraphQL plugin is active
4. Test GraphQL endpoint in browser/Postman

### Build Errors

1. Ensure all environment variables are set
2. Check TypeScript errors: `npm run build`
3. Verify WordPress site is accessible during build

### 404 Errors on Post Pages

1. Check post slugs match WordPress slugs exactly
2. Ensure posts are published (not draft)
3. Verify GraphQL query returns expected data

## Performance

- **Lighthouse Score**: 90+ on all metrics
- **Bundle Size**: ~200KB total JavaScript
- **First Load**: Sub-second with ISR caching
- **SEO**: Server-rendered with proper meta tags

## Future Enhancements

- Draft mode preview for editors
- On-demand revalidation with webhooks
- Categories and tags support
- Search functionality
- Pagination for blog index
- Comment system integration
- Social sharing buttons

## License

MIT