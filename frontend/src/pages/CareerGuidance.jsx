import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  BookOpen,
  Calendar,
  ExternalLink,
  Target,
  Loader2,
  Layers
} from 'lucide-react';

export const CareerGuidance = () => {
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuidance(targetRole);
  }, [targetRole]);

  const fetchGuidance = async (role) => {
    try {
      setLoading(true);
      const res = await api.get(`/career/roadmap?targetRole=${encodeURIComponent(role)}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load career guidance:', err);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    'Full Stack Software Engineer',
    'Frontend Engineer',
    'Backend Distributed Systems',
    'Data Scientist / AI Engineer'
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>AI Career Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Personalized Career Roadmap & Skill Gap
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data-backed career milestone planning customized to your engineering branch, CGPA, and aspirational roles.
          </p>
        </div>

        {/* AI Provider Badge */}
        {data && (
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 self-start">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Generation:</span>
            <span className="text-emerald-400 font-semibold">{data.guidance?.provider}</span>
          </div>
        )}
      </div>

      {/* Role Selector Tabs */}
      <div className="glass-panel p-2 rounded-2xl flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setTargetRole(r)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              targetRole === r
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Synthesizing personalized 12-week roadmap...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in">
          {/* Skill Gap Analysis Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Skill Gap & Role Readiness Matrix</h2>
                <p className="text-xs text-slate-400">
                  Target: <strong className="text-slate-200">{data.guidance.target_role}</strong> • Branch: {data.studentContext.branch} (CGPA: {data.studentContext.cgpa})
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Readiness Match</span>
                <span className="text-2xl font-black text-emerald-400">
                  {data.guidance.match_percentage}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Acquired Skills */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Skills You Already Possess
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.guidance.possessed_skills?.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Target Gaps to Bridge
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.guidance.skill_gaps?.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 12-Week Structured Roadmap */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">12-Week Strategic Preparation Milestones</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.guidance.roadmap_milestones?.map((milestone, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {milestone.week}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">Phase {idx + 1}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-100">{milestone.focus}</h3>

                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {milestone.actions?.map((act, aIdx) => (
                      <li key={aIdx} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Capstone Projects & Resources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suggested Projects */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Recommended Capstone Projects</h2>
              </div>

              <div className="space-y-3">
                {data.guidance.suggested_projects?.map((proj, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-200">{proj.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {proj.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">Stack: {proj.stack}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Curated Resources */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Curated Engineering Resources</h2>
              </div>

              <div className="space-y-3">
                {data.guidance.curated_resources?.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between gap-3 group transition-all block"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors">
                        {res.title}
                      </h3>
                      <span className="text-xs text-slate-500">{res.type}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
