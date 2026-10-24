import JobListing from '../models/JobListing.js';
import JobApplication from '../models/JobApplication.js';
import StudentProfile from '../models/StudentProfile.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';

export const getJobs = async (req, res, next) => {
  try {
    const { search, role, minCgpa, type } = req.query;

    const filter = { status: 'Active' };
    if (role && role !== 'all') {
      filter.role = { $regex: role, $options: 'i' };
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (minCgpa) {
      filter['eligibility.minCgpa'] = { $lte: Number(minCgpa) };
    }

    const jobs = await JobListing.find(filter)
      .populate('company', 'name logo tier location website industry')
      .sort({ deadline: 1 });

    // Fetch user applications to mark which jobs the student already applied to
    const userApplications = await JobApplication.find({ user: req.user._id }).select('jobListing status');
    const appliedMap = new Map(userApplications.map(a => [a.jobListing.toString(), a.status]));

    // Fetch student profile for eligibility checking
    const profile = await StudentProfile.findOne({ user: req.user._id });

    const enriched = jobs.map(job => {
      let isEligible = true;
      const reasons = [];

      if (profile) {
        if (job.eligibility.minCgpa && profile.cgpa < job.eligibility.minCgpa) {
          isEligible = false;
          reasons.push(`Minimum CGPA requirement is ${job.eligibility.minCgpa} (Yours: ${profile.cgpa})`);
        }
        if (job.eligibility.allowedBranches && job.eligibility.allowedBranches.length > 0) {
          const matchBranch = job.eligibility.allowedBranches.some(b => 
            b.toLowerCase().includes(profile.branch.toLowerCase()) || 
            profile.branch.toLowerCase().includes(b.toLowerCase()) ||
            b === 'All'
          );
          if (!matchBranch) {
            isEligible = false;
            reasons.push(`Branch ${profile.branch} is not eligible`);
          }
        }
        if (profile.activeBacklogs > (job.eligibility.maxBacklogs || 0)) {
          isEligible = false;
          reasons.push(`Maximum allowed backlogs is ${job.eligibility.maxBacklogs}`);
        }
      }

      return {
        _id: job._id,
        title: job.title,
        role: job.role,
        company: job.company,
        ctc: job.ctc,
        stipend: job.stipend,
        location: job.location,
        type: job.type,
        eligibility: job.eligibility,
        requiredSkills: job.requiredSkills,
        description: job.description,
        deadline: job.deadline,
        openings: job.openings,
        applyUrl: job.applyUrl || job.company?.website || 'https://careers.google.com',
        isApplied: appliedMap.has(job._id.toString()),
        applicationStatus: appliedMap.get(job._id.toString()) || null,
        isEligible,
        eligibilityReasons: reasons
      };
    });

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id).populate('company');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' });
    }

    const application = await JobApplication.findOne({ user: req.user._id, jobListing: job._id });
    const profile = await StudentProfile.findOne({ user: req.user._id });

    let isEligible = true;
    const reasons = [];
    if (profile) {
      if (job.eligibility.minCgpa && profile.cgpa < job.eligibility.minCgpa) {
        isEligible = false;
        reasons.push(`Required CGPA: ${job.eligibility.minCgpa} (Yours: ${profile.cgpa})`);
      }
      if (profile.activeBacklogs > (job.eligibility.maxBacklogs || 0)) {
        isEligible = false;
        reasons.push(`Active backlogs: ${profile.activeBacklogs} (Allowed: ${job.eligibility.maxBacklogs})`);
      }
    }

    res.json({
      success: true,
      data: {
        job,
        application,
        isEligible,
        eligibilityReasons: reasons
      }
    });
  } catch (error) {
    next(error);
  }
};

export const applyToJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const job = await JobListing.findById(id).populate('company');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' });
    }

    if (job.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This placement listing is closed.' });
    }

    if (new Date() > new Date(job.deadline)) {
      return res.status(400).json({ success: false, message: 'Application deadline has passed for this drive.' });
    }

    // Check if already applied
    const existing = await JobApplication.findOne({ user: req.user._id, jobListing: job._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already submitted an application for this drive.' });
    }

    // Check student profile & eligibility
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (profile && job.eligibility.minCgpa && profile.cgpa < job.eligibility.minCgpa) {
      return res.status(400).json({
        success: false,
        message: `Ineligible: Your CGPA (${profile.cgpa}) is lower than minimum requirement (${job.eligibility.minCgpa}).`
      });
    }

    // Find latest resume
    const latestResume = await ResumeAnalysis.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    const application = await JobApplication.create({
      user: req.user._id,
      jobListing: job._id,
      resumeUrl: latestResume ? latestResume.fileName : 'Uploaded Profile Resume',
      status: 'Applied',
      statusHistory: [{
        status: 'Applied',
        updatedAt: new Date(),
        notes: notes || 'Application registered by student.'
      }],
      notes: notes || ''
    });

    if (profile) {
      profile.stats.applicationsSubmitted = await JobApplication.countDocuments({ user: req.user._id });
      await profile.save();
    }

    res.status(201).json({
      success: true,
      message: `Successfully registered application to ${job.company.name} for the ${job.title} role!`,
      data: application,
      applyUrl: job.applyUrl || job.company?.website || 'https://careers.google.com'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await JobApplication.find({ user: req.user._id })
      .populate({
        path: 'jobListing',
        populate: { path: 'company', select: 'name logo tier location website industry' }
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
