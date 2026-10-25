import mongoose from 'mongoose';

const score = { type: Number, min: 0, max: 100, validate: Number.isInteger };
const reportText = { type: String, maxlength: 12000 };
const resumeAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: { type: String, required: true, maxlength: 255 },
  fileSize: { type: Number, required: true, min: 0, max: 5 * 1024 * 1024 },
  fileType: { type: String, enum: ['application/pdf', 'text/plain'] },
  rawText: { type: String, required: true, minlength: 50, maxlength: 30000, select: false },
  candidateSummary: {
    detectedTechnicalSkills: [String],
    detectedSoftSkills: [String],
    sectionsPresent: {
      education: Boolean,
      projects: Boolean,
      experience: Boolean,
      certifications: Boolean
    }
  },
  scoring: {
    overallScore: score,
    atsReadabilityScore: score,
    skillsDepthScore: score,
    impactMetricsScore: score,
    completenessScore: score,
    scoringRationale: reportText
  },
  targetJobDescription: { type: String, default: '', maxlength: 15000 },
  jdMatch: {
    hasTargetJd: { type: Boolean, default: false },
    matchPercentage: { ...score, default: null, validate: value => value == null || Number.isInteger(value) },
    matchingSkills: [String],
    missingSkills: [String],
    fitVerdict: reportText,
    recommendations: [reportText]
  },
  summary: reportText,
  strengths: [reportText],
  issues: [{
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    section: reportText,
    issue: reportText,
    suggestion: reportText,
    evidence: reportText,
    _id: false
  }],
  sectionFeedback: [{
    section: reportText,
    status: { type: String, enum: ['present', 'missing', 'needs_improvement'], required: true },
    feedback: reportText,
    _id: false
  }],
  bulletImprovements: [{
    original: reportText,
    improved: reportText,
    reason: reportText,
    _id: false
  }],
  actionableSuggestions: [reportText],
  disclaimer: reportText,
  provider: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
