import mongoose from 'mongoose';

const codingSubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingProblem',
    required: true,
    index: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp'],
    default: 'javascript'
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'],
    required: true
  },
  testCasesPassed: {
    type: Number,
    required: true
  },
  totalTestCases: {
    type: Number,
    required: true
  },
  runtimeMs: {
    type: Number,
    default: 45
  },
  memoryKb: {
    type: Number,
    default: 16400
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('CodingSubmission', codingSubmissionSchema);
