import StudentProfile from '../models/StudentProfile.js';
import JobListing from '../models/JobListing.js';
import JobApplication from '../models/JobApplication.js';
import QuizAttempt from '../models/QuizAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import InterviewSession from '../models/InterviewSession.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import StudyTask from '../models/StudyTask.js';
import Announcement from '../models/Announcement.js';

export const getStudentDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch Profile
    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      profile = await StudentProfile.create({
        user: userId,
        branch: 'Computer Engineering',
        cgpa: 8.2,
        skills: ['JavaScript', 'React', 'Node.js', 'SQL']
      });
    }

    // 2. Fetch Latest Resume Analysis
    const latestResume = await ResumeAnalysis.findOne({ user: userId }).sort({ createdAt: -1 });

    // 3. Fetch Quiz Stats
    const quizAttempts = await QuizAttempt.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
    const totalQuizScore = quizAttempts.reduce((acc, q) => acc + q.scorePercentage, 0);
    const avgQuizScore = quizAttempts.length > 0 ? Math.round(totalQuizScore / quizAttempts.length) : 0;

    // 4. Fetch Coding Stats
    const codingSubmissions = await CodingSubmission.find({ user: userId }).populate('problem', 'title difficulty category');
    const acceptedSubmissions = codingSubmissions.filter(s => s.status === 'Accepted');
    const uniqueSolvedProblems = new Set(acceptedSubmissions.map(s => s.problem?._id?.toString())).size;

    // 5. Fetch Mock Interview Stats
    const interviews = await InterviewSession.find({ user: userId, status: 'completed' });
    const totalInterviewScore = interviews.reduce((acc, i) => acc + (i.overallScore || 0), 0);
    const avgInterviewScore = interviews.length > 0 ? Math.round(totalInterviewScore / interviews.length) : 0;

    // 6. Fetch Applications Stats
    const applications = await JobApplication.find({ user: userId }).populate({
      path: 'jobListing',
      populate: { path: 'company', select: 'name logo tier' }
    }).sort({ createdAt: -1 });

    // 7. Calculate dynamic overall preparation readiness score (0-100)
    // Weights:
    // Resume ATS Score: 20%
    // Aptitude Average: 25%
    // Coding Solved: 25% (normalized out of 15 target problems)
    // Mock Interview: 20%
    // Profile completeness & CGPA: 10%
    const resumeScore = latestResume?.scoring?.overallScore ?? 65;
    const codingScore = Math.min(100, Math.round((uniqueSolvedProblems / 12) * 100));
    const quizComponent = avgQuizScore > 0 ? avgQuizScore : 60;
    const interviewComponent = avgInterviewScore > 0 ? avgInterviewScore : 65;
    const academicComponent = Math.min(100, Math.round((profile.cgpa / 10) * 100));

    const readinessScore = Math.round(
      (resumeScore * 0.20) +
      (quizComponent * 0.25) +
      (codingScore * 0.25) +
      (interviewComponent * 0.20) +
      (academicComponent * 0.10)
    );

    // Update profile cache
    profile.preparationScore = readinessScore;
    profile.stats = {
      quizzesAttempted: quizAttempts.length,
      quizzesAverageScore: avgQuizScore,
      codingProblemsSolved: uniqueSolvedProblems,
      mockInterviewsCompleted: interviews.length,
      averageInterviewScore: avgInterviewScore,
      applicationsSubmitted: applications.length
    };
    await profile.save();

    // 8. Upcoming Placement Drives (next 30 days)
    const upcomingDrives = await JobListing.find({
      status: 'Active',
      deadline: { $gte: new Date() }
    })
      .populate('company', 'name logo tier location')
      .sort({ deadline: 1 })
      .limit(5);

    // 9. Recommended Tasks based on student's current gaps
    const studyTasks = await StudyTask.find({ user: userId, isCompleted: false }).sort({ dueDate: 1 }).limit(5);

    // 10. Recent Activity Feed
    const activities = [];
    if (latestResume) {
      activities.push({
        type: 'resume',
        title: 'Analyzed Resume',
        detail: `ATS Score: ${latestResume.scoring.overallScore}% (${latestResume.fileName})`,
        timestamp: latestResume.createdAt
      });
    }
    quizAttempts.slice(0, 2).forEach(q => {
      activities.push({
        type: 'quiz',
        title: `Completed ${q.category.toUpperCase()} Quiz`,
        detail: `Scored ${q.scorePercentage}% (${q.correctCount}/${q.totalQuestions} correct)`,
        timestamp: q.createdAt
      });
    });
    acceptedSubmissions.slice(0, 2).forEach(s => {
      activities.push({
        type: 'coding',
        title: `Solved Problem: ${s.problem?.title || 'DSA Problem'}`,
        detail: `Runtime: ${s.runtimeMs}ms (${s.language})`,
        timestamp: s.createdAt
      });
    });
    interviews.slice(0, 1).forEach(i => {
      activities.push({
        type: 'interview',
        title: `Completed ${i.role} Mock Interview`,
        detail: `Overall Score: ${i.overallScore}/100`,
        timestamp: i.completedAt || i.createdAt
      });
    });
    applications.slice(0, 2).forEach(a => {
      activities.push({
        type: 'job',
        title: `Applied to ${a.jobListing?.company?.name || 'Company'}`,
        detail: `Role: ${a.jobListing?.title || 'Software Engineer'} • Status: ${a.status}`,
        timestamp: a.createdAt
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 11. Campus Announcements
    const announcements = await Announcement.find().sort({ isPinned: -1, createdAt: -1 }).limit(4);

    res.json({
      success: true,
      data: {
        profile,
        readinessScore,
        scoreBreakdown: {
          resumeScore,
          quizScore: quizComponent,
          codingScore,
          interviewScore: interviewComponent,
          academicScore: academicComponent
        },
        quickStats: {
          quizzesAttempted: quizAttempts.length,
          avgQuizScore,
          codingSolved: uniqueSolvedProblems,
          interviewsCompleted: interviews.length,
          avgInterviewScore,
          activeApplications: applications.filter(a => !['Rejected', 'Selected'].includes(a.status)).length
        },
        upcomingDrives,
        recommendedTasks: studyTasks,
        recentActivity: activities.slice(0, 6),
        announcements
      }
    });
  } catch (error) {
    next(error);
  }
};
