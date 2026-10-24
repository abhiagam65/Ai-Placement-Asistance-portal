import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: 'Information Technology'
  },
  website: {
    type: String,
    default: 'https://example.com'
  },
  tier: {
    type: String,
    enum: ['Tier 1 Product', 'Tier 2 Services', 'High-Growth Startup', 'FinTech / Core'],
    default: 'Tier 1 Product'
  },
  location: {
    type: String,
    default: 'Bengaluru / Hyderabad'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);
