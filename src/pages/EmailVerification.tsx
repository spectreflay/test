import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useVerifyEmailMutation } from '../store/services/authVerificationSerivce';
import { useSubscribeMutation } from '../store/services/subscriptionService';
import { useGetSubscriptionsQuery } from '../store/services/subscriptionService';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [subscribe] = useSubscribeMutation();
  const { data: subscriptions } = useGetSubscriptionsQuery();
  const { email, name, message } = location.state || {};
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || hasVerified) return;
      setHasVerified(true);
      try {
        await verifyEmail({ token }).unwrap();
        
        // Find and apply free tier subscription
        const freeTier = subscriptions?.find(sub => sub.name === 'free');
        if (freeTier) {
          await subscribe({
            subscriptionId: freeTier._id,
            paymentMethod: 'free',
            paymentDetails: {
              status: 'completed'
            }
          }).unwrap();
        }

        toast.success('Email verified successfully!');
        navigate('/login');
      } catch (error) {
        toast.error('Email verification failed');
      }
    };

    verifyToken();
  }, [token, verifyEmail, subscribe, subscriptions,hasVerified]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          {isLoading ? (
            <p className="mt-2 text-sm text-gray-600">
              Verifying your email...
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              {message || (token
                ? 'Something went wrong with the verification.'
                : 'Please verify your email address to continue.')}
            </p>
          )}
          {email && (
            <p className="mt-2 text-sm text-gray-500">
              Verification email sent to: <strong>{email}</strong>
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Login
          </button>
          <button
            onClick={() => navigate('/resend-verification')}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resend Verification Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;