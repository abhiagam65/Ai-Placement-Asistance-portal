import os
import re
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai_service")

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

# -------------------------------------------------------------
# Common Helper & Fallback Knowledge Bases
# -------------------------------------------------------------
TECH_SKILLS_KEYWORDS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "rust",
    "react", "react.js", "next.js", "angular", "vue", "vue.js", "node", "node.js",
    "express", "express.js", "django", "flask", "spring", "spring boot", "fastapi",
    "html", "css", "tailwind", "bootstrap", "sass", "sql", "postgresql", "mysql",
    "mongodb", "redis", "cassandra", "sqlite", "oracle", "aws", "azure", "gcp",
    "docker", "kubernetes", "git", "github", "linux", "ci/cd", "jenkins", "graphql",
    "rest api", "microservices", "machine learning", "deep learning", "nlp", "computer vision",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "data structures",
    "algorithms", "object-oriented programming", "system design", "operating systems",
    "computer networks", "dbms"
]

SOFT_SKILLS_KEYWORDS = [
    "leadership", "communication", "teamwork", "collaboration", "problem solving",
    "critical thinking", "time management", "adaptability", "mentoring", "presentation",
    "ownership", "agile", "scrum"
]

INTERVIEW_QUESTION_BANK = {
    "frontend": {
        "technical": [
            "Explain the Virtual DOM in React and how reconciliation works with the Diffing algorithm.",
            "What is the Event Loop in JavaScript, and how do microtasks and macrotasks differ?",
            "How would you optimize the loading and rendering performance of a heavy Single Page Application?",
            "Explain CSS specificity and the modern CSS Box Model including box-sizing: border-box.",
            "What are React Hooks dependencies rules, and what leads to stale closures in useEffect or useCallback?"
        ],
        "hr": [
            "Tell me about a time you had a technical disagreement with a teammate. How did you resolve it?",
            "Describe a complex frontend bug you encountered under deadline pressure and how you diagnosed it.",
            "Why do you want to specialize in Frontend engineering, and how do you stay updated with rapid ecosystem changes?"
        ]
    },
    "backend": {
        "technical": [
            "Explain the difference between SQL and NoSQL databases. When would you choose MongoDB over PostgreSQL?",
            "What is database indexing? How does a B-Tree index work, and what are the trade-offs of having too many indexes?",
            "How do you design a robust rate limiter to protect backend APIs against DDoS or brute-force attacks?",
            "Explain ACID properties in transactional databases and how modern distributed databases handle CAP theorem trade-offs.",
            "How do you handle authentication securely in a distributed microservices environment?"
        ],
        "hr": [
            "Describe a situation where a production backend service crashed or slowed down. How did you prioritize your triage?",
            "How do you approach writing clean, maintainable backend code versus shipping quickly to meet a deadline?",
            "What motivates you to work on backend distributed systems and scalable infrastructure?"
        ]
    },
    "fullstack": {
        "technical": [
            "Walk me through what happens from the moment a user types a URL in their browser until the page finishes rendering.",
            "How would you implement secure JWT authentication with HttpOnly refresh cookies and access token rotation?",
            "Explain RESTful API best practices and how GraphQL compares in terms of over-fetching and caching.",
            "How would you architect a real-time collaborative application (like Google Docs or live chat) using WebSockets?",
            "What caching strategies (CDN, Redis, Browser cache) would you use across the frontend and backend stack?"
        ],
        "hr": [
            "Tell me about a complete end-to-end fullstack project you built. What was the hardest design decision you made?",
            "How do you balance frontend UI polish with backend reliability and database optimization?",
            "Where do you see yourself as a fullstack engineer in the next 3 to 5 years?"
        ]
    },
    "data_science": {
        "technical": [
            "Explain the bias-variance tradeoff in Machine Learning and methods you use to prevent overfitting.",
            "What is the difference between Bagging (e.g. Random Forest) and Boosting (e.g. XGBoost)?",
            "How do you handle imbalanced datasets when training classification models?",
            "Explain how the Attention mechanism in Transformers works and why it superseded traditional RNNs/LSTMs.",
            "What metrics would you choose to evaluate an anomaly detection system and why?"
        ],
        "hr": [
            "Describe a data project where your initial hypothesis was invalidated by the data. What did you learn?",
            "How do you explain complex mathematical or machine learning insights to non-technical stakeholders?",
            "What ethical considerations do you account for when training ML models on user data?"
        ]
    }
}

