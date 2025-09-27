export const portfolioAnswers = {
  skills: "I specialize in full-stack development with React, Next.js, Node.js, TypeScript, and AWS. I have extensive experience with modern web technologies, GraphQL, REST APIs, database design, and cloud architecture. I'm also skilled in DevOps practices, CI/CD pipelines, and containerization with Docker.",

  experience: "I have 5+ years building scalable web applications and leading development teams. My experience spans startups to enterprise environments, where I've architected systems handling millions of users, implemented microservices, and mentored junior developers. I focus on writing clean, maintainable code and delivering user-centric solutions.",

  projects: "Key projects include this headless blog platform you're viewing (built with Next.js and WordPress), AI-powered content generation systems, e-commerce platforms with real-time inventory management, and enterprise dashboards with complex data visualization. I've also contributed to open-source projects and built developer tools.",

  education: "I hold a Computer Science degree with focus on software engineering and algorithms. I continuously update my skills through courses, certifications, and hands-on projects. I believe in practical learning and staying current with industry trends and best practices.",

  certifications: "AWS Certified Solutions Architect, Google Cloud Professional, and various frontend/backend certifications. I maintain active certifications in cloud platforms, security practices, and modern development frameworks.",

  background: "I'm a passionate full-stack developer who loves solving complex problems with elegant code. I started coding during university and have been building web applications professionally for over 5 years. I enjoy mentoring others, contributing to open source, and exploring new technologies.",

  contact: "You can reach me via LinkedIn, email, or through the contact form on this site. I'm always open to discussing interesting projects, collaboration opportunities, or just talking tech. Feel free to connect!",

  default: "I can help you learn about my skills, experience, projects, education, and background. Try asking about my technical expertise, work experience, or recent projects!"
};

interface Citation {
  path: string;
  heading: string;
}

export function matchQuestion(question: string): {
  answer: string;
  citations: Citation[];
} {
  const q = question.toLowerCase();

  // Skills-related keywords
  if (q.includes('skill') || q.includes('tech') || q.includes('language') || q.includes('framework') || q.includes('stack')) {
    return {
      answer: portfolioAnswers.skills,
      citations: [{ path: 'cv.md', heading: 'Technical Skills' }]
    };
  }

  // Experience-related keywords
  if (q.includes('experience') || q.includes('work') || q.includes('job') || q.includes('career') || q.includes('role')) {
    return {
      answer: portfolioAnswers.experience,
      citations: [{ path: 'cv.md', heading: 'Work Experience' }]
    };
  }

  // Project-related keywords
  if (q.includes('project') || q.includes('build') || q.includes('built') || q.includes('create') || q.includes('develop')) {
    return {
      answer: portfolioAnswers.projects,
      citations: [{ path: 'portfolio.md', heading: 'Featured Projects' }]
    };
  }

  // Education-related keywords
  if (q.includes('education') || q.includes('degree') || q.includes('university') || q.includes('study') || q.includes('school')) {
    return {
      answer: portfolioAnswers.education,
      citations: [{ path: 'cv.md', heading: 'Education' }]
    };
  }

  // Certification-related keywords
  if (q.includes('cert') || q.includes('credential') || q.includes('aws') || q.includes('cloud')) {
    return {
      answer: portfolioAnswers.certifications,
      citations: [{ path: 'cv.md', heading: 'Certifications' }]
    };
  }

  // Background/about keywords
  if (q.includes('about') || q.includes('who') || q.includes('background') || q.includes('story')) {
    return {
      answer: portfolioAnswers.background,
      citations: [{ path: 'about.md', heading: 'About Me' }]
    };
  }

  // Contact-related keywords
  if (q.includes('contact') || q.includes('reach') || q.includes('email') || q.includes('linkedin')) {
    return {
      answer: portfolioAnswers.contact,
      citations: [{ path: 'contact.md', heading: 'Get in Touch' }]
    };
  }

  // Default response
  return {
    answer: portfolioAnswers.default,
    citations: []
  };
}