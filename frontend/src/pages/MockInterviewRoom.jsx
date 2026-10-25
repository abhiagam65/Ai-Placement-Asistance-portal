import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { Mic, MicOff, Sparkles, ArrowRight, CheckCircle2, AlertCircle, ChevronRight, Loader2, History, RotateCcw, Award, BookOpen } from 'lucide-react';

const roles = ['Full Stack Software Engineer', 'Frontend Engineer', 'Backend Distributed Systems Engineer', 'Data Scientist / AI Engineer'];
const primary = 'px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
const secondary = 'px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed';
const inputClass = 'w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2';

function Metrics({ evaluation, type }) {
  const values = [[type === 'hr' ? 'Relevance & Evidence' : 'Technical Accuracy', evaluation.technicalAccuracy], ['Clarity', evaluation.clarityCommunication], ['Completeness', evaluation.depthAndCompleteness]];
  return <div className="grid grid-cols-3 gap-2 text-center">{values.map(([label, value]) => <div key={label} className="p-3 rounded-xl bg-slate-900 border border-slate-800"><span className="text-[10px] sm:text-xs text-slate-400">{label}</span><p className="font-bold text-indigo-300 mt-1">{Number.isFinite(value) ? `${value}/100` : '—'}</p></div>)}</div>;
}

function Feedback({ evaluation, type }) {
  return (
    <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4 text-left">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-indigo-500/20"><span className="text-xs font-bold uppercase text-indigo-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Answer Evaluation</span><span className="text-xl font-black text-white">{evaluation.score}<span className="text-xs text-slate-400"> / 100</span></span></div>
      <Metrics evaluation={evaluation} type={type} />
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{evaluation.feedback}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">{[['Strengths', evaluation.strengths, 'text-emerald-400'], ['Areas for Improvement', evaluation.areasForImprovement, 'text-amber-400']].map(([label, items, color]) => <div key={label} className="space-y-2"><h4 className={`font-bold ${color}`}>{label}</h4>{items?.length ? <ul className="space-y-1.5 list-disc pl-4 text-slate-300">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="text-slate-500">None identified.</p>}</div>)}</div>
      {evaluation.modelIdealAnswer && <div className="pt-4 border-t border-indigo-500/20 space-y-2"><h4 className="text-xs font-bold text-slate-400 uppercase">Example Strong Answer</h4><p className="text-sm leading-relaxed text-slate-300 bg-slate-900/60 p-4 rounded-xl whitespace-pre-wrap">{evaluation.modelIdealAnswer}</p></div>}
    </div>
  );
}