def call_gemini_api(prompt, system_instruction="You are an expert AI Placement Preparation & Career Guidance Advisor."):
    """Invokes Google Gemini API if GEMINI_API_KEY is available."""
    if not GEMINI_API_KEY:
        return None
    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\nTask:\n{prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw_text)
        else:
            logger.warning(f"Gemini API returned status {res.status_code}: {res.text}")
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
    return None

# -------------------------------------------------------------
# Deterministic Fallback Engines
# -------------------------------------------------------------
def analyze_resume_fallback(resume_text, job_description=""):
    text_lower = resume_text.lower()
    jd_lower = job_description.lower() if job_description else ""

    # Detect skills
    found_tech = [s for s in TECH_SKILLS_KEYWORDS if re.search(r'\b' + re.escape(s) + r'\b', text_lower)]
    found_soft = [s for s in SOFT_SKILLS_KEYWORDS if re.search(r'\b' + re.escape(s) + r'\b', text_lower)]

    # Sections check
    has_education = bool(re.search(r'(education|degree|b\.tech|bachelor|university|college|cgpa)', text_lower))
    has_projects = bool(re.search(r'(project|projects|developed|built|created|implemented)', text_lower))
    has_experience = bool(re.search(r'(experience|intern|internship|work history|employment)', text_lower))
    has_certifications = bool(re.search(r'(certification|certified|course|certificate)', text_lower))

    # Metric counts (numbers, percentages, dollar signs)
    has_metrics = len(re.findall(r'(\d+[\%xX\+]|\$\d+|\d+\s*users|\d+\s*ms)', resume_text))

    # Calculate transparent scores
    ats_score = 65
    if has_education: ats_score += 8
    if has_projects: ats_score += 10
    if len(found_tech) >= 5: ats_score += 10
    if len(found_soft) >= 2: ats_score += 7
    ats_score = min(96, ats_score)

    impact_score = min(92, 45 + (has_metrics * 7))
    skills_score = min(95, 40 + (len(found_tech) * 4))
    formatting_score = 82 if (has_education and has_projects) else 68
    overall_score = round((ats_score * 0.35) + (skills_score * 0.30) + (impact_score * 0.20) + (formatting_score * 0.15))

    # JD Comparison
    jd_tech = [s for s in TECH_SKILLS_KEYWORDS if re.search(r'\b' + re.escape(s) + r'\b', jd_lower)] if jd_lower else []
    matching_skills = [s for s in found_tech if s in jd_tech]
    missing_skills = [s for s in jd_tech if s not in found_tech]

    match_percentage = 0
    if jd_tech:
        match_percentage = round((len(matching_skills) / max(1, len(jd_tech))) * 100)
    else:
        # Default baseline if no JD supplied
        missing_skills = [s for s in ["docker", "ci/cd", "system design", "redis", "unit testing"] if s not in found_tech][:3]
        match_percentage = 74

    suggestions = []
    if not has_metrics or has_metrics < 2:
        suggestions.append("Quantify your project outcomes: Add measurable metrics such as latency reduction (e.g., 'reduced API response time by 35%') or user engagement.")
    if missing_skills:
        suggestions.append(f"Target JD Alignment: Consider building a mini-project demonstrating proficiency in: {', '.join(missing_skills[:4])}.")
    if not has_certifications:
        suggestions.append("Add verified certifications from AWS, Coursera, or Google Cloud to establish verified domain competency.")
    if len(found_tech) < 8:
        suggestions.append("Expand your Technical Skills matrix to include core fundamentals such as OS concepts, DBMS, and Git version control.")
    suggestions.append("Keep project descriptions action-oriented starting with strong verbs (Architected, Deployed, Engineered, Streamlined).")

    return {
        "candidate_summary": {
            "detected_technical_skills": found_tech[:18],
            "detected_soft_skills": found_soft[:8],
            "sections_present": {
                "education": has_education,
                "projects": has_projects,
                "experience": has_experience,
                "certifications": has_certifications
            }
        },
        "scoring": {
            "overall_score": overall_score,
            "ats_readability_score": ats_score,
            "skills_depth_score": skills_score,
            "impact_metrics_score": impact_score,
            "completeness_score": formatting_score,
            "scoring_rationale": "Scores are calculated using transparent structural heuristics: section completeness, technical keyword density, and quantified impact metrics."
        },
        "jd_match": {
            "has_target_jd": bool(jd_lower),
            "match_percentage": match_percentage,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "fit_verdict": "Strong Fit" if match_percentage >= 75 else ("Moderate Fit" if match_percentage >= 50 else "Requires Skill Bridging")
        },
        "actionable_suggestions": suggestions,
        "disclaimer": "This analysis provides structural and keyword guidance based on modern recruitment heuristics. No automated tool can guarantee bypassing ATS or securing interview invitations.",
        "provider": "deterministic-engine (offline/resilient fallback)"
    }

