import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  FileCheck2,
  Mic,
  Brain,
  Code2,
  Compass,
  Briefcase,
  CheckCircle2,
  Cpu,
  BarChart3,
  TrendingUp,
  Layers
} from 'lucide-react';

export const LandingPage = () => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (role) => {
    try {
      if (role === 'admin') {
        await login('admin@placement.edu', 'Admin@123');
        navigate('/admin');
      } else {
        await login('student@placement.edu', 'Student@123');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Quick login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg lg:text-xl tracking-tight text-white">
                NextGen<span className="text-gradient">Placement</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-medium">
                • B.Tech Final Year Engineering Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? "/admin" : "/dashboard"}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  Register <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden flex-1 flex flex-col justify-center">
        {/* Glow ambient background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[200px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-indigo-500/30 text-xs text-indigo-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>AI-Driven Placement Preparation System for Final-Year Engineers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.15]">
            Master Campus Placements with <span className="text-gradient">Intelligent AI Guidance</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            A comprehensive, end-to-end placement suite featuring ATS resume analysis, dynamic mock interviews, timed aptitude drills, curated DSA coding practice, and live placement drive tracking.
          </p>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleQuickLogin('student')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
            >
              <GraduationCap className="w-5 h-5" />
              <span>Launch Student Demo Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold glass-panel hover:bg-slate-800 text-amber-300 border border-amber-500/30 shadow-lg transition-all flex items-center justify-center gap-2.5"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Launch Placement Admin Portal</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No setup required (Pre-seeded Demo)
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Google, Microsoft & TCS sample drives
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resilient offline/online AI engine
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">AI Resume Analyzer</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload PDF resumes, extract technical skills, verify ATS readability heuristics, compare against target JDs, and receive concrete, actionable improvement suggestions.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Mic className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">AI Mock Interview Room</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience turn-by-turn technical and HR mock interviews with real-time scoring on technical depth, clarity, and completeness, complete with model ideal answers.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Brain className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Aptitude Practice Engine</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Timed speed quizzes across Quantitative Aptitude, Logical Reasoning, and Verbal Ability with step-by-step mathematical explanations and accuracy tracking.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Code2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Coding Sandbox & DSA</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Solve top campus interview DSA problems in JavaScript, Python, C++, and Java with an isolated timeout-protected runner and automated test case evaluation.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">12-Week Career Roadmap</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Personalized skill-gap analysis comparing your current skills against industry roles, recommending portfolio projects, and providing curated learning milestones.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Placement Drive Tracker</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              View company profiles, package details (CTC), automated CGPA eligibility checks, application status workflows (Applied, Shortlisted, Selected), and deadlines.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        <p>AI-Powered Placement Preparation & Career Guidance Portal • Final Year Computer Engineering Project</p>
      </footer>
    </div>
  );
};
