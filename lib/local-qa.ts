// Local Q&A data for keyword-based matching
export interface LocalQA {
  keywords: string[];
  answer: string;
  category: string;
}

export const localQAData: LocalQA[] = [
  {
    keywords: ['about', 'who', 'bio', 'introduction', 'austin'],
    answer: "I'm Austin Puthur, a passionate full-stack developer with 5+ years of experience building scalable web applications. I specialize in React, Node.js, and cloud technologies, with a strong focus on creating user-centric solutions.",
    category: 'about'
  },
  {
    keywords: ['skills', 'technologies', 'stack', 'programming', 'languages'],
    answer: "My core skills include React/TypeScript (5+ years), Node.js, AWS cloud services, Python, and modern web development. I'm experienced with Next.js, Express.js, PostgreSQL, MongoDB, and containerization with Docker.",
    category: 'skills'
  },
  {
    keywords: ['experience', 'work', 'career', 'job', 'professional'],
    answer: "I have 5+ years of professional experience, currently working as a Senior Full-Stack Engineer. I've led development of microservices serving 2M+ users daily, implemented AWS security controls, and mentored junior developers.",
    category: 'experience'
  },
  {
    keywords: ['aws', 'cloud', 'security', 'infrastructure', 'devops'],
    answer: "I have extensive AWS experience including EC2, Lambda, RDS, S3, CloudFormation, IAM security policies, CloudTrail monitoring, and GuardDuty integration. I've implemented infrastructure as code and cost optimization strategies.",
    category: 'aws'
  },
  {
    keywords: ['react', 'frontend', 'ui', 'javascript', 'typescript'],
    answer: "I'm an expert in React with 5+ years experience, including performance optimization, code splitting, custom hooks, and state management with Redux and Context API. I've built 15+ single-page applications with significant performance improvements.",
    category: 'frontend'
  },
  {
    keywords: ['projects', 'portfolio', 'built', 'developed', 'created'],
    answer: "I've built various projects including this headless blog platform with Next.js and WordPress GraphQL, an e-commerce platform handling $2M+ revenue, real-time analytics dashboards, and microservices platforms serving 50+ APIs.",
    category: 'projects'
  },
  {
    keywords: ['backend', 'api', 'server', 'database', 'node'],
    answer: "I'm proficient in Node.js/Express.js backend development, RESTful and GraphQL APIs, database design with PostgreSQL and MongoDB, microservices architecture, and API security with JWT authentication.",
    category: 'backend'
  },
  {
    keywords: ['education', 'degree', 'university', 'study', 'learning'],
    answer: "I have a Bachelor of Science in Computer Science from State University (2019), graduated cum laude. I also hold AWS certifications (Solutions Architect, Developer) and Google Cloud Professional Cloud Architect certification.",
    category: 'education'
  },
  {
    keywords: ['contact', 'hire', 'available', 'reach', 'linkedin'],
    answer: "I'm available for freelance projects, consulting, or full-time opportunities. You can reach me via LinkedIn (linkedin.com/in/austinputhur) or email. I'm based in San Francisco Bay Area and open to remote work.",
    category: 'contact'
  }
];

export function findLocalAnswer(question: string): { answer: string | null; category?: string } {
  const lowerQuestion = question.toLowerCase();

  // Find matching Q&A based on keywords
  const match = localQAData.find(qa =>
    qa.keywords.some(keyword => lowerQuestion.includes(keyword))
  );

  if (match) {
    return { answer: match.answer, category: match.category };
  }

  return { answer: null };
}