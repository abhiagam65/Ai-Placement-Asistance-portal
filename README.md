# AI-Powered Placement Preparation & Career Guidance Portal
> **Final-Year Computer Engineering Capstone Project**  
> A modern, full-stack, AI-driven recruitment preparation and campus placement governance platform.

---

## 🌟 Executive Summary
The **AI-Powered Placement Preparation & Career Guidance Portal** is a production-grade web platform engineered to bridge the gap between academic curriculum and high-tier software engineering hiring benchmarks (Google, Microsoft, Amazon, TCS Digital, Goldman Sachs).

It empowers **Students** with automated ATS resume scans, interactive AI mock technical/behavioral interviews, timed aptitude mastery tests, an isolated code sandbox for DSA problem solving, and personalized 12-week roadmaps. Simultaneously, it equips **Placement Officers / Admins** with a centralized command center to orchestrate placement drives, enforce CGPA and branch eligibility rules, monitor cohort preparedness indexes, and broadcast campus notices.

---

## 🏗️ Multi-Tier System Architecture

```mermaid
graph TD
    UserClient["Student / Admin Browser (React 19 + Vite 8 + Tailwind CSS)"]
    API["REST Gateway (Node.js 24 + Express 4)"]
    DB[(MongoDB Atlas / In-Memory MongoDB Fallback)]
    AIService["AI Microservice (Python 3.14 + Flask)"]
    ExternalLLM["Google Gemini 1.5 Flash / OpenAI API"]
    LocalFallback["Deterministic Heuristic NLP Engine"]

    UserClient -->|HTTP / JSON / JWT| API
    API -->|Mongoose ODM| DB
    API -->|Proxy AI Requests| AIService
    AIService -->|Live LLM Inference| ExternalLLM
    AIService -->|Graceful Offline Fallback| LocalFallback
```

### Technology Stack
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React, Recharts, Canvas Confetti.
- **Backend API**: Node.js v24, Express.js 4, Mongoose 8, JWT, BcryptJS, Multer, PDF-Parse, Express Rate Limit.
- **Database Resilience**: Connects to external MongoDB (`MONGO_URI`) or automatically boots an embedded in-memory MongoDB server via `mongodb-memory-server` if local MongoDB is offline.
- **AI Microservice**: Python 3.14 Flask service with hybrid Gemini 1.5 Flash API connector and deterministic NLP heuristic algorithms.
- **Code Execution**: Node.js `vm` isolated sandbox with timeout and memory constraints (strictly preventing execution of arbitrary OS shell commands).

---

## 👥 User Roles & Seeded Demo Accounts

The database is pre-seeded with realistic student records, company listings, active job drives, aptitude questions, and DSA challenges:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@placement.edu` | `Student@123` | Dashboard, Resume Analyzer, Mock Interview, Aptitude, Coding, Career, Jobs, Planner, Analytics |
| **Admin** | `admin@placement.edu` | `Admin@123` | Student Directory, Placement Drives, Applications Pipeline, Company Management, Question Bank |

*(Both accounts are pre-filled on the Login screen via 1-click quick-fill buttons).*

---

## 📦 Modules & Capabilities

### 1. Student Modules
1. **Executive Dashboard**: Real-time Preparation Readiness Index (0-100% radial gauge), academic stats (CGPA 8.75), upcoming placement drives countdown, recommended preparation tasks, and live activity timeline.
2. **AI Resume Analyzer**: Supports drag-and-drop PDF/DOCX/TXT file uploads (up to 5MB), extracts candidate technical and soft skills, verifies section completeness, benchmarks against a user-provided target Job Description, and generates actionable improvements with an honest, transparent ATS scoring breakdown.
3. **AI Mock Interview Room**: Step-by-step technical and HR interview scenarios across Frontend, Backend, Full Stack, and Data Science. Accepts typed answers or microphone speech dictation (Web Speech API), gives real-time grading on technical accuracy, clarity, and completeness, and provides model ideal answers.
4. **Aptitude Practice Engine**: Timed speed drills across Quantitative Aptitude, Logical Reasoning, and Verbal Ability with real-time countdown timer, radio options, automatic scoring, and detailed step-by-step mathematical explanations.
5. **Coding Sandbox (DSA)**: Curated placement challenge catalog (Easy, Medium, Hard). Split-view workspace featuring problem description, constraints, hints, code editor supporting JavaScript, Python, C++, and Java, and an isolated timeout sandbox runner (1500ms safety limit).
6. **AI Career Guidance**: Dynamic 12-week strategic preparation milestones, skill-gap analysis, recommended capstone projects, and curated learning resources.
7. **Placement Drive Portal**: Active company listings with CTC packages, automatic CGPA and branch eligibility indicators, one-click application modal, and application status pipeline tracker.
8. **Study Planner**: Daily and weekly preparation task checklist with priorities (High, Medium, Low), due dates, and completion progress bar.
9. **Analytics**: Interactive Recharts displaying interview competency radar, aptitude accuracy by domain, DSA problems solved vs target, and score trajectories over time.

### 2. Admin Module
1. **Cohort Overview**: Aggregate statistics for total candidates, companies, active drives, total applications, and cohort average CGPA.
2. **Student Directory**: Searchable, filterable candidate database with roll numbers, branch filters, and preparation scores.
3. **Drives & Jobs Manager**: Create new campus placement listings with CTC, allowed branches, minimum CGPA, and application deadlines.
4. **Applications Pipeline**: Review candidate submissions and transition statuses (Applied, Shortlisted, OA Scheduled, Selected, Rejected) with feedback notes.
5. **Question Bank Manager**: Add new questions to the Aptitude question bank with multiple choices, correct answer keys, and derivations.
6. **Broadcaster**: Publish announcements and urgent campus placement notices.

---

## 🚀 Windows Installation & Run Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **Python**: v3.9 or higher (`python --version`)

### Quick 1-Click Startup (Recommended)
Double-click `start-all.bat` (or run `start-all.ps1` in PowerShell) in the root directory:
```powershell
.\start-all.ps1
```
This automatically boots all 3 services in separate terminal windows.

---

### Manual Step-by-Step Startup

#### Terminal 1: Python AI Microservice
```powershell
cd ai-service
pip install -r requirements.txt
python app.py
```
> Running on: `http://localhost:5001`