def evaluate_answer_fallback(question, answer, role="software_engineer", difficulty="medium"):
    words = answer.strip().split()
    word_count = len(words)
    answer_lower = answer.lower()

    # Search for technical terminology
    found_tech = [s for s in TECH_SKILLS_KEYWORDS if s in answer_lower]
    
    # Heuristic scoring
    if word_count < 10:
        score = 30
        clarity = 40
        accuracy = 30
        completeness = 25
        feedback = "The answer is very brief. In technical interviews, provide structured responses with technical depth, context, and examples."
        strengths = ["Prompt response"]
        improvements = ["Elaborate on core mechanisms", "Provide real-world code or architectural context"]
    elif word_count < 35:
        score = 65
        clarity = 70
        accuracy = 62
        completeness = 60
        feedback = "Good foundation, but lacks deeper explanation of trade-offs, edge cases, and architectural considerations."
        strengths = ["Directly addresses the question", "Clear tone"]
        improvements = ["Mention specific trade-offs or performance implications", "Structure using STAR (Situation, Task, Action, Result) or Definition -> Mechanics -> Example"]
    else:
        score = 84 + min(10, len(found_tech) * 2)
        score = min(95, score)
        clarity = 88
        accuracy = score
        completeness = 86
        feedback = "Solid, comprehensive response! You demonstrated good technical terminology and reasoned through the core concepts."
        strengths = ["Articulate explanation with appropriate terminology", "Demonstrated solid technical grasp", "Well-structured flow"]
        improvements = ["Highlight potential scalability constraints or alternative architectural choices"]

    return {
        "score": score,
        "metrics": {
            "technical_accuracy": accuracy,
            "clarity_communication": clarity,
            "depth_and_completeness": completeness
        },
        "feedback": feedback,
        "strengths": strengths,
        "areas_for_improvement": improvements,
        "model_ideal_answer": f"A standout answer to '{question}' begins with a concise 1-sentence definition, followed by the internal mechanism or architecture, practical trade-offs, and an example from a real-world scenario.",
        "provider": "deterministic-engine (offline/resilient fallback)"
    }

