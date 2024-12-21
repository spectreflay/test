import crypto from 'crypto';
import VerificationToken from '../models/verificationTokenModel.js';

export const generateVerificationToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  await VerificationToken.create({
    user: userId,
    token
  });

  return token;
};

export const createVerificationLink = (token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/verify-email?token=${token}`;
};