import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  rawText: {
    type: String,
    required: true
  },
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
    overallScore: { type: Number, min: 0, max: 100 },
    atsReadabilityScore: { type: Number, min: 0, max: 100 },
    skillsDepthScore: { type: Number, min: 0, max: 100 },
    impactMetricsScore: { type: Number, min: 0, max: 100 },
    completenessScore: { type: Number, min: 0, max: 100 },
    scoringRationale: String
  },
  targetJobDescription: {
    type: String,
    default: ''
  },
  jdMatch: {
    hasTargetJd: { type: Boolean, default: false },
    matchPercentage: { type: Number, min: 0, max: 100 },
    matchingSkills: [String],
    missingSkills: [String],
    fitVerdict: String
  },
  actionableSuggestions: [String],
  disclaimer: {
    type: String,
    default: 'This analysis provides structural and keyword guidance based on modern recruitment heuristics. No automated tool can guarantee bypassing ATS or securing interview invitations.'
  },
  provider: {
    type: String,
    default: 'deterministic-engine'
  }
}, {
  timestamps: true
});

export default mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