def career_roadmap_fallback(current_skills, target_role="Full Stack Developer", branch="Computer Engineering"):
    skills_list = [s.strip().lower() for s in current_skills if s.strip()]
    
    role_map = {
        "fullstack": {
            "title": "Full Stack Software Engineer",
            "required": ["javascript", "react", "node.js", "express", "mongodb", "postgresql", "docker", "git", "system design"],
            "projects": [
                {"name": "Real-time Collaboration Platform", "stack": "React, Node.js, WebSockets, Redis", "difficulty": "Advanced"},
                {"name": "Multi-Tenant E-Commerce Portal", "stack": "Next.js, Express, PostgreSQL, Stripe", "difficulty": "Intermediate"},
                {"name": "Microservices Task Pipeline", "stack": "Docker, RabbitMQ, Go/Node, MongoDB", "difficulty": "Advanced"}
            ]
        },
        "frontend": {
            "title": "Frontend Engineer",
            "required": ["javascript", "typescript", "react", "next.js", "tailwind", "redux", "performance optimization", "testing"],
            "projects": [
                {"name": "Interactive Analytics Dashboard", "stack": "React, TypeScript, Recharts, Tailwind", "difficulty": "Intermediate"},
                {"name": "Component Design System", "stack": "Storybook, React, Rollup, NPM package", "difficulty": "Advanced"}
            ]
        },
        "backend": {
            "title": "Backend Distributed Systems Engineer",
            "required": ["python", "java", "node.js", "postgresql", "redis", "docker", "microservices", "kubernetes", "system design"],
            "projects": [
                {"name": "High-Throughput URL Shortener with Analytics", "stack": "Go / Node.js, Redis, PostgreSQL, Docker", "difficulty": "Intermediate"},
                {"name": "Distributed Job Scheduler", "stack": "Python, Celery, RabbitMQ, Docker", "difficulty": "Advanced"}
            ]
        },
        "data_science": {
            "title": "Data Scientist / AI Engineer",
            "required": ["python", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "sql", "data structures"],
            "projects": [
                {"name": "End-to-End Predictive Analytics Pipeline", "stack": "FastAPI, Scikit-Learn, Streamlit, Docker", "difficulty": "Intermediate"},
                {"name": "RAG-Powered Document Q&A Agent", "stack": "LangChain, ChromaDB, HuggingFace, Python", "difficulty": "Advanced"}
            ]
        }
    }

    key = "fullstack"
    target_clean = target_role.lower()
    if "front" in target_clean: key = "frontend"
    elif "back" in target_clean: key = "backend"
    elif "data" in target_clean or "ai" in target_clean or "ml" in target_clean: key = "data_science"

    info = role_map[key]
    have = [s for s in info["required"] if any(h in s or s in h for h in skills_list)]
    need = [s for s in info["required"] if not any(h in s or s in h for h in skills_list)]
    
    match_pct = round((len(have) / max(1, len(info["required"]))) * 100)

    weeks = [
        {"week": "Weeks 1-2", "focus": "Foundations & Core Language Mastery", "actions": ["Deep dive into asynchronous paradigms, memory management, and data structures.", "Solve 15 targeted LeetCode medium problems."]},
        {"week": "Weeks 3-4", "focus": "Frameworks & Clean Architecture", "actions": ["Master idiomatic design patterns, component modularity, and state management.", "Build an isolated architectural prototype."]},
        {"week": "Weeks 5-6", "focus": "Databases, Indexing & API Design", "actions": ["Study relational normalization vs document schema modeling.", "Write optimized queries, understand indexing B-trees and caching with Redis."]},
        {"week": "Weeks 7-8", "focus": "Capstone Project Engineering", "actions": [f"Develop {info['projects'][0]['name']} with comprehensive documentation and unit tests.", "Set up automated CI/CD with GitHub Actions."]},
        {"week": "Weeks 9-10", "focus": "System Design & Scalability", "actions": ["Read 'Designing Data-Intensive Applications' chapters on partitioning, replication, and consensus.", "Practice whiteboard design for rate limiters and chat services."]},
        {"week": "Weeks 11-12", "focus": "Mock Interviews & Placement Readiness", "actions": ["Conduct 5 timed mock technical interviews.", "Polish resume with quantifiable project achievements and target job descriptions."]}
    ]

    resources = [
        {"title": "roadmap.sh Developer Roadmaps", "type": "Interactive Guides", "url": "https://roadmap.sh"},
        {"title": "NeetCode DSA Placement Roadmap", "type": "Problem Set", "url": "https://neetcode.io"},
        {"title": "Full Stack Open (University of Helsinki)", "type": "Course", "url": "https://fullstackopen.com/en/"},
        {"title": "System Design Primer by Donne Martin", "type": "GitHub Repository", "url": "https://github.com/donnemartin/system-design-primer"}
    ]

    return {
        "target_role": info["title"],
        "match_percentage": match_pct,
        "current_skills": skills_list,
        "possessed_skills": have,
        "skill_gaps": need,
        "roadmap_milestones": weeks,
        "suggested_projects": info["projects"],
        "curated_resources": resources,
        "provider": "deterministic-engine (offline/resilient fallback)"
    }

# -------------------------------------------------------------
# REST API Endpoints
# -------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health_check():
    provider = "gemini-1.5-flash" if GEMINI_API_KEY else "deterministic-engine (offline-ready)"
    return jsonify({
        "status": "healthy",
        "service": "AI-Placement-Engine",
        "llm_key_configured": bool(GEMINI_API_KEY or OPENAI_API_KEY),
        "active_provider": provider
    }), 200

@app.route("/api/ai/resume-analyze", methods=["POST"])
def analyze_resume():
    data = request.get_json(silent=True) or {}
    resume_text = data.get("resume_text", "").strip()
    job_description = data.get("job_description", "").strip()

    if not resume_text:
        return jsonify({"error": "resume_text is required for analysis."}), 400

    if GEMINI_API_KEY:
        prompt = f"""
        Analyze the following student resume for placement readiness and compare with the optional target job description.
        Return a strict JSON object with fields:
        candidate_summary: {{ detected_technical_skills: [], detected_soft_skills: [], sections_present: {{ education: bool, projects: bool, experience: bool, certifications: bool }} }},
        scoring: {{ overall_score: int(0-100), ats_readability_score: int(0-100), skills_depth_score: int(0-100), impact_metrics_score: int(0-100), completeness_score: int(0-100), scoring_rationale: string }},
        jd_match: {{ has_target_jd: bool, match_percentage: int(0-100), matching_skills: [], missing_skills: [], fit_verdict: string }},
        actionable_suggestions: [list of 4-5 concrete improvements],
        disclaimer: "This analysis provides structural and keyword guidance based on modern recruitment heuristics. No automated tool can guarantee bypassing ATS or securing interview invitations."

        Resume Text:
        {resume_text[:4000]}

        Target Job Description:
        {job_description[:2000]}
        """
        gemini_result = call_gemini_api(prompt)
        if gemini_result:
            gemini_result["provider"] = "gemini-1.5-flash"
            return jsonify(gemini_result), 200

    # Fallback
    fallback_res = analyze_resume_fallback(resume_text, job_description)
    return jsonify(fallback_res), 200