#### Terminal 2: Node.js Express REST Backend
```powershell
cd backend
npm install
npm start
```
> Running on: `http://localhost:5000`  
> *(If local MongoDB is not running, the backend seamlessly launches an in-memory MongoDB instance).*

#### Terminal 3: React Vite Frontend
```powershell
cd frontend
npm install
npm run dev
```
> Running on: `http://localhost:5173`

---

## 🔑 Environment Variables Configuration

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/placement_portal
JWT_SECRET=ai_placement_portal_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:5001
```

### AI Service (`ai-service/.env`)
```env
PORT=5001
# Optional: Add Google Gemini API Key for live LLM inference.
# If omitted, the service runs its deterministic heuristic NLP engine.
GEMINI_API_KEY=
OPENAI_API_KEY=
```

---

## 🧪 Automated Testing Verification

The backend includes automated tests covering authentication, password hashing, JWT generation, role-based authorization, secure sandbox timeout isolation, and AI heuristic scoring.

Run the test suite:
```powershell
cd backend
npm test
```

### Test Results Summary:
```
========================================================
🧪 Running AI Placement Portal Automated Test Suite
========================================================

  ✅ PASS: Password Hashing & Verification via bcrypt
  ✅ PASS: JWT Token Signing and Decoding
  ✅ PASS: Role-Based Authorization Enforcement
  ✅ PASS: Secure Sandbox Code Runner: Correct Two Sum solution
  ✅ PASS: Secure Sandbox Code Runner: Incorrect Logic Handling
  ✅ PASS: Secure Sandbox Execution: Infinite Loop Timeout Guard
  ✅ PASS: AI Resume Analyzer Deterministic Heuristics & ATS Scoring
  ✅ PASS: Mock Interview Answer Evaluation Quality Grading

========================================================
📊 Test Summary: 8 Passed, 0 Failed
========================================================
```

---

## 🔒 Security & Sandboxing Architecture
- **Password Protection**: Salted Bcrypt hashing with pre-save Mongoose hooks.
- **RBAC**: Multi-level JWT bearer token validation enforcing strict student and administrator separation.
- **Sandbox Isolation**: Student DSA code is evaluated within Node's isolated `vm` context with strict timeouts (1500ms) and nullified OS globals (`process`, `fs`, `child_process`, `eval` restricted).
- **File Upload Protection**: In-memory Multer buffer scanning with mime-type and 5MB size limits.
- **Honest AI Disclosure**: Real-time labeling of whether analysis was generated via live LLM or deterministic fallback algorithms.
"# Ai-Placement-Asistance-portal" 
"# Ai-Placement-Asistance-portal" 
