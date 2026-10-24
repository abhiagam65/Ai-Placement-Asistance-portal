import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema({
  questionIndex: Number,
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
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 5
  },
  overallScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  provider: {
    type: String,
    default: 'deterministic-engine'
  },
  completedAt: Date
}, {
  timestamps: true
});

export default mongoose.model('InterviewSession', interviewSessionSchema);