@app.route("/api/ai/generate-interview-question", methods=["POST"])
def generate_interview_question():
    data = request.get_json(silent=True) or {}
    role = data.get("role", "fullstack").lower().replace(" ", "_")
    interview_type = data.get("interview_type", "technical").lower()
    difficulty = data.get("difficulty", "medium").lower()
    index = data.get("question_index", 0)

    category = "fullstack"
    for k in INTERVIEW_QUESTION_BANK.keys():
        if k in role:
            category = k
            break

    # If LLM is active
    if GEMINI_API_KEY:
        prompt = f"""
        Generate interview question #{index + 1} for a {difficulty}-level {interview_type} mock interview for the role of {role}.
        Return strict JSON with:
        question: string,
        category: string,
        expected_focus_points: [list of key concepts candidate should mention]
        """
        gemini_result = call_gemini_api(prompt)
        if gemini_result:
            gemini_result["provider"] = "gemini-1.5-flash"
            gemini_result["question_index"] = index
            return jsonify(gemini_result), 200

    # Fallback to curated question bank
    type_key = "hr" if interview_type == "hr" else "technical"
    questions = INTERVIEW_QUESTION_BANK.get(category, INTERVIEW_QUESTION_BANK["fullstack"])[type_key]
    selected_q = questions[index % len(questions)]

    return jsonify({
        "question": selected_q,
        "question_index": index,
        "category": f"{role.replace('_', ' ').title()} - {interview_type.upper()}",
        "expected_focus_points": ["Conceptual understanding", "Trade-offs and architectural rationale", "Clear structured communication"],
        "provider": "deterministic-engine (offline/resilient fallback)"
    }), 200

@app.route("/api/ai/evaluate-answer", methods=["POST"])
def evaluate_answer():
    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()
    answer = data.get("answer", "").strip()
    role = data.get("role", "Software Engineer")
    difficulty = data.get("difficulty", "medium")

    if not question or not answer:
        return jsonify({"error": "Both question and answer are required for evaluation."}), 400

    if GEMINI_API_KEY:
        prompt = f"""
        Evaluate candidate's answer for an engineering mock interview.
        Role: {role}, Difficulty: {difficulty}
        Question: {question}
        Candidate Answer: {answer}

        Return strict JSON:
        score: int(0-100),
        metrics: {{ technical_accuracy: int(0-100), clarity_communication: int(0-100), depth_and_completeness: int(0-100) }},
        feedback: string,
        strengths: [list of 2-3 points],
        areas_for_improvement: [list of 2-3 points],
        model_ideal_answer: string
        """
        gemini_result = call_gemini_api(prompt)
        if gemini_result:
            gemini_result["provider"] = "gemini-1.5-flash"
            return jsonify(gemini_result), 200

    fallback_eval = evaluate_answer_fallback(question, answer, role, difficulty)
    return jsonify(fallback_eval), 200

@app.route("/api/ai/career-roadmap", methods=["POST"])
def generate_career_roadmap():
    data = request.get_json(silent=True) or {}
    current_skills = data.get("current_skills", [])
    target_role = data.get("target_role", "Full Stack Developer")
    branch = data.get("branch", "Computer Engineering")

    if GEMINI_API_KEY:
        prompt = f"""
        Generate a personalized career roadmap for a student in {branch} aiming to become a {target_role}.
        Current Skills: {', '.join(current_skills)}

        Return strict JSON with:
        target_role: string,
        match_percentage: int(0-100),
        current_skills: list,
        possessed_skills: list,
        skill_gaps: list of missing technologies,
        roadmap_milestones: [list of 6 milestones with week: string, focus: string, actions: [list of 2 items]],
        suggested_projects: [list of 3 projects with name, stack, difficulty],
        curated_resources: [list of 4 resources with title, type, url]
        """
        gemini_result = call_gemini_api(prompt)
        if gemini_result:
            gemini_result["provider"] = "gemini-1.5-flash"
            return jsonify(gemini_result), 200

    fallback_roadmap = career_roadmap_fallback(current_skills, target_role, branch)
    return jsonify(fallback_roadmap), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    logger.info(f"Starting AI service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
