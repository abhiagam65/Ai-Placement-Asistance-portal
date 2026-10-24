import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['quantitative', 'logical', 'verbal', 'all'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['all', 'easy', 'medium', 'hard'],
    default: 'all'
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctCount: {
    type: Number,
    required: true
  },
  scorePercentage: {
    type: Number,
    required: true
  },
  timeSpentSeconds: {
    type: Number,
    default: 0
  },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' },
    questionText: String,
    selectedOptionIndex: Number,
    correctOptionIndex: Number,
    isCorrect: Boolean,
    explanation: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('QuizAttempt', quizAttemptSchema);
