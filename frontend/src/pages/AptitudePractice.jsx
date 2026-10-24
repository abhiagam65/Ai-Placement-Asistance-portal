import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Brain,
  Calculator,
  Compass,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Award,
  History,
  Loader2
} from 'lucide-react';

export const AptitudePractice = () => {
  // Setup state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [questionLimit, setQuestionLimit] = useState(5);

  // Active quiz state
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results state
  const [quizResult, setQuizResult] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!quiz || quizResult || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          autoSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, quizResult, timeLeftSeconds]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, histRes] = await Promise.all([
        api.get('/aptitude/categories'),
        api.get('/aptitude/history')
      ]);

      if (catRes.success) setCategories(catRes.data);
      if (histRes.success) setHistory(histRes.data);
    } catch (err) {
      console.warn('Failed to load aptitude data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.get(`/aptitude/quiz?category=${selectedCategory}&difficulty=${selectedDifficulty}&limit=${questionLimit}`);
      if (res.success && res.data.questions.length > 0) {
        setQuiz(res.data);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setQuizResult(null);
        setTimeLeftSeconds(res.data.timeLimitMinutes * 60);
      } else {
        alert('No questions found for the selected category and difficulty.');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const autoSubmitQuiz = () => {
    handleQuizSubmit();
  };

  const handleQuizSubmit = async () => {
    if (!quiz) return;
    setIsSubmitting(true);

    try {
      const answersPayload = quiz.questions.map(q => ({
        questionId: q._id,
        selectedOptionIndex: selectedAnswers[q._id] !== undefined ? selectedAnswers[q._id] : -1
      }));

      const timeSpent = (quiz.timeLimitMinutes * 60) - timeLeftSeconds;

      const res = await api.post('/aptitude/submit', {
        category: quiz.category,
        difficulty: quiz.difficulty,
        timeSpentSeconds: Math.max(1, timeSpent),
        answers: answersPayload
      });

      if (res.success) {
        setQuizResult(res.data);
        if (res.data.scorePercentage >= 70) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        }
        api.get('/aptitude/history').then(h => {
          if (h.success) setHistory(h.data);
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const resetQuiz = () => {
    setQuiz(null);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading aptitude question bank...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 mb-2">
          <Brain className="w-3.5 h-3.5" />
          <span>Aptitude & Logical Mastery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Campus Aptitude Practice
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Master quantitative aptitude, logical reasoning, and verbal ability with timed quizzes and comprehensive explanations.
        </p>
      </div>

      {/* Screen 1: Quiz Configuration & Category Selection */}
      {!quiz && !quizResult && (
        <div className="space-y-6">
          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const Icon = cat.id === 'quantitative' ? Calculator : (cat.id === 'logical' ? Compass : BookOpen);
              const isSelected = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-6 rounded-3xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-600/10'
                      : 'glass-card border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-400">
                      {cat.questionCount} Questions
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">{cat.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</p>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Accuracy Rate:</span>
                    <span className="font-bold text-emerald-400">{cat.averageAccuracy}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Mock Test Option */}
          <div
            onClick={() => setSelectedCategory('all')}
            className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
              selectedCategory === 'all'
                ? 'bg-purple-600/15 border-purple-500'
                : 'glass-panel border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Brain className="w-5 h-5" />
              </span>
              <div>
                <span className="font-bold text-sm text-white">Mixed Campus Full Mock Quiz</span>
                <p className="text-xs text-slate-400">Randomized blend across Quantitative, Logical, and Verbal topics.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-400">Select All</span>
          </div>

          {/* Controls: Difficulty & Limit */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['all', 'easy', 'medium', 'hard'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDifficulty(d)}
                      className={`py-2 capitalize rounded-xl text-xs font-semibold border transition-all ${
                        selectedDifficulty === d
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Number of Questions
                </label>
                <div className="flex gap-3">
                  {[5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionLimit(count)}
                      className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        questionLimit === count
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {count} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Timer: {questionLimit * 2} minutes allotted (2 mins per question).
              </span>
              <button
                onClick={startQuiz}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing Quiz...
                  </>
                ) : (
                  <>
                    Start Timed Quiz <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Active Timed Quiz Engine */}
      {quiz && !quizResult && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 max-w-4xl mx-auto">
          {/* Top Bar: Progress & Live Countdown Timer */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span className="text-xs text-indigo-400 font-semibold block capitalize mt-0.5">
                Topic: {quiz.questions[currentQuestionIndex].topic}
              </span>
            </div>

            <div className={`px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 ${
              timeLeftSeconds < 120
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-cyan-400'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>
          </div>

          {/* Question Navigator Dots */}
          <div className="flex flex-wrap gap-2 pt-1">
            {quiz.questions.map((q, idx) => (
              <button
                key={q._id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  currentQuestionIndex === idx
                    ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white'
                    : selectedAnswers[q._id] !== undefined
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Current Question Text */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {quiz.questions[currentQuestionIndex].questionText}
            </h2>
          </div>

          {/* Radio Options List */}
          <div className="space-y-3">
            {quiz.questions[currentQuestionIndex].options.map((opt, optIdx) => {
              const currentQ = quiz.questions[currentQuestionIndex];
              const isSelected = selectedAnswers[currentQ._id] === optIdx;

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQ._id, optIdx)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                    isSelected
                      ? 'bg-indigo-500 border-indigo-400 text-white'
                      : 'border-slate-600 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-sm">{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation & Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex gap-3">
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleQuizSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finish & Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Instant Detailed Score & Step-by-Step Explanations */}
      {quizResult && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Result Banner Card */}
          <div className="glass-panel p-8 rounded-3xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/20">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Quiz Evaluation Complete!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Completed in {Math.floor(quizResult.timeSpentSeconds / 60)}m {quizResult.timeSpentSeconds % 60}s
              </p>
            </div>

            <div className="py-2">
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">
                {quizResult.scorePercentage}%
              </div>
              <p className="text-xs text-slate-300 font-semibold mt-1">
                {quizResult.correctCount} Correct of {quizResult.totalQuestions} Questions
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={resetQuiz}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Practice Another Quiz
              </button>
            </div>
          </div>

          {/* Detailed Question Review with Step-by-Step Explanations */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">Step-by-Step Question Explanations</h3>

            {quizResult.answers.map((ans, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border space-y-3 ${
                  ans.isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-bold ${ans.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ans.isCorrect ? '✓ Correct Answer' : '✗ Incorrect Answer'}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    Your choice: {ans.selectedOptionIndex >= 0 ? `Option ${String.fromCharCode(65 + ans.selectedOptionIndex)}` : 'Not answered'} • Correct: Option {String.fromCharCode(65 + ans.correctOptionIndex)}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-100">{ans.questionText}</p>

                {/* Mathematical Explanation */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-indigo-400 text-[11px] uppercase tracking-wider block">
                    Detailed Solution & Explanation:
                  </span>
                  <p className="leading-relaxed">{ans.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen 4: Past Quiz Attempts History */}
      {!quiz && history.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-white text-base">Past Quiz Attempts</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Difficulty</th>
                  <th className="pb-3">Questions</th>
                  <th className="pb-3">Correct</th>
                  <th className="pb-3">Accuracy</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {history.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-200 capitalize">{h.category}</td>
                    <td className="py-3 capitalize text-slate-400">{h.difficulty}</td>
                    <td className="py-3 text-slate-300">{h.totalQuestions}</td>
                    <td className="py-3 text-emerald-400 font-bold">{h.correctCount}</td>
                    <td className="py-3">
                      <span className={`font-bold ${h.scorePercentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {h.scorePercentage}%
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {Math.floor(h.timeSpentSeconds / 60)}m {h.timeSpentSeconds % 60}s
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(h.createdAt).toLocaleDateString()}
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
