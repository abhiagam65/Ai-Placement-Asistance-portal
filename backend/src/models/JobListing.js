import mongoose from 'mongoose';

const jobListingSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true
  },
  ctc: {
    type: String,
    required: true,
    default: '12 - 18 LPA'
  },
  stipend: {
    type: String,
    default: '₹50,000 / month'
  },
  location: {
    type: String,
    default: 'Bengaluru / Hybrid'
  },
  type: {
    type: String,
    enum: ['Full-time', 'Internship', 'Intern + FTE'],
    default: 'Intern + FTE'
  },
  eligibility: {
    minCgpa: { type: Number, default: 7.0 },
    allowedBranches: [{ type: String }],
    maxBacklogs: { type: Number, default: 0 }
  },
  requiredSkills: [{ type: String }],
  description: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  openings: {
    type: Number,
    default: 10
  },
  applyUrl: {
    type: String,
    default: 'https://careers.google.com'
  },
  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active'
  }
}, {
  timestamps: true
});

export default mongoose.model('JobListing', jobListingSchema);
