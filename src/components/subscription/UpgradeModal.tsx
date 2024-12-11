import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';

interface UpgradeModalProps {
  feature: string;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ feature, onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <Crown className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Upgrade Required</h2>
          <p className="mt-2 text-gray-600">
            You've reached the limit for {feature} in your current plan.
            Upgrade to unlock more features and higher limits.
          </p>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              navigate('/subscription');
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;