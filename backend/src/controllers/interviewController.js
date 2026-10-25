import mongoose from 'mongoose';
import InterviewSession from '../models/InterviewSession.js';
import StudentProfile from '../models/StudentProfile.js';
import { interviewAIService } from '../services/interviewAIService.js';

const publicQuestion = question => ({
  index: question.questionIndex,
  question: question.question,
  category: question.category
});

// Rubrics and upcoming questions stay on the server.
const publicSession = session => {
  const data = typeof session.toObject === 'function' ? session.toObject() : session;
  return {
    _id: data._id,
    role: data.role,
    interviewType: data.interviewType,
    difficulty: data.difficulty,
    totalQuestions: data.totalQuestions,
    currentQuestionIndex: data.currentQuestionIndex,
    overallScore: data.overallScore,
    status: data.status,
    provider: data.provider,
    createdAt: data.createdAt,
    completedAt: data.completedAt,
    questions: data.questions
      .filter(question => data.status === 'completed' || question.answeredAt || question.questionIndex === data.currentQuestionIndex)
      .map(question => ({
        questionIndex: question.questionIndex,
        question: question.question,
        category: question.category,
        ...(question.answeredAt && {
          studentAnswer: question.studentAnswer,
          answeredAt: question.answeredAt,
          evaluation: question.evaluation
        })
      })),
    currentQuestion: data.status === 'in_progress' && data.questions[data.currentQuestionIndex]
      ? publicQuestion(data.questions[data.currentQuestionIndex])
      : null
  };
};

const handleInterviewError = (error, res, next) => {
  if (error.name === 'VersionError') {
    return res.status(409).json({ success: false, message: 'This question was already submitted. Reload the interview before continuing.' });
  }
  if (Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode <= 599) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.code && { code: error.code })
    });
  }
  return next(error);
};

export const startInterview = async (req, res, next) => {
  try {
    const { role, interviewType, difficulty, totalQuestions } = req.body || {};
    if (typeof role !== 'string' || role.trim().length < 3 || role.trim().length > 120) {
      return res.status(400).json({ success: false, message: 'Target engineering role must contain 3 to 120 characters.' });
    }
    if (!['technical', 'hr'].includes(interviewType)) {
      return res.status(400).json({ success: false, message: 'Interview type must be technical or hr.' });
    }
    if (!['entry', 'intermediate', 'advanced'].includes(difficulty)) {
      return res.status(400).json({ success: false, message: 'Difficulty must be entry, intermediate, or advanced.' });
    }
    if (!Number.isInteger(totalQuestions) || totalQuestions < 1 || totalQuestions > 10) {
      return res.status(400).json({ success: false, message: 'Number of interview questions must be an integer from 1 to 10.' });
    }

    const settings = { role: role.trim(), interviewType, difficulty, totalQuestions };
    const generated = await interviewAIService.generateQuestions(settings);
    const session = await InterviewSession.create({
      user: req.user._id,
      ...settings,
      currentQuestionIndex: 0,
      questions: generated.questions.map((question, questionIndex) => ({ ...question, questionIndex })),
      provider: generated.provider
    });

    return res.status(201).json({
      success: true,
      message: 'Interview session started.',
      sessionId: session._id,
      ...settings,
      currentQuestionIndex: 0,
      currentQuestion: publicQuestion(session.questions[0]),
      provider: session.provider
    });
  } catch (error) {
    return handleInterviewError(error, res, next);
  }
};

export const submitInterviewAnswer = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { answer, questionIndex } = req.body || {};
    if (!mongoose.isObjectIdOrHexString(sessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid interview session ID.' });
    }
    if (typeof answer !== 'string' || answer.trim().length === 0 || answer.length > 12000) {
      return res.status(400).json({ success: false, message: 'Please provide an answer of 1 to 12,000 characters.' });
    }
    if (!Number.isInteger(questionIndex) || questionIndex < 0) {
      return res.status(400).json({ success: false, message: 'Please identify the question being answered.' });
    }

    const session = await InterviewSession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }
    if (session.status === 'completed') {
      return res.status(409).json({ success: false, message: 'This interview session has already been completed.' });
    }
    if (questionIndex !== session.currentQuestionIndex) {
      return res.status(409).json({ success: false, message: 'This question was already submitted or is not the current question. Reload the interview.' });
    }
    const currentQuestion = session.questions[questionIndex];
    const completePlan = session.provider?.startsWith('gemini:') && session.questions.length === session.totalQuestions;
    const earlierAnswersSaved = session.questions.slice(0, questionIndex).every(question => question.answeredAt && Number.isFinite(question.evaluation?.score));
    if (!completePlan || !currentQuestion || currentQuestion.answeredAt || !earlierAnswersSaved) {
      return res.status(409).json({ success: false, message: 'This older interview cannot be continued. Start a new AI interview.' });
    }

    // Provider failures leave persisted answers and progress untouched for a retry.
    const evaluation = await interviewAIService.evaluateAnswer({
      question: currentQuestion.question,
      expectedFocusPoints: currentQuestion.expectedFocusPoints,
      answer: answer.trim(),
      role: session.role,
      interviewType: session.interviewType,
      difficulty: session.difficulty
    });
    currentQuestion.studentAnswer = answer.trim();
    currentQuestion.answeredAt = new Date();
    currentQuestion.evaluation = evaluation;

    const isCompleted = questionIndex + 1 === session.totalQuestions;
    if (isCompleted) {
      session.overallScore = Math.round(session.questions.reduce((sum, question) => sum + question.evaluation.score, 0) / session.totalQuestions);
      session.status = 'completed';
      session.completedAt = new Date();
    } else {
      session.currentQuestionIndex = questionIndex + 1;
    }
    // Optimistic concurrency permits only one submission to advance a question.
    await session.save();

    if (isCompleted) {
      try {
        const profile = await StudentProfile.findOne({ user: req.user._id });
        if (profile) {
          const completedSessions = await InterviewSession.find({ user: req.user._id, status: 'completed' });
          profile.stats.mockInterviewsCompleted = completedSessions.length;
          profile.stats.averageInterviewScore = Math.round(completedSessions.reduce((sum, completed) => sum + completed.overallScore, 0) / completedSessions.length);
          await profile.save();
        }
      } catch {
        // Completed sessions remain the source of truth for analytics and history.
        console.warn('[Interview] Session completed, but profile statistics could not be refreshed.');
      }
    }

    return res.json({
      success: true,
      questionIndex,
      evaluation: currentQuestion.evaluation,
      isCompleted,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.totalQuestions,
      nextQuestion: isCompleted ? null : publicQuestion(session.questions[session.currentQuestionIndex]),
      ...(isCompleted && { overallScore: session.overallScore, session: publicSession(session) })
    });
  } catch (error) {
    return handleInterviewError(error, res, next);
  }
};

export const getInterviewHistory = async (req, res, next) => {
  try {
    const history = await InterviewSession.find({ user: req.user._id })
      .select('role interviewType difficulty overallScore status totalQuestions completedAt createdAt provider')
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: history });
  } catch (error) {
    return handleInterviewError(error, res, next);
  }
};

export const getInterviewSessionById = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.sessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid interview session ID.' });
    }
    const session = await InterviewSession.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }
    return res.json({ success: true, data: publicSession(session) });
  } catch (error) {
    return handleInterviewError(error, res, next);
  }
};
