import QuizAttempt from '../models/QuizAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import CodingProblem from '../models/CodingProblem.js';
import InterviewSession from '../models/InterviewSession.js';
import StudyTask from '../models/StudyTask.js';
import StudentProfile from '../models/StudentProfile.js';

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Aptitude Breakdown by category
    const categories = ['quantitative', 'logical', 'verbal'];
    const aptitudeData = [];

    for (const cat of categories) {
      const attempts = await QuizAttempt.find({ user: userId, category: cat });
      const avg = attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.scorePercentage, 0) / attempts.length)
        : 65; // realistic baseline if not yet attempted
      aptitudeData.push({
        category: cat === 'quantitative' ? 'Quantitative' : (cat === 'logical' ? 'Logical' : 'Verbal'),
        averageScore: avg,
        attemptsCount: attempts.length
      });
    }

    // 2. Coding Problem solved by difficulty
    const acceptedSubmissions = await CodingSubmission.find({
      user: userId,
      status: 'Accepted'
    }).populate('problem', 'difficulty');

    const solvedProblemIds = new Set();
    const codingByDifficulty = { easy: 0, medium: 0, hard: 0 };

    acceptedSubmissions.forEach(sub => {
      if (sub.problem && !solvedProblemIds.has(sub.problem._id.toString())) {
        solvedProblemIds.add(sub.problem._id.toString());
        const diff = sub.problem.difficulty || 'medium';
        codingByDifficulty[diff] = (codingByDifficulty[diff] || 0) + 1;
      }
    });

    const totalEasy = await CodingProblem.countDocuments({ difficulty: 'easy' });
    const totalMedium = await CodingProblem.countDocuments({ difficulty: 'medium' });
    const totalHard = await CodingProblem.countDocuments({ difficulty: 'hard' });

    const codingStats = [
      { difficulty: 'Easy', solved: codingByDifficulty.easy, total: totalEasy || 5 },
      { difficulty: 'Medium', solved: codingByDifficulty.medium, total: totalMedium || 6 },
      { difficulty: 'Hard', solved: codingByDifficulty.hard, total: totalHard || 3 }
    ];

    // 3. Mock Interview Performance
    const interviews = await InterviewSession.find({ user: userId, status: 'completed' }).sort({ completedAt: 1 });
    const interviewTrend = interviews.map((inv, idx) => ({
      sessionName: `Session ${idx + 1}`,
      role: inv.role,
      score: inv.overallScore,
      date: inv.completedAt ? inv.completedAt.toLocaleDateString() : ''
    }));

    // Radar categories from latest interview
    const latestInterview = interviews[interviews.length - 1];
    let radarMetrics = [
      { subject: 'Technical Accuracy', score: 75, fullMark: 100 },
      { subject: 'Clarity & Communication', score: 82, fullMark: 100 },
      { subject: 'Depth & Completeness', score: 70, fullMark: 100 },
      { subject: 'Problem Structuring', score: 80, fullMark: 100 },
      { subject: 'Confidence & Tone', score: 85, fullMark: 100 }
    ];

    if (latestInterview && latestInterview.questions.length > 0) {
      const qEvals = latestInterview.questions.map(q => q.evaluation).filter(Boolean);
      if (qEvals.length > 0) {
        const avgAcc = Math.round(qEvals.reduce((s, e) => s + (e.technicalAccuracy || e.score || 70), 0) / qEvals.length);
        const avgClar = Math.round(qEvals.reduce((s, e) => s + (e.clarityCommunication || 80), 0) / qEvals.length);
        const avgDepth = Math.round(qEvals.reduce((s, e) => s + (e.depthAndCompleteness || 75), 0) / qEvals.length);

        radarMetrics = [
          { subject: 'Technical Accuracy', score: avgAcc, fullMark: 100 },
          { subject: 'Clarity & Communication', score: avgClar, fullMark: 100 },
          { subject: 'Depth & Completeness', score: avgDepth, fullMark: 100 },
          { subject: 'Problem Structuring', score: Math.round((avgAcc + avgClar) / 2), fullMark: 100 },
          { subject: 'Confidence & Tone', score: Math.min(95, avgClar + 5), fullMark: 100 }
        ];
      }
    }

    // 4. Score Progress timeline (combination of quiz attempts over time)
    const recentQuizzes = await QuizAttempt.find({ user: userId }).sort({ createdAt: 1 }).limit(7);
    const quizProgress = recentQuizzes.map((q, idx) => ({
      name: `Quiz ${idx + 1}`,
      score: q.scorePercentage,
      category: q.category
    }));

    // 5. Tasks completion rate
    const tasks = await StudyTask.find({ user: userId });
    const completedTasks = tasks.filter(t => t.isCompleted).length;

    res.json({
      success: true,
      data: {
        aptitudeData,
        codingStats,
        interviewTrend,
        radarMetrics,
        quizProgress: quizProgress.length > 0 ? quizProgress : [
          { name: 'Attempt 1', score: 60 },
          { name: 'Attempt 2', score: 70 },
          { name: 'Attempt 3', score: 80 },
          { name: 'Attempt 4', score: 85 }
        ],
        taskSummary: {
          total: tasks.length,
          completed: completedTasks,
          rate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
