import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import StudentProfile from '../models/StudentProfile.js';
import { codeExecutionService } from '../services/codeExecutionService.js';

export const getCodingProblems = async (req, res, next) => {
  try {
    const { difficulty, category, search } = req.query;

    const filter = {};
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const problems = await CodingProblem.find(filter)
      .select('title slug difficulty category examples')
      .sort({ difficulty: 1, title: 1 });

    // Find which problems the student has solved
    const userAccepted = await CodingSubmission.find({
      user: req.user._id,
      status: 'Accepted'
    }).select('problem');

    const solvedSet = new Set(userAccepted.map(s => s.problem.toString()));

    const enriched = problems.map(p => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      category: p.category,
      exampleCount: p.examples.length,
      isSolved: solvedSet.has(p._id.toString())
    }));

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const getCodingProblemBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const problem = await CodingProblem.findOne({ slug });

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found.' });
    }

    // Return only visible testcases for preview
    const visibleTestCases = problem.testCases
      .filter(tc => !tc.isHidden)
      .map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      }));

    // Find student's last submission for this problem if any
    const lastSubmission = await CodingSubmission.findOne({
      user: req.user._id,
      problem: problem._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        category: problem.category,
        description: problem.description,
        constraints: problem.constraints,
        examples: problem.examples,
        hints: problem.hints,
        starterCode: problem.starterCode,
        sampleTestCases: visibleTestCases,
        lastSubmission: lastSubmission ? {
          language: lastSubmission.language,
          code: lastSubmission.code,
          status: lastSubmission.status,
          runtimeMs: lastSubmission.runtimeMs,
          createdAt: lastSubmission.createdAt
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const runCodeSample = async (req, res, next) => {
  try {
    const { problemId, language = 'javascript', code } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Code cannot be empty.' });
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found.' });
    }

    // Run against only visible sample test cases
    const sampleCases = problem.testCases.filter(tc => !tc.isHidden);
    const execution = await codeExecutionService.execute(language, code, sampleCases);

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

export const submitCode = async (req, res, next) => {
  try {
    const { problemId, language = 'javascript', code } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Code cannot be empty.' });
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found.' });
    }

    // Run against all test cases (both visible and hidden)
    const execution = await codeExecutionService.execute(language, code, problem.testCases);

    // Save submission record
    const submission = await CodingSubmission.create({
      user: req.user._id,
      problem: problem._id,
      language,
      code,
      status: execution.status,
      testCasesPassed: execution.testCasesPassed,
      totalTestCases: execution.totalTestCases,
      runtimeMs: execution.runtimeMs,
      memoryKb: execution.memoryKb,
      errorMessage: execution.errorMessage
    });

    // If accepted, update student profile's solved count
    if (execution.status === 'Accepted') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (profile) {
        const acceptedSubmissions = await CodingSubmission.find({
          user: req.user._id,
          status: 'Accepted'
        });
        const uniqueSolved = new Set(acceptedSubmissions.map(s => s.problem.toString())).size;
        profile.stats.codingProblemsSolved = uniqueSolved;
        await profile.save();
      }
    }

    res.status(201).json({
      success: true,
      message: execution.status === 'Accepted' ? 'All test cases passed! Solution accepted.' : `Submission completed with status: ${execution.status}`,
      data: {
        submissionId: submission._id,
        status: execution.status,
        testCasesPassed: execution.testCasesPassed,
        totalTestCases: execution.totalTestCases,
        runtimeMs: execution.runtimeMs,
        memoryKb: execution.memoryKb,
        errorMessage: execution.errorMessage,
        results: execution.results
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCodingSubmissions = async (req, res, next) => {
  try {
    const submissions = await CodingSubmission.find({ user: req.user._id })
      .populate('problem', 'title slug difficulty category')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};
