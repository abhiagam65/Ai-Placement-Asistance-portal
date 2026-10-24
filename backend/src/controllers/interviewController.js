import InterviewSession from '../models/InterviewSession.js';
import StudentProfile from '../models/StudentProfile.js';
import { aiProxyService } from '../services/aiProxyService.js';

export const startInterview = async (req, res, next) => {
  try {
    const { role = 'Full Stack Engineer', interviewType = 'technical', difficulty = 'intermediate', totalQuestions = 5 } = req.body;

    // Fetch first question from AI
    const firstQ = await aiProxyService.generateInterviewQuestion(role, interviewType, difficulty, 0);

    const session = await InterviewSession.create({
      user: req.user._id,
      role,
      interviewType,
      difficulty,
      totalQuestions: Number(totalQuestions),
      currentQuestionIndex: 0,
      questions: [{
        questionIndex: 0,
        question: firstQ.question,
        category: firstQ.category,
        expectedFocusPoints: firstQ.expected_focus_points || []
      }],
      provider: firstQ.provider || 'deterministic-engine'
    });

    res.status(201).json({
      success: true,
      message: 'Interview session started.',
      sessionId: session._id,
      role: session.role,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      totalQuestions: session.totalQuestions,
      currentQuestionIndex: 0,
      currentQuestion: {
        index: 0,
        question: firstQ.question,
        category: firstQ.category,
        expectedFocusPoints: firstQ.expected_focus_points
      },
      provider: session.provider
    });
  } catch (error) {
    next(error);
  }
};

export const submitInterviewAnswer = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an answer.' });
    }

    const session = await InterviewSession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'This interview session has already been completed.' });
    }

    const currentIndex = session.currentQuestionIndex;
    const currentQ = session.questions[currentIndex];

    // Evaluate answer via AI Proxy
    const evaluation = await aiProxyService.evaluateAnswer(
      currentQ.question,
      answer,
      session.role,
      session.difficulty
    );

    // Update current question
    currentQ.studentAnswer = answer;
    currentQ.answeredAt = new Date();
    currentQ.evaluation = {
      score: evaluation.score,
      technicalAccuracy: evaluation.metrics?.technical_accuracy || evaluation.score,
      clarityCommunication: evaluation.metrics?.clarity_communication || 80,
      depthAndCompleteness: evaluation.metrics?.depth_and_completeness || 75,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths || [],
      areasForImprovement: evaluation.areas_for_improvement || [],
      modelIdealAnswer: evaluation.model_ideal_answer || ''
    };

    const isLastQuestion = currentIndex + 1 >= session.totalQuestions;

    if (isLastQuestion) {
      // Calculate overall score
      const totalScore = session.questions.reduce((sum, q) => sum + (q.evaluation?.score || 0), 0);
      session.overallScore = Math.round(totalScore / session.questions.length);
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();

      // Update student profile stats
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (profile) {
        const completedSessions = await InterviewSession.find({ user: req.user._id, status: 'completed' });
        const avgScore = Math.round(completedSessions.reduce((s, cs) => s + cs.overallScore, 0) / completedSessions.length);
        profile.stats.mockInterviewsCompleted = completedSessions.length;
        profile.stats.averageInterviewScore = avgScore;
        await profile.save();
      }

      return res.json({
        success: true,
        isCompleted: true,
        evaluation: currentQ.evaluation,
        overallScore: session.overallScore,
        session
      });
    } else {
      // Generate next question
      const nextIndex = currentIndex + 1;
      const nextQ = await aiProxyService.generateInterviewQuestion(
        session.role,
        session.interviewType,
        session.difficulty,
        nextIndex
      );

      session.questions.push({
        questionIndex: nextIndex,
        question: nextQ.question,
        category: nextQ.category,
        expectedFocusPoints: nextQ.expected_focus_points || []
      });
      session.currentQuestionIndex = nextIndex;
      await session.save();

      return res.json({
        success: true,
        isCompleted: false,
        evaluation: currentQ.evaluation,
        nextQuestion: {
          index: nextIndex,
          question: nextQ.question,
          category: nextQ.category,
          expectedFocusPoints: nextQ.expected_focus_points
        },
        currentQuestionIndex: nextIndex,
        totalQuestions: session.totalQuestions
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getInterviewHistory = async (req, res, next) => {
  try {
    const history = await InterviewSession.find({ user: req.user._id })
      .select('role interviewType difficulty overallScore status totalQuestions completedAt createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewSessionById = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.sessionId,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};
