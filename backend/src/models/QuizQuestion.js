import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['quantitative', 'logical', 'verbal'],
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  explanation: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('QuizQuestion', quizQuestionSchema);
