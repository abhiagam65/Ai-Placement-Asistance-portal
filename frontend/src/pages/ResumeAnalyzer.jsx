import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Target,
  ArrowRight, Loader2, History, Info, X, Quote, ArrowUpRight, ListChecks, Layers
} from 'lucide-react';
import './ResumeAnalyzer.css';

const techQuotes = [
  { text: 'Stay hungry. Stay foolish.', author: 'Steve Jobs', source: 'https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says' },
  { text: 'Make something people want.', author: 'Paul Graham / Y Combinator', source: 'https://paulgraham.com/good.html' },
  { text: 'The power of the Web is in its universality.', author: 'Tim Berners-Lee', source: 'https://www.w3.org/WAI/fundamentals/accessibility-intro/' },
  { text: 'AI is the new electricity.', author: 'Andrew Ng', source: 'https://blog.coursera.org/andrew-ng-announcing-new-deep-learning-specialization-coursera/' }
];
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50';
const scoreLabel = value => Number.isFinite(value) ? value : '—';
const priorityOrder = { high: 0, medium: 1, low: 2 };

function SkillTags({ skills = [], tone = 'neutral', emptyText = 'None identified.' }) {
  return skills.length ? <div className="flex flex-wrap gap-2">{skills.map((skill, index) => <span key={index} className={`resume-tag resume-tag--${tone}`}>{skill}</span>)}</div> : <p className="text-xs text-slate-500">{emptyText}</p>;
}

function AnalysisLoading() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const intervalRef = useRef(null);
  useEffect(() => {
    intervalRef.current = window.setInterval(() => setQuoteIndex(index => (index + 1) % techQuotes.length), 5000);
    return () => window.clearInterval(intervalRef.current);
  }, []);
  return (
    <section className="resume-loading rounded-3xl border border-indigo-500/25 p-6 sm:p-9" aria-label="Resume analysis in progress">
      <div className="resume-loading-glow" aria-hidden="true" />
      <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <div className="resume-scan-illustration" aria-hidden="true"><div className="resume-scan-orbit" /><div className="resume-scan-document"><span /><span /><span /><span /><div className="resume-scan-beam" /></div><div className="resume-scan-spark"><Sparkles className="h-4 w-4" /></div></div>
        <div className="space-y-4">
          <div role="status" aria-live="polite"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">Your next improvement starts here</p><h2 className="text-xl font-bold text-white sm:text-2xl">Analyzing your resume</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">AI is reviewing your resume. Your personalized feedback will appear when the analysis is complete.</p></div>
          <div className="resume-loading-rail" aria-hidden="true"><span /></div>
          <p className="text-xs text-slate-500">Keep this page open. Your resume and optional job description are being processed.</p>
        </div>
      </div>
      <div className="resume-quote-area relative mt-7 border-t border-indigo-400/15 pt-6" aria-hidden="true"><Quote className="absolute left-0 top-6 h-5 w-5 text-indigo-400/60" /><div className="resume-quotes ml-8">{techQuotes.map((quote, index) => <blockquote key={quote.author + quote.text} cite={quote.source} className={`resume-quote ${index === quoteIndex ? 'resume-quote--active' : ''}`}><p className="text-base font-medium leading-relaxed text-slate-200 sm:text-lg">“{quote.text}”</p><footer className="mt-2 text-xs text-indigo-300">— {quote.author}</footer></blockquote>)}</div></div>
    </section>
  );
}

function ScoreCard({ label, value, caption, index }) {
  return <div className="resume-report-item rounded-2xl border border-slate-800 bg-slate-900/60 p-4" style={{ '--item-index': index }}><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-2 text-2xl font-extrabold text-white">{scoreLabel(value)}<span className="ml-1 text-xs font-normal text-slate-500">/ 100</span></p><div className="resume-score-track mt-3"><span className="resume-score-fill" style={{ '--score': Number.isFinite(value) ? value : 0 }} /></div><p className="mt-2 text-[11px] text-slate-500">{caption}</p></div>;
}

