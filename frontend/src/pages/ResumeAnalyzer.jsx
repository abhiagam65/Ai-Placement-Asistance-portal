import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Target,
  Layers,
  ArrowRight,
  Loader2,
  History,
  Info,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/resume/history');
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch resume history:', err);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit. Please upload a smaller file.');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit.');
        return;
      }
      setFile(droppedFile);
      setError('');
    }
  };

  const loadSampleResume = () => {
    setManualText(`AARAV PATEL
Computer Engineering Undergraduate (2022-2026)
Email: aarav.patel@college.edu | Phone: +91 9876543210
GitHub: github.com/aaravpatel | LinkedIn: linkedin.com/in/aaravpatel

EDUCATION
B.Tech in Computer Engineering | GCET (2022 - 2026)
Cumulative CGPA: 8.75 / 10.0 (First Class with Distinction)
Relevant Coursework: Data Structures, Algorithms, OS, DBMS, Computer Networks, Distributed Systems

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, C++, Java, SQL
Frontend: React.js, Next.js, Tailwind CSS, Redux Toolkit
Backend: Node.js, Express.js, REST APIs, Microservices, WebSockets
Databases & Cloud: MongoDB, PostgreSQL, Redis, Docker, Git, Linux, AWS S3

PROJECTS
1. Cloud-Native Scalable E-Commerce Engine (React, Node.js, Redis, MongoDB, Docker)
- Architected microservices checkout pipeline reducing median API latency by 38% under 2,000 req/sec stress tests.
- Implemented distributed Redis caching layer saving 65% repetitive DB queries.

2. Real-Time Collaborative Canvas (React, WebSockets, Canvas API, Node.js)
- Engineered low-latency room synchronization serving up to 50 concurrent sketchers per room with <40ms update lag.
- Deployed containerized backend to AWS EC2 using GitHub Actions CI/CD pipelines.

EXPERIENCE
Software Engineering Intern | TechNext Innovations (May 2025 - July 2025)
- Enhanced internal analytics dashboard by building reusable React components and optimizing bundle size by 24%.
- Integrated automated Jest unit test suites achieving 88% statement coverage.`);

    setJobDescription(`Associate Software Development Engineer (SWE) - Google India
We are looking for engineers with strong fundamentals in Data Structures, Algorithms, Distributed Systems, and Web Technologies.
Requirements:
- Strong proficiency in JavaScript/TypeScript, React, Node.js, Python, or C++
- Familiarity with Cloud architectures, Docker, CI/CD, and Redis
- Solid understanding of database indexing and RESTful architectures`);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file && (!manualText || manualText.trim().length < 50)) {
      setError('Please upload a PDF/DOCX resume or paste your resume text (minimum 50 characters).');
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('resume', file);
      } else {
        formData.append('resumeText', manualText);
      }
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      const res = await api.post('/resume/upload', formData);
      if (res.success) {
        setResult(res.data);
        fetchHistory();
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze resume.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Resume Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Resume Analyzer & JD Matcher
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Extract technical skills, verify ATS readability heuristics, and benchmark against targeted job descriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSampleResume}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 self-start"
        >
          <FileCheck className="w-4 h-4 text-indigo-400" />
          <span>Load Sample Final-Year Resume & JD</span>
        </button>
      </div>

      {/* Upload and JD Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Zone */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Upload Resume Document (PDF / DOCX / TXT)
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <input
                type="file"
                id="resumeFileInput"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UploadCloud className="w-6 h-6" />
                </div>

                {file ? (
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB • Ready for scan</p>
                    <label
                      htmlFor="resumeFileInput"
                      className="text-xs text-indigo-400 hover:underline cursor-pointer block mt-2"
                    >
                      Choose another file
                    </label>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="resumeFileInput"
                      className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      Click to upload
                    </label>
                    <span className="text-sm text-slate-400"> or drag and drop</span>
                    <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or TXT up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Manual Text Area */}
            <div>
              <span className="text-xs text-slate-400 block mb-1">
                Or paste resume plain text directly:
              </span>
              <textarea
                rows={4}
                value={manualText}
                onChange={(e) => { setManualText(e.target.value); if (file) setFile(null); }}
                placeholder="Paste extracted text from your resume here..."
                className="w-full p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Target Job Description Zone */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Target Job Description (Optional for JD Match)
              </label>
              <span className="text-[10px] text-indigo-400 font-semibold">Recommended</span>
            </div>

            <textarea
              rows={9}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description or required skills from Google, Microsoft, Amazon, or your target company to compute keyword match percentage and uncover missing competencies..."
              className="w-full p-3.5 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Document & Matching Keywords...
              </>
            ) : (
              <>
                Run Full Resume Analysis <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Analysis Results Display */}
      {result && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-8 animate-in fade-in duration-500">
          {/* Header & Disclaimer */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Resume Analysis Report
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Completed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Document: <strong className="text-slate-200">{result.fileName}</strong> • Scanned with {result.provider}
              </p>
            </div>

            {/* Honest Disclaimer Callout */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 max-w-md flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Methodology:</strong> {result.disclaimer}
              </span>
            </div>
          </div>

          {/* Scores Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-900/40 to-slate-900/60 border border-indigo-500/30 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-300">Overall Score</span>
              <div className="text-3xl font-black text-white">{result.scoring.overallScore}%</div>
              <p className="text-[10px] text-slate-400">Composite Readiness</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">ATS Readability</span>
              <div className="text-3xl font-black text-cyan-400">{result.scoring.atsReadabilityScore}%</div>
              <p className="text-[10px] text-slate-500">Structure & Parsing</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Skills Depth</span>
              <div className="text-3xl font-black text-emerald-400">{result.scoring.skillsDepthScore}%</div>
              <p className="text-[10px] text-slate-500">Tech Keyword Density</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Quantified Impact</span>
              <div className="text-3xl font-black text-purple-400">{result.scoring.impactMetricsScore}%</div>
              <p className="text-[10px] text-slate-500">Metrics & Outcomes</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Completeness</span>
              <div className="text-3xl font-black text-amber-400">{result.scoring.completenessScore}%</div>
              <p className="text-[10px] text-slate-500">All Sections Present</p>
            </div>
          </div>

          {/* JD Comparison Box */}
          {result.jdMatch && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Target Job Description Alignment</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Role Fit Verdict:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {result.jdMatch.fitVerdict} ({result.jdMatch.matchPercentage}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Matching Skills */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Matching Skills Found in Resume
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.jdMatch.matchingSkills.length > 0 ? (
                      result.jdMatch.matchingSkills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">None directly matched.</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Missing / Recommended Skills for this Role
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.jdMatch.missingSkills.length > 0 ? (
                      result.jdMatch.missingSkills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium">
                          + {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-400">No major skill gaps identified!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detected Candidate Skills & Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-200">Extracted Technical Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.candidateSummary?.detectedTechnicalSkills?.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-200">Section Completeness Audit</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {result.candidateSummary?.sectionsPresent && Object.entries(result.candidateSummary.sectionsPresent).map(([k, v], i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="capitalize text-slate-300">{k}</span>
                    {v ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable Suggestions */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Actionable Improvement Recommendations
            </h3>
            <div className="space-y-2">
              {result.actionableSuggestions?.map((sugg, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-200 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{sugg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Past Resume History */}
      {history.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-white text-base">Past Analysis History</h3>
          </div>

          <div className="divide-y divide-slate-800">
            {history.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200">{item.fileName}</span>
                    <span className="text-slate-500 text-[10px] ml-2">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-300">
                    ATS Score: <strong className="text-indigo-400">{item.scoring?.overallScore}%</strong>
                  </span>
                  <button
                    onClick={() => setResult(item)}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
