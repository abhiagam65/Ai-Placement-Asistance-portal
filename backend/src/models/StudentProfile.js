import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rollNumber: {
    type: String,
    trim: true,
    default: ''
  },
  college: {
    type: String,
    trim: true,
    default: 'Government College of Engineering & Technology'
  },
  branch: {
    type: String,
    trim: true,
    default: 'Computer Engineering'
  },
  graduationYear: {
    type: Number,
    default: 2026
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
    default: 8.2
  },
  activeBacklogs: {
    type: Number,
    default: 0
  },
  targetRole: {
    type: String,
    trim: true,
    default: 'Full Stack Software Engineer'
  },
  skills: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    default: 'Final year computer engineering student passionate about scalable web technologies, distributed architectures, and AI.'
  },
  github: {
    type: String,
    default: 'https://github.com'
  },
  linkedin: {
    type: String,
    default: 'https://linkedin.com'
  },
  portfolio: {
    type: String,
    default: ''
  },
  preparationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 72
  },
  stats: {
    quizzesAttempted: { type: Number, default: 0 },
    quizzesAverageScore: { type: Number, default: 0 },
    codingProblemsSolved: { type: Number, default: 0 },
    mockInterviewsCompleted: { type: Number, default: 0 },
    averageInterviewScore: { type: Number, default: 0 },
    applicationsSubmitted: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

export default mongoose.model('StudentProfile', studentProfileSchema);
