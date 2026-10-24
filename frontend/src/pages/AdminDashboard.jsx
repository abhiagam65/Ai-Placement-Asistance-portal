import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  Users,
  Building2,
  Briefcase,
  HelpCircle,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  Filter,
  Loader2,
  X,
  FileText
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'jobs' | 'applications' | 'companies' | 'questions'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Students state
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranch, setStudentBranch] = useState('all');

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);

  // Modals state
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // Forms
  const [jobForm, setJobForm] = useState({
    company: '',
    title: '',
    role: '',
    ctc: '14 - 18 LPA',
    stipend: '₹50,000 / month',
    location: 'Bengaluru / Hybrid',
    type: 'Intern + FTE',
    minCgpa: '7.5',
    allowedBranches: 'Computer Engineering, Information Technology',
    maxBacklogs: '0',
    requiredSkills: 'JavaScript, React, Node.js, SQL',
    description: '',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    openings: '10',
    applyUrl: 'https://careers.google.com'
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    industry: 'Cloud & Consumer Technology',
    website: 'https://',
    tier: 'Tier 1 Product',
    location: 'Bengaluru',
    description: ''
  });

  const [questionForm, setQuestionForm] = useState({
    category: 'quantitative',
    topic: 'Percentages & Arithmetic',
    difficulty: 'medium',
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: '0',
    explanation: ''
  });

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    type: 'Placement Drive',
    companyName: '',
    isPinned: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, compRes, jobsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/companies'),
        api.get('/admin/jobs')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (compRes.success) {
        setCompanies(compRes.data);
        if (compRes.data.length > 0 && !jobForm.company) {
          setJobForm(prev => ({ ...prev, company: compRes.data[0]._id }));
        }
      }
      if (jobsRes.success) setJobs(jobsRes.data);

      if (activeTab === 'students' || activeTab === 'overview') {
        const stdRes = await api.get(`/admin/students?branch=${studentBranch}&search=${studentSearch}`);
        if (stdRes.success) setStudents(stdRes.data);
      }

      if (activeTab === 'applications') {
        const appRes = await api.get('/admin/applications');
        if (appRes.success) setApplications(appRes.data);
      }
    } catch (err) {
      console.warn('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    const notes = prompt(`Enter status update note for candidate:`, `Status updated to ${newStatus}`);
    if (notes === null) return;

    try {
      const res = await api.patch(`/admin/applications/${appId}/status`, {
        status: newStatus,
        notes
      });
      if (res.success) {
        alert(res.message);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/admin/jobs', jobForm);
      if (res.success) {
        alert('Placement job drive created & broadcasted to students!');
        setShowJobModal(false);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to create job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/admin/companies', companyForm);
      if (res.success) {
        alert('Company registered successfully.');
        setShowCompanyModal(false);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to add company.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/admin/questions', {
        ...questionForm,
        correctOptionIndex: Number(questionForm.correctOptionIndex)
      });
      if (res.success) {
        alert('Question added to Aptitude Question Bank!');
        setShowQuestionModal(false);
        setQuestionForm({
          category: 'quantitative',
          topic: '',
          difficulty: 'medium',
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: '0',
          explanation: ''
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to add question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/admin/announcements', noticeForm);
      if (res.success) {
        alert('Announcement broadcasted to campus portal!');
        setShowNoticeModal(false);
        setNoticeForm({ title: '', content: '', type: 'Placement Drive', companyName: '', isPinned: true });
      }
    } catch (err) {
      alert(err.message || 'Failed to publish notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Placement Officer & Department Dean Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Placement Administration Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor student placement readiness, launch campus recruitment drives, review applications, and manage question banks.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 self-start">
          <button
            onClick={() => setShowJobModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Post Job Drive
          </button>
          <button
            onClick={() => setShowNoticeModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md flex items-center gap-1.5"
          >
            <Megaphone className="w-4 h-4" /> Broadcast Notice
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-card p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Students</span>
            <div className="text-2xl font-black text-white">{stats.totalStudents}</div>
            <p className="text-[10px] text-indigo-400">Registered</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Companies</span>
            <div className="text-2xl font-black text-cyan-400">{stats.totalCompanies}</div>
            <p className="text-[10px] text-slate-400">Onboarded</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Drives</span>
            <div className="text-2xl font-black text-emerald-400">{stats.activeJobs}</div>
            <p className="text-[10px] text-slate-400">Current Openings</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Applications</span>
            <div className="text-2xl font-black text-purple-400">{stats.totalApplications}</div>
            <p className="text-[10px] text-slate-400">Submitted</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avg Readiness</span>
            <div className="text-2xl font-black text-amber-400">{stats.averageReadinessScore}%</div>
            <p className="text-[10px] text-slate-400">Cohort Index</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avg CGPA</span>
            <div className="text-2xl font-black text-pink-400">{stats.averageCgpa}</div>
            <p className="text-[10px] text-slate-400">Department Avg</p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="glass-panel p-1.5 rounded-2xl flex flex-wrap gap-1">
        {[
          { id: 'overview', name: 'Cohort Overview & Students' },
          { id: 'jobs', name: `Placement Drives (${jobs.length})` },
          { id: 'applications', name: 'Applications Pipeline' },
          { id: 'companies', name: `Companies (${companies.length})` },
          { id: 'questions', name: 'Question Bank Manager' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab 1: Cohort Overview & Students */}
      {activeTab === 'overview' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Registered Candidate Profiles</h2>
            <div className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="Search by student name or roll no..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAdminData()}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs w-60"
              />
              <button
                onClick={fetchAdminData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Branch</th>
                  <th className="pb-3">CGPA</th>
                  <th className="pb-3">Readiness Index</th>
                  <th className="pb-3">Aptitude & DSA</th>
                  <th className="pb-3">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {students.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-200">
                      <div>{st.user?.name}</div>
                      <div className="text-[10px] text-slate-400">{st.user?.email}</div>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">{st.rollNumber || 'N/A'}</td>
                    <td className="py-3 text-slate-400">{st.branch}</td>
                    <td className="py-3 font-bold text-emerald-400">{st.cgpa?.toFixed(2)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {st.preparationScore}%
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      Quiz: {st.stats?.quizzesAverageScore}% • Solved: {st.stats?.codingProblemsSolved}
                    </td>
                    <td className="py-3 text-slate-300 font-semibold">
                      {st.stats?.applicationsSubmitted || 0} applied
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Placement Drives & Jobs */}
      {activeTab === 'jobs' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Placement Drives Directory</h2>
            <button
              onClick={() => setShowJobModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Post New Drive
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {jobs.map((j) => (
              <div key={j._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{j.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                      {j.status}
                    </span>
                  </div>
                  <p className="text-slate-400">
                    Company: <strong className="text-slate-200">{j.company?.name}</strong> • CTC: <strong className="text-emerald-400">{j.ctc}</strong> • Min CGPA: {j.eligibility?.minCgpa}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Deadline: {new Date(j.deadline).toLocaleDateString()} • Openings: {j.openings}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-indigo-400 block">
                    {j.applicantsCount} Applicants
                  </span>
                  <button
                    onClick={() => { setActiveTab('applications'); }}
                    className="text-xs text-slate-400 hover:text-white underline mt-0.5"
                  >
                    View Applicants
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Applications Pipeline */}
      {activeTab === 'applications' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Student Application Pipeline</h2>
            <span className="text-xs text-slate-400">{applications.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Job Listing</th>
                  <th className="pb-3">Resume</th>
                  <th className="pb-3">Current Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-200">
                      <div>{app.user?.name}</div>
                      <div className="text-[10px] text-slate-400">{app.user?.email}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-white font-semibold">{app.jobListing?.title}</div>
                      <div className="text-[10px] text-slate-400">{app.jobListing?.company?.name}</div>
                    </td>
                    <td className="py-3 text-indigo-300 font-mono text-[11px]">
                      {app.resumeUrl || 'Standard Profile'}
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app._id, e.target.value)}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="OA Scheduled">OA Scheduled</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Selected">Selected ✓</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Companies */}
      {activeTab === 'companies' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Recruiting Companies Directory</h2>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Register Company
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <div key={c._id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={c.logo || 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=64'}
                    alt={c.name}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-white">{c.name}</h3>
                    <span className="text-[10px] text-indigo-400 font-semibold">{c.tier}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{c.industry} • {c.location}</p>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                  {c.jobCount || 0} Placement listings created
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Question Bank Manager */}
      {activeTab === 'questions' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4 max-w-2xl">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Add Aptitude Practice Question</h2>
            <p className="text-xs text-slate-400">Expand the quantitative, logical, or verbal question database with solutions.</p>
          </div>

          <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={questionForm.category}
                  onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="quantitative">Quantitative Aptitude</option>
                  <option value="logical">Logical Reasoning</option>
                  <option value="verbal">Verbal Ability</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Time & Work"
                  value={questionForm.topic}
                  onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
                <select
                  value={questionForm.difficulty}
                  onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Question Statement</label>
              <textarea
                rows={3}
                required
                placeholder="Enter question text..."
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((optIdx) => (
                <div key={optIdx}>
                  <label className="block text-slate-400 mb-1">
                    Option {String.fromCharCode(65 + optIdx)}
                  </label>
                  <input
                    type="text"
                    required
                    value={questionForm.options[optIdx] || ''}
                    onChange={(e) => {
                      const newOpts = [...questionForm.options];
                      newOpts[optIdx] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOpts });
                    }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Correct Answer Index</label>
              <select
                value={questionForm.correctOptionIndex}
                onChange={(e) => setQuestionForm({ ...questionForm, correctOptionIndex: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              >
                <option value="0">Option A</option>
                <option value="1">Option B</option>
                <option value="2">Option C</option>
                <option value="3">Option D</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Step-by-Step Explanation</label>
              <textarea
                rows={3}
                required
                placeholder="Write the mathematical or logical formula and derivation..."
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
              >
                {isSubmitting ? 'Adding...' : 'Add to Question Bank'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 1: Post Job Drive */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-lg w-full rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Create Campus Placement Drive</h3>
              <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company</label>
                <select
                  required
                  value={jobForm.company}
                  onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.tier})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Associate Software Engineer"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role Type</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Stack / Cloud"
                    value={jobForm.role}
                    onChange={(e) => setJobForm({ ...jobForm, role: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CTC Package</label>
                  <input
                    type="text"
                    required
                    placeholder="18 - 22 LPA"
                    value={jobForm.ctc}
                    onChange={(e) => setJobForm({ ...jobForm, ctc: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={jobForm.minCgpa}
                    onChange={(e) => setJobForm({ ...jobForm, minCgpa: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  required
                  value={jobForm.requiredSkills}
                  onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Job Description</label>
                <textarea
                  rows={3}
                  required
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Key responsibilities and qualifications..."
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Application Deadline</label>
                  <input
                    type="date"
                    required
                    value={jobForm.deadline}
                    onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Openings</label>
                  <input
                    type="number"
                    required
                    value={jobForm.openings}
                    onChange={(e) => setJobForm({ ...jobForm, openings: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Career Application URL</label>
                <input
                  type="url"
                  placeholder="https://careers.company.com/job/software-engineer"
                  value={jobForm.applyUrl}
                  onChange={(e) => setJobForm({ ...jobForm, applyUrl: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                >
                  {isSubmitting ? 'Posting...' : 'Post Placement Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Register Company */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-md w-full rounded-3xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Register Recruiting Partner</h3>
              <button onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cisco Systems"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tier</label>
                  <select
                    value={companyForm.tier}
                    onChange={(e) => setCompanyForm({ ...companyForm, tier: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Tier 1 Product">Tier 1 Product</option>
                    <option value="Tier 2 Services">Tier 2 Services</option>
                    <option value="High-Growth Startup">High-Growth Startup</option>
                    <option value="FinTech / Core">FinTech / Core</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={companyForm.location}
                    onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Industry</label>
                <input
                  type="text"
                  required
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                >
                  {isSubmitting ? 'Registering...' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Broadcast Announcement */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow max-w-md w-full rounded-3xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Broadcast Placement Announcement</h3>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google OA Assessment Schedule"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notice Type</label>
                <select
                  value={noticeForm.type}
                  onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="Placement Drive">Placement Drive</option>
                  <option value="Urgent Notice">Urgent Notice</option>
                  <option value="Company Visit">Company Visit</option>
                  <option value="Preparation Tip">Preparation Tip</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Content / Instructions</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Details for all registered students..."
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={noticeForm.isPinned}
                  onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
                />
                <label htmlFor="pinCheckbox" className="text-slate-300">Pin notice to student dashboard</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                >
                  {isSubmitting ? 'Publishing...' : 'Broadcast to Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
