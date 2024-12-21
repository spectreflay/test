import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import { useResendVerificationMutation } from '../store/services/emailVerificationService';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [resendVerification, { isLoading }] = useResendVerificationMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resendVerification({ email }).unwrap();
      toast.success('Verification email sent successfully!');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Resend Verification Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address to receive a new verification link
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Verification Email'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResendVerification;