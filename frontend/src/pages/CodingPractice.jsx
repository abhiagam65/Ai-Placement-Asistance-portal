import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Code2,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  RotateCcw,
  Clock,
  Cpu,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  Terminal,
  AlertTriangle
} from 'lucide-react';

export const CodingPractice = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active problem state
  const [activeProblem, setActiveProblem] = useState(null);
  const [activeProblemDetail, setActiveProblemDetail] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'submissions'
  const [submissions, setSubmissions] = useState([]);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, [selectedDifficulty, selectedCategory]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coding/problems?difficulty=${selectedDifficulty}&category=${selectedCategory}`);
      if (res.success) {
        setProblems(res.data);
      }
    } catch (err) {
      console.warn('Failed to load coding problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProblem = async (problem) => {
    try {
      setLoading(true);
      const res = await api.get(`/coding/problems/${problem.slug}`);
      if (res.success) {
        setActiveProblem(problem);
        setActiveProblemDetail(res.data);
        const starter = res.data.starterCode?.[language] || res.data.starterCode?.javascript || '';
        setCode(starter);
        setRunResult(null);
        setActiveTab('problem');
      }
    } catch (err) {
      alert(err.message || 'Failed to load problem.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (activeProblemDetail?.starterCode?.[newLang]) {
      setCode(activeProblemDetail.starterCode[newLang]);
    }
  };

  const handleResetCode = () => {
    if (activeProblemDetail?.starterCode?.[language]) {
      setCode(activeProblemDetail.starterCode[language]);
    }
  };

  const handleRunSample = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    try {
      const res = await api.post('/coding/run', {
        problemId: activeProblemDetail._id,
        language,
        code
      });
      if (res.success) {
        setRunResult(res.data);
      }
    } catch (err) {
      alert(err.message || 'Run failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!code.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/coding/submit', {
        problemId: activeProblemDetail._id,
        language,
        code
      });
      if (res.success) {
        setRunResult(res.data);
        if (res.data.status === 'Accepted') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          fetchProblems();
        }
      }
    } catch (err) {
      alert(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await api.get('/coding/submissions');
      if (res.success) {
        setSubmissions(res.data.filter(s => s.problem?._id === activeProblemDetail._id));
      }
    } catch (err) {
      console.warn('Could not fetch submissions:', err);
    }
  };

  const filteredProblems = problems.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Catalog View when no problem selected */}
      {!activeProblem && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-2">
                <Code2 className="w-3.5 h-3.5" />
                <span>DSA Technical Practice</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Campus Coding Platform
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Solve essential data structures and algorithms interview challenges in an isolated sandbox.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search DSA problem..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Difficulty:</span>
              {['all', 'easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-3 py-1.5 capitalize rounded-lg font-semibold transition-colors ${
                    selectedDifficulty === d
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400">
              Showing <strong className="text-white">{filteredProblems.length}</strong> problems
            </div>
          </div>

          {/* Problems Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading DSA catalog...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProblems.map((problem) => (
                <div
                  key={problem._id}
                  onClick={() => handleSelectProblem(problem)}
                  className="glass-card p-5 rounded-2xl cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          problem.difficulty === 'easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : problem.difficulty === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {problem.difficulty}
                      </span>

                      {problem.isSolved && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-slate-400">{problem.category}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">{problem.exampleCount} Examples</span>
                    <span className="text-indigo-400 font-semibold group-hover:underline flex items-center gap-1">
                      Solve <Play className="w-3 h-3 fill-current" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workspace Split View when a problem is selected */}
      {activeProblem && activeProblemDetail && (
        <div className="space-y-4">
          {/* Top Bar with back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setActiveProblem(null); setActiveProblemDetail(null); }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Problem Catalog
            </button>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                activeProblemDetail.difficulty === 'easy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : activeProblemDetail.difficulty === 'medium'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {activeProblemDetail.difficulty}
              </span>
              <span className="text-xs text-slate-400">{activeProblemDetail.category}</span>
            </div>
          </div>

          {/* Split Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Left Column: Problem Details & Constraints */}
            <div className="glass-panel p-6 rounded-3xl space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="space-y-1 pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">{activeProblemDetail.title}</h2>
                <p className="text-xs text-slate-400">{activeProblemDetail.category}</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {activeProblemDetail.description}
                </p>
              </div>

              {/* Examples */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Examples</h3>
                {activeProblemDetail.examples?.map((ex, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-mono space-y-1">
                    <div><strong className="text-indigo-400">Input:</strong> <span className="text-slate-200">{ex.input}</span></div>
                    <div><strong className="text-emerald-400">Output:</strong> <span className="text-slate-200">{ex.output}</span></div>
                    {ex.explanation && (
                      <div className="text-slate-400 font-sans text-[11px] pt-1 border-t border-slate-800">
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              {activeProblemDetail.constraints?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Constraints</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-mono">
                    {activeProblemDetail.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints Accordion */}
              {activeProblemDetail.hints?.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" /> Need a hint?
                    </span>
                    {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showHints && (
                    <div className="mt-2 space-y-2">
                      {activeProblemDetail.hints.map((hint, i) => (
                        <div key={i} className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300">
                          {hint}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Code Editor & Runner */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="javascript">JavaScript (ES6)</option>
                    <option value="python">Python 3</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++ (GCC)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleResetCode}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  title="Reset to starter template"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              {/* Code Editor Textarea */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#070b14]">
                <textarea
                  rows={14}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck="false"
                  className="w-full p-4 font-mono text-xs sm:text-sm bg-transparent text-slate-200 focus:outline-none leading-relaxed resize-y"
                  style={{ tabSize: 2 }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Isolated Timeout Sandbox Runner
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRunSample}
                    disabled={isRunning || isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Run Sample Cases</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitSolution}
                    disabled={isRunning || isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Submit Code</span>
                  </button>
                </div>
              </div>

              {/* Sandbox Execution Output Tray */}
              {runResult && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Execution Output
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        Runtime: <strong className="text-slate-200">{runResult.runtimeMs} ms</strong>
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          runResult.status === 'Accepted'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : runResult.status === 'Time Limit Exceeded'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {runResult.status} ({runResult.testCasesPassed}/{runResult.totalTestCases} Passed)
                      </span>
                    </div>
                  </div>

                  {runResult.errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                      {runResult.errorMessage}
                    </div>
                  )}

                  {/* Test Cases Results */}
                  {runResult.results && runResult.results.length > 0 && (
                    <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                      {runResult.results.map((r, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                            r.passed
                              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                              : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>Case {r.testCaseIndex}:</span>
                            <span className="text-slate-400 font-sans text-[11px]">
                              Input: {r.input}
                            </span>
                          </div>
                          <span>
                            {r.passed ? '✓ Passed' : `✗ Expected ${r.expected}, got ${r.actual}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
