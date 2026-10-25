import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true, min: 0, max: 9, validate: Number.isInteger },
  question: { type: String, required: true },
  category: String,
  expectedFocusPoints: [String],
  studentAnswer: { type: String, default: '' },
  answeredAt: Date,
  evaluation: {
    score: { type: Number, min: 0, max: 100 },
    technicalAccuracy: { type: Number, min: 0, max: 100 },
    clarityCommunication: { type: Number, min: 0, max: 100 },
    depthAndCompleteness: { type: Number, min: 0, max: 100 },
    feedback: String,
    strengths: [String],
    areasForImprovement: [String],
    modelIdealAnswer: String
  }
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 120,
    default: 'Full Stack Engineer'
  },
  interviewType: {
    type: String,
    enum: ['technical', 'hr'],
    default: 'technical'
  },
  difficulty: {
    type: String,
    enum: ['entry', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  questions: [interviewQuestionSchema],
  currentQuestionIndex: {
    type: Number,
    min: 0,
    max: 9,
    validate: Number.isInteger,
    default: 0
  },
  totalQuestions: {
    type: Number,
    min: 1,
    max: 10,
    validate: Number.isInteger,
    default: 5
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  provider: {
    type: String,
    required: true
  },
  completedAt: Date
}, {
  timestamps: true,
  optimisticConcurrency: true
});

export default mongoose.model('InterviewSession', interviewSessionSchema);
