import mongoose from 'mongoose';

const verificationTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60 // Token expires after 24 hours
  }
});

const VerificationToken = mongoose.model('VerificationToken', verificationTokenSchema);
export default VerificationToken;