function ResumeReport({ result }) {
  const scoring = result.scoring || {};
  const summary = result.candidateSummary || {};
  const sections = result.sectionFeedback?.length ? result.sectionFeedback : Object.entries(summary.sectionsPresent || {}).map(([section, present]) => ({ section, status: present ? 'present' : 'missing', feedback: '' }));
  const issues = [...(result.issues || [])].sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));
  return (
    <section className="resume-report space-y-6" aria-labelledby="resume-report-title">
      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="resume-report-header grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
          <div><span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Analysis Complete</span><h2 id="resume-report-title" className="text-2xl font-extrabold text-white">Resume Analysis Report</h2><p className="mt-2 break-all text-xs text-slate-400"><FileText className="mr-1.5 inline h-3.5 w-3.5" />{result.fileName}{result.createdAt && <span className="ml-2 text-slate-500">{new Date(result.createdAt).toLocaleDateString()}</span>}</p>{result.summary && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">{result.summary}</p>}</div>
          <div className="resume-score-ring" style={{ '--score': Number.isFinite(scoring.overallScore) ? scoring.overallScore : 0 }}><div><strong>{scoreLabel(scoring.overallScore)}</strong><span>Overall / 100</span></div></div>
        </div>
        <div className="space-y-5 border-t border-slate-800 p-6 sm:p-8"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><ScoreCard label="Readability" value={scoring.atsReadabilityScore} caption="Structure and clarity" index={0} /><ScoreCard label="Skills Evidence" value={scoring.skillsDepthScore} caption="Depth shown in your work" index={1} /><ScoreCard label="Quantified Impact" value={scoring.impactMetricsScore} caption="Outcomes and achievements" index={2} /><ScoreCard label="Completeness" value={scoring.completenessScore} caption="Relevant content and detail" index={3} /></div>{scoring.scoringRationale && <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-4"><h3 className="mb-2 text-xs font-bold text-indigo-300">Why these scores?</h3><p className="text-sm leading-relaxed text-slate-300">{scoring.scoringRationale}</p></div>}</div>
      </div>

      {Boolean(result.strengths?.length) && <section className="glass-panel rounded-3xl p-6"><h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> What’s Working Well</h3><ul className="grid gap-3 sm:grid-cols-2">{result.strengths.map((strength, index) => <li key={index} className="flex items-start gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3.5 text-sm leading-relaxed text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{strength}</li>)}</ul></section>}

      {issues.length > 0 && <section className="glass-panel rounded-3xl p-6"><div className="mb-4 flex items-center gap-2"><ListChecks className="h-5 w-5 text-amber-400" /><h3 className="text-base font-bold text-white">Your Improvement Priorities</h3></div><div className="space-y-3">{issues.map((issue, index) => <article key={index} className="resume-issue rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><div className="mb-2 flex flex-wrap items-center gap-2"><span className={`resume-priority resume-priority--${issue.priority}`}>{issue.priority} priority</span><span className="text-xs capitalize text-slate-500">{issue.section}</span></div><h4 className="text-sm font-bold text-slate-200">{issue.issue}</h4>{issue.evidence && <blockquote className="my-3 border-l-2 border-slate-600 pl-3 text-xs italic leading-relaxed text-slate-400">“{issue.evidence}”</blockquote>}<p className="mt-2 text-sm leading-relaxed text-slate-300"><span className="font-semibold text-indigo-300">Try this: </span>{issue.suggestion}</p></article>)}</div></section>}

      {sections.length > 0 && <section className="glass-panel rounded-3xl p-6"><h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white"><Layers className="h-5 w-5 text-cyan-400" /> Section-by-Section Feedback</h3><div className="grid gap-3 sm:grid-cols-2">{sections.map((section, index) => <article key={index} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"><div className="mb-2 flex items-center justify-between gap-2"><h4 className="text-sm font-semibold capitalize text-slate-200">{section.section}</h4><span className={`resume-section-status resume-section-status--${section.status}`}>{section.status === 'needs_improvement' ? 'Needs improvement' : section.status === 'present' ? 'Present' : 'Missing'}</span></div>{section.feedback && <p className="text-xs leading-relaxed text-slate-400">{section.feedback}</p>}</article>)}</div></section>}

      {Boolean(result.bulletImprovements?.length) && <section className="glass-panel rounded-3xl p-6"><h3 className="mb-1 flex items-center gap-2 text-base font-bold text-white"><ArrowUpRight className="h-5 w-5 text-purple-400" /> Stronger Resume Bullets</h3><p className="mb-5 text-xs text-slate-500">Use these suggestions only when they accurately describe your work.</p><div className="space-y-5">{result.bulletImprovements.map((bullet, index) => <article key={index} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"><div className="grid gap-4 md:grid-cols-2"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Original</p><p className="text-sm leading-relaxed text-slate-400">{bullet.original}</p></div><div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-300">Suggested Rewrite</p><p className="text-sm leading-relaxed text-slate-200">{bullet.improved}</p></div></div><p className="mt-3 text-xs leading-relaxed text-slate-400"><span className="font-semibold text-purple-300">Why it helps: </span>{bullet.reason}</p></article>)}</div></section>}

      <section className="glass-panel rounded-3xl p-6"><h3 className="mb-4 text-base font-bold text-white">Skills Found in Your Resume</h3><div className="grid gap-5 md:grid-cols-2"><div><h4 className="mb-3 text-xs font-semibold text-slate-400">Technical Skills</h4><SkillTags skills={summary.detectedTechnicalSkills} emptyText="No technical skills identified in this document." /></div><div><h4 className="mb-3 text-xs font-semibold text-slate-400">Communication & Collaboration</h4><SkillTags skills={summary.detectedSoftSkills} emptyText="No explicit soft-skill evidence identified." /></div></div></section>

      {result.jdMatch?.hasTargetJd === true && <section className="glass-panel rounded-3xl p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><h3 className="flex items-center gap-2 text-base font-bold text-white"><Target className="h-5 w-5 text-indigo-400" /> Match to Your Job Description</h3><p className="mt-2 text-sm text-slate-400">{result.jdMatch.fitVerdict}</p></div><span className="rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-2 text-2xl font-bold text-indigo-300">{scoreLabel(result.jdMatch.matchPercentage)}<span className="text-xs"> / 100</span></span></div><div className="grid gap-5 md:grid-cols-2"><div><h4 className="mb-3 text-xs font-bold text-emerald-300">Evidence That Matches</h4><SkillTags skills={result.jdMatch.matchingSkills} tone="positive" emptyText="No direct skill matches identified." /></div><div><h4 className="mb-3 text-xs font-bold text-amber-300">Not Evidenced in the Resume</h4><SkillTags skills={result.jdMatch.missingSkills} tone="warning" emptyText="No specific gaps identified against this description." /></div></div>{Boolean(result.jdMatch.recommendations?.length) && <ul className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-sm text-slate-300">{result.jdMatch.recommendations.map((recommendation, index) => <li key={index} className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />{recommendation}</li>)}</ul>}{result.targetJobDescription && <details className="mt-4 text-xs"><summary className="cursor-pointer font-semibold text-slate-400">View the job description used</summary><p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-500">{result.targetJobDescription}</p></details>}</section>}

      {Boolean(result.actionableSuggestions?.length) && <section className="glass-panel rounded-3xl p-6"><h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white"><Sparkles className="h-5 w-5 text-indigo-400" /> Your Next Steps</h3><ol className="space-y-3">{result.actionableSuggestions.map((suggestion, index) => <li key={index} className="flex items-start gap-3 rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-3.5 text-sm leading-relaxed text-slate-300"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">{index + 1}</span>{suggestion}</li>)}</ol></section>}
      {result.disclaimer && <div className="flex items-start gap-2.5 px-1 text-xs leading-relaxed text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p>{result.disclaimer}</p></div>}
    </section>
  );
}

export const ResumeAnalyzer = () => {
  const [inputMode, setInputMode] = useState('file');
  const [file, setFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [openingId, setOpeningId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const reportRef = useRef(null);
  const loadingRef = useRef(null);
  const scrollToReportRef = useRef(false);
  const busy = isAnalyzing || Boolean(openingId);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try { const response = await api.get('/resume/history'); if (active && response.success) setHistory(response.data); }
      catch (err) { if (active) setHistoryError(err.message || 'Could not load saved reports.'); }
      finally { if (active) setLoadingHistory(false); }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!result || isAnalyzing || !scrollToReportRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      scrollToReportRef.current = false;
      reportRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [result, isAnalyzing]);

  useEffect(() => {
    if (!isAnalyzing) return;
    const frame = window.requestAnimationFrame(() => loadingRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }));
    return () => window.cancelAnimationFrame(frame);
  }, [isAnalyzing]);

  const refreshHistory = async () => {
    setLoadingHistory(true); setHistoryError('');
    try { const response = await api.get('/resume/history'); if (response.success) setHistory(response.data); }
    catch (err) { setHistoryError(err.message || 'Could not load saved reports.'); }
    finally { setLoadingHistory(false); }
  };
  const selectFile = selected => {
    if (!selected || busy) return;
    if (!/\.(pdf|txt)$/i.test(selected.name)) { setError('Choose a PDF or TXT file. Other formats are not supported.'); return; }
    if (selected.size === 0) { setError('This file is empty. Please choose a resume containing text.'); return; }
    if (selected.size > 5 * 1024 * 1024) { setError('The file exceeds 5 MB. Choose a smaller PDF or TXT file.'); return; }
    setFile(selected); setInputMode('file'); setError('');
  };
  const handleDrop = event => {
    event.preventDefault(); setIsDragging(false);
    if (busy) return;
    if (event.dataTransfer.files.length > 1) { setError('Choose one resume at a time.'); return; }
    selectFile(event.dataTransfer.files[0]);
  };
  const submit = async event => {
    event.preventDefault(); setError(''); setAnnouncement('');
    if (inputMode === 'file' && !file) { setError('Choose a PDF or TXT resume, or switch to Paste Text.'); return; }
    if (inputMode === 'text' && (manualText.trim().length < 50 || manualText.length > 30000)) { setError('Paste between 50 and 30,000 characters of resume text.'); return; }
    if (jobDescription.length > 15000) { setError('Keep the job description within 15,000 characters.'); return; }
    const payload = new FormData();
    if (inputMode === 'file') payload.append('resume', file);
    else payload.append('resumeText', manualText.trim());
    if (jobDescription.trim()) payload.append('jobDescription', jobDescription.trim());
    setIsAnalyzing(true);
    try {
      const response = await api.post('/resume/upload', payload);
      if (!response.success) throw new Error(response.message || 'Could not analyze the resume.');
      scrollToReportRef.current = true;
      setResult(response.data); setAnnouncement('Resume analysis complete. Your report is ready below.'); refreshHistory();
    } catch (err) { setError(err.message || 'Analysis could not finish. Your inputs are preserved; please retry.'); }
    finally { setIsAnalyzing(false); }
  };
  const openReport = async id => {
    setOpeningId(id); setHistoryError(''); setAnnouncement('');
    try { const response = await api.get(`/resume/${id}`); if (!response.success) throw new Error(response.message || 'Could not open the report.'); scrollToReportRef.current = true; setResult(response.data); setAnnouncement('Saved resume analysis report loaded.'); }
    catch (err) { setHistoryError(err.message || 'Could not open this saved report.'); }
    finally { setOpeningId(null); }
  };

  return (
    <div className="resume-analyzer space-y-7">
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
      <header><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300"><Sparkles className="h-3.5 w-3.5" /> AI Resume Review</div><h1 className="text-2xl font-extrabold text-white sm:text-3xl">Resume Analyzer & Job Matcher</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Get specific feedback on your resume, stronger bullet suggestions, and an optional comparison to your target job.</p></header>
      <form onSubmit={submit} className="glass-panel rounded-3xl p-5 sm:p-7" aria-busy={isAnalyzing}>
        <fieldset disabled={busy} className="space-y-6 disabled:opacity-75">
          <div className="grid gap-7 lg:grid-cols-2">
            <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold text-white">1. Add Your Resume</h2><div className="flex rounded-xl border border-slate-700 bg-slate-950/40 p-1" role="group" aria-label="Resume input method"><button type="button" aria-pressed={inputMode === 'file'} onClick={() => { setInputMode('file'); setError(''); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${inputMode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Upload File</button><button type="button" aria-pressed={inputMode === 'text'} onClick={() => { setInputMode('text'); setError(''); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${inputMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Paste Text</button></div></div>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={event => { selectFile(event.target.files[0]); event.target.value = ''; }} className="hidden" aria-label="Choose a PDF or TXT resume" disabled={busy} />
              {inputMode === 'file' ? <div><button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} onDragOver={event => { event.preventDefault(); if (!busy) setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`resume-upload-card group w-full rounded-2xl border-2 border-dashed p-6 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400 ${isDragging ? 'resume-upload-card--dragging border-indigo-400 bg-indigo-500/10' : file ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-700 bg-slate-950/30'}`}><span className="relative flex flex-col items-center"><span className="resume-upload-icon mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">{file ? <FileText className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}</span><span className="max-w-full break-all text-sm font-bold text-slate-200">{file ? file.name : 'Click anywhere to choose your resume'}</span><span className="mt-2 text-xs text-slate-400">{file ? `${(file.size / 1024).toFixed(1)} KB · Click to replace` : 'or drag and drop it here'}</span><span className="mt-4 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[10px] font-medium text-slate-500">PDF or TXT · Up to 5 MB</span></span></button>{file && <button type="button" disabled={busy} onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="mt-2 inline-flex items-center gap-1.5 px-1 text-xs text-slate-400 hover:text-rose-300"><X className="h-3.5 w-3.5" /> Remove file</button>}<p className="mt-3 text-xs leading-relaxed text-slate-500">Use a text-based PDF. If your resume is scanned or image-based, paste its text instead.</p></div> : <div><label htmlFor="resume-text" className="sr-only">Resume text</label><textarea id="resume-text" rows={10} maxLength={30000} value={manualText} onChange={event => setManualText(event.target.value)} placeholder="Paste the complete text of your resume, including your education, skills, projects, and experience..." className="resume-textarea w-full rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-sm leading-relaxed text-slate-200 placeholder-slate-600" /><div className="mt-2 flex justify-between gap-3 text-[11px] text-slate-500"><span>At least 50 characters</span><span>{manualText.length.toLocaleString()} / 30,000</span></div></div>}
            </div>
            <div className="flex flex-col"><div className="mb-4 flex flex-wrap items-center gap-2"><label htmlFor="resume-jd" className="text-sm font-bold text-white">2. Target Job Description</label><span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">Optional</span></div><textarea id="resume-jd" rows={10} maxLength={15000} value={jobDescription} onChange={event => setJobDescription(event.target.value)} placeholder="Paste a job description to see where your resume matches, which requirements lack evidence, and how to tailor your application." className="resume-textarea min-h-56 w-full flex-1 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-sm leading-relaxed text-slate-200 placeholder-slate-600" /><div className="mt-2 flex justify-between gap-3 text-[11px] text-slate-500"><span>Leave blank for a general review</span><span>{jobDescription.length.toLocaleString()} / 15,000</span></div></div>
          </div>
          {error && <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{error}</p></div>}
          <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center"><p className="max-w-md text-xs leading-relaxed text-slate-500">Analysis uses the resume content you provide. A job match is included only when you add a job description.<span className="mt-1 block text-indigo-300/80">Powered by Gemini</span></p><button type="submit" disabled={busy} className={primary}>{isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Resume...</> : <>Analyze My Resume <ArrowRight className="h-4 w-4" /></>}</button></div>
        </fieldset>
      </form>
      {isAnalyzing && <div ref={loadingRef} className="resume-scroll-target"><AnalysisLoading /></div>}
      {result && !isAnalyzing && <div ref={reportRef} className="resume-scroll-target" key={result._id || result.createdAt || result.fileName}><ResumeReport result={result} /></div>}
      <section className="glass-panel rounded-3xl p-5 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-base font-bold text-white"><History className="h-5 w-5 text-slate-400" /> Saved Resume Reviews</h2><button type="button" onClick={refreshHistory} disabled={busy || loadingHistory} className={secondary}>{loadingHistory ? 'Loading...' : 'Refresh'}</button></div>{historyError && <p role="alert" className="mb-3 text-sm text-rose-300">{historyError}</p>}{loadingHistory && history.length === 0 ? <p className="flex items-center gap-2 py-4 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading your reports...</p> : history.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center"><FileText className="mx-auto mb-2 h-6 w-6 text-slate-600" /><p className="text-sm text-slate-500">Your completed analyses will appear here.</p></div> : <div className="divide-y divide-slate-800">{history.map(item => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400"><FileText className="h-4 w-4" /></span><div><h3 className="break-all text-sm font-semibold text-slate-200">{item.fileName}</h3><p className="mt-1 text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()} · Overall score {scoreLabel(item.scoring?.overallScore)}/100</p></div></div><button type="button" onClick={() => openReport(item._id)} disabled={busy} className={secondary}>{openingId === item._id ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening...</> : <>View Review <ArrowUpRight className="h-3.5 w-3.5" /></>}</button></div>)}</div>}</section>
    </div>
  );
};
