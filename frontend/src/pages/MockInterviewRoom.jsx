import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Loader2,
  History,
  RotateCcw,
  Award,
  BookOpen,
  Volume2
} from 'lucide-react';

export const MockInterviewRoom = () => {
  // Session setup state
  const [role, setRole] = useState('Full Stack Software Engineer');
  const [interviewType, setInterviewType] = useState('technical');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [totalQuestions, setTotalQuestions] = useState(3);

  // Active session state
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  // Speech-to-text state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    // Check speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/interview/history');
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch interview history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startSession = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/interview/start', {
        role,
        interviewType,
        difficulty,
        totalQuestions
      });

      if (res.success) {
        setSession({
          _id: res.sessionId,
          role: res.role,
          interviewType: res.interviewType,
          difficulty: res.difficulty,
          totalQuestions: res.totalQuestions,
          provider: res.provider
        });
        setCurrentQuestion(res.currentQuestion);
        setAnswer('');
        setEvaluation(null);
        setIsCompleted(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to start interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!speechSupported) {
      alert('Speech-to-text is not supported in this browser. Please type your answer.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (!isListening) {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer || answer.trim().length < 5) {
      alert('Please provide a substantive answer before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/interview/${session._id}/answer`, { answer });
      if (res.success) {
        setEvaluation(res.evaluation);
        if (res.isCompleted) {
          setIsCompleted(true);
          setOverallScore(res.overallScore);
          fetchHistory();
        } else {
          // Prepared for next question
          setCurrentQuestion(res.nextQuestion);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to submit answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const advanceToNext = () => {
    setEvaluation(null);
    setAnswer('');
  };

  const resetToSetup = () => {
    setSession(null);
    setCurrentQuestion(null);
    setEvaluation(null);
    setIsCompleted(false);
    setAnswer('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive AI Mock Room</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            AI Technical & HR Mock Interview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate realistic placement interviews, receive turn-by-turn AI feedback, and benchmark your responses against ideal answers.
          </p>
        </div>
      </div>

      {/* Screen 1: Interview Setup (When no session active) */}
      {!session && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Customize Your Interview Scenario</h2>
            <p className="text-xs text-slate-400">Configure your target engineering domain, round type, and difficulty level.</p>
          </div>

          <div className="space-y-4">
            {/* Target Job Role */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Target Engineering Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  'Full Stack Software Engineer',
                  'Frontend Engineer',
                  'Backend Distributed Systems',
                  'Data Scientist / AI Engineer'
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                      role === r
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Round Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Interview Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterviewType('technical')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      interviewType === 'technical'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    Technical Round
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewType('hr')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      interviewType === 'hr'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    HR / Behavioral
                  </button>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['entry', 'intermediate', 'advanced'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2.5 px-2 capitalize rounded-xl text-xs font-semibold border transition-all ${
                        difficulty === d
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Questions */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Number of Interview Questions
              </label>
              <div className="flex gap-3">
                {[3, 5].map((qCount) => (
                  <button
                    key={qCount}
                    type="button"
                    onClick={() => setTotalQuestions(qCount)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      totalQuestions === qCount
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    {qCount} Questions Drill
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Session is evaluated using configurable LLM with resilient deterministic fallback.
            </span>
            <button
              onClick={startSession}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Preparing AI Questions...
                </>
              ) : (
                <>
                  Enter Mock Room <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Active Interview Question & Evaluation */}
      {session && !isCompleted && currentQuestion && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 max-w-4xl mx-auto">
          {/* Top Session Progress Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">{session.role}</span>
              <span className="text-slate-500">•</span>
              <span className="capitalize text-indigo-400 font-semibold">{session.interviewType}</span>
              <span className="text-slate-500">•</span>
              <span className="capitalize text-slate-400">{session.difficulty}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              Question {currentQuestion.index + 1} of {session.totalQuestions}
            </span>
          </div>

          {/* Question Display Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Interviewer Question
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              "{currentQuestion.question}"
            </h2>

            {currentQuestion.expectedFocusPoints && currentQuestion.expectedFocusPoints.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">Recommended focus points:</span>
                {currentQuestion.expectedFocusPoints.map((pt, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                    {pt}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* If question not yet evaluated: Answer Box */}
          {!evaluation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Your Response
                </label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" /> Stop Dictation
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-indigo-400" /> Speech to Text
                      </>
                    )}
                  </button>
                )}
              </div>

              <textarea
                rows={7}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your structured engineering answer here. State the core concept, explain how it works under the hood, and highlight trade-offs or examples..."
                className="w-full p-4 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={resetToSetup}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Cancel Interview
                </button>

                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={isSubmitting || !answer.trim()}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Evaluating with AI...
                    </>
                  ) : (
                    <>
                      Submit Answer <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* If question evaluated: Feedback Card */}
          {evaluation && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-300">
              <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI Response Evaluation
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-black text-white">{evaluation.score}</span>
                    <span className="text-xs text-slate-400"> / 100</span>
                  </div>
                </div>

                {/* Metric Scores */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Technical Depth</span>
                    <p className="font-bold text-emerald-400 mt-0.5">{evaluation.technicalAccuracy}%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Clarity</span>
                    <p className="font-bold text-cyan-400 mt-0.5">{evaluation.clarityCommunication}%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Completeness</span>
                    <p className="font-bold text-purple-400 mt-0.5">{evaluation.depthAndCompleteness}%</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {evaluation.feedback}
                </p>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <span className="font-bold text-emerald-400">Key Strengths:</span>
                    {evaluation.strengths?.map((s, i) => (
                      <p key={i} className="text-slate-300 text-[11px] flex items-start gap-1.5">
                        <span className="text-emerald-400">✓</span> {s}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-amber-400">Areas for Improvement:</span>
                    {evaluation.areasForImprovement?.map((a, i) => (
                      <p key={i} className="text-slate-300 text-[11px] flex items-start gap-1.5">
                        <span className="text-amber-400">↑</span> {a}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Model Ideal Answer */}
                {evaluation.modelIdealAnswer && (
                  <div className="pt-2 border-t border-indigo-500/20">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Model Ideal Answer
                    </span>
                    <p className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      "{evaluation.modelIdealAnswer}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={advanceToNext}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  Proceed to Next Question <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 3: Completed Interview Summary & Score */}
      {isCompleted && (
        <div className="glass-panel p-8 rounded-3xl space-y-6 max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-400">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Mock Interview Completed!</h2>
            <p className="text-xs text-slate-400">
              Your overall practice performance score for {session.role} ({session.interviewType})
            </p>
          </div>

          <div className="py-4">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">
              {overallScore}
              <span className="text-2xl text-slate-500"> / 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Score automatically recorded to your placement readiness index.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={resetToSetup}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start Another Interview
            </button>
          </div>
        </div>
      )}

      {/* Past Interview History Table */}
      {history.length > 0 && !session && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-white text-base">Past Mock Interview Sessions</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Round</th>
                  <th className="pb-3">Difficulty</th>
                  <th className="pb-3">Questions</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {history.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-200">{h.role}</td>
                    <td className="py-3 capitalize text-indigo-400">{h.interviewType}</td>
                    <td className="py-3 capitalize text-slate-400">{h.difficulty}</td>
                    <td className="py-3 text-slate-400">{h.totalQuestions} questions</td>
                    <td className="py-3">
                      <span className="font-bold text-emerald-400">{h.overallScore}/100</span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(h.completedAt || h.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
