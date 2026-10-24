import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Briefcase,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  MapPin,
  Loader2,
  FileText,
  Calendar,
  X,
  Sparkles,
  Check
} from 'lucide-react';

export const PlacementPortal = () => {
  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'applications'
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Application Modal state
  const [applyingJob, setApplyingJob] = useState(null);
  const [applicationNotes, setApplicationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'drives') {
        const res = await api.get('/jobs');
        if (res.success) setJobs(res.data);
      } else {
        const res = await api.get('/jobs/my-applications');
        if (res.success) setApplications(res.data);
      }
    } catch (err) {
      console.warn('Failed to load placement portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Quick apply from card: records application in campus portal, plays confetti, and opens real job portal
  const handleQuickApply = async (job) => {
    try {
      const res = await api.post(`/jobs/${job._id}/apply`, {
        notes: 'Applied via Placement Portal direct link.'
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      showToast(`Application registered for ${job.company?.name || 'Company'}! Opened official application page in new tab.`);
      fetchData();
    } catch (err) {
      console.warn('Quick apply recording notice:', err);
      // Still refresh in case already applied
      fetchData();
    }
  };

  // Submit from modal: records application with notes and opens real job portal
  const handleModalSubmit = async (e) => {
    if (!applyingJob) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/jobs/${applyingJob._id}/apply`, {
        notes: applicationNotes || 'Applied via Placement Portal with notes.'
      });

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast(`Application submitted for ${applyingJob.company?.name}! Redirecting to official application page.`);
      setApplyingJob(null);
      setApplicationNotes('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Application registration notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.name.toLowerCase().includes(search.toLowerCase()) ||
      j.role.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'all' || j.type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-indigo-950/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md text-white flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-100">Official Application Launched</p>
            <p className="text-slate-300 mt-0.5">{notification}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs text-pink-400 mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Campus Placement Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Placement Drives & Application Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse verified company drives with authentic career portal links, verify academic eligibility, and apply directly.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="glass-panel p-1.5 rounded-2xl flex gap-1 self-start">
          <button
            id="tab-active-drives"
            onClick={() => setActiveTab('drives')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'drives'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Drives ({jobs.length})
          </button>
          <button
            id="tab-my-applications"
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'applications'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Applications
          </button>
        </div>
      </div>

      {/* Tab 1: Active Drives */}
      {activeTab === 'drives' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or role..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Type:</span>
              {['all', 'Intern + FTE', 'Full-time', 'Internship'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    selectedType === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Drives Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading placement listings with real application links...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 relative"
                >
                  <div className="space-y-3">
                    {/* Top Row: Company Logo & Details */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={job.company?.logo || 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=64'}
                          alt={job.company?.name}
                          className="w-12 h-12 rounded-2xl object-cover bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <h3 className="font-bold text-base text-white">{job.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-indigo-300 font-semibold">{job.company?.name}</span>
                            <span className="text-slate-500">•</span>
                            <a
                              href={job.applyUrl || 'https://careers.google.com'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 font-medium"
                              title="Official Recruitment Page"
                            >
                              Official Portal <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {job.company?.tier || 'Tier 1'}
                      </span>
                    </div>

                    {/* CTC & Type pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        CTC: {job.ctc}
                      </span>
                      {job.stipend && (
                        <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
                          Stipend: {job.stipend}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium">
                        {job.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Real Application Link Card Info */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-[11px] text-slate-400 truncate">
                          Official Page: <span className="text-indigo-300 font-mono text-[10px] truncate">{job.applyUrl}</span>
                        </span>
                      </div>
                      <a
                        id={`visit-link-${job._id}`}
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="View Official Job Application Page"
                      >
                        Visit Link ↗
                      </a>
                    </div>

                    {/* Required Skills */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Required Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills?.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer: Eligibility & Action */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      {job.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Eligible for Drive
                        </span>
                      ) : (
                        <div className="text-[11px] text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{job.eligibilityReasons?.[0] || 'Ineligible'}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      {job.isApplied ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Applied ({job.applicationStatus || 'Applied'})
                          </span>
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
                            title="Revisit official career portal"
                          >
                            Open Portal <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Main Apply Button: Natively opens application link and registers application */}
                          <a
                            id={`apply-job-${job._id}`}
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleQuickApply(job)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all inline-flex items-center gap-1.5 group cursor-pointer ${
                              !job.isEligible ? 'opacity-40 pointer-events-none' : ''
                            }`}
                            title="Apply to drive and go directly to official job application page"
                          >
                            <span>Apply to Job</span>
                            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>

                          {/* Notes/Custom Modal trigger */}
                          {job.isEligible && (
                            <button
                              onClick={() => setApplyingJob(job)}
                              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                              title="Add custom cover notes before opening portal"
                            >
                              Notes
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Applications */}
      {activeTab === 'applications' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Your Submitted Placement Applications</h2>
              <p className="text-xs text-slate-400 mt-0.5">All applications recorded with direct access to official recruitment pages.</p>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{applications.length} Applications</span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No applications submitted yet.</p>
              <button
                onClick={() => setActiveTab('drives')}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                Browse active placement drives & apply now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const jobUrl = app.jobListing?.applyUrl || 'https://careers.google.com';
                return (
                  <div
                    key={app._id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.jobListing?.company?.logo || 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=64'}
                          alt={app.jobListing?.company?.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-white">{app.jobListing?.title}</h3>
                          <p className="text-xs text-slate-400">
                            {app.jobListing?.company?.name} • CTC: <span className="text-emerald-400 font-semibold">{app.jobListing?.ctc}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            app.status === 'Selected'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : app.status === 'Shortlisted' || app.status === 'OA Scheduled' || app.status === 'Interview Scheduled'
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              : app.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {app.status}
                        </span>

                        <a
                          href={jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1.5 transition-colors"
                          title="Open official company careers portal"
                        >
                          <span>Open Job Page</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                        Stage History & Admin Notes:
                      </span>
                      <div className="space-y-1.5 text-xs">
                        {app.statusHistory?.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-slate-300">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span className="font-semibold text-slate-200">{h.status}:</span>
                            <span className="text-slate-400">{h.notes}</span>
                            <span className="text-[10px] text-slate-500 ml-auto">
                              {new Date(h.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Apply Modal */}
      {applyingJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-lg w-full rounded-3xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Confirm Application & Launch Official Page</h3>
              </div>
              <button
                onClick={() => setApplyingJob(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                You are applying to <strong className="text-white">{applyingJob.company?.name}</strong> for the role of <strong className="text-indigo-300">{applyingJob.title}</strong>.
              </p>
              
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Package:</span>
                  <strong className="text-emerald-400">{applyingJob.ctc}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-200">{applyingJob.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Application Deadline:</span>
                  <span className="text-slate-200">{new Date(applyingJob.deadline).toLocaleDateString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Official Career Application URL:</span>
                  <a
                    href={applyingJob.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline break-all font-mono text-[11px] flex items-center gap-1"
                  >
                    <span>{applyingJob.applyUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Candidate Notes / Cover Highlights (Optional)
                </label>
                <textarea
                  rows={3}
                  value={applicationNotes}
                  onChange={(e) => setApplicationNotes(e.target.value)}
                  placeholder="Mention relevant capstone projects, availability, or tech stack alignment..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApplyingJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              
              {/* Native Anchor with onClick submission: opens official application page in new tab and submits application */}
              <a
                href={applyingJob.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleModalSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Submit & Open Application Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
