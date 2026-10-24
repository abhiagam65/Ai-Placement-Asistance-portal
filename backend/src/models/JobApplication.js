import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobListing',
    required: true,
    index: true
  },
  resumeUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Applied', 'Under Review', 'Shortlisted', 'OA Scheduled', 'Interview Scheduled', 'Selected', 'Rejected'],
    default: 'Applied',
    index: true
  },
  statusHistory: [{
    status: String,
    updatedAt: { type: Date, default: Date.now },
    notes: String
  }],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications from same student to same job
jobApplicationSchema.index({ user: 1, jobListing: 1 }, { unique: true });

export default mongoose.model('JobApplication', jobApplicationSchema);
