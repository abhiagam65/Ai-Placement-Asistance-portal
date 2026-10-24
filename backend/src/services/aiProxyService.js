import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

const TECH_KEYWORDS = [
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'c', 'go', 'rust',
  'react', 'next.js', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
  'spring boot', 'fastapi', 'html', 'css', 'tailwind', 'sql', 'postgresql', 'mysql',
  'mongodb', 'redis', 'aws', 'docker', 'kubernetes', 'git', 'linux', 'ci/cd',
  'machine learning', 'deep learning', 'pandas', 'numpy', 'tensorflow', 'pytorch',
  'system design', 'data structures', 'algorithms', 'dbms', 'operating systems'
];

const SOFT_KEYWORDS = [
  'leadership', 'communication', 'teamwork', 'collaboration', 'problem solving',
  'critical thinking', 'time management', 'adaptability', 'agile'
];

export const aiProxyService = {
  async analyzeResume(resumeText, jobDescription = '') {
    try {
      const res = await axios.post(`${AI_SERVICE_URL}/api/ai/resume-analyze`, {
        resume_text: resumeText,
        job_description: jobDescription
      }, { timeout: 7000 });
      return res.data;
    } catch (err) {
      console.warn(`[AI Proxy] Flask AI service unavailable (${err.message}). Using resilient local deterministic analysis.`);
      return this.localResumeFallback(resumeText, jobDescription);
    }
  },

  async generateInterviewQuestion(role, interviewType, difficulty, questionIndex) {
    try {
      const res = await axios.post(`${AI_SERVICE_URL}/api/ai/generate-interview-question`, {
        role,
        interview_type: interviewType,
        difficulty,
        question_index: questionIndex
      }, { timeout: 7000 });
      return res.data;
    } catch (err) {
      console.warn(`[AI Proxy] Flask AI service unavailable (${err.message}). Using resilient local question bank.`);
      return this.localQuestionFallback(role, interviewType, difficulty, questionIndex);
    }
  },

  async evaluateAnswer(question, answer, role, difficulty) {
    try {
      const res = await axios.post(`${AI_SERVICE_URL}/api/ai/evaluate-answer`, {
        question,
        answer,
        role,
        difficulty
      }, { timeout: 7000 });
      return res.data;
    } catch (err) {
      console.warn(`[AI Proxy] Flask AI service unavailable (${err.message}). Using resilient local evaluation engine.`);
      return this.localAnswerEvaluationFallback(question, answer, role, difficulty);
    }
  },

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

  localResumeFallback(resumeText, jobDescription) {
    const textLower = resumeText.toLowerCase();
    const jdLower = (jobDescription || '').toLowerCase();

    const detectedTech = TECH_KEYWORDS.filter(k => textLower.includes(k));
    const detectedSoft = SOFT_KEYWORDS.filter(k => textLower.includes(k));

    const hasEducation = /(education|degree|b\.tech|bachelor|university|college|cgpa)/.test(textLower);
    const hasProjects = /(project|projects|developed|built|created|implemented)/.test(textLower);
    const hasExperience = /(experience|intern|internship|work history|employment)/.test(textLower);
    const hasCertifications = /(certification|certified|course|certificate)/.test(textLower);

    const metricsCount = (resumeText.match(/(\d+[\%xX\+]|\$\d+|\d+\s*users|\d+\s*ms)/g) || []).length;

    let ats = 65;
    if (hasEducation) ats += 8;
    if (hasProjects) ats += 10;
    if (detectedTech.length >= 5) ats += 10;
    if (detectedSoft.length >= 2) ats += 7;
    ats = Math.min(96, ats);

    const impact = Math.min(92, 45 + metricsCount * 7);
    const skillsScore = Math.min(95, 40 + detectedTech.length * 4);
    const completeness = hasEducation && hasProjects ? 84 : 68;
    const overall = Math.round((ats * 0.35) + (skillsScore * 0.30) + (impact * 0.20) + (completeness * 0.15));

    const jdTech = jdLower ? TECH_KEYWORDS.filter(k => jdLower.includes(k)) : [];
    const matching = detectedTech.filter(s => jdTech.includes(s));
    const missing = jdTech.filter(s => !detectedTech.includes(s));
    const matchPct = jdTech.length > 0 ? Math.round((matching.length / jdTech.length) * 100) : 74;

    const suggestions = [];
    if (metricsCount < 2) {
      suggestions.push("Quantify your project outcomes: Add measurable metrics such as latency reduction (e.g., 'reduced API response time by 35%') or user engagement.");
    }
    if (missing.length > 0) {
      suggestions.push(`Target JD Alignment: Consider building a mini-project demonstrating proficiency in: ${missing.slice(0, 4).join(', ')}.`);
    }
    if (!hasCertifications) {
      suggestions.push("Add verified industry certifications (e.g., AWS Certified Cloud Practitioner, Meta Frontend, Google Cloud) to validate your capabilities.");
    }
    if (detectedTech.length < 8) {
      suggestions.push("Expand your Technical Skills matrix to include core computer engineering fundamentals such as OS concepts, DBMS, and Git.");
    }
    suggestions.push("Keep project descriptions action-oriented starting with strong verbs (Architected, Deployed, Engineered, Streamlined).");

    return {
      candidate_summary: {
        detected_technical_skills: detectedTech.slice(0, 18),
        detected_soft_skills: detectedSoft.slice(0, 8),
        sections_present: {
          education: hasEducation,
          projects: hasProjects,
          experience: hasExperience,
          certifications: hasCertifications
        }
      },
      scoring: {
        overall_score: overall,
        ats_readability_score: ats,
        skills_depth_score: skillsScore,
        impact_metrics_score: impact,
        completeness_score: completeness,
        scoring_rationale: "Scores are calculated using transparent structural heuristics: section completeness, technical keyword density, and quantified impact metrics."
      },
      jd_match: {
        has_target_jd: Boolean(jdLower),
        match_percentage: matchPct,
        matching_skills: matching,
        missing_skills: missing.length ? missing : ['docker', 'ci/cd', 'system design'],
        fit_verdict: matchPct >= 75 ? 'Strong Fit' : (matchPct >= 50 ? 'Moderate Fit' : 'Requires Skill Bridging')
      },
      actionable_suggestions: suggestions,
      disclaimer: "This analysis provides structural and keyword guidance based on modern recruitment heuristics. No automated tool can guarantee bypassing ATS or securing interview invitations.",
      provider: "deterministic-engine (built-in resilience)"
    };
  },

  localQuestionFallback(role, interviewType, difficulty, questionIndex) {
    const questions = {
      technical: [
        "Explain how the Event Loop works in Node.js / JavaScript. What is the difference between the microtask queue and the macrotask queue?",
        "What are database indexes, how do B-Trees optimize search queries, and what are the performance write-penalties of having too many indexes?",
        "Explain the CAP theorem. When designing a distributed system, how do you decide between Consistency and Availability?",
        "What are React Hooks dependencies rules, and what leads to stale closures in useEffect or useCallback?",
        "How would you design a secure JWT authentication system with short-lived access tokens and token rotation in HttpOnly cookies?"
      ],
      hr: [
        "Tell me about a challenging technical bug or architectural hurdle you faced in a project and how you systematically diagnosed it.",
        "How do you handle disagreements on technical design choices with team members or project leads?",
        "What motivates you to pursue a software engineering career, and how do you prioritize learning new frameworks versus deepening core fundamentals?"
      ]
    };

    const typeKey = interviewType === 'hr' ? 'hr' : 'technical';
    const list = questions[typeKey];
    const q = list[questionIndex % list.length];

    return {
      question: q,
      question_index: questionIndex,
      category: `${role} - ${interviewType.toUpperCase()}`,
      expected_focus_points: ['Conceptual clarity', 'Architectural trade-offs', 'Real-world practical examples'],
      provider: "deterministic-engine (built-in resilience)"
    };
  },

  localAnswerEvaluationFallback(question, answer, role, difficulty) {
    const words = answer.trim().split(/\s+/);
    const count = words.length;

    if (count < 10) {
      return {
        score: 35,
        metrics: { technical_accuracy: 35, clarity_communication: 40, depth_and_completeness: 30 },
        feedback: "Your response is too brief for an engineering interview. Structure your answer by defining the concept, explaining the mechanics, and providing an example.",
        strengths: ["Direct attempt"],
        areas_for_improvement: ["Elaborate on core mechanisms", "Provide real-world context"],
        model_ideal_answer: "Provide a 1-sentence definition, explain internal mechanics, and discuss practical architectural trade-offs.",
        provider: "deterministic-engine (built-in resilience)"
      };
    }

    const score = Math.min(94, 60 + Math.min(25, count * 0.6));
    return {
      score: Math.round(score),
      metrics: {
        technical_accuracy: Math.round(score),
        clarity_communication: 85,
        depth_and_completeness: Math.round(score * 0.95)
      },
      feedback: "Good response! You addressed the core requirements and communicated your thoughts coherently.",
      strengths: ["Clear technical articulation", "Appropriate terminology", "Addressed the primary question"],
      areas_for_improvement: ["Discuss edge cases or performance scalability limits", "Contrast with alternative approaches"],
      model_ideal_answer: `A strong answer directly defines the primary concepts in '${question.slice(0, 60)}...', explains how components interact under load, and mentions edge-case trade-offs.`,
      provider: "deterministic-engine (built-in resilience)"
    };
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
