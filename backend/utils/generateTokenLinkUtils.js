import crypto from 'crypto';
import VerificationToken from '../models/verificationTokenModel.js';
import PasswordResetToken from '../models/passwordResetTokenModel.js';

//Verifiy
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


//Reset password
export const generateResetToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  await PasswordResetToken.create({
    user: userId,
    token
  });

  return token;
};

export const createResetLink = (token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/reset-password?token=${token}`;
};

export const verifyResetToken = async (token) => {
  const resetToken = await PasswordResetToken.findOne({ token }).populate('user');
  if (!resetToken) {
    throw new Error('Invalid or expired reset token');
  }
  return resetToken;
};