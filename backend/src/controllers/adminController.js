import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Company from '../models/Company.js';
import JobListing from '../models/JobListing.js';
import JobApplication from '../models/JobApplication.js';
import QuizQuestion from '../models/QuizQuestion.js';
import Announcement from '../models/Announcement.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCompanies = await Company.countDocuments();
    const activeJobs = await JobListing.countDocuments({ status: 'Active' });
    const totalApplications = await JobApplication.countDocuments();
    const totalQuestions = await QuizQuestion.countDocuments();

    // Applications status breakdown
    const statusCounts = await JobApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusMap = {};
    statusCounts.forEach(s => {
      statusMap[s._id] = s.count;
    });

    // Average student readiness score
    const studentProfiles = await StudentProfile.find().select('preparationScore cgpa');
    const avgScore = studentProfiles.length > 0
      ? Math.round(studentProfiles.reduce((acc, p) => acc + (p.preparationScore || 0), 0) / studentProfiles.length)
      : 0;

    const avgCgpa = studentProfiles.length > 0
      ? (studentProfiles.reduce((acc, p) => acc + (p.cgpa || 0), 0) / studentProfiles.length).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCompanies,
        activeJobs,
        totalApplications,
        totalQuestions,
        averageReadinessScore: avgScore,
        averageCgpa: Number(avgCgpa),
        applicationStats: {
          applied: statusMap['Applied'] || 0,
          shortlisted: (statusMap['Shortlisted'] || 0) + (statusMap['OA Scheduled'] || 0) + (statusMap['Interview Scheduled'] || 0),
          selected: statusMap['Selected'] || 0,
          rejected: statusMap['Rejected'] || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentsList = async (req, res, next) => {
  try {
    const { search, branch, minCgpa, page = 1, limit = 10 } = req.query;

    const query = {};
    if (branch && branch !== 'all') {
      query.branch = branch;
    }
    if (minCgpa) {
      query.cgpa = { $gte: Number(minCgpa) };
    }

    const profiles = await StudentProfile.find(query)
      .populate('user', 'name email avatar phone createdAt')
      .sort({ cgpa: -1 });

    // Filter by search name/email if provided
    let filtered = profiles;
    if (search) {
      const s = search.toLowerCase();
      filtered = profiles.filter(p => 
        (p.user?.name && p.user.name.toLowerCase().includes(s)) ||
        (p.user?.email && p.user.email.toLowerCase().includes(s)) ||
        (p.rollNumber && p.rollNumber.toLowerCase().includes(s))
      );
    }

    const total = filtered.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = filtered.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: paginated
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    const jobCounts = await JobListing.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 } } }
    ]);
    const map = new Map(jobCounts.map(j => [j._id.toString(), j.count]));

    const enriched = companies.map(c => ({
      ...c.toObject(),
      jobCount: map.get(c._id.toString()) || 0
    }));

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req, res, next) => {
  try {
    const { name, logo, industry, website, tier, location, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    const existing = await Company.findOne({ name });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Company already registered.' });
    }

    const company = await Company.create({
      name,
      logo: logo || '',
      industry: industry || 'Technology',
      website: website || 'https://example.com',
      tier: tier || 'Tier 1 Product',
      location: location || 'Bengaluru',
      description: description || ''
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully.',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminJobs = async (req, res, next) => {
  try {
    const jobs = await JobListing.find().populate('company').sort({ createdAt: -1 });
    const appCounts = await JobApplication.aggregate([
      { $group: { _id: '$jobListing', count: { $sum: 1 } } }
    ]);
    const map = new Map(appCounts.map(a => [a._id.toString(), a.count]));

    const enriched = jobs.map(j => ({
      ...j.toObject(),
      applicantsCount: map.get(j._id.toString()) || 0
    }));

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const { company, title, role, ctc, stipend, location, type, minCgpa, allowedBranches, maxBacklogs, requiredSkills, description, deadline, openings, applyUrl } = req.body;

    if (!company || !title || !role || !description || !deadline) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (company, title, role, description, deadline).' });
    }

    const comp = await Company.findById(company);

    const job = await JobListing.create({
      company,
      title,
      role,
      ctc: ctc || '10 - 15 LPA',
      stipend: stipend || '₹40,000 / month',
      location: location || 'Bengaluru / Hybrid',
      type: type || 'Intern + FTE',
      eligibility: {
        minCgpa: minCgpa ? Number(minCgpa) : 7.0,
        allowedBranches: Array.isArray(allowedBranches) ? allowedBranches : (allowedBranches ? allowedBranches.split(',').map(b => b.trim()) : ['Computer Engineering', 'Information Technology']),
        maxBacklogs: maxBacklogs !== undefined ? Number(maxBacklogs) : 0
      },
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : ['JavaScript', 'React', 'Node.js']),
      description,
      deadline: new Date(deadline),
      openings: openings ? Number(openings) : 10,
      applyUrl: applyUrl || comp?.website || 'https://careers.google.com'
    });

    // Automatically create announcement for this placement drive
    await Announcement.create({
      title: `Campus Placement Drive: ${comp?.name || 'Company'} Hiring for ${title}`,
      content: `Applications are open for ${title} (${role}). CTC: ${job.ctc}. Deadline: ${new Date(deadline).toLocaleDateString()}. Check eligibility and apply now.`,
      type: 'Placement Drive',
      companyName: comp?.name || '',
      createdBy: req.user._id,
      isPinned: true
    });

    res.status(201).json({
      success: true,
      message: 'Placement job listing created successfully.',
      data: job
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminApplications = async (req, res, next) => {
  try {
    const { jobId, status } = req.query;
    const filter = {};
    if (jobId && jobId !== 'all') filter.jobListing = jobId;
    if (status && status !== 'all') filter.status = status;

    const applications = await JobApplication.find(filter)
      .populate('user', 'name email phone avatar')
      .populate({
        path: 'jobListing',
        populate: { path: 'company', select: 'name logo tier' }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await JobApplication.findById(id).populate('user', 'name email');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    application.status = status;
    application.statusHistory.push({
      status,
      updatedAt: new Date(),
      notes: notes || `Status updated to ${status} by Administrator.`
    });
    if (notes) application.notes = notes;

    await application.save();

    res.json({
      success: true,
      message: `Application status updated to ${status}.`,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

export const addAptitudeQuestion = async (req, res, next) => {
  try {
    const { category, topic, difficulty = 'medium', questionText, options, correctOptionIndex, explanation } = req.body;

    if (!category || !topic || !questionText || !options || correctOptionIndex === undefined || !explanation) {
      return res.status(400).json({ success: false, message: 'All question fields are required.' });
    }

    const question = await QuizQuestion.create({
      category,
      topic,
      difficulty,
      questionText,
      options: Array.isArray(options) ? options : options.split('\n').filter(o => o.trim()),
      correctOptionIndex: Number(correctOptionIndex),
      explanation
    });

    res.status(201).json({
      success: true,
      message: 'Question added to question bank.',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    const list = await Announcement.find().sort({ isPinned: -1, createdAt: -1 });
    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, type = 'General', companyName, isPinned = false } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      type,
      companyName: companyName || '',
      isPinned: Boolean(isPinned),
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    res.json({
      success: true,
      message: 'Announcement deleted.'
    });
  } catch (error) {
    next(error);
  }
};
