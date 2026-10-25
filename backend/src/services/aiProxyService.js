import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

export const aiProxyService = {
  async generateCareerRoadmap(currentSkills, targetRole, branch) {
    try {
      const res = await axios.post(`${AI_SERVICE_URL}/api/ai/career-roadmap`, {
        current_skills: currentSkills,
        target_role: targetRole,
        branch
      }, { timeout: 7000 });
      return res.data;
    } catch (err) {
      console.warn(`[AI Proxy] Flask AI service unavailable (${err.message}). Using resilient local career guidance engine.`);
      return this.localCareerFallback(currentSkills, targetRole, branch);
    }
  },

  localCareerFallback(currentSkills, targetRole, branch) {
    const list = (currentSkills || []).map(s => s.toLowerCase());
    const required = ['javascript', 'react', 'node.js', 'express', 'mongodb', 'postgresql', 'docker', 'system design', 'data structures'];
    const have = required.filter(r => list.some(l => l.includes(r) || r.includes(l)));
    const need = required.filter(r => !list.some(l => l.includes(r) || r.includes(l)));
    const match = Math.round((have.length / required.length) * 100);

    return {
      target_role: targetRole || 'Full Stack Engineer',
      match_percentage: match,
      current_skills: currentSkills,
      possessed_skills: have,
      skill_gaps: need,
      roadmap_milestones: [
        { week: "Weeks 1-2", focus: "Data Structures & Core Algorithms", actions: ["Master arrays, sliding window, and two-pointer paradigms.", "Solve 20 curated placement questions on LeetCode."] },
        { week: "Weeks 3-4", focus: "Full Stack Architecture & APIs", actions: ["Build robust RESTful APIs with input validation, JWT auth, and middleware.", "Implement clean component architecture in React with Tailwind CSS."] },
        { week: "Weeks 5-6", focus: "Databases, Caching & Performance", actions: ["Study indexing strategies, query execution plans, and normalization.", "Integrate Redis for caching frequent API reads."] },
        { week: "Weeks 7-8", focus: "Distributed Systems & Capstone Project", actions: ["Develop a full-featured real-world production application with unit tests.", "Deploy containerized services using Docker to a cloud provider."] },
        { week: "Weeks 9-10", focus: "System Design & Behavioral Preparation", actions: ["Study rate limiters, load balancers, and URL shortener architectures.", "Prepare behavioral interview answers using the STAR method."] },
        { week: "Weeks 11-12", focus: "Placement Drives & Mock Interviews", actions: ["Complete 5 timed AI mock interviews on this portal.", "Refine resume with quantifiable project impact metrics."] }
      ],
      suggested_projects: [
        { name: "Real-time Collaboration Platform", stack: "React, Node.js, WebSockets, Redis", difficulty: "Advanced" },
        { name: "Distributed Task Queue & Scheduler", stack: "Node.js, Docker, RabbitMQ, MongoDB", difficulty: "Advanced" },
        { name: "AI-Enhanced Knowledge Search Engine", stack: "Python/Node, Vector DB, Express, React", difficulty: "Intermediate" }
      ],
      curated_resources: [
        { title: "roadmap.sh Developer Roadmaps", type: "Interactive Guide", url: "https://roadmap.sh" },
        { title: "NeetCode 150 DSA Path", type: "Problem Set", url: "https://neetcode.io" },
        { title: "System Design Primer", type: "GitHub Repository", url: "https://github.com/donnemartin/system-design-primer" },
        { title: "MDN Web Docs", type: "Documentation", url: "https://developer.mozilla.org" }
      ],
      provider: "deterministic-engine (built-in resilience)"
    };
  }
};