export const MockInterviewRoom = () => {
  const [role, setRole] = useState(roles[0]);
  const [interviewType, setInterviewType] = useState('technical');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [finalAnswerReady, setFinalAnswerReady] = useState(false);
  const [report, setReport] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [openingId, setOpeningId] = useState(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const response = await api.get('/interview/history');
      if (response.success) setHistory(response.data);
    } catch (err) { setHistoryError(err.message || 'Could not load your interview history.'); }
    finally { setLoadingHistory(false); }
  };
  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      try {
        const response = await api.get('/interview/history');
        if (active && response.success) setHistory(response.data);
      } catch (err) {
        if (active) setHistoryError(err.message || 'Could not load your interview history.');
      } finally {
        if (active) setLoadingHistory(false);
      }
    };
    loadHistory();
    return () => {
      active = false;
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }
    };
  }, []);

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };
  const toggleDictation = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      setAnswer(previous => previous ? `${previous} ${transcript}` : transcript);
    };
    recognition.onerror = event => {
      if (!['aborted', 'no-speech'].includes(event.error)) setError('Check microphone access or type your answer. Dictation could not continue.');
      setIsListening(false);
    };
    recognition.onend = () => { if (recognitionRef.current === recognition) { recognitionRef.current = null; setIsListening(false); } };
    setError('');
    try { recognition.start(); setIsListening(true); }
    catch { recognitionRef.current = null; setIsListening(false); setError('Could not start dictation. Please type your answer.'); }
  };
  const reset = () => {
    stopDictation(); setSession(null); setCurrentQuestion(null); setNextQuestion(null); setEvaluation(null);
    setShowReport(false); setReport(null); setFinalAnswerReady(false); setAnswer(''); setError(''); fetchHistory();
  };
  const start = async event => {
    event.preventDefault(); setError('');
    const count = Number(totalQuestions);
    if (role.trim().length < 3 || role.trim().length > 120) { setError('Enter a target role between 3 and 120 characters.'); return; }
    if (!Number.isInteger(count) || count < 1 || count > 10) { setError('Choose a whole number of questions between 1 and 10.'); return; }
    setBusy(true);
    try {
      const response = await api.post('/interview/start', { role: role.trim(), interviewType, difficulty, totalQuestions: count });
      if (!response.success) throw new Error(response.message || 'Could not start the interview.');
      setSession({ _id: response.sessionId, role: response.role, interviewType: response.interviewType, difficulty: response.difficulty, totalQuestions: response.totalQuestions });
      setCurrentQuestion(response.currentQuestion); setNextQuestion(null); setAnswer(''); setEvaluation(null);
      setReport(null); setFinalAnswerReady(false); setShowReport(false);
    } catch (err) { setError(err.message || 'Failed to start the interview. Please try again.'); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    setError('');
    if (!answer.trim()) { setError('Answer the question before submitting. You can also explain what you do not know.'); return; }
    stopDictation(); setBusy(true);
    try {
      const response = await api.post(`/interview/${session._id}/answer`, { answer: answer.trim(), questionIndex: currentQuestion.index });
      if (!response.success) throw new Error(response.message || 'Could not evaluate your answer.');
      setEvaluation(response.evaluation); setNextQuestion(response.nextQuestion || null); setFinalAnswerReady(Boolean(response.isCompleted));
      if (response.isCompleted) { setReport(response.session); fetchHistory(); }
    } catch (err) { setError(err.message || 'Failed to evaluate your answer. Your response is preserved; please retry.'); }
    finally { setBusy(false); }
  };
  const advance = () => {
    setError('');
    if (finalAnswerReady) { setShowReport(true); return; }
    setCurrentQuestion(nextQuestion); setNextQuestion(null); setEvaluation(null); setAnswer('');
  };
  const openSession = async id => {
    setOpeningId(id); setError('');
    try {
      const response = await api.get(`/interview/${id}`);
      if (!response.success) throw new Error(response.message || 'Could not open the interview.');
      const saved = response.data;
      setSession(saved); setEvaluation(null); setNextQuestion(null); setFinalAnswerReady(false); setAnswer('');
      if (saved.status === 'completed') { setReport(saved); setShowReport(true); setCurrentQuestion(null); }
      else {
        const question = saved.currentQuestion || saved.questions?.find(item => item.questionIndex === saved.currentQuestionIndex);
        if (!question) throw new Error('No available question was found. Please start a new interview.');
        setCurrentQuestion({ ...question, index: question.index ?? question.questionIndex ?? saved.currentQuestionIndex });
        setAnswer(question.studentAnswer || ''); setReport(null); setShowReport(false);
      }
    } catch (err) { setSession(null); setError(err.message || 'Could not open the interview.'); }
    finally { setOpeningId(null); }
  };
  const answered = report?.questions?.filter(question => question.evaluation && Number.isFinite(question.evaluation.score)) || [];
  const average = field => {
    const values = answered.map(question => question.evaluation[field]).filter(Number.isFinite);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : undefined;
  };

  return (
    <div className="space-y-8">
      <div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 mb-2"><Sparkles className="w-3.5 h-3.5" /> AI Mock Interview</div><h1 className="text-2xl sm:text-3xl font-extrabold text-white">Technical & HR Mock Interview</h1><p className="text-sm text-slate-400 mt-1">Practice questions tailored to your role, then receive feedback on the answers you give.</p></div>
      {error && <div role="alert" className="max-w-4xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3"><AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}
      {!session && (
        <form onSubmit={start} className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1 pb-4 border-b border-slate-800"><h2 className="text-lg font-bold text-white">Customize Your Interview</h2><p className="text-xs text-slate-400">Choose what you want to practice and how challenging it should be.</p></div>
          <fieldset disabled={busy || Boolean(openingId)} className="space-y-5 disabled:opacity-60">
            <div><label htmlFor="interview-role" className={labelClass}>Target Engineering Role</label><input id="interview-role" value={role} onChange={event => setRole(event.target.value)} minLength={3} maxLength={120} required placeholder="e.g. Android Engineer, DevOps Engineer, Data Scientist" className={inputClass} /><div className="flex flex-wrap gap-2 mt-2">{roles.map(preset => <button key={preset} type="button" aria-pressed={role === preset} onClick={() => setRole(preset)} className={`px-3 py-2 rounded-xl text-xs border ${role === preset ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>{preset}</button>)}</div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5"><div><label htmlFor="interview-type" className={labelClass}>Interview Type</label><select id="interview-type" value={interviewType} onChange={event => setInterviewType(event.target.value)} className={inputClass}><option value="technical">Technical</option><option value="hr">HR / Behavioral</option></select></div><div><label htmlFor="interview-difficulty" className={labelClass}>Difficulty Level</label><select id="interview-difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value)} className={inputClass}><option value="entry">Entry</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div></div>
            <div><label htmlFor="interview-count" className={labelClass}>Number of Interview Questions</label><div className="flex items-center gap-3"><input id="interview-count" type="number" min="1" max="10" step="1" required value={totalQuestions} onChange={event => setTotalQuestions(event.target.value)} className={`${inputClass} max-w-24`} /><span className="text-xs text-slate-500">1–10 questions, asked one at a time</span></div></div>
          </fieldset>
          <div className="pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between"><p className="text-xs leading-relaxed text-slate-500 sm:max-w-xs">Questions and feedback are generated from your choices and answers. Results are saved for review.</p><button type="submit" disabled={busy || Boolean(openingId)} className={primary}>{busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing Questions...</> : <>Start Interview <ArrowRight className="w-4 h-4" /></>}</button></div>
        </form>
      )}
      {session && !showReport && currentQuestion && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs"><div className="space-y-1"><p className="font-bold text-slate-200">{session.role}</p><p className="capitalize text-slate-400">{session.interviewType === 'hr' ? 'HR / Behavioral' : 'Technical'} · {session.difficulty}</p></div><span className="px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">Question {currentQuestion.index + 1} of {session.totalQuestions}</span></div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden" aria-hidden="true"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${((currentQuestion.index + (evaluation ? 1 : 0)) / session.totalQuestions) * 100}%` }} /></div>
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3"><span className="text-[11px] font-bold uppercase text-purple-400 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" />{currentQuestion.category || 'Interview Question'}</span><h2 className="text-base sm:text-lg font-bold text-white leading-relaxed whitespace-pre-wrap">{currentQuestion.question}</h2></div>
          {!evaluation ? <div className="space-y-4"><div className="flex items-center justify-between gap-3"><label htmlFor="interview-answer" className={labelClass}>Your Answer</label>{speechSupported && <button type="button" disabled={busy} onClick={toggleDictation} className={secondary}>{isListening ? <span className="flex items-center gap-2 text-rose-300"><MicOff className="w-4 h-4" /> Stop Dictation</span> : <span className="flex items-center gap-2"><Mic className="w-4 h-4 text-indigo-400" /> Dictate Answer</span>}</button>}</div><textarea id="interview-answer" rows={8} value={answer} disabled={busy} maxLength={12000} onChange={event => setAnswer(event.target.value)} placeholder={session.interviewType === 'hr' ? 'Describe your situation, what you did, the outcome, and what you learned.' : 'Explain your reasoning, give examples, and discuss trade-offs. If unsure, describe what you do know.'} className="w-full p-4 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed disabled:opacity-70" /><p className="text-right text-[11px] text-slate-500">{answer.length.toLocaleString()} / 12,000 characters</p><div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={reset} disabled={busy} className={secondary}>Leave Interview</button><button type="button" onClick={submit} disabled={busy || !answer.trim()} className={primary}>{busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating Answer...</> : <>Submit Answer <ArrowRight className="w-4 h-4" /></>}</button></div><p className="text-xs text-slate-500">Submitted answers are saved. Leaving discards any unsubmitted draft.</p></div> : <div className="space-y-5"><div className="space-y-2"><h3 className="text-xs font-bold uppercase text-slate-400">Your Submitted Answer</h3><p className="text-sm text-slate-300 whitespace-pre-wrap rounded-xl bg-slate-900/60 p-4">{answer}</p></div><Feedback evaluation={evaluation} type={session.interviewType} /><div className="flex justify-end"><button type="button" onClick={advance} className={primary}>{finalAnswerReady ? <>View Interview Results <Award className="w-4 h-4" /></> : <>Next Question <ChevronRight className="w-4 h-4" /></>}</button></div></div>}
        </div>
      )}
      {showReport && report && session && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5 text-center"><div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white mx-auto"><Award className="w-8 h-8" /></div><div><h2 className="text-2xl font-black text-white">Interview Results</h2><p className="text-sm text-slate-400 mt-2">{session.role} · {session.interviewType === 'hr' ? 'HR / Behavioral' : 'Technical'} · <span className="capitalize">{session.difficulty}</span></p></div><p className="text-6xl font-black text-emerald-400">{report.overallScore}<span className="text-xl text-slate-500"> / 100</span></p><p className="text-xs text-slate-400">Overall score: average of your {answered.length} evaluated answers.</p><Metrics type={session.interviewType} evaluation={{ technicalAccuracy: average('technicalAccuracy'), clarityCommunication: average('clarityCommunication'), depthAndCompleteness: average('depthAndCompleteness') }} /><p className="text-xs text-slate-500">Review the feedback and examples below to plan your next practice session.</p><div className="flex justify-center pt-2"><button type="button" onClick={reset} className={primary}><RotateCcw className="w-4 h-4" /> Back to Interview Setup</button></div></div>
          <div className="space-y-4"><h3 className="font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-400" /> Question-by-Question Review</h3>{answered.map((question, index) => <details key={question.questionIndex ?? index} open={index === 0} className="glass-panel rounded-2xl overflow-hidden"><summary className="p-5 cursor-pointer text-sm text-slate-200 font-semibold"><span className="text-indigo-400 mr-2">Q{(question.questionIndex ?? index) + 1}</span>{question.question}<span className="ml-2 text-emerald-400">{question.evaluation.score}/100</span></summary><div className="p-5 pt-0 space-y-4"><div className="space-y-2"><h4 className="text-xs font-bold uppercase text-slate-400">Your Answer</h4><p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300 bg-slate-900/60 p-4 rounded-xl">{question.studentAnswer}</p></div><Feedback evaluation={question.evaluation} type={session.interviewType} /></div></details>)}</div>
        </div>
      )}
      {!session && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-white flex items-center gap-2"><History className="w-5 h-5 text-slate-400" /> Your Interview History</h2><button type="button" onClick={fetchHistory} disabled={loadingHistory} className={secondary}>{loadingHistory ? 'Loading...' : 'Refresh'}</button></div>
          {historyError && <p role="alert" className="text-sm text-rose-300">{historyError}</p>}
          {loadingHistory && history.length === 0 ? <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading your interviews...</p> : history.length === 0 ? <p className="text-sm text-slate-500">Your saved interviews will appear here.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]"><th className="pb-3 pr-4">Role</th><th className="pb-3 pr-4">Round / Difficulty</th><th className="pb-3 pr-4">Questions</th><th className="pb-3 pr-4">Status / Score</th><th className="pb-3 pr-4">Date</th><th className="pb-3">Review</th></tr></thead><tbody className="divide-y divide-slate-800">{history.map(item => <tr key={item._id}><td className="py-3 pr-4 font-semibold text-slate-200">{item.role}</td><td className="py-3 pr-4 capitalize text-slate-400">{item.interviewType === 'hr' ? 'HR' : 'Technical'} / {item.difficulty}</td><td className="py-3 pr-4 text-slate-400">{item.totalQuestions}</td><td className="py-3 pr-4">{item.status === 'completed' ? <span className="font-bold text-emerald-400">{item.overallScore}/100</span> : <span className="text-amber-300">In progress</span>}</td><td className="py-3 pr-4 text-slate-500 whitespace-nowrap">{new Date(item.completedAt || item.createdAt).toLocaleDateString()}</td><td className="py-3"><button type="button" disabled={Boolean(openingId) || busy} onClick={() => openSession(item._id)} className={secondary}>{openingId === item._id ? 'Opening...' : item.status === 'completed' ? 'View Results' : 'Resume'}</button></td></tr>)}</tbody></table></div>}
        </div>
      )}
    </div>
  );
};
