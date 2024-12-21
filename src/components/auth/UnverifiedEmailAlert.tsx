import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSendVerificationEmailMutation } from '../../store/services/emailVerificationService';
import { toast } from 'react-hot-toast';

const UnverifiedEmailAlert = () => {
  const [sendVerificationEmail, { isLoading }] = useSendVerificationEmailMutation();

  const handleResend = async () => {
    try {
      await sendVerificationEmail().unwrap();
      toast.success('Verification email sent successfully!');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Please verify your email address. A verification link has been sent to your registered email.
          </p>
          <button
            onClick={handleResend}
            disabled={isLoading}
            className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-600 underline"
          >
            {isLoading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnverifiedEmailAlert;