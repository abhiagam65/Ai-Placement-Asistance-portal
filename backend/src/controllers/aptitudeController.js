import QuizQuestion from '../models/QuizQuestion.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudentProfile from '../models/StudentProfile.js';

export const getAptitudeCategories = async (req, res, next) => {
  try {
    const categories = ['quantitative', 'logical', 'verbal'];
    const summary = [];

    for (const cat of categories) {
      const count = await QuizQuestion.countDocuments({ category: cat });
      const userAttempts = await QuizAttempt.find({ user: req.user._id, category: cat });
      const avgScore = userAttempts.length > 0
        ? Math.round(userAttempts.reduce((s, a) => s + a.scorePercentage, 0) / userAttempts.length)
        : 0;

      summary.push({
        id: cat,
        name: cat === 'quantitative' ? 'Quantitative Aptitude' : (cat === 'logical' ? 'Logical Reasoning' : 'Verbal Ability'),
        description: cat === 'quantitative'
          ? 'Arithmetic, algebra, percentages, speed-time-distance, work & time, data interpretation.'
          : (cat === 'logical'
            ? 'Number series, syllogisms, blood relations, seating arrangements, coding-decoding.'
            : 'Reading comprehension, sentence correction, synonyms, antonyms, vocabulary.'),
        questionCount: count,
        attemptsCount: userAttempts.length,
        averageAccuracy: avgScore
      });
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

export const getAptitudeQuiz = async (req, res, next) => {
  try {
    const { category, difficulty, limit = 5 } = req.query;

    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    const count = await QuizQuestion.countDocuments(filter);
    const take = Math.min(Number(limit) || 5, 20);

    // Random sampling using aggregate
    const questions = await QuizQuestion.aggregate([
      { $match: filter },
      { $sample: { size: take } },
      {
        $project: {
          _id: 1,
          category: 1,
          topic: 1,
          difficulty: 1,
          questionText: 1,
          options: 1
          // Notice: correctOptionIndex and explanation are deliberately omitted here
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalQuestions: questions.length,
        category: category || 'all',
        difficulty: difficulty || 'all',
        timeLimitMinutes: Math.max(5, questions.length * 2), // 2 mins per question
        questions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const submitAptitudeQuiz = async (req, res, next) => {
  try {
    const { category = 'all', difficulty = 'all', timeSpentSeconds = 0, answers = [] } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'No answers submitted.' });
    }

    const questionIds = answers.map(a => a.questionId);
    const dbQuestions = await QuizQuestion.find({ _id: { $in: questionIds } });
    const questionMap = new Map(dbQuestions.map(q => [q._id.toString(), q]));

    let correctCount = 0;
    const gradedAnswers = [];

    for (const ans of answers) {
      const q = questionMap.get(ans.questionId.toString());
      if (q) {
        const isCorrect = ans.selectedOptionIndex === q.correctOptionIndex;
        if (isCorrect) correctCount++;

        gradedAnswers.push({
          questionId: q._id,
          questionText: q.questionText,
          selectedOptionIndex: ans.selectedOptionIndex,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect,
          explanation: q.explanation
        });
      }
    }

    const totalQuestions = gradedAnswers.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      category,
      difficulty,
      totalQuestions,
      correctCount,
      scorePercentage,
      timeSpentSeconds,
      answers: gradedAnswers
    });

    // Update student profile stats
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (profile) {
      const allAttempts = await QuizAttempt.find({ user: req.user._id });
      const avgScore = Math.round(allAttempts.reduce((s, a) => s + a.scorePercentage, 0) / allAttempts.length);
      profile.stats.quizzesAttempted = allAttempts.length;
      profile.stats.quizzesAverageScore = avgScore;
      await profile.save();
    }

    res.status(201).json({
      success: true,
      message: 'Quiz submitted and graded successfully.',
      data: {
        attemptId: attempt._id,
        category,
        totalQuestions,
        correctCount,
        incorrectCount: totalQuestions - correctCount,
        scorePercentage,
        timeSpentSeconds,
        answers: gradedAnswers
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAptitudeHistory = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .select('category difficulty totalQuestions correctCount scorePercentage timeSpentSeconds createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    next(error);
  }
};
