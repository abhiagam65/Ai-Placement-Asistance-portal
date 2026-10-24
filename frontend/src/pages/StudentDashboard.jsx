import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScoreGauge } from '../components/common/ScoreGauge';
import {
  Sparkles,
  Brain,
  Code2,
  Mic,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Target,
  GraduationCap,
  Building2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (taskId) => {
    try {
      await api.patch(`/planner/tasks/${taskId}/toggle`);
      fetchDashboardData();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading student readiness metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'Unable to load dashboard.'}</span>
      </div>
    );
  }

  const { profile, readinessScore, scoreBreakdown, quickStats, upcomingDrives, recommendedTasks, recentActivity, announcements } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Announcements */}
      {announcements && announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40 border border-indigo-500/30 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Notice: {announcements[0].title}
              </span>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{announcements[0].content}</p>
            </div>
          </div>
          <Link
            to="/jobs"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            Explore <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Hero Welcome & Profile Readiness Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Student Profile Summary */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-3xl pointer-events-none"></div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/20">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Welcome, {user.name}!
                </h1>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{profile?.branch} • {profile?.college}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Target Role</span>
                <p className="text-xs font-bold text-indigo-300 truncate mt-0.5">{profile?.targetRole}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CGPA</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{profile?.cgpa?.toFixed(2)} / 10</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Batch</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{profile?.graduationYear}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Roll No</span>
                <p className="text-xs font-bold text-slate-300 truncate mt-0.5">{profile?.rollNumber || 'Not set'}</p>
              </div>
            </div>

            {/* Skills Pills */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Verified Skill Profile
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile?.skills?.slice(0, 7).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
                {profile?.skills?.length > 7 && (
                  <Link to="/profile" className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium hover:underline">
                    +{profile.skills.length - 7} more
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Next drive approaching in <strong className="text-white">9 days (Google SWE)</strong>
            </span>
            <div className="flex gap-2">
              <Link
                to="/resume"
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Scan Resume <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/interview"
                className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Mock Interview <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Col: Preparation Readiness Score Radial Gauge */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-between text-center relative">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Placement Readiness
            </span>
            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Live Index
            </span>
          </div>

          <div className="py-4">
            <ScoreGauge score={readinessScore} size={150} />
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-left pt-2 text-xs border-t border-slate-800/80">
            <div>
              <span className="text-slate-500 text-[10px]">Aptitude Acc:</span>
              <p className="font-bold text-slate-300">{scoreBreakdown.quizScore}%</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">DSA Solved:</span>
              <p className="font-bold text-slate-300">{quickStats.codingSolved} problems</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">Mock Interview:</span>
              <p className="font-bold text-slate-300">{scoreBreakdown.interviewScore}/100</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">ATS Score:</span>
              <p className="font-bold text-slate-300">{scoreBreakdown.resumeScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/aptitude" className="glass-card p-5 rounded-2xl space-y-3 block">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-0.5">
              Practice <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{quickStats.avgQuizScore}%</div>
            <p className="text-xs text-slate-400 mt-0.5">Avg Aptitude Accuracy ({quickStats.quizzesAttempted} quizzes)</p>
          </div>
        </Link>

        <Link to="/coding" className="glass-card p-5 rounded-2xl space-y-3 block">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              Solve <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{quickStats.codingSolved}</div>
            <p className="text-xs text-slate-400 mt-0.5">DSA Problems Solved</p>
          </div>
        </Link>

        <Link to="/interview" className="glass-card p-5 rounded-2xl space-y-3 block">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-0.5">
              Simulate <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{quickStats.avgInterviewScore || 80}/100</div>
            <p className="text-xs text-slate-400 mt-0.5">Mock Interview Avg ({quickStats.interviewsCompleted} sessions)</p>
          </div>
        </Link>

        <Link to="/jobs" className="glass-card p-5 rounded-2xl space-y-3 block">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-pink-400 flex items-center gap-0.5">
              Portal <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{quickStats.activeApplications}</div>
            <p className="text-xs text-slate-400 mt-0.5">Active Job Applications</p>
          </div>
        </Link>
      </div>

      {/* Middle Grid: Upcoming Drives + Recommended Study Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Placement Drives */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-white text-base">Upcoming Placement Drives</h2>
            </div>
            <Link to="/jobs" className="text-xs text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingDrives && upcomingDrives.length > 0 ? (
              upcomingDrives.map(drive => (
                <div
                  key={drive._id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={drive.company?.logo || 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=64'}
                      alt={drive.company?.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-200">{drive.title}</h3>
                      <p className="text-xs text-slate-400">{drive.company?.name} • <span className="text-indigo-300 font-semibold">{drive.ctc}</span></p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-3 h-3" />
                      {new Date(drive.deadline).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <Link
                        to="/jobs"
                        className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                      >
                        Details
                      </Link>
                      <a
                        href={drive.applyUrl || 'https://careers.google.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        Apply <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No upcoming drives scheduled currently.</p>
            )}
          </div>
        </div>

        {/* Recommended Tasks & Study Planner Checklist */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-white text-base">Recommended Prep Tasks</h2>
            </div>
            <Link to="/planner" className="text-xs text-purple-400 hover:underline font-semibold flex items-center gap-1">
              Study Planner <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recommendedTasks && recommendedTasks.length > 0 ? (
              recommendedTasks.map(task => (
                <div
                  key={task._id}
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task._id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        task.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <p className={`text-xs font-semibold ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Category: {task.category} • Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      task.priority === 'High'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : task.priority === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-semibold">All active tasks completed!</p>
                <Link to="/planner" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
                  Add more goals in Study Planner
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="font-bold text-white text-base">Recent Activity & Preparation Log</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((act, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="uppercase font-bold tracking-wider text-indigo-400">{act.type}</span>
                  <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="font-bold text-slate-200">{act.title}</div>
                <div className="text-slate-400 text-[11px]">{act.detail}</div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 col-span-3 text-center py-4">No recent activity recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
