export interface PortfolioSection {
  path: string;
  heading?: string;
  content: string;
}

export const portfolioSections: PortfolioSection[] = [
  {
    path: "about.md",
    heading: "About Me",
    content: "I'm Austin Puthur, a passionate full-stack developer with 5+ years of experience building scalable web applications. I specialize in React, Node.js, and cloud technologies, with a strong focus on creating user-centric solutions that solve real business problems. I enjoy mentoring junior developers and contributing to open source projects."
  },

  // Technical Skills
  {
    path: "skills.md#frontend",
    heading: "Frontend Technologies",
    content: "Expert in React (5+ years) with extensive experience in Next.js, TypeScript, and modern CSS frameworks. Built 15+ single-page applications with performance optimization techniques including code splitting, lazy loading, and bundle size reduction achieving 60% faster load times. Proficient in responsive design, accessibility standards, and cross-browser compatibility."
  },
  {
    path: "skills.md#backend",
    heading: "Backend & Cloud Technologies",
    content: "Proficient in Node.js, Express.js, and RESTful API development with 4+ years experience. Strong expertise in AWS services including EC2, Lambda, RDS, S3, and CloudFormation. Experience with Docker containerization, CI/CD pipelines using GitHub Actions, and microservices architecture. Database experience includes PostgreSQL, MongoDB, and Redis."
  },
  {
    path: "skills.md#languages",
    heading: "Programming Languages",
    content: "Primary languages: JavaScript/TypeScript (5+ years), Python (3+ years), HTML/CSS (6+ years). Familiar with: PHP, Go, SQL, GraphQL. Strong understanding of functional programming concepts, async programming patterns, and object-oriented design principles."
  },

  // Work Experience
  {
    path: "experience.md#senior-2022",
    heading: "Senior Full-Stack Engineer (2022-2024)",
    content: "Led development of microservices architecture serving 2M+ users daily. Implemented AWS security controls including IAM least-privilege policies, CloudTrail monitoring across 12 accounts, and GuardDuty integration with automated incident response. Reduced infrastructure costs by 40% through resource optimization and S3 lifecycle policies. Mentored 3 junior developers and conducted technical interviews."
  },
  {
    path: "experience.md#mid-2020",
    heading: "Mid-Level Developer (2020-2022)",
    content: "Built React-based customer portals with real-time data visualization using WebSocket connections. Developed GraphQL APIs with 99.9% uptime handling 50K+ requests per hour. Implemented comprehensive testing strategies including unit tests (Jest), integration tests, and E2E testing (Cypress). Collaborated with product and design teams in agile development environment."
  },
  {
    path: "experience.md#junior-2019",
    heading: "Junior Developer (2019-2020)",
    content: "Started career building responsive web applications using React and Node.js. Contributed to e-commerce platform development with features including shopping cart, payment integration (Stripe), and inventory management. Gained experience with version control (Git), code reviews, and deployment processes."
  },

  // Specific Technology Experience
  {
    path: "aws.md#security",
    heading: "AWS Security & Compliance",
    content: "Extensive experience implementing AWS security best practices. Led rollout of IAM policies with least-privilege access across organization. Set up CloudTrail for comprehensive audit logging and monitoring. Configured GuardDuty for threat detection with automated Slack notifications. Implemented VPC security groups, NACLs, and encryption at rest and in transit. Experience with AWS Config for compliance monitoring."
  },
  {
    path: "aws.md#architecture",
    heading: "AWS Architecture & Infrastructure",
    content: "Designed and implemented scalable AWS architectures using EC2, ECS, Lambda, and RDS. Built serverless applications with Lambda functions, API Gateway, and DynamoDB. Experience with CloudFormation and CDK for infrastructure as code. Implemented auto-scaling groups, load balancers, and multi-AZ deployments for high availability. Cost optimization through Reserved Instances and Spot Instances."
  },
  {
    path: "react.md#performance",
    heading: "React Performance Optimization",
    content: "Expert in React performance optimization techniques including React.memo, useMemo, useCallback for preventing unnecessary re-renders. Implemented code splitting with React.lazy and Suspense reducing initial bundle size by 60%. Used React Profiler to identify performance bottlenecks. Experience with virtual scrolling for large datasets and Web Workers for heavy computations."
  },
  {
    path: "react.md#ecosystem",
    heading: "React Ecosystem & State Management",
    content: "Extensive experience with React ecosystem including Redux, Context API, and custom hooks for state management. Built complex forms with React Hook Form and validation schemas. Implemented routing with React Router including protected routes and dynamic imports. Experience with testing React components using React Testing Library and Jest."
  },

  // Projects
  {
    path: "projects.md#blog-platform",
    heading: "Headless Blog Platform (Current)",
    content: "Built this portfolio site using Next.js 15 with App Router, WordPress GraphQL API integration, and OpenAI-powered content generation. Implemented security measures including XSS protection with DOMPurify and proper image domain validation. Features include responsive design, SEO optimization, and AI-powered blog summaries. Deployed on Vercel with automatic builds and environment management."
  },
  {
    path: "projects.md#ecommerce",
    heading: "E-commerce Platform",
    content: "Developed full-stack e-commerce solution handling $2M+ annual revenue. Built with React frontend, Node.js/Express backend, and PostgreSQL database. Integrated Stripe payment processing, inventory management system, and admin dashboard. Implemented search functionality with Elasticsearch and real-time notifications with WebSocket connections. Achieved 99.8% uptime with comprehensive error monitoring."
  },
  {
    path: "projects.md#dashboard",
    heading: "Real-time Analytics Dashboard",
    content: "Created business intelligence dashboard processing 1M+ data points daily. Built with React, D3.js for custom visualizations, and Node.js backend with Redis caching. Implemented WebSocket connections for real-time updates and CSV/PDF export functionality. Features include customizable widgets, user role management, and mobile-responsive design."
  },
  {
    path: "projects.md#api-platform",
    heading: "API Platform & Microservices",
    content: "Designed and built microservices platform serving 50+ internal APIs. Implemented API Gateway with rate limiting, authentication (JWT), and comprehensive logging. Built with Node.js, Docker containers, and Kubernetes orchestration. Features include automatic API documentation, health checks, and circuit breaker patterns for fault tolerance."
  },

  // Education & Certifications
  {
    path: "education.md",
    heading: "Education",
    content: "Bachelor of Science in Computer Science from State University (2019). Coursework included algorithms, data structures, software engineering, database design, and computer networks. Graduated cum laude with focus on web technologies and software architecture. Completed senior capstone project building a collaborative code editor."
  },
  {
    path: "certifications.md",
    heading: "Professional Certifications",
    content: "AWS Certified Solutions Architect - Associate (2023), AWS Certified Developer - Associate (2022). Google Cloud Professional Cloud Architect (2023). MongoDB Certified Developer (2021). Continuously updating skills through online courses and conferences including Re:Invent, React Conf, and local tech meetups."
  },

  // Soft Skills & Leadership
  {
    path: "leadership.md",
    heading: "Leadership & Collaboration",
    content: "Experienced in leading cross-functional teams and mentoring junior developers. Conducted 50+ technical interviews and code reviews. Built onboarding processes reducing new hire ramp-up time by 50%. Strong communication skills with experience presenting technical concepts to non-technical stakeholders. Advocated for code quality standards and best practices across organization."
  },

  // Contact & Availability
  {
    path: "contact.md",
    heading: "Contact Information",
    content: "Available for freelance projects, consulting, or full-time opportunities. You can reach me via LinkedIn (linkedin.com/in/austinputhur), email (austin@example.com), or through this website's contact form. Based in San Francisco Bay Area, open to remote work opportunities. Response time typically within 24 hours for project inquiries."
  }
];

// Helper function to get total content for seeding
export function getTotalSections() {
  return portfolioSections.length;
}

// Helper function to validate content structure
export function validatePortfolioSections(): string[] {
  const errors: string[] = [];

  portfolioSections.forEach((section, index) => {
    if (!section.path) {
      errors.push(`Section ${index}: Missing path`);
    }
    if (!section.content || section.content.length < 50) {
      errors.push(`Section ${index} (${section.path}): Content too short`);
    }
    if (section.content && section.content.length > 2000) {
      errors.push(`Section ${index} (${section.path}): Content too long (${section.content.length} chars)`);
    }
  });

  return errors;
